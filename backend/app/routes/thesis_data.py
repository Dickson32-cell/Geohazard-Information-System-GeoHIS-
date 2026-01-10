"""
Thesis Data API endpoints
Serves the actual research data from the thesis for display in the application
"""

from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse
import json
import os
from pathlib import Path

router = APIRouter()

# Get the data directory path - navigate from backend/app/routes to geohis/data
CURRENT_FILE = Path(__file__).resolve()
# Go up: routes -> app -> backend -> geohis, then into data
DATA_DIR = CURRENT_FILE.parent.parent.parent.parent / 'data'


def load_json_file(filename):
    """Load a JSON file from the data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


@router.get("/thesis-data/analysis")
async def get_analysis_results():
    """Get the complete analysis results from the thesis"""
    data = load_json_file('analysis_results.json')
    if data:
        return data
    return JSONResponse(
        status_code=404,
        content={"error": "Analysis results not found"}
    )


@router.get("/thesis-data/summary")
async def get_thesis_summary():
    """Get a summary of key thesis findings for the dashboard"""
    data = load_json_file('analysis_results.json')
    if not data:
        return JSONResponse(status_code=404, content={"error": "Data not found"})
    
    return {
        "study_area": data["metadata"]["study_area"],
        "generated_at": data["metadata"]["generated_at"],
        "flood": {
            "method": data["susceptibility"]["flood"]["method"],
            "mean_susceptibility": round(data["susceptibility"]["flood"]["statistics"]["mean"], 1),
            "high_percentage": round(
                data["susceptibility"]["flood"]["statistics"]["class_distribution"]["High"]["percentage"] +
                data["susceptibility"]["flood"]["statistics"]["class_distribution"]["Very High"]["percentage"], 1
            ),
            "weights": data["ahp_analysis"]["flood"]["weights"],
            "consistency_ratio": round(data["ahp_analysis"]["flood"]["consistency_ratio"], 4)
        },
        "landslide": {
            "method": data["susceptibility"]["landslide"]["method"],
            "high_percentage": round(
                data["susceptibility"]["landslide"]["statistics"]["class_distribution"]["High"]["percentage"] +
                data["susceptibility"]["landslide"]["statistics"]["class_distribution"]["Very High"]["percentage"], 1
            ),
            "top_factors": {
                "slope_max_fr": data["susceptibility"]["landslide"]["statistics"]["fr_summary"]["factors"]["slope"]["max_fr"],
                "land_cover_max_fr": data["susceptibility"]["landslide"]["statistics"]["fr_summary"]["factors"]["land_cover"]["max_fr"],
                "geology_max_fr": data["susceptibility"]["landslide"]["statistics"]["fr_summary"]["factors"]["geology"]["max_fr"]
            }
        },
        "validation": {
            "auc_roc": data["validation"]["metrics"]["auc_roc"],
            "accuracy": data["validation"]["metrics"]["accuracy"],
            "recall": data["validation"]["metrics"]["recall"],
            "classification": data["validation"]["classification"],
            "sample_size": data["validation"]["sample_size"]
        },
        "risk_assessment": {
            "total_assets": data["risk_assessment"]["summary"]["total_assets_analyzed"],
            "risk_distribution": data["risk_assessment"]["summary"]["risk_distribution"]
        }
    }


@router.get("/thesis-data/hazard-events")
async def get_hazard_events():
    """Get historical hazard events GeoJSON"""
    data = load_json_file('historical_hazard_events.geojson')
    if data:
        return data
    return JSONResponse(status_code=404, content={"error": "Hazard events not found"})


@router.get("/thesis-data/infrastructure")
async def get_infrastructure():
    """Get infrastructure assets GeoJSON"""
    data = load_json_file('infrastructure_assets.geojson')
    if data:
        return data
    return JSONResponse(status_code=404, content={"error": "Infrastructure data not found"})


@router.get("/thesis-data/study-area")
async def get_study_area():
    """Get study area boundary GeoJSON"""
    data = load_json_file('study_area_boundary.geojson')
    if data:
        return data
    return JSONResponse(status_code=404, content={"error": "Study area boundary not found"})


@router.get("/thesis-data/ahp-weights")
async def get_ahp_weights():
    """Get AHP weights for flood susceptibility factors"""
    data = load_json_file('analysis_results.json')
    if data:
        return {
            "flood": {
                "weights": data["ahp_analysis"]["flood"]["weights"],
                "consistency_ratio": data["ahp_analysis"]["flood"]["consistency_ratio"],
                "is_consistent": data["ahp_analysis"]["flood"]["is_consistent"]
            },
            "landslide": {
                "weights": data["ahp_analysis"]["landslide"]["weights"],
                "consistency_ratio": data["ahp_analysis"]["landslide"]["consistency_ratio"],
                "is_consistent": data["ahp_analysis"]["landslide"]["is_consistent"]
            }
        }
    return JSONResponse(status_code=404, content={"error": "AHP weights not found"})


@router.get("/thesis-data/risk-assessment")
async def get_risk_assessment():
    """Get infrastructure risk assessment results"""
    data = load_json_file('analysis_results.json')
    if data:
        return data["risk_assessment"]
    return JSONResponse(status_code=404, content={"error": "Risk assessment not found"})
