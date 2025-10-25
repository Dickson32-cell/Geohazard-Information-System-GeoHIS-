import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import HoverCard from '../components/common/HoverCard';

// Load local project assets map (eager) so we can prefer them when available
const projectAssetMap = import.meta.glob('../assets/projects/*', { eager: true, query: '?url', import: 'default' });

// Static mapping of known local assets for fallback
const localAssetUrls = {
  'image-1761204612890-928296857.jpg': '/src/assets/projects/image-1761204612890-928296857.jpg',
  'image-1761204612876-228110480.jpg': '/src/assets/projects/image-1761204612876-228110480.jpg',
  'image-1761204612840-651203714.jpg': '/src/assets/projects/image-1761204612840-651203714.jpg',
  // Add more as needed, or we can generate this dynamically
};

const Portfolio = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        console.log('Fetching gallery images...');
        console.log('Available local assets:', Object.keys(projectAssetMap));
        
        // Try to fetch from API with better error handling
        const apiUrl = import.meta.env.PROD ? 'http://localhost:5002/api/v1/gallery' : 'http://localhost:5002/api/v1/gallery';
        console.log('Fetching from:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false
        });
        
        const images = response.data.data.images || [];
        console.log('Gallery images fetched:', images.length);

        // Attach local asset URL when available (prefer local frontend assets)
        const mapped = images.map(img => {
          const filename = img.file_name || (img.image_url || '').split('/').pop();
          const matchKey = Object.keys(projectAssetMap).find(k => k.endsWith(filename));
          const localUrl = matchKey ? projectAssetMap[matchKey] : localAssetUrls[filename];
          console.log(`Image ${filename}: ${matchKey ? 'FOUND in glob' : localUrl ? 'FOUND in static' : 'using backend URL'}`);
          return {
            ...img,
            local_url: localUrl || null,
            // Ensure we have a valid image URL
            image_url: img.image_url || `/uploads/${filename}`
          };
        });

        console.log('Mapped images sample:', mapped.slice(0, 3).map(img => ({ 
          filename: img.file_name, 
          hasLocal: !!img.local_url,
          backendUrl: `http://localhost:5002${img.image_url}`
        })));

        // Set images immediately so UI can render
        setGalleryImages(mapped);

        // Preload first few images in background for better performance
        if (mapped.length > 0) {
          mapped.slice(0, 6).forEach(image => {
            const src = image.local_url || `http://localhost:5002${image.image_url}`;
            console.log('Preloading:', src);
            const imgEl = new Image();
            imgEl.onload = () => console.log('Preloaded successfully:', src);
            imgEl.onerror = () => console.error('Failed to preload:', src);
            imgEl.src = src;
          });
          console.log('Image preloading started');
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        console.error('Error details:', error.response || error.message);
        
        // Fallback: Create mock data from local assets if API fails
        console.log('Using fallback local images...');
        const localAssets = Object.entries(projectAssetMap).map(([path, url], index) => ({
          id: `local_${index}`,
          image_title: `Portfolio Image ${index + 1}`,
          image_url: `/assets/${path.split('/').pop()}`,
          file_name: path.split('/').pop(),
          local_url: url
        }));
        
        console.log('Fallback images created:', localAssets.length);
        setGalleryImages(localAssets);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/v1/auth/profile');
        setProfileData(response.data.data.user);
      } catch {
        setProfileData({
          full_name: 'Anyetei Sowah Joseph (Tunchee)',
          profile_picture_url: null
        });
      }
    };

    fetchGalleryImages();
    fetchProfile();
  }, []);

  return (
    <>
      <Helmet>
        <title>Portfolio - Anyetei Sowah Joseph | Graphic Design Projects</title>
        <meta name="description" content="Explore my portfolio of graphic design projects including branding, logo design, UI/UX, and print materials." />
        <meta name="keywords" content="portfolio, graphic design, branding, logo design, UI/UX, print design" />
      </Helmet>

      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/10 to-accent-500/10">
        <div className="container-max">
          <div
            className="text-center mb-12"
          >
            {/* Profile Picture */}
            {profileData?.profile_picture_url && (
              <div
                className="mb-6"
              >
                <img
                  src={profileData.profile_picture_url}
                  alt={profileData.full_name || 'Designer'}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                />
              </div>
            )}

            {/* Full Name */}
            {profileData?.full_name && (
              <h2
                className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4"
              >
                {profileData.full_name}
              </h2>
            )}

            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              My <span className="text-primary">Portfolio</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A showcase of my creative work, from brand identities to digital experiences
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Cards */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading portfolio...</p>
              </div>
            </div>
          ) : galleryImages.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8">
              {Array.from({ length: Math.ceil(galleryImages.length / 3) }, (_, cardIndex) => (
                <HoverCard
                  key={`hover-card-${cardIndex}`}
                  images={galleryImages.slice(cardIndex * 3, cardIndex * 3 + 3)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Portfolio Images Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Unable to load portfolio images. Please check your internet connection and try refreshing the page. If the problem persists, contact support.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Portfolio;