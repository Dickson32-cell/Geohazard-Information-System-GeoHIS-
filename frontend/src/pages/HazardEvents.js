/**
 * HazardEvents - Display historical hazard events from thesis data
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/v1';

const HazardEvents = () => {
  const [hazardEvents, setHazardEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/thesis-data/hazard-events`);
        setHazardEvents(response.data);
      } catch (err) {
        console.error('Error fetching hazard events:', err);
        setError('Could not load hazard events. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const position = [6.0965, -0.2583];

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

  const filteredEvents = hazardEvents?.features?.filter(event => {
    if (filter === 'all') return true;
    return event.properties.hazard_type === filter;
  }) || [];

  // Calculate statistics
  const stats = hazardEvents?.features ? {
    total: hazardEvents.features.length,
    floods: hazardEvents.features.filter(e => e.properties.hazard_type === 'flood').length,
    landslides: hazardEvents.features.filter(e => e.properties.hazard_type === 'landslide').length,
    totalDamage: hazardEvents.features.reduce((sum, e) => sum + (e.properties.damage_estimate_ghs || 0), 0),
    totalAffected: hazardEvents.features.reduce((sum, e) => sum + (e.properties.affected_population || 0), 0),
    casualties: hazardEvents.features.reduce((sum, e) => sum + (e.properties.casualties || 0), 0)
  } : null;

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading hazard events...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-2">📋 Historical Hazard Events</h1>
      <p className="text-muted mb-4">Documented geohazard events in New Juaben South Municipality (2018-2023)</p>

      {error && <Alert variant="warning">{error}</Alert>}

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-primary">{stats.total}</h3>
                <small>Total Events</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 style={{ color: '#2196F3' }}>{stats.floods}</h3>
                <small>Flood Events</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 style={{ color: '#FF9800' }}>{stats.landslides}</h3>
                <small>Landslide Events</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-danger">{stats.casualties}</h3>
                <small>Casualties</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-info">{stats.totalAffected.toLocaleString()}</h3>
                <small>People Affected</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card className="text-center h-100">
              <Card.Body>
                <h3 className="text-success">₵{(stats.totalDamage / 1000).toFixed(0)}k</h3>
                <small>Total Damage</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Map */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🗺️ Event Locations</h5>
              <div>
                <Badge
                  bg={filter === 'all' ? 'primary' : 'secondary'}
                  className="me-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilter('all')}
                >All</Badge>
                <Badge
                  bg={filter === 'flood' ? 'primary' : 'secondary'}
                  className="me-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilter('flood')}
                >Floods</Badge>
                <Badge
                  bg={filter === 'landslide' ? 'warning' : 'secondary'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFilter('landslide')}
                >Landslides</Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <MapContainer center={position} zoom={12} style={{ height: '500px', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {filteredEvents.map((event, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[event.geometry.coordinates[1], event.geometry.coordinates[0]]}
                    radius={12}
                    pathOptions={{
                      color: getEventColor(event.properties.hazard_type),
                      fillColor: getEventColor(event.properties.hazard_type),
                      fillOpacity: 0.8
                    }}
                  >
                    <Popup>
                      <strong>{event.properties.hazard_type.toUpperCase()}</strong>
                      <hr className="my-1" />
                      <strong>ID:</strong> {event.properties.event_id}<br />
                      <strong>Date:</strong> {event.properties.event_date}<br />
                      <strong>Severity:</strong> {event.properties.severity}<br />
                      <strong>Affected:</strong> {event.properties.affected_population} people<br />
                      <strong>Damage:</strong> GH₵ {event.properties.damage_estimate_ghs.toLocaleString()}<br />
                      <strong>Casualties:</strong> {event.properties.casualties}<br />
                      <hr className="my-1" />
                      <small>{event.properties.description}</small><br />
                      <small className="text-muted">Source: {event.properties.data_source}</small>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Events Table */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">📊 Event Details</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '540px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Affected</th>
                    <th>Damage (GH₵)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, idx) => (
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
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Event Descriptions */}
              <h6 className="mt-4">Event Descriptions</h6>
              {filteredEvents.map((event, idx) => (
                <Card key={idx} className="mb-2">
                  <Card.Body className="py-2">
                    <small>
                      <strong>{event.properties.event_id}</strong> ({event.properties.event_date})<br />
                      {event.properties.description}<br />
                      <span className="text-muted">Source: {event.properties.data_source}</span>
                    </small>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HazardEvents;