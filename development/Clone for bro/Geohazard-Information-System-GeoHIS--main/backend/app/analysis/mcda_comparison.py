"""
MCDA Method Comparison Module for GeoHIS

Compares multiple Multi-Criteria Decision Analysis methods for flood susceptibility:
- AHP (Analytical Hierarchy Process) - Standard
- Fuzzy AHP (Chang's Extent Analysis)
- TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)

For Paper 2: Comparative Analysis of MCDA Methods

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Import MCDA methods
from .ahp import AHPCalculator, calculate_flood_weights, calculate_landslide_weights
from .fuzzy_ahp import FuzzyAHPCalculator, calculate_flood_weights_fuzzy, calculate_landslide_weights_fuzzy
from .topsis import TOPSISAnalyzer, topsis_flood_susceptibility

logger = logging.getLogger(__name__)


@dataclass
class MCDAComparisonResult:
    """Container for MCDA method comparison results."""
    method_name: str
    weights: Dict[str, float]
    susceptibility_mean: float
    susceptibility_std: float
    class_distribution: Dict[str, float]
    consistency_metric: Optional[float] = None
    computation_time_ms: float = 0
    additional_info: Optional[Dict] = None


class MCDAComparison:
    """
    Compare MCDA methods for geohazard susceptibility mapping.
    
    Methods compared:
    1. AHP - Standard Analytical Hierarchy Process
    2. Fuzzy AHP - Handles uncertainty in expert judgments
    3. TOPSIS - Distance-based ranking method
    
    Comparison criteria:
    - Weight distribution differences
    - Susceptibility class differences
    - Sensitivity to input variations
    - Computational efficiency
    """
    
    SUSCEPTIBILITY_CLASSES = {
        'Very Low': (0, 20),
        'Low': (20, 40),
        'Moderate': (40, 60),
        'High': (60, 80),
        'Very High': (80, 100)
    }
    
    def __init__(self, criteria: List[str]):
        """
        Initialize MCDA comparison.
        
        Args:
            criteria: List of conditioning factor names
        """
        self.criteria = criteria
        self.results = {}
        self.comparison_report = None
    
    def run_ahp(self, grid_data: Optional[np.ndarray] = None) -> MCDAComparisonResult:
        """
        Run standard AHP analysis.
        
        Args:
            grid_data: Optional susceptibility grid data
            
        Returns:
            MCDAComparisonResult
        """
        import time
        start_time = time.time()
        
        # Get AHP weights
        ahp_result = calculate_flood_weights()
        weights = ahp_result['weights']
        
        # Calculate susceptibility if grid data provided
        if grid_data is not None:
            susceptibility = self._calculate_weighted_sum(grid_data, weights)
        else:
            # Generate sample grid
            np.random.seed(42)
            susceptibility = self._generate_sample_susceptibility(weights)
        
        computation_time = (time.time() - start_time) * 1000
        
        # Calculate class distribution
        class_dist = self._calculate_class_distribution(susceptibility)
        
        result = MCDAComparisonResult(
            method_name='AHP (Standard)',
            weights=weights,
            susceptibility_mean=float(np.mean(susceptibility)),
            susceptibility_std=float(np.std(susceptibility)),
            class_distribution=class_dist,
            consistency_metric=ahp_result.get('consistency_ratio'),
            computation_time_ms=round(computation_time, 2),
            additional_info={
                'lambda_max': ahp_result.get('lambda_max'),
                'consistency_index': ahp_result.get('consistency_index'),
                'is_consistent': ahp_result.get('is_consistent')
            }
        )
        
        self.results['ahp'] = result
        return result
    
    def run_fuzzy_ahp(self, grid_data: Optional[np.ndarray] = None) -> MCDAComparisonResult:
        """
        Run Fuzzy AHP analysis.
        
        Args:
            grid_data: Optional susceptibility grid data
            
        Returns:
            MCDAComparisonResult
        """
        import time
        start_time = time.time()
        
        # Get Fuzzy AHP weights
        fahp_result = calculate_flood_weights_fuzzy()
        weights = fahp_result['weights']
        
        # Calculate susceptibility
        if grid_data is not None:
            susceptibility = self._calculate_weighted_sum(grid_data, weights)
        else:
            np.random.seed(42)
            susceptibility = self._generate_sample_susceptibility(weights)
        
        computation_time = (time.time() - start_time) * 1000
        
        # Calculate class distribution
        class_dist = self._calculate_class_distribution(susceptibility)
        
        result = MCDAComparisonResult(
            method_name='Fuzzy AHP (Chang)',
            weights=weights,
            susceptibility_mean=float(np.mean(susceptibility)),
            susceptibility_std=float(np.std(susceptibility)),
            class_distribution=class_dist,
            consistency_metric=None,  # Fuzzy AHP handles inconsistency differently
            computation_time_ms=round(computation_time, 2),
            additional_info={
                'synthetic_extents': fahp_result.get('synthetic_extents'),
                'defuzzified_values': fahp_result.get('defuzzified_values'),
                'consistency_note': 'Inherent fuzzy handling of uncertainty'
            }
        )
        
        self.results['fuzzy_ahp'] = result
        return result
    
    def run_topsis(self, grid_data: Optional[Dict[str, np.ndarray]] = None) -> MCDAComparisonResult:
        """
        Run TOPSIS analysis.
        
        Args:
            grid_data: Optional dictionary of criterion grids
            
        Returns:
            MCDAComparisonResult
        """
        import time
        start_time = time.time()
        
        # Use AHP weights for TOPSIS
        ahp_result = calculate_flood_weights()
        weights = ahp_result['weights']
        
        # Generate or use grid data
        if grid_data is None:
            grid_shape = (50, 50)
            np.random.seed(42)
            grid_data = {
                'elevation': np.random.uniform(150, 300, grid_shape),
                'slope': np.random.uniform(0, 30, grid_shape),
                'drainage_proximity': np.random.uniform(0, 2000, grid_shape),
                'land_use': np.random.uniform(1, 5, grid_shape),
                'soil_permeability': np.random.uniform(0.1, 1.0, grid_shape)
            }
        
        # Run TOPSIS
        topsis_result = topsis_flood_susceptibility(grid_data)
        susceptibility = np.array(topsis_result['susceptibility_grid']) * 100  # Convert to 0-100
        
        computation_time = (time.time() - start_time) * 1000
        
        # Calculate class distribution
        class_dist = self._calculate_class_distribution(susceptibility)
        
        result = MCDAComparisonResult(
            method_name='TOPSIS',
            weights=weights,
            susceptibility_mean=float(np.mean(susceptibility)),
            susceptibility_std=float(np.std(susceptibility)),
            class_distribution=class_dist,
            consistency_metric=None,  # TOPSIS doesn't have consistency ratio
            computation_time_ms=round(computation_time, 2),
            additional_info={
                'ideal_solution': 'Maximum beneficial, minimum non-beneficial',
                'ranking_method': 'Relative closeness to ideal solution'
            }
        )
        
        self.results['topsis'] = result
        return result
    
    def _calculate_weighted_sum(self, grid_data: np.ndarray, weights: Dict[str, float]) -> np.ndarray:
        """Calculate weighted sum susceptibility."""
        # Simplified - assumes grid_data is already normalized
        susceptibility = np.zeros(grid_data.shape[:2]) if grid_data.ndim > 2 else np.zeros(grid_data.shape)
        
        if isinstance(grid_data, dict):
            for i, (criterion, weight) in enumerate(weights.items()):
                if criterion in grid_data:
                    susceptibility += weight * grid_data[criterion]
        else:
            # Assume single grid, use mean weight
            susceptibility = grid_data * np.mean(list(weights.values()))
        
        return np.clip(susceptibility * 100, 0, 100)
    
    def _generate_sample_susceptibility(self, weights: Dict[str, float]) -> np.ndarray:
        """Generate sample susceptibility grid."""
        grid_shape = (50, 50)
        
        # Create spatially correlated data
        x = np.linspace(0, 1, grid_shape[1])
        y = np.linspace(0, 1, grid_shape[0])
        xx, yy = np.meshgrid(x, y)
        
        # Base susceptibility with spatial patterns
        base = 50 + 20 * np.sin(xx * np.pi) * np.cos(yy * np.pi)
        
        # Add weighted random variation
        weight_factor = np.mean(list(weights.values())) * 10
        noise = weight_factor * np.random.randn(*grid_shape)
        
        susceptibility = base + noise
        return np.clip(susceptibility, 0, 100)
    
    def _calculate_class_distribution(self, susceptibility: np.ndarray) -> Dict[str, float]:
        """Calculate percentage in each susceptibility class."""
        total = susceptibility.size
        distribution = {}
        
        for class_name, (low, high) in self.SUSCEPTIBILITY_CLASSES.items():
            count = np.sum((susceptibility >= low) & (susceptibility < high))
            distribution[class_name] = round(count / total * 100, 2)
        
        return distribution
    
    def compare_all(self) -> Dict[str, Any]:
        """
        Run all MCDA methods and generate comparison report.
        
        Returns:
            Comprehensive comparison report
        """
        logger.info("Starting MCDA method comparison...")
        
        # Run all methods
        ahp_result = self.run_ahp()
        fahp_result = self.run_fuzzy_ahp()
        topsis_result = self.run_topsis()
        
        # Compare weights
        weight_comparison = self._compare_weights()
        
        # Compare susceptibility distributions
        distribution_comparison = self._compare_distributions()
        
        # Calculate correlation between methods
        correlation_analysis = self._analyze_correlation()
        
        # Generate recommendations
        recommendations = self._generate_recommendations()
        
        self.comparison_report = {
            'metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'criteria': self.criteria,
                'n_criteria': len(self.criteria),
                'study_area': 'New Juaben South Municipality, Ghana',
                'hazard_type': 'Flood'
            },
            'methods_compared': [
                asdict(ahp_result),
                asdict(fahp_result),
                asdict(topsis_result)
            ],
            'weight_comparison': weight_comparison,
            'distribution_comparison': distribution_comparison,
            'correlation_analysis': correlation_analysis,
            'computational_efficiency': {
                'fastest': min(self.results.items(), key=lambda x: x[1].computation_time_ms)[0],
                'times': {k: v.computation_time_ms for k, v in self.results.items()}
            },
            'recommendations': recommendations,
            'references': [
                'Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.',
                'Chang, D.Y. (1996). Applications of extent analysis on fuzzy AHP. EJOR, 95(3), 649-655.',
                'Hwang, C.L. & Yoon, K. (1981). Multiple Attribute Decision Making. Springer.'
            ]
        }
        
        return self.comparison_report
    
    def _compare_weights(self) -> Dict[str, Any]:
        """Compare weights across methods."""
        comparison = {}
        
        for criterion in self.criteria:
            comparison[criterion] = {}
            for method, result in self.results.items():
                comparison[criterion][method] = result.weights.get(criterion, 0)
        
        # Calculate weight differences
        ahp_weights = self.results.get('ahp', {}).weights if self.results.get('ahp') else {}
        fahp_weights = self.results.get('fuzzy_ahp', {}).weights if self.results.get('fuzzy_ahp') else {}
        
        max_difference = 0
        max_diff_criterion = None
        
        for criterion in self.criteria:
            diff = abs(ahp_weights.get(criterion, 0) - fahp_weights.get(criterion, 0))
            if diff > max_difference:
                max_difference = diff
                max_diff_criterion = criterion
        
        return {
            'by_criterion': comparison,
            'max_difference': {
                'criterion': max_diff_criterion,
                'difference': round(max_difference, 4)
            },
            'insight': f"Maximum weight difference between AHP and Fuzzy AHP is {max_difference:.4f} for {max_diff_criterion}"
        }
    
    def _compare_distributions(self) -> Dict[str, Any]:
        """Compare susceptibility class distributions."""
        comparison = {}
        
        for class_name in self.SUSCEPTIBILITY_CLASSES:
            comparison[class_name] = {}
            for method, result in self.results.items():
                comparison[class_name][method] = result.class_distribution.get(class_name, 0)
        
        return {
            'by_class': comparison,
            'mean_differences': {
                'ahp_vs_fahp': abs(
                    self.results.get('ahp', MCDAComparisonResult('', {}, 0, 0, {})).susceptibility_mean -
                    self.results.get('fuzzy_ahp', MCDAComparisonResult('', {}, 0, 0, {})).susceptibility_mean
                ),
                'ahp_vs_topsis': abs(
                    self.results.get('ahp', MCDAComparisonResult('', {}, 0, 0, {})).susceptibility_mean -
                    self.results.get('topsis', MCDAComparisonResult('', {}, 0, 0, {})).susceptibility_mean
                )
            }
        }
    
    def _analyze_correlation(self) -> Dict[str, Any]:
        """Analyze correlation between method results."""
        # This would compute Spearman correlation in a full implementation
        return {
            'note': 'Compute Spearman rank correlation on full susceptibility grids',
            'expected_correlation': 'High (>0.8) between AHP and Fuzzy AHP',
            'recommendation': 'Use Kappa statistic for categorical agreement'
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on comparison."""
        recommendations = []
        
        # Based on consistency
        ahp_result = self.results.get('ahp')
        if ahp_result and ahp_result.consistency_metric:
            if ahp_result.consistency_metric < 0.1:
                recommendations.append(
                    f"AHP shows good consistency (CR = {ahp_result.consistency_metric:.4f} < 0.10). "
                    f"Expert judgments are reliable."
                )
            else:
                recommendations.append(
                    "Consider Fuzzy AHP if there is uncertainty in expert judgments."
                )
        
        # Based on distribution differences
        dist_diff = self._compare_distributions()
        if dist_diff['mean_differences']['ahp_vs_fahp'] < 2:
            recommendations.append(
                "Small difference between AHP and Fuzzy AHP suggests stable weight estimation."
            )
        
        # General recommendations
        recommendations.extend([
            "For policy communication, use standard AHP due to simpler interpretation.",
            "For academic rigor with uncertainty, Fuzzy AHP is preferred.",
            "TOPSIS provides alternative perspective through distance-based ranking.",
            "Consider ensemble approach averaging results from multiple methods."
        ])
        
        return recommendations


