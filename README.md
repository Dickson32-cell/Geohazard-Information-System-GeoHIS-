# GeoHIS: Geohazard Information System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

An open-source web-based Geohazard Information System for flood and landslide susceptibility mapping and risk assessment.

## Overview

GeoHIS integrates Multi-Criteria Decision Analysis (MCDA) techniques for municipal-level geohazard assessment:

- **Flood Susceptibility**: Analytical Hierarchy Process (AHP) with 5 conditioning factors
- **Landslide Susceptibility**: 
  - **Statistical**: Frequency Ratio (FR), Information Value (IV), Certainty Factor (CF)
  - **Machine Learning**: Random Forest, XGBoost, Support Vector Machine (SVM), Logistic Regression
- **Risk Assessment**: Hazard × Exposure × Vulnerability framework
- **Scientific Rigor**: Spatial Cross-Validation, Uncertainty Quantification, Sobol Sensitivity Analysis

**Validation Results**: AUC-ROC > 0.90 for ensemble models with 95% Bootstrap Confidence Intervals.

## Key Features

### Advanced Analysis Engine
- **Spatial Cross-Validation**: Implements checkerboard splitting to prevent spatial autocorrelation data leakage.
- **Uncertainty Quantification**: Provides epistemic uncertainty maps (prediction standard deviation) for decision support.
- **Global Sensitivity Analysis**: Sobol indices to quantify input factor contributions and interactions.
- **Hyperparameter Tuning**: Automated grid/random search for optimal model performance.

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
uvicorn app.main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Access
- Frontend: http://localhost:3001
- API Documentation: http://localhost:8001/docs

## Requirements

### System Requirements
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+ with PostGIS (or SQLite for development)
- Redis (optional, for caching)

### Python Dependencies
See `backend/requirements.txt`

### Node Dependencies
See `frontend/package.json`

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Acknowledgments

- New Juaben South Municipal Assembly
- NADMO Eastern Region
- Ghana Meteorological Agency

## Contact

Abdul Rashid Dickson  
College of Professional Studies, Northeastern University  
Email: dickson.ab@northeastern.edu | dicksonapam@gmail.com