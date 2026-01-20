/**
 * AnalysisAssistant - Component for geohazard analysis assistance
 *
 * Provides intelligent assistance for:
 * - Study area validation and suggestions
 * - AHP weight configuration
 * - Real-time analysis execution
 * - Results visualization
 * - Export format guidance
 */

import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Row, Col, Tabs, Tab } from 'react-bootstrap';

const AnalysisAssistant = ({ onAnalysisConfigured }) => {
    const [activeTab, setActiveTab] = useState('study-area');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    // Study area state
    const [studyArea, setStudyArea] = useState({
        min_lat: 6.05,
        max_lat: 6.15,
        min_lon: -0.35,
        max_lon: -0.20
    });

    // AHP weights state
    const [ahpWeights, setAhpWeights] = useState({
        flood: {
            elevation: 0.298,
            slope: 0.158,
            drainage_proximity: 0.298,
            land_use: 0.089,
            soil_permeability: 0.158
        },
        landslide: {
            slope: 0.350,
            aspect: 0.125,
            geology: 0.225,
            land_cover: 0.125,
            rainfall: 0.175
        }
    });

    const handleStudyAreaChange = (field, value) => {
        setStudyArea(prev => ({
            ...prev,
            [field]: parseFloat(value)
        }));
    };

    const handleWeightChange = (hazardType, factor, value) => {
        setAhpWeights(prev => ({
            ...prev,
            [hazardType]: {
                ...prev[hazardType],
                [factor]: parseFloat(value)
            }
        }));
    };

    const validateStudyArea = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/analysis/study-area/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studyArea),
            });

            if (!response.ok) {
                throw new Error(`Validation failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResults({ ...results, validation: data.data });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStudyAreaSuggestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/analysis/study-area/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studyArea),
            });

            if (!response.ok) {
                throw new Error(`Suggestion failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResults({ ...results, suggestions: data.data });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyCustomWeights = async (hazardType) => {
        setLoading(true);
        setError(null);

        try {
            const weights = hazardType === 'flood' ? ahpWeights.flood : ahpWeights.landslide;
            const requestData = {
                [hazardType === 'flood' ? 'flood_weights' : 'landslide_weights']: weights,
                normalize: true
            };

            const response = await fetch('/api/v1/analysis/custom-weights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`Weight application failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResults({ ...results, weightsApplied: data.data });

            if (onAnalysisConfigured) {
                onAnalysisConfigured({ studyArea, weights: ahpWeights });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/analysis/analysis/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    study_area: studyArea,
                    grid_size: 50,
                    include_validation: true
                }),
            });

            if (!response.ok) {
                throw new Error(`Analysis start failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResults({ ...results, analysisStarted: data.data });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5 className="mb-0">🧠 Analysis Assistant</h5>
            </Card.Header>
            <Card.Body>
                <p className="text-muted">
                    Intelligent assistance for configuring and running geohazard analyses.
                    Get validation, suggestions, and real-time execution guidance.
                </p>

                <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                    <Tab eventKey="study-area" title="Study Area">
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Min Latitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={studyArea.min_lat}
                                        onChange={(e) => handleStudyAreaChange('min_lat', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Latitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={studyArea.max_lat}
                                        onChange={(e) => handleStudyAreaChange('max_lat', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Min Longitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={studyArea.min_lon}
                                        onChange={(e) => handleStudyAreaChange('min_lon', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Max Longitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={studyArea.max_lon}
                                        onChange={(e) => handleStudyAreaChange('max_lon', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex gap-2 mb-3">
                            <Button
                                variant="outline-primary"
                                onClick={validateStudyArea}
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm" /> : 'Validate Area'}
                            </Button>
                            <Button
                                variant="outline-info"
                                onClick={getStudyAreaSuggestions}
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm" /> : 'Get Suggestions'}
                            </Button>
                        </div>

                        {results?.validation && (
                            <Alert variant={results.validation.is_valid ? 'success' : 'warning'}>
                                <strong>Validation Results:</strong>
                                <ul className="mb-0 mt-2">
                                    <li>Area: {results.validation.area_km2} km²</li>
                                    <li>Aspect Ratio: {results.validation.aspect_ratio}</li>
                                    {results.validation.warnings.map((warning, idx) => (
                                        <li key={idx} className="text-warning">⚠️ {warning}</li>
                                    ))}
                                    {results.validation.suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="text-info">💡 {suggestion}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}

                        {results?.suggestions && results.suggestions.length > 0 && (
                            <Alert variant="info">
                                <strong>Suggested Improvements:</strong>
                                <ul className="mb-0 mt-2">
                                    {results.suggestions.map((suggestion, idx) => (
                                        <li key={idx}>
                                            <strong>{suggestion.improvement}</strong><br/>
                                            <small className="text-muted">{suggestion.reason}</small>
                                        </li>
                                    ))}
                                </ul>
                            </Alert>
                        )}
                    </Tab>

                    <Tab eventKey="weights" title="AHP Weights">
                        <p className="text-muted">
                            Configure Analytic Hierarchy Process (AHP) weights for multi-criteria analysis.
                            Weights should sum to approximately 1.0.
                        </p>

                        <Row>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>Flood Susceptibility Factors</Card.Header>
                                    <Card.Body>
                                        {Object.entries(ahpWeights.flood).map(([factor, weight]) => (
                                            <Form.Group key={factor} className="mb-2">
                                                <Form.Label className="text-capitalize">
                                                    {factor.replace('_', ' ')}: {weight.toFixed(3)}
                                                </Form.Label>
                                                <Form.Range
                                                    min="0"
                                                    max="0.5"
                                                    step="0.01"
                                                    value={weight}
                                                    onChange={(e) => handleWeightChange('flood', factor, e.target.value)}
                                                />
                                            </Form.Group>
                                        ))}
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => applyCustomWeights('flood')}
                                            disabled={loading}
                                        >
                                            Apply Flood Weights
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>Landslide Susceptibility Factors</Card.Header>
                                    <Card.Body>
                                        {Object.entries(ahpWeights.landslide).map(([factor, weight]) => (
                                            <Form.Group key={factor} className="mb-2">
                                                <Form.Label className="text-capitalize">
                                                    {factor.replace('_', ' ')}: {weight.toFixed(3)}
                                                </Form.Label>
                                                <Form.Range
                                                    min="0"
                                                    max="0.5"
                                                    step="0.01"
                                                    value={weight}
                                                    onChange={(e) => handleWeightChange('landslide', factor, e.target.value)}
                                                />
                                            </Form.Group>
                                        ))}
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => applyCustomWeights('landslide')}
                                            disabled={loading}
                                        >
                                            Apply Landslide Weights
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {results?.weightsApplied && (
                            <Alert variant="success">
                                <strong>Weights Applied Successfully!</strong>
                                Custom AHP weights have been configured for analysis.
                            </Alert>
                        )}
                    </Tab>

                    <Tab eventKey="execution" title="Analysis Execution">
                        <div className="text-center mb-4">
                            <h6>Real-time Analysis Execution</h6>
                            <p className="text-muted">
                                Start comprehensive geohazard analysis with progress tracking.
                            </p>
                            <Button
                                variant="success"
                                size="lg"
                                onClick={startAnalysis}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" className="me-2" />
                                        Starting Analysis...
                                    </>
                                ) : (
                                    '🚀 Start Complete Analysis'
                                )}
                            </Button>
                        </div>

                        {results?.analysisStarted && (
                            <Alert variant="info">
                                <strong>Analysis Started!</strong><br/>
                                Analysis ID: <code>{results.analysisStarted.analysis_id}</code><br/>
                                Use this ID to track progress and retrieve results.
                            </Alert>
                        )}

                        <div className="mt-4">
                            <h6>Analysis Features:</h6>
                            <ul>
                                <li>✅ Flood susceptibility mapping</li>
                                <li>✅ Landslide susceptibility mapping</li>
                                <li>✅ Earthquake risk assessment</li>
                                <li>✅ Infrastructure risk evaluation</li>
                                <li>✅ Model validation and statistics</li>
                                <li>✅ Real-time progress tracking</li>
                            </ul>
                        </div>
                    </Tab>
                </Tabs>

                {error && (
                    <Alert variant="danger" className="mt-3">
                        <strong>Error:</strong> {error}
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AnalysisAssistant;