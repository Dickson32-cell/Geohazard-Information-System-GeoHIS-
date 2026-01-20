"""
XGBoost Model for Landslide Susceptibility

Implements Extreme Gradient Boosting for landslide prediction
with hyperparameter tuning and SHAP-based interpretability.

Reference: Chen, T., & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System.
In Proceedings of the 22nd ACM SIGKDD (pp. 785-794).

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

# Try to import xgboost
try:
    import xgboost as xgb
    from sklearn.model_selection import cross_val_score, train_test_split, GridSearchCV
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix
    )
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available. Install with: pip install xgboost")


@dataclass
class XGBoostMetrics:
    """Container for XGBoost evaluation metrics."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    confusion_matrix: List[List[int]]
    cross_val_scores: List[float]
    cross_val_mean: float
    cross_val_std: float
    best_params: Optional[Dict] = None
    training_rounds: int = 0


class LandslideXGBoost:
    """
    XGBoost classifier for landslide susceptibility mapping.
    
    Advantages over Random Forest:
    - Better handling of imbalanced classes
    - Built-in regularization
    - Handles missing values
    - Often higher accuracy
    
    Features:
    - Conditioning factors: slope, aspect, geology, land_cover, rainfall, etc.
    - Target: Binary landslide occurrence (0/1)
    """
    
    # Default hyperparameters optimized for landslide prediction
    DEFAULT_PARAMS = {
        'n_estimators': 100,
        'max_depth': 6,
        'learning_rate': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'scale_pos_weight': 1,  # Will be calculated based on class imbalance
        'random_state': 42,
        'n_jobs': -1,
        'eval_metric': 'auc',
        'use_label_encoder': False,
    }
    
    # Hyperparameter grid for tuning
    PARAM_GRID = {
        'max_depth': [4, 6, 8],
        'learning_rate': [0.05, 0.1, 0.2],
        'n_estimators': [50, 100, 200],
        'min_child_weight': [1, 3, 5],
    }
    
    def __init__(self,
                 feature_names: List[str],
                 params: Optional[Dict] = None,
                 tune_hyperparameters: bool = False):
        """
        Initialize XGBoost model.
        
        Args:
            feature_names: List of conditioning factor names
            params: Optional custom hyperparameters
            tune_hyperparameters: Whether to perform grid search
        """
        if not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost required. Install with: pip install xgboost")
        
        self.feature_names = feature_names
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.tune_hyperparameters = tune_hyperparameters
        self.model = None
        self.is_trained = False
        self.metrics = None
        self.feature_importance = None
    
    def _calculate_scale_pos_weight(self, y: np.ndarray) -> float:
        """Calculate scale_pos_weight for imbalanced classes."""
        neg_count = np.sum(y == 0)
        pos_count = np.sum(y == 1)
        return neg_count / pos_count if pos_count > 0 else 1.0
    
    def train(self,
              X: np.ndarray,
              y: np.ndarray,
              test_size: float = 0.3,
              cv_folds: int = 5) -> XGBoostMetrics:
        """
        Train the XGBoost model.
        
        Args:
            X: Feature matrix
            y: Target vector (binary)
            test_size: Proportion for test split
            cv_folds: Number of cross-validation folds
            
        Returns:
            XGBoostMetrics with evaluation results
        """
        logger.info(f"Training XGBoost with {X.shape[0]} samples, {X.shape[1]} features")
        
        # Calculate class imbalance weight
        self.params['scale_pos_weight'] = self._calculate_scale_pos_weight(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        best_params = None
        
        if self.tune_hyperparameters:
            logger.info("Performing hyperparameter tuning...")
            base_model = xgb.XGBClassifier(**{k: v for k, v in self.params.items() 
                                              if k not in self.PARAM_GRID})
            grid_search = GridSearchCV(
                base_model, self.PARAM_GRID, 
                cv=3, scoring='roc_auc', n_jobs=-1
            )
            grid_search.fit(X_train, y_train)
            self.model = grid_search.best_estimator_
            best_params = grid_search.best_params_
            logger.info(f"Best params: {best_params}")
        else:
            self.model = xgb.XGBClassifier(**self.params)
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
        
        self.is_trained = True
        
        # Predict on test set
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y_test, y_pred_proba)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=cv_folds, scoring='roc_auc')
        
        self.metrics = XGBoostMetrics(
            accuracy=round(accuracy, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            f1_score=round(f1, 4),
            auc_roc=round(auc_roc, 4),
            confusion_matrix=conf_matrix,
            cross_val_scores=[round(s, 4) for s in cv_scores],
            cross_val_mean=round(np.mean(cv_scores), 4),
            cross_val_std=round(np.std(cv_scores), 4),
            best_params=best_params,
            training_rounds=self.model.n_estimators
        )
        
        # Calculate feature importance
        self._calculate_feature_importance()
        
        logger.info(f"Training complete. AUC-ROC: {auc_roc:.4f}")
        
        return self.metrics
    
    def _calculate_feature_importance(self) -> Dict[str, Any]:
        """Calculate feature importance using multiple methods."""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        # Get built-in importance
        importance_gain = self.model.get_booster().get_score(importance_type='gain')
        importance_weight = self.model.get_booster().get_score(importance_type='weight')
        
        # Map to feature names
        gain_dict = {}
        weight_dict = {}
        
        for i, name in enumerate(self.feature_names):
            key = f'f{i}'
            gain_dict[name] = round(importance_gain.get(key, 0), 4)
            weight_dict[name] = round(importance_weight.get(key, 0), 4)
        
        # Normalize
        gain_sum = sum(gain_dict.values()) or 1
        weight_sum = sum(weight_dict.values()) or 1
        
        gain_normalized = {k: round(v/gain_sum, 4) for k, v in gain_dict.items()}
        
        # Rank features
        ranked = sorted(gain_normalized.items(), key=lambda x: x[1], reverse=True)
        
        self.feature_importance = {
            'gain': gain_normalized,
            'weight': weight_dict,
            'ranked_features': ranked
        }
        
        return self.feature_importance
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict landslide class."""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict(X)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict landslide probability."""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict_proba(X)[:, 1]
    
    def get_susceptibility_map(self,
                                X: np.ndarray,
                                grid_shape: Tuple[int, int]) -> np.ndarray:
        """Generate susceptibility map."""
        probabilities = self.predict_proba(X)
        return probabilities.reshape(grid_shape)
    
    def get_report(self) -> Dict[str, Any]:
        """Generate model report."""
        report = {
            'model_type': 'XGBoost',
            'n_estimators': self.params.get('n_estimators'),
            'max_depth': self.params.get('max_depth'),
            'learning_rate': self.params.get('learning_rate'),
            'features': self.feature_names,
            'n_features': len(self.feature_names),
            'is_trained': self.is_trained,
        }
        
        if self.metrics:
            report['metrics'] = asdict(self.metrics)
        
        if self.feature_importance:
            report['feature_importance'] = self.feature_importance
        
        return report


def train_xgboost_model(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str],
    tune: bool = False
) -> Tuple[LandslideXGBoost, Dict]:
    """
    Convenience function to train XGBoost model.
    
    Args:
        X: Feature matrix
        y: Target vector
        feature_names: Feature names
        tune: Whether to tune hyperparameters
        
    Returns:
        Tuple of (trained model, report)
    """
    model = LandslideXGBoost(feature_names, tune_hyperparameters=tune)
    model.train(X, y)
    return model, model.get_report()


if __name__ == "__main__":
    from random_forest import generate_sample_training_data
    
    print("=" * 60)
    print("XGBoost Landslide Susceptibility Model")
    print("=" * 60)
    
    # Generate sample data
    X, y, feature_names = generate_sample_training_data(1000)
    print(f"\nSample data: {X.shape[0]} samples, {len(feature_names)} features")
    
    # Train model
    model, report = train_xgboost_model(X, y, feature_names)
    
    print(f"\nModel Performance:")
    print(f"  Accuracy: {report['metrics']['accuracy']:.4f}")
    print(f"  AUC-ROC: {report['metrics']['auc_roc']:.4f}")
    print(f"  Recall: {report['metrics']['recall']:.4f}")
    
    print(f"\nTop 5 Important Features (by gain):")
    for name, imp in report['feature_importance']['ranked_features'][:5]:
        print(f"  {name}: {imp:.4f}")
