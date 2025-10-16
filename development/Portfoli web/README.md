# Abdul Rashid Dickson - 3D Portfolio Website

A modern, interactive 3D portfolio website showcasing Abdul Rashid Dickson's expertise in data management, governance, and public administration through immersive digital experiences.

## Features

- **3D Interactive Graphics**: Built with Three.js and React Three Fiber for stunning visual effects
- **Responsive Design**: Optimized for all devices using Tailwind CSS
- **Smooth Animations**: Powered by Framer Motion for fluid transitions
- **Professional Sections**: Hero, About, Experience, Projects, Skills, and Contact
- **Modern UI**: Clean, professional design with attention to detail
- **Performance Optimized**: Fast loading and smooth 3D interactions

## Tech Stack

- **Frontend**: React 19.2.0 with TypeScript
- **3D Graphics**: Three.js & React Three Fiber
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Testing**: Jest with React Testing Library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the portfolio directory:
```bash
cd portfolio-3d
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Building for Production

Build the optimized production version:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

## Project Structure

```
portfolio-3d/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Hero.jsx     # Landing section
│   │   ├── About.jsx    # About section
│   │   ├── Experience.jsx # Work experience
│   │   ├── Projects.jsx # Project showcase
│   │   ├── Skills.jsx   # Technical skills
│   │   ├── Contact.jsx  # Contact form
│   │   ├── Scene3D.jsx  # 3D background scene
│   │   └── SplashScreen.jsx # Loading screen
│   ├── data/           # Portfolio data
│   ├── styles/         # Global styles
│   ├── three/          # 3D scene components
│   └── App.tsx         # Main application
├── build/              # Production build (generated)
└── package.json        # Dependencies and scripts
```

## Portfolio Sections

- **Hero**: Eye-catching introduction with 3D elements
- **About**: Personal background and professional summary
- **Experience**: Career timeline and achievements
- **Projects**: Showcase of key projects and work
- **Skills**: Technical and professional competencies
- **Contact**: Contact form and social links

## Deployment

The built files in the `build` folder can be deployed to any static hosting service like:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT