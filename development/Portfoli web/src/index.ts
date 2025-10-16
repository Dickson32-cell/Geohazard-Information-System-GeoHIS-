import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Types
interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
}

interface AboutInfo {
  name: string;
  title: string;
  bio: string;
  skills: string[];
  experience: string[];
}

interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

// Sample portfolio data
const projects: Project[] = [
  {
    id: '1',
    title: 'Portfolio Website',
    description: 'A personal portfolio website built with Node.js and TypeScript',
    technologies: ['Node.js', 'TypeScript', 'Express', 'React'],
    githubUrl: 'https://github.com/username/portfolio',
    liveUrl: 'https://portfolio.example.com'
  }
];

const aboutInfo: AboutInfo = {
  name: 'Your Name',
  title: 'Full Stack Developer',
  bio: 'Passionate developer with experience in modern web technologies.',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
  experience: ['Software Developer at Company X', 'Intern at Company Y']
};

// Health check endpoint
app.get('/api/health', (req: any, res: any) => {
  res.json({
    success: true,
    message: 'Portfolio Website API is running',
    data: {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
});

// Get projects endpoint
app.get('/api/projects', (req: any, res: any) => {
  res.json({
    success: true,
    message: 'Projects retrieved successfully',
    data: projects,
    timestamp: new Date().toISOString()
  });
});

// Get about info endpoint
app.get('/api/about', (req: any, res: any) => {
  res.json({
    success: true,
    message: 'About information retrieved successfully',
    data: aboutInfo,
    timestamp: new Date().toISOString()
  });
});

// Contact form endpoint
app.post('/api/contact', (req: any, res: any) => {
  try {
    const { name, email, message }: ContactMessage = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Implement email sending logic (e.g., using nodemailer)
    console.log('Contact form submission:', { name, email, message });

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        name,
        email,
        submittedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Portfolio Website API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`👤 About API: http://localhost:${PORT}/api/about`);
  });
}

export default app;