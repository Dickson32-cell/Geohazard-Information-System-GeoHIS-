import React, { useState, Suspense } from 'react';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import Hero from './components/Hero';
import About from './components/About';
import Education from './components/Education';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Scene3D from './components/Scene3D';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-blue via-royal-blue-light to-dark-gray">
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      <Navbar />
      <Hero />
      <About />
      <Education />
      <Experience />
      <Projects />
      <Skills />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;