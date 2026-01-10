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
import { Card, Form, Button, Alert, Spinner, Table, Badge, Tab, Tabs, ButtonGroup } from 'react-bootstrap';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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
            setError(err.response?.data?.detail || 'Failed to analyze coordinates');
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
            setError(err.response?.data?.detail || 'Failed to process GeoJSON file');
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
            setError(err.response?.data?.detail || 'Failed to process CSV file');
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

    return (
        <div className="upload-panel">
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
                            <div>
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
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
};

export default UploadPanel;
