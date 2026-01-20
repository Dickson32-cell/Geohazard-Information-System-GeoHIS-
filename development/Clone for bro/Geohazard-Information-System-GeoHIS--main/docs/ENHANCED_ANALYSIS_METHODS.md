# GeoHIS Enhanced Analysis Methods

## New Statistical Models (January 2026)

This document describes the new analysis methods added to GeoHIS for research-ready geohazard susceptibility mapping.

---

## Available Methods

### 1. Statistical Bivariate Methods

#### Information Value (IV) / Weight of Evidence (WoE)
```python
from app.analysis.statistical_models import InformationValueAnalyzer

analyzer = InformationValueAnalyzer(
    total_study_area=110.0,  # km²
    total_hazard_area=0.5,   # km²
    hazard_type="landslide"
)

analyzer.add_factor('slope', [
    {'class_name': '0-5°', 'class_area': 15.0, 'hazard_area': 0.01},
    {'class_name': '5-15°', 'class_area': 30.0, 'hazard_area': 0.05},
    # ...
])

results = analyzer.to_dict()
```

**Formula:** `IV = ln(Densclass / Densmap)`

**Interpretation:**
- IV > 0: Positive correlation with hazard
- IV < 0: Negative correlation
- IV ≈ 0: No correlation

#### Certainty Factor (CF)
```python
from app.analysis.statistical_models import CertaintyFactorAnalyzer

analyzer = CertaintyFactorAnalyzer(
    total_study_area=110.0,
    total_hazard_area=0.5
)
# Same usage pattern as IV
```

**Formula:**
- If PPa >= PPs: `CF = (PPa - PPs) / (1 - PPs)`
- If PPa < PPs: `CF = (PPa - PPs) / PPs`

**Range:** -1 to +1

---

### 2. Statistical Multivariate Methods

#### Logistic Regression (LR)
```python
from app.analysis.statistical_models import SusceptibilityLogisticRegression

model = SusceptibilityLogisticRegression(
    feature_names=['slope', 'elevation', 'drainage_dist', 'geology']
)

results = model.train(X, y, test_size=0.3)
print(results['coefficients'])  # Includes p-values, odds ratios, CIs
print(results['model_fit'])     # McFadden R², AIC, BIC
```

**Features:**
- Coefficient statistics (SE, z-statistic, p-value)
- Odds ratios with 95% CI
- McFadden's R², Nagelkerke R²
- VIF for multicollinearity

---

### 3. Machine Learning Methods

#### Support Vector Machine (SVM)
```python
from app.analysis.ml_models import LandslideSVM

model = LandslideSVM(feature_names=['slope', 'elevation', ...])
metrics = model.train(X, y)
probabilities = model.predict_proba(X_new)
```

#### Ensemble Methods
```python
from app.analysis.ml_models import EnsembleModel

ensemble = EnsembleModel(ensemble_type='soft_voting')
ensemble.add_predictions('RF', rf_preds, rf_probs)
ensemble.add_predictions('XGB', xgb_preds, xgb_probs)
ensemble.add_predictions('SVM', svm_preds, svm_probs)

predictions, probabilities = ensemble.predict()
metrics = ensemble.evaluate(y_true)
```

---

### 4. Model Comparison Framework

```python
from app.analysis.comparison import ModelComparator

comparator = ModelComparator()
comparator.set_ground_truth(y_true)

comparator.register_model('FR', fr_preds, fr_probs)
comparator.register_model('IV', iv_preds, iv_probs)
comparator.register_model('LR', lr_preds, lr_probs)
comparator.register_model('RF', rf_preds, rf_probs)

results = comparator.compare_all()

# Statistical tests
print(results['statistical_tests'])  # DeLong, McNemar tests
print(results['ranking'])            # Models ranked by AUC
print(results['best_model'])

# Generate LaTeX table
latex = comparator.generate_latex_table()
```

---

## API Endpoints

### Enhanced Analysis API (v2)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/v2/information-value` | POST | Run IV analysis |
| `/api/analysis/v2/certainty-factor` | POST | Run CF analysis |
| `/api/analysis/v2/logistic-regression` | POST | Run LR with diagnostics |
| `/api/analysis/v2/svm` | POST | Run SVM analysis |
| `/api/analysis/v2/compare-models` | POST | Compare multiple models |
| `/api/analysis/v2/compare-models/latex` | POST | Get LaTeX comparison table |
| `/api/analysis/v2/methods` | GET | List available methods |

### Example API Request

```bash
curl -X POST "http://localhost:8001/api/analysis/v2/information-value" \
  -H "Content-Type: application/json" \
  -d '{
    "total_study_area": 110.0,
    "total_hazard_area": 0.5,
    "hazard_type": "landslide",
    "factors": {
      "slope": [
        {"class_name": "0-5deg", "class_area": 15.0, "hazard_area": 0.01},
        {"class_name": "5-15deg", "class_area": 30.0, "hazard_area": 0.05}
      ]
    }
  }'
```

---

## Validation Metrics

All models provide comprehensive validation:

| Metric | Description |
|--------|-------------|
| AUC-ROC | Area Under ROC Curve |
| AUC-PR | Area Under Precision-Recall Curve |
| Accuracy | Overall classification accuracy |
| Precision | Positive predictive value |
| Recall | Sensitivity / True positive rate |
| Specificity | True negative rate |
| F1-Score | Harmonic mean of precision and recall |
| Kappa | Cohen's Kappa coefficient |
| AUSRC | Area Under Success Rate Curve |

---

## References

1. Yin, K.L. & Yan, T.Z. (1988). Statistical prediction model for slope instability.
2. Shortliffe, E.H. & Buchanan, B.G. (1975). A model of inexact reasoning.
3. Hosmer, D.W. & Lemeshow, S. (2000). Applied Logistic Regression.
4. DeLong, E.R. et al. (1988). Comparing the areas under ROC curves.
5. Chung, C.J. & Fabbri, A.G. (2003). Validation of spatial prediction models.
