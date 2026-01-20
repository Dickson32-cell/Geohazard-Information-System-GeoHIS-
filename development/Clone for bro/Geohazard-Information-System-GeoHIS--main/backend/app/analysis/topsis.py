"""
TOPSIS Analysis Module for GeoHIS

Implements Technique for Order of Preference by Similarity to Ideal Solution
for multi-criteria flood and landslide susceptibility assessment.

Reference: Hwang, C.L. & Yoon, K. (1981). Multiple Attribute Decision Making: 
Methods and Applications. Springer-Verlag, Berlin.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class TOPSISResult:
    """Container for TOPSIS analysis results."""
    alternatives: List[str]
    criteria: List[str]
    weights: Dict[str, float]
    normalized_matrix: np.ndarray
    weighted_matrix: np.ndarray
    ideal_solution: np.ndarray
    anti_ideal_solution: np.ndarray
    separation_positive: np.ndarray
    separation_negative: np.ndarray
    relative_closeness: np.ndarray
    rankings: List[Tuple[str, float, int]]


class TOPSISAnalyzer:
    """
    TOPSIS Multi-Criteria Decision Analysis.
    
    Steps:
    1. Construct normalized decision matrix
    2. Construct weighted normalized decision matrix
    3. Determine ideal and anti-ideal solutions
    4. Calculate separation measures
    5. Calculate relative closeness to ideal solution
    6. Rank alternatives
    """
    
    def __init__(self, 
                 alternatives: List[str],
                 criteria: List[str],
                 weights: Dict[str, float],
                 beneficial: Optional[Dict[str, bool]] = None):
        """
        Initialize TOPSIS analyzer.
        
        Args:
            alternatives: List of alternative names (e.g., grid cells, locations)
            criteria: List of criteria names
            weights: Dictionary mapping criteria to weights (must sum to 1)
            beneficial: Dictionary indicating if higher is better (True) or worse (False)
                       Default: all criteria are beneficial
        """
        self.alternatives = alternatives
        self.criteria = criteria
        self.weights = weights
        
        # Validate weights sum to 1
        weight_sum = sum(weights.values())
        if abs(weight_sum - 1.0) > 0.01:
            # Normalize weights
            self.weights = {k: v/weight_sum for k, v in weights.items()}
        
        # Default: all criteria are beneficial (higher = better)
        if beneficial is None:
            self.beneficial = {c: True for c in criteria}
        else:
            self.beneficial = beneficial
        
        self.decision_matrix = None
        self.result = None
    
    def set_decision_matrix(self, matrix: np.ndarray) -> None:
        """
        Set the decision matrix.
        
        Args:
            matrix: m x n matrix where m = alternatives, n = criteria
        """
        if matrix.shape != (len(self.alternatives), len(self.criteria)):
            raise ValueError(f"Matrix shape {matrix.shape} doesn't match "
                           f"({len(self.alternatives)}, {len(self.criteria)})")
        self.decision_matrix = matrix.astype(float)
    
    def normalize_matrix(self) -> np.ndarray:
        """
        Normalize decision matrix using vector normalization.
        
        rij = xij / sqrt(Σ(xij²))
        
        Returns:
            Normalized decision matrix
        """
        if self.decision_matrix is None:
            raise ValueError("Decision matrix not set")
        
        # Vector normalization
        norm_factors = np.sqrt(np.sum(self.decision_matrix ** 2, axis=0))
        
        # Handle zero columns
        norm_factors[norm_factors == 0] = 1
        
        normalized = self.decision_matrix / norm_factors
        return normalized
    
    def apply_weights(self, normalized: np.ndarray) -> np.ndarray:
        """
        Apply weights to normalized matrix.
        
        vij = wj × rij
        
        Args:
            normalized: Normalized decision matrix
            
        Returns:
            Weighted normalized matrix
        """
        weights_array = np.array([self.weights[c] for c in self.criteria])
        return normalized * weights_array
    
    def determine_ideal_solutions(self, weighted: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Determine ideal (A+) and anti-ideal (A-) solutions.
        
        For beneficial criteria: A+ = max, A- = min
        For non-beneficial criteria: A+ = min, A- = max
        
        Args:
            weighted: Weighted normalized matrix
            
        Returns:
            Tuple of (ideal_solution, anti_ideal_solution)
        """
        ideal = np.zeros(len(self.criteria))
        anti_ideal = np.zeros(len(self.criteria))
        
        for j, criterion in enumerate(self.criteria):
            if self.beneficial.get(criterion, True):
                # Higher is better
                ideal[j] = np.max(weighted[:, j])
                anti_ideal[j] = np.min(weighted[:, j])
            else:
                # Lower is better
                ideal[j] = np.min(weighted[:, j])
                anti_ideal[j] = np.max(weighted[:, j])
        
        return ideal, anti_ideal
    
    def calculate_separation(self, weighted: np.ndarray, 
                            ideal: np.ndarray, 
                            anti_ideal: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate separation measures from ideal and anti-ideal solutions.
        
        Si+ = sqrt(Σ(vij - vj+)²)
        Si- = sqrt(Σ(vij - vj-)²)
        
        Returns:
            Tuple of (separation_positive, separation_negative)
        """
        # Euclidean distance from ideal
        sep_positive = np.sqrt(np.sum((weighted - ideal) ** 2, axis=1))
        
        # Euclidean distance from anti-ideal
        sep_negative = np.sqrt(np.sum((weighted - anti_ideal) ** 2, axis=1))
        
        return sep_positive, sep_negative
    
    def calculate_relative_closeness(self, sep_pos: np.ndarray, 
                                     sep_neg: np.ndarray) -> np.ndarray:
        """
        Calculate relative closeness to ideal solution.
        
        Ci = Si- / (Si+ + Si-)
        
        Where 0 <= Ci <= 1, higher is better
        
        Returns:
            Array of relative closeness values
        """
        denominator = sep_pos + sep_neg
        
        # Handle division by zero
        denominator[denominator == 0] = 1
        
        return sep_neg / denominator
    
    def analyze(self) -> TOPSISResult:
        """
        Perform complete TOPSIS analysis.
        
        Returns:
            TOPSISResult with all analysis details
        """
        if self.decision_matrix is None:
            raise ValueError("Decision matrix not set. Call set_decision_matrix first.")
        
        # Step 1: Normalize
        normalized = self.normalize_matrix()
        
        # Step 2: Apply weights
        weighted = self.apply_weights(normalized)
        
        # Step 3: Determine ideal solutions
        ideal, anti_ideal = self.determine_ideal_solutions(weighted)
        
        # Step 4: Calculate separation measures
        sep_pos, sep_neg = self.calculate_separation(weighted, ideal, anti_ideal)
        
        # Step 5: Calculate relative closeness
        closeness = self.calculate_relative_closeness(sep_pos, sep_neg)
        
        # Step 6: Rank alternatives
        rankings = sorted(
            [(alt, cl, i+1) for i, (alt, cl) in enumerate(zip(self.alternatives, closeness))],
            key=lambda x: x[1],
            reverse=True
        )
        
        # Update rank numbers based on sorted order
        rankings = [(alt, cl, rank+1) for rank, (alt, cl, _) in enumerate(rankings)]
        
        self.result = TOPSISResult(
            alternatives=self.alternatives,
            criteria=self.criteria,
            weights=self.weights,
            normalized_matrix=normalized,
            weighted_matrix=weighted,
            ideal_solution=ideal,
            anti_ideal_solution=anti_ideal,
            separation_positive=sep_pos,
            separation_negative=sep_neg,
            relative_closeness=closeness,
            rankings=rankings
        )
        
        return self.result
    
    def get_analysis_report(self) -> Dict:
        """
        Generate comprehensive TOPSIS analysis report.
        
        Returns:
            Dictionary with analysis details
        """
        if self.result is None:
            self.analyze()
        
        return {
            'method': 'TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)',
            'n_alternatives': len(self.alternatives),
            'n_criteria': len(self.criteria),
            'criteria': self.criteria,
            'weights': self.weights,
            'beneficial_criteria': self.beneficial,
            'ideal_solution': {c: v for c, v in zip(self.criteria, self.result.ideal_solution)},
            'anti_ideal_solution': {c: v for c, v in zip(self.criteria, self.result.anti_ideal_solution)},
            'rankings': [
                {'alternative': alt, 'closeness': round(cl, 4), 'rank': rank}
                for alt, cl, rank in self.result.rankings
            ],
            'reference': 'Hwang, C.L. & Yoon, K. (1981). Multiple Attribute Decision Making.'
        }


def topsis_flood_susceptibility(grid_data: Dict[str, np.ndarray]) -> Dict:
    """
    Calculate flood susceptibility using TOPSIS method.
    
    Args:
        grid_data: Dictionary with arrays for each criterion
            - elevation: DEM values (lower = more susceptible)
            - slope: Slope values (lower = more susceptible)
            - drainage_proximity: Distance to streams (lower = more susceptible)
            - land_use: Land use class values (urban = more susceptible)
            - soil_permeability: Permeability values (lower = more susceptible)
    
    Returns:
        TOPSIS analysis results with susceptibility rankings
    """
    criteria = ['elevation', 'slope', 'drainage_proximity', 'land_use', 'soil_permeability']
    
    # Weights from AHP analysis
    weights = {
        'elevation': 0.298,
        'slope': 0.158,
        'drainage_proximity': 0.298,
        'land_use': 0.089,
        'soil_permeability': 0.158
    }
    
    # Define beneficial criteria (higher value = higher susceptibility)
    # For flood: lower elevation, flatter slope, closer to drainage = MORE susceptible
    beneficial = {
        'elevation': False,           # Lower elevation = more susceptible
        'slope': False,               # Flatter = more susceptible
        'drainage_proximity': False,  # Closer to drainage = more susceptible
        'land_use': True,             # Higher urban = more susceptible
        'soil_permeability': False,   # Lower permeability = more susceptible
    }
    
    # Flatten grids to create alternatives
    n_cells = grid_data['elevation'].size
    alternatives = [f"cell_{i}" for i in range(n_cells)]
    
    # Build decision matrix
    decision_matrix = np.column_stack([
        grid_data[c].flatten() for c in criteria
    ])
    
    analyzer = TOPSISAnalyzer(alternatives, criteria, weights, beneficial)
    analyzer.set_decision_matrix(decision_matrix)
    result = analyzer.analyze()
    
    # Reshape closeness values back to grid
    susceptibility_grid = result.relative_closeness.reshape(grid_data['elevation'].shape)
    
    return {
        'method': 'TOPSIS',
        'susceptibility_grid': susceptibility_grid,
        'statistics': {
            'mean': float(np.mean(susceptibility_grid)),
            'std': float(np.std(susceptibility_grid)),
            'min': float(np.min(susceptibility_grid)),
            'max': float(np.max(susceptibility_grid))
        },
        'weights': weights,
        'analysis_details': analyzer.get_analysis_report()
    }


def generate_sample_topsis_analysis() -> Dict:
    """
    Generate sample TOPSIS analysis for demonstration.
    
    Returns:
        Sample analysis results
    """
    # Create sample grid data (10x10 grid)
    np.random.seed(44)
    grid_shape = (10, 10)
    
    grid_data = {
        'elevation': np.random.uniform(150, 300, grid_shape),      # Elevation in meters
        'slope': np.random.uniform(0, 30, grid_shape),             # Slope in degrees
        'drainage_proximity': np.random.uniform(0, 2000, grid_shape),  # Distance in meters
        'land_use': np.random.uniform(1, 5, grid_shape),           # Land use class
        'soil_permeability': np.random.uniform(0.1, 1.0, grid_shape),  # Permeability index
    }
    
    result = topsis_flood_susceptibility(grid_data)
    
    # Add classification
    susceptibility = result['susceptibility_grid']
    classification = np.empty(susceptibility.shape, dtype=object)
    classification[susceptibility < 0.2] = 'Very Low'
    classification[(susceptibility >= 0.2) & (susceptibility < 0.4)] = 'Low'
    classification[(susceptibility >= 0.4) & (susceptibility < 0.6)] = 'Moderate'
    classification[(susceptibility >= 0.6) & (susceptibility < 0.8)] = 'High'
    classification[susceptibility >= 0.8] = 'Very High'
    
    result['classification_grid'] = classification.tolist()
    result['susceptibility_grid'] = result['susceptibility_grid'].tolist()
    
    return result


if __name__ == "__main__":
    print("=" * 60)
    print("TOPSIS Analysis for Flood Susceptibility")
    print("=" * 60)
    
    result = generate_sample_topsis_analysis()
    
    print(f"\nMethod: {result['method']}")
    print(f"\nStatistics:")
    for key, value in result['statistics'].items():
        print(f"  {key}: {value:.4f}")
    
    print(f"\nWeights:")
    for criterion, weight in result['weights'].items():
        print(f"  {criterion}: {weight:.3f}")
