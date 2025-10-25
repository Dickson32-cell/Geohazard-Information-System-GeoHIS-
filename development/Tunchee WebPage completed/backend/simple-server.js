const express = require('express');
const app = express();
const port = 5002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/v1/auth/check', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      isAuthenticated: false,
      user: null
    }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@example.com' && password === 'admin123') {
    res.status(200).json({
      success: true,
      data: {
        token: 'sample_jwt_token',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Simple test server running on http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});