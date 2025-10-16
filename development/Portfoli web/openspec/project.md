# Project Overview

## Description
This is a personal portfolio website built with Node.js, TypeScript, and Express.js. The project consists of a RESTful API backend that serves portfolio data and a React frontend with 3D elements for an engaging user experience.

## Tech Stack

### Backend
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Testing**: Jest with Supertest
- **Linting**: ESLint + Prettier
- **Build Tool**: TypeScript compiler (tsc)
- **Security**: Helmet.js for security headers
- **CORS**: cors middleware
- **Environment**: dotenv for configuration

### Frontend (portfolio-3d)
- **Framework**: React
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js
- **Build Tool**: Vite or Create React App

## Code Style Guidelines
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer async/await over Promises
- Use proper error handling with try-catch blocks
- Follow RESTful API conventions

## File Structure Conventions
- Place routes in `src/routes/`
- Place middleware in `src/middleware/`
- Place types in `src/types/`
- Place utilities in `src/utils/`
- Test files should mirror src structure in `tests/`

## API Design Patterns
- Use proper HTTP status codes
- Return consistent JSON response format:
  ```json
  {
    "success": true|false,
    "message": "Description of the response",
    "data": { ... },
    "timestamp": "ISO 8601 timestamp"
  }
  ```
- Include proper error messages
- Validate input data
- Use middleware for common functionality (auth, logging, etc.)

## Testing Guidelines
- Write unit tests for all business logic
- Use integration tests for API endpoints
- Mock external dependencies
- Aim for good test coverage
- Use descriptive test names

## Security Considerations
- Use Helmet.js for security headers
- Validate and sanitize all inputs
- Use CORS appropriately
- Never commit sensitive data
- Use environment variables for configuration

## Development Workflow
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run development server: `npm run dev`
4. Run tests: `npm test`
5. Build for production: `npm run build`
6. Lint code: `npm run lint`
7. Format code: `npm run format`

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/projects` - Portfolio projects
- `GET /api/about` - About information
- `POST /api/contact` - Contact form submission

## Project Structure
```
src/
├── index.ts          # Application entry point
├── routes/           # API routes
├── middleware/       # Express middleware
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

portfolio-3d/         # React frontend
├── src/
│   ├── components/   # React components
│   ├── data/         # Static data
│   └── three/        # 3D scene components
└── public/           # Static assets

tests/               # Test files
dist/               # Compiled JavaScript (generated)
openspec/           # API specifications and docs
```