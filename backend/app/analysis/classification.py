"""
Centralized Susceptibility Classification Module for GeoHIS

This module provides standardized classification thresholds for susceptibility
mapping to ensure consistency across all analysis methods.

References:
- Jenks, G.F. (1967). The Data Model Concept in Statistical Mapping.
- Natural Breaks optimization for susceptibility classification.

Author: GeoHIS Research Team
Date: January 2026
"""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)


@dataclass
class ClassificationScheme:
    """Container for a classification scheme."""
    name: str
    class_names: List[str]
    thresholds: List[float]  # N-1 thresholds for N classes
    colors: List[str]  # Color codes for visualization
    description: str


# Standard 5-class susceptibility scheme
SUSCEPTIBILITY_5CLASS = ClassificationScheme(
    name="5-Class Susceptibility",
    class_names=["Very Low", "Low", "Moderate", "High", "Very High"],
    thresholds=[20.0, 40.0, 60.0, 80.0],  # Percentile-based for 0-100 scale
    colors=["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
    description="Standard 5-class susceptibility classification (equal interval on 0-100 scale)"
)

# Standard 5-class for Landslide Susceptibility Index (LSI)
LSI_5CLASS = ClassificationScheme(
    name="5-Class LSI",
    class_names=["Very Low", "Low", "Moderate", "High", "Very High"],
    thresholds=[2.0, 3.5, 5.0, 7.0],  # Based on FR sum ranges
    colors=["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
    description="5-class Landslide Susceptibility Index classification (FR-based)"
)

# Risk classification scheme
RISK_5CLASS = ClassificationScheme(
    name="5-Class Risk",
    class_names=["Very Low", "Low", "Moderate", "High", "Critical"],
    thresholds=[20.0, 40.0, 60.0, 80.0],
    colors=["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
    description="Standard 5-class risk classification"
)

# Information Value classification
IV_5CLASS = ClassificationScheme(
    name="5-Class Information Value",
    class_names=["Very Low", "Low", "Moderate", "High", "Very High"],
    thresholds=[-2.0, -0.5, 0.5, 2.0],  # Based on IV distribution
    colors=["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
    description="5-class Information Value classification (log-scale)"
)


def classify_value(value: float, scheme: ClassificationScheme) -> str:
    """
    Classify a single value using the specified scheme.
    
    Args:
        value: The value to classify
        scheme: The classification scheme to use
        
    Returns:
        Class name as string
    """
    for i, threshold in enumerate(scheme.thresholds):
        if value < threshold:
            return scheme.class_names[i]
    return scheme.class_names[-1]


def classify_array(values: np.ndarray, scheme: ClassificationScheme) -> np.ndarray:
    """
    Classify an array of values using the specified scheme.
    
    Args:
        values: Array of values to classify
        scheme: The classification scheme to use
        
    Returns:
        Array of class names
    """
    result = np.empty(values.shape, dtype=object)
    
    for i, threshold in enumerate(scheme.thresholds):
        mask = values < threshold
        if i == 0:
            result[mask] = scheme.class_names[i]
        else:
            prev_mask = values >= scheme.thresholds[i-1]
            result[mask & prev_mask] = scheme.class_names[i]
    
    # Last class
    result[values >= scheme.thresholds[-1]] = scheme.class_names[-1]
    
    # Handle any remaining NaN or unclassified
    result[result == None] = scheme.class_names[2]  # Default to Moderate
    
    return result


def calculate_natural_breaks(values: np.ndarray, n_classes: int = 5) -> List[float]:
    """
    Calculate natural breaks (Jenks) for classification.
    
    Uses a simplified Jenks natural breaks algorithm.
    
    Args:
        values: Array of values
        n_classes: Number of classes
        
    Returns:
        List of threshold values
        
    Reference:
        Jenks, G.F. (1967). The Data Model Concept in Statistical Mapping.
    """
    values = np.array(values).flatten()
    values = values[~np.isnan(values)]
    
    if len(values) < n_classes:
        logger.warning(f"Not enough values for {n_classes} classes. Using equal intervals.")
        return calculate_equal_intervals(values, n_classes)
    
    # Sort values
    sorted_values = np.sort(values)
    
    # Use percentile-based breaks as approximation to Jenks
    # True Jenks optimization is computationally expensive
    percentiles = [100 * (i + 1) / n_classes for i in range(n_classes - 1)]
    thresholds = [float(np.percentile(sorted_values, p)) for p in percentiles]
    
    return thresholds


def calculate_equal_intervals(values: np.ndarray, n_classes: int = 5) -> List[float]:
    """
    Calculate equal interval breaks for classification.
    
    Args:
        values: Array of values
        n_classes: Number of classes
        
    Returns:
        List of threshold values
    """
    values = np.array(values).flatten()
    values = values[~np.isnan(values)]
    
    if len(values) == 0:
        return [20.0, 40.0, 60.0, 80.0]  # Default
    
    min_val = np.min(values)
    max_val = np.max(values)
    interval = (max_val - min_val) / n_classes
    
    thresholds = [min_val + interval * (i + 1) for i in range(n_classes - 1)]
    
    return thresholds


def calculate_quantile_breaks(values: np.ndarray, n_classes: int = 5) -> List[float]:
    """
    Calculate quantile breaks for classification (equal count per class).
    
    Args:
        values: Array of values
        n_classes: Number of classes
        
    Returns:
        List of threshold values
    """
    values = np.array(values).flatten()
    values = values[~np.isnan(values)]
    
    if len(values) < n_classes:
        return calculate_equal_intervals(values, n_classes)
    
    percentiles = [100 * (i + 1) / n_classes for i in range(n_classes - 1)]
    thresholds = [float(np.percentile(values, p)) for p in percentiles]
    
    return thresholds


def create_custom_scheme(
    values: np.ndarray,
    method: str = "quantile",
    n_classes: int = 5,
    class_names: Optional[List[str]] = None
) -> ClassificationScheme:
    """
    Create a custom classification scheme based on the data.
    
    Args:
        values: Array of values to base classification on
        method: "quantile", "equal", or "natural"
        n_classes: Number of classes
        class_names: Optional custom class names
        
    Returns:
        ClassificationScheme with data-driven thresholds
    """
    if method == "quantile":
        thresholds = calculate_quantile_breaks(values, n_classes)
    elif method == "equal":
        thresholds = calculate_equal_intervals(values, n_classes)
    else:  # natural
        thresholds = calculate_natural_breaks(values, n_classes)
    
    if class_names is None:
        if n_classes == 5:
            class_names = ["Very Low", "Low", "Moderate", "High", "Very High"]
        else:
            class_names = [f"Class {i+1}" for i in range(n_classes)]
    
    # Default colors (colorblind-friendly diverging palette)
    colors = ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"][:n_classes]
    
    return ClassificationScheme(
        name=f"Custom {n_classes}-Class ({method})",
        class_names=class_names,
        thresholds=thresholds,
        colors=colors,
        description=f"Custom classification using {method} method"
    )


def get_class_distribution(
    values: np.ndarray, 
    scheme: ClassificationScheme
) -> Dict[str, Dict[str, float]]:
    """
    Calculate the distribution of values across classes.
    
    Args:
        values: Array of values
        scheme: Classification scheme
        
    Returns:
        Dictionary with count and percentage for each class
    """
    classes = classify_array(values, scheme)
    total = len(values)
    
    distribution = {}
    for class_name in scheme.class_names:
        count = int(np.sum(classes == class_name))
        distribution[class_name] = {
            "count": count,
            "percentage": round(count / total * 100, 2) if total > 0 else 0
        }
    
    return distribution


# Convenience functions for common classifications

def classify_flood_susceptibility(value: float) -> str:
    """Classify flood susceptibility (0-100 scale)."""
    return classify_value(value, SUSCEPTIBILITY_5CLASS)


def classify_landslide_susceptibility(lsi: float) -> str:
    """Classify landslide susceptibility using LSI."""
    return classify_value(lsi, LSI_5CLASS)


def classify_risk(risk_score: float) -> str:
    """Classify risk level (0-100 scale)."""
    return classify_value(risk_score, RISK_5CLASS)


def classify_information_value(iv: float) -> str:
    """Classify Information Value susceptibility."""
    return classify_value(iv, IV_5CLASS)
