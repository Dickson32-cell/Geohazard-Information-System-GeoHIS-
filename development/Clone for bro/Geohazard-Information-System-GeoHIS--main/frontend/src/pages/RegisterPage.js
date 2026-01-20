/**
 * RegisterPage - New user registration
 */

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        institution: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }
        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            // Register request
            const registerResponse = await axios.post(`${API_URL}/auth/register`, {
                email: formData.email,
                username: formData.username,
                password: formData.password,
                full_name: formData.full_name || null,
                institution: formData.institution || null
            });

            setSuccess('Account created successfully! Logging you in...');

            // Auto-login after registration
            const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: formData.email,
                password: formData.password
            });

            const { access_token, user } = loginResponse.data;
            login(user, access_token);
            
            // Redirect to projects after short delay
            setTimeout(() => {
                navigate('/');
            }, 1000);
            
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.response?.status === 400) {
                setError('Email or username already exists');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <h2>🌍 GeoHIS</h2>
                                <p className="text-muted">Create your research account</p>
                            </div>

                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}
                            
                            {success && (
                                <Alert variant="success">
                                    {success}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email Address <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                placeholder="Choose a username"
                                                required
                                                minLength={3}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Institution / Organization</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="institution"
                                        value={formData.institution}
                                        onChange={handleChange}
                                        placeholder="e.g., University of Ghana"
                                    />
                                    <Form.Text className="text-muted">
                                        Optional: Your university or organization
                                    </Form.Text>
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Min. 8 characters"
                                                required
                                                minLength={8}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Repeat password"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    className="w-100"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </Form>

                            <hr className="my-4" />

                            <p className="text-center mb-0">
                                Already have an account?{' '}
                                <Link to="/login">Sign in</Link>
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="mt-3 bg-light">
                        <Card.Body className="small">
                            <h6>📋 What you'll get:</h6>
                            <ul className="mb-0">
                                <li>Create unlimited research projects</li>
                                <li>Upload and analyze geospatial data</li>
                                <li>Advanced sensitivity and uncertainty analysis</li>
                                <li>Export publication-ready results</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RegisterPage;