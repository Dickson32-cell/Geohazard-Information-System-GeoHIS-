/**
 * AnalyzePage - User data upload and susceptibility analysis page
 */

import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
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

const AnalyzePage = () => {
    const [analysisResults, setAnalysisResults] = useState(null);

    // Center on New Juaben South Municipality
    const mapCenter = [6.07, -0.24];
    const mapZoom = 12;

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
    };

    return (
        <Container fluid className="py-4">
            <Row>
                <Col md={4}>
                    <h2 className="mb-4">📍 Analyze Location</h2>
                    <p className="text-muted mb-4">
                        Enter coordinates or upload a GeoJSON file to analyze flood and landslide
                        susceptibility for your locations in New Juaben South Municipality.
                    </p>
                    <UploadPanel onResultsReceived={handleResultsReceived} />
                </Col>

                <Col md={8}>
                    <Card className="h-100">
                        <Card.Header>
                            <h5 className="mb-0">🗺️ Location Map</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                style={{ height: '600px', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Study area boundary indicator */}
                                <CircleMarker
                                    center={[6.07, -0.24]}
                                    radius={50}
                                    pathOptions={{
                                        color: '#0066cc',
                                        fillColor: '#0066cc',
                                        fillOpacity: 0.1,
                                        dashArray: '5, 5'
                                    }}
                                />

                                {/* Analysis results markers */}
                                {analysisResults && analysisResults.results.map((result, idx) => (
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
                                                    <strong>Flood:</strong> {result.flood_class} ({result.flood_susceptibility}%)
                                                </p>
                                                <p className="mb-1">
                                                    <strong>Landslide:</strong> {result.landslide_class} ({result.landslide_susceptibility}%)
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Combined Risk:</strong> {result.combined_risk}
                                                </p>
                                                {!result.in_study_area && (
                                                    <p className="text-warning mt-2 mb-0">
                                                        ⚠️ Outside study area
                                                    </p>
                                                )}
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
                            <h6 className="mb-2">Legend</h6>
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
