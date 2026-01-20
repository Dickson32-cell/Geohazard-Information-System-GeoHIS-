"""
GeoHIS Complete Analysis Runner

This script runs the complete geohazard analysis pipeline and generates
results suitable for inclusion in the research paper.

Usage:
    python run_analysis.py
"""

import json
import os
from datetime import datetime

# Add backend to path
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.analysis import (
    FloodRiskAnalyzer,
    LandslideRiskAnalyzer,
    RiskAssessmentEngine,
    run_complete_analysis,
    calculate_flood_weights,
    calculate_landslide_weights,
    generate_sample_validation
)


def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def run_ahp_analysis():
    """Run and display AHP weight analysis."""
    print_section("AHP WEIGHT ANALYSIS")
    
    # Flood susceptibility weights
    print("\n--- Flood Susceptibility Factors ---")
    flood_weights = calculate_flood_weights()
    
    print(f"Lambda_max: {flood_weights['lambda_max']:.4f}")
    print(f"Consistency Index (CI): {flood_weights['consistency_index']:.4f}")
    print(f"Consistency Ratio (CR): {flood_weights['consistency_ratio']:.4f}")
    print(f"Judgment Consistent: {flood_weights['is_consistent']}")
    
    print("\nFactor Weights (sorted by importance):")
    sorted_weights = sorted(flood_weights['weights'].items(), key=lambda x: x[1], reverse=True)
    for factor, weight in sorted_weights:
        print(f"  {factor:25s}: {weight:.4f} ({weight*100:.1f}%)")
    
    # Landslide susceptibility weights
    print("\n--- Landslide Susceptibility Factors ---")
    landslide_weights = calculate_landslide_weights()
    
    print(f"Lambda_max: {landslide_weights['lambda_max']:.4f}")
    print(f"Consistency Ratio (CR): {landslide_weights['consistency_ratio']:.4f}")
    print(f"Judgment Consistent: {landslide_weights['is_consistent']}")
    
    print("\nFactor Weights (sorted by importance):")
    sorted_weights = sorted(landslide_weights['weights'].items(), key=lambda x: x[1], reverse=True)
    for factor, weight in sorted_weights:
        print(f"  {factor:25s}: {weight:.4f} ({weight*100:.1f}%)")
    
    return flood_weights, landslide_weights


def run_susceptibility_analysis():
    """Run flood and landslide susceptibility mapping."""
    print_section("SUSCEPTIBILITY MAPPING")
    
    # Study area bounds for New Juaben South
    bounds = {
        'min_lat': 6.05,
        'max_lat': 6.15,
        'min_lon': -0.35,
        'max_lon': -0.20
    }
    
    # Flood susceptibility
    print("\n--- Flood Susceptibility Analysis ---")
    flood_analyzer = FloodRiskAnalyzer(bounds)
    flood_result = flood_analyzer.compute_flood_susceptibility(grid_size=(50, 50))
    
    print(f"Method: {flood_result.method}")
    print(f"Grid Size: 50 x 50 cells")
    print(f"Mean FSI: {flood_result.statistics['mean']:.2f}")
    print(f"Std Dev: {flood_result.statistics['std']:.2f}")
    print(f"Range: {flood_result.statistics['min']:.2f} - {flood_result.statistics['max']:.2f}")
    
    print("\nClass Distribution:")
    for cls, data in flood_result.statistics['class_distribution'].items():
        print(f"  {cls:15s}: {data['count']:4d} cells ({data['percentage']:.1f}%)")
    
    # Landslide susceptibility
    print("\n--- Landslide Susceptibility Analysis ---")
    landslide_analyzer = LandslideRiskAnalyzer(bounds)
    landslide_result = landslide_analyzer.compute_landslide_susceptibility(grid_size=(50, 50))
    
    print(f"Method: {landslide_result.method}")
    print(f"Mean LSI: {landslide_result.statistics['mean_lsi']:.2f}")
    print(f"Range: {landslide_result.statistics['min_lsi']:.2f} - {landslide_result.statistics['max_lsi']:.2f}")
    
    print("\nClass Distribution:")
    for cls, data in landslide_result.statistics['class_distribution'].items():
        print(f"  {cls:15s}: {data['count']:4d} cells ({data['percentage']:.1f}%)")
    
    return flood_result, landslide_result


