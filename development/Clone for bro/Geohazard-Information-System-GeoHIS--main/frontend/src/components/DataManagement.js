/**
 * DataManagement Component - Manage geospatial raster data
 * 
 * Features:
 * - View data layer status
 * - Upload raster files
 * - Generate sample data for testing
 * - Clear all data
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Badge, ProgressBar, Table, Form, ButtonGroup } from 'react-bootstrap';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

const DataManagement = ({ onDataChange }) => {
    const [dataStatus, setDataStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({});
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load data status on mount
    useEffect(() => {
        loadDataStatus();
    }, []);

    const loadDataStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_BASE + '/data/status');
            setDataStatus(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load data status: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (layerType, file) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [layerType]: true }));
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                API_BASE + '/data/upload/' + layerType,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            
            setSuccess('Successfully uploaded ' + response.data.filename);
            await loadDataStatus();
            if (onDataChange) onDataChange();
        } catch (err) {
            setError('Upload failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setUploading(prev => ({ ...prev, [layerType]: false }));
        }
    };

    const handleGenerateSample = async () => {
        setGenerating(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post(API_BASE + '/data/generate-sample');
            setSuccess(response.data.message + ' - ' + response.data.note);
            await loadDataStatus();
            if (onDataChange) onDataChange();
        } catch (err) {
            setError('Failed to generate sample data: ' + (err.response?.data?.detail || err.message));
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteLayer = async (layerType) => {
        if (!window.confirm('Delete ' + layerType + ' data?')) return;

        try {
            await axios.delete(API_BASE + '/data/' + layerType);
            setSuccess('Deleted ' + layerType + ' data');
            await loadDataStatus();
            if (onDataChange) onDataChange();
        } catch (err) {
            setError('Failed to delete: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Delete ALL uploaded data? This cannot be undone.')) return;

        try {
            const response = await axios.delete(API_BASE + '/data/clear-all');
            setSuccess('Cleared ' + response.data.deleted_layers.length + ' data layers');
            await loadDataStatus();
            if (onDataChange) onDataChange();
        } catch (err) {
            setError('Failed to clear data: ' + (err.response?.data?.detail || err.message));
        }
    };

    const getLayerBadge = (isAvailable) => {
        return isAvailable 
            ? <Badge bg="success">Available</Badge>
            : <Badge bg="secondary">Not Uploaded</Badge>;
    };

    if (loading) {
        return (
            <Card className="mb-4">
                <Card.Body className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 mb-0">Loading data status...</p>
                </Card.Body>
            </Card>
        );
    }

    const floodReady = dataStatus?.flood_ready;
    const landslideReady = dataStatus?.landslide_ready;
    const availableCount = dataStatus?.available_layers || 0;
    const totalCount = dataStatus?.total_layers || 7;

    return (
        <Card className="mb-4">
            <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📊 Data Management</h5>
                <Button variant="light" size="sm" onClick={loadDataStatus}>
                    🔄 Refresh
                </Button>
            </Card.Header>
            <Card.Body>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* Status Overview */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                        <span>Data Layers: {availableCount} / {totalCount}</span>
                        <span>{Math.round((availableCount / totalCount) * 100)}%</span>
                    </div>
                    <ProgressBar>
                        <ProgressBar variant="success" now={(availableCount / totalCount) * 100} />
                    </ProgressBar>
                </div>

                {/* Analysis Readiness */}
                <div className="mb-4 p-3 bg-light rounded">
                    <h6>Analysis Readiness</h6>
                    <div className="d-flex gap-3">
                        <div>
                            <Badge bg={floodReady ? "success" : "warning"} className="me-2">
                                {floodReady ? "✓" : "○"}
                            </Badge>
                            Flood Analysis {floodReady ? "Ready" : "Needs Data"}
                        </div>
                        <div>
                            <Badge bg={landslideReady ? "success" : "warning"} className="me-2">
                                {landslideReady ? "✓" : "○"}
                            </Badge>
                            Landslide Analysis {landslideReady ? "Ready" : "Needs Data"}
                        </div>
                    </div>
                    {!floodReady && !landslideReady && (
                        <p className="text-muted small mt-2 mb-0">
                            Running in <strong>Demo Mode</strong>. Generate sample data or upload rasters for real analysis.
                        </p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mb-4">
                    <h6>Quick Actions</h6>
                    <ButtonGroup className="w-100">
                        <Button 
                            variant="primary" 
                            onClick={handleGenerateSample}
                            disabled={generating}
                        >
                            {generating ? (
                                <><Spinner animation="border" size="sm" className="me-2" />Generating...</>
                            ) : (
                                "🎲 Generate Sample Data"
                            )}
                        </Button>
                        <Button 
                            variant="outline-danger" 
                            onClick={handleClearAll}
                            disabled={availableCount === 0}
                        >
                            🗑️ Clear All Data
                        </Button>
                    </ButtonGroup>
                    <small className="text-muted d-block mt-1">
                        Sample data is synthetic and for demonstration only.
                    </small>
                </div>

                {/* Layer Details */}
                <h6>Data Layers</h6>
                <Table size="sm" striped>
                    <thead>
                        <tr>
                            <th>Layer</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataStatus?.layers && Object.entries(dataStatus.layers).map(([key, layer]) => (
                            <tr key={key}>
                                <td>
                                    <strong>{layer.name}</strong>
                                    <br />
                                    <small className="text-muted">{layer.description}</small>
                                </td>
                                <td>{getLayerBadge(layer.is_available)}</td>
                                <td>
                                    {layer.is_available ? (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => handleDeleteLayer(key)}
                                        >
                                            Delete
                                        </Button>
                                    ) : (
                                        <>
                                            <Form.Control
                                                type="file"
                                                size="sm"
                                                accept=".tif,.tiff,.img,.asc"
                                                onChange={(e) => handleFileUpload(key, e.target.files[0])}
                                                disabled={uploading[key]}
                                                style={{ width: '150px', display: 'inline-block' }}
                                            />
                                            {uploading[key] && <Spinner animation="border" size="sm" className="ms-2" />}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {/* Storage Info */}
                {dataStatus?.storage_used_mb !== undefined && (
                    <div className="text-muted small">
                        Storage used: {dataStatus.storage_used_mb.toFixed(2)} MB
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default DataManagement;
