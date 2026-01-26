"""
Enhanced Analysis Routes for GeoHIS

Provides API endpoints for new statistical models and comparison framework.

Author: GeoHIS Research Team
Date: January 2026
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import numpy as np
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis/v2", tags=["Enhanced Analysis"])


# Pydantic Models

class ExtractionRequest(BaseModel):
    factor_paths: Dict[str, str]
    hazard_path: str
    
class AHPAnalysisRequest(BaseModel):
    criteria: List[str]
    matrix: Optional[List[List[float]]] = None

class FactorClassData(BaseModel):
    class_name: str
    class_area: float
    hazard_area: float


class IVAnalysisRequest(BaseModel):
    total_study_area: float
    total_hazard_area: float
    hazard_type: str = "landslide"
    factors: Dict[str, List[Dict[str, Any]]]


class LRAnalysisRequest(BaseModel):
    features: List[List[float]]
    labels: List[int]
    feature_names: List[str]
    test_size: float = 0.3
    coordinates: Optional[List[List[float]]] = None


class RFAnalysisRequest(BaseModel):
    features: List[List[float]]
    labels: List[int]
    feature_names: List[str]
    test_size: float = 0.3
    n_estimators: int = 100
    max_depth: Optional[int] = None
    coordinates: Optional[List[List[float]]] = None
    tune_hyperparameters: bool = False


class XGBAnalysisRequest(BaseModel):
    features: List[List[float]]
    labels: List[int]
    feature_names: List[str]
    test_size: float = 0.3
    n_estimators: int = 100
    max_depth: int = 6
    learning_rate: float = 0.1
    coordinates: Optional[List[List[float]]] = None
    tune_hyperparameters: bool = False


class SobolAnalysisRequest(BaseModel):
    model_type: str  # 'rf', 'xgb', 'lr', 'svm'
    features: List[List[float]]
    labels: List[int]
    feature_names: List[str]
    n_samples: int = 512
    calc_second_order: bool = False
    coordinates: Optional[List[List[float]]] = None


class ModelComparisonRequest(BaseModel):
    ground_truth: List[int]
    models: Dict[str, Dict[str, List[float]]]


class CFAnalysisRequest(BaseModel):
    total_study_area: float
    total_hazard_area: float
    hazard_type: str = "landslide"
    factors: Dict[str, List[Dict[str, Any]]]


# Endpoints

@router.post("/extract-spatial-data")
async def extract_spatial_data(request: ExtractionRequest):
    """
    Extract features and labels from raster files.
    """
    try:
        from ..services.spatial_extraction import SpatialExtractor
        
        extractor = SpatialExtractor()
        data = extractor.extract_data(request.factor_paths, request.hazard_path)
        
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ahp-custom")
async def run_ahp_custom(request: AHPAnalysisRequest):
    """
    Run AHP with custom criteria and matrix.
    """
    try:
        from ..analysis.ahp import run_custom_ahp
        
        if request.matrix is None:
             raise HTTPException(status_code=400, detail="Matrix required for custom AHP")
             
        results = run_custom_ahp(request.criteria, request.matrix)
        
        return {
            "status": "success",
            "results": results
        }
    except Exception as e:
        logger.error(f"AHP error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/information-value")
async def run_information_value_analysis(request: IVAnalysisRequest):
    """
    Run Information Value (Weight of Evidence) analysis.
    
    The IV method calculates: IV = ln(Densclass / Densmap)
    """
    try:
        from ..analysis.statistical_models.information_value import InformationValueAnalyzer
        
        analyzer = InformationValueAnalyzer(
            total_study_area=request.total_study_area,
            total_hazard_area=request.total_hazard_area,
            hazard_type=request.hazard_type
        )
        
        for factor_name, class_data in request.factors.items():
            analyzer.add_factor(factor_name, class_data)
        
        analyzer.calculate_all_factors()
        
        return {
            "status": "success",
            "results": analyzer.to_dict()
        }
    except Exception as e:
        logger.error(f"IV analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/certainty-factor")
async def run_certainty_factor_analysis(request: CFAnalysisRequest):
    """
    Run Certainty Factor analysis.
    
    CF ranges from -1 to +1 indicating correlation with hazard.
    """
    try:
        from ..analysis.statistical_models.certainty_factor import CertaintyFactorAnalyzer
        
        analyzer = CertaintyFactorAnalyzer(
            total_study_area=request.total_study_area,
            total_hazard_area=request.total_hazard_area,
            hazard_type=request.hazard_type
        )
        
        for factor_name, class_data in request.factors.items():
            analyzer.add_factor(factor_name, class_data)
        
        analyzer.calculate_all_factors()
        
        return {
            "status": "success",
            "results": analyzer.to_dict()
        }
    except Exception as e:
        logger.error(f"CF analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logistic-regression")
async def run_logistic_regression_analysis(request: LRAnalysisRequest):
    """
    Run Logistic Regression analysis with full diagnostics.
    
    Includes coefficients, odds ratios, p-values, and model fit statistics.
    Supports spatial cross-validation if coordinates provided.
    """
    try:
        from ..analysis.statistical_models.logistic_regression import SusceptibilityLogisticRegression
        
        X = np.array(request.features)
        y = np.array(request.labels)
        coords = np.array(request.coordinates) if request.coordinates else None
        
        model = SusceptibilityLogisticRegression(
            feature_names=request.feature_names
        )
        
        results = model.train(X, y, test_size=request.test_size, coordinates=coords)
        
        # Add VIF for multicollinearity check
        results['vif'] = model.calculate_vif()
        
        return {
            "status": "success",
            "results": results
        }
    except Exception as e:
        logger.error(f"LR analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/svm")
async def run_svm_analysis(request: LRAnalysisRequest):
    """
    Run Support Vector Machine analysis.
    Supports spatial cross-validation if coordinates provided.
    """
    try:
        from ..analysis.ml_models.svm_model import LandslideSVM
        
        X = np.array(request.features)
        y = np.array(request.labels)
        coords = np.array(request.coordinates) if request.coordinates else None
        
        model = LandslideSVM(feature_names=request.feature_names)
        model.train(X, y, test_size=request.test_size, coordinates=coords)
        
        return {
            "status": "success",
            "results": model.get_report()
        }
    except Exception as e:
        logger.error(f"SVM analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/random-forest")
async def run_random_forest_analysis(request: RFAnalysisRequest):
    """
    Run Random Forest analysis with optional spatial cross-validation.
    """
    try:
        from ..analysis.ml_models.random_forest import LandslideRandomForest
        
        X = np.array(request.features)
        y = np.array(request.labels)
        coords = np.array(request.coordinates) if request.coordinates else None
        
        params = {
            'n_estimators': request.n_estimators,
            'max_depth': request.max_depth
        }
        
        model = LandslideRandomForest(
            feature_names=request.feature_names,
            params=params,
            tune_hyperparameters=request.tune_hyperparameters
        )
        
        results = model.train(X, y, test_size=request.test_size, coordinates=coords)
        
        # Add uncertainty if available
        uncertainty_info = None
        if coords is not None and model.cv_models:
            mean_pred, std_pred = model.predict_with_uncertainty(X)
            uncertainty_info = {
                "mean_susceptibility": float(np.mean(mean_pred)),
                "mean_uncertainty": float(np.mean(std_pred)),
                "max_uncertainty": float(np.max(std_pred))
            }
        
        report = model.get_report()
        if uncertainty_info:
            report['uncertainty'] = uncertainty_info
            
        return {
            "status": "success",
            "results": report
        }
    except Exception as e:
        logger.error(f"RF analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/xgboost")
async def run_xgboost_analysis(request: XGBAnalysisRequest):
    """
    Run XGBoost analysis with optional spatial cross-validation.
    """
    try:
        from ..analysis.ml_models.xgboost_model import LandslideXGBoost
        
        X = np.array(request.features)
        y = np.array(request.labels)
        coords = np.array(request.coordinates) if request.coordinates else None
        
        params = {
            'n_estimators': request.n_estimators,
            'max_depth': request.max_depth,
            'learning_rate': request.learning_rate
        }
        
        model = LandslideXGBoost(
            feature_names=request.feature_names,
            params=params,
            tune_hyperparameters=request.tune_hyperparameters
        )
        
        results = model.train(X, y, test_size=request.test_size, coordinates=coords)
        
        # Add uncertainty if available
        uncertainty_info = None
        if coords is not None and hasattr(model, 'predict_with_uncertainty'):
            mean_pred, std_pred = model.predict_with_uncertainty(X)
            uncertainty_info = {
                "mean_susceptibility": float(np.mean(mean_pred)),
                "mean_uncertainty": float(np.mean(std_pred)),
                "max_uncertainty": float(np.max(std_pred))
            }
            
        report = model.get_report()
        if uncertainty_info:
            report['uncertainty'] = uncertainty_info
            
        return {
            "status": "success",
            "results": report
        }
    except Exception as e:
        logger.error(f"XGBoost analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sensitivity-analysis")
async def run_sobol_sensitivity(request: SobolAnalysisRequest):
    """
    Run Sobol Global Sensitivity Analysis (GSA).
    
    Quantifies the contribution of each input factor to the variance of the model output.
    Training a temporary model to perform the analysis.
    """
    try:
        from ..analysis.sensitivity import run_sensitivity_analysis
        
        X = np.array(request.features)
        y = np.array(request.labels)
        
        # Train a model based on request type
        model = None
        if request.model_type == 'rf':
            from ..analysis.ml_models.random_forest import LandslideRandomForest
            rf = LandslideRandomForest(request.feature_names)
            rf.train(X, y)
            model = rf.model
        elif request.model_type == 'xgb':
            from ..analysis.ml_models.xgboost_model import LandslideXGBoost
            xgb = LandslideXGBoost(request.feature_names)
            xgb.train(X, y)
            model = xgb.model
        elif request.model_type == 'lr':
            from ..analysis.statistical_models.logistic_regression import SusceptibilityLogisticRegression
            lr = SusceptibilityLogisticRegression(request.feature_names)
            lr.train(X, y)
            model = lr.model
        else:
            # Default to RF
            from ..analysis.ml_models.random_forest import LandslideRandomForest
            rf = LandslideRandomForest(request.feature_names)
            rf.train(X, y)
            model = rf.model
            
        if model is None:
             raise HTTPException(status_code=500, detail="Failed to initialize model")
             
        # Run sensitivity analysis
        # We need to pass the unwrapped sklearn model if possible, or the wrapper if it has predict
        # run_sensitivity_analysis expects something with predict or predict_proba
        # The wrapper classes (LandslideRandomForest etc) have predict_proba
        
        # Let's pass the wrapper itself if it has the method, or the sklearn model
        # The wrapper's predict_proba expects (X), but SALib generates numpy arrays
        # The wrapper handles scaling internally?
        # RF/XGB don't scale. LR does.
        # If we pass the sklearn model for LR, we must ensure input is scaled if trained on scaled data.
        # SusceptibilityLogisticRegression scales data. 
        # So for LR, we should pass the wrapper, but the wrapper expects input to be transformed?
        # No, wrapper.predict_proba transforms input using self.scaler.transform(X).
        # So passing the wrapper is correct!
        
        # Re-instantiate wrapper to pass to analysis
        wrapper = None
        if request.model_type == 'lr':
             from ..analysis.statistical_models.logistic_regression import SusceptibilityLogisticRegression
             wrapper = SusceptibilityLogisticRegression(request.feature_names)
             wrapper.train(X, y)
        elif request.model_type == 'rf':
             from ..analysis.ml_models.random_forest import LandslideRandomForest
             wrapper = LandslideRandomForest(request.feature_names)
             wrapper.train(X, y)
        elif request.model_type == 'xgb':
             from ..analysis.ml_models.xgboost_model import LandslideXGBoost
             wrapper = LandslideXGBoost(request.feature_names)
             wrapper.train(X, y)
        else:
             from ..analysis.ml_models.random_forest import LandslideRandomForest
             wrapper = LandslideRandomForest(request.feature_names)
             wrapper.train(X, y)

        results = run_sensitivity_analysis(
            model=wrapper,
            X_train=X,
            feature_names=request.feature_names,
            n_samples=request.n_samples
        )
        
        return {
            "status": "success",
            "results": results
        }
    except Exception as e:
        logger.error(f"Sensitivity analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare-models")
async def compare_models(request: ModelComparisonRequest):
    """
    Compare multiple susceptibility models with statistical tests.
    
    Includes DeLong test for AUC comparison and McNemar test.
    """
    try:
        from ..analysis.comparison.model_comparison import ModelComparator
        
        comparator = ModelComparator()
        comparator.set_ground_truth(np.array(request.ground_truth))
        
        for model_name, model_data in request.models.items():
            comparator.register_model(
                model_name=model_name,
                predictions=np.array(model_data['predictions']),
                probabilities=np.array(model_data['probabilities'])
            )
        
        results = comparator.compare_all()
        
        return {
            "status": "success",
            "results": results
        }
    except Exception as e:
        logger.error(f"Model comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare-models/latex")
async def get_comparison_latex_table(request: ModelComparisonRequest):
    """Generate LaTeX table for model comparison results."""
    try:
        from ..analysis.comparison.model_comparison import ModelComparator
        
        comparator = ModelComparator()
        comparator.set_ground_truth(np.array(request.ground_truth))
        
        for model_name, model_data in request.models.items():
            comparator.register_model(
                model_name=model_name,
                predictions=np.array(model_data['predictions']),
                probabilities=np.array(model_data['probabilities'])
            )
        
        latex_table = comparator.generate_latex_table()
        
        return {
            "status": "success",
            "latex": latex_table
        }
    except Exception as e:
        logger.error(f"LaTeX generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/methods")
async def list_available_methods():
    """List all available susceptibility mapping methods."""
    return {
        "statistical_bivariate": [
            {"name": "Frequency Ratio", "code": "fr", "status": "available"},
            {"name": "Information Value", "code": "iv", "status": "available"},
            {"name": "Certainty Factor", "code": "cf", "status": "available"},
        ],
        "statistical_multivariate": [
            {"name": "Logistic Regression", "code": "lr", "status": "available"},
        ],
        "mcda": [
            {"name": "AHP", "code": "ahp", "status": "available"},
            {"name": "Fuzzy AHP", "code": "fahp", "status": "available"},
            {"name": "TOPSIS", "code": "topsis", "status": "available"},
        ],
        "machine_learning": [
            {"name": "Random Forest", "code": "rf", "status": "available"},
            {"name": "XGBoost", "code": "xgb", "status": "available"},
            {"name": "Support Vector Machine", "code": "svm", "status": "available"},
        ],
        "ensemble": [
            {"name": "Voting Ensemble", "code": "vote", "status": "available"},
            {"name": "Stacking Ensemble", "code": "stack", "status": "available"},
        ]
    }
