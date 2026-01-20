# GeoHIS User Manual

## Geohazard Information System for New Juaben South Municipality

**Version 1.0.0**  
**Last Updated: January 2026**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Analyzing Your Location](#4-analyzing-your-location)
5. [Viewing Hazard Maps](#5-viewing-hazard-maps)
6. [Understanding Risk Levels](#6-understanding-risk-levels)
7. [Infrastructure Risk Assessment](#7-infrastructure-risk-assessment)
8. [Frequently Asked Questions](#8-frequently-asked-questions)
9. [Technical Support](#9-technical-support)

---

## 1. Introduction

### What is GeoHIS?

GeoHIS (Geohazard Information System) is a web-based platform designed to help municipal planners, emergency managers, and residents understand flood and landslide risks in New Juaben South Municipality, Ghana.

### Key Features

| Feature | Description |
|---------|-------------|
| **Flood Susceptibility Mapping** | View areas prone to flooding based on terrain, drainage, and land use |
| **Landslide Susceptibility Mapping** | View areas prone to landslides based on slope, geology, and land cover |
| **Location Analysis** | Check the risk level at any specific coordinate |
| **Infrastructure Risk Assessment** | View risk scores for critical public infrastructure |

### Study Area

- **Location**: New Juaben South Municipality, Eastern Region, Ghana
- **Area**: 110 km²
- **Coordinates**: Latitude 6.02° to 6.12° N, Longitude -0.30° to -0.18° E
- **Main Town**: Koforidua

---

## 2. Getting Started

### Accessing GeoHIS

Open your web browser and navigate to:

```
http://localhost:3001
```

> **Note**: For production deployment, the URL will be provided by your system administrator.

### Browser Requirements

GeoHIS works best with:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Navigation

The main navigation bar provides access to all system features:

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Overview of hazard statistics |
| **📍 Analyze Location** | Check risk at specific coordinates |
| **Hazard Events** | View historical hazard records |
| **Hazard Zones** | View susceptibility maps |
| **Infrastructure** | View infrastructure risk assessment |

---

## 3. Dashboard

The Dashboard provides an overview of hazard information for the municipality:

### Key Statistics Displayed

- Total area analyzed
- Percentage of area in high/very high flood susceptibility
- Percentage of area in high/very high landslide susceptibility
- Number of documented hazard events
- Number of infrastructure assets assessed

---

## 4. Analyzing Your Location

### How to Check Risk at a Specific Location

1. Click **"📍 Analyze Location"** in the navigation menu
2. You have two options:

#### Option A: Enter Coordinates Manually

1. Enter the **Latitude** (e.g., 6.07)
2. Enter the **Longitude** (e.g., -0.24)
3. Optionally add a **Location Name** (e.g., "My Property")
4. Click **"Analyze Location"**

#### Option B: Upload a GeoJSON File

1. Drag and drop a GeoJSON file into the upload area
2. Or click to browse and select a file
3. The system will analyze all Point features in the file

### Understanding Your Results

After analysis, you will see:

| Result | Description |
|--------|-------------|
| **Flood Susceptibility** | Percentage score (0-100%) and risk class |
| **Landslide Susceptibility** | Percentage score (0-100%) and risk class |
| **Combined Risk** | Overall hazard risk level |
| **In Study Area** | Whether your location is within the mapped area |

### Result Colors on Map

| Color | Combined Risk Level |
|-------|---------------------|
| 🔴 Red | Critical |
| 🟠 Orange | High |
| 🟡 Yellow | Moderate |
| 🟢 Green | Low |
| ⚫ Gray | Very Low |

---

## 5. Viewing Hazard Maps

### Flood Susceptibility Map

The flood susceptibility map shows areas prone to flooding based on:
- Elevation (low-lying areas are more susceptible)
- Proximity to drainage channels
- Slope (flat areas accumulate water)
- Soil permeability
- Land use/land cover

### Landslide Susceptibility Map

The landslide susceptibility map shows areas prone to slope failure based on:
- Slope angle (steeper slopes are more susceptible)
- Geology type (Birimian rocks are more susceptible)
- Land cover (bare land is more susceptible)
- Aspect (slope orientation)
- Rainfall patterns

### Map Controls

| Control | Action |
|---------|--------|
| **Zoom In/Out** | Use scroll wheel or +/- buttons |
| **Pan** | Click and drag the map |
| **Layer Toggle** | Click checkboxes to show/hide layers |
| **Click Feature** | Click on colored areas to see details |

---

## 6. Understanding Risk Levels

### Susceptibility Classifications

| Class | Score Range | Description |
|-------|-------------|-------------|
| **Very Low** | 0-20% | Minimal hazard potential |
| **Low** | 20-40% | Low hazard potential |
| **Moderate** | 40-60% | Moderate hazard potential |
| **High** | 60-80% | Significant hazard potential |
| **Very High** | 80-100% | Extreme hazard potential |

### What the Results Mean

#### For Property Owners
- **Very Low to Low**: Standard building practices are generally sufficient
- **Moderate**: Consider additional protective measures
- **High to Very High**: Consult with engineers before construction; may require special permits

#### For Emergency Managers
- **High/Very High Flood Zones**: Priority areas for flood warning systems
- **High/Very High Landslide Zones**: Priority areas for slope monitoring
- Areas where both hazards overlap require multi-hazard preparedness

---

## 7. Infrastructure Risk Assessment

### Viewing Infrastructure Risk

Navigate to **Infrastructure** to view risk scores for critical public assets:

- Schools
- Health facilities
- Government buildings
- Roads and bridges
- Water infrastructure

### Risk Score Components

Infrastructure risk is calculated as:

```
Risk = Hazard × Exposure × Vulnerability
```

Where:
- **Hazard**: Susceptibility level at location
- **Exposure**: Value and importance of the asset
- **Vulnerability**: Physical susceptibility to damage

---

## 8. Frequently Asked Questions

### Q: How accurate are the susceptibility maps?

The maps were validated against historical hazard events with an accuracy of 81.3% and correctly identified 90% of documented hazard locations. However, they should be used for planning purposes and not as definitive predictions.

### Q: Can I use this for locations outside New Juaben South?

The susceptibility analysis is specifically calibrated for New Juaben South Municipality. Results for locations outside the study area should be interpreted with caution.

### Q: How often is the data updated?

The susceptibility maps are based on terrain and environmental factors that change slowly. Major updates may occur when new data becomes available or after significant land use changes.

### Q: Who developed this system?

GeoHIS was developed as part of Master's research at Northeastern University, in collaboration with New Juaben South Municipal Assembly and NADMO Eastern Region.

### Q: Is this system free to use?

Yes, GeoHIS is open-source software released under the MIT License.

---

## 9. Technical Support

### Reporting Issues

For technical issues or questions, contact:

**Abdul Rashid Dickson**  
Email: dickson.ab@northeastern.edu

### Feedback

We welcome feedback to improve GeoHIS. Please share:
- Problems you encountered
- Features you would like
- Data errors you noticed

---

## Quick Reference Card

| Task | Steps |
|------|-------|
| **Check risk at my location** | Analyze Location → Enter coordinates → Click Analyze |
| **Upload multiple locations** | Analyze Location → Drag GeoJSON file → View results |
| **View flood map** | Hazard Zones → Select Flood layer |
| **View landslide map** | Hazard Zones → Select Landslide layer |
| **Find high-risk areas** | Dashboard → View statistics |

---

*© 2026 GeoHIS Project. Open-source under MIT License.*
