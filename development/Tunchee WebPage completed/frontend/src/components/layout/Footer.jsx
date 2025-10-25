import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaPalette
} from 'react-icons/fa';
import LiquidGlassText from '../common/LiquidGlassText';
import SocialCard from '../common/SocialCard';

const Footer = () => {
  const contactInfo = [
    {
      icon: FaEnvelope,
      text: 'sowahjoseph81@gmail.com',
      href: 'mailto:sowahjoseph81@gmail.com'
    },
    {
      icon: FaPhone,
      text: '+233 508 582 091',
      href: 'tel:+233508582091'
    },
    {
      icon: FaPhone,
      text: '+233 551 855 708',
      href: 'tel:+233551855708'
    },
    {
      icon: FaWhatsapp,
      text: 'WhatsApp',
      href: 'https://wa.me/233508582091'
    }
  ];

  const footerLinks = {
    services: [
      { name: 'Logo Design', href: '/services' },
      { name: 'Branding', href: '/services' },
      { name: 'UI/UX Design', href: '/services' },
      { name: 'Print Design', href: '/services' }
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Contact', href: '/contact' }
    ]
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <FaPalette className="text-3xl text-primary" />
                </motion.div>
                <span className="text-xl font-bold">Anyetei</span>
              </Link>
              <p className="text-gray-400 mb-6">
                Professional graphic designer specializing in brand identity,
                logo design, and creative visual solutions.
              </p>

              {/* Social Media Card */}
              <SocialCard />
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                {footerLinks.services.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Get In Touch</h3>
              <div className="space-y-3">
                {contactInfo.map((contact, index) => (
                  <motion.a
                    key={index}
                    href={contact.href}
                    className="flex items-center space-x-3 text-gray-400 hover:text-primary transition-colors group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <contact.icon className="text-primary group-hover:scale-110 transition-transform" />
                    <span>{contact.text}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container-max">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 px-4 sm:px-6 lg:px-8 gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Anyetei Sowah Joseph. All rights reserved.
            </p>
            <LiquidGlassText />
            <div className="flex space-x-6">
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-primary text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-400 hover:text-primary text-sm transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;