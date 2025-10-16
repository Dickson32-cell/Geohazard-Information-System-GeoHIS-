import React, { useState } from 'react';
import { Mail, Linkedin, Github, Send, CheckCircle, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileData } from '../data/profileData';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Form submitted:', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
      setIsSubmitting(false);

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: profileData.personal.email,
      href: `mailto:${profileData.personal.email}`,
      color: 'text-deep-gold'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: profileData.personal.location,
      href: null,
      color: 'text-royal-blue'
    },
    {
      icon: Phone,
      label: 'Phone',
      value: profileData.personal.phone || '+233 XX XXX XXXX',
      href: `tel:${profileData.personal.phone || '+233XXXXXXXXX'}`,
      color: 'text-deep-gold'
    }
  ];

  const socialLinks = [
    {
      icon: Linkedin,
      href: profileData.social.linkedin,
      label: 'LinkedIn',
      color: 'hover:text-blue-400'
    },
    {
      icon: Github,
      href: profileData.social.github,
      label: 'GitHub',
      color: 'hover:text-gray-300'
    },
    {
      icon: Mail,
      href: `mailto:${profileData.social.email}`,
      label: 'Email',
      color: 'hover:text-deep-gold'
    }
  ];

  return (
    <section id="contact" className="min-h-screen py-20 px-4 bg-gradient-to-b from-dark-gray/30 to-royal-blue/20 relative overflow-hidden">
      {/* Background 3D Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-deep-gold/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-32 h-32 bg-royal-blue/15 rounded-full blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-12 md:mb-16 text-center px-4"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Get In <span className="text-gradient">Touch</span>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Let's Connect</h3>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
              I'm always interested in discussing new opportunities, collaborations, or just having a chat about technology, governance, and innovation. Feel free to reach out!
            </p>

            {/* Contact Details */}
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  className="flex items-center gap-4 p-4 card-glass rounded-lg hover:border-deep-gold/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`p-3 md:p-4 rounded-full bg-gradient-to-br from-royal-blue/20 to-deep-gold/20 ${info.color}`}>
                    <info.icon size={24} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{info.label}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-white hover:text-deep-gold transition-colors duration-300"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-white">{info.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Follow Me</h4>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`card-glass p-4 rounded-lg hover:border-deep-gold/50 transition-all duration-300 ${social.color}`}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon size={24} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="card-glass p-6 md:p-8 rounded-xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Send a Message</h3>

            {submitted && (
              <motion.div
                className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CheckCircle className="text-green-400" size={24} />
                <p className="text-green-400">Message sent successfully! I'll get back to you soon.</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-dark-gray/50 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-deep-gold focus:ring-2 focus:ring-deep-gold/20 transition-all duration-300`}
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <motion.p
                    className="text-red-400 text-sm mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.name}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-dark-gray/50 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-deep-gold focus:ring-2 focus:ring-deep-gold/20 transition-all duration-300`}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <motion.p
                    className="text-red-400 text-sm mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <label htmlFor="message" className="block text-gray-300 mb-2 font-medium">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full bg-dark-gray/50 border ${errors.message ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-deep-gold focus:ring-2 focus:ring-deep-gold/20 transition-all duration-300 resize-none`}
                  placeholder="Tell me about your project or just say hello..."
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <motion.p
                    className="text-red-400 text-sm mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-deep-gold to-deep-gold-light text-dark-gray font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:shadow-deep-gold/25'
                }`}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark-gray border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;