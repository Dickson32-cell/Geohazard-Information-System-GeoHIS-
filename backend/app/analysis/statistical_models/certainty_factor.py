"""
Certainty Factor (CF) Module for Geohazard Susceptibility Mapping

Implements the Certainty Factor approach based on expert systems theory
for landslide and flood susceptibility assessment.

CF ranges from -1 to +1:
- CF > 0: Favorable for hazard occurrence
- CF < 0: Unfavorable for hazard occurrence
- CF = 0: No correlation

References:
- Shortliffe, E.H. & Buchanan, B.G. (1975). A model of inexact reasoning.
- Binaghi, E. et al. (1998). Slope instability zonation using the Certainty Factor.
- Lan, H.X. et al. (2004). Landslide hazard spatial analysis using the GIS.

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
class FactorClassCF:
    class_name: str
    class_area: float
    class_area_percent: float
    hazard_area: float
    hazard_area_percent: float
    ppa: float  # Conditional probability P(A|B)
    pps: float  # Prior probability P(A)
    certainty_factor: float
    interpretation: str


@dataclass
class FactorCFResult:
    factor_name: str
    n_classes: int
    classes: List[FactorClassCF]
    cf_range: Tuple[float, float]
    max_cf_class: str
    min_cf_class: str


class CertaintyFactorAnalyzer:
    """
    Certainty Factor (CF) analyzer for susceptibility mapping.
    
    The Certainty Factor is calculated as:
    
    If PP_a >= PP_s:
        CF = (PP_a - PP_s) / (1 - PP_s)
    
    If PP_a < PP_s:
        CF = (PP_a - PP_s) / PP_s
    
    Where:
    - PP_a: Conditional probability of hazard given factor class
    - PP_s: Prior probability of hazard in study area
    
    Combination rule (for multiple factors):
    If CF1 >= 0 and CF2 >= 0:
        CF_combined = CF1 + CF2 - CF1 * CF2
    If CF1 < 0 and CF2 < 0:
        CF_combined = CF1 + CF2 + CF1 * CF2
    Otherwise:
        CF_combined = (CF1 + CF2) / (1 - min(|CF1|, |CF2|))
    """
    
    def __init__(self, total_study_area: float, total_hazard_area: float,
                 hazard_type: str = "landslide"):
        self.total_study_area = total_study_area
        self.total_hazard_area = total_hazard_area
        self.hazard_type = hazard_type
        self.prior_probability = total_hazard_area / total_study_area if total_study_area > 0 else 0
        self.factors = {}
        self.results = {}
    
    def add_factor(self, factor_name: str, class_data: List[Dict[str, float]]) -> None:
        self.factors[factor_name] = class_data
    
    def calculate_cf_for_factor(self, factor_name: str) -> FactorCFResult:
        if factor_name not in self.factors:
            raise ValueError(f"Factor '{factor_name}' not found")
        
        class_data = self.factors[factor_name]
        pps = self.prior_probability  # Prior probability
        classes = []
        cf_values = []
        
        for cd in class_data:
            class_name = cd['class_name']
            class_area = cd['class_area']
            hazard_area = cd['hazard_area']
            
            class_area_pct = (class_area / self.total_study_area * 100) if self.total_study_area > 0 else 0
            hazard_area_pct = (hazard_area / self.total_hazard_area * 100) if self.total_hazard_area > 0 else 0
            
            # Conditional probability P(hazard|class)
            ppa = (hazard_area / class_area) if class_area > 0 else 0
            
            # Calculate Certainty Factor
            if pps == 0 or pps == 1:
                cf = 0.0
            elif ppa >= pps:
                cf = (ppa - pps) / (1 - pps) if pps < 1 else 0
            else:
                cf = (ppa - pps) / pps if pps > 0 else 0
            
            # Clip to valid range
            cf = np.clip(cf, -1.0, 1.0)
            cf_values.append(cf)
            
            # Interpretation
            if cf > 0.5:
                interp = "Strong positive correlation"
            elif cf > 0.2:
                interp = "Moderate positive correlation"
            elif cf > -0.2:
                interp = "Weak or no correlation"
            elif cf > -0.5:
                interp = "Moderate negative correlation"
            else:
                interp = "Strong negative correlation"
            
            classes.append(FactorClassCF(
                class_name=str(class_name), class_area=round(class_area, 4),
                class_area_percent=round(class_area_pct, 2),
                hazard_area=round(hazard_area, 6),
                hazard_area_percent=round(hazard_area_pct, 2),
                ppa=round(ppa, 6), pps=round(pps, 6),
                certainty_factor=round(cf, 4), interpretation=interp
            ))
        
        max_idx = np.argmax(cf_values)
        min_idx = np.argmin(cf_values)
        
        result = FactorCFResult(
            factor_name=factor_name, n_classes=len(classes), classes=classes,
            cf_range=(round(min(cf_values), 4), round(max(cf_values), 4)),
            max_cf_class=classes[max_idx].class_name,
            min_cf_class=classes[min_idx].class_name
        )
        self.results[factor_name] = result
        return result
    
    def calculate_all_factors(self) -> Dict[str, FactorCFResult]:
        for factor_name in self.factors:
            self.calculate_cf_for_factor(factor_name)
        return self.results
    
    @staticmethod
    def combine_cf(cf1: float, cf2: float) -> float:
        """Combine two CF values using the combination rule."""
        if cf1 >= 0 and cf2 >= 0:
            return cf1 + cf2 - cf1 * cf2
        elif cf1 < 0 and cf2 < 0:
            return cf1 + cf2 + cf1 * cf2
        else:
            denom = 1 - min(abs(cf1), abs(cf2))
            return (cf1 + cf2) / denom if denom != 0 else 0
    
    def get_susceptibility_index(self, pixel_classes: Dict[str, str]) -> float:
        """Calculate combined CF for a location."""
        if not self.results:
            self.calculate_all_factors()
        
        cf_values = []
        for factor_name, class_name in pixel_classes.items():
            if factor_name in self.results:
                for cls in self.results[factor_name].classes:
                    if cls.class_name == class_name:
                        cf_values.append(cls.certainty_factor)
                        break
        
        if not cf_values:
            return 0.0
        
        combined = cf_values[0]
        for cf in cf_values[1:]:
            combined = self.combine_cf(combined, cf)
        
        return combined
    
    def to_dict(self) -> Dict[str, Any]:
        if not self.results:
            self.calculate_all_factors()
        
        factors_dict = {}
        for factor_name, result in self.results.items():
            factors_dict[factor_name] = {
                'factor_name': result.factor_name,
                'n_classes': result.n_classes,
                'cf_range': result.cf_range,
                'max_cf_class': result.max_cf_class,
                'min_cf_class': result.min_cf_class,
                'classes': [asdict(cls) for cls in result.classes]
            }
        
        return {
            'method': 'Certainty Factor (CF)',
            'hazard_type': self.hazard_type,
            'study_area_total': self.total_study_area,
            'hazard_area_total': self.total_hazard_area,
            'prior_probability': round(self.prior_probability, 6),
            'factors': factors_dict,
            'timestamp': datetime.utcnow().isoformat(),
            'reference': 'Shortliffe & Buchanan (1975); Binaghi et al. (1998)'
        }


def create_sample_cf_analysis() -> CertaintyFactorAnalyzer:
    analyzer = CertaintyFactorAnalyzer(total_study_area=110.0, total_hazard_area=0.5)
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
    return analyzer


def classify_cf_susceptibility(cf: float) -> str:
    if cf < -0.5: return 'Very Low'
    elif cf < -0.2: return 'Low'
    elif cf < 0.2: return 'Moderate'
    elif cf < 0.5: return 'High'
    else: return 'Very High'
