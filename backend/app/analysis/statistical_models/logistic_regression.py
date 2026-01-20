"""
Logistic Regression Module for Geohazard Susceptibility Mapping

Implements multivariate Logistic Regression for landslide and flood
susceptibility assessment with comprehensive model diagnostics.

P(Y=1|X) = 1 / (1 + exp(-(b0 + b1*X1 + ... + bn*Xn)))

References:
- Hosmer, D.W. & Lemeshow, S. (2000). Applied Logistic Regression.
- Ayalew, L. & Yamagishi, H. (2005). Application of GIS-based logistic regression.

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
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                                 f1_score, roc_auc_score, confusion_matrix)
    import scipy.stats as stats
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn or scipy not available")


@dataclass
class CoefficientResult:
    feature_name: str
    coefficient: float
    std_error: float
    z_statistic: float
    p_value: float
    odds_ratio: float
    ci_lower: float
    ci_upper: float
    significance: str


@dataclass
class ModelFitStatistics:
    log_likelihood: float
    null_log_likelihood: float
    deviance: float
    null_deviance: float
    mcfadden_r2: float
    cox_snell_r2: float
    nagelkerke_r2: float
    aic: float
    bic: float


@dataclass
class ValidationMetrics:
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


class SusceptibilityLogisticRegression:
    def __init__(self, feature_names: List[str], regularization: str = 'l2', 
                 C: float = 1.0, max_iter: int = 1000):
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn and scipy required")
        
        self.feature_names = feature_names
        self.n_features = len(feature_names)
        
        penalty = None if regularization == 'none' else regularization
        solver = 'saga' if regularization == 'elasticnet' else 'lbfgs'
        
        self.model = LogisticRegression(penalty=penalty, C=C, solver=solver, 
                                        max_iter=max_iter, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.X_train = None
        self.y_train = None
    
    def train(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.3, 
              cv_folds: int = 5) -> Dict[str, Any]:
        logger.info(f"Training LR with {X.shape[0]} samples, {X.shape[1]} features")
        
        self.X_train = X.copy()
        self.y_train = y.copy()
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        X_full_scaled = self.scaler.transform(X)
        
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        coefficients = self._calculate_coefficients(X_train_scaled, y_train)
        model_fit = self._calculate_model_fit(X_train_scaled, y_train)
        validation = self._calculate_validation(X_full_scaled, y, X_test_scaled, 
                                                 y_test, y_pred, y_pred_proba, cv_folds)
        
        importance = sorted([(name, abs(c['coefficient'])) for name, c in 
                            zip(self.feature_names, coefficients)], 
                           key=lambda x: x[1], reverse=True)
        
        return {
            'method': 'Multivariate Logistic Regression',
            'n_samples': len(X), 'n_features': self.n_features,
            'feature_names': self.feature_names,
            'intercept': round(float(self.model.intercept_[0]), 4),
            'coefficients': coefficients, 'model_fit': model_fit,
            'validation': validation, 'variable_importance': importance,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _calculate_coefficients(self, X: np.ndarray, y: np.ndarray) -> List[Dict]:
        coeffs = self.model.coef_[0]
        y_pred_proba = self.model.predict_proba(X)[:, 1]
        
        # Bootstrap standard errors
        np.random.seed(42)
        boot_coeffs = []
        for _ in range(200):
            idx = np.random.choice(len(X), size=len(X), replace=True)
            try:
                model = LogisticRegression(penalty=self.model.penalty, C=self.model.C,
                                          solver=self.model.solver, max_iter=500)
                model.fit(X[idx], y[idx])
                boot_coeffs.append(model.coef_[0])
            except: continue
        
        std_errors = np.std(boot_coeffs, axis=0) if boot_coeffs else np.ones(self.n_features) * 0.1
        
        results = []
        for i, (name, coef, se) in enumerate(zip(self.feature_names, coeffs, std_errors)):
            z_stat = coef / se if se > 0 else 0
            p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
            odds_ratio = np.exp(coef)
            ci_lower = np.exp(coef - 1.96 * se)
            ci_upper = np.exp(coef + 1.96 * se)
            
            if p_value < 0.001: sig = "***"
            elif p_value < 0.01: sig = "**"
            elif p_value < 0.05: sig = "*"
            else: sig = "ns"
            
            results.append({
                'feature_name': name, 'coefficient': round(coef, 4),
                'std_error': round(se, 4), 'z_statistic': round(z_stat, 4),
                'p_value': round(p_value, 4), 'odds_ratio': round(odds_ratio, 4),
                'ci_lower': round(ci_lower, 4), 'ci_upper': round(ci_upper, 4),
                'significance': sig
            })
        return results
    
    def _calculate_model_fit(self, X: np.ndarray, y: np.ndarray) -> Dict:
        n = len(y)
        y_pred_proba = self.model.predict_proba(X)[:, 1]
        
        eps = 1e-15
        ll = np.sum(y * np.log(y_pred_proba + eps) + (1 - y) * np.log(1 - y_pred_proba + eps))
        p_null = np.mean(y)
        ll_null = np.sum(y * np.log(p_null + eps) + (1 - y) * np.log(1 - p_null + eps))
        
        deviance = -2 * ll
        null_deviance = -2 * ll_null
        mcfadden_r2 = 1 - (ll / ll_null) if ll_null != 0 else 0
        cox_snell_r2 = 1 - np.exp(-(2/n) * (ll - ll_null))
        max_r2 = 1 - np.exp((2/n) * ll_null)
        nagelkerke_r2 = cox_snell_r2 / max_r2 if max_r2 > 0 else 0
        
        k = self.n_features + 1
        aic = -2 * ll + 2 * k
        bic = -2 * ll + k * np.log(n)
        
        return {
            'log_likelihood': round(ll, 4), 'null_log_likelihood': round(ll_null, 4),
            'deviance': round(deviance, 4), 'null_deviance': round(null_deviance, 4),
            'mcfadden_r2': round(mcfadden_r2, 4), 'cox_snell_r2': round(cox_snell_r2, 4),
            'nagelkerke_r2': round(nagelkerke_r2, 4), 'aic': round(aic, 4), 'bic': round(bic, 4)
        }
    
    def _calculate_validation(self, X_full, y_full, X_test, y_test, y_pred, y_pred_proba, cv_folds):
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_pred_proba)
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        cv_scores = cross_val_score(self.model, X_full, y_full, cv=cv_folds, scoring='roc_auc')
        
        return {
            'accuracy': round(accuracy, 4), 'precision': round(precision, 4),
            'recall': round(recall, 4), 'specificity': round(specificity, 4),
            'f1_score': round(f1, 4), 'auc_roc': round(auc, 4),
            'confusion_matrix': cm.tolist(),
            'cross_val_scores': [round(s, 4) for s in cv_scores],
            'cross_val_mean': round(np.mean(cv_scores), 4),
            'cross_val_std': round(np.std(cv_scores), 4)
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict(self.scaler.transform(X))
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict_proba(self.scaler.transform(X))[:, 1]
    
    def calculate_vif(self) -> Dict[str, float]:
        if self.X_train is None:
            raise ValueError("Model must be trained first")
        vif_values = {}
        X = self.X_train
        for i, name in enumerate(self.feature_names):
            y_temp = X[:, i]
            X_temp = np.delete(X, i, axis=1)
            if X_temp.shape[1] > 0:
                try:
                    X_temp_const = np.column_stack([np.ones(len(X_temp)), X_temp])
                    coeffs = np.linalg.lstsq(X_temp_const, y_temp, rcond=None)[0]
                    y_pred = X_temp_const @ coeffs
                    ss_res = np.sum((y_temp - y_pred) ** 2)
                    ss_tot = np.sum((y_temp - np.mean(y_temp)) ** 2)
                    r_sq = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
                    vif = 1 / (1 - r_sq) if r_sq < 1 else float('inf')
                except: vif = 1.0
            else: vif = 1.0
            vif_values[name] = round(vif, 2)
        return vif_values


def generate_sample_lr_data(n_samples: int = 1000):
    np.random.seed(42)
    feature_names = ['slope', 'elevation', 'drainage_dist', 'geology', 'land_cover', 'rainfall']
    
    slope = np.random.uniform(0, 45, n_samples)
    elevation = np.random.uniform(150, 450, n_samples)
    drainage_dist = np.random.uniform(0, 2000, n_samples)
    geology = np.random.randint(1, 5, n_samples).astype(float)
    land_cover = np.random.randint(1, 6, n_samples).astype(float)
    rainfall = np.random.uniform(1200, 1800, n_samples)
    
    X = np.column_stack([slope, elevation, drainage_dist, geology, land_cover, rainfall])
    
    logit = (-3.0 + 0.08 * slope - 0.005 * elevation - 0.001 * drainage_dist +
             0.3 * (geology == 1) + 0.2 * (land_cover >= 4) + 0.002 * rainfall +
             np.random.normal(0, 0.5, n_samples))
    prob = 1 / (1 + np.exp(-logit))
    y = (np.random.random(n_samples) < prob).astype(int)
    
    return X, y, feature_names
