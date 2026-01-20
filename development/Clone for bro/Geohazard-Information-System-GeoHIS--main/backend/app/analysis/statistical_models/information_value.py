"""
Information Value (IV) / Weight of Evidence (WoE) Module for GeoHIS

Implements the Information Value bivariate statistical method for 
landslide and flood susceptibility mapping.

IV = ln(Densclass / Densmap)

References:
- Yin, K.L. & Yan, T.Z. (1988). Statistical prediction model for slope instability.
- Van Westen, C.J. (1997). Statistical landslide hazard analysis.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class FactorClassIV:
    class_name: str
    class_area: float
    class_area_percent: float
    hazard_area: float
    hazard_area_percent: float
    density_class: float
    density_map: float
    information_value: float
    weight_of_evidence: float


@dataclass
class FactorIVResult:
    factor_name: str
    n_classes: int
    total_area: float
    total_hazard_area: float
    prior_probability: float
    classes: List[FactorClassIV]
    iv_range: Tuple[float, float]
    max_iv_class: str
    min_iv_class: str
    contrast: float


class InformationValueAnalyzer:
    def __init__(self, total_study_area: float, total_hazard_area: float, hazard_type: str = "landslide"):
        self.total_study_area = total_study_area
        self.total_hazard_area = total_hazard_area
        self.hazard_type = hazard_type
        self.prior_probability = total_hazard_area / total_study_area if total_study_area > 0 else 0
        self.factors = {}
        self.results = {}
    
    def add_factor(self, factor_name: str, class_data: List[Dict[str, float]]) -> None:
        self.factors[factor_name] = class_data
    
    def calculate_iv_for_factor(self, factor_name: str) -> FactorIVResult:
        if factor_name not in self.factors:
            raise ValueError(f"Factor '{factor_name}' not found")
        
        class_data = self.factors[factor_name]
        dens_map = self.prior_probability
        classes = []
        iv_values = []
        
        for cd in class_data:
            class_name = cd['class_name']
            class_area = cd['class_area']
            hazard_area = cd['hazard_area']
            
            class_area_pct = (class_area / self.total_study_area * 100) if self.total_study_area > 0 else 0
            hazard_area_pct = (hazard_area / self.total_hazard_area * 100) if self.total_hazard_area > 0 else 0
            dens_class = (hazard_area / class_area) if class_area > 0 else 0
            
            if dens_class > 0 and dens_map > 0:
                iv = np.log(dens_class / dens_map)
            elif dens_class == 0:
                iv = -5.0
            else:
                iv = 0.0
            
            iv_values.append(iv)
            classes.append(FactorClassIV(
                class_name=str(class_name), class_area=round(class_area, 4),
                class_area_percent=round(class_area_pct, 2), hazard_area=round(hazard_area, 6),
                hazard_area_percent=round(hazard_area_pct, 2), density_class=round(dens_class, 6),
                density_map=round(dens_map, 6), information_value=round(iv, 4),
                weight_of_evidence=round(iv, 4)
            ))
        
        max_idx = np.argmax(iv_values)
        min_idx = np.argmin(iv_values)
        
        result = FactorIVResult(
            factor_name=factor_name, n_classes=len(classes),
            total_area=self.total_study_area, total_hazard_area=self.total_hazard_area,
            prior_probability=round(self.prior_probability, 6), classes=classes,
            iv_range=(round(min(iv_values), 4), round(max(iv_values), 4)),
            max_iv_class=classes[max_idx].class_name, min_iv_class=classes[min_idx].class_name,
            contrast=round(max(iv_values) - min(iv_values), 4)
        )
        self.results[factor_name] = result
        return result
    
    def calculate_all_factors(self) -> Dict[str, FactorIVResult]:
        for factor_name in self.factors:
            self.calculate_iv_for_factor(factor_name)
        return self.results
    
    def get_susceptibility_index(self, pixel_classes: Dict[str, str]) -> float:
        if not self.results:
            self.calculate_all_factors()
        lsi = 0.0
        for factor_name, class_name in pixel_classes.items():
            if factor_name in self.results:
                for cls in self.results[factor_name].classes:
                    if cls.class_name == class_name:
                        lsi += cls.information_value
                        break
        return lsi
    
    def get_factor_importance(self) -> List[Tuple[str, float]]:
        if not self.results:
            self.calculate_all_factors()
        importance = [(name, result.contrast) for name, result in self.results.items()]
        return sorted(importance, key=lambda x: x[1], reverse=True)
    
    def to_dict(self) -> Dict[str, Any]:
        if not self.results:
            self.calculate_all_factors()
        factors_dict = {}
        for factor_name, result in self.results.items():
            factors_dict[factor_name] = {
                'factor_name': result.factor_name, 'n_classes': result.n_classes,
                'iv_range': result.iv_range, 'max_iv_class': result.max_iv_class,
                'min_iv_class': result.min_iv_class, 'contrast': result.contrast,
                'classes': [asdict(cls) for cls in result.classes]
            }
        return {
            'method': 'Information Value (Weight of Evidence)',
            'hazard_type': self.hazard_type, 'study_area_total': self.total_study_area,
            'hazard_area_total': self.total_hazard_area,
            'prior_probability': round(self.prior_probability, 6),
            'factors': factors_dict, 'factor_importance': self.get_factor_importance(),
            'timestamp': datetime.utcnow().isoformat(),
            'reference': 'Yin & Yan (1988); Van Westen (1997)'
        }


def create_sample_iv_analysis() -> InformationValueAnalyzer:
    analyzer = InformationValueAnalyzer(total_study_area=110.0, total_hazard_area=0.5, hazard_type="landslide")
    analyzer.add_factor('slope', [
        {'class_name': '0-5deg', 'class_area': 15.0, 'hazard_area': 0.01},
        {'class_name': '5-15deg', 'class_area': 30.0, 'hazard_area': 0.05},
        {'class_name': '15-30deg', 'class_area': 35.0, 'hazard_area': 0.20},
        {'class_name': '30-45deg', 'class_area': 20.0, 'hazard_area': 0.18},
        {'class_name': '>45deg', 'class_area': 10.0, 'hazard_area': 0.06},
    ])
    analyzer.add_factor('geology', [
        {'class_name': 'Birimian', 'class_area': 40.0, 'hazard_area': 0.25},
        {'class_name': 'Tarkwaian', 'class_area': 25.0, 'hazard_area': 0.12},
        {'class_name': 'Granite', 'class_area': 30.0, 'hazard_area': 0.08},
        {'class_name': 'Alluvium', 'class_area': 15.0, 'hazard_area': 0.05},
    ])
    analyzer.add_factor('land_cover', [
        {'class_name': 'Dense Forest', 'class_area': 20.0, 'hazard_area': 0.03},
        {'class_name': 'Light Forest', 'class_area': 25.0, 'hazard_area': 0.07},
        {'class_name': 'Agriculture', 'class_area': 30.0, 'hazard_area': 0.15},
        {'class_name': 'Built-up', 'class_area': 20.0, 'hazard_area': 0.10},
        {'class_name': 'Bare Land', 'class_area': 15.0, 'hazard_area': 0.15},
    ])
    return analyzer


def classify_iv_susceptibility(lsi: float) -> str:
    if lsi < -2.0: return 'Very Low'
    elif lsi < -0.5: return 'Low'
    elif lsi < 0.5: return 'Moderate'
    elif lsi < 2.0: return 'High'
    else: return 'Very High'


def run_information_value_analysis(
    total_study_area: float,
    total_hazard_area: float,
    hazard_type: str,
    factors: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Run Information Value (Weight of Evidence) analysis.
    
    Args:
        total_study_area: Total area of the study area
        total_hazard_area: Total area affected by hazard
        hazard_type: Type of hazard (e.g., "landslide", "flood")
        factors: Dictionary of factor names to class data
        
    Returns:
        Analysis results dictionary
    """
    analyzer = InformationValueAnalyzer(
        total_study_area=total_study_area,
        total_hazard_area=total_hazard_area,
        hazard_type=hazard_type
    )
    
    for factor_name, class_data in factors.items():
        analyzer.add_factor(factor_name, class_data)
    
    analyzer.calculate_all_factors()
    
    return analyzer.to_dict()
