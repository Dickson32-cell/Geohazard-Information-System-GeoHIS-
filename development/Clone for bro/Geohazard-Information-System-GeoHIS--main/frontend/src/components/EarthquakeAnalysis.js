/**
 * EarthquakeAnalysis - Component for earthquake susceptibility analysis
 *
 * Provides interface for configuring and running earthquake risk assessment
 * using multi-criteria analysis with factors like fault proximity, PGA, soil type, etc.
 */

import React, { useState } from 'react';
import { Card, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';

const EarthquakeAnalysis = ({ onAnalysisComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [studyArea, setStudyArea] = useState({
        min_lat: 6.05,
        max_lat: 6.15,
        min_lon: -0.35,
        max_lon: -0.20
    });

    const handleInputChange = (field, value) => {
        setStudyArea(prev => ({
            ...prev,
            [field]: parseFloat(value)
        }));
    };

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/analysis/earthquake-susceptibility', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    study_area: studyArea,
                    use_sample_data: true
                }),
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                setResults(data.data);
                if (onAnalysisComplete) {
                    onAnalysisComplete(data.data);
                }
            } else {
                throw new Error(data.message || 'Analysis failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5 className="mb-0">Earthquake Susceptibility Analysis</h5>
            </Card.Header>
            <Card.Body>
                <p className="text-muted">
                    Analyze earthquake risk using multi-criteria evaluation with factors including
                    fault proximity, peak ground acceleration, soil amplification, building density,
                    and seismic history.
                </p>

                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Min Latitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={studyArea.min_lat}
                                    onChange={(e) => handleInputChange('min_lat', e.target.value)}
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
                                    onChange={(e) => handleInputChange('max_lat', e.target.value)}
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
                                    onChange={(e) => handleInputChange('min_lon', e.target.value)}
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
                                    onChange={(e) => handleInputChange('max_lon', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-grid">
                        <Button
                            variant="primary"
                            onClick={runAnalysis}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Running Analysis...
                                </>
                            ) : (
                                'Run Earthquake Analysis'
                            )}
                        </Button>
                    </div>
                </Form>

                {error && (
                    <Alert variant="danger" className="mt-3">
                        <strong>Error:</strong> {error}
                    </Alert>
                )}

                {results && (
                    <Alert variant="success" className="mt-3">
                        <strong>Analysis Complete!</strong>
                        <div className="mt-2">
                            <small>
                                Method: {results.method}<br/>
                                Timestamp: {new Date(results.timestamp).toLocaleString()}<br/>
                                Statistics: Mean {results.statistics.mean.toFixed(2)},
                                Std Dev {results.statistics.std.toFixed(2)}
                            </small>
                        </div>
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default EarthquakeAnalysis;