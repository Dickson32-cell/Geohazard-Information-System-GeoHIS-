"""
Ensemble Methods Module for Geohazard Susceptibility Mapping

Implements model ensemble techniques including voting, stacking,
and weighted averaging for improved susceptibility predictions.

References:
- Dietterich, T.G. (2000). Ensemble methods in machine learning.
- Pham, B.T. et al. (2019). Ensemble modeling of landslide susceptibility.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

try:
    from sklearn.ensemble import VotingClassifier, StackingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                                 f1_score, roc_auc_score, confusion_matrix)
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


@dataclass
class EnsembleMetrics:
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    confusion_matrix: List[List[int]]
    cross_val_mean: float
    cross_val_std: float
    individual_model_weights: Optional[Dict[str, float]] = None


class EnsembleModel:
    """
    Ensemble model combining multiple susceptibility models.
    
    Supports:
    - Soft Voting: Average probabilities
    - Hard Voting: Majority vote
    - Weighted Voting: Custom weights per model
    - Stacking: Meta-learner approach
    """
    
    def __init__(self, ensemble_type: str = 'soft_voting'):
        """
        Initialize ensemble model.
        
        Args:
            ensemble_type: 'soft_voting', 'hard_voting', 'weighted', 'stacking'
        """
        self.ensemble_type = ensemble_type
        self.models = {}
        self.weights = {}
        self.predictions = {}
        self.probabilities = {}
        self.is_trained = False
        self.metrics = None
    
    def add_model(self, model_name: str, model: Any, weight: float = 1.0) -> None:
        """Add a trained model to the ensemble."""
        self.models[model_name] = model
        self.weights[model_name] = weight
        logger.info(f"Added model '{model_name}' with weight {weight}")
    
    def add_predictions(self, model_name: str, predictions: np.ndarray,
                        probabilities: np.ndarray, weight: float = 1.0) -> None:
        """Add pre-computed predictions from a model."""
        self.predictions[model_name] = np.array(predictions)
        self.probabilities[model_name] = np.array(probabilities)
        self.weights[model_name] = weight
    
    def predict_soft_voting(self) -> Tuple[np.ndarray, np.ndarray]:
        """Soft voting: Average probabilities across models."""
        if not self.probabilities:
            raise ValueError("No model probabilities available")
        
        probs = list(self.probabilities.values())
        weights = [self.weights[name] for name in self.probabilities.keys()]
        
        # Weighted average of probabilities
        total_weight = sum(weights)
        weighted_probs = np.zeros_like(probs[0])
        for prob, w in zip(probs, weights):
            weighted_probs += prob * (w / total_weight)
        
        predictions = (weighted_probs >= 0.5).astype(int)
        return predictions, weighted_probs
    
    def predict_hard_voting(self) -> Tuple[np.ndarray, np.ndarray]:
        """Hard voting: Majority vote across models."""
        if not self.predictions:
            raise ValueError("No model predictions available")
        
        preds = np.array(list(self.predictions.values()))
        
        # Majority vote
        predictions = (np.mean(preds, axis=0) >= 0.5).astype(int)
        
        # Confidence based on agreement
        confidence = np.mean(preds == predictions, axis=0)
        
        return predictions, confidence
    
    def predict_weighted_voting(self) -> Tuple[np.ndarray, np.ndarray]:
        """Weighted voting using custom weights."""
        return self.predict_soft_voting()  # Same as soft with weights
    
    def predict(self) -> Tuple[np.ndarray, np.ndarray]:
        """Make ensemble predictions based on ensemble type."""
        if self.ensemble_type in ['soft_voting', 'weighted']:
            return self.predict_soft_voting()
        elif self.ensemble_type == 'hard_voting':
            return self.predict_hard_voting()
        else:
            return self.predict_soft_voting()
    
    def evaluate(self, y_true: np.ndarray, cv_folds: int = 5) -> EnsembleMetrics:
        """Evaluate ensemble performance."""
        predictions, probabilities = self.predict()
        
        accuracy = accuracy_score(y_true, predictions)
        precision = precision_score(y_true, predictions, zero_division=0)
        recall = recall_score(y_true, predictions, zero_division=0)
        f1 = f1_score(y_true, predictions, zero_division=0)
        auc = roc_auc_score(y_true, probabilities)
        cm = confusion_matrix(y_true, predictions)
        
        # Calculate cross-validation using bootstrap
        np.random.seed(42)
        cv_scores = []
        n = len(y_true)
        for _ in range(cv_folds):
            idx = np.random.choice(n, size=n, replace=True)
            if len(np.unique(y_true[idx])) < 2:
                continue
            cv_scores.append(roc_auc_score(y_true[idx], probabilities[idx]))
        
        self.metrics = EnsembleMetrics(
            accuracy=round(accuracy, 4), precision=round(precision, 4),
            recall=round(recall, 4), f1_score=round(f1, 4),
            auc_roc=round(auc, 4), confusion_matrix=cm.tolist(),
            cross_val_mean=round(np.mean(cv_scores), 4) if cv_scores else 0.0,
            cross_val_std=round(np.std(cv_scores), 4) if cv_scores else 0.0,
            individual_model_weights=self.weights
        )
        return self.metrics
    
    def optimize_weights(self, y_true: np.ndarray) -> Dict[str, float]:
        """Optimize weights to maximize AUC."""
        from scipy.optimize import minimize
        
        model_names = list(self.probabilities.keys())
        probs = [self.probabilities[name] for name in model_names]
        
        def objective(weights):
            weights = np.abs(weights) / np.sum(np.abs(weights))
            combined = np.zeros_like(probs[0])
            for prob, w in zip(probs, weights):
                combined += prob * w
            return -roc_auc_score(y_true, combined)
        
        n_models = len(model_names)
        initial_weights = np.ones(n_models) / n_models
        
        result = minimize(objective, initial_weights, method='Nelder-Mead')
        
        optimal_weights = np.abs(result.x) / np.sum(np.abs(result.x))
        self.weights = {name: round(w, 4) for name, w in zip(model_names, optimal_weights)}
        
        return self.weights
    
    def get_report(self) -> Dict[str, Any]:
        return {
            'ensemble_type': self.ensemble_type,
            'n_models': len(self.predictions or self.models),
            'model_names': list(self.predictions.keys() or self.models.keys()),
            'weights': self.weights,
            'metrics': asdict(self.metrics) if self.metrics else None,
            'timestamp': datetime.utcnow().isoformat()
        }


def create_ensemble_from_predictions(
    model_predictions: Dict[str, Dict[str, np.ndarray]],
    y_true: np.ndarray,
    ensemble_type: str = 'soft_voting',
    optimize: bool = False
) -> Tuple[EnsembleModel, Dict[str, Any]]:
    """
    Create and evaluate an ensemble from multiple model predictions.
    
    Args:
        model_predictions: Dict mapping model name to {'predictions': arr, 'probabilities': arr}
        y_true: Ground truth labels
        ensemble_type: Type of ensemble
        optimize: Whether to optimize weights
    
    Returns:
        Tuple of (ensemble model, report dict)
    """
    ensemble = EnsembleModel(ensemble_type)
    
    for model_name, preds in model_predictions.items():
        ensemble.add_predictions(
            model_name,
            preds['predictions'],
            preds['probabilities']
        )
    
    if optimize:
        ensemble.optimize_weights(y_true)
    
    ensemble.evaluate(y_true)
    
    return ensemble, ensemble.get_report()


def run_model_ensemble_analysis(
    models_data: List[Dict[str, Any]],
    y_true: np.ndarray,
    ensemble_types: List[str] = ['soft_voting', 'hard_voting']
) -> Dict[str, Any]:
    """
    Run ensemble analysis with multiple ensemble types and compare.
    
    Args:
        models_data: List of dicts with 'name', 'predictions', 'probabilities'
        y_true: Ground truth
        ensemble_types: List of ensemble types to test
    
    Returns:
        Comparison results for all ensemble types
    """
    results = {'individual_models': {}, 'ensembles': {}}
    
    # Individual model performance
    for model_data in models_data:
        name = model_data['name']
        preds = model_data['predictions']
        probs = model_data['probabilities']
        
        results['individual_models'][name] = {
            'accuracy': round(accuracy_score(y_true, preds), 4),
            'auc_roc': round(roc_auc_score(y_true, probs), 4)
        }
    
    # Ensemble performance
    for ens_type in ensemble_types:
        ensemble = EnsembleModel(ens_type)
        for model_data in models_data:
            ensemble.add_predictions(
                model_data['name'],
                model_data['predictions'],
                model_data['probabilities']
            )
        
        metrics = ensemble.evaluate(y_true)
        results['ensembles'][ens_type] = asdict(metrics)
    
    # Find best ensemble
    best_ensemble = max(results['ensembles'].items(), 
                       key=lambda x: x[1]['auc_roc'])
    results['best_ensemble'] = {'type': best_ensemble[0], 'auc_roc': best_ensemble[1]['auc_roc']}
    
    return results
