"""
Model Comparison Framework for GeoHIS

Comprehensive framework for comparing susceptibility mapping methods
with statistical tests and publication-ready outputs.

References:
- Chung, C.J. & Fabbri, A.G. (2003). Validation of spatial prediction models.
- DeLong, E.R. et al. (1988). Comparing ROC curves.

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

try:
    from sklearn.metrics import (roc_auc_score, roc_curve, precision_recall_curve,
                                 auc, accuracy_score, precision_score, recall_score,
                                 f1_score, cohen_kappa_score, confusion_matrix, 
                                 brier_score_loss)
    import scipy.stats as stats
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


@dataclass
class ComprehensiveMetrics:
    model_name: str
    accuracy: float
    balanced_accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    auc_roc: float
    auc_pr: float
    brier_score: float
    kappa: float
    success_rate_auc: float
    auc_ci_lower: float
    auc_ci_upper: float


@dataclass
class StatisticalTest:
    test_name: str
    model_a: str
    model_b: str
    statistic: float
    p_value: float
    significant: bool
    winner: Optional[str]


class ModelComparator:
    def __init__(self, hazard_type: str = "landslide"):
        self.hazard_type = hazard_type
        self.models = {}
        self.predictions = {}
        self.probabilities = {}
        self.y_true = None
    
    def register_model(self, model_name: str, predictions: np.ndarray,
                       probabilities: np.ndarray, model_type: str = "unknown") -> None:
        self.models[model_name] = {'type': model_type}
        self.predictions[model_name] = np.array(predictions)
        self.probabilities[model_name] = np.array(probabilities)
        logger.info(f"Registered model '{model_name}'")
    
    def set_ground_truth(self, y_true: np.ndarray) -> None:
        self.y_true = np.array(y_true)
    
    def calculate_metrics(self, model_name: str) -> ComprehensiveMetrics:
        if self.y_true is None:
            raise ValueError("Ground truth not set")
        
        y_pred = self.predictions[model_name]
        y_prob = self.probabilities[model_name]
        
        cm = confusion_matrix(self.y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        accuracy = accuracy_score(self.y_true, y_pred)
        balanced_acc = ((tp/(tp+fn)) + (tn/(tn+fp))) / 2 if (tp+fn) > 0 and (tn+fp) > 0 else 0
        precision = precision_score(self.y_true, y_pred, zero_division=0)
        recall = recall_score(self.y_true, y_pred, zero_division=0)
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        f1 = f1_score(self.y_true, y_pred, zero_division=0)
        
        auc_roc = roc_auc_score(self.y_true, y_prob)
        prec, rec, _ = precision_recall_curve(self.y_true, y_prob)
        auc_pr = auc(rec, prec)
        brier = brier_score_loss(self.y_true, y_prob)
        kappa = cohen_kappa_score(self.y_true, y_pred)
        
        sr_auc = self._success_rate_auc(y_prob)
        ci_lower, ci_upper = self._bootstrap_auc_ci(y_prob)
        
        return ComprehensiveMetrics(
            model_name=model_name, accuracy=round(accuracy, 4),
            balanced_accuracy=round(balanced_acc, 4), precision=round(precision, 4),
            recall=round(recall, 4), specificity=round(specificity, 4),
            f1_score=round(f1, 4), auc_roc=round(auc_roc, 4),
            auc_pr=round(auc_pr, 4), brier_score=round(brier, 4),
            kappa=round(kappa, 4), success_rate_auc=round(sr_auc, 4),
            auc_ci_lower=round(ci_lower, 4), auc_ci_upper=round(ci_upper, 4)
        )
    
    def _success_rate_auc(self, y_prob: np.ndarray) -> float:
        sorted_idx = np.argsort(y_prob)[::-1]
        sorted_y = self.y_true[sorted_idx]
        n = len(sorted_y)
        total_hazards = np.sum(self.y_true)
        if total_hazards == 0:
            return 0.5
        cum_area = np.arange(1, n + 1) / n
        cum_hazards = np.cumsum(sorted_y) / total_hazards
        return np.trapz(cum_hazards, cum_area)
    
    def _bootstrap_auc_ci(self, y_prob: np.ndarray, n_bootstrap: int = 1000) -> Tuple[float, float]:
        np.random.seed(42)
        aucs = []
        n = len(self.y_true)
        for _ in range(n_bootstrap):
            idx = np.random.choice(n, size=n, replace=True)
            if len(np.unique(self.y_true[idx])) < 2:
                continue
            aucs.append(roc_auc_score(self.y_true[idx], y_prob[idx]))
        if len(aucs) < 100:
            return 0.0, 1.0
        return np.percentile(aucs, 2.5), np.percentile(aucs, 97.5)
    
    def delong_test(self, model_a: str, model_b: str) -> StatisticalTest:
        prob_a = self.probabilities[model_a]
        prob_b = self.probabilities[model_b]
        auc_a = roc_auc_score(self.y_true, prob_a)
        auc_b = roc_auc_score(self.y_true, prob_b)
        
        se_a = self._auc_se(prob_a)
        se_b = self._auc_se(prob_b)
        r = np.corrcoef(prob_a, prob_b)[0, 1]
        
        se_diff = np.sqrt(se_a**2 + se_b**2 - 2*r*se_a*se_b)
        z = (auc_a - auc_b) / se_diff if se_diff > 0 else 0
        p_value = 2 * (1 - stats.norm.cdf(abs(z)))
        
        significant = p_value < 0.05
        winner = model_a if auc_a > auc_b else model_b if auc_b > auc_a else None
        
        return StatisticalTest(
            test_name="DeLong", model_a=model_a, model_b=model_b,
            statistic=round(z, 4), p_value=round(p_value, 4),
            significant=significant, winner=winner if significant else None
        )
    
    def _auc_se(self, y_prob: np.ndarray, n_bootstrap: int = 500) -> float:
        np.random.seed(42)
        aucs = []
        n = len(self.y_true)
        for _ in range(n_bootstrap):
            idx = np.random.choice(n, size=n, replace=True)
            if len(np.unique(self.y_true[idx])) < 2:
                continue
            aucs.append(roc_auc_score(self.y_true[idx], y_prob[idx]))
        return np.std(aucs) if aucs else 0.1
    
    def mcnemar_test(self, model_a: str, model_b: str) -> StatisticalTest:
        pred_a = self.predictions[model_a]
        pred_b = self.predictions[model_b]
        
        b = np.sum((pred_a == self.y_true) & (pred_b != self.y_true))
        c = np.sum((pred_a != self.y_true) & (pred_b == self.y_true))
        
        if b + c > 0:
            chi2 = ((abs(b - c) - 1) ** 2) / (b + c)
            p_value = 1 - stats.chi2.cdf(chi2, 1)
        else:
            chi2, p_value = 0, 1.0
        
        significant = p_value < 0.05
        acc_a = accuracy_score(self.y_true, pred_a)
        acc_b = accuracy_score(self.y_true, pred_b)
        winner = model_a if acc_a > acc_b else model_b if acc_b > acc_a else None
        
        return StatisticalTest(
            test_name="McNemar", model_a=model_a, model_b=model_b,
            statistic=round(chi2, 4), p_value=round(p_value, 4),
            significant=significant, winner=winner if significant else None
        )
    
    def compare_all(self) -> Dict[str, Any]:
        if self.y_true is None:
            raise ValueError("Ground truth not set")
        if len(self.models) < 2:
            raise ValueError("At least 2 models required")
        
        model_names = list(self.models.keys())
        
        metrics = {name: self.calculate_metrics(name) for name in model_names}
        
        tests = []
        for i, model_a in enumerate(model_names):
            for model_b in model_names[i+1:]:
                tests.append(self.delong_test(model_a, model_b))
                tests.append(self.mcnemar_test(model_a, model_b))
        
        ranking = sorted([(name, metrics[name].auc_roc) for name in model_names],
                        key=lambda x: x[1], reverse=True)
        
        summary_data = []
        for name in model_names:
            m = metrics[name]
            summary_data.append({
                'Model': name, 'AUC-ROC': m.auc_roc, 'AUC-PR': m.auc_pr,
                'Accuracy': m.accuracy, 'Recall': m.recall, 'Precision': m.precision,
                'F1': m.f1_score, 'Kappa': m.kappa, 'AUSRC': m.success_rate_auc
            })
        
        summary_df = pd.DataFrame(summary_data).sort_values('AUC-ROC', ascending=False)
        
        return {
            'n_models': len(model_names), 'n_samples': len(self.y_true),
            'model_names': model_names,
            'metrics': {name: asdict(m) for name, m in metrics.items()},
            'statistical_tests': [asdict(t) for t in tests],
            'ranking': ranking, 'best_model': ranking[0][0],
            'summary_table': summary_df.to_dict('records'),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_latex_table(self) -> str:
        result = self.compare_all()
        lines = [
            r"\begin{table}[htbp]", r"\centering",
            r"\caption{Model Comparison Results}", r"\begin{tabular}{lccccccc}",
            r"\hline",
            r"\textbf{Model} & \textbf{AUC} & \textbf{Acc} & \textbf{Recall} & \textbf{Prec} & \textbf{F1} & \textbf{Kappa} \\",
            r"\hline"
        ]
        for row in result['summary_table']:
            lines.append(f"{row['Model']} & {row['AUC-ROC']:.3f} & {row['Accuracy']:.3f} & "
                        f"{row['Recall']:.3f} & {row['Precision']:.3f} & {row['F1']:.3f} & "
                        f"{row['Kappa']:.3f} \\\\")
        lines.extend([r"\hline", r"\end{tabular}", r"\end{table}"])
        return "\n".join(lines)
