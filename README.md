# GeoHIS: Geohazard Information System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

An open-source web-based Geohazard Information System for flood and landslide susceptibility mapping and risk assessment.

## Overview

GeoHIS integrates Multi-Criteria Decision Analysis (MCDA) techniques for municipal-level geohazard assessment:

- **Flood Susceptibility**: Analytical Hierarchy Process (AHP) with 5 conditioning factors
- **Landslide Susceptibility**: Frequency Ratio (FR) statistical method
- **Risk Assessment**: Hazard × Exposure × Vulnerability framework

**Validation Results**: AUC-ROC = 0.927 (Excellent), Accuracy = 81.3%, Recall = 92.9%

## Study Area

New Juaben South Municipality, Eastern Region, Ghana (110 km², population 183,000)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│            React.js + Leaflet.js + Bootstrap             │
├─────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                      │
│              FastAPI + Python Analysis                   │
├─────────────────────────────────────────────────────────┤
│                      DATA LAYER                          │
│              PostgreSQL/PostGIS + GeoJSON                │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Access
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## Project Structure

```
geohis/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── analysis/        # Spatial analysis modules
│   ├── tests/               # Unit tests
│   └── requirements.txt
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page layouts
│   │   └── services/        # API services
│   └── package.json
├── data/                    # Application data
│   ├── analysis_results.json
│   ├── hazard_events_real.json
│   ├── historical_hazard_events.geojson
│   ├── infrastructure_assets.geojson
│   └── study_area_boundary.geojson
└── docs/                    # Documentation
    └── USER_MANUAL.md
```

## Analysis Methods

### Flood Susceptibility (AHP)

| Factor | Weight | Rank |
|--------|--------|------|
| Elevation | 0.298 | 1 |
| Drainage Proximity | 0.298 | 1 |
| Slope | 0.158 | 3 |
| Soil Permeability | 0.158 | 3 |
| Land Use | 0.089 | 5 |

**Consistency Ratio**: 0.003 (< 0.10 threshold)

### Landslide Susceptibility (FR)

Frequency Ratio values calculated for:
- Slope (highest FR: 30-45° → 1.98)
- Geology (Birimian → 1.38)
- Land Cover (Bare Land → 2.20)
- Aspect
- Rainfall

## Data Availability

| Data Type | Access |
|-----------|--------|
| SRTM DEM, OSM, Sentinel-2 | Public |
| Validation dataset (n=1,000) | Included in `/data` |
| NADMO hazard records | On request |
| Municipal infrastructure | On request (data agreement) |

## Citation

If you use GeoHIS in your research, please cite:

```bibtex
@article{dickson2024geohis,
  title={Development of an Open-Source Web-Based Geohazard Information System 
         for Flood and Landslide Risk Assessment in New Juaben South Municipality, Ghana},
  author={Dickson, Abdul Rashid},
  journal={[Journal Name]},
  year={2024}
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- New Juaben South Municipal Assembly
- NADMO Eastern Region
- Ghana Meteorological Agency

## Contact

Abdul Rashid Dickson  
College of Professional Studies, Northeastern University  
Email: dickson.ab@northeastern.edu