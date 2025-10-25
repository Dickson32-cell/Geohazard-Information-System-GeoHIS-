import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FaCheck,
  FaArrowRight
} from 'react-icons/fa';
import axios from 'axios';
import ServiceCard from '../components/common/ServiceCard';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/v1/services');
      setServices(response.data.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to static data if API fails
      setServices([
        {
          id: 1,
          name: 'Logo Design',
          description: 'Professional logo design that captures your brand essence and creates lasting impressions.',
          icon: 'FaPalette',
          turnaround_time_days: 7,
          base_price: 500,
          is_featured: true,
          packages: [
            { name: 'Starter', price: 299, deliverables: ['3 concepts', '2 revisions'], revision_count: 2, turnaround_days: 5 },
            { name: 'Professional', price: 599, deliverables: ['5 concepts', '5 revisions', 'Brand guidelines'], revision_count: 5, turnaround_days: 7 },
            { name: 'Premium', price: 999, deliverables: ['Unlimited concepts', 'Unlimited revisions', 'Brand guidelines', 'Source files'], revision_count: 0, turnaround_days: 10 }
          ]
        },
        {
          id: 2,
          name: 'Branding & Identity',
          description: 'Complete brand identity systems including logos, color palettes, typography, and brand guidelines.',
          icon: 'FaRocket',
          turnaround_time_days: 14,
          base_price: 1500,
          is_featured: true,
          packages: [
            { name: 'Essential', price: 899, deliverables: ['Logo design', 'Color palette', 'Typography'], revision_count: 3, turnaround_days: 10 },
            { name: 'Complete', price: 1499, deliverables: ['Logo design', 'Brand guidelines', 'Business cards', 'Letterhead'], revision_count: 5, turnaround_days: 14 },
            { name: 'Enterprise', price: 2499, deliverables: ['Complete brand identity', 'Brand guidelines', 'All stationery', 'Digital assets'], revision_count: 0, turnaround_days: 21 }
          ]
        },
        {
          id: 3,
          name: 'UI/UX Design',
          description: 'User-centered design solutions that create intuitive and engaging digital experiences.',
          icon: 'FaMobileAlt',
          turnaround_time_days: 10,
          base_price: 800,
          is_featured: true,
          packages: [
            { name: 'Wireframes', price: 499, deliverables: ['User research', 'Wireframes', 'User flow'], revision_count: 2, turnaround_days: 7 },
            { name: 'UI Design', price: 899, deliverables: ['Wireframes', 'High-fidelity UI', 'Interactive prototype'], revision_count: 3, turnaround_days: 10 },
            { name: 'Full UX/UI', price: 1499, deliverables: ['User research', 'Wireframes', 'UI design', 'Prototype', 'Usability testing'], revision_count: 5, turnaround_days: 14 }
          ]
        },
        {
          id: 4,
          name: 'Print Design',
          description: 'Eye-catching print materials that communicate your message effectively across all mediums.',
          icon: 'FaPrint',
          turnaround_time_days: 5,
          base_price: 300,
          packages: [
            { name: 'Basic', price: 199, deliverables: ['1 design concept', '2 revisions', 'Print-ready files'], revision_count: 2, turnaround_days: 3 },
            { name: 'Standard', price: 399, deliverables: ['3 design concepts', '3 revisions', 'Print-ready files'], revision_count: 3, turnaround_days: 5 },
            { name: 'Premium', price: 699, deliverables: ['5 design concepts', 'Unlimited revisions', 'Print-ready files'], revision_count: 0, turnaround_days: 7 }
          ]
        },
        {
          id: 5,
          name: 'Packaging Design',
          description: 'Creative packaging solutions that make your products stand out on the shelves.',
          icon: 'FaShoppingBag',
          turnaround_time_days: 8,
          base_price: 600,
          packages: [
            { name: 'Single Product', price: 499, deliverables: ['3 design concepts', 'Mockups', 'Die-cut template'], revision_count: 3, turnaround_days: 7 },
            { name: 'Product Line', price: 899, deliverables: ['Product line design', 'Mockups', 'Brand consistency'], revision_count: 5, turnaround_days: 10 },
            { name: 'Complete Package', price: 1499, deliverables: ['Full packaging system', 'Mockups', 'Production files'], revision_count: 0, turnaround_days: 14 }
          ]
        },
        {
          id: 6,
          name: 'Motion Graphics',
          description: 'Dynamic animations and video content that bring your brand to life.',
          icon: 'FaVideo',
          turnaround_time_days: 12,
          base_price: 1000,
          packages: [
            { name: 'Simple Animation', price: 699, deliverables: ['30-second animation', '2 revisions', 'Source files'], revision_count: 2, turnaround_days: 10 },
            { name: 'Complex Animation', price: 1299, deliverables: ['60-second animation', '3 revisions', 'Multiple formats'], revision_count: 3, turnaround_days: 14 },
            { name: 'Brand Video', price: 1999, deliverables: ['2-minute video', 'Script writing', 'Voiceover', 'Multiple formats'], revision_count: 5, turnaround_days: 21 }
          ]
        },
        {
          id: 7,
          name: 'Social Media Design',
          description: 'Engaging social media content that builds your brand presence and drives engagement.',
          icon: 'FaShareAlt',
          turnaround_time_days: 3,
          base_price: 200,
          packages: [
            { name: 'Post Package', price: 149, deliverables: ['10 social posts', 'Stories', 'Highlights'], revision_count: 1, turnaround_days: 2 },
            { name: 'Monthly Content', price: 399, deliverables: ['40 social posts', 'Stories', 'Monthly calendar'], revision_count: 2, turnaround_days: 5 },
            { name: 'Complete Strategy', price: 799, deliverables: ['Content strategy', '80 posts', 'Brand guidelines'], revision_count: 3, turnaround_days: 10 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [selectedService, setSelectedService] = useState(null);

  const ServiceModal = ({ service, onClose }) => {
    if (!service) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                <p className="text-gray-600">{service.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {service.packages?.map((pkg, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer ${
                    index === 1 ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    onClose();
                    window.location.href = '/contact';
                  }}
                >
                  {index === 1 && (
                    <div className="bg-primary text-white text-center py-1 px-3 rounded-full text-sm font-medium mb-4 -mt-2">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-primary mb-4">GHS{pkg.price}</div>

                  <ul className="space-y-2 mb-6">
                    {pkg.deliverables.map((deliverable, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCheck className="text-green-500 text-xs" />
                        {deliverable}
                      </li>
                    ))}
                  </ul>

                  <div className="text-sm text-gray-500 mb-4">
                    {pkg.revision_count === 0 ? 'Unlimited revisions' : `${pkg.revision_count} revisions included`}
                  </div>

                  <div className="text-sm text-gray-500 mb-6">
                    {pkg.turnaround_days} days delivery
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Need a custom package or have questions about our services?
              </p>
              <button
                onClick={() => {
                  onClose();
                  // Navigate to contact page
                  window.location.href = '/contact';
                }}
                className="btn-secondary"
              >
                Contact Us for Custom Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Services - Anyetei Sowah Joseph | Graphic Design Services & Pricing</title>
        <meta name="description" content="Professional graphic design services including logo design, branding, UI/UX, print design, and more. View pricing packages and start your project today." />
        <meta name="keywords" content="graphic design services, pricing, packages, logo design, branding, UI/UX design" />
      </Helmet>

      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/10 to-accent-500/10">
        <div className="container-max">
          <div
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Professional <span className="text-primary">Design Services</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to completion, I deliver high-quality design solutions that help your brand stand out and succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-max">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-6 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-wrap justify-center gap-8"
            >
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={setSelectedService}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-max text-center">
          <div
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Let's discuss your vision and create something amazing together. Get a free consultation and quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/contact'}
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Free Quote
              </button>
              <button
                onClick={() => window.location.href = '/portfolio'}
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Portfolio
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Service Modal */}
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
};

export default Services;