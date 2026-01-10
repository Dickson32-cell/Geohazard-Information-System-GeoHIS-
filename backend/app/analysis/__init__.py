"""
GeoHIS Analysis Package

This package provides spatial analysis capabilities for geohazard assessment:
- AHP (Analytic Hierarchy Process) for multi-criteria decision analysis
- Frequency Ratio for statistical bivariate analysis
- Validation metrics for model assessment
- Integrated risk assessment engine
"""

from .ahp import (
    AHPCalculator,
    calculate_flood_weights,
    calculate_landslide_weights,
    get_flood_ahp_matrix,
    get_landslide_ahp_matrix
)

from .frequency_ratio import (
    FrequencyRatioAnalyzer,
    FactorClass,
    FrequencyRatioResult,
    create_sample_landslide_analysis,
    classify_susceptibility
)

from .validation import (
    SusceptibilityValidator,
    ValidationResult,
    generate_sample_validation
)

from .engine import (
    FloodRiskAnalyzer,
    LandslideRiskAnalyzer,
    RiskAssessmentEngine,
    SusceptibilityResult,
    RiskAssessmentResult,
    run_complete_analysis
)

__all__ = [
    # AHP module
    'AHPCalculator',
    'calculate_flood_weights',
    'calculate_landslide_weights',
    'get_flood_ahp_matrix',
    'get_landslide_ahp_matrix',
    # Frequency Ratio module
    'FrequencyRatioAnalyzer',
    'FactorClass',
    'FrequencyRatioResult',
    'create_sample_landslide_analysis',
    'classify_susceptibility',
    # Validation module
    'SusceptibilityValidator',
    'ValidationResult',
    'generate_sample_validation',
    # Engine
    'FloodRiskAnalyzer',
    'LandslideRiskAnalyzer',
    'RiskAssessmentEngine',
    'SusceptibilityResult',
    'RiskAssessmentResult',
    'run_complete_analysis',
]

__version__ = '1.0.0'