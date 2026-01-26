# Changelog

## [1.1.0] - 2026-01-25
### Scientific Improvements
- **Advanced Validation:** Replaced manual trapezoidal AUC with scikit-learn's `roc_auc_score` and added 95% bootstrap confidence intervals for all models.
- **Spatial Cross-Validation:** Implemented checkerboard spatial splitting (`SpatialSplitter`) for Random Forest, XGBoost, SVM, and Logistic Regression to prevent spatial autocorrelation data leakage.
- **Uncertainty Quantification:** Added epistemic uncertainty estimation (std dev of predictions) for ML models using spatial CV ensembles.
- **Statistical Rigor:** Added Chi-square significance tests for Frequency Ratio analysis and Laplace smoothing for Information Value method.

### Added
- **API V2:** New endpoints for Random Forest, XGBoost, and Sensitivity Analysis.
- **Sensitivity Analysis:** Implemented Sobol Global Sensitivity Analysis (GSA) using `SALib` to quantify input factor contributions to model variance.
- **XGBoost & SVM Models:** Enhanced with spatial CV, hyperparameter tuning, and uncertainty quantification.
- **Centralized Classification:** Created `classification.py` for consistent susceptibility mapping thresholds (Natural Breaks, Quantile, Fixed).
- **Testing:** Comprehensive test suite (`tests/test_ml_models.py`) covering all ML/statistical models and validation logic.
- **Documentation:** Added PhD-level code review document (`docs/PHD_CODE_REVIEW.md`).

### Fixed
- **Type Safety:** Improved type hints across statistical models.
- **Error Handling:** Fixed bare except clauses in Logistic Regression and Frequency Ratio modules.
- **Security:** Added password complexity validation to authentication schemas.

## [1.0.0] - 2026-01-10
### Added
- Initial public release
- AHP flood susceptibility analysis
- Frequency Ratio landslide analysis
- JWT authentication
- Docker deployment support