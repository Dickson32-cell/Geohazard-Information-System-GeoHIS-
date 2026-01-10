/**
 * UploadPanel Component
 * Allows users to upload coordinates or GeoJSON files for susceptibility analysis
 */

import React, { useState, useCallback } from 'react';
import { Card, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8002/api/v1';

const UploadPanel = ({ onResultsReceived }) => {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [locationName, setLocationName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);

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

    // Handle file upload
    const handleFileUpload = async (file) => {
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE}/upload/geojson`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setResults(response.data);
            if (onResultsReceived) {
                onResultsReceived(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process file');
        } finally {
            setLoading(false);
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

    return (
        <div className="upload-panel">
            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">📍 Analyze Your Location</h5>
                </Card.Header>
                <Card.Body>
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
                                Study area: 6.02° to 6.12° N
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
                                Study area: -0.30° to -0.18° E
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Location Name (Optional)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., My Property"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                            />
                        </Form.Group>

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                            className="w-100"
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Location'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">📁 Upload GeoJSON File</h5>
                </Card.Header>
                <Card.Body>
                    <div
                        className={`drop-zone p-4 text-center border rounded ${dragActive ? 'bg-primary bg-opacity-10 border-primary' : 'border-dashed'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{ cursor: 'pointer', borderStyle: dragActive ? 'solid' : 'dashed' }}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            accept=".geojson,.json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%' }}>
                            <div className="mb-2">
                                <i className="bi bi-cloud-upload" style={{ fontSize: '2rem' }}></i>
                            </div>
                            <p className="mb-1">Drag & drop a GeoJSON file here</p>
                            <p className="text-muted small">or click to browse</p>
                        </label>
                    </div>
                    <Form.Text className="text-muted">
                        Accepts GeoJSON files with Point features (max 100 points)
                    </Form.Text>
                </Card.Body>
            </Card>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {results && (
                <Card className="mb-4">
                    <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">📊 Analysis Results</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <strong>Session ID:</strong> {results.session_id}<br />
                            <strong>Analyzed:</strong> {results.location_count} location(s)<br />
                            <strong>Timestamp:</strong> {new Date(results.timestamp).toLocaleString()}
                        </div>

                        <Table striped bordered hover responsive size="sm">
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Flood Risk</th>
                                    <th>Landslide Risk</th>
                                    <th>Combined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.results.map((r, idx) => (
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

                        {results.summary && (
                            <div className="mt-3 p-3 bg-light rounded">
                                <h6>Summary</h6>
                                <small>
                                    <strong>Average Flood Susceptibility:</strong> {results.summary.average_flood_susceptibility}%<br />
                                    <strong>Average Landslide Susceptibility:</strong> {results.summary.average_landslide_susceptibility}%<br />
                                    <strong>High Risk Locations:</strong> {results.summary.high_risk_locations}<br />
                                    <strong>In Study Area:</strong> {results.summary.in_study_area} of {results.summary.locations_analyzed}
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default UploadPanel;
