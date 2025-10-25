import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaPalette } from 'react-icons/fa';
import profileImage from '../../assets/profile/profile-picture.jpg';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileEnlarged, setIsProfileEnlarged] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-primary-800 backdrop-blur-md shadow-lg'
          : 'bg-primary-700'
      }`}
    >
      <nav className="container-max">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-3 text-2xl font-bold text-white hover:text-white/80 transition-colors"
            >
              {/* Profile Picture - Always Visible */}
              <motion.div
                className="relative"
                animate={isProfileEnlarged ? { scale: 1.5 } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={profileImage}
                  alt="Anyetei Sowah Joseph"
                  className="w-12 h-12 rounded-full border-3 border-white shadow-lg object-cover"
                  onError={(e) => {
                    console.error('Profile image failed to load');
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 rounded-full border-2 border-primary-400 animate-pulse"></div>
              </motion.div>

              {/* Palette Icon with Hover Animation */}
              <motion.div
                onMouseEnter={() => {
                  setIsProfileEnlarged(true);
                  setTimeout(() => setIsProfileEnlarged(false), 5000);
                }}
                onMouseLeave={() => setIsProfileEnlarged(false)}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className="cursor-pointer"
                >
                  <FaPalette className="text-3xl text-primary-300" />
                </motion.div>
              </motion.div>

              <span className="hidden sm:block">Anyetei</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative font-medium transition-colors hover:text-white ${
                  location.pathname === item.href
                    ? 'text-white'
                    : 'text-white/80'
                }`}
              >
                {item.name}
                {location.pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-white hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${isScrolled ? 'bg-primary-800' : 'bg-primary-700'} border-t border-white/20`}
            >
              <div className="px-4 py-6 space-y-4">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      className={`block py-2 text-lg font-medium transition-colors hover:text-white ${
                        location.pathname === item.href
                          ? 'text-white'
                          : 'text-white/80'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;