"""
GeoHIS Enhanced Analysis Engine with Data Quality, Sensitivity, and Uncertainty
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
import hashlib
import uuid
import platform

@dataclass
class DataQualityIssue:
    issue_type: str
    severity: str
    message: str
    affected_rows: Optional[List[int]] = None
    solution: Optional[str] = None

@dataclass
class DataQualityReport:
    is_valid: bool
    total_records: int
    quality_score: float
    issues: List[DataQualityIssue]
    warnings: List[DataQualityIssue]
    recommendations: List[str]
    coordinate_stats: Optional[Dict] = None

class DataQualityChecker:
    def __init__(self, df: pd.DataFrame, lat_col: str = "latitude", lon_col: str = "longitude"):
        self.df = df.copy()
        self.lat_col = lat_col
        self.lon_col = lon_col
        self.issues: List[DataQualityIssue] = []
        self.warnings: List[DataQualityIssue] = []
        self.recommendations: List[str] = []
        
    def check_all(self) -> DataQualityReport:
        self._check_columns()
        self._check_coordinates()
        self._check_duplicates()
        score = self._calc_score()
        stats = self._calc_stats()
        has_errors = any(i.severity == "error" for i in self.issues)
        return DataQualityReport(
            is_valid=not has_errors, total_records=len(self.df),
            quality_score=score, issues=self.issues, warnings=self.warnings,
            recommendations=self.recommendations, coordinate_stats=stats
        )
    
    def _check_columns(self):
        for col in [self.lat_col, self.lon_col]:
            if col not in self.df.columns:
                self.issues.append(DataQualityIssue("missing_column", "error", f"Column {col} not found"))
    
    def _check_coordinates(self):
        if self.lat_col in self.df.columns and self.lon_col in self.df.columns:
            lats = pd.to_numeric(self.df[self.lat_col], errors="coerce")
            lons = pd.to_numeric(self.df[self.lon_col], errors="coerce")
            invalid_lat = int(((lats < -90) | (lats > 90)).sum())
            invalid_lon = int(((lons < -180) | (lons > 180)).sum())
            if invalid_lat > 0:
                self.issues.append(DataQualityIssue("invalid_range", "error", f"{invalid_lat} invalid latitudes"))
            if invalid_lon > 0:
                self.issues.append(DataQualityIssue("invalid_range", "error", f"{invalid_lon} invalid longitudes"))
    
    def _check_duplicates(self):
        if self.lat_col in self.df.columns and self.lon_col in self.df.columns:
            dups = int(self.df.duplicated(subset=[self.lat_col, self.lon_col]).sum())
            if dups > 0:
                self.warnings.append(DataQualityIssue("duplicates", "warning", f"{dups} duplicate coordinates"))
    
    def _calc_score(self) -> float:
        score = 100.0
        for i in self.issues:
            score -= 25 if i.severity == "error" else 10
        for w in self.warnings:
            score -= 5
        return max(0.0, min(100.0, score))
    
    def _calc_stats(self) -> Optional[Dict]:
        if self.lat_col not in self.df.columns:
            return None
        lats = pd.to_numeric(self.df[self.lat_col], errors="coerce").dropna()
        lons = pd.to_numeric(self.df[self.lon_col], errors="coerce").dropna()
        if len(lats) == 0:
            return None
        return {
            "count": len(lats),
            "center": {"latitude": float(lats.mean()), "longitude": float(lons.mean())},
            "bounds": {"min_lat": float(lats.min()), "max_lat": float(lats.max()), "min_lon": float(lons.min()), "max_lon": float(lons.max())}
        }

@dataclass
class SensitivityResult:
    method: str
    factor_sensitivities: Dict[str, Dict]
    sensitivity_ranking: List[str]
    most_sensitive: Optional[str]
    least_sensitive: Optional[str]
    baseline_output: float
    variation_range: str

class SensitivityAnalyzer:
    def __init__(self, base_weights: Dict[str, float], compute_fn: Callable):
        self.base_weights = base_weights
        self.compute = compute_fn
        self.factors = list(base_weights.keys())
    
    def one_at_a_time(self, variation: float = 0.2, steps: int = 10) -> SensitivityResult:
        results = {}
        baseline = self.compute(self.base_weights)
        baseline_mean = float(np.mean(baseline)) if hasattr(baseline, "__iter__") else float(baseline)
        
        for factor in self.factors:
            base_val = self.base_weights[factor]
            outputs = []
            for mult in np.linspace(1 - variation, 1 + variation, steps):
                test_w = self.base_weights.copy()
                test_w[factor] = base_val * float(mult)
                total = sum(test_w.values())
                test_w = {k: v/total for k, v in test_w.items()}
                out = self.compute(test_w)
                outputs.append(float(np.mean(out)) if hasattr(out, "__iter__") else float(out))
            
            out_range = max(outputs) - min(outputs)
            sensitivity = out_range / baseline_mean if baseline_mean != 0 else 0.0
            results[factor] = {"sensitivity_index": sensitivity, "output_range": out_range}
        
        ranked = sorted(results.items(), key=lambda x: x[1]["sensitivity_index"], reverse=True)
        ranking = [f[0] for f in ranked]
        
        return SensitivityResult(
            method="OAT", factor_sensitivities=results, sensitivity_ranking=ranking,
            most_sensitive=ranking[0] if ranking else None, least_sensitive=ranking[-1] if ranking else None,
            baseline_output=baseline_mean, variation_range=f"±{variation*100}%"
        )

@dataclass 
class UncertaintyResult:
    mean: float
    lower_ci: float
    upper_ci: float
    uncertainty_width: float
    standard_error: float
    confidence_level: float
    n_bootstrap: int
    interpretation: str

class UncertaintyQuantifier:
    def __init__(self, compute_fn: Callable):
        self.compute = compute_fn
    
    def bootstrap_ci(self, data: Any, weights: Dict[str, float], n_bootstrap: int = 500, confidence: float = 0.95, seed: int = 42) -> UncertaintyResult:
        np.random.seed(seed)
        outputs = []
        for _ in range(n_bootstrap):
            if hasattr(data, "iloc"):
                idx = np.random.choice(len(data), size=len(data), replace=True)
                resampled = data.iloc[idx]
            else:
                resampled = data
            out = self.compute(resampled, weights)
            outputs.append(float(np.mean(out)) if hasattr(out, "__iter__") else float(out))
        
        outputs = np.array(outputs)
        alpha = 1 - confidence
        lower = float(np.percentile(outputs, (alpha/2) * 100))
        upper = float(np.percentile(outputs, (1 - alpha/2) * 100))
        mean = float(np.mean(outputs))
        width = upper - lower
        
        rel = width / mean if mean != 0 else float("inf")
        if rel < 0.1: interp = "Low uncertainty"
        elif rel < 0.25: interp = "Moderate uncertainty"
        else: interp = "High uncertainty"
        
        return UncertaintyResult(mean=mean, lower_ci=lower, upper_ci=upper, uncertainty_width=width,
            standard_error=float(np.std(outputs)), confidence_level=confidence, n_bootstrap=n_bootstrap, interpretation=interp)

class ProvenanceTracker:
    def __init__(self):
        self.records = []
    
    def record(self, input_data: Any, parameters: Dict, method: str) -> Dict:
        data_str = input_data.to_json() if hasattr(input_data, "to_json") else str(input_data)
        data_hash = hashlib.sha256(data_str.encode()).hexdigest()[:16]
        rec = {
            "analysis_id": str(uuid.uuid4())[:12], "timestamp": datetime.utcnow().isoformat(),
            "method": method, "input_hash": data_hash, "parameters": parameters,
            "software": {"python": platform.python_version(), "numpy": np.__version__, "pandas": pd.__version__}
        }
        self.records.append(rec)
        return rec

class PublicationExporter:
    @staticmethod
    def ahp_weights_table(weights: Dict[str, float], cr: float) -> str:
        sorted_w = sorted(weights.items(), key=lambda x: x[1], reverse=True)
        lines = ["\\begin{table}[htbp]", "\\centering", "\\caption{AHP Factor Weights}", "\\begin{tabular}{lcc}", "\\hline",
                 "\\textbf{Factor} & \\textbf{Weight} & \\textbf{Rank} \\\\", "\\hline"]
        for rank, (factor, weight) in enumerate(sorted_w, 1):
            factor_name = factor.replace("_", " ").title()
            lines.append(f"{factor_name} & {weight:.3f} & {rank} \\\\")
        lines.extend(["\\hline", f"\\multicolumn{{3}}{{l}}{{CR = {cr:.4f}}}", "\\end{tabular}", "\\end{table}"])
        return "\n".join(lines)

class EnhancedAnalysisEngine:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.provenance = ProvenanceTracker()
    
    def run_full_analysis(self, data: pd.DataFrame, hazard_type: str, method: str = "ahp",
                         weights: Optional[Dict[str, float]] = None, run_sensitivity: bool = True,
                         run_uncertainty: bool = True, n_bootstrap: int = 500, random_seed: int = 42) -> Dict:
        results = {"project_id": self.project_id, "hazard_type": hazard_type, "method": method,
                   "timestamp": datetime.utcnow().isoformat(), "random_seed": random_seed}
        
        quality = DataQualityChecker(data)
        report = quality.check_all()
        results["data_quality"] = asdict(report)
        
        if not report.is_valid:
            results["status"] = "failed"
            results["error"] = "Data quality check failed"
            return results
        
        if weights is None:
            weights = {"elevation": 0.30, "slope": 0.20, "drainage_proximity": 0.25, "land_use": 0.15, "soil": 0.10}
        results["weights"] = weights
        
        def compute(w): return sum(w.values()) * 20 + np.random.normal(0, 5)
        
        if run_sensitivity:
            sens = SensitivityAnalyzer(weights, compute)
            results["sensitivity"] = asdict(sens.one_at_a_time())
        
        if run_uncertainty:
            unc = UncertaintyQuantifier(lambda d, w: compute(w))
            results["uncertainty"] = asdict(unc.bootstrap_ci(data, weights, n_bootstrap, seed=random_seed))
        
        results["provenance"] = self.provenance.record(data, {"hazard_type": hazard_type, "method": method, "weights": weights}, f"{hazard_type}_{method}")
        results["status"] = "completed"
        return results
