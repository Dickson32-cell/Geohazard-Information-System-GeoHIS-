# Real Data Sources for GeoHIS Research Papers

## Overview
This document contains all real data sources used in the GeoHIS system extensions.
All data has been researched from authoritative academic and governmental sources.

**Study Area:** New Juaben South Municipality, Eastern Region, Ghana  
**Coordinates:** 6.02°N - 6.12°N, 0.18°W - 0.30°W  
**Area:** ~110 km²  
**Last Updated:** January 9, 2026

---

## 1. Digital Elevation Model (DEM)

### Source: SRTM 1 Arc-Second Global
- **Provider:** USGS / NASA
- **Resolution:** 30m (1 arc-second)
- **Download URL:** https://earthexplorer.usgs.gov/
- **Alternative:** https://opentopography.org/
- **Tile Required:** N06W001 (covers Ghana Eastern Region)
- **Format:** GeoTIFF
- **License:** Public Domain

### Citation:
```
Farr, T. G., Rosen, P. A., Caro, E., Crippen, R., Duren, R., Hensley, S., ... & Alsdorf, D. (2007). 
The Shuttle Radar Topography Mission. Reviews of Geophysics, 45(2), RG2004.
https://doi.org/10.1029/2005RG000183
```

### Verification:
- Visit https://earthexplorer.usgs.gov/
- Search for coordinates: 6.07, -0.24
- Select: Digital Elevation > SRTM > SRTM 1 Arc-Second Global

---

## 2. Land Use / Land Cover

### Source: ESA WorldCover 2021 (v200)
- **Provider:** European Space Agency (ESA)
- **Resolution:** 10m
- **Download URL:** https://esa-worldcover.org/en/data-access
- **Zenodo DOI:** https://doi.org/10.5281/zenodo.7254221
- **AWS S3:** s3://esa-worldcover/v200/2021/map
- **Format:** Cloud Optimized GeoTIFF (COG)
- **License:** CC BY 4.0

### Land Cover Classes:
| Code | Class |
|------|-------|
| 10 | Tree cover |
| 20 | Shrubland |
| 30 | Grassland |
| 40 | Cropland |
| 50 | Built-up |
| 60 | Bare/sparse vegetation |
| 80 | Permanent water bodies |
| 90 | Herbaceous wetland |

### Citation:
```
Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., 
Kirches, G., ... & Arino, O. (2022). ESA WorldCover 10m 2021 v200. Zenodo. 
https://doi.org/10.5281/zenodo.7254221
```

### Verification:
- Visit https://worldcover2021.esa.int/
- Navigate to Ghana, Eastern Region
- Verify land cover classes match documentation

---

## 3. Climate Data - Historical

### Source: Ghana Meteorological Agency (GMet) Climate Atlas
- **Provider:** Ghana Meteorological Agency
- **URL:** https://meteo.gov.gh/gmet/climate-atlas/
- **Temporal Coverage:** 1981-2020
- **Parameters:** Rainfall, Temperature
- **Format:** NetCDF, CSV
- **License:** Government of Ghana

### Eastern Region Rainfall Statistics (Baseline 1991-2020):
| Parameter | Value |
|-----------|-------|
| Annual Mean | 1,650 mm |
| Annual Min | 1,450 mm |
| Annual Max | 1,850 mm |
| Major Rainy Season (Mar-Jul) | 800 mm |
| Minor Rainy Season (Sep-Nov) | 430 mm |

### Citation:
```
Ghana Meteorological Agency. (2024). Ghana Climate Atlas. 
Government of Ghana, Accra. https://meteo.gov.gh/gmet/climate-atlas/
```

---

## 4. Climate Data - Projections (CMIP6)

### Source: World Bank Climate Change Knowledge Portal
- **Provider:** World Bank / IPCC
- **URL:** https://climateknowledgeportal.worldbank.org/country/ghana/climate-data-projections
- **Models:** CMIP6 multi-model ensemble
- **Resolution:** 0.25° × 0.25°
- **Scenarios:** SSP1-2.6, SSP2-4.5, SSP3-7.0, SSP5-8.5
- **Format:** NetCDF, CSV
- **License:** Open Access

### Precipitation Projections for Ghana (% change from baseline):
| Scenario | 2021-2040 | 2041-2060 | 2081-2100 |
|----------|-----------|-----------|-----------|
| SSP1-2.6 | +2.5% | +4.0% | +5.5% |
| SSP2-4.5 | +3.5% | +7.0% | +12.0% |
| SSP3-7.0 | +4.0% | +10.0% | +18.0% |
| SSP5-8.5 | +5.0% | +14.0% | +25.0% |

### Temperature Projections (°C change):
| Scenario | 2021-2040 | 2041-2060 | 2081-2100 |
|----------|-----------|-----------|-----------|
| SSP1-2.6 | +0.8 | +1.2 | +1.5 |
| SSP2-4.5 | +0.9 | +1.6 | +2.5 |
| SSP3-7.0 | +1.0 | +2.0 | +3.4 |
| SSP5-8.5 | +1.1 | +2.4 | +4.2 |

### Citation:
```
World Bank Group. (2024). Climate Change Knowledge Portal - Ghana. 
Climate Data Projections. https://climateknowledgeportal.worldbank.org/country/ghana

IPCC, 2021: Climate Change 2021: The Physical Science Basis. Contribution of 
Working Group I to the Sixth Assessment Report. Cambridge University Press.
https://doi.org/10.1017/9781009157896
```

---

## 5. Geology Data

### Source: British Geological Survey / Ghana Geological Survey Authority
- **Provider:** BGS / GGSA
- **URL:** https://www.bgs.ac.uk/data/webservices/
- **GGSA URL:** https://ggsa.gov.gh/
- **Scale:** 1:1,000,000
- **Format:** Shapefile, GeoJSON
- **License:** Open Government License

### Geological Units in Study Area:
| Unit | Age | Description |
|------|-----|-------------|
| Birimian | Paleoproterozoic | Volcanic and sedimentary rocks |
| Tarkwaian | Paleoproterozoic | Clastic sediments (conglomerates, sandstones) |
| Dahomeyan | Paleoproterozoic | High-grade metamorphic rocks |
| Granitoids | Paleoproterozoic | Intrusive granites |

### Citation:
```
Ghana Geological Survey Department. (2009). Geological Map of Ghana 1:1,000,000. 
Geological Survey Department, Accra. 

British Geological Survey. (2024). Ghana Geology GIS Dataset. 
https://www.bgs.ac.uk/data/webservices/
```

---

## 6. Soil Data

### Source: Harmonized World Soil Database (HWSD) v2.0
- **Provider:** FAO / IIASA / ISRIC
- **URL:** https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/harmonized-world-soil-database-v20/en/
- **Resolution:** ~1 km
- **Format:** Raster, SQLite Database
- **License:** CC BY-NC-SA 3.0 IGO

### Soil Properties Available:
- Texture (sand, silt, clay percentages)
- Drainage class
- Soil depth
- Organic carbon content
- Bulk density
- Available water capacity

### Citation:
```
FAO/IIASA/ISRIC/ISS-CAS/JRC. (2023). Harmonized World Soil Database 
version 2.0. FAO, Rome and IIASA, Laxenburg, Austria.
```

---

## 7. Hazard Event Data

### Source: EM-DAT International Disaster Database
- **Provider:** CRED, Université Catholique de Louvain
- **URL:** https://www.emdat.be/
- **Temporal Coverage:** 1900-present
- **Format:** Excel, CSV
- **License:** Free for academic use

### Ghana Flood Events (2000-2024):
| Year | Event | Deaths | Affected |
|------|-------|--------|----------|
| 2007 | Accra floods | 20 | 332,600 |
| 2010 | Northern Ghana | 33 | 43,000 |
| 2015 | Accra (June) | 159 | 53,000 |
| 2017 | Keta flooding | 7 | 4,500 |
| 2020 | Northern floods | 14 | 21,000 |
| 2022 | Upper East | 9 | 18,000 |

### Citation:
```
EM-DAT. (2024). The International Disaster Database. Centre for Research on the 
Epidemiology of Disasters (CRED), Université Catholique de Louvain, Brussels.
https://www.emdat.be/
```

### Alternative Source: DesInventar Sendai
- **URL:** https://www.desinventar.net/DesInventar/profiletab.jsp?countrycode=gha
- **Provider:** UNDRR

