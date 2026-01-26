"""
Random Forest Model for Landslide Susceptibility

Implements Random Forest classifier for landslide prediction
with spatial cross-validation, hyperparameter tuning, and feature importance analysis.

Reference: Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.

For spatial cross-validation methodology:
- Roberts et al. (2017). Cross-validation strategies for data with temporal, 
  spatial, hierarchical, or phylogenetic structure. Ecography, 40(8), 913-929.

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
    from sklearn.model_selection import (
        cross_val_score, train_test_split, GridSearchCV, RandomizedSearchCV
    )
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, confusion_matrix, classification_report
    )
    from sklearn.preprocessing import StandardScaler
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
    auc_ci_lower: Optional[float]  # 95% CI lower bound
    auc_ci_upper: Optional[float]  # 95% CI upper bound
    confusion_matrix: List[List[int]]
    cross_val_scores: List[float]
    cross_val_mean: float
    cross_val_std: float
    validation_method: str  # "random" or "spatial"


@dataclass
class FeatureImportance:
    """Container for feature importance results."""
    feature_names: List[str]
    importances: Dict[str, float]
    importance_std: Dict[str, float]
    ranked_features: List[Tuple[str, float]]


@dataclass
class HyperparameterSearchResult:
    """Container for hyperparameter tuning results."""
    best_params: Dict[str, Any]
    best_score: float
    search_method: str  # "grid" or "random"
    all_results: Optional[List[Dict]]


class LandslideRandomForest:
    """
    Random Forest classifier for landslide susceptibility mapping.
    
    Features:
    - Conditioning factors: slope, aspect, geology, land_cover, rainfall, etc.
    - Target: Binary landslide occurrence (0/1)
    - Supports spatial cross-validation for geospatial data
    - Optional hyperparameter tuning via GridSearchCV or RandomizedSearchCV
    
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
    
    # Parameter grid for hyperparameter tuning
    PARAM_GRID = {
        'n_estimators': [50, 100, 200, 300],
        'max_depth': [5, 10, 15, 20, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'max_features': ['sqrt', 'log2', None]
    }
    
    def __init__(self, 
                 feature_names: List[str],
                 params: Optional[Dict] = None,
                 tune_hyperparameters: bool = False):
        """
        Initialize Random Forest model.
        
        Args:
            feature_names: List of conditioning factor names
            params: Optional custom hyperparameters
            tune_hyperparameters: Whether to perform grid search
        """
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn required. Install with: pip install scikit-learn")
        
        self.feature_names = feature_names
        self.params = {**self.DEFAULT_PARAMS, **(params or {})}
        self.tune_hyperparameters_flag = tune_hyperparameters
        self.model = RandomForestClassifier(**self.params)
        self.is_trained = False
        self.metrics = None
        self.feature_importance = None
        self.hyperparameter_search_result = None
        self.cv_models = []  # Store models from CV for uncertainty estimation
    
    def tune_hyperparameters(self,
                             X: np.ndarray,
                             y: np.ndarray,
                             method: str = 'random',
                             n_iter: int = 50,
                             cv_folds: int = 5,
                             coordinates: Optional[np.ndarray] = None) -> HyperparameterSearchResult:
        """
        Tune hyperparameters using GridSearchCV or RandomizedSearchCV.
        
        Args:
            X: Feature matrix
            y: Target vector
            method: 'grid' for GridSearchCV, 'random' for RandomizedSearchCV
            n_iter: Number of iterations for RandomizedSearchCV
            cv_folds: Number of cross-validation folds
            coordinates: Optional (N, 2) array for spatial CV
            
        Returns:
            HyperparameterSearchResult with best parameters
        """
        logger.info(f"Starting hyperparameter tuning with {method} search")
        
        # Create base model without class_weight for tuning
        base_model = RandomForestClassifier(
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        # Set up cross-validation
        if coordinates is not None:
            from app.analysis.validation import SpatialSplitter
            splitter = SpatialSplitter(coordinates, n_splits=cv_folds)
            cv = list(splitter.split_checkerboard())
            logger.info("Using spatial cross-validation for hyperparameter tuning")
        else:
            cv = cv_folds
        
        if method == 'grid':
            search = GridSearchCV(
                base_model,
                self.PARAM_GRID,
                cv=cv,
                scoring='roc_auc',
                n_jobs=-1,
                verbose=1
            )
        else:  # random
            search = RandomizedSearchCV(
                base_model,
                self.PARAM_GRID,
                n_iter=n_iter,
                cv=cv,
                scoring='roc_auc',
                n_jobs=-1,
                random_state=42,
                verbose=1
            )
        
        search.fit(X, y)
        
        # Update model with best parameters
        best_params = search.best_params_
        best_params['random_state'] = 42
        best_params['n_jobs'] = -1
        best_params['class_weight'] = 'balanced'
        
        self.params = best_params
        self.model = RandomForestClassifier(**self.params)
        
        self.hyperparameter_search_result = HyperparameterSearchResult(
            best_params=best_params,
            best_score=round(search.best_score_, 4),
            search_method=method,
            all_results=None  # Can be populated if needed
        )
        
        logger.info(f"Best parameters: {best_params}, Best AUC: {search.best_score_:.4f}")
        
        return self.hyperparameter_search_result
    
    def train(self, 
              X: np.ndarray, 
              y: np.ndarray,
              test_size: float = 0.3,
              cv_folds: int = 5,
              coordinates: Optional[np.ndarray] = None,
              tune_hyperparameters: Optional[bool] = None) -> ModelMetrics:
        """
        Train the Random Forest model with optional spatial cross-validation.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target vector (n_samples,) - binary 0/1
            test_size: Proportion for test split
            cv_folds: Number of cross-validation folds
            coordinates: Optional (N, 2) array of coordinates for spatial CV
            tune_hyperparameters: Whether to perform hyperparameter tuning first.
                                 If None, uses value from __init__.
            
        Returns:
            ModelMetrics with evaluation results
        """
        logger.info(f"Training Random Forest with {X.shape[0]} samples, {X.shape[1]} features")
        
        # Determine tuning flag
        should_tune = tune_hyperparameters if tune_hyperparameters is not None else self.tune_hyperparameters_flag
        
        # Optional hyperparameter tuning
        if should_tune:
            self.tune_hyperparameters(X, y, method='random', n_iter=30, 
                                     cv_folds=cv_folds, coordinates=coordinates)
        
        # Determine validation method
        if coordinates is not None:
            validation_method = "Spatial Checkerboard"
            logger.info("Using spatial cross-validation")
        else:
            validation_method = "Random Stratified"
            logger.info("Using random stratified split")
        
        # Split data
        if coordinates is not None:
            from app.analysis.validation import SpatialSplitter
            splitter = SpatialSplitter(coordinates, n_splits=int(1/test_size))
            train_idx, test_idx = next(splitter.split_checkerboard())
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
        else:
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
        
        # Cross-validation with spatial or random splits
        self.cv_models = []  # Store for uncertainty estimation
        cv_scores = []
        
        if coordinates is not None:
            from app.analysis.validation import SpatialSplitter
            cv_splitter = SpatialSplitter(coordinates, n_splits=cv_folds)
            
            for train_idx, test_idx in cv_splitter.split_checkerboard():
                cv_model = RandomForestClassifier(**self.params)
                cv_model.fit(X[train_idx], y[train_idx])
                self.cv_models.append(cv_model)
                
                y_cv_proba = cv_model.predict_proba(X[test_idx])[:, 1]
                try:
                    score = roc_auc_score(y[test_idx], y_cv_proba)
                    cv_scores.append(score)
                except ValueError:
                    # Only one class in test fold
                    continue
        else:
            cv_scores = list(cross_val_score(self.model, X, y, cv=cv_folds, scoring='roc_auc'))
        
        # Calculate bootstrapped AUC confidence interval
        auc_lower, auc_upper = self._bootstrap_auc_ci(y_test, y_pred_proba)
        
        self.metrics = ModelMetrics(
            accuracy=round(accuracy, 4),
            precision=round(precision, 4),
            recall=round(recall, 4),
            f1_score=round(f1, 4),
            auc_roc=round(auc_roc, 4),
            auc_ci_lower=round(auc_lower, 4),
            auc_ci_upper=round(auc_upper, 4),
            confusion_matrix=conf_matrix,
            cross_val_scores=[round(s, 4) for s in cv_scores],
            cross_val_mean=round(np.mean(cv_scores), 4) if cv_scores else 0.0,
            cross_val_std=round(np.std(cv_scores), 4) if cv_scores else 0.0,
            validation_method=validation_method
        )
        
        # Calculate feature importance
        self._calculate_feature_importance()
        
        logger.info(f"Training complete. AUC-ROC: {auc_roc:.4f} (95% CI: {auc_lower:.4f}-{auc_upper:.4f})")
        
        return self.metrics
    
    def _bootstrap_auc_ci(self, y_true: np.ndarray, y_pred_proba: np.ndarray,
                          n_bootstrap: int = 1000, confidence: float = 0.95) -> Tuple[float, float]:
        """Calculate bootstrapped 95% CI for AUC."""
        np.random.seed(42)
        n = len(y_true)
        bootstrap_aucs = []
        
        for _ in range(n_bootstrap):
            indices = np.random.choice(n, size=n, replace=True)
            boot_y = y_true[indices]
            boot_proba = y_pred_proba[indices]
            
            if len(np.unique(boot_y)) < 2:
                continue
            
            try:
                auc = roc_auc_score(boot_y, boot_proba)
                bootstrap_aucs.append(auc)
            except ValueError:
                continue
        
        if len(bootstrap_aucs) < 100:
            logger.warning(f"Only {len(bootstrap_aucs)} valid bootstrap samples")
            return 0.0, 1.0
        
        alpha = 1 - confidence
        lower = np.percentile(bootstrap_aucs, (alpha / 2) * 100)
        upper = np.percentile(bootstrap_aucs, (1 - alpha / 2) * 100)
        
        return lower, upper
    
    def _calculate_feature_importance(self) -> FeatureImportance:
        """Calculate and store feature importance."""
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        importances = self.model.feature_importances_
        std = np.std([tree.feature_importances_ for tree in self.model.estimators_], axis=0)
        
        importance_dict = {
            name: round(float(imp), 4) 
            for name, imp in zip(self.feature_names, importances)
        }
        
        std_dict = {
            name: round(float(s), 4) 
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
            ranked_features=[(name, round(float(imp), 4)) for name, imp in ranked]
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
    
    def predict_with_uncertainty(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict with uncertainty estimation using CV models.
        
        Returns mean prediction and standard deviation across CV folds.
        
        Args:
            X: Feature matrix
            
        Returns:
            Tuple of (mean_probability, std_probability)
        """
        if not self.cv_models:
            logger.warning("No CV models available. Using main model only.")
            return self.predict_proba(X), np.zeros(X.shape[0])
        
        predictions = []
        for model in self.cv_models:
            pred = model.predict_proba(X)[:, 1]
            predictions.append(pred)
        
        predictions = np.array(predictions)
        mean_pred = np.mean(predictions, axis=0)
        std_pred = np.std(predictions, axis=0)
        
        return mean_pred, std_pred
    
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
        
        if self.hyperparameter_search_result:
            report['hyperparameter_tuning'] = asdict(self.hyperparameter_search_result)
        
        return report


def train_random_forest_model(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str],
    params: Optional[Dict] = None,
    coordinates: Optional[np.ndarray] = None,
    tune_hyperparameters: bool = False
) -> Tuple[LandslideRandomForest, Dict]:
    """
    Convenience function to train Random Forest model.
    
    Args:
        X: Feature matrix
        y: Target vector
        feature_names: List of feature names
        params: Optional hyperparameters
        coordinates: Optional coordinates for spatial CV
        tune_hyperparameters: Whether to tune hyperparameters
        
    Returns:
        Tuple of (trained model, report dict)
    """
    model = LandslideRandomForest(feature_names, params)
    model.train(X, y, coordinates=coordinates, tune_hyperparameters=tune_hyperparameters)
    return model, model.get_report()


def generate_sample_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray, List[str], np.ndarray]:
    """
    Generate sample training data for landslide prediction.
    
    Based on typical relationships in New Juaben South Municipality.
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        Tuple of (X, y, feature_names, coordinates)
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
    
    # Generate synthetic coordinates for spatial CV
    lat = np.random.uniform(6.02, 6.12, n_samples)
    lon = np.random.uniform(-0.30, -0.18, n_samples)
    coordinates = np.column_stack([lon, lat])
    
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
    
    return X, y, feature_names, coordinates


if __name__ == "__main__":
    print("=" * 60)
    print("Random Forest Landslide Susceptibility Model")
    print("=" * 60)
    
    # Generate sample data
    X, y, feature_names, coordinates = generate_sample_training_data(1000)
    print(f"\nSample data: {X.shape[0]} samples, {len(feature_names)} features")
    print(f"Landslide events: {sum(y)} ({sum(y)/len(y)*100:.1f}%)")
    
    # Train model with spatial CV
    print("\nTraining with spatial cross-validation...")
    model, report = train_random_forest_model(
        X, y, feature_names, 
        coordinates=coordinates,
        tune_hyperparameters=False
    )
    
    print(f"\nModel Performance:")
    print(f"  Accuracy: {report['metrics']['accuracy']:.4f}")
    print(f"  AUC-ROC: {report['metrics']['auc_roc']:.4f} (95% CI: {report['metrics']['auc_ci_lower']:.4f}-{report['metrics']['auc_ci_upper']:.4f})")
    print(f"  Recall: {report['metrics']['recall']:.4f}")
    print(f"  Cross-val mean: {report['metrics']['cross_val_mean']:.4f}")
    print(f"  Validation method: {report['metrics']['validation_method']}")
    
    print(f"\nTop 5 Important Features:")
    for name, imp in report['feature_importance']['ranked_features'][:5]:
        print(f"  {name}: {imp:.4f}")
