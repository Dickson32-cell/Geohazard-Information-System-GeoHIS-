"""
Research Export Routes for GeoHIS

Provides endpoints for researchers to:
- Upload CSV data with coordinates
- Download analysis results as CSV
- Generate downloadable figures (PNG charts)
- Generate PDF reports with figures and tables
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for server
import matplotlib.pyplot as plt
import seaborn as sns
import io
import json
import csv
import uuid
from datetime import datetime

router = APIRouter()


# ============== Request/Response Models ==============

class AnalysisResult(BaseModel):
    """Single location analysis result"""
    latitude: float
    longitude: float
    name: Optional[str] = None
    flood_susceptibility: float
    flood_class: str
    landslide_susceptibility: float
    landslide_class: str
    combined_risk: str
    in_study_area: bool = True  # Now always True since study area is dynamic


class ExportRequest(BaseModel):
    """Request to export analysis results"""
    session_id: str
    results: List[AnalysisResult]
    summary: Dict[str, Any]
    format: str = Field(default="csv", description="Export format: csv, json")


class FigureRequest(BaseModel):
    """Request to generate figures from analysis results"""
    session_id: str
    results: List[AnalysisResult]
    figure_type: str = Field(default="risk_distribution", description="Type of figure to generate")


# ============== Helper Functions ==============

def classify_susceptibility(value: float) -> str:
    """Classify susceptibility value into risk category"""
    if value < 20:
        return "Very Low"
    elif value < 40:
        return "Low"
    elif value < 60:
        return "Moderate"
    elif value < 80:
        return "High"
    else:
        return "Very High"


def calculate_combined_risk(flood: float, landslide: float) -> str:
    """Calculate combined multi-hazard risk level"""
    max_risk = max(flood, landslide)
    if max_risk >= 80:
        return "Critical"
    elif max_risk >= 60:
        return "High"
    elif max_risk >= 40:
        return "Moderate"
    elif max_risk >= 20:
        return "Low"
    else:
        return "Very Low"


def calculate_flood_susceptibility(lat: float, lon: float) -> float:
    """
    Calculate flood susceptibility index for a location.
    
    Uses a generalized model based on:
    - Low elevation zones (near sea level or below ~200m typically have higher flood risk)
    - Proximity to major water bodies (approximated by longitude patterns)
    - Tropical/monsoon zones (approximated by latitude)
    
    This is a demonstration model - in production, integrate with actual DEM and hydrological data.
    """
    import random
    
    # Base susceptibility varies by latitude (tropical zones have more rainfall)
    # Higher flood susceptibility in tropical regions (±23.5 degrees)
    tropical_factor = max(0, 1 - abs(lat) / 23.5) * 30
    
    # Coastal areas (near 0 longitude or ±180) - simplified coastal proximity
    coastal_factor = max(0, 20 - min(abs(lon), abs(180 - abs(lon))) / 9 * 20)
    
    # Add some variability based on coordinate hash (simulates terrain variation)
    coord_hash = hash(f"{lat:.4f},{lon:.4f}") % 100
    terrain_factor = coord_hash / 100 * 30
    
    base_susceptibility = 25 + tropical_factor + coastal_factor + terrain_factor
    
    # Ensure within valid range
    return max(0, min(100, base_susceptibility))


def calculate_landslide_susceptibility(lat: float, lon: float) -> float:
    """
    Calculate landslide susceptibility index for a location.
    
    Uses a generalized model based on:
    - Mountainous regions (higher latitudes away from equator often have more terrain)
    - Tectonic activity zones (approximated by position)
    - Slope terrain (simulated)
    
    This is a demonstration model - in production, integrate with actual slope and geology data.
    """
    import random
    
    # Higher susceptibility in mountainous/hilly regions
    # Areas between 15-45 degrees latitude often have significant terrain
    mountain_factor = max(0, 1 - abs(abs(lat) - 30) / 30) * 25
    
    # Tectonic edge zones (Pacific Ring of Fire approximation)
    pacific_factor = 0
    if (lon > 100 or lon < -60) and abs(lat) < 60:
        pacific_factor = 15
    
    # Add variability based on coordinate hash (simulates local slope variation)
    coord_hash = hash(f"{lon:.4f},{lat:.4f}") % 100
    slope_factor = coord_hash / 100 * 35
    
    base_susceptibility = 15 + mountain_factor + pacific_factor + slope_factor
    
    # Ensure within valid range
    return max(0, min(100, base_susceptibility))


# ============== CSV Upload Endpoint ==============

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload CSV file with research coordinates for analysis.
    
    Required columns: latitude (or lat), longitude (or lon/lng)
    Optional columns: name, id, location
    
    Returns analysis results for each coordinate in the CSV.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format (.csv)")
    
    try:
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parse CSV using pandas
        df = pd.read_csv(io.StringIO(content_str))
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip()
        
        # Find latitude column
        lat_col = None
        for col in ['latitude', 'lat', 'y']:
            if col in df.columns:
                lat_col = col
                break
        
        if lat_col is None:
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain a latitude column (latitude, lat, or y)"
            )
        
        # Find longitude column
        lon_col = None
        for col in ['longitude', 'lon', 'lng', 'long', 'x']:
            if col in df.columns:
                lon_col = col
                break
        
        if lon_col is None:
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain a longitude column (longitude, lon, lng, or x)"
            )
        
        # Find name column (optional)
        name_col = None
        for col in ['name', 'location', 'site', 'id', 'point_name']:
            if col in df.columns:
                name_col = col
                break
        
        # Process each row
        results = []
        for idx, row in df.iterrows():
            lat = float(row[lat_col])
            lon = float(row[lon_col])
            name = str(row[name_col]) if name_col and pd.notna(row[name_col]) else f"Point {idx + 1}"
            
            # Validate coordinates
            if not (-90 <= lat <= 90):
                continue
            if not (-180 <= lon <= 180):
                continue
            
            flood_sus = calculate_flood_susceptibility(lat, lon)
            landslide_sus = calculate_landslide_susceptibility(lat, lon)
            
            results.append(AnalysisResult(
                latitude=lat,
                longitude=lon,
                name=name,
                flood_susceptibility=round(flood_sus, 2),
                flood_class=classify_susceptibility(flood_sus),
                landslide_susceptibility=round(landslide_sus, 2),
                landslide_class=classify_susceptibility(landslide_sus),
                combined_risk=calculate_combined_risk(flood_sus, landslide_sus),
                in_study_area=is_in_study_area(lat, lon)
            ))
        
        if len(results) == 0:
            raise HTTPException(status_code=400, detail="No valid coordinates found in CSV")
        
        # Calculate summary statistics
        in_area_count = sum(1 for r in results if r.in_study_area)
        avg_flood = sum(r.flood_susceptibility for r in results) / len(results)
        avg_landslide = sum(r.landslide_susceptibility for r in results) / len(results)
        high_risk_count = sum(1 for r in results if r.combined_risk in ["High", "Critical"])
        
        session_id = str(uuid.uuid4())
        
        return {
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "source_file": file.filename,
            "location_count": len(results),
            "results": [r.model_dump() for r in results],
            "summary": {
                "total_locations": len(results),
                "in_study_area": in_area_count,
                "outside_study_area": len(results) - in_area_count,
                "average_flood_susceptibility": round(avg_flood, 2),
                "average_landslide_susceptibility": round(avg_landslide, 2),
                "high_risk_locations": high_risk_count,
                "risk_distribution": {
                    "Critical": sum(1 for r in results if r.combined_risk == "Critical"),
                    "High": sum(1 for r in results if r.combined_risk == "High"),
                    "Moderate": sum(1 for r in results if r.combined_risk == "Moderate"),
                    "Low": sum(1 for r in results if r.combined_risk == "Low"),
                    "Very Low": sum(1 for r in results if r.combined_risk == "Very Low")
                }
            }
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


# ============== Export Results as CSV ==============

@router.post("/export/csv")
async def export_results_csv(request: ExportRequest):
    """
    Export analysis results as downloadable CSV file.
    
    Researchers can use this data directly in their papers.
    """
    try:
        # Create DataFrame from results
        data = []
        for r in request.results:
            data.append({
                "Location Name": r.name or "Unnamed",
                "Latitude": r.latitude,
                "Longitude": r.longitude,
                "Flood Susceptibility (%)": r.flood_susceptibility,
                "Flood Risk Class": r.flood_class,
                "Landslide Susceptibility (%)": r.landslide_susceptibility,
                "Landslide Risk Class": r.landslide_class,
                "Combined Risk Level": r.combined_risk,
                "Within Study Area": "Yes" if r.in_study_area else "No"
            })
        
        df = pd.DataFrame(data)
        
        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=geohis_results_{request.session_id[:8]}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating CSV: {str(e)}")


# ============== Generate Figures ==============

@router.post("/export/figure/risk-distribution")
async def generate_risk_distribution_figure(request: FigureRequest):
    """
    Generate a risk distribution bar chart from analysis results.
    
    Returns PNG image suitable for research papers.
    """
    try:
        # Count risk categories
        risk_counts = {
            "Critical": 0,
            "High": 0,
            "Moderate": 0,
            "Low": 0,
            "Very Low": 0
        }
        
        for r in request.results:
            if r.combined_risk in risk_counts:
                risk_counts[r.combined_risk] += 1
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
        
        categories = list(risk_counts.keys())
        counts = list(risk_counts.values())
        colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#6c757d']
        
        bars = ax.bar(categories, counts, color=colors, edgecolor='black', linewidth=1.2)
        
        # Add value labels on bars
        for bar, count in zip(bars, counts):
            if count > 0:
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                       str(count), ha='center', va='bottom', fontsize=12, fontweight='bold')
        
        ax.set_xlabel('Combined Risk Level', fontsize=12, fontweight='bold')
        ax.set_ylabel('Number of Locations', fontsize=12, fontweight='bold')
        ax.set_title('Distribution of Combined Geohazard Risk Levels', fontsize=14, fontweight='bold')
        
        # Style improvements
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.set_ylim(0, max(counts) * 1.2 if max(counts) > 0 else 10)
        
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        buf.seek(0)
        plt.close(fig)
        
        return StreamingResponse(
            buf,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=risk_distribution_{request.session_id[:8]}.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating figure: {str(e)}")


@router.post("/export/figure/susceptibility-comparison")
async def generate_susceptibility_comparison_figure(request: FigureRequest):
    """
    Generate a flood vs landslide susceptibility comparison scatter plot.
    
    Returns PNG image suitable for research papers.
    """
    try:
        # Extract data
        flood_values = [r.flood_susceptibility for r in request.results]
        landslide_values = [r.landslide_susceptibility for r in request.results]
        risk_levels = [r.combined_risk for r in request.results]
        
        # Color mapping
        color_map = {
            "Critical": '#dc3545',
            "High": '#fd7e14',
            "Moderate": '#ffc107',
            "Low": '#28a745',
            "Very Low": '#6c757d'
        }
        colors = [color_map.get(r, '#6c757d') for r in risk_levels]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 8), dpi=150)
        
        scatter = ax.scatter(flood_values, landslide_values, c=colors, 
                            s=100, alpha=0.7, edgecolors='black', linewidth=0.5)
        
        # Add diagonal reference line
        ax.plot([0, 100], [0, 100], 'k--', alpha=0.3, label='Equal susceptibility')
        
        ax.set_xlabel('Flood Susceptibility (%)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Landslide Susceptibility (%)', fontsize=12, fontweight='bold')
        ax.set_title('Flood vs Landslide Susceptibility Comparison', fontsize=14, fontweight='bold')
        
        ax.set_xlim(0, 100)
        ax.set_ylim(0, 100)
        ax.set_aspect('equal')
        
        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [Patch(facecolor=c, edgecolor='black', label=l) 
                         for l, c in color_map.items()]
        ax.legend(handles=legend_elements, title='Combined Risk', loc='upper left')
        
        ax.grid(True, alpha=0.3)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        buf.seek(0)
        plt.close(fig)
        
        return StreamingResponse(
            buf,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=susceptibility_comparison_{request.session_id[:8]}.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating figure: {str(e)}")


@router.post("/export/figure/susceptibility-boxplot")
async def generate_susceptibility_boxplot(request: FigureRequest):
    """
    Generate boxplot showing susceptibility distribution.
    
    Returns PNG image suitable for research papers.
    """
    try:
        flood_values = [r.flood_susceptibility for r in request.results]
        landslide_values = [r.landslide_susceptibility for r in request.results]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
        
        data = [flood_values, landslide_values]
        bp = ax.boxplot(data, labels=['Flood', 'Landslide'], patch_artist=True)
        
        # Color the boxes
        colors = ['#3498db', '#e74c3c']
        for patch, color in zip(bp['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        ax.set_ylabel('Susceptibility Index (%)', fontsize=12, fontweight='bold')
        ax.set_title('Distribution of Susceptibility Values', fontsize=14, fontweight='bold')
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.set_ylim(0, 100)
        ax.grid(True, axis='y', alpha=0.3)
        
        # Add statistics annotation
        flood_mean = np.mean(flood_values) if flood_values else 0
        landslide_mean = np.mean(landslide_values) if landslide_values else 0
        
        stats_text = f"Flood: μ={flood_mean:.1f}%\nLandslide: μ={landslide_mean:.1f}%"
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=10,
               verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        buf.seek(0)
        plt.close(fig)
        
        return StreamingResponse(
            buf,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=susceptibility_boxplot_{request.session_id[:8]}.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating figure: {str(e)}")


# ============== Generate Summary Table ==============

@router.post("/export/table/summary")
async def generate_summary_table(request: ExportRequest):
    """
    Generate a formatted summary statistics table as CSV.
    
    Includes descriptive statistics suitable for research papers.
    """
    try:
        results = request.results
        
        flood_values = [r.flood_susceptibility for r in results]
        landslide_values = [r.landslide_susceptibility for r in results]
        
        # Calculate statistics
        stats_data = {
            "Statistic": ["Count", "Mean", "Std Dev", "Min", "25th Percentile", 
                         "Median", "75th Percentile", "Max"],
            "Flood Susceptibility (%)": [
                len(flood_values),
                round(np.mean(flood_values), 2),
                round(np.std(flood_values), 2),
                round(np.min(flood_values), 2),
                round(np.percentile(flood_values, 25), 2),
                round(np.median(flood_values), 2),
                round(np.percentile(flood_values, 75), 2),
                round(np.max(flood_values), 2)
            ],
            "Landslide Susceptibility (%)": [
                len(landslide_values),
                round(np.mean(landslide_values), 2),
                round(np.std(landslide_values), 2),
                round(np.min(landslide_values), 2),
                round(np.percentile(landslide_values, 25), 2),
                round(np.median(landslide_values), 2),
                round(np.percentile(landslide_values, 75), 2),
                round(np.max(landslide_values), 2)
            ]
        }
        
        df = pd.DataFrame(stats_data)
        
        # Create CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=summary_statistics_{request.session_id[:8]}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating table: {str(e)}")


@router.post("/export/table/risk-classification")
async def generate_risk_classification_table(request: ExportRequest):
    """
    Generate a risk classification frequency table as CSV.
    """
    try:
        results = request.results
        
        # Count by flood class
        flood_classes = {}
        landslide_classes = {}
        combined_classes = {}
        
        for r in results:
            flood_classes[r.flood_class] = flood_classes.get(r.flood_class, 0) + 1
            landslide_classes[r.landslide_class] = landslide_classes.get(r.landslide_class, 0) + 1
            combined_classes[r.combined_risk] = combined_classes.get(r.combined_risk, 0) + 1
        
        # Order by risk level
        risk_order = ["Very Low", "Low", "Moderate", "High", "Very High", "Critical"]
        
        rows = []
        for risk in risk_order:
            if risk in flood_classes or risk in landslide_classes or risk in combined_classes:
                flood_count = flood_classes.get(risk, 0)
                landslide_count = landslide_classes.get(risk, 0)
                combined_count = combined_classes.get(risk, 0)
                total = len(results)
                rows.append({
                    "Risk Class": risk,
                    "Flood Count": flood_count,
                    "Flood %": round(flood_count / total * 100, 1) if total > 0 else 0,
                    "Landslide Count": landslide_count,
                    "Landslide %": round(landslide_count / total * 100, 1) if total > 0 else 0,
                    "Combined Count": combined_count,
                    "Combined %": round(combined_count / total * 100, 1) if total > 0 else 0
                })
        
        df = pd.DataFrame(rows)
        
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=risk_classification_{request.session_id[:8]}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating table: {str(e)}")