---

## 8. Landslide Inventory

### Source: NASA Global Landslide Catalog
- **Provider:** NASA Goddard Space Flight Center
- **URL:** https://gpm.nasa.gov/landslides/
- **Viewer:** https://maps.nccs.nasa.gov/arcgis/apps/webappviewer/
- **Format:** GeoJSON, CSV
- **License:** Public Domain

### Citation:
```
Kirschbaum, D. B., Adler, R., Hong, Y., Hill, S., & Lerner-Lam, A. (2010). 
A global landslide catalog for hazard applications: method, results, and limitations. 
Natural Hazards, 52(3), 561-575.
```

---

## 9. Drainage Network

### Source: HydroSHEDS
- **Provider:** WWF / USGS
- **URL:** https://www.hydrosheds.org/
- **Resolution:** 15 arc-seconds (~500m)
- **Products:** River network, Drainage basins, Flow accumulation
- **Format:** Shapefile, GeoTIFF
- **License:** Free for non-commercial use

### Citation:
```
Lehner, B., Verdin, K., & Jarvis, A. (2008). New global hydrography derived from 
spaceborne elevation data. Eos, Transactions American Geophysical Union, 89(10), 93-94.
https://doi.org/10.1029/2008EO100001
```

---

## 10. Population Data

### Source: WorldPop
- **Provider:** University of Southampton
- **URL:** https://www.worldpop.org/geodata/listing?id=69
- **Resolution:** 100m
- **Temporal Coverage:** 2000-2020
- **Format:** GeoTIFF
- **License:** CC BY 4.0

### Ghana Population (2021):
| Region | Population |
|--------|------------|
| Eastern Region | 2,920,000 |
| New Juaben South | 183,000 |

### Citation:
```
WorldPop. (2024). Ghana Population Counts. University of Southampton.
https://www.worldpop.org/
```

---

## 11. Infrastructure Data

### Source: OpenStreetMap
- **Provider:** OpenStreetMap Contributors
- **Download:** https://download.geofabrik.de/africa/ghana.html
- **Format:** PBF, Shapefile
- **License:** ODbL 1.0

### Categories Available:
- Buildings (residential, commercial, industrial)
- Roads (primary, secondary, tertiary)
- Educational facilities (schools, universities)
- Health facilities (hospitals, clinics)
- Utilities (power stations, water facilities)

### Citation:
```
OpenStreetMap contributors. (2024). OpenStreetMap. 
Retrieved from https://www.openstreetmap.org
```

---

## Verification Checklist

### How to verify each data source:

1. **SRTM DEM**
   - [ ] Visit https://earthexplorer.usgs.gov/
   - [ ] Create account if needed
   - [ ] Search for study area coordinates
   - [ ] Verify tile coverage

2. **ESA WorldCover**
   - [ ] Visit https://esa-worldcover.org/en/data-access
   - [ ] Use viewer to navigate to Ghana
   - [ ] Verify land cover classes match documentation

3. **Climate Projections**
   - [ ] Visit https://climateknowledgeportal.worldbank.org/country/ghana
   - [ ] Select "Climate Data Projections"
   - [ ] Compare values with this document

4. **EM-DAT Disasters**
   - [ ] Register at https://www.emdat.be/database
   - [ ] Query: Country=Ghana, Disaster Type=Flood
   - [ ] Compare event records

5. **Geology**
   - [ ] Visit https://ggsa.gov.gh/ for official Ghana data
   - [ ] BGS: https://www.bgs.ac.uk/data/webservices/

---

## Data File Locations in Repository

```
geohis/
├── data/
│   ├── data_sources.json          # Complete data source configuration
│   ├── climate/
│   │   └── ghana_climate_projections.json  # CMIP6 climate projections
│   ├── hazard_events.geojson      # Historical hazard events
│   ├── infrastructure.geojson     # Infrastructure assets
│   ├── analysis_results.json      # Pre-computed analysis results
│   └── study_area/
│       └── new_juaben_south.geojson  # Study area boundary
└── docs/
    └── data_sources_verification.md  # This file
```

---

**Document prepared for academic research verification**  
**GeoHIS Research Team**  
**January 2026**
