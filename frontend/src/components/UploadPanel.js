/**
 * UploadPanel Component - Research Ready Version
 * 
 * Features:
 * - Coordinate input for single location analysis
 * - GeoJSON file upload
 * - CSV file upload (latitude, longitude columns)
 * - Downloadable results (CSV, figures, tables)
 */

import React, { useState, useCallback } from 'react';
import { Card, Form, Button, Alert, Spinner, Table, Badge, Tab, Tabs, ButtonGroup, Accordion, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

const UploadPanel = ({ onResultsReceived }) => {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [locationName, setLocationName] = useState('');
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState({});
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState('coordinates');

    // Study Area Configuration
    const [studyArea, setStudyArea] = useState({
        name: '',
        minLat: '',
        maxLat: '',
        minLon: '',
        maxLon: '',
        country: '',
        areaKm2: ''
    });
    const [studyAreaLoading, setStudyAreaLoading] = useState(false);
    const [currentStudyArea, setCurrentStudyArea] = useState(null);

    // Custom AHP Weights
    const [floodWeights, setFloodWeights] = useState({
        elevation: 0.298,
        slope: 0.158,
        drainage_proximity: 0.298,
        land_use: 0.089,
        soil_permeability: 0.158
    });
    const [landslideWeights, setLandslideWeights] = useState({
        slope: 0.350,
        aspect: 0.125,
        geology: 0.225,
        land_cover: 0.125,
        rainfall: 0.175
    });
    const [weightsLoading, setWeightsLoading] = useState(false);
    const [weightsApplied, setWeightsApplied] = useState({ flood: false, landslide: false });

    // Get risk badge color
    const getRiskBadgeColor = (risk) => {
        switch (risk) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Moderate': return 'info';
            case 'Low': return 'success';
            case 'Very Low': return 'secondary';
            default: return 'secondary';
        }
    };

    // Handle single coordinate submission
    const handleSubmitCoordinates = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE}/upload/coordinates`, {
                coordinates: [{
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    name: locationName || null
                }]
            });

            setResults(response.data);
            if (onResultsReceived) {
                onResultsReceived(response.data);
            }
        } catch (err) {
            const errorDetail = err.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string'
                ? errorDetail
                : (errorDetail ? JSON.stringify(errorDetail) : 'Failed to analyze coordinates');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle GeoJSON file upload
    const handleGeoJSONUpload = async (file) => {
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE}/upload/geojson`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResults(response.data);
            if (onResultsReceived) {
                onResultsReceived(response.data);
            }
        } catch (err) {
            const errorDetail = err.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string'
                ? errorDetail
                : (errorDetail ? JSON.stringify(errorDetail) : 'Failed to process GeoJSON file');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle CSV file upload
    const handleCSVUpload = async (file) => {
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE}/upload/csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResults(response.data);
            if (onResultsReceived) {
                onResultsReceived(response.data);
            }
        } catch (err) {
            const errorDetail = err.response?.data?.detail;
            const errorMessage = typeof errorDetail === 'string'
                ? errorDetail
                : (errorDetail ? JSON.stringify(errorDetail) : 'Failed to process CSV file');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle file selection based on type
    const handleFileUpload = (file) => {
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'csv') {
            handleCSVUpload(file);
        } else if (extension === 'geojson' || extension === 'json') {
            handleGeoJSONUpload(file);
        } else {
            setError('Unsupported file format. Please use CSV, GeoJSON, or JSON files.');
        }
    };

    // Drag and drop handlers
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    // ============== EXPORT FUNCTIONS ==============

    // Download results as CSV
    const downloadResultsCSV = async () => {
        if (!results) return;

        setExportLoading(prev => ({ ...prev, csv: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/csv`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                format: 'csv'
            }, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `geohis_results_${results.session_id.slice(0, 8)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download CSV. Please try again.');
        } finally {
            setExportLoading(prev => ({ ...prev, csv: false }));
        }
    };

    // Download figure (risk distribution)
    const downloadFigure = async (figureType, filename) => {
        if (!results) return;

        setExportLoading(prev => ({ ...prev, [figureType]: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/figure/${figureType}`, {
                session_id: results.session_id,
                results: results.results,
                figure_type: figureType
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(`Failed to download figure. Please try again.`);
        } finally {
            setExportLoading(prev => ({ ...prev, [figureType]: false }));
        }
    };

    // Download summary statistics table
    const downloadSummaryTable = async () => {
        if (!results) return;

        setExportLoading(prev => ({ ...prev, summaryTable: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/table/summary`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                format: 'csv'
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `summary_statistics_${results.session_id.slice(0, 8)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download summary table. Please try again.');
        } finally {
            setExportLoading(prev => ({ ...prev, summaryTable: false }));
        }
    };

    // Download risk classification table
    const downloadRiskTable = async () => {
        if (!results) return;

        setExportLoading(prev => ({ ...prev, riskTable: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/table/risk-classification`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                format: 'csv'
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `risk_classification_${results.session_id.slice(0, 8)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download risk table. Please try again.');
        } finally {
            setExportLoading(prev => ({ ...prev, riskTable: false }));
        }
    };

    // ============== STUDY AREA FUNCTIONS ==============

    // Load current study area on mount
    const loadCurrentStudyArea = async () => {
        try {
            const response = await axios.get(`${API_BASE}/study-area/current`);
            setCurrentStudyArea(response.data.config);
        } catch (err) {
            console.log('Could not load study area:', err);
        }
    };

    // Define custom study area
    const handleDefineStudyArea = async (e) => {
        e.preventDefault();
        setStudyAreaLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE}/study-area/define`, {
                name: studyArea.name,
                bounds: {
                    min_latitude: parseFloat(studyArea.minLat),
                    max_latitude: parseFloat(studyArea.maxLat),
                    min_longitude: parseFloat(studyArea.minLon),
                    max_longitude: parseFloat(studyArea.maxLon)
                },
                country: studyArea.country || null,
                area_km2: studyArea.areaKm2 ? parseFloat(studyArea.areaKm2) : null
            });
            setCurrentStudyArea(response.data.config);
            alert('Study area defined successfully!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to define study area');
        } finally {
            setStudyAreaLoading(false);
        }
    };

    // Reset study area to default
    const handleResetStudyArea = async () => {
        try {
            await axios.delete(`${API_BASE}/study-area/reset`);
            setCurrentStudyArea(null);
            setStudyArea({ name: '', minLat: '', maxLat: '', minLon: '', maxLon: '', country: '', areaKm2: '' });
            loadCurrentStudyArea();
            alert('Study area reset to default');
        } catch (err) {
            setError('Failed to reset study area');
        }
    };

    // ============== CUSTOM WEIGHTS FUNCTIONS ==============

    // Calculate weight sum
    const getFloodWeightSum = () => {
        return Object.values(floodWeights).reduce((a, b) => a + b, 0);
    };

    const getLandslideWeightSum = () => {
        return Object.values(landslideWeights).reduce((a, b) => a + b, 0);
    };

    // Apply custom weights
    const handleApplyWeights = async () => {
        setWeightsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE}/analysis/custom-weights`, {
                flood_weights: floodWeights,
                landslide_weights: landslideWeights,
                normalize: true
            });
            setWeightsApplied({ flood: true, landslide: true });
            alert('Custom weights applied successfully!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to apply custom weights');
        } finally {
            setWeightsLoading(false);
        }
    };

    // Reset weights to defaults
    const handleResetWeights = async () => {
        try {
            await axios.delete(`${API_BASE}/analysis/custom-weights/reset`);
            setFloodWeights({
                elevation: 0.298,
                slope: 0.158,
                drainage_proximity: 0.298,
                land_use: 0.089,
                soil_permeability: 0.158
            });
            setLandslideWeights({
                slope: 0.350,
                aspect: 0.125,
                geology: 0.225,
                land_cover: 0.125,
                rainfall: 0.175
            });
            setWeightsApplied({ flood: false, landslide: false });
            alert('Weights reset to defaults');
        } catch (err) {
            setError('Failed to reset weights');
        }
    };

    // ============== LATEX EXPORT FUNCTIONS ==============

    // Download LaTeX summary table
    const downloadLatexSummary = async () => {
        if (!results) return;
        setExportLoading(prev => ({ ...prev, latexSummary: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/latex/summary`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                table_caption: 'Summary Statistics of Susceptibility Analysis',
                include_header: true
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `summary_table_${results.session_id.slice(0, 8)}.tex`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download LaTeX summary');
        } finally {
            setExportLoading(prev => ({ ...prev, latexSummary: false }));
        }
    };

    // Download LaTeX risk classification table
    const downloadLatexRiskClass = async () => {
        if (!results) return;
        setExportLoading(prev => ({ ...prev, latexRisk: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/latex/risk-classification`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                table_caption: 'Distribution of Locations by Risk Classification',
                include_header: true
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `risk_classification_${results.session_id.slice(0, 8)}.tex`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download LaTeX risk table');
        } finally {
            setExportLoading(prev => ({ ...prev, latexRisk: false }));
        }
    };

    // Download LaTeX full results table
    const downloadLatexFullResults = async () => {
        if (!results) return;
        setExportLoading(prev => ({ ...prev, latexFull: true }));

        try {
            const response = await axios.post(`${API_BASE}/export/latex/full-results`, {
                session_id: results.session_id,
                results: results.results,
                summary: results.summary,
                table_caption: 'Complete Analysis Results',
                include_header: true
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `full_results_${results.session_id.slice(0, 8)}.tex`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download LaTeX full results');
        } finally {
            setExportLoading(prev => ({ ...prev, latexFull: false }));
        }
    };

    return (
        <div className="upload-panel">
            {/* Research Configuration Options */}
            <Accordion className="mb-4">
                {/* Study Area Configuration */}
                <Accordion.Item eventKey="0">
                    <Accordion.Header>🌍 Study Area Configuration</Accordion.Header>
                    <Accordion.Body>
                        <p className="text-muted small mb-3">
                            Define your own study area bounds. Points outside this area will be flagged accordingly.
                        </p>

                        {currentStudyArea && (
                            <Alert variant="info" className="mb-3">
                                <strong>Current:</strong> {currentStudyArea.name}<br />
                                <small>Bounds: {currentStudyArea.bounds.min_latitude.toFixed(2)}° to {currentStudyArea.bounds.max_latitude.toFixed(2)}° N,
                                    {currentStudyArea.bounds.min_longitude.toFixed(2)}° to {currentStudyArea.bounds.max_longitude.toFixed(2)}° E</small>
                            </Alert>
                        )}

                        <Form onSubmit={handleDefineStudyArea}>
                            <Form.Group className="mb-2">
                                <Form.Label>Study Area Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Greater Accra Region"
                                    value={studyArea.name}
                                    onChange={(e) => setStudyArea({ ...studyArea, name: e.target.value })}
                                    required
                                />
                            </Form.Group>

                            <Row className="mb-2">
                                <Col>
                                    <Form.Label>Min Latitude *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="5.0"
                                        value={studyArea.minLat}
                                        onChange={(e) => setStudyArea({ ...studyArea, minLat: e.target.value })}
                                        required
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Max Latitude *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="6.0"
                                        value={studyArea.maxLat}
                                        onChange={(e) => setStudyArea({ ...studyArea, maxLat: e.target.value })}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row className="mb-2">
                                <Col>
                                    <Form.Label>Min Longitude *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="-1.0"
                                        value={studyArea.minLon}
                                        onChange={(e) => setStudyArea({ ...studyArea, minLon: e.target.value })}
                                        required
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Max Longitude *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="0.0"
                                        value={studyArea.maxLon}
                                        onChange={(e) => setStudyArea({ ...studyArea, maxLon: e.target.value })}
                                        required
                                    />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ghana"
                                        value={studyArea.country}
                                        onChange={(e) => setStudyArea({ ...studyArea, country: e.target.value })}
                                    />
                                </Col>
                                <Col>
                                    <Form.Label>Area (km²)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="500"
                                        value={studyArea.areaKm2}
                                        onChange={(e) => setStudyArea({ ...studyArea, areaKm2: e.target.value })}
                                    />
                                </Col>
                            </Row>

                            <ButtonGroup className="w-100">
                                <Button variant="primary" type="submit" disabled={studyAreaLoading}>
                                    {studyAreaLoading ? <Spinner animation="border" size="sm" /> : '✓'} Apply Study Area
                                </Button>
                                <Button variant="outline-secondary" onClick={handleResetStudyArea}>
                                    Reset to Default
                                </Button>
                            </ButtonGroup>
                        </Form>
                    </Accordion.Body>
                </Accordion.Item>

                {/* Custom AHP Weights */}
                <Accordion.Item eventKey="1">
                    <Accordion.Header>⚖️ Custom AHP Weights</Accordion.Header>
                    <Accordion.Body>
                        <p className="text-muted small mb-3">
                            Customize factor weights for analysis. Weights will be auto-normalized to sum to 1.0.
                        </p>

                        {/* Flood Weights */}
                        <h6>🌊 Flood Susceptibility Factors</h6>
                        <Row className="mb-2">
                            <Col xs={6}>
                                <Form.Label className="small">Elevation</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={floodWeights.elevation}
                                    onChange={(e) => setFloodWeights({ ...floodWeights, elevation: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6}>
                                <Form.Label className="small">Slope</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={floodWeights.slope}
                                    onChange={(e) => setFloodWeights({ ...floodWeights, slope: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={6}>
                                <Form.Label className="small">Drainage Proximity</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={floodWeights.drainage_proximity}
                                    onChange={(e) => setFloodWeights({ ...floodWeights, drainage_proximity: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6}>
                                <Form.Label className="small">Land Use</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={floodWeights.land_use}
                                    onChange={(e) => setFloodWeights({ ...floodWeights, land_use: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col xs={6}>
                                <Form.Label className="small">Soil Permeability</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={floodWeights.soil_permeability}
                                    onChange={(e) => setFloodWeights({ ...floodWeights, soil_permeability: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6} className="d-flex align-items-end">
                                <Badge bg={Math.abs(getFloodWeightSum() - 1) <= 0.01 ? 'success' : 'warning'}>
                                    Sum: {getFloodWeightSum().toFixed(3)}
                                </Badge>
                            </Col>
                        </Row>

                        <hr />

                        {/* Landslide Weights */}
                        <h6>⛰️ Landslide Susceptibility Factors</h6>
                        <Row className="mb-2">
                            <Col xs={6}>
                                <Form.Label className="small">Slope</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={landslideWeights.slope}
                                    onChange={(e) => setLandslideWeights({ ...landslideWeights, slope: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6}>
                                <Form.Label className="small">Aspect</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={landslideWeights.aspect}
                                    onChange={(e) => setLandslideWeights({ ...landslideWeights, aspect: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={6}>
                                <Form.Label className="small">Geology</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={landslideWeights.geology}
                                    onChange={(e) => setLandslideWeights({ ...landslideWeights, geology: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6}>
                                <Form.Label className="small">Land Cover</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={landslideWeights.land_cover}
                                    onChange={(e) => setLandslideWeights({ ...landslideWeights, land_cover: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col xs={6}>
                                <Form.Label className="small">Rainfall</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={landslideWeights.rainfall}
                                    onChange={(e) => setLandslideWeights({ ...landslideWeights, rainfall: parseFloat(e.target.value) || 0 })}
                                />
                            </Col>
                            <Col xs={6} className="d-flex align-items-end">
                                <Badge bg={Math.abs(getLandslideWeightSum() - 1) <= 0.01 ? 'success' : 'warning'}>
                                    Sum: {getLandslideWeightSum().toFixed(3)}
                                </Badge>
                            </Col>
                        </Row>

                        <ButtonGroup className="w-100">
                            <Button variant="primary" onClick={handleApplyWeights} disabled={weightsLoading}>
                                {weightsLoading ? <Spinner animation="border" size="sm" /> : '✓'} Apply Weights
                            </Button>
                            <Button variant="outline-secondary" onClick={handleResetWeights}>
                                Reset to Defaults
                            </Button>
                        </ButtonGroup>

                        {weightsApplied.flood && weightsApplied.landslide && (
                            <Alert variant="success" className="mt-2 mb-0">
                                ✓ Custom weights are active
                            </Alert>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            {/* Input Tabs: Coordinates, CSV, GeoJSON */}
            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">📤 Upload Research Data</h5>
                </Card.Header>

                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        {/* Coordinates Tab */}
                        <Tab eventKey="coordinates" title="📍 Coordinates">
                            <Form onSubmit={handleSubmitCoordinates}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Latitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="e.g., 6.07"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Valid range: -90° to 90°
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Longitude</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="e.g., -0.24"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Valid range: -180° to 180°
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Location Name (Optional)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., Research Site A"
                                        value={locationName}
                                        onChange={(e) => setLocationName(e.target.value)}
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading} className="w-100">
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        '🔍 Analyze Location'
                                    )}
                                </Button>
                            </Form>
                        </Tab>

                        {/* CSV Upload Tab */}
                        <Tab eventKey="csv" title="📄 CSV File">
                            <div
                                className={`drop-zone p-4 text-center border rounded ${dragActive ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                style={{ cursor: 'pointer', borderStyle: dragActive ? 'solid' : 'dashed' }}
                            >
                                <input
                                    type="file"
                                    id="csv-upload"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="csv-upload" style={{ cursor: 'pointer', width: '100%' }}>
                                    <div className="mb-2" style={{ fontSize: '2.5rem' }}>📄</div>
                                    <p className="mb-1 fw-bold">Drop CSV file here or click to browse</p>
                                    <p className="text-muted small mb-2">
                                        Required columns: <code>latitude</code>, <code>longitude</code>
                                    </p>
                                    <p className="text-muted small">
                                        Optional: <code>name</code>, <code>location</code>, <code>id</code>
                                    </p>
                                </label>
                            </div>
                            {loading && (
                                <div className="text-center mt-3">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Processing CSV data...</p>
                                </div>
                            )}
                        </Tab>

                        {/* GeoJSON Upload Tab */}
                        <Tab eventKey="geojson" title="🗺️ GeoJSON">
                            <div
                                className={`drop-zone p-4 text-center border rounded ${dragActive ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                style={{ cursor: 'pointer', borderStyle: dragActive ? 'solid' : 'dashed' }}
                            >
                                <input
                                    type="file"
                                    id="geojson-upload"
                                    accept=".geojson,.json"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="geojson-upload" style={{ cursor: 'pointer', width: '100%' }}>
                                    <div className="mb-2" style={{ fontSize: '2.5rem' }}>🗺️</div>
                                    <p className="mb-1 fw-bold">Drop GeoJSON file here or click to browse</p>
                                    <p className="text-muted small">
                                        Accepts Point features from FeatureCollection or single Feature
                                    </p>
                                </label>
                            </div>
                            {loading && (
                                <div className="text-center mt-3">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Processing GeoJSON data...</p>
                                </div>
                            )}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Error Display */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Results Display */}
            {results && (
                <>
                    {/* Results Table */}
                    <Card className="mb-4">
                        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">📊 Analysis Results</h5>
                            <Badge bg="light" text="dark">{results.location_count} locations</Badge>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <small className="text-muted">
                                    Session: {results.session_id.slice(0, 8)}... |
                                    Time: {new Date(results.timestamp).toLocaleString()}
                                    {results.source_file && ` | File: ${results.source_file}`}
                                </small>
                            </div>

                            <Table striped bordered hover responsive size="sm">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Location</th>
                                        <th>Flood Risk</th>
                                        <th>Landslide Risk</th>
                                        <th>Combined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.slice(0, 20).map((r, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {r.name || `Point ${idx + 1}`}
                                                <br />
                                                <small className="text-muted">
                                                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                                                </small>
                                            </td>
                                            <td>
                                                <Badge bg={getRiskBadgeColor(r.flood_class)}>
                                                    {r.flood_class}
                                                </Badge>
                                                <br />
                                                <small>{r.flood_susceptibility}%</small>
                                            </td>
                                            <td>
                                                <Badge bg={getRiskBadgeColor(r.landslide_class)}>
                                                    {r.landslide_class}
                                                </Badge>
                                                <br />
                                                <small>{r.landslide_susceptibility}%</small>
                                            </td>
                                            <td>
                                                <Badge bg={getRiskBadgeColor(r.combined_risk)}>
                                                    {r.combined_risk}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {results.results.length > 20 && (
                                <p className="text-muted text-center">
                                    Showing 20 of {results.results.length} results. Download CSV for full data.
                                </p>
                            )}

                            {/* Summary Statistics */}
                            {results.summary && (
                                <div className="mt-3 p-3 bg-light rounded">
                                    <h6>📈 Summary Statistics</h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <small>
                                                <strong>Total Locations:</strong> {results.summary.total_locations || results.summary.locations_analyzed}<br />
                                                <strong>In Study Area:</strong> {results.summary.in_study_area}<br />
                                                <strong>High Risk:</strong> {results.summary.high_risk_locations}
                                            </small>
                                        </div>
                                        <div className="col-md-6">
                                            <small>
                                                <strong>Avg Flood:</strong> {results.summary.average_flood_susceptibility}%<br />
                                                <strong>Avg Landslide:</strong> {results.summary.average_landslide_susceptibility}%
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Download Section */}
                    <Card className="mb-4">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">⬇️ Download for Research</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted mb-3">
                                Download your analysis results in various formats for use in your research papers.
                            </p>

                            {/* Data Downloads */}
                            <div className="mb-4">
                                <h6>📁 Data Tables</h6>
                                <ButtonGroup className="w-100 flex-wrap">
                                    <Button
                                        variant="outline-success"
                                        onClick={downloadResultsCSV}
                                        disabled={exportLoading.csv}
                                        className="mb-2"
                                    >
                                        {exportLoading.csv ? <Spinner animation="border" size="sm" /> : '📄'} Full Results (CSV)
                                    </Button>
                                    <Button
                                        variant="outline-info"
                                        onClick={downloadSummaryTable}
                                        disabled={exportLoading.summaryTable}
                                        className="mb-2"
                                    >
                                        {exportLoading.summaryTable ? <Spinner animation="border" size="sm" /> : '📊'} Summary Statistics
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        onClick={downloadRiskTable}
                                        disabled={exportLoading.riskTable}
                                        className="mb-2"
                                    >
                                        {exportLoading.riskTable ? <Spinner animation="border" size="sm" /> : '📋'} Risk Classification
                                    </Button>
                                </ButtonGroup>
                            </div>

                            {/* Figure Downloads */}
                            <div className="mb-4">
                                <h6>📈 Figures (PNG)</h6>
                                <ButtonGroup className="w-100 flex-wrap">
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => downloadFigure('risk-distribution', `risk_distribution_${results.session_id.slice(0, 8)}.png`)}
                                        disabled={exportLoading['risk-distribution']}
                                        className="mb-2"
                                    >
                                        {exportLoading['risk-distribution'] ? <Spinner animation="border" size="sm" /> : '📊'} Risk Distribution
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => downloadFigure('susceptibility-comparison', `susceptibility_comparison_${results.session_id.slice(0, 8)}.png`)}
                                        disabled={exportLoading['susceptibility-comparison']}
                                        className="mb-2"
                                    >
                                        {exportLoading['susceptibility-comparison'] ? <Spinner animation="border" size="sm" /> : '📈'} Scatter Plot
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => downloadFigure('susceptibility-boxplot', `susceptibility_boxplot_${results.session_id.slice(0, 8)}.png`)}
                                        disabled={exportLoading['susceptibility-boxplot']}
                                        className="mb-2"
                                    >
                                        {exportLoading['susceptibility-boxplot'] ? <Spinner animation="border" size="sm" /> : '📦'} Box Plot
                                    </Button>
                                </ButtonGroup>
                            </div>

                            {/* LaTeX Table Downloads */}
                            <div>
                                <h6>📝 LaTeX Tables (.tex)</h6>
                                <p className="text-muted small mb-2">
                                    Publication-ready tables for inclusion in LaTeX documents.
                                </p>
                                <ButtonGroup className="w-100 flex-wrap">
                                    <Button
                                        variant="outline-dark"
                                        onClick={downloadLatexSummary}
                                        disabled={exportLoading.latexSummary}
                                        className="mb-2"
                                    >
                                        {exportLoading.latexSummary ? <Spinner animation="border" size="sm" /> : '📊'} Summary Table
                                    </Button>
                                    <Button
                                        variant="outline-dark"
                                        onClick={downloadLatexRiskClass}
                                        disabled={exportLoading.latexRisk}
                                        className="mb-2"
                                    >
                                        {exportLoading.latexRisk ? <Spinner animation="border" size="sm" /> : '📋'} Risk Classification
                                    </Button>
                                    <Button
                                        variant="outline-dark"
                                        onClick={downloadLatexFullResults}
                                        disabled={exportLoading.latexFull}
                                        className="mb-2"
                                    >
                                        {exportLoading.latexFull ? <Spinner animation="border" size="sm" /> : '📄'} Full Results (longtable)
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
};

export default UploadPanel;
