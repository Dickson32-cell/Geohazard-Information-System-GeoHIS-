import request from 'supertest';
import app from '../src/index';

describe('Portfolio Website API', () => {
  describe('GET /api/health', () => {
    it('should return health check information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Portfolio Website API is running');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('environment');
    });
  });

  describe('GET /api/projects', () => {
    it('should return portfolio projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Projects retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('technologies');
    });
  });

  describe('GET /api/about', () => {
    it('should return about information', async () => {
      const response = await request(app)
        .get('/api/about')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('About information retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).toHaveProperty('skills');
      expect(response.body.data).toHaveProperty('experience');
    });
  });

  describe('POST /api/contact', () => {
    it('should successfully send contact message', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, I would like to work with you!'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Message sent successfully');
      expect(response.body.data).toHaveProperty('name', 'John Doe');
      expect(response.body.data).toHaveProperty('email', 'john@example.com');
      expect(response.body.data).toHaveProperty('submittedAt');
    });

    it('should return error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Name, email, and message are required');
    });

    it('should return error when email is missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ name: 'John Doe', message: 'Hello' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Name, email, and message are required');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Route /api/unknown not found');
    });
  });
});