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


class ModelComparisonRequest(BaseModel):
    ground_truth: List[int]
    models: Dict[str, Dict[str, List[float]]]


class CFAnalysisRequest(BaseModel):
    total_study_area: float
    total_hazard_area: float
    hazard_type: str = "landslide"
    factors: Dict[str, List[Dict[str, Any]]]


# Endpoints

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
    """
    try:
        from ..analysis.statistical_models.logistic_regression import SusceptibilityLogisticRegression
        
        X = np.array(request.features)
        y = np.array(request.labels)
        
        model = SusceptibilityLogisticRegression(
            feature_names=request.feature_names
        )
        
        results = model.train(X, y, test_size=request.test_size)
        
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
    """
    try:
        from ..analysis.ml_models.svm_model import LandslideSVM
        
        X = np.array(request.features)
        y = np.array(request.labels)
        
        model = LandslideSVM(feature_names=request.feature_names)
        model.train(X, y, test_size=request.test_size)
        
        return {
            "status": "success",
            "results": model.get_report()
        }
    except Exception as e:
        logger.error(f"SVM analysis error: {str(e)}")
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
