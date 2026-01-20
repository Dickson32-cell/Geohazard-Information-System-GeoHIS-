"""
GeoHIS Analysis Package

Comprehensive geohazard susceptibility analysis tools.

Modules:
- ahp: Analytical Hierarchy Process for flood susceptibility
- frequency_ratio: Frequency Ratio method for landslide susceptibility
- fuzzy_ahp: Fuzzy AHP with uncertainty handling
- topsis: TOPSIS multi-criteria analysis
- validation: Model validation metrics
- engine: Main analysis engine
- enhanced_engine: Enhanced analysis with data quality and sensitivity

New Modules:
- statistical_models: Information Value, Certainty Factor, Logistic Regression
- ml_models: Random Forest, XGBoost, SVM, Ensemble Methods
- comparison: Model comparison framework with statistical tests
"""

from .ahp import AHPCalculator, calculate_flood_weights, calculate_landslide_weights
from .frequency_ratio import FrequencyRatioAnalyzer, create_sample_landslide_analysis
from .fuzzy_ahp import FuzzyAHPCalculator, calculate_flood_weights_fuzzy
from .topsis import TOPSISAnalyzer, topsis_flood_susceptibility
from .validation import SusceptibilityValidator, generate_sample_validation
from .engine import (
    FloodRiskAnalyzer, 
    LandslideRiskAnalyzer, 
    RiskAssessmentEngine,
    run_complete_analysis,
    AnalysisEngine
)
from .enhanced_engine import (
    EnhancedAnalysisEngine,
    DataQualityChecker,
    SensitivityAnalyzer,
    UncertaintyQuantifier
)
from .earthquake import EarthquakeRiskAnalyzer, create_sample_earthquake_analysis

# Import new modules
from .statistical_models import (
    InformationValueAnalyzer,
    CertaintyFactorAnalyzer,
    SusceptibilityLogisticRegression
)
from .ml_models import (
    LandslideRandomForest,
    LandslideXGBoost,
    LandslideSVM,
    EnsembleModel
)
from .comparison import ModelComparator

__all__ = [
    # AHP
    'AHPCalculator',
    'calculate_flood_weights',
    'calculate_landslide_weights',
    # Frequency Ratio
    'FrequencyRatioAnalyzer',
    'create_sample_landslide_analysis',
    # Fuzzy AHP
    'FuzzyAHPCalculator',
    'calculate_flood_weights_fuzzy',
    # TOPSIS
    'TOPSISAnalyzer',
    'topsis_flood_susceptibility',
    # Validation
    'SusceptibilityValidator',
    'generate_sample_validation',
    # Engines
    'FloodRiskAnalyzer',
    'LandslideRiskAnalyzer',
    'RiskAssessmentEngine',
    'run_complete_analysis',
    'AnalysisEngine',
    'EnhancedAnalysisEngine',
    'DataQualityChecker',
    'SensitivityAnalyzer',
    'UncertaintyQuantifier',
    # Earthquake
    'EarthquakeRiskAnalyzer',
    'create_sample_earthquake_analysis',
    # New Statistical Models
    'InformationValueAnalyzer',
    'CertaintyFactorAnalyzer',
    'SusceptibilityLogisticRegression',
    # ML Models
    'LandslideRandomForest',
    'LandslideXGBoost',
    'LandslideSVM',
    'EnsembleModel',
    # Comparison
    'ModelComparator'
]
