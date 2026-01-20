"""
Fuzzy AHP Analysis Module for GeoHIS

Implements Fuzzy Analytical Hierarchy Process using triangular fuzzy numbers
for handling uncertainty in expert judgments for flood susceptibility mapping.

Based on: Chang, D.Y. (1996). Applications of the extent analysis method on
fuzzy AHP. European Journal of Operational Research, 95(3), 649-655.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class TriangularFuzzyNumber:
    """Represents a triangular fuzzy number (l, m, u)."""
    l: float  # Lower bound
    m: float  # Most likely (crisp) value
    u: float  # Upper bound
    
    def __add__(self, other: 'TriangularFuzzyNumber') -> 'TriangularFuzzyNumber':
        return TriangularFuzzyNumber(
            self.l + other.l,
            self.m + other.m,
            self.u + other.u
        )
    
    def __mul__(self, scalar: float) -> 'TriangularFuzzyNumber':
        if scalar >= 0:
            return TriangularFuzzyNumber(self.l * scalar, self.m * scalar, self.u * scalar)
        return TriangularFuzzyNumber(self.u * scalar, self.m * scalar, self.l * scalar)
    
    def reciprocal(self) -> 'TriangularFuzzyNumber':
        """Calculate reciprocal of fuzzy number."""
        return TriangularFuzzyNumber(1/self.u, 1/self.m, 1/self.l)
    
    def defuzzify(self) -> float:
        """Convert fuzzy number to crisp value using centroid method."""
        return (self.l + self.m + self.u) / 3


# Fuzzy scale for pairwise comparisons (Saaty scale extended to fuzzy)
FUZZY_SCALE = {
    1: TriangularFuzzyNumber(1, 1, 1),           # Equal importance
    2: TriangularFuzzyNumber(1, 2, 3),           # Weak/slight
    3: TriangularFuzzyNumber(2, 3, 4),           # Moderate importance
    4: TriangularFuzzyNumber(3, 4, 5),           # Moderate plus
    5: TriangularFuzzyNumber(4, 5, 6),           # Strong importance
    6: TriangularFuzzyNumber(5, 6, 7),           # Strong plus
    7: TriangularFuzzyNumber(6, 7, 8),           # Very strong
    8: TriangularFuzzyNumber(7, 8, 9),           # Very, very strong
    9: TriangularFuzzyNumber(8, 9, 9),           # Extreme importance
}


class FuzzyAHPCalculator:
    """
    Fuzzy Analytical Hierarchy Process Calculator.
    
    Uses Chang's extent analysis method to derive weights from
    fuzzy pairwise comparison matrices.
    """
    
    def __init__(self, criteria: List[str]):
        """
        Initialize Fuzzy AHP calculator.
        
        Args:
            criteria: List of criteria names
        """
        self.criteria = criteria
        self.n = len(criteria)
        self.fuzzy_matrix = None
        self.weights = None
        self.extent_values = None
    
    def create_fuzzy_matrix(self, crisp_matrix: np.ndarray) -> List[List[TriangularFuzzyNumber]]:
        """
        Convert crisp pairwise comparison matrix to fuzzy matrix.
        
        Args:
            crisp_matrix: n x n matrix of Saaty scale values
            
        Returns:
            Fuzzy pairwise comparison matrix
        """
        fuzzy_matrix = []
        
        for i in range(self.n):
            row = []
            for j in range(self.n):
                value = crisp_matrix[i, j]
                
                if i == j:
                    # Diagonal elements are (1, 1, 1)
                    row.append(TriangularFuzzyNumber(1, 1, 1))
                elif value >= 1:
                    # Use fuzzy scale
                    int_value = int(round(value))
                    int_value = min(max(int_value, 1), 9)
                    row.append(FUZZY_SCALE[int_value])
                else:
                    # Reciprocal
                    reciprocal_value = int(round(1 / value))
                    reciprocal_value = min(max(reciprocal_value, 1), 9)
                    row.append(FUZZY_SCALE[reciprocal_value].reciprocal())
            
            fuzzy_matrix.append(row)
        
        self.fuzzy_matrix = fuzzy_matrix
        return fuzzy_matrix
    
    def calculate_fuzzy_synthetic_extent(self) -> List[TriangularFuzzyNumber]:
        """
        Calculate fuzzy synthetic extent values for each criterion.
        
        Si = Σj(Mij) ⊗ [Σi Σj(Mij)]^(-1)
        
        Returns:
            List of synthetic extent values (one per criterion)
        """
        if self.fuzzy_matrix is None:
            raise ValueError("Fuzzy matrix not created. Call create_fuzzy_matrix first.")
        
        # Calculate row sums
        row_sums = []
        for i in range(self.n):
            row_sum = TriangularFuzzyNumber(0, 0, 0)
            for j in range(self.n):
                row_sum = row_sum + self.fuzzy_matrix[i][j]
            row_sums.append(row_sum)
        
        # Calculate total sum
        total_sum = TriangularFuzzyNumber(0, 0, 0)
        for row_sum in row_sums:
            total_sum = total_sum + row_sum
        
        # Calculate synthetic extent values
        synthetic_extents = []
        for row_sum in row_sums:
            # S = row_sum ⊗ (1/total_sum)
            s = TriangularFuzzyNumber(
                row_sum.l / total_sum.u,
                row_sum.m / total_sum.m,
                row_sum.u / total_sum.l
            )
            synthetic_extents.append(s)
        
        self.extent_values = synthetic_extents
        return synthetic_extents
    
    def degree_of_possibility(self, m1: TriangularFuzzyNumber, m2: TriangularFuzzyNumber) -> float:
        """
        Calculate degree of possibility that M1 >= M2.
        
        V(M1 >= M2) = {
            1,                              if m1 >= m2
            0,                              if l2 >= u1
            (l2 - u1) / ((m1 - u1) - (m2 - l2)), otherwise
        }
        """
        if m1.m >= m2.m:
            return 1.0
        elif m2.l >= m1.u:
            return 0.0
        else:
            d = (m2.l - m1.u) / ((m1.m - m1.u) - (m2.m - m2.l))
            return max(0, min(1, d))
    
    def calculate_weights(self) -> Dict[str, float]:
        """
        Calculate normalized weights using extent analysis method.
        
        Returns:
            Dictionary mapping criteria names to weights
        """
        if self.extent_values is None:
            self.calculate_fuzzy_synthetic_extent()
        
        n = len(self.extent_values)
        
        # Calculate minimum degree of possibility for each criterion
        d_prime = []
        for i in range(n):
            min_v = 1.0
            for j in range(n):
                if i != j:
                    v = self.degree_of_possibility(self.extent_values[i], self.extent_values[j])
                    min_v = min(min_v, v)
            d_prime.append(min_v)
        
        # Handle case where all values are zero
        if sum(d_prime) == 0:
            # Fall back to defuzzified values
            d_prime = [se.defuzzify() for se in self.extent_values]
        
        # Normalize weights
        total = sum(d_prime)
        normalized_weights = [d / total if total > 0 else 1/n for d in d_prime]
        
        self.weights = {c: w for c, w in zip(self.criteria, normalized_weights)}
        return self.weights
    
    def get_fuzzy_analysis_report(self) -> Dict:
        """
        Generate comprehensive fuzzy AHP analysis report.
        
        Returns:
            Dictionary with analysis details
        """
        if self.weights is None:
            self.calculate_weights()
        
        return {
            'method': 'Fuzzy AHP (Chang\'s Extent Analysis)',
            'criteria': self.criteria,
            'n_criteria': self.n,
            'weights': self.weights,
            'synthetic_extents': [
                {'criterion': c, 'l': se.l, 'm': se.m, 'u': se.u}
                for c, se in zip(self.criteria, self.extent_values)
            ],
            'defuzzified_values': [se.defuzzify() for se in self.extent_values],
            'reference': 'Chang, D.Y. (1996). Applications of the extent analysis method on fuzzy AHP.'
        }


def calculate_flood_weights_fuzzy() -> Dict:
    """
    Calculate flood susceptibility weights using Fuzzy AHP.
    
    Uses the same pairwise comparisons as standard AHP but with
    fuzzy numbers to handle uncertainty.
    
    Returns:
        Fuzzy AHP analysis results with weights
    """
    criteria = ['elevation', 'slope', 'drainage_proximity', 'land_use', 'soil_permeability']
    
    # Pairwise comparison matrix (same as standard AHP)
    # Based on expert judgment for flood susceptibility
    comparison_matrix = np.array([
        [1,   2,   1,   3,   2],      # Elevation
        [1/2, 1,   1/2, 2,   1],      # Slope
        [1,   2,   1,   3,   2],      # Drainage proximity
        [1/3, 1/2, 1/3, 1,   1/2],    # Land use
        [1/2, 1,   1/2, 2,   1],      # Soil permeability
    ])
    
    calculator = FuzzyAHPCalculator(criteria)
    calculator.create_fuzzy_matrix(comparison_matrix)
    weights = calculator.calculate_weights()
    
    report = calculator.get_fuzzy_analysis_report()
    report['consistency_note'] = 'Fuzzy AHP inherently handles inconsistency through fuzzy numbers'
    
    return report


def calculate_landslide_weights_fuzzy() -> Dict:
    """
    Calculate landslide susceptibility weights using Fuzzy AHP.
    
    Returns:
        Fuzzy AHP analysis results with weights
    """
    criteria = ['slope', 'aspect', 'geology', 'land_cover', 'rainfall']
    
    # Pairwise comparison matrix for landslide factors
    comparison_matrix = np.array([
        [1,   3,   2,   3,   2],      # Slope (most important)
        [1/3, 1,   1/2, 1,   1/2],    # Aspect
        [1/2, 2,   1,   2,   1],      # Geology
        [1/3, 1,   1/2, 1,   1/2],    # Land cover
        [1/2, 2,   1,   2,   1],      # Rainfall
    ])
    
    calculator = FuzzyAHPCalculator(criteria)
    calculator.create_fuzzy_matrix(comparison_matrix)
    weights = calculator.calculate_weights()
    
    report = calculator.get_fuzzy_analysis_report()
    report['consistency_note'] = 'Fuzzy AHP inherently handles inconsistency through fuzzy numbers'
    
    return report


# Example usage and testing
if __name__ == "__main__":
    print("=" * 60)
    print("Fuzzy AHP Analysis for Flood Susceptibility")
    print("=" * 60)
    
    flood_result = calculate_flood_weights_fuzzy()
    print(f"\nCriteria: {flood_result['criteria']}")
    print(f"\nWeights:")
    for criterion, weight in flood_result['weights'].items():
        print(f"  {criterion}: {weight:.4f}")
    
    print("\n" + "=" * 60)
    print("Fuzzy AHP Analysis for Landslide Susceptibility")
    print("=" * 60)
    
    landslide_result = calculate_landslide_weights_fuzzy()
    print(f"\nCriteria: {landslide_result['criteria']}")
    print(f"\nWeights:")
    for criterion, weight in landslide_result['weights'].items():
        print(f"  {criterion}: {weight:.4f}")
