"""
Validation Module for Susceptibility Model Assessment

This module implements validation metrics for evaluating the accuracy
of flood and landslide susceptibility models.

Metrics:
- ROC-AUC (Receiver Operating Characteristic - Area Under Curve)
- Confusion Matrix (TP, TN, FP, FN)
- Accuracy, Precision, Recall, F1-Score
- Kappa Statistic
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Container for validation results."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    specificity: float
    auc: float
    kappa: float
    confusion_matrix: Dict[str, int]
    classification: str  # "Excellent", "Good", "Moderate", "Poor"


class SusceptibilityValidator:
    """
    Validator for susceptibility model outputs.
    
    Compares predicted susceptibility classes with actual hazard occurrences
    to assess model performance.
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
        """
        self.predicted = np.array(predicted_susceptibility).flatten()
        self.actual = np.array(actual_hazards).flatten()
        self.threshold = threshold
        
        if len(self.predicted) != len(self.actual):
            raise ValueError("Predicted and actual arrays must have same length")
    
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
        Calculate AUC using the trapezoidal rule.
        
        This is a simplified AUC calculation. For production use,
        consider using sklearn.metrics.roc_auc_score.
        """
        # Sort by predicted values
        sorted_indices = np.argsort(self.predicted)[::-1]
        sorted_actual = self.actual[sorted_indices]
        
        # Calculate TPR and FPR at each threshold
        n_pos = np.sum(self.actual == 1)
        n_neg = np.sum(self.actual == 0)
        
        if n_pos == 0 or n_neg == 0:
            return 0.5  # Random classifier
        
        tpr_list = []
        fpr_list = []
        
        tp = 0
        fp = 0
        
        for i, actual in enumerate(sorted_actual):
            if actual == 1:
                tp += 1
            else:
                fp += 1
            tpr_list.append(tp / n_pos)
            fpr_list.append(fp / n_neg)
        
        # Add origin point
        tpr_list = [0] + tpr_list
        fpr_list = [0] + fpr_list
        
        # Calculate AUC using trapezoidal rule
        auc = 0.0
        for i in range(1, len(tpr_list)):
            auc += (fpr_list[i] - fpr_list[i-1]) * (tpr_list[i] + tpr_list[i-1]) / 2
        
        return auc
    
    def classify_auc(self, auc: float) -> str:
        """Classify model performance based on AUC value."""
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
    
    def validate(self) -> ValidationResult:
        """Perform complete validation analysis."""
        cm = self.calculate_confusion_matrix()
        accuracy = self.calculate_accuracy(cm)
        precision = self.calculate_precision(cm)
        recall = self.calculate_recall(cm)
        specificity = self.calculate_specificity(cm)
        f1 = self.calculate_f1_score(precision, recall)
        kappa = self.calculate_kappa(cm)
        auc = self.calculate_auc()
        classification = self.classify_auc(auc)
        
        return ValidationResult(
            accuracy=round(accuracy, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            f1_score=round(f1, 4),
            specificity=round(specificity, 4),
            auc=round(auc, 4),
            kappa=round(kappa, 4),
            confusion_matrix=cm,
            classification=classification
        )
    
    def get_validation_report(self) -> Dict:
        """Generate complete validation report as dictionary."""
        result = self.validate()
        
        return {
            'metrics': {
                'accuracy': result.accuracy,
                'precision': result.precision,
                'recall': result.recall,
                'f1_score': result.f1_score,
                'specificity': result.specificity,
                'auc_roc': result.auc,
                'kappa': result.kappa,
            },
            'confusion_matrix': result.confusion_matrix,
            'classification': result.classification,
            'interpretation': self._interpret_results(result),
            'threshold_used': self.threshold,
            'sample_size': len(self.predicted)
        }
    
    def _interpret_results(self, result: ValidationResult) -> Dict[str, str]:
        """Provide interpretation of validation metrics."""
        interpretations = {
            'auc': f"AUC of {result.auc} indicates {result.classification.lower()} predictive capability",
            'accuracy': f"Overall accuracy of {result.accuracy*100:.1f}% correct predictions",
            'recall': f"Model detects {result.recall*100:.1f}% of actual hazard occurrences",
            'precision': f"{result.precision*100:.1f}% of predicted high-risk areas are true hazards",
            'kappa': self._interpret_kappa(result.kappa)
        }
        return interpretations
    
    def _interpret_kappa(self, kappa: float) -> str:
        """Interpret Kappa statistic."""
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
    return validator.get_validation_report()
