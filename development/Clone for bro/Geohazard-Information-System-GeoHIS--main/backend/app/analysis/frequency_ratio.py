"""
Frequency Ratio Module for Landslide Susceptibility Analysis

This module implements the statistical bivariate Frequency Ratio (FR) method
for landslide susceptibility mapping.

Reference: Lee, S., & Pradhan, B. (2007). Landslide hazard mapping using 
frequency ratio and logistic regression models. Landslides, 4(1), 33-41.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class FactorClass:
    """Represents a class within a conditioning factor."""
    name: str
    class_area: float  # Area in study region (km² or pixels)
    landslide_area: float  # Area of landslides in this class


@dataclass
class FrequencyRatioResult:
    """Results for a single conditioning factor."""
    factor_name: str
    classes: List[str]
    class_areas: List[float]
    landslide_areas: List[float]
    frequency_ratios: List[float]
    normalized_fr: List[float]  # Optional: normalized to 0-1 range


class FrequencyRatioAnalyzer:
    """
    Frequency Ratio (FR) analyzer for landslide susceptibility.
    
    FR = (% of landslide area in class) / (% of total area in class)
    
    FR > 1: Positive correlation with landslide occurrence
    FR < 1: Negative correlation with landslide occurrence
    FR = 1: No correlation
    """
    
    def __init__(self, total_study_area: float, total_landslide_area: float):
        """
        Initialize the FR analyzer.
        
        Args:
            total_study_area: Total area of study region (km² or pixels)
            total_landslide_area: Total area covered by landslides
        """
        self.total_study_area = total_study_area
        self.total_landslide_area = total_landslide_area
        self.factors: Dict[str, List[FactorClass]] = {}
        self.results: Dict[str, FrequencyRatioResult] = {}
        
    def add_factor(self, factor_name: str, classes: List[FactorClass]):
        """
        Add a conditioning factor with its classes.
        
        Args:
            factor_name: Name of the factor (e.g., 'slope', 'geology')
            classes: List of FactorClass objects
        """
        self.factors[factor_name] = classes
        
    def calculate_fr(self, factor_name: str) -> FrequencyRatioResult:
        """
        Calculate Frequency Ratio for a specific factor.
        
        Args:
            factor_name: Name of the factor to analyze
            
        Returns:
            FrequencyRatioResult with FR values for each class
        """
        if factor_name not in self.factors:
            raise ValueError(f"Factor '{factor_name}' not found")
            
        classes = self.factors[factor_name]
        class_names = []
        class_areas = []
        landslide_areas = []
        frequency_ratios = []
        
        for cls in classes:
            class_names.append(cls.name)
            class_areas.append(cls.class_area)
            landslide_areas.append(cls.landslide_area)
            
            # Calculate FR
            # FR = (landslide_area_in_class / total_landslide_area) / 
            #      (class_area / total_study_area)
            
            landslide_percentage = (cls.landslide_area / self.total_landslide_area * 100 
                                   if self.total_landslide_area > 0 else 0)
            area_percentage = (cls.class_area / self.total_study_area * 100 
                              if self.total_study_area > 0 else 0)
            
            fr = landslide_percentage / area_percentage if area_percentage > 0 else 0
            frequency_ratios.append(fr)
        
        # Normalize FR values to 0-1 range for susceptibility mapping
        max_fr = max(frequency_ratios) if frequency_ratios else 1
        normalized_fr = [fr / max_fr if max_fr > 0 else 0 for fr in frequency_ratios]
        
        result = FrequencyRatioResult(
            factor_name=factor_name,
            classes=class_names,
            class_areas=class_areas,
            landslide_areas=landslide_areas,
            frequency_ratios=frequency_ratios,
            normalized_fr=normalized_fr
        )
        
        self.results[factor_name] = result
        return result
    
    def calculate_all_factors(self) -> Dict[str, FrequencyRatioResult]:
        """Calculate FR for all registered factors."""
        for factor_name in self.factors:
            self.calculate_fr(factor_name)
        return self.results
    
    def get_susceptibility_index(self, pixel_classes: Dict[str, str]) -> float:
        """
        Calculate Landslide Susceptibility Index (LSI) for a pixel/location.
        
        LSI = Σ(FR_i) for all factors
        
        Args:
            pixel_classes: Dictionary mapping factor name to class name for the pixel
            
        Returns:
            LSI value (sum of FR values)
        """
        if not self.results:
            self.calculate_all_factors()
            
        lsi = 0.0
        for factor_name, class_name in pixel_classes.items():
            if factor_name in self.results:
                result = self.results[factor_name]
                try:
                    idx = result.classes.index(class_name)
                    lsi += result.frequency_ratios[idx]
                except ValueError:
                    pass  # Class not found, skip
        
        return lsi
    
    def get_summary_table(self) -> Dict:
        """
        Generate summary statistics table for all factors.
        
        Returns:
            Dictionary with summary statistics
        """
        summary = {
            'total_study_area': self.total_study_area,
            'total_landslide_area': self.total_landslide_area,
            'landslide_density': (self.total_landslide_area / self.total_study_area * 100 
                                 if self.total_study_area > 0 else 0),
            'factors': {}
        }
        
        for factor_name, result in self.results.items():
            factor_summary = {
                'classes': result.classes,
                'frequency_ratios': result.frequency_ratios,
                'max_fr': max(result.frequency_ratios) if result.frequency_ratios else 0,
                'min_fr': min(result.frequency_ratios) if result.frequency_ratios else 0,
                'high_susceptibility_classes': [
                    cls for cls, fr in zip(result.classes, result.frequency_ratios) if fr > 1
                ]
            }
            summary['factors'][factor_name] = factor_summary
            
        return summary


def create_sample_landslide_analysis() -> FrequencyRatioAnalyzer:
    """
    Create a sample FR analysis with typical landslide conditioning factors.
    
    Based on typical values from literature for tropical highland regions.
    """
    # Sample study area: 110 km² with 0.5 km² of historical landslides
    analyzer = FrequencyRatioAnalyzer(
        total_study_area=110.0,  # km²
        total_landslide_area=0.5  # km²
    )
    
    # Slope classes (degrees)
    analyzer.add_factor('slope', [
        FactorClass('0-5°', 15.0, 0.01),
        FactorClass('5-15°', 30.0, 0.05),
        FactorClass('15-30°', 35.0, 0.20),
        FactorClass('30-45°', 20.0, 0.18),
        FactorClass('>45°', 10.0, 0.06),
    ])
    
    # Aspect classes
    analyzer.add_factor('aspect', [
        FactorClass('Flat', 5.0, 0.01),
        FactorClass('North', 12.0, 0.04),
        FactorClass('Northeast', 14.0, 0.06),
        FactorClass('East', 15.0, 0.08),
        FactorClass('Southeast', 14.0, 0.09),
        FactorClass('South', 13.0, 0.07),
        FactorClass('Southwest', 13.0, 0.06),
        FactorClass('West', 12.0, 0.05),
        FactorClass('Northwest', 12.0, 0.04),
    ])
    
    # Geology/Lithology
    analyzer.add_factor('geology', [
        FactorClass('Birimian', 40.0, 0.25),
        FactorClass('Tarkwaian', 25.0, 0.12),
        FactorClass('Granite', 30.0, 0.08),
        FactorClass('Alluvium', 15.0, 0.05),
    ])
    
    # Land Cover
    analyzer.add_factor('land_cover', [
        FactorClass('Dense Forest', 20.0, 0.03),
        FactorClass('Light Forest', 25.0, 0.07),
        FactorClass('Agriculture', 30.0, 0.15),
        FactorClass('Built-up', 20.0, 0.10),
        FactorClass('Bare Land', 15.0, 0.15),
    ])
    
    # Rainfall zones (annual mm)
    analyzer.add_factor('rainfall', [
        FactorClass('<1200mm', 10.0, 0.02),
        FactorClass('1200-1500mm', 35.0, 0.10),
        FactorClass('1500-1800mm', 45.0, 0.28),
        FactorClass('>1800mm', 20.0, 0.10),
    ])
    
    return analyzer


def classify_susceptibility(lsi: float, method: str = 'natural_breaks') -> str:
    """
    Classify LSI value into susceptibility category.
    
    Args:
        lsi: Landslide Susceptibility Index
        method: Classification method
        
    Returns:
        Susceptibility class string
    """
    # Thresholds based on typical LSI distributions
    if lsi < 2.0:
        return 'Very Low'
    elif lsi < 3.5:
        return 'Low'
    elif lsi < 5.0:
        return 'Moderate'
    elif lsi < 7.0:
        return 'High'
    else:
        return 'Very High'
