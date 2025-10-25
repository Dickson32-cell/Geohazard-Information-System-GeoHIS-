import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  FaCheck,
  FaStar,
  FaRocket,
  FaPalette,
  FaCode,
  FaMobileAlt,
  FaPrint,
  FaShoppingBag,
  FaVideo,
  FaShareAlt,
  FaQuestionCircle,
  FaArrowRight
} from 'react-icons/fa';
import axios from 'axios';

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('one-time'); // 'one-time' or 'monthly'
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/v1/services');
      setServices(response.data.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback data will be used
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: "What's included in the revision policy?",
      answer: "Each package includes a specific number of revisions. Additional revisions can be purchased for GHS50 each. Unlimited revision packages allow for unlimited changes until you're completely satisfied."
    },
    {
      question: "How long does it take to complete a project?",
      answer: "Turnaround times vary by service and package. Most projects are completed within 3-14 days. Rush orders are available for an additional 50% fee with 50% faster delivery."
    },
    {
      question: "Do you provide source files?",
      answer: "Yes, all packages include source files in appropriate formats (AI, PSD, FIG, etc.). Premium packages include additional file formats and brand guidelines."
    },
    {
      question: "What if I need a custom package?",
      answer: "Contact me for a custom quote. I can create packages tailored to your specific needs and budget. Custom packages often include additional services and faster turnaround."
    },
    {
      question: "Do you offer payment plans?",
      answer: "For projects over GHS1,000, I offer payment plans with 50% upfront and 50% upon completion. Larger projects can be split into multiple milestones."
    },
    {
      question: "What's your refund policy?",
      answer: "I offer a 100% satisfaction guarantee. If you're not happy with the final result, I'll refund your payment or provide additional revisions until you're satisfied."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechStart Inc",
      text: "Anyetei's logo design exceeded our expectations. Professional, creative, and delivered on time.",
      rating: 5
    },
    {
      name: "Michael Chen",
      company: "Urban Fitness",
      text: "The branding package transformed our business identity. Highly recommend for any business owner.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      company: "GreenLeaf Organics",
      text: "Outstanding packaging design that helped us stand out on shelves. Worth every penny.",
      rating: 5
    }
  ];

  const ServicePricingCard = ({ service, index }) => {
    const getIcon = (iconName) => {
      const icons = {
        FaPalette,
        FaCode,
        FaMobileAlt,
        FaPrint,
        FaShoppingBag,
        FaVideo,
        FaShareAlt,
        FaRocket
      };
      return icons[iconName] || FaPalette;
    };

    const Icon = getIcon(service.icon);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <Icon className="text-primary text-xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{service.description}</p>
        </div>

        <div className="space-y-4">
          {service.packages?.map((pkg, pkgIndex) => (
            <div
              key={pkgIndex}
              className={`border rounded-lg p-4 ${
                pkgIndex === 1 ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
            >
              {pkgIndex === 1 && (
                <div className="bg-primary text-white text-center py-1 px-2 rounded text-xs font-medium mb-2">
                  MOST POPULAR
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">GHS{pkg.price}</div>
                  <div className="text-xs text-gray-500">one-time</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                {pkg.turnaround_days} days • {pkg.revision_count === 0 ? 'Unlimited' : pkg.revision_count} revisions
              </div>

              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                {pkg.deliverables.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <FaCheck className="text-green-500 text-xs" />
                    {item}
                  </li>
                ))}
                {pkg.deliverables.length > 3 && (
                  <li className="text-gray-500">+{pkg.deliverables.length - 3} more items</li>
                )}
              </ul>

              <button
                onClick={() => window.location.href = `/contact?service=${service.name}&package=${pkg.name}`}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  pkgIndex === 1
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Pricing - Anyetei Sowah Joseph | Graphic Design Service Packages</title>
        <meta name="description" content="Transparent pricing for professional graphic design services. Choose from starter, professional, and premium packages for logo design, branding, UI/UX, and more." />
        <meta name="keywords" content="pricing, packages, graphic design pricing, logo design cost, branding packages" />
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
              Transparent <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the perfect package for your project. All packages include professional design,
              unlimited revisions (on premium), and complete brand ownership.
            </p>

            {/* Billing Toggle (for future subscription services) */}
            <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setBillingCycle('one-time')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'one-time'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Pricing Grid */}
      <section className="section-padding">
        <div className="container-max">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-96 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {services.slice(0, 6).map((service, index) => (
                <ServicePricingCard key={service.id} service={service} index={index} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take my word for it - hear from satisfied clients
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-sm" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <div className="container-max">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about working with me
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <FaQuestionCircle className={`text-primary transition-transform ${
                    expandedFAQ === index ? 'rotate-180' : ''
                  }`} />
                </button>

                {expandedFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-max text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Let's discuss your project and create something amazing together.
              Get a free consultation and custom quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/contact'}
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Get Free Quote
                <FaArrowRight />
              </button>
              <button
                onClick={() => window.location.href = '/portfolio'}
                className="bg-primary-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                View Portfolio
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Pricing;