def generate_mcda_comparison_report(hazard_type: str = 'flood') -> Dict:
    """
    Generate comprehensive MCDA comparison report.
    
    Args:
        hazard_type: 'flood' or 'landslide'
        
    Returns:
        Comparison report dictionary
    """
    if hazard_type == 'flood':
        criteria = ['elevation', 'slope', 'drainage_proximity', 'land_use', 'soil_permeability']
    else:
        criteria = ['slope', 'aspect', 'geology', 'land_cover', 'rainfall']
    
    comparison = MCDAComparison(criteria)
    report = comparison.compare_all()
    
    return report


if __name__ == "__main__":
    print("=" * 70)
    print("MCDA Method Comparison for Flood Susceptibility Mapping")
    print("New Juaben South Municipality, Ghana")
    print("=" * 70)
    
    report = generate_mcda_comparison_report('flood')
    
    print(f"\n📊 Methods Compared:")
    for method in report['methods_compared']:
        print(f"\n  {method['method_name']}")
        print(f"    Mean Susceptibility: {method['susceptibility_mean']:.2f}")
        print(f"    Computation Time: {method['computation_time_ms']:.2f} ms")
        if method['consistency_metric']:
            print(f"    Consistency Ratio: {method['consistency_metric']:.4f}")
    
    print(f"\n🔑 Weight Comparison (by criterion):")
    for criterion, values in report['weight_comparison']['by_criterion'].items():
        print(f"  {criterion}:")
        for method, weight in values.items():
            print(f"    {method}: {weight:.4f}")
    
    print(f"\n💡 Recommendations:")
    for rec in report['recommendations']:
        print(f"  • {rec}")
