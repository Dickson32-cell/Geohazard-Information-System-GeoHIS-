"""
Validation Module for Susceptibility Model Assessment

This module implements validation metrics for evaluating the accuracy
of flood and landslide susceptibility models.

Metrics:
- ROC-AUC (Receiver Operating Characteristic - Area Under Curve)
- Confusion Matrix (TP, TN, FP, FN)
- Accuracy, Precision, Recall, F1-Score
- Kappa Statistic
- Bootstrapped Confidence Intervals

References:
- Hanley, J.A. & McNeil, B.J. (1982). The meaning and use of the area under a 
  receiver operating characteristic (ROC) curve. Radiology, 143(1), 29-36.
- Brenning, A. (2012). Spatial cross-validation and bootstrap for the assessment
  of prediction rules in remote sensing. IEEE Transactions on Geoscience and 
  Remote Sensing, 50(2), 539-547.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional, Generator, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# Attempt to import sklearn metrics - use custom fallback if unavailable
SKLEARN_AVAILABLE = False
try:
    from sklearn.calibration import calibration_curve
    from sklearn.metrics import brier_score_loss, roc_auc_score
    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("scikit-learn not available. Using fallback implementations.")
    calibration_curve = None
    brier_score_loss = None
    roc_auc_score = None


@dataclass
class ValidationResult:
    """Container for validation results with confidence intervals."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    specificity: float
    auc: float
    auc_ci_lower: Optional[float]  # 95% CI lower bound
    auc_ci_upper: Optional[float]  # 95% CI upper bound
    kappa: float
    brier_score: Optional[float]
    calibration_curve: Optional[Dict[str, List[float]]]
    confusion_matrix: Dict[str, int]
    classification: str  # "Excellent", "Good", "Moderate", "Poor"
    n_bootstrap: int  # Number of bootstrap samples used for CI


class SpatialSplitter:
    """
    Handles spatial cross-validation splitting to account for spatial autocorrelation.
    
    Spatial autocorrelation can lead to overly optimistic validation results when
    nearby observations are split between training and test sets. This class
    implements spatial blocking strategies to provide more realistic estimates.
    
    Reference: Roberts et al. (2017). Cross-validation strategies for data with 
    temporal, spatial, hierarchical, or phylogenetic structure. Ecography, 40(8).
    """
    
    def __init__(self, coordinates: np.ndarray, n_splits: int = 5):
        """
        Args:
            coordinates: (N, 2) array of [x, y] coordinates
            n_splits: Number of folds (approximate for spatial split)
        """
        if coordinates.ndim != 2 or coordinates.shape[1] != 2:
            raise ValueError("Coordinates must be (N, 2) array of [x, y] values")
        self.coords = coordinates
        self.n_splits = n_splits
        
    def split_checkerboard(self, grid_size: Tuple[int, int] = (10, 10), 
                           buffer_size: int = 0) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """
        Perform spatial checkerboard splitting with optional buffer.
        
        Args:
            grid_size: Number of grid blocks (rows, cols)
            buffer_size: Number of pixels to buffer between train/test blocks (not implemented yet)
            
        Yields:
            Tuple of (train_indices, test_indices)
        """
        x = self.coords[:, 0]
        y = self.coords[:, 1]
        
        x_min, x_max = x.min(), x.max()
        y_min, y_max = y.min(), y.max()
        
        # Avoid division by zero for points exactly on max edge
        epsilon = 1e-10
        x_bins = np.floor((x - x_min) / (x_max - x_min + epsilon) * grid_size[1]).astype(int)
        y_bins = np.floor((y - y_min) / (y_max - y_min + epsilon) * grid_size[0]).astype(int)
        
        # Create checkerboard pattern using block IDs
        block_ids = y_bins * grid_size[1] + x_bins
        
        for i in range(self.n_splits):
            test_mask = (block_ids % self.n_splits) == i
            train_mask = ~test_mask
            
            train_idx = np.where(train_mask)[0]
            test_idx = np.where(test_mask)[0]
            
            if len(train_idx) == 0 or len(test_idx) == 0:
                logger.warning(f"Fold {i} has empty train or test set, skipping")
                continue
                
            yield train_idx, test_idx

    def split_random(self) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """Standard random split (fallback, not recommended for spatial data)."""
        indices = np.arange(len(self.coords))
        np.random.shuffle(indices)
        fold_size = len(indices) // self.n_splits
        
        for i in range(self.n_splits):
            start = i * fold_size
            end = start + fold_size if i < self.n_splits - 1 else len(indices)
            
            test_idx = indices[start:end]
            train_idx = np.concatenate([indices[:start], indices[end:]])
            
            yield train_idx, test_idx


