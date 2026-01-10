/**
 * AnalyzePage - User data upload and susceptibility analysis page
 * 
 * Production version: No preset study area, dynamically centers on user data
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import UploadPanel from '../components/UploadPanel';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to dynamically update map view based on results
const MapUpdater = ({ results }) => {
    const map = useMap();

    useEffect(() => {
        if (results && results.length > 0) {
            // Calculate bounding box from results
            const lats = results.map(r => r.latitude);
            const lons = results.map(r => r.longitude);

            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);

            // Add some padding
            const padding = 0.01;
            const bounds = [
                [minLat - padding, minLon - padding],
                [maxLat + padding, maxLon + padding]
            ];

            // Fit map to bounds
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [results, map]);

    return null;
};

const AnalyzePage = () => {
    const [analysisResults, setAnalysisResults] = useState(null);
    const [studyAreaBounds, setStudyAreaBounds] = useState(null);

    // Default center (world view)
    const defaultCenter = [0, 0];
    const defaultZoom = 2;

    // Get color based on combined risk
    const getRiskColor = (risk) => {
        switch (risk) {
            case 'Critical': return '#dc3545';
            case 'High': return '#fd7e14';
            case 'Moderate': return '#ffc107';
            case 'Low': return '#28a745';
            case 'Very Low': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const handleResultsReceived = (results) => {
        setAnalysisResults(results);

        // Calculate study area from results
        if (results && results.results && results.results.length > 0) {
            const lats = results.results.map(r => r.latitude);
            const lons = results.results.map(r => r.longitude);

            setStudyAreaBounds({
                minLat: Math.min(...lats),
                maxLat: Math.max(...lats),
                minLon: Math.min(...lons),
                maxLon: Math.max(...lons),
                centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
                centerLon: (Math.min(...lons) + Math.max(...lons)) / 2
            });
        }
    };

    return (
        <Container fluid className="py-4">
            <Row>
                <Col md={4}>
                    <h2 className="mb-4">📍 Analyze Locations</h2>
                    <p className="text-muted mb-4">
                        Upload your coordinates (CSV, GeoJSON) or enter them manually.
                        The system will analyze flood and landslide susceptibility for each location.
                    </p>
                    <UploadPanel onResultsReceived={handleResultsReceived} />
                </Col>

                <Col md={8}>
                    <Card className="h-100">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">🗺️ Analysis Map</h5>
                            {studyAreaBounds && (
                                <small className="text-muted">
                                    Study Area: {studyAreaBounds.minLat.toFixed(4)}° to {studyAreaBounds.maxLat.toFixed(4)}° N,
                                    {studyAreaBounds.minLon.toFixed(4)}° to {studyAreaBounds.maxLon.toFixed(4)}° E
                                </small>
                            )}
                        </Card.Header>
                        <Card.Body className="p-0">
                            <MapContainer
                                center={defaultCenter}
                                zoom={defaultZoom}
                                style={{ height: '600px', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Dynamic map updater */}
                                {analysisResults && analysisResults.results && (
                                    <MapUpdater results={analysisResults.results} />
                                )}

                                {/* Analysis results markers */}
                                {analysisResults && analysisResults.results && analysisResults.results.map((result, idx) => (
                                    <CircleMarker
                                        key={idx}
                                        center={[result.latitude, result.longitude]}
                                        radius={12}
                                        pathOptions={{
                                            color: getRiskColor(result.combined_risk),
                                            fillColor: getRiskColor(result.combined_risk),
                                            fillOpacity: 0.8
                                        }}
                                    >
                                        <Popup>
                                            <div>
                                                <strong>{result.name || `Location ${idx + 1}`}</strong>
                                                <hr className="my-2" />
                                                <p className="mb-1">
                                                    <strong>Coordinates:</strong> {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Flood:</strong> {result.flood_class} ({result.flood_susceptibility}%)
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Landslide:</strong> {result.landslide_class} ({result.landslide_susceptibility}%)
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Combined Risk:</strong> {result.combined_risk}
                                                </p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </Card.Body>
                    </Card>

                    {/* Legend */}
                    <Card className="mt-3">
                        <Card.Body>
                            <h6 className="mb-2">Risk Level Legend</h6>
                            <div className="d-flex flex-wrap gap-3">
                                <span><span className="badge" style={{ backgroundColor: '#dc3545' }}>●</span> Critical</span>
                                <span><span className="badge" style={{ backgroundColor: '#fd7e14' }}>●</span> High</span>
                                <span><span className="badge" style={{ backgroundColor: '#ffc107' }}>●</span> Moderate</span>
                                <span><span className="badge" style={{ backgroundColor: '#28a745' }}>●</span> Low</span>
                                <span><span className="badge" style={{ backgroundColor: '#6c757d' }}>●</span> Very Low</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AnalyzePage;