def run_risk_assessment():
    """Run infrastructure risk assessment."""
    print_section("INFRASTRUCTURE RISK ASSESSMENT")
    
    # Sample infrastructure
    infrastructure = [
        {'id': 'HOS-001', 'name': 'Eastern Regional Hospital', 'asset_type': 'hospital',
         'population_served': 50000, 'vulnerability_score': 0.30},
        {'id': 'HOS-002', 'name': "St. Joseph's Hospital", 'asset_type': 'hospital',
         'population_served': 25000, 'vulnerability_score': 0.40},
        {'id': 'SCH-001', 'name': 'Koforidua SHTS', 'asset_type': 'school',
         'population_served': 2500, 'vulnerability_score': 0.45},
        {'id': 'SCH-002', 'name': 'Pope John SHS', 'asset_type': 'school',
         'population_served': 1800, 'vulnerability_score': 0.35},
        {'id': 'SCH-003', 'name': 'Oyoko Methodist Primary', 'asset_type': 'school',
         'population_served': 650, 'vulnerability_score': 0.55},
        {'id': 'BRD-001', 'name': 'Koforidua-Accra Bridge', 'asset_type': 'bridge',
         'population_served': 80000, 'vulnerability_score': 0.50},
        {'id': 'BRD-002', 'name': 'Effiduase Stream Crossing', 'asset_type': 'bridge',
         'population_served': 15000, 'vulnerability_score': 0.65},
        {'id': 'BLD-001', 'name': 'Municipal Assembly', 'asset_type': 'building',
         'population_served': 183000, 'vulnerability_score': 0.35},
        {'id': 'BLD-002', 'name': 'Koforidua Central Market', 'asset_type': 'building',
         'population_served': 30000, 'vulnerability_score': 0.60},
        {'id': 'BLD-003', 'name': 'Water Pumping Station', 'asset_type': 'building',
         'population_served': 100000, 'vulnerability_score': 0.45},
        {'id': 'RD-001', 'name': 'Koforidua-Bunso Road', 'asset_type': 'road',
         'population_served': 45000, 'vulnerability_score': 0.55},
        {'id': 'RD-002', 'name': 'Effiduase-Asokore Road', 'asset_type': 'road',
         'population_served': 20000, 'vulnerability_score': 0.70},
    ]
    
    # Run assessment
    engine = RiskAssessmentEngine()
    engine.set_study_area({
        'min_lat': 6.05, 'max_lat': 6.15,
        'min_lon': -0.35, 'max_lon': -0.20
    })
    
    # Simulate hazard layer
    hazard_layer = {'susceptibility_at_location': 55}  # Moderate hazard
    
    results = engine.compute_risk_score(hazard_layer, infrastructure)
    report = engine.generate_risk_report(results)
    
    print(f"\nTotal Assets Analyzed: {report['summary']['total_assets_analyzed']}")
    print("\nRisk Level Distribution:")
    for level, count in report['summary']['risk_distribution'].items():
        pct = report['summary']['risk_percentages'][level]
        print(f"  {level:15s}: {count:2d} ({pct:.1f}%)")
    
    print("\nCritical/High Risk Assets:")
    for asset in report['critical_assets']:
        print(f"  - {asset['asset_name']} ({asset['risk_level']})")
        print(f"    Risk Score: {asset['risk_score']:.1f}")
    
    return report


def run_validation():
    """Run model validation analysis."""
    print_section("MODEL VALIDATION")
    
    validation = generate_sample_validation()
    
    print("\nValidation Metrics:")
    for metric, value in validation['metrics'].items():
        print(f"  {metric:15s}: {value:.4f}")
    
    print(f"\nModel Classification: {validation['classification']}")
    
    print("\nConfusion Matrix:")
    cm = validation['confusion_matrix']
    print(f"  True Positives:  {cm['true_positive']}")
    print(f"  True Negatives:  {cm['true_negative']}")
    print(f"  False Positives: {cm['false_positive']}")
    print(f"  False Negatives: {cm['false_negative']}")
    
    print("\nInterpretation:")
    for key, interp in validation['interpretation'].items():
        print(f"  - {interp}")
    
    return validation


def save_results(flood_weights, landslide_weights, flood_result, landslide_result, 
                 risk_report, validation):
    """Save analysis results to JSON file."""
    print_section("SAVING RESULTS")
    
    results = {
        'metadata': {
            'generated_at': datetime.utcnow().isoformat(),
            'study_area': 'New Juaben South Municipality, Ghana',
            'version': '1.0'
        },
        'ahp_analysis': {
            'flood': flood_weights,
            'landslide': landslide_weights
        },
        'susceptibility': {
            'flood': {
                'method': flood_result.method,
                'statistics': flood_result.statistics
            },
            'landslide': {
                'method': landslide_result.method,
                'statistics': landslide_result.statistics
            }
        },
        'risk_assessment': risk_report,
        'validation': validation
    }
    
    # Save to data directory
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'analysis_results.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults saved to: {os.path.abspath(output_path)}")
    
    return output_path


def main():
    """Run complete geohazard analysis pipeline."""
    print("\n" + "=" * 60)
    print("    GeoHIS - COMPLETE GEOHAZARD ANALYSIS")
    print("    New Juaben South Municipality, Ghana")
    print("=" * 60)
    print(f"\nAnalysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all analyses
    flood_weights, landslide_weights = run_ahp_analysis()
    flood_result, landslide_result = run_susceptibility_analysis()
    risk_report = run_risk_assessment()
    validation = run_validation()
    
    # Save results
    output_path = save_results(
        flood_weights, landslide_weights,
        flood_result, landslide_result,
        risk_report, validation
    )
    
    print_section("ANALYSIS COMPLETE")
    print(f"\nAll results have been saved to: {output_path}")
    print("\nThese results can be used to populate the research paper tables and figures.")
    

if __name__ == '__main__':
    main()