class SusceptibilityValidator:
    """
    Validator for susceptibility model outputs.
    
    Compares predicted susceptibility classes with actual hazard occurrences
    to assess model performance. Provides bootstrapped confidence intervals
    for robust uncertainty quantification.
    
    Attributes:
        predicted: Array of predicted susceptibility values (0-1)
        actual: Binary array of actual hazard occurrences (0 or 1)
        threshold: Threshold for converting susceptibility to binary prediction
    """
    
    def __init__(self, 
                 predicted_susceptibility: np.ndarray,
                 actual_hazards: np.ndarray,
                 threshold: float = 0.5):
        """
        Initialize validator.
        
        Args:
            predicted_susceptibility: Array of predicted susceptibility values (0-1)
            actual_hazards: Binary array of actual hazard occurrences (0 or 1)
            threshold: Threshold for converting susceptibility to binary prediction
            
        Raises:
            ValueError: If arrays have different lengths or invalid values
        """
        self.predicted = np.array(predicted_susceptibility).flatten()
        self.actual = np.array(actual_hazards).flatten()
        self.threshold = threshold
        
        if len(self.predicted) != len(self.actual):
            raise ValueError("Predicted and actual arrays must have same length")
            
        # Validate input ranges
        if np.any((self.actual != 0) & (self.actual != 1)):
            logger.warning("Actual hazards should be binary (0 or 1). Non-binary values detected.")
    
    def calculate_confusion_matrix(self) -> Dict[str, int]:
        """Calculate confusion matrix components."""
        binary_pred = (self.predicted >= self.threshold).astype(int)
        
        tp = int(np.sum((binary_pred == 1) & (self.actual == 1)))
        tn = int(np.sum((binary_pred == 0) & (self.actual == 0)))
        fp = int(np.sum((binary_pred == 1) & (self.actual == 0)))
        fn = int(np.sum((binary_pred == 0) & (self.actual == 1)))
        
        return {
            'true_positive': tp,
            'true_negative': tn,
            'false_positive': fp,
            'false_negative': fn,
            'total': tp + tn + fp + fn
        }
    
    def calculate_accuracy(self, cm: Dict[str, int]) -> float:
        """Calculate overall accuracy."""
        total = cm['total']
        if total == 0:
            return 0.0
        return (cm['true_positive'] + cm['true_negative']) / total
    
    def calculate_precision(self, cm: Dict[str, int]) -> float:
        """Calculate precision (positive predictive value)."""
        denom = cm['true_positive'] + cm['false_positive']
        if denom == 0:
            return 0.0
        return cm['true_positive'] / denom
    
    def calculate_recall(self, cm: Dict[str, int]) -> float:
        """Calculate recall (sensitivity, true positive rate)."""
        denom = cm['true_positive'] + cm['false_negative']
        if denom == 0:
            return 0.0
        return cm['true_positive'] / denom
    
    def calculate_specificity(self, cm: Dict[str, int]) -> float:
        """Calculate specificity (true negative rate)."""
        denom = cm['true_negative'] + cm['false_positive']
        if denom == 0:
            return 0.0
        return cm['true_negative'] / denom
    
    def calculate_f1_score(self, precision: float, recall: float) -> float:
        """Calculate F1 score (harmonic mean of precision and recall)."""
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)
    
    def calculate_kappa(self, cm: Dict[str, int]) -> float:
        """
        Calculate Cohen's Kappa statistic.
        
        Kappa measures agreement between predicted and actual,
        accounting for chance agreement.
        
        Interpretation (Landis & Koch, 1977):
        - 0.81-1.00: Almost perfect
        - 0.61-0.80: Substantial
        - 0.41-0.60: Moderate
        - 0.21-0.40: Fair
        - 0.00-0.20: Slight
        """
        total = cm['total']
        if total == 0:
            return 0.0
            
        tp, tn = cm['true_positive'], cm['true_negative']
        fp, fn = cm['false_positive'], cm['false_negative']
        
        # Observed agreement
        po = (tp + tn) / total
        
        # Expected agreement
        p_yes = ((tp + fp) / total) * ((tp + fn) / total)
        p_no = ((tn + fn) / total) * ((tn + fp) / total)
        pe = p_yes + p_no
        
        if pe >= 1:
            return 0.0
            
        kappa = (po - pe) / (1 - pe)
        return kappa
    
    def calculate_auc(self) -> float:
        """
        Calculate Area Under the ROC Curve (AUC-ROC).
        
        Uses sklearn's roc_auc_score if available, otherwise falls back
        to a trapezoidal rule implementation.
        
        Returns:
            AUC value between 0 and 1. 0.5 indicates random classifier.
        """
        n_pos = np.sum(self.actual == 1)
        n_neg = np.sum(self.actual == 0)
        
        if n_pos == 0 or n_neg == 0:
            logger.warning("Only one class present in actual values. AUC undefined, returning 0.5")
            return 0.5
        
        # Use sklearn if available (preferred - well-tested implementation)
        if SKLEARN_AVAILABLE and roc_auc_score is not None:
            try:
                return float(roc_auc_score(self.actual, self.predicted))
            except Exception as e:
                logger.warning(f"sklearn roc_auc_score failed: {e}. Using fallback.")
        
        # Fallback: Manual trapezoidal rule implementation
        return self._calculate_auc_manual()
    
    def _calculate_auc_manual(self) -> float:
        """
        Calculate AUC using trapezoidal rule (fallback implementation).
        
        Note: This is provided for environments without sklearn.
        The sklearn implementation is preferred for production use.
        """
        sorted_indices = np.argsort(self.predicted)[::-1]
        sorted_actual = self.actual[sorted_indices]
        
        n_pos = np.sum(self.actual == 1)
        n_neg = np.sum(self.actual == 0)
        
        tpr_list = [0.0]
        fpr_list = [0.0]
        
        tp = 0
        fp = 0
        
        for actual in sorted_actual:
            if actual == 1:
                tp += 1
            else:
                fp += 1
            tpr_list.append(tp / n_pos)
            fpr_list.append(fp / n_neg)
        
        # Calculate AUC using trapezoidal rule
        auc = 0.0
        for i in range(1, len(tpr_list)):
            auc += (fpr_list[i] - fpr_list[i-1]) * (tpr_list[i] + tpr_list[i-1]) / 2

        return auc
    
    def calculate_auc_confidence_interval(self, n_bootstrap: int = 1000, 
                                          confidence: float = 0.95,
                                          random_seed: int = 42) -> Tuple[float, float, float]:
        """
        Calculate bootstrapped confidence interval for AUC.
        
        Uses the percentile bootstrap method to estimate the uncertainty
        in the AUC estimate.
        
        Args:
            n_bootstrap: Number of bootstrap samples (default: 1000)
            confidence: Confidence level (default: 0.95 for 95% CI)
            random_seed: Random seed for reproducibility
            
        Returns:
            Tuple of (auc, lower_ci, upper_ci)
            
        Reference:
            Efron, B. & Tibshirani, R. (1993). An Introduction to the Bootstrap.
        """
        np.random.seed(random_seed)
        n = len(self.predicted)
        
        bootstrap_aucs = []
        for _ in range(n_bootstrap):
            indices = np.random.choice(n, size=n, replace=True)
            
            # Check if bootstrap sample has both classes
            boot_actual = self.actual[indices]
            if len(np.unique(boot_actual)) < 2:
                continue
                
            boot_predicted = self.predicted[indices]
            
            if SKLEARN_AVAILABLE and roc_auc_score is not None:
                try:
                    auc = roc_auc_score(boot_actual, boot_predicted)
                    bootstrap_aucs.append(auc)
                except ValueError:
                    continue
            else:
                # Use manual calculation
                validator = SusceptibilityValidator(boot_predicted, boot_actual, self.threshold)
                bootstrap_aucs.append(validator._calculate_auc_manual())
        
        if len(bootstrap_aucs) < 100:
            logger.warning(f"Only {len(bootstrap_aucs)} valid bootstrap samples. CI may be unreliable.")
        
        alpha = 1 - confidence
        lower = np.percentile(bootstrap_aucs, (alpha / 2) * 100)
        upper = np.percentile(bootstrap_aucs, (1 - alpha / 2) * 100)
        mean_auc = np.mean(bootstrap_aucs)
        
        return mean_auc, lower, upper
    
    def calculate_calibration(self) -> Tuple[Optional[float], Optional[Dict[str, List[float]]]]:
        """
        Calculate Brier Score and Calibration Curve data.
        
        Brier Score: Mean squared difference between predicted probability and actual outcome.
                     Range: 0 to 1. Lower is better. 0 = perfect, 0.25 = random (for 50/50).
        """
        if not SKLEARN_AVAILABLE:
            return None, None
            
        try:
            # Brier Score
            brier = brier_score_loss(self.actual, self.predicted)
            
            # Calibration Curve (Reliability Diagram)
            prob_true, prob_pred = calibration_curve(self.actual, self.predicted, n_bins=10)
            
            calibration_data = {
                'prob_true': prob_true.tolist(),
                'prob_pred': prob_pred.tolist()
            }
            return float(brier), calibration_data
        except Exception as e:
            logger.warning(f"Calibration calculation failed: {e}")
            return None, None

    def classify_auc(self, auc: float) -> str:
        """
        Classify model performance based on AUC value.
        
        Classification based on Hosmer & Lemeshow (2000):
        - >= 0.9: Excellent (Outstanding discrimination)
        - >= 0.8: Good (Acceptable discrimination)
        - >= 0.7: Acceptable (Fair discrimination)  
        - >= 0.6: Poor (Weak discrimination)
        - < 0.6: Fail (No discrimination)
        """
        if auc >= 0.9:
            return "Excellent"
        elif auc >= 0.8:
            return "Good"
        elif auc >= 0.7:
            return "Acceptable"
        elif auc >= 0.6:
            return "Poor"
        else:
            return "Fail"

    def validate(self, n_bootstrap: int = 1000) -> ValidationResult:
        """
        Perform complete validation analysis with confidence intervals.
        
        Args:
            n_bootstrap: Number of bootstrap samples for CI estimation
        """
        cm = self.calculate_confusion_matrix()
        accuracy = self.calculate_accuracy(cm)
        precision = self.calculate_precision(cm)
        recall = self.calculate_recall(cm)
        specificity = self.calculate_specificity(cm)
        f1 = self.calculate_f1_score(precision, recall)
        kappa = self.calculate_kappa(cm)
        
        # Calculate AUC with confidence intervals
        auc, auc_lower, auc_upper = self.calculate_auc_confidence_interval(n_bootstrap)
        
        classification = self.classify_auc(auc)
        brier, cal_curve = self.calculate_calibration()
        
        return ValidationResult(
            accuracy=round(accuracy, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            f1_score=round(f1, 4),
            specificity=round(specificity, 4),
            auc=round(auc, 4),
            auc_ci_lower=round(auc_lower, 4),
            auc_ci_upper=round(auc_upper, 4),
            kappa=round(kappa, 4),
            brier_score=round(brier, 4) if brier is not None else None,
            calibration_curve=cal_curve,
            confusion_matrix=cm,
            classification=classification,
            n_bootstrap=n_bootstrap
        )
    
    def get_validation_report(self, n_bootstrap: int = 1000) -> Dict:
        """Generate complete validation report as dictionary."""
        result = self.validate(n_bootstrap)
        
        return {
            'metrics': {
                'accuracy': result.accuracy,
                'precision': result.precision,
                'recall': result.recall,
                'f1_score': result.f1_score,
                'specificity': result.specificity,
                'auc_roc': result.auc,
                'auc_ci_95': {
                    'lower': result.auc_ci_lower,
                    'upper': result.auc_ci_upper
                },
                'kappa': result.kappa,
                'brier_score': result.brier_score,
            },
            'calibration_curve': result.calibration_curve,
            'confusion_matrix': result.confusion_matrix,
            'classification': result.classification,
            'interpretation': self._interpret_results(result),
            'threshold_used': self.threshold,
            'sample_size': len(self.predicted),
            'n_bootstrap': result.n_bootstrap,
            'sklearn_available': SKLEARN_AVAILABLE
        }
    
    def _interpret_results(self, result: ValidationResult) -> Dict[str, str]:
        """Provide interpretation of validation metrics."""
        
        brier_interp = "Not available (sklearn required)"
        if result.brier_score is not None:
            if result.brier_score < 0.1:
                brier_interp = f"Brier score {result.brier_score} indicates excellent reliability"
            elif result.brier_score < 0.25:
                brier_interp = f"Brier score {result.brier_score} indicates acceptable reliability"
            else:
                brier_interp = f"Brier score {result.brier_score} indicates poor calibration"

        ci_text = ""
        if result.auc_ci_lower is not None and result.auc_ci_upper is not None:
            ci_text = f" (95% CI: {result.auc_ci_lower}-{result.auc_ci_upper})"

        interpretations = {
            'auc': f"AUC of {result.auc}{ci_text} indicates {result.classification.lower()} predictive capability",
            'accuracy': f"Overall accuracy of {result.accuracy*100:.1f}% correct predictions",
            'recall': f"Model detects {result.recall*100:.1f}% of actual hazard occurrences (sensitivity)",
            'precision': f"{result.precision*100:.1f}% of predicted high-risk areas are true hazards",
            'specificity': f"Model correctly identifies {result.specificity*100:.1f}% of non-hazard areas",
            'kappa': self._interpret_kappa(result.kappa),
            'reliability': brier_interp
        }
        return interpretations

    
    def _interpret_kappa(self, kappa: float) -> str:
        """Interpret Kappa statistic (Landis & Koch, 1977)."""
        if kappa >= 0.81:
            return f"Kappa of {kappa} indicates almost perfect agreement"
        elif kappa >= 0.61:
            return f"Kappa of {kappa} indicates substantial agreement"
        elif kappa >= 0.41:
            return f"Kappa of {kappa} indicates moderate agreement"
        elif kappa >= 0.21:
            return f"Kappa of {kappa} indicates fair agreement"
        else:
            return f"Kappa of {kappa} indicates slight agreement"


def generate_sample_validation() -> Dict:
    """
    Generate sample validation results for demonstration.
    
    Simulates validation with synthetic data typical of a moderate-quality model.
    """
    np.random.seed(42)
    
    # Generate synthetic data
    n_samples = 1000
    
    # Simulated susceptibility predictions (0-1)
    predicted = np.random.beta(2, 3, n_samples)  # Skewed toward lower values
    
    # Simulated actual hazards (correlated with predictions + noise)
    prob_hazard = predicted * 0.7 + np.random.uniform(0, 0.3, n_samples)
    actual = (prob_hazard > 0.5).astype(int)
    
    # Validate
    validator = SusceptibilityValidator(predicted, actual, threshold=0.4)
    return validator.get_validation_report(n_bootstrap=500)
