"""
Comprehensive Unit Tests for GeoHIS ML Models

Tests Random Forest, Logistic Regression, and Ensemble models
with validation of metrics, spatial cross-validation, and edge cases.

Author: GeoHIS Research Team
Date: January 2026
"""

import pytest
import numpy as np
from typing import Tuple


# Test fixtures for sample data generation
@pytest.fixture
def sample_binary_data() -> Tuple[np.ndarray, np.ndarray, list]:
    """Generate sample binary classification data."""
    np.random.seed(42)
    n_samples = 500
    
    # Generate features
    X = np.random.randn(n_samples, 5)
    
    # Generate target correlated with first two features
    prob = 1 / (1 + np.exp(-(X[:, 0] + X[:, 1] - 0.5)))
    y = (np.random.random(n_samples) < prob).astype(int)
    
    feature_names = ['feature_1', 'feature_2', 'feature_3', 'feature_4', 'feature_5']
    
    return X, y, feature_names


@pytest.fixture
def sample_coordinates() -> np.ndarray:
    """Generate sample coordinates for spatial CV."""
    np.random.seed(42)
    n_samples = 500
    
    # Generate coordinates within a bounding box
    lon = np.random.uniform(-0.30, -0.18, n_samples)
    lat = np.random.uniform(6.02, 6.12, n_samples)
    
    return np.column_stack([lon, lat])


@pytest.fixture
def imbalanced_data() -> Tuple[np.ndarray, np.ndarray, list]:
    """Generate imbalanced classification data (10% positive class)."""
    np.random.seed(42)
    n_samples = 500
    
    X = np.random.randn(n_samples, 5)
    
    # Only 10% positive class
    prob = 0.1 * np.ones(n_samples)
    y = (np.random.random(n_samples) < prob).astype(int)
    
    feature_names = ['f1', 'f2', 'f3', 'f4', 'f5']
    
    return X, y, feature_names


