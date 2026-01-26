"""
Global Sensitivity Analysis Module for GeoHIS

Implements variance-based sensitivity analysis (Sobol indices) to quantify
the contribution of each input factor to the variance of the model output.
This provides a deeper understanding of model behavior than local feature importance.

Methodology:
- Saltelli Sampling for efficient parameter space exploration
- Sobol Indices (First-order and Total-order) calculation
- Support for any trained sklearn-compatible model

References:
- Sobol, I. M. (2001). Global sensitivity indices for nonlinear mathematical models.
- Saltelli, A. et al. (2008). Global Sensitivity Analysis: The Primer.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, asdict
import logging
from SALib.sample import saltelli
from SALib.analyze import sobol

logger = logging.getLogger(__name__)

@dataclass
class SensitivityResult:
    """Container for sensitivity analysis results."""
    method: str
    n_samples: int
    first_order: Dict[str, float]  # S1: Main effect
    total_order: Dict[str, float]  # ST: Total effect (including interactions)
    second_order: Optional[Dict[str, float]] = None  # S2: Interactions (optional)
    confidence_intervals: Dict[str, Dict[str, float]] = None

class SobolSensitivityAnalyzer:
    """
    Performs Sobol Global Sensitivity Analysis on geohazard models.
    """
    
    def __init__(self, model: Any, feature_names: List[str], bounds: Optional[Dict[str, List[float]]] = None):
        """
        Initialize the analyzer.
        
        Args:
            model: Trained model with predict_proba method (sklearn-compatible)
            feature_names: List of feature names
            bounds: Dictionary of bounds for each feature {name: [min, max]}.
                    If None, assumes standard scaled inputs [-3, 3] or similar.
        """
        self.model = model
        self.feature_names = feature_names
        
        # Define problem for SALib
        self.problem = {
            'num_vars': len(feature_names),
            'names': feature_names,
            'bounds': self._get_bounds_array(bounds)
        }
        
    def _get_bounds_array(self, bounds_dict: Optional[Dict[str, List[float]]]) -> List[List[float]]:
        """Convert bounds dictionary to list of lists."""
        if bounds_dict is None:
            # Default to standard normal range approx [-3, 3] for scaled features
            # Or [0, 1] if normalized. We'll assume scaled for now as models usually expect it.
            # In a real app, we should pass the actual feature ranges from training data.
            return [[-3.0, 3.0] for _ in self.feature_names]
            
        return [bounds_dict.get(name, [-3.0, 3.0]) for name in self.feature_names]

    def analyze(self, n_samples: int = 1024, calc_second_order: bool = False) -> SensitivityResult:
        """
        Execute the sensitivity analysis.
        
        Args:
            n_samples: Number of samples to generate (N). Total model runs will be N(2D + 2).
            calc_second_order: Whether to calculate second-order interactions (S2).
            
        Returns:
            SensitivityResult object
        """
        logger.info(f"Starting Sobol analysis with N={n_samples}...")
        
        # 1. Generate samples
        # param_values shape: (N * (2D + 2), D)
        param_values = saltelli.sample(self.problem, n_samples, calc_second_order=calc_second_order)
        
        logger.info(f"Generated {param_values.shape[0]} samples for evaluation")
        
        # 2. Run model
        # We need to ensure the model receives the correct shape and type
        try:
            if hasattr(self.model, "predict_proba"):
                # Binary classification
                # If it's a wrapper, it might already return 1D probability for positive class
                preds = self.model.predict_proba(param_values)
                if preds.ndim == 2:
                    y = preds[:, 1]
                else:
                    y = preds
            else:
                # Regression or other
                y = self.model.predict(param_values)
        except Exception as e:
            logger.error(f"Model prediction failed during sensitivity analysis: {e}")
            raise ValueError(f"Model evaluation failed: {e}")
            
        # 3. Analyze results
        si = sobol.analyze(self.problem, y, calc_second_order=calc_second_order)
        
        # 4. Format results
        first_order = dict(zip(self.feature_names, si['S1']))
        total_order = dict(zip(self.feature_names, si['ST']))
        
        # Confidence intervals
        ci = {}
        for i, name in enumerate(self.feature_names):
            ci[name] = {
                'S1_conf': si['S1_conf'][i],
                'ST_conf': si['ST_conf'][i]
            }
            
        second_order = None
        if calc_second_order:
            second_order = {}
            for i, name_i in enumerate(self.feature_names):
                for j, name_j in enumerate(self.feature_names):
                    if i < j:
                        key = f"{name_i} & {name_j}"
                        val = si['S2'][i][j]
                        if not np.isnan(val):
                            second_order[key] = val
                            
        logger.info("Sobol analysis completed successfully")
        
        return SensitivityResult(
            method="Sobol Indices (Variance-based)",
            n_samples=n_samples,
            first_order={k: round(v, 4) for k, v in first_order.items()},
            total_order={k: round(v, 4) for k, v in total_order.items()},
            second_order={k: round(v, 4) for k, v in second_order.items()} if second_order else None,
            confidence_intervals={k: {mk: round(mv, 4) for mk, mv in v.items()} for k, v in ci.items()}
        )

def run_sensitivity_analysis(
    model: Any, 
    X_train: np.ndarray, 
    feature_names: List[str],
    n_samples: int = 512
) -> Dict[str, Any]:
    """
    Convenience function to run analysis inferred from training data distribution.
    
    Args:
        model: Trained model
        X_train: Training data (to determine bounds)
        feature_names: Feature names
        n_samples: Base sample size
    
    Returns:
        Dictionary result compatible with API response
    """
    # Infer bounds from data (min, max)
    # Adding a small buffer to ensure we cover the space
    bounds = {}
    for i, name in enumerate(feature_names):
        col_min = float(np.min(X_train[:, i]))
        col_max = float(np.max(X_train[:, i]))
        margin = (col_max - col_min) * 0.1
        bounds[name] = [col_min - margin, col_max + margin]
        
    analyzer = SobolSensitivityAnalyzer(model, feature_names, bounds)
    result = analyzer.analyze(n_samples=n_samples)
    
    return asdict(result)
