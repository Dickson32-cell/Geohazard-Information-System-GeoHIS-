"""
Statistical Models Package for GeoHIS

Provides bivariate and multivariate statistical methods for
geohazard susceptibility mapping.

Available Models:
- Information Value (IV) / Weight of Evidence (WoE)
- Certainty Factor (CF)
- Logistic Regression (LR) with diagnostics
"""

from .information_value import (
    InformationValueAnalyzer,
    FactorClassIV,
    FactorIVResult,
    create_sample_iv_analysis,
    classify_iv_susceptibility,
    run_information_value_analysis
)

from .certainty_factor import (
    CertaintyFactorAnalyzer,
    FactorClassCF,
    FactorCFResult,
    create_sample_cf_analysis,
    classify_cf_susceptibility
)

from .logistic_regression import (
    SusceptibilityLogisticRegression,
    generate_sample_lr_data
)

__all__ = [
    # Information Value
    'InformationValueAnalyzer',
    'FactorClassIV',
    'FactorIVResult',
    'create_sample_iv_analysis',
    'classify_iv_susceptibility',
    'run_information_value_analysis',
    # Certainty Factor
    'CertaintyFactorAnalyzer',
    'FactorClassCF',
    'FactorCFResult',
    'create_sample_cf_analysis',
    'classify_cf_susceptibility',
    # Logistic Regression
    'SusceptibilityLogisticRegression',
    'generate_sample_lr_data'
]