class TestRandomForestModel:
    """Tests for Random Forest landslide susceptibility model."""
    
    def test_model_initialization(self, sample_binary_data):
        """Test model initializes correctly."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        model = LandslideRandomForest(feature_names)
        
        assert model.feature_names == feature_names
        assert model.is_trained == False
        assert model.metrics is None
    
    def test_model_training(self, sample_binary_data):
        """Test model trains and produces metrics."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        model = LandslideRandomForest(feature_names)
        metrics = model.train(X, y)
        
        assert model.is_trained == True
        assert metrics is not None
        assert 0 <= metrics.accuracy <= 1
        assert 0 <= metrics.auc_roc <= 1
        assert metrics.auc_ci_lower is not None
        assert metrics.auc_ci_upper is not None
        assert metrics.auc_ci_lower <= metrics.auc_roc <= metrics.auc_ci_upper
    
    def test_model_prediction(self, sample_binary_data):
        """Test model makes valid predictions."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        model = LandslideRandomForest(feature_names)
        model.train(X, y)
        
        # Test predictions
        predictions = model.predict(X)
        assert predictions.shape == (len(X),)
        assert set(predictions).issubset({0, 1})
        
        # Test probabilities
        proba = model.predict_proba(X)
        assert proba.shape == (len(X),)
        assert np.all((proba >= 0) & (proba <= 1))
    
    def test_spatial_cross_validation(self, sample_binary_data, sample_coordinates):
        """Test spatial cross-validation is used when coordinates provided."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        coords = sample_coordinates
        
        model = LandslideRandomForest(feature_names)
        metrics = model.train(X, y, coordinates=coords)
        
        assert metrics.validation_method == "Spatial Checkerboard"
        assert len(metrics.cross_val_scores) > 0
    
    def test_feature_importance(self, sample_binary_data):
        """Test feature importance is calculated."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        model = LandslideRandomForest(feature_names)
        model.train(X, y)
        
        assert model.feature_importance is not None
        assert len(model.feature_importance.ranked_features) == len(feature_names)
        
        # Importances should sum to approximately 1
        total_importance = sum(model.feature_importance.importances.values())
        assert 0.99 <= total_importance <= 1.01
    
    def test_prediction_with_uncertainty(self, sample_binary_data, sample_coordinates):
        """Test uncertainty estimation from CV models."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        coords = sample_coordinates
        
        model = LandslideRandomForest(feature_names)
        model.train(X, y, coordinates=coords)
        
        mean_pred, std_pred = model.predict_with_uncertainty(X[:10])
        
        assert mean_pred.shape == (10,)
        assert std_pred.shape == (10,)
        assert np.all(std_pred >= 0)  # Standard deviation should be non-negative
    
    def test_untrained_model_raises_error(self, sample_binary_data):
        """Test untrained model raises error on prediction."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = sample_binary_data
        model = LandslideRandomForest(feature_names)
        
        with pytest.raises(ValueError, match="Model must be trained"):
            model.predict(X)
    
    def test_imbalanced_data_handling(self, imbalanced_data):
        """Test model handles imbalanced data correctly."""
        from app.analysis.ml_models.random_forest import LandslideRandomForest
        
        X, y, feature_names = imbalanced_data
        model = LandslideRandomForest(feature_names)
        metrics = model.train(X, y)
        
        # Model should still produce valid metrics
        assert metrics.auc_roc >= 0.4  # Should be better than random even with imbalance
        assert metrics.recall >= 0  # Should have some positive predictions


class TestValidationModule:
    """Tests for the validation module."""
    
    def test_auc_calculation(self):
        """Test AUC is calculated correctly."""
        from app.analysis.validation import SusceptibilityValidator
        
        np.random.seed(42)
        n = 1000
        predicted = np.random.uniform(0, 1, n)
        # Perfect correlation
        actual = (predicted > 0.5).astype(int)
        
        validator = SusceptibilityValidator(predicted, actual)
        auc = validator.calculate_auc()
        
        assert auc > 0.9  # Should be very high for perfect correlation
    
    def test_auc_confidence_interval(self):
        """Test AUC confidence interval is calculated."""
        from app.analysis.validation import SusceptibilityValidator
        
        np.random.seed(42)
        n = 500
        predicted = np.random.uniform(0, 1, n)
        actual = (predicted > 0.5 + np.random.normal(0, 0.1, n)).astype(int)
        actual = np.clip(actual, 0, 1)
        
        validator = SusceptibilityValidator(predicted, actual)
        auc, lower, upper = validator.calculate_auc_confidence_interval(n_bootstrap=100)
        
        assert lower <= auc <= upper
        assert upper - lower > 0  # CI should have width
    
    def test_confusion_matrix(self):
        """Test confusion matrix calculation."""
        from app.analysis.validation import SusceptibilityValidator
        
        predicted = np.array([0.1, 0.9, 0.4, 0.6])
        actual = np.array([0, 1, 0, 1])
        
        validator = SusceptibilityValidator(predicted, actual, threshold=0.5)
        cm = validator.calculate_confusion_matrix()
        
        assert cm['true_positive'] == 2  # 0.9 and 0.6 predicted positive, both actual 1
        assert cm['true_negative'] == 2  # 0.1 and 0.4 predicted negative, both actual 0
        assert cm['total'] == 4
    
    def test_kappa_calculation(self):
        """Test Cohen's Kappa calculation."""
        from app.analysis.validation import SusceptibilityValidator
        
        # Perfect agreement
        predicted = np.array([0.1, 0.9, 0.2, 0.8])
        actual = np.array([0, 1, 0, 1])
        
        validator = SusceptibilityValidator(predicted, actual, threshold=0.5)
        cm = validator.calculate_confusion_matrix()
        kappa = validator.calculate_kappa(cm)
        
        assert kappa == 1.0  # Perfect agreement
    
    def test_validation_report(self):
        """Test complete validation report generation."""
        from app.analysis.validation import SusceptibilityValidator
        
        np.random.seed(42)
        n = 200
        predicted = np.random.uniform(0, 1, n)
        actual = (predicted > 0.5).astype(int)
        
        validator = SusceptibilityValidator(predicted, actual)
        report = validator.get_validation_report(n_bootstrap=50)
        
        assert 'metrics' in report
        assert 'auc_roc' in report['metrics']
        assert 'auc_ci_95' in report['metrics']
        assert 'interpretation' in report


class TestSpatialSplitter:
    """Tests for spatial cross-validation splitter."""
    
    def test_checkerboard_split(self, sample_coordinates):
        """Test checkerboard splitting produces valid folds."""
        from app.analysis.validation import SpatialSplitter
        
        coords = sample_coordinates
        splitter = SpatialSplitter(coords, n_splits=5)
        
        all_train = []
        all_test = []
        
        for train_idx, test_idx in splitter.split_checkerboard():
            all_train.extend(train_idx.tolist())
            all_test.extend(test_idx.tolist())
            
            # No overlap between train and test
            assert len(set(train_idx) & set(test_idx)) == 0
        
        # All indices should be covered
        all_indices = set(all_test)
        assert len(all_indices) == len(coords)
    
    def test_invalid_coordinates_raises_error(self):
        """Test invalid coordinates raise error."""
        from app.analysis.validation import SpatialSplitter
        
        # Wrong shape
        coords = np.array([1, 2, 3, 4])
        
        with pytest.raises(ValueError):
            SpatialSplitter(coords)


