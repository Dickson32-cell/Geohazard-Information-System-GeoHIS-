import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FaArrowRight, FaPalette, FaCode, FaRocket, FaInstagram, FaTiktok, FaBehance, FaPinterest, FaCheck } from 'react-icons/fa';
import Particles from '../components/common/Particles';
import axios from 'axios';
import ServiceCard from '../components/common/ServiceCard';

// Load local project assets for home page gallery
const projectAssetMap = import.meta.glob('../assets/projects/*', { eager: true, query: '?url', import: 'default' });

const Home = () => {
  const [settings, setSettings] = useState({});
  const [profileData, setProfileData] = useState({});
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
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
      color: 'hover:text-gray-800'
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
      color: 'hover:text-red-600'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsResponse = await axios.get('http://localhost:5002/api/v1/settings');
        setSettings(settingsResponse.data.settings || {});
      } catch (error) {
        console.error('Home: Error fetching settings:', error);
        // Use default settings if API fails
        setSettings({
          hero: {
            hero_title_line1: 'Crafting Compelling',
            hero_title_line2: 'Brand Identities',
            hero_subtitle: 'Professional graphic designer specializing in logo design, branding, and creative visual solutions that tell your story.',
            hero_cta_primary_text: 'View My Work',
            hero_cta_primary_link: '/portfolio',
            hero_cta_secondary_text: 'Get a Quote',
            hero_cta_secondary_link: '/contact'
          },
          stats: {
            stats_projects_completed: '20+',
            stats_years_experience: '3+',
            stats_happy_clients: '100+',
            stats_client_satisfaction: '100%'
          },
          services: {
            services_title: 'What I Do',
            services_subtitle: 'From concept to creation, I bring your vision to life with professional design services.',
            services_cta_text: 'View All Services',
            services_cta_link: '/services'
          },
          social: {
            social_title: 'Follow My Creative Journey',
            social_subtitle: 'Stay updated with my latest projects, design tips, and creative insights'
          },
          seo: {
            seo_title: 'Anyetei Sowah Joseph - Graphic Designer | Professional Portfolio',
            seo_description: 'Professional graphic designer specializing in brand identity, logo design, and creative visual solutions. View my portfolio and get a quote for your project.',
            seo_keywords: 'graphic designer, logo design, branding, UI/UX design, portfolio, Anyetei Sowah Joseph'
          }
        });
      }

      try {
        // Fetch profile data
        const profileResponse = await axios.get('http://localhost:5002/api/v1/auth/profile');
        setProfileData(profileResponse.data.data.profile || {});
      } catch (_error) {
        console.error('Home: Error fetching profile:', _error);
        // Set default profile data
        setProfileData({
          full_name: 'Anyetei Sowah Joseph',
          profile_picture_url: null
        });
      }

      try {
        // Fetch gallery images with better error handling
        console.log('Home: Fetching gallery images...');
        const apiUrl = 'http://localhost:5002/api/v1/gallery';
        
        const galleryResponse = await axios.get(apiUrl, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false
        });
        
        const images = galleryResponse.data.data.images || [];
        console.log('Home: Gallery images fetched:', images.length);
        
        // Attach local asset URLs when available (prefer local frontend assets)
        const mapped = images.map(img => {
          const filename = img.file_name || (img.image_url || '').split('/').pop();
          const matchKey = Object.keys(projectAssetMap).find(k => k.endsWith(filename));
          const localUrl = matchKey ? projectAssetMap[matchKey] : null;
          console.log(`Home: Image ${filename}: ${matchKey ? 'FOUND in glob' : 'using backend URL'}`);
          return {
            ...img,
            local_url: localUrl || null,
            // Ensure we have a valid image URL
            image_url: img.image_url || `/uploads/${filename}`
          };
        });
        
        console.log('Home: Mapped images sample:', mapped.slice(0, 3).map(img => ({ 
          filename: img.file_name, 
          hasLocal: !!img.local_url,
          backendUrl: `http://localhost:5002${img.image_url}`
        })));
        
        setGalleryImages(mapped);
      } catch (error) {
        console.error('Home: Error fetching gallery images:', error);
        console.error('Home: Error details:', error.response || error.message);
        
        // Fallback: Create mock data from local assets if API fails
        console.log('Home: Using fallback local images...');
        const localAssets = Object.entries(projectAssetMap).map(([path, url], index) => ({
          id: `home_local_${index}`,
          image_title: `Portfolio Image ${index + 1}`,
          image_url: `/assets/${path.split('/').pop()}`,
          file_name: path.split('/').pop(),
          local_url: url
        }));
        
        console.log('Home: Fallback images created:', localAssets.length);
        setGalleryImages(localAssets);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{settings?.seo?.seo_title || 'Anyetei Sowah Joseph - Graphic Designer | Professional Portfolio'}</title>
        <meta name="description" content={settings?.seo?.seo_description || 'Professional graphic designer specializing in brand identity, logo design, and creative visual solutions. View my portfolio and get a quote for your project.'} />
        <meta name="keywords" content={settings?.seo?.seo_keywords || 'graphic designer, logo design, branding, UI/UX design, portfolio, Anyetei Sowah Joseph'} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        {/* WebGL Particles Background */}
        <div className="absolute inset-0 overflow-hidden">
          <Particles
            particleCount={200}
            particleColors={['#ffffff', '#ff0000', '#0000ff', '#ff4444', '#4444ff']}
            speed={1}
            baseSize={100}
            moveParticlesOnHover={true}
          />
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-gray-800/30 to-blue-950/20" />
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-gray-900/20 to-black/30" />

        <div className="container-max relative z-10">
          <div className="text-center max-w-4xl mx-auto px-4">
            {/* Profile Picture */}
            {profileData?.profile_picture_url && (
              <div className="mb-8">
                <img
                  src={profileData.profile_picture_url}
                  alt={profileData.full_name || 'Designer'}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-xl"
                />
              </div>
            )}

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              <span className="block text-white">
                {settings?.hero?.hero_title_line1 || 'Crafting Compelling'}
              </span>
              <span className="block text-primary">
                {settings?.hero?.hero_title_line2 || 'Brand Identities'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {settings?.hero?.hero_subtitle || 'Professional graphic designer specializing in logo design, branding, and creative visual solutions that tell your story.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to={settings?.hero?.hero_cta_primary_link || '/portfolio'} className="btn-primary text-lg px-8 py-4">
                {settings?.hero?.hero_cta_primary_text || 'View My Work'}
                <FaArrowRight className="ml-2" />
              </Link>
              <Link to={settings?.hero?.hero_cta_secondary_link || '/contact'} className="btn-primary text-lg px-8 py-4">
                {settings?.hero?.hero_cta_secondary_text || 'Get a Quote'}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { number: settings?.stats?.stats_projects_completed || '50+', label: 'Projects Completed' },
                { number: settings?.stats?.stats_years_experience || '5+', label: 'Years Experience' },
                { number: settings?.stats?.stats_happy_clients || '25+', label: 'Happy Clients' },
                { number: settings?.stats?.stats_client_satisfaction || '100%', label: 'Client Satisfaction' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section-padding bg-blue-50">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {settings?.services?.services_title || 'What I Do'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {settings?.services?.services_subtitle || 'From concept to creation, I bring your vision to life with professional design services.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                id: 1,
                name: 'Brand Identity',
                description: 'Complete brand identity design including logos, color palettes, and brand guidelines that establish your unique visual presence.',
                created_at: '2024-01-15T10:00:00Z',
                packages: [
                  { name: 'Starter', price: 299, deliverables: ['3 concepts', '2 revisions'], revision_count: 2, turnaround_days: 5 },
                  { name: 'Professional', price: 599, deliverables: ['5 concepts', '5 revisions', 'Brand guidelines'], revision_count: 5, turnaround_days: 7 },
                  { name: 'Premium', price: 999, deliverables: ['Unlimited concepts', 'Unlimited revisions', 'Brand guidelines', 'Source files'], revision_count: 0, turnaround_days: 10 }
                ]
              },
              {
                id: 2,
                name: 'UI/UX Design',
                description: 'User-centered interface design that combines aesthetics with functionality for web and mobile applications.',
                created_at: '2024-01-20T10:00:00Z',
                packages: [
                  { name: 'Wireframes', price: 499, deliverables: ['User research', 'Wireframes', 'User flow'], revision_count: 2, turnaround_days: 7 },
                  { name: 'UI Design', price: 899, deliverables: ['Wireframes', 'High-fidelity UI', 'Interactive prototype'], revision_count: 3, turnaround_days: 10 },
                  { name: 'Full UX/UI', price: 1499, deliverables: ['User research', 'Wireframes', 'UI design', 'Prototype', 'Usability testing'], revision_count: 5, turnaround_days: 14 }
                ]
              },
              {
                id: 3,
                name: 'Print Design',
                description: 'Professional print materials including brochures, business cards, and packaging that make lasting impressions.',
                created_at: '2024-01-25T10:00:00Z',
                packages: [
                  { name: 'Basic', price: 199, deliverables: ['1 design concept', '2 revisions', 'Print-ready files'], revision_count: 2, turnaround_days: 3 },
                  { name: 'Standard', price: 399, deliverables: ['3 design concepts', '3 revisions', 'Print-ready files'], revision_count: 3, turnaround_days: 5 },
                  { name: 'Premium', price: 699, deliverables: ['5 design concepts', 'Unlimited revisions', 'Print-ready files'], revision_count: 0, turnaround_days: 7 }
                ]
              }
            ].map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={setSelectedService}
                showDate={false}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={settings?.services?.services_cta_link || '/services'} className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/50">
              {settings?.services?.services_cta_text || 'View All Services'}
              <FaArrowRight className="ml-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-gray-900">
              My Portfolio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore my complete collection of design projects and creative work
            </p>
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.slice(0, 3).map((image) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-lg shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image.local_url || `http://localhost:5002${image.image_url}`}
                      alt={image.image_alt_text || image.image_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Home: Image failed to load:', image.file_name);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaPalette className="text-3xl text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Loading</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Images are automatically loaded from the uploads folder. Add images to the backend uploads directory to see them here!
              </p>
            </div>
          )}

          <div
            className="text-center mt-12"
          >
            <Link to="/portfolio" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-500/50">
              View All Projects
              <FaArrowRight className="ml-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="section-padding bg-blue-600 text-white">
        <div className="container-max text-center">
          <h2
            className="text-3xl md:text-4xl font-heading font-bold mb-8"
          >
            {settings?.social?.social_title || 'Follow My Creative Journey'}
          </h2>

          <div
            className="flex justify-center space-x-8"
          >
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-4xl transition-all duration-300 ${social.color}`}
              >
                <social.icon />
              </a>
            ))}
          </div>

          <p
            className="mt-8 text-primary-100 max-w-md mx-auto"
          >
            {settings?.social?.social_subtitle || 'Stay updated with my latest projects, design tips, and creative insights'}
          </p>
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

export default Home;