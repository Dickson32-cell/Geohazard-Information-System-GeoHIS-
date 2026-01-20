"""
Model Comparison Package for GeoHIS

Provides comprehensive framework for comparing susceptibility mapping methods.

Features:
- Multiple validation metrics
- Statistical comparison tests (DeLong, McNemar)
- Success rate and prediction rate curves
- Publication-ready LaTeX tables
"""

from .model_comparison import (
    ModelComparator,
    ComprehensiveMetrics,
    StatisticalTest
)

__all__ = [
    'ModelComparator',
    'ComprehensiveMetrics',
    'StatisticalTest'
]
