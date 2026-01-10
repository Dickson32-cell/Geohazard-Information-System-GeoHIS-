/**
 * Dashboard - Main dashboard with thesis research data
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/v1';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [hazardEvents, setHazardEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, eventsRes] = await Promise.all([
          axios.get(`${API_BASE}/thesis-data/summary`),
          axios.get(`${API_BASE}/thesis-data/hazard-events`)
        ]);
        setSummary(summaryRes.data);
        setHazardEvents(eventsRes.data);
      } catch (err) {
        console.error('Error fetching thesis data:', err);
        setError('Could not load thesis data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const position = [6.0965, -0.2583]; // New Juaben South coordinates

  const getEventColor = (type) => {
    switch (type) {
      case 'flood': return '#2196F3';
      case 'landslide': return '#FF9800';
      case 'erosion': return '#795548';
      default: return '#9E9E9E';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      extreme: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return <Badge bg={colors[severity] || 'secondary'}>{severity}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading thesis data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-2">🌍 GeoHIS Dashboard</h1>
      <p className="text-muted mb-4">Geohazard Information System for New Juaben South Municipality, Ghana</p>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Key Metrics Row */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-primary">
              <Card.Body className="text-center">
                <h3 className="text-primary">{summary.validation.auc_roc}</h3>
                <small className="text-muted">AUC-ROC Score</small>
                <Badge bg="success" className="d-block mt-2">{summary.validation.classification}</Badge>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-danger">
              <Card.Body className="text-center">
                <h3 className="text-danger">{summary.flood.high_percentage}%</h3>
                <small className="text-muted">High Flood Susceptibility</small>
                <div className="mt-2">
                  <ProgressBar variant="danger" now={summary.flood.high_percentage} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-warning">
              <Card.Body className="text-center">
                <h3 className="text-warning">{summary.landslide.high_percentage}%</h3>
                <small className="text-muted">High Landslide Susceptibility</small>
                <div className="mt-2">
                  <ProgressBar variant="warning" now={summary.landslide.high_percentage} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-info">
              <Card.Body className="text-center">
                <h3 className="text-info">{summary.risk_assessment.total_assets}</h3>
                <small className="text-muted">Infrastructure Assets Assessed</small>
                <small className="d-block mt-2">All in Low/Very Low risk</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        {/* Map with Historical Events */}
        <Col md={8}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">📍 Historical Hazard Events (2018-2023)</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <MapContainer center={position} zoom={12} style={{ height: '450px', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {hazardEvents && hazardEvents.features && hazardEvents.features.map((event, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[event.geometry.coordinates[1], event.geometry.coordinates[0]]}
                    radius={10}
                    pathOptions={{
                      color: getEventColor(event.properties.hazard_type),
                      fillColor: getEventColor(event.properties.hazard_type),
                      fillOpacity: 0.7
                    }}
                  >
                    <Popup>
                      <strong>{event.properties.hazard_type.toUpperCase()}</strong>
                      <br />
                      <strong>Date:</strong> {event.properties.event_date}
                      <br />
                      <strong>Severity:</strong> {event.properties.severity}
                      <br />
                      <strong>Affected:</strong> {event.properties.affected_population} people
                      <br />
                      <strong>Damage:</strong> GH₵ {event.properties.damage_estimate_ghs.toLocaleString()}
                      <hr />
                      <small>{event.properties.description}</small>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-center gap-4">
              <span><span style={{ color: '#2196F3' }}>●</span> Flood</span>
              <span><span style={{ color: '#FF9800' }}>●</span> Landslide</span>
              <span><span style={{ color: '#795548' }}>●</span> Erosion</span>
            </Card.Footer>
          </Card>
        </Col>

        {/* AHP Weights */}
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">⚖️ AHP Factor Weights (Flood)</h5>
            </Card.Header>
            <Card.Body>
              {summary && (
                <>
                  <Table size="sm" striped>
                    <thead>
                      <tr>
                        <th>Factor</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.flood.weights).map(([factor, weight]) => (
                        <tr key={factor}>
                          <td>{factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          <td>
                            <ProgressBar
                              now={weight * 100}
                              label={weight.toFixed(3)}
                              variant="primary"
                              style={{ height: '20px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Alert variant="success" className="mb-0 py-2">
                    <small>
                      <strong>Consistency Ratio:</strong> {summary.flood.consistency_ratio}
                      <br />✓ Acceptable (CR &lt; 0.10)
                    </small>
                  </Alert>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Validation Metrics & Hazard Events Table */}
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">✅ Model Validation Metrics</h5>
            </Card.Header>
            <Card.Body>
              {summary && (
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td>AUC-ROC</td>
                      <td><strong>{summary.validation.auc_roc}</strong></td>
                    </tr>
                    <tr>
                      <td>Accuracy</td>
                      <td>{(summary.validation.accuracy * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Recall</td>
                      <td>{(summary.validation.recall * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Sample Size</td>
                      <td>{summary.validation.sample_size} points</td>
                    </tr>
                    <tr>
                      <td>Classification</td>
                      <td><Badge bg="success">{summary.validation.classification}</Badge></td>
                    </tr>
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📋 Documented Hazard Events</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {hazardEvents && hazardEvents.features && (
                <Table size="sm" striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Affected</th>
                      <th>Damage (GH₵)</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hazardEvents.features.map((event, idx) => (
                      <tr key={idx}>
                        <td>{event.properties.event_date}</td>
                        <td>
                          <Badge bg={event.properties.hazard_type === 'flood' ? 'primary' :
                            event.properties.hazard_type === 'landslide' ? 'warning' : 'secondary'}>
                            {event.properties.hazard_type}
                          </Badge>
                        </td>
                        <td>{getSeverityBadge(event.properties.severity)}</td>
                        <td>{event.properties.affected_population.toLocaleString()}</td>
                        <td>{event.properties.damage_estimate_ghs.toLocaleString()}</td>
                        <td><small>{event.properties.data_source}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;