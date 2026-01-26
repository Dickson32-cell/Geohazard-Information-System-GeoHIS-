"""
Support Vector Machine (SVM) Module for Geohazard Susceptibility Mapping

Implements SVM classifier with RBF and polynomial kernels for landslide
and flood susceptibility assessment.

References:
- Vapnik, V. (1995). The Nature of Statistical Learning Theory.
- Yao, X. et al. (2008). Landslide susceptibility mapping using SVM.

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
    from sklearn.svm import SVC
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import cross_val_score, train_test_split, GridSearchCV
    from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                                 f1_score, roc_auc_score, confusion_matrix)
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


@dataclass
class SVMMetrics:
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    auc_roc: float
    confusion_matrix: List[List[int]]
    cross_val_scores: List[float]
    cross_val_mean: float
    cross_val_std: float
    best_params: Optional[Dict] = None


class LandslideSVM:
    DEFAULT_PARAMS = {
        'C': 1.0, 'kernel': 'rbf', 'gamma': 'scale',
        'class_weight': 'balanced', 'probability': True, 'random_state': 42
    }
    
    PARAM_GRID = {
        'C': [0.1, 1, 10, 100],
        'gamma': ['scale', 'auto', 0.01, 0.1, 1],
        'kernel': ['rbf', 'poly']
    }
    
    def __init__(self, feature_names: List[str], params: Optional[Dict] = None,
                 tune_hyperparameters: bool = False):
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn required")
        
        self.feature_names = feature_names
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.tune_hyperparameters = tune_hyperparameters
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.metrics = None

    def train(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.3,
              cv_folds: int = 5, coordinates: Optional[np.ndarray] = None) -> SVMMetrics:
        logger.info(f"Training SVM with {X.shape[0]} samples")
        
        # Initialize storage for uncertainty quantification
        self.cv_models = []

        # Use spatial split if coordinates provided
        if coordinates is not None:
            from app.analysis.validation import SpatialSplitter
            splitter = SpatialSplitter(coordinates, n_splits=int(1/test_size))
            train_idx, test_idx = next(splitter.split_checkerboard())
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            # Used for reporting (not stored in metrics class currently but good to know)
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        X_scaled = self.scaler.transform(X)
        
        best_params = None
        if self.tune_hyperparameters:
            logger.info("Tuning hyperparameters...")
            base_model = SVC(probability=True, class_weight='balanced', random_state=42)
            grid_search = GridSearchCV(base_model, self.PARAM_GRID, cv=3, 
                                       scoring='roc_auc', n_jobs=-1)
            grid_search.fit(X_train_scaled, y_train)
            self.model = grid_search.best_estimator_
            best_params = grid_search.best_params_
        else:
            self.model = SVC(**self.params)
            self.model.fit(X_train_scaled, y_train)
        
        self.is_trained = True
        
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_pred_proba)
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        # Spatial Cross Validation & Uncertainty Model Collection
        if coordinates is not None:
            from app.analysis.validation import SpatialSplitter
            cv_splitter = SpatialSplitter(coordinates, n_splits=cv_folds)
            cv_scores = []
            for t_idx, v_idx in cv_splitter.split_checkerboard():
                # Avoid data leakage by scaling within folds
                scaler = StandardScaler()
                X_t = scaler.fit_transform(X[t_idx])
                X_v = scaler.transform(X[v_idx])
                
                # Clone model parameters
                if best_params:
                    clf = SVC(**best_params, probability=True, class_weight='balanced', random_state=42)
                else:
                    clf = SVC(**self.params)
                
                clf.fit(X_t, y[t_idx])
                
                # Store model for uncertainty
                self.cv_models.append((clf, scaler))
                
                score = roc_auc_score(y[v_idx], clf.predict_proba(X_v)[:, 1])
                cv_scores.append(score)
            cv_scores = np.array(cv_scores)
        else:
            cv_scores = cross_val_score(self.model, X_scaled, y, cv=cv_folds, scoring='roc_auc')
        
        self.metrics = SVMMetrics(
            accuracy=round(accuracy, 4), precision=round(precision, 4),
            recall=round(recall, 4), specificity=round(specificity, 4),
            f1_score=round(f1, 4), auc_roc=round(auc, 4),
            confusion_matrix=cm.tolist(),
            cross_val_scores=[round(float(s), 4) for s in cv_scores],
            cross_val_mean=round(float(np.mean(cv_scores)), 4),
            cross_val_std=round(float(np.std(cv_scores)), 4),
            best_params=best_params
        )
        return self.metrics

    def predict_uncertainty(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict mean susceptibility and standard deviation (uncertainty)
        using the ensemble of spatially cross-validated models.
        """
        if not self.cv_models:
            raise ValueError("No CV models available. Run training with coordinates first.")
            
        predictions = []
        for model, scaler in self.cv_models:
            X_scaled = scaler.transform(X)
            pred = model.predict_proba(X_scaled)[:, 1]
            predictions.append(pred)
            
        predictions = np.array(predictions)
        mean_pred = np.mean(predictions, axis=0)
        std_pred = np.std(predictions, axis=0)
        
        return mean_pred, std_pred

    
    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict(self.scaler.transform(X))
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict_proba(self.scaler.transform(X))[:, 1]
    
    def get_report(self) -> Dict[str, Any]:
        return {
            'model_type': 'Support Vector Machine',
            'kernel': self.params.get('kernel', 'rbf'),
            'C': self.params.get('C', 1.0),
            'features': self.feature_names,
            'n_features': len(self.feature_names),
            'is_trained': self.is_trained,
            'metrics': asdict(self.metrics) if self.metrics else None,
            'timestamp': datetime.utcnow().isoformat()
        }


def train_svm_model(X: np.ndarray, y: np.ndarray, feature_names: List[str],
                    tune: bool = False) -> Tuple[LandslideSVM, Dict]:
    model = LandslideSVM(feature_names, tune_hyperparameters=tune)
    model.train(X, y)
    return model, model.get_report()
