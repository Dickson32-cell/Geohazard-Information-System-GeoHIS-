import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { UpdateProvider } from './context/UpdateContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { initializePerformanceMonitoring } from './utils/performance';

// Import Home directly instead of lazy loading to avoid issues
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
const Services = lazy(() => import('./pages/Services'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Conditional Header Component
const ConditionalHeader = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Header />;
};

// Conditional Footer Component
const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Footer />;
};

// Component that uses useAuth - must be inside AuthProvider
const AppRoutes = () => {
  return (
    <>
      <ConditionalHeader />
      <main className="flex-grow">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* 404 fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <ConditionalFooter />
    </>
  );
};

function App() {
  // Initialize performance monitoring
  React.useEffect(() => {
    initializePerformanceMonitoring();
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <UpdateProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <AppRoutes />
            </div>
          </Router>
        </UpdateProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
