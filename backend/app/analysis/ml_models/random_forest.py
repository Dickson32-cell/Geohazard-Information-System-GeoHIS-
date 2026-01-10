"""
Random Forest Model for Landslide Susceptibility

Implements Random Forest classifier for landslide prediction
with feature importance analysis and cross-validation.

Reference: Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.

Author: GeoHIS Research Team
Date: January 2026
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

# Try to import sklearn, provide fallback for documentation
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix, classification_report
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available. Install with: pip install scikit-learn")


@dataclass
class ModelMetrics:
    """Container for model evaluation metrics."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    confusion_matrix: List[List[int]]
    cross_val_scores: List[float]
    cross_val_mean: float
    cross_val_std: float


@dataclass
class FeatureImportance:
    """Container for feature importance results."""
    feature_names: List[str]
    importances: Dict[str, float]
    importance_std: Dict[str, float]
    ranked_features: List[Tuple[str, float]]


class LandslideRandomForest:
    """
    Random Forest classifier for landslide susceptibility mapping.
    
    Features:
    - Conditioning factors: slope, aspect, geology, land_cover, rainfall, etc.
    - Target: Binary landslide occurrence (0/1)
    
    Attributes:
        model: Trained RandomForestClassifier
        feature_names: List of conditioning factor names
        is_trained: Whether model has been fitted
        metrics: Evaluation metrics from training
        feature_importance: Feature importance analysis results
    """
    
    # Default hyperparameters optimized for landslide prediction
    DEFAULT_PARAMS = {
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 5,
        'min_samples_leaf': 2,
        'max_features': 'sqrt',
        'random_state': 42,
        'n_jobs': -1,
        'class_weight': 'balanced'  # Handle imbalanced classes
    }
    
    def __init__(self, 
                 feature_names: List[str],
                 params: Optional[Dict] = None):
        """
        Initialize Random Forest model.
        
        Args:
            feature_names: List of conditioning factor names
            params: Optional custom hyperparameters
        """
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn required. Install with: pip install scikit-learn")
        
        self.feature_names = feature_names
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.model = RandomForestClassifier(**self.params)
        self.is_trained = False
        self.metrics = None
        self.feature_importance = None
    
    def train(self, 
              X: np.ndarray, 
              y: np.ndarray,
              test_size: float = 0.3,
              cv_folds: int = 5) -> ModelMetrics:
        """
        Train the Random Forest model with cross-validation.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target vector (n_samples,) - binary 0/1
            test_size: Proportion for test split
            cv_folds: Number of cross-validation folds
            
        Returns:
            ModelMetrics with evaluation results
        """
        logger.info(f"Training Random Forest with {X.shape[0]} samples, {X.shape[1]} features")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Train model
        self.model.fit(X_train, y_train)
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
        
        self.metrics = ModelMetrics(
            accuracy=round(accuracy, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            f1_score=round(f1, 4),
            auc_roc=round(auc_roc, 4),
            confusion_matrix=conf_matrix,
            cross_val_scores=[round(s, 4) for s in cv_scores],
            cross_val_mean=round(np.mean(cv_scores), 4),
            cross_val_std=round(np.std(cv_scores), 4)
        )
        
        # Calculate feature importance
        self._calculate_feature_importance()
        
        logger.info(f"Training complete. AUC-ROC: {auc_roc:.4f}, Accuracy: {accuracy:.4f}")
        
        return self.metrics
    
    def _calculate_feature_importance(self) -> FeatureImportance:
        """Calculate and store feature importance."""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        importances = self.model.feature_importances_
        std = np.std([tree.feature_importances_ for tree in self.model.estimators_], axis=0)
        
        importance_dict = {
            name: round(imp, 4) 
            for name, imp in zip(self.feature_names, importances)
        }
        
        std_dict = {
            name: round(s, 4) 
            for name, s in zip(self.feature_names, std)
        }
        
        # Rank features
        ranked = sorted(
            zip(self.feature_names, importances),
            key=lambda x: x[1],
            reverse=True
        )
        
        self.feature_importance = FeatureImportance(
            feature_names=self.feature_names,
            importances=importance_dict,
            importance_std=std_dict,
            ranked_features=[(name, round(imp, 4)) for name, imp in ranked]
        )
        
        return self.feature_importance
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict landslide susceptibility class (0 or 1).
        
        Args:
            X: Feature matrix
            
        Returns:
            Binary predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict(X)
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict landslide susceptibility probability.
        
        Args:
            X: Feature matrix
            
        Returns:
            Probability of landslide (class 1)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict_proba(X)[:, 1]
    
    def get_susceptibility_map(self, 
                                X: np.ndarray,
                                grid_shape: Tuple[int, int]) -> np.ndarray:
        """
        Generate susceptibility map from predictions.
        
        Args:
            X: Feature matrix for all grid cells
            grid_shape: Shape of output grid (rows, cols)
            
        Returns:
            2D array of susceptibility probabilities (0-1)
        """
        probabilities = self.predict_proba(X)
        return probabilities.reshape(grid_shape)
    
    def get_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive model report.
        
        Returns:
            Dictionary with model details and metrics
        """
        report = {
            'model_type': 'Random Forest',
            'n_estimators': self.params['n_estimators'],
            'max_depth': self.params['max_depth'],
            'features': self.feature_names,
            'n_features': len(self.feature_names),
            'is_trained': self.is_trained,
        }
        
        if self.metrics:
            report['metrics'] = asdict(self.metrics)
        
        if self.feature_importance:
            report['feature_importance'] = asdict(self.feature_importance)
        
        return report


def train_random_forest_model(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str],
    params: Optional[Dict] = None
) -> Tuple[LandslideRandomForest, Dict]:
    """
    Convenience function to train Random Forest model.
    
    Args:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
        params: Optional hyperparameters
        
    Returns:
        Tuple of (trained model, report dict)
    """
    model = LandslideRandomForest(feature_names, params)
    model.train(X, y)
    return model, model.get_report()


def generate_sample_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Generate sample training data for landslide prediction.
    
    Based on typical relationships in New Juaben South Municipality.
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        Tuple of (X, y, feature_names)
    """
    np.random.seed(42)
    
    feature_names = ['slope', 'aspect', 'elevation', 'geology', 'land_cover', 
                     'rainfall', 'drainage_distance', 'road_distance']
    
    # Generate features with realistic ranges for Ghana Eastern Region
    slope = np.random.uniform(0, 45, n_samples)          # degrees
    aspect = np.random.randint(0, 8, n_samples)          # 8 directions
    elevation = np.random.uniform(150, 450, n_samples)   # meters
    geology = np.random.randint(1, 5, n_samples)         # Birimian, Tarkwaian, etc.
    land_cover = np.random.randint(1, 6, n_samples)      # Forest, Built-up, etc.
    rainfall = np.random.uniform(1200, 1800, n_samples)  # mm/year
    drainage_dist = np.random.uniform(0, 2000, n_samples) # meters
    road_dist = np.random.uniform(0, 500, n_samples)     # meters
    
    X = np.column_stack([
        slope, aspect, elevation, geology, land_cover,
        rainfall, drainage_dist, road_dist
    ])
    
    # Generate target based on realistic relationships
    # Higher slope, lower drainage distance, certain geology = higher landslide probability
    prob = (
        0.02 * slope +
        0.001 * rainfall +
        -0.0001 * elevation +
        -0.0002 * drainage_dist +
        0.05 * (geology == 1).astype(float) +  # Birimian more prone
        0.03 * (land_cover >= 4).astype(float) +  # Bare/disturbed land
        np.random.normal(0, 0.1, n_samples)
    )
    
    # Convert to binary
    threshold = np.percentile(prob, 85)  # ~15% landslide occurrence
    y = (prob > threshold).astype(int)
    
    return X, y, feature_names


if __name__ == "__main__":
    print("=" * 60)
    print("Random Forest Landslide Susceptibility Model")
    print("=" * 60)
    
    # Generate sample data
    X, y, feature_names = generate_sample_training_data(1000)
    print(f"\nSample data: {X.shape[0]} samples, {len(feature_names)} features")
    print(f"Landslide events: {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
    
    # Train model
    model, report = train_random_forest_model(X, y, feature_names)
    
    print(f"\nModel Performance:")
    print(f"  Accuracy: {report['metrics']['accuracy']:.4f}")
    print(f"  AUC-ROC: {report['metrics']['auc_roc']:.4f}")
    print(f"  Recall: {report['metrics']['recall']:.4f}")
    print(f"  Cross-val mean: {report['metrics']['cross_val_mean']:.4f}")
    
    print(f"\nTop 5 Important Features:")
    for name, imp in report['feature_importance']['ranked_features'][:5]:
        print(f"  {name}: {imp:.4f}")
