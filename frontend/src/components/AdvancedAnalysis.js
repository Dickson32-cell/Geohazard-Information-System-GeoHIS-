import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Tab, Tabs, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const API_BASE = '/api/analysis/v2';

const AdvancedAnalysis = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [data, setData] = useState(null); // { features: [], labels: [], featureNames: [] }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [sensitivityResults, setSensitivityResults] = useState(null);

    // Configuration State
    const [config, setConfig] = useState({
        modelType: 'rf', // rf, xgb, svm, lr
        targetColumn: '',
        selectedFeatures: [],
        testSize: 0.3,
        cvFolds: 5,
        tuneHyperparameters: false,
        spatialCV: false
    });

    // Handle CSV Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].split(',').map(h => h.trim());
                const rows = lines.slice(1).map(l => l.split(',').map(v => parseFloat(v.trim())));

                // Basic validation
                if (rows.length < 10) throw new Error("Dataset too small (need > 10 rows)");
                
                setData({
                    headers,
                    rows,
                    fileName: file.name
                });
                
                // Auto-select last column as target, others as features
                setConfig(prev => ({
                    ...prev,
                    targetColumn: headers[headers.length - 1],
                    selectedFeatures: headers.slice(0, headers.length - 1)
                }));
                
                setActiveTab('configure');
            } catch (err) {
                setError("Failed to parse CSV. Ensure it has headers and numeric values.");
            }
        };
        reader.readAsText(file);
    };

    // Run Model Training
    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            // Prepare data
            const targetIdx = data.headers.indexOf(config.targetColumn);
            const featureIndices = config.selectedFeatures.map(f => data.headers.indexOf(f));
            
            const features = data.rows.map(row => featureIndices.map(i => row[i]));
            const labels = data.rows.map(row => Math.round(row[targetIdx])); // Ensure binary int

            // Determine endpoint
            let endpoint = '';
            let payload = {
                features,
                labels,
                feature_names: config.selectedFeatures,
                test_size: parseFloat(config.testSize),
                tune_hyperparameters: config.tuneHyperparameters
            };

            if (config.modelType === 'rf') {
                endpoint = '/random-forest';
                payload.n_estimators = 100;
            } else if (config.modelType === 'xgb') {
                endpoint = '/xgboost';
                payload.n_estimators = 100;
            } else if (config.modelType === 'lr') {
                endpoint = '/logistic-regression';
            } else if (config.modelType === 'svm') {
                endpoint = '/svm';
            }

            // Spatial CV (Simulator: generate fake coords if not provided in CSV)
            // In a real app, user would select Lat/Lon columns.
            // For now, if spatialCV is checked, we try to find Lat/Lon columns
            if (config.spatialCV) {
                const latIdx = data.headers.findIndex(h => h.toLowerCase().includes('lat'));
                const lonIdx = data.headers.findIndex(h => h.toLowerCase().includes('lon'));
                
                if (latIdx >= 0 && lonIdx >= 0) {
                    payload.coordinates = data.rows.map(row => [row[latIdx], row[lonIdx]]);
                } else {
                    setError("Cannot run Spatial CV: Latitude/Longitude columns not found.");
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.post(`${API_BASE}${endpoint}`, payload);
            setResults(response.data.results);
            setActiveTab('results');

        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Run Sensitivity Analysis
    const runSensitivity = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const targetIdx = data.headers.indexOf(config.targetColumn);
            const featureIndices = config.selectedFeatures.map(f => data.headers.indexOf(f));
            
            const features = data.rows.map(row => featureIndices.map(i => row[i]));
            const labels = data.rows.map(row => Math.round(row[targetIdx]));

            const payload = {
                model_type: config.modelType,
                features,
                labels,
                feature_names: config.selectedFeatures,
                n_samples: 256
            };

            const response = await axios.post(`${API_BASE}/sensitivity-analysis`, payload);
            setSensitivityResults(response.data.results);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Chart Data Helpers
    const getFeatureImportanceChart = () => {
        if (!results || !results.feature_importance) return null;
        
        const sorted = results.feature_importance.ranked_features;
        const labels = sorted.map(x => x[0]);
        const values = sorted.map(x => x[1]);

        return {
            labels,
            datasets: [{
                label: 'Feature Importance (Gini)',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }]
        };
    };

    const getSensitivityChart = () => {
        if (!sensitivityResults) return null;
        
        const labels = Object.keys(sensitivityResults.total_order);
        const s1 = Object.values(sensitivityResults.first_order);
        const st = Object.values(sensitivityResults.total_order);

        return {
            labels,
            datasets: [
                {
                    label: 'Total Order (ST)',
                    data: st,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
                {
                    label: 'First Order (S1)',
                    data: s1,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                }
            ]
        };
    };

    return (
        <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">🧠 Advanced ML Analysis</h5>
            </Card.Header>
            <Card.Body>
                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                    
                    <Tab eventKey="upload" title="1. Data Upload">
                        <div className="p-4 text-center border border-dashed rounded">
                            <h5>Upload Training Data (CSV)</h5>
                            <p className="text-muted">Required: Numerical features and a binary target column.</p>
                            <Form.Group controlId="formFile" className="mb-3 w-50 mx-auto">
                                <Form.Control type="file" accept=".csv" onChange={handleFileUpload} />
                            </Form.Group>
                            {data && (
                                <Alert variant="success">
                                    Loaded {data.rows.length} rows, {data.headers.length} columns from {data.fileName}
                                </Alert>
                            )}
                        </div>
                    </Tab>

                    <Tab eventKey="configure" title="2. Configuration" disabled={!data}>
                        <Row>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>Model Settings</Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Model Type</Form.Label>
                                            <Form.Select 
                                                value={config.modelType}
                                                onChange={e => setConfig({...config, modelType: e.target.value})}
                                            >
                                                <option value="rf">Random Forest (Ensemble)</option>
                                                <option value="xgb">XGBoost (Gradient Boosting)</option>
                                                <option value="svm">Support Vector Machine</option>
                                                <option value="lr">Logistic Regression</option>
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Target Column (Label)</Form.Label>
                                            <Form.Select 
                                                value={config.targetColumn}
                                                onChange={e => setConfig({...config, targetColumn: e.target.value})}
                                            >
                                                {data?.headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Check 
                                            type="switch"
                                            label="Hyperparameter Tuning (Grid Search)"
                                            checked={config.tuneHyperparameters}
                                            onChange={e => setConfig({...config, tuneHyperparameters: e.target.checked})}
                                            className="mb-2"
                                        />
                                        <Form.Check 
                                            type="switch"
                                            label="Spatial Cross-Validation (Requires Lat/Lon)"
                                            checked={config.spatialCV}
                                            onChange={e => setConfig({...config, spatialCV: e.target.checked})}
                                        />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>Feature Selection</Card.Header>
                                    <Card.Body style={{maxHeight: '300px', overflowY: 'auto'}}>
                                        {data?.headers.map(h => (
                                            <Form.Check 
                                                key={h}
                                                type="checkbox"
                                                label={h}
                                                checked={config.selectedFeatures.includes(h)}
                                                disabled={h === config.targetColumn}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setConfig(prev => ({...prev, selectedFeatures: [...prev.selectedFeatures, h]}));
                                                    } else {
                                                        setConfig(prev => ({...prev, selectedFeatures: prev.selectedFeatures.filter(f => f !== h)}));
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Card.Body>
                                </Card>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    className="w-100"
                                    onClick={runAnalysis}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner size="sm" /> : '🚀 Run Analysis'}
                                </Button>
                            </Col>
                        </Row>
                    </Tab>

                    <Tab eventKey="results" title="3. Results & Sensitivity" disabled={!results}>
                        {results && (
                            <>
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="text-center h-100 border-primary">
                                            <Card.Body>
                                                <h3>{results.metrics.auc_roc}</h3>
                                                <small>AUC-ROC</small>
                                                {results.metrics.auc_ci_lower && (
                                                    <div className="text-muted small">
                                                        95% CI: [{results.metrics.auc_ci_lower}, {results.metrics.auc_ci_upper}]
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center h-100">
                                            <Card.Body>
                                                <h3>{results.metrics.accuracy}</h3>
                                                <small>Accuracy</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center h-100">
                                            <Card.Body>
                                                <h3>{results.metrics.f1_score}</h3>
                                                <small>F1 Score</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center h-100">
                                            <Card.Body>
                                                <h3>{results.metrics.validation_method}</h3>
                                                <small>Validation Method</small>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Card className="mb-4">
                                            <Card.Header>Feature Importance</Card.Header>
                                            <Card.Body>
                                                <Bar data={getFeatureImportanceChart()} />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="mb-4">
                                            <Card.Header className="d-flex justify-content-between">
                                                <span>Sobol Sensitivity Analysis</span>
                                                <Button size="sm" variant="outline-dark" onClick={runSensitivity} disabled={loading || sensitivityResults}>
                                                    {loading ? 'Running...' : 'Run GSA'}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {sensitivityResults ? (
                                                    <Bar 
                                                        data={getSensitivityChart()} 
                                                        options={{
                                                            plugins: {
                                                                title: { display: true, text: 'First Order vs Total Order Sensitivity' }
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-center p-5 text-muted">
                                                        <p>Run Global Sensitivity Analysis to quantify input variance contributions.</p>
                                                        <small>Computationally intensive (Sobol Method)</small>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {results.uncertainty && (
                                    <Alert variant="info">
                                        <strong>Uncertainty Quantification:</strong><br/>
                                        Mean Epistemic Uncertainty (Std Dev): {results.uncertainty.mean_uncertainty.toFixed(4)}
                                    </Alert>
                                )}
                            </>
                        )}
                    </Tab>
                </Tabs>

                {error && <Alert variant="danger">{error}</Alert>}
            </Card.Body>
        </Card>
    );
};

export default AdvancedAnalysis;
