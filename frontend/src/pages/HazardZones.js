/**
 * HazardZones - Display susceptibility analysis from thesis data
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/v1';

const HazardZones = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/thesis-data/analysis`);
        setAnalysisData(response.data);
      } catch (err) {
        console.error('Error fetching analysis data:', err);
        setError('Could not load hazard zone data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getClassColor = (className) => {
    switch (className) {
      case 'Very High': return 'danger';
      case 'High': return 'warning';
      case 'Moderate': return 'info';
      case 'Low': return 'success';
      case 'Very Low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading hazard zone data...</p>
      </Container>
    );
  }

  const floodData = analysisData?.susceptibility?.flood;
  const landslideData = analysisData?.susceptibility?.landslide;
  const ahpFlood = analysisData?.ahp_analysis?.flood;
  const ahpLandslide = analysisData?.ahp_analysis?.landslide;

  return (
    <Container fluid className="py-4">
      <h1 className="mb-2">🗺️ Hazard Susceptibility Zones</h1>
      <p className="text-muted mb-4">Flood and landslide susceptibility analysis for New Juaben South Municipality</p>

      {error && <Alert variant="warning">{error}</Alert>}

      {analysisData && (
        <>
          {/* Flood Susceptibility */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">🌊 Flood Susceptibility (AHP Method)</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col>
                      <h6>Method: <Badge bg="info">{floodData?.method}</Badge></h6>
                      <p className="mb-1">Mean Susceptibility: <strong>{floodData?.statistics?.mean?.toFixed(1)}%</strong></p>
                      <p className="mb-1">Range: {floodData?.statistics?.min?.toFixed(1)}% - {floodData?.statistics?.max?.toFixed(1)}%</p>
                    </Col>
                  </Row>

                  <h6>Class Distribution</h6>
                  <Table size="sm" striped>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floodData?.statistics?.class_distribution &&
                        Object.entries(floodData.statistics.class_distribution).map(([className, data]) => (
                          <tr key={className}>
                            <td><Badge bg={getClassColor(className)}>{className}</Badge></td>
                            <td>{data.count}</td>
                            <td>{data.percentage.toFixed(1)}%</td>
                            <td>
                              <ProgressBar
                                now={data.percentage}
                                variant={getClassColor(className)}
                                style={{ height: '15px' }}
                              />
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-warning">
                  <h5 className="mb-0">⛰️ Landslide Susceptibility (FR Method)</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col>
                      <h6>Method: <Badge bg="info">{landslideData?.method}</Badge></h6>
                      <p className="mb-1">Mean LSI: <strong>{landslideData?.statistics?.mean_lsi?.toFixed(2)}</strong></p>
                      <p className="mb-1">Range: {landslideData?.statistics?.min_lsi?.toFixed(2)} - {landslideData?.statistics?.max_lsi?.toFixed(2)}</p>
                    </Col>
                  </Row>

                  <h6>Class Distribution</h6>
                  <Table size="sm" striped>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Count</th>
                        <th>Percentage</th>
                        <th>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landslideData?.statistics?.class_distribution &&
                        Object.entries(landslideData.statistics.class_distribution).map(([className, data]) => (
                          <tr key={className}>
                            <td><Badge bg={getClassColor(className)}>{className}</Badge></td>
                            <td>{data.count}</td>
                            <td>{data.percentage.toFixed(1)}%</td>
                            <td>
                              <ProgressBar
                                now={data.percentage}
                                variant={getClassColor(className)}
                                style={{ height: '15px' }}
                              />
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* AHP Weights */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">⚖️ Flood AHP Factor Weights</h5>
                </Card.Header>
                <Card.Body>
                  <Table size="sm" striped>
                    <thead>
                      <tr>
                        <th>Factor</th>
                        <th>Weight</th>
                        <th>Visualization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ahpFlood?.weights && Object.entries(ahpFlood.weights)
                        .sort((a, b) => b[1] - a[1])
                        .map(([factor, weight]) => (
                          <tr key={factor}>
                            <td>{factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                            <td>{weight.toFixed(4)}</td>
                            <td>
                              <ProgressBar now={weight * 100} style={{ height: '20px' }} />
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                  <Alert variant={ahpFlood?.is_consistent ? 'success' : 'danger'} className="mb-0 py-2">
                    <small>
                      <strong>Consistency Ratio:</strong> {ahpFlood?.consistency_ratio?.toFixed(4)}<br />
                      {ahpFlood?.is_consistent ? '✓ Acceptable (CR < 0.10)' : '✗ Inconsistent (CR ≥ 0.10)'}
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">📊 Landslide Frequency Ratios</h5>
                </Card.Header>
                <Card.Body>
                  {landslideData?.statistics?.fr_summary?.factors && (
                    <>
                      <h6>Key Factors with Highest FR</h6>
                      <Table size="sm" striped>
                        <thead>
                          <tr>
                            <th>Factor</th>
                            <th>Max FR</th>
                            <th>High Susceptibility Classes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(landslideData.statistics.fr_summary.factors).map(([factor, data]) => (
                            <tr key={factor}>
                              <td>{factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                              <td><Badge bg="danger">{data.max_fr.toFixed(2)}</Badge></td>
                              <td>
                                {data.high_susceptibility_classes.map((cls, i) => (
                                  <Badge key={i} bg="warning" className="me-1">{cls}</Badge>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <Alert variant="info" className="mb-0 py-2">
                        <small>
                          <strong>Study Area:</strong> {landslideData.statistics.fr_summary.total_study_area} km²<br />
                          <strong>Landslide Density:</strong> {landslideData.statistics.fr_summary.landslide_density.toFixed(3)} per km²
                        </small>
                      </Alert>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary */}
          <Row>
            <Col>
              <Card>
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">📈 Key Findings Summary</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>🌊 Flood Susceptibility</h6>
                      <ul>
                        <li><strong>{(floodData?.statistics?.class_distribution?.High?.percentage + floodData?.statistics?.class_distribution?.["Very High"]?.percentage).toFixed(1)}%</strong> of the study area is in High/Very High flood susceptibility zones</li>
                        <li><strong>Elevation</strong> and <strong>Drainage Proximity</strong> are the most influential factors (weight: 0.298 each)</li>
                        <li>Low-lying areas near drainage channels are most susceptible</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6>⛰️ Landslide Susceptibility</h6>
                      <ul>
                        <li><strong>{(landslideData?.statistics?.class_distribution?.High?.percentage + landslideData?.statistics?.class_distribution?.["Very High"]?.percentage).toFixed(1)}%</strong> of the study area is in High/Very High landslide susceptibility zones</li>
                        <li><strong>Bare Land</strong> has the highest FR (2.20), followed by steep slopes (30-45°, FR=1.98)</li>
                        <li>Birimian geology and deforested hillslopes are most susceptible</li>
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default HazardZones;