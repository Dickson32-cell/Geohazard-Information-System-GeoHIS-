import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInstagram,
  FaTiktok,
  FaBehance,
  FaPinterest
} from 'react-icons/fa';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    budgetRange: '',
    message: '',
    preferredTimeline: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'
  const [errors, setErrors] = useState({});

  const projectTypes = [
    'Logo Design',
    'Branding & Identity',
    'UI/UX Design',
    'Print Design',
    'Packaging Design',
    'Motion Graphics',
    'Social Media Design',
    'Other'
  ];

  const budgetRanges = [
    'Under GHS500',
    'GHS500 - GHS1,000',
    'GHS1,000 - GHS2,500',
    'GHS2,500 - GHS5,000',
    'GHS5,000 - GHS10,000',
    'Over GHS10,000'
  ];

  const timelines = [
    'ASAP (Rush)',
    '1-2 weeks',
    '2-4 weeks',
    '1-2 months',
    'Flexible'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.projectType) newErrors.projectType = 'Please select a project type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSubmitStatus(null);

    try {
      const response = await axios.post('/api/v1/contact', formData);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        projectType: '',
        budgetRange: '',
        message: '',
        preferredTimeline: ''
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/alhajitunche',
      color: 'hover:text-pink-500'
    },
    {
      name: 'TikTok',
      icon: FaTiktok,
      url: 'https://www.tiktok.com/@tunchee_graphics',
      color: 'hover:text-gray-900'
    },
    {
      name: 'Behance',
      icon: FaBehance,
      url: 'https://www.behance.net/sowahjoseph',
      color: 'hover:text-blue-600'
    },
    {
      name: 'Pinterest',
      icon: FaPinterest,
      url: 'https://pin.it/22HOsjPNe',
      color: 'hover:text-red-500'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact - Anyetei Sowah Joseph | Graphic Design Services</title>
        <meta name="description" content="Get in touch for professional graphic design services. Contact Anyetei for logo design, branding, UI/UX, and more." />
        <meta name="keywords" content="contact, graphic design services, quote, logo design, branding" />
      </Helmet>

      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/10 to-accent-500/10">
        <div className="container-max">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Let's <span className="text-primary">Create</span> Something Amazing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to bring your vision to life? I'd love to hear about your project and discuss how we can work together.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Your Project</h2>

                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                  >
                    <FaCheckCircle className="text-green-500 text-xl" />
                    <div>
                      <p className="text-green-800 font-medium">Message sent successfully!</p>
                      <p className="text-green-600 text-sm">I'll get back to you within 24 hours.</p>
                    </div>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                  >
                    <FaExclamationTriangle className="text-red-500 text-xl" />
                    <div>
                      <p className="text-red-800 font-medium">Failed to send message</p>
                      <p className="text-red-600 text-sm">Please try again or contact me directly.</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Your full name"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="your@email.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone & Project Type */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>

                    <div>
                      <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
                        Project Type *
                      </label>
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                          errors.projectType ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select project type</option>
                        {projectTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.projectType && <p className="text-red-500 text-sm mt-1">{errors.projectType}</p>}
                    </div>
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range
                      </label>
                      <select
                        id="budgetRange"
                        name="budgetRange"
                        value={formData.budgetRange}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map(range => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="preferredTimeline" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Timeline
                      </label>
                      <select
                        id="preferredTimeline"
                        name="preferredTimeline"
                        value={formData.preferredTimeline}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select timeline</option>
                        {timelines.map(timeline => (
                          <option key={timeline} value={timeline}>{timeline}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Details *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                        errors.message ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Tell me about your project, goals, target audience, and any specific requirements..."
                    />
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Contact Information & Social */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>

                <div className="space-y-6">
                  <motion.div
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-3 bg-primary/10 rounded-full">
                      <FaEnvelope className="text-primary text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a
                        href="mailto:sowahjoseph81@gmail.com"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        sowahjoseph81@gmail.com
                      </a>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaPhone className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a
                        href="tel:+233508582091"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        +233 508 582 091
                      </a>
                      <br />
                      <a
                        href="tel:+233551855708"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        +233 551 855 708
                      </a>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaWhatsapp className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <a
                        href="https://wa.me/233508582091"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        +233 508 582 091
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Follow Me</h2>
                <p className="text-gray-600 mb-6">
                  Stay updated with my latest work and design insights across social media.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 ${social.color}`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <social.icon className="text-2xl" />
                      <span className="font-medium">{social.name}</span>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Quick Response Promise */}
              <motion.div
                className="bg-gradient-to-r from-primary to-accent-600 rounded-2xl p-8 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-bold mb-4">Quick Response Guarantee</h3>
                <p className="mb-4">
                  I typically respond to all inquiries within 24 hours. For urgent projects,
                  feel free to call or WhatsApp me directly.
                </p>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaCheckCircle />
                  <span>Professional & Reliable Service</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;