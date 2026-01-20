"""
AHP (Analytic Hierarchy Process) Module for Multi-Criteria Decision Analysis

This module implements Saaty's AHP method for calculating consistent factor weights
used in flood and landslide susceptibility assessment.

Reference: Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional


class AHPCalculator:
    """
    Analytic Hierarchy Process calculator for deriving consistent weights
    from pairwise comparison matrices.
    
    The Saaty Scale:
    1 - Equal importance
    3 - Moderate importance
    5 - Strong importance
    7 - Very strong importance
    9 - Extreme importance
    2,4,6,8 - Intermediate values
    """
    
    # Random Consistency Index (RI) values for matrix sizes 1-15
    RANDOM_INDEX = {
        1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
        6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
        11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
    }
    
    def __init__(self, criteria: List[str], comparison_matrix: np.ndarray):
        """
        Initialize AHP calculator.
        
        Args:
            criteria: List of criteria names
            comparison_matrix: Square pairwise comparison matrix (n x n)
        """
        self.criteria = criteria
        self.n = len(criteria)
        self.matrix = np.array(comparison_matrix, dtype=float)
        self._validate_matrix()
        
    def _validate_matrix(self):
        """Validate the comparison matrix structure."""
        if self.matrix.shape != (self.n, self.n):
            raise ValueError(f"Matrix must be {self.n}x{self.n}, got {self.matrix.shape}")
        
        # Check diagonal is all 1s
        if not np.allclose(np.diag(self.matrix), 1.0):
            raise ValueError("Diagonal elements must be 1")
        
        # Check reciprocal property: a[i,j] = 1/a[j,i]
        for i in range(self.n):
            for j in range(i+1, self.n):
                if not np.isclose(self.matrix[i,j] * self.matrix[j,i], 1.0, rtol=1e-5):
                    raise ValueError(f"Matrix must be reciprocal: a[{i},{j}] * a[{j},{i}] should = 1")
    
    def calculate_weights(self) -> np.ndarray:
        """
        Calculate priority weights using the eigenvector method.
        
        Returns:
            Normalized weight vector
        """
        # Calculate eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(self.matrix)
        
        # Find the principal eigenvalue (largest real eigenvalue)
        max_idx = np.argmax(eigenvalues.real)
        self.lambda_max = eigenvalues[max_idx].real
        
        # Get corresponding eigenvector and normalize
        principal_eigenvector = eigenvectors[:, max_idx].real
        weights = principal_eigenvector / principal_eigenvector.sum()
        
        return np.abs(weights)
    
    def calculate_consistency_ratio(self) -> Tuple[float, float, bool]:
        """
        Calculate the Consistency Ratio (CR) to check judgment consistency.
        
        Returns:
            Tuple of (CI, CR, is_consistent)
            CR < 0.10 indicates acceptable consistency
        """
        if not hasattr(self, 'lambda_max'):
            self.calculate_weights()
        
        # Consistency Index
        CI = (self.lambda_max - self.n) / (self.n - 1) if self.n > 1 else 0
        
        # Random Index
        RI = self.RANDOM_INDEX.get(self.n, 1.59)
        
        # Consistency Ratio
        CR = CI / RI if RI > 0 else 0
        
        return CI, CR, CR < 0.10
    
    def get_weight_dict(self) -> Dict[str, float]:
        """Get weights as a dictionary with criteria names."""
        weights = self.calculate_weights()
        return {criterion: float(weight) for criterion, weight in zip(self.criteria, weights)}
    
    def get_full_analysis(self) -> Dict:
        """
        Perform complete AHP analysis.
        
        Returns:
            Dictionary with weights, consistency metrics, and validity
        """
        weights = self.calculate_weights()
        CI, CR, is_consistent = self.calculate_consistency_ratio()
        
        return {
            'criteria': self.criteria,
            'weights': self.get_weight_dict(),
            'lambda_max': float(self.lambda_max),
            'n': self.n,
            'consistency_index': float(CI),
            'random_index': float(self.RANDOM_INDEX.get(self.n, 1.59)),
            'consistency_ratio': float(CR),
            'is_consistent': bool(is_consistent),
            'message': 'Consistency acceptable (CR < 0.10)' if is_consistent else 'WARNING: Inconsistent judgments (CR >= 0.10), revise comparisons'
        }


# Predefined comparison matrices for common geohazard factors

def get_flood_ahp_matrix() -> Tuple[List[str], np.ndarray]:
    """
    Get predefined AHP comparison matrix for flood susceptibility factors.
    
    Factors: Elevation, Slope, Drainage Proximity, Land Use, Soil Permeability
    
    Based on expert judgment and literature review.
    """
    criteria = ['elevation', 'slope', 'drainage_proximity', 'land_use', 'soil_permeability']
    
    # Pairwise comparison matrix (Saaty scale)
    # Row factor compared to Column factor
    matrix = np.array([
        #    elev  slope drain  luse  soil
        [1,     2,    1,     3,    2],    # elevation
        [1/2,   1,    1/2,   2,    1],    # slope
        [1,     2,    1,     3,    2],    # drainage_proximity
        [1/3,   1/2,  1/3,   1,    1/2],  # land_use
        [1/2,   1,    1/2,   2,    1],    # soil_permeability
    ])
    
    return criteria, matrix


def get_landslide_ahp_matrix() -> Tuple[List[str], np.ndarray]:
    """
    Get predefined AHP comparison matrix for landslide susceptibility factors.
    
    Factors: Slope, Aspect, Geology, Land Cover, Rainfall
    """
    criteria = ['slope', 'aspect', 'geology', 'land_cover', 'rainfall']
    
    matrix = np.array([
        #    slope aspect geol  lcover rain
        [1,     3,     2,    3,     2],    # slope (most important)
        [1/3,   1,     1/2,  1,     1/2],  # aspect
        [1/2,   2,     1,    2,     1],    # geology
        [1/3,   1,     1/2,  1,     1/2],  # land_cover
        [1/2,   2,     1,    2,     1],    # rainfall
    ])
    
    return criteria, matrix


# Convenience functions

def calculate_flood_weights() -> Dict:
    """Calculate weights for flood susceptibility factors using AHP."""
    criteria, matrix = get_flood_ahp_matrix()
    ahp = AHPCalculator(criteria, matrix)
    return ahp.get_full_analysis()


def calculate_landslide_weights() -> Dict:
    """Calculate weights for landslide susceptibility factors using AHP."""
    criteria, matrix = get_landslide_ahp_matrix()
    ahp = AHPCalculator(criteria, matrix)
    return ahp.get_full_analysis()
