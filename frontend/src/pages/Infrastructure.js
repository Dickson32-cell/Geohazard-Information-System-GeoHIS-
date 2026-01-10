/**
 * Infrastructure - Display infrastructure risk assessment from thesis data
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/v1';

const Infrastructure = () => {
  const [riskData, setRiskData] = useState(null);
  const [infraData, setInfraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, infraRes] = await Promise.all([
          axios.get(`${API_BASE}/thesis-data/risk-assessment`),
          axios.get(`${API_BASE}/thesis-data/infrastructure`)
        ]);
        setRiskData(riskRes.data);
        setInfraData(infraRes.data);
      } catch (err) {
        console.error('Error fetching infrastructure data:', err);
        setError('Could not load infrastructure data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const position = [6.0965, -0.2583];

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Moderate': return '#ffc107';
      case 'Low': return '#17a2b8';
      case 'Very Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRiskBadge = (riskLevel) => {
    const colors = {
      'Critical': 'danger',
      'High': 'warning',
      'Moderate': 'info',
      'Low': 'primary',
      'Very Low': 'success'
    };
    return <Badge bg={colors[riskLevel] || 'secondary'}>{riskLevel}</Badge>;
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'school': return '🏫';
      case 'bridge': return '🌉';
      case 'building': return '🏢';
      case 'road': return '🛣️';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading infrastructure data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-2">🏗️ Infrastructure Risk Assessment</h1>
      <p className="text-muted mb-4">Critical infrastructure assets and their geohazard risk levels in New Juaben South Municipality</p>

      {error && <Alert variant="warning">{error}</Alert>}

      {riskData && (
        <>
          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100 border-primary">
                <Card.Body>
                  <h2 className="text-primary">{riskData.summary?.total_assets_analyzed}</h2>
                  <small>Total Assets Assessed</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={9}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="mb-3">Risk Distribution</h6>
                  <Row>
                    {riskData.summary?.risk_distribution &&
                      Object.entries(riskData.summary.risk_distribution).map(([level, count]) => (
                        <Col key={level} className="text-center">
                          <h4 style={{ color: getRiskColor(level) }}>{count}</h4>
                          <Badge bg={level === 'Very Low' ? 'success' : level === 'Low' ? 'primary' :
                            level === 'Moderate' ? 'info' : level === 'High' ? 'warning' : 'danger'}>
                            {level}
                          </Badge>
                        </Col>
                      ))
                    }
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            {/* Map */}
            <Col md={5}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">🗺️ Asset Locations</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <MapContainer center={position} zoom={12} style={{ height: '450px', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    {/* Render Point geometries as CircleMarkers */}
                    {infraData?.features?.filter(asset => asset.geometry?.type === 'Point').map((asset, idx) => (
                      <CircleMarker
                        key={`point-${idx}`}
                        center={[asset.geometry.coordinates[1], asset.geometry.coordinates[0]]}
                        radius={10}
                        pathOptions={{
                          color: '#1976D2',
                          fillColor: '#1976D2',
                          fillOpacity: 0.8
                        }}
                      >
                        <Popup>
                          <strong>{getAssetIcon(asset.properties.asset_type)} {asset.properties.name}</strong>
                          <hr className="my-1" />
                          <strong>Type:</strong> {asset.properties.asset_type}<br />
                          <strong>Served:</strong> {asset.properties.population_served?.toLocaleString()} people<br />
                          <strong>Condition:</strong> {asset.properties.building_condition}
                        </Popup>
                      </CircleMarker>
                    ))}
                    {/* Render LineString geometries as Polylines */}
                    {infraData?.features?.filter(asset => asset.geometry?.type === 'LineString').map((asset, idx) => (
                      <Polyline
                        key={`line-${idx}`}
                        positions={asset.geometry.coordinates.map(coord => [coord[1], coord[0]])}
                        pathOptions={{
                          color: '#FF5722',
                          weight: 4
                        }}
                      >
                        <Popup>
                          <strong>{getAssetIcon(asset.properties.asset_type)} {asset.properties.name}</strong>
                          <hr className="my-1" />
                          <strong>Type:</strong> {asset.properties.asset_type}<br />
                          <strong>Served:</strong> {asset.properties.population_served?.toLocaleString()} people<br />
                          <strong>Condition:</strong> {asset.properties.building_condition}
                        </Popup>
                      </Polyline>
                    ))}
                  </MapContainer>
                </Card.Body>
              </Card>
            </Col>

            {/* Risk Assessment Table */}
            <Col md={7}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">📊 Risk Assessment Results</h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: '490px', overflowY: 'auto' }}>
                  <Table striped hover size="sm">
                    <thead className="sticky-top bg-white">
                      <tr>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Hazard</th>
                        <th>Vuln.</th>
                        <th>Risk Score</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskData.all_results?.map((asset, idx) => (
                        <tr key={idx}>
                          <td>
                            {getAssetIcon(asset.asset_type)} {asset.asset_name}
                          </td>
                          <td>
                            <Badge bg="secondary">{asset.asset_type}</Badge>
                          </td>
                          <td>{asset.hazard_score}</td>
                          <td>{asset.vulnerability_score}</td>
                          <td>
                            <ProgressBar
                              now={asset.risk_score}
                              max={100}
                              variant={asset.risk_level === 'Very Low' ? 'success' :
                                asset.risk_level === 'Low' ? 'info' : 'warning'}
                              label={asset.risk_score.toFixed(1)}
                              style={{ height: '18px' }}
                            />
                          </td>
                          <td>{getRiskBadge(asset.risk_level)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recommendations */}
          <Row>
            <Col>
              <Card>
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">💡 Risk Management Recommendations</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {riskData.all_results?.slice(0, 6).map((asset, idx) => (
                      <Col md={4} key={idx} className="mb-3">
                        <Card className="h-100">
                          <Card.Header className="py-2">
                            <small><strong>{getAssetIcon(asset.asset_type)} {asset.asset_name}</strong></small>
                            <span className="float-end">{getRiskBadge(asset.risk_level)}</span>
                          </Card.Header>
                          <Card.Body className="py-2">
                            <ul className="mb-0 ps-3" style={{ fontSize: '0.85rem' }}>
                              {asset.recommendations?.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Methodology */}
          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">📐 Risk Assessment Methodology</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>Risk Equation</h6>
                      <Alert variant="secondary" className="text-center">
                        <strong>Risk = Hazard × Exposure × Vulnerability</strong>
                      </Alert>
                      <p className="small">
                        <strong>Hazard Score:</strong> Derived from susceptibility mapping (flood + landslide)<br />
                        <strong>Exposure Score:</strong> Based on asset value and importance (0-1)<br />
                        <strong>Vulnerability Score:</strong> Physical susceptibility to damage (0-1)
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>Risk Classification</h6>
                      <Table size="sm" striped>
                        <thead>
                          <tr>
                            <th>Score Range</th>
                            <th>Risk Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>0-20</td><td>{getRiskBadge('Very Low')}</td></tr>
                          <tr><td>20-40</td><td>{getRiskBadge('Low')}</td></tr>
                          <tr><td>40-60</td><td>{getRiskBadge('Moderate')}</td></tr>
                          <tr><td>60-80</td><td>{getRiskBadge('High')}</td></tr>
                          <tr><td>80-100</td><td>{getRiskBadge('Critical')}</td></tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                  <Alert variant="success" className="mb-0">
                    <small>
                      <strong>Key Finding:</strong> All {riskData.summary?.total_assets_analyzed} assessed infrastructure assets are in
                      Low or Very Low risk categories. This reflects the concentrated location of critical infrastructure
                      in areas with moderate-to-low susceptibility in central Koforidua.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Infrastructure;