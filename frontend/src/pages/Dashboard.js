/**
 * Dashboard - Clean production-ready landing page
 * 
 * No preset data - researchers upload their own data for analysis
 */

import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <Container fluid className="py-4">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">🌍 GeoHIS</h1>
        <h2 className="text-muted mb-4">Geohazard Information System</h2>
        <p className="lead mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
          A research-ready platform for flood and landslide susceptibility analysis.
          Upload your location data and get detailed risk assessments with downloadable figures and tables.
        </p>
        <Link to="/analyze">
          <Button variant="primary" size="lg" className="px-5">
            📤 Upload Data & Start Analysis
          </Button>
        </Link>
      </div>

      {/* Features Row */}
      <Row className="mb-5 g-4">
        <Col md={4}>
          <Card className="h-100 text-center border-0 shadow-sm">
            <Card.Body className="py-4">
              <div style={{ fontSize: '3rem' }} className="mb-3">📄</div>
              <Card.Title>Upload Your Data</Card.Title>
              <Card.Text className="text-muted">
                Upload CSV files with coordinates, GeoJSON spatial data, or enter locations manually.
                The system automatically detects your study area.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 text-center border-0 shadow-sm">
            <Card.Body className="py-4">
              <div style={{ fontSize: '3rem' }} className="mb-3">🔬</div>
              <Card.Title>Scientific Analysis</Card.Title>
              <Card.Text className="text-muted">
                Uses AHP (Analytical Hierarchy Process) for flood susceptibility and
                Frequency Ratio method for landslide susceptibility mapping.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 text-center border-0 shadow-sm">
            <Card.Body className="py-4">
              <div style={{ fontSize: '3rem' }} className="mb-3">📊</div>
              <Card.Title>Research-Ready Outputs</Card.Title>
              <Card.Text className="text-muted">
                Download results as CSV tables and publication-quality PNG figures
                including bar charts, scatter plots, and box plots.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* How It Works */}
      <Card className="border-0 bg-light mb-5">
        <Card.Body className="py-5">
          <h3 className="text-center mb-4">How It Works</h3>
          <Row className="text-center">
            <Col md={3}>
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>1</div>
              <h5>Upload</h5>
              <p className="text-muted small">
                Upload your CSV with latitude/longitude columns or a GeoJSON file
              </p>
            </Col>
            <Col md={3}>
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>2</div>
              <h5>Analyze</h5>
              <p className="text-muted small">
                System calculates flood and landslide susceptibility for each location
              </p>
            </Col>
            <Col md={3}>
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>3</div>
              <h5>Visualize</h5>
              <p className="text-muted small">
                View results on an interactive map with risk classifications
              </p>
            </Col>
            <Col md={3}>
              <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>4</div>
              <h5>Download</h5>
              <p className="text-muted small">
                Export tables (CSV) and figures (PNG) for your research papers
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Supported Formats */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">✅ Supported Input Formats</h5>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li><strong>CSV</strong> - Spreadsheet with <code>latitude</code> and <code>longitude</code> columns</li>
                <li><strong>GeoJSON</strong> - Point features with coordinates</li>
                <li><strong>Manual Entry</strong> - Enter individual coordinates directly</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">📥 Downloadable Outputs</h5>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li><strong>Results CSV</strong> - Full analysis data for each location</li>
                <li><strong>Summary Statistics</strong> - Descriptive statistics table</li>
                <li><strong>Risk Classification</strong> - Frequency tables</li>
                <li><strong>Figures (PNG)</strong> - Bar charts, scatter plots, box plots</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <div className="text-center py-4">
        <h4 className="mb-3">Ready to analyze your research locations?</h4>
        <Link to="/analyze">
          <Button variant="primary" size="lg">
            Start Analysis →
          </Button>
        </Link>
      </div>
    </Container>
  );
};

export default Dashboard;