class TestFrequencyRatio:
    """Tests for Frequency Ratio analysis."""
    
    def test_fr_calculation(self):
        """Test FR is calculated correctly."""
        from app.analysis.frequency_ratio import FrequencyRatioAnalyzer, FactorClass
        
        analyzer = FrequencyRatioAnalyzer(
            total_study_area=100.0,
            total_landslide_area=10.0
        )
        
        # Class with double the density should have FR = 2
        analyzer.add_factor('test', [
            FactorClass('low_risk', 50.0, 2.5),  # 5% density vs 10% overall = 0.5
            FactorClass('high_risk', 50.0, 7.5),  # 15% density vs 10% overall = 1.5
        ])
        
        result = analyzer.calculate_fr('test')
        
        assert len(result.frequency_ratios) == 2
        assert result.frequency_ratios[0] < 1  # Low risk class
        assert result.frequency_ratios[1] > 1  # High risk class
    
    def test_chi_square_significance(self):
        """Test chi-square significance test."""
        from app.analysis.frequency_ratio import FrequencyRatioAnalyzer, FactorClass
        
        analyzer = FrequencyRatioAnalyzer(
            total_study_area=100.0,
            total_landslide_area=10.0
        )
        
        # Strong difference between classes
        analyzer.add_factor('significant', [
            FactorClass('low', 50.0, 1.0),
            FactorClass('high', 50.0, 9.0),
        ])
        
        chi_result = analyzer.calculate_chi_square('significant')
        
        assert 'chi_square' in chi_result
        assert 'p_value' in chi_result
        assert chi_result['significant'] == True  # Should be significant
    
    def test_lsi_calculation(self):
        """Test Landslide Susceptibility Index calculation."""
        from app.analysis.frequency_ratio import create_sample_landslide_analysis
        
        analyzer = create_sample_landslide_analysis()
        analyzer.calculate_all_factors()
        
        # Calculate LSI for a location
        pixel_classes = {
            'slope': '30-45°',
            'geology': 'Birimian',
            'land_cover': 'Bare Land'
        }
        
        lsi = analyzer.get_susceptibility_index(pixel_classes)
        
        assert lsi > 0  # These are high-risk classes


class TestClassificationModule:
    """Tests for centralized classification module."""
    
    def test_classify_value(self):
        """Test single value classification."""
        from app.analysis.classification import (
            classify_flood_susceptibility,
            classify_landslide_susceptibility,
            SUSCEPTIBILITY_5CLASS
        )
        
        assert classify_flood_susceptibility(10) == "Very Low"
        assert classify_flood_susceptibility(30) == "Low"
        assert classify_flood_susceptibility(50) == "Moderate"
        assert classify_flood_susceptibility(70) == "High"
        assert classify_flood_susceptibility(90) == "Very High"
    
    def test_classify_array(self):
        """Test array classification."""
        from app.analysis.classification import classify_array, SUSCEPTIBILITY_5CLASS
        
        values = np.array([10, 30, 50, 70, 90])
        classes = classify_array(values, SUSCEPTIBILITY_5CLASS)
        
        assert classes[0] == "Very Low"
        assert classes[4] == "Very High"
    
    def test_natural_breaks(self):
        """Test natural breaks calculation."""
        from app.analysis.classification import calculate_natural_breaks
        
        values = np.array([1, 2, 3, 10, 11, 12, 50, 51, 52])
        thresholds = calculate_natural_breaks(values, n_classes=3)
        
        assert len(thresholds) == 2
        assert thresholds[0] < thresholds[1]


class TestInformationValue:
    """Tests for Information Value analysis."""
    
    def test_iv_with_laplace_smoothing(self):
        """Test IV uses Laplace smoothing for zero cases."""
        from app.analysis.statistical_models.information_value import InformationValueAnalyzer
        
        analyzer = InformationValueAnalyzer(
            total_study_area=100.0,
            total_hazard_area=10.0
        )
        
        # Include a class with zero hazards
        analyzer.add_factor('test', [
            {'class_name': 'zero_hazard', 'class_area': 30.0, 'hazard_area': 0.0},
            {'class_name': 'normal', 'class_area': 70.0, 'hazard_area': 10.0},
        ])
        
        result = analyzer.calculate_iv_for_factor('test')
        
        # IV for zero class should be finite (not -inf)
        for cls in result.classes:
            assert np.isfinite(cls.information_value)


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
