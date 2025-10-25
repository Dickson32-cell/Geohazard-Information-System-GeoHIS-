'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert sample projects
    await queryInterface.bulkInsert('Projects', [
      {
        title: 'E-Commerce Platform Redesign',
        slug: 'ecommerce-platform-redesign',
        description: 'Complete redesign of a modern e-commerce platform with improved user experience and mobile responsiveness. The new design increased conversion rates by 35% and improved user engagement significantly.',
        category_id: 1,
        client_name: 'TechCorp Solutions',
        client_industry: 'Technology',
        completion_date: new Date('2024-03-20'),
        featured_image_url: '/uploads/projects/ecommerce-main.jpg',
        view_count: 0,
        is_featured: true,
        is_published: true,
        status: 'completed',
        seo_title: 'E-Commerce Platform Redesign - TechCorp Solutions',
        seo_description: 'Complete redesign of a modern e-commerce platform with improved user experience and mobile responsiveness.',
        seo_keywords: 'ecommerce, redesign, user experience, mobile responsive',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Brand Identity for Startup',
        slug: 'brand-identity-startup',
        description: 'Complete brand identity design including logo, color palette, typography, and brand guidelines for a fintech startup. The new brand successfully positioned the company as innovative and trustworthy.',
        category_id: 2,
        client_name: 'FinTech Innovations',
        client_industry: 'Financial Technology',
        completion_date: new Date('2024-02-28'),
        featured_image_url: '/uploads/projects/brand-main.jpg',
        view_count: 0,
        is_featured: true,
        is_published: true,
        status: 'completed',
        seo_title: 'Brand Identity Design - FinTech Innovations',
        seo_description: 'Complete brand identity design for a fintech startup including logo and brand guidelines.',
        seo_keywords: 'brand identity, logo design, fintech, startup',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Mobile App UI/UX Design',
        slug: 'mobile-app-ui-ux',
        description: 'User-centered design for a fitness tracking mobile application with intuitive navigation and engaging user experience. The final design received excellent user feedback.',
        category_id: 3,
        client_name: 'FitLife App',
        client_industry: 'Health & Fitness',
        completion_date: new Date('2024-04-15'),
        featured_image_url: '/uploads/projects/mobile-main.jpg',
        view_count: 0,
        is_featured: true,
        is_published: true,
        status: 'completed',
        seo_title: 'Mobile App UI/UX Design - FitLife App',
        seo_description: 'User-centered design for a fitness tracking mobile application.',
        seo_keywords: 'mobile app, UI/UX design, fitness app, user experience',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Restaurant Website Design',
        slug: 'restaurant-website',
        description: 'Modern, responsive website for a local restaurant featuring menu display, online reservations, and food photography. The site works perfectly on all devices.',
        category_id: 1,
        client_name: 'Bella Vista Restaurant',
        client_industry: 'Hospitality',
        completion_date: new Date('2024-02-10'),
        featured_image_url: '/uploads/projects/restaurant-main.jpg',
        view_count: 0,
        is_featured: false,
        is_published: true,
        status: 'completed',
        seo_title: 'Restaurant Website Design - Bella Vista',
        seo_description: 'Modern, responsive website for Bella Vista Restaurant with online reservations.',
        seo_keywords: 'restaurant website, responsive design, online reservations',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Packaging Design for Cosmetics',
        slug: 'packaging-design-cosmetics',
        description: 'Creative packaging design for a luxury cosmetics line, focusing on elegance and brand recognition. Designs reflect the premium nature of the products.',
        category_id: 4,
        client_name: 'Luxe Beauty',
        client_industry: 'Cosmetics',
        completion_date: new Date('2024-03-10'),
        featured_image_url: '/uploads/projects/packaging-main.jpg',
        view_count: 0,
        is_featured: false,
        is_published: true,
        status: 'completed',
        seo_title: 'Luxury Cosmetics Packaging Design',
        seo_description: 'Creative packaging design for a luxury cosmetics line.',
        seo_keywords: 'packaging design, cosmetics, luxury branding',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Social Media Graphics Campaign',
        slug: 'social-media-graphics',
        description: 'Complete social media graphics package for a marketing campaign including posts, stories, and promotional materials that maintained brand consistency.',
        category_id: 5,
        client_name: 'GreenLife Organics',
        client_industry: 'Organic Products',
        completion_date: new Date('2024-04-01'),
        featured_image_url: '/uploads/projects/social-main.jpg',
        view_count: 0,
        is_featured: false,
        is_published: true,
        status: 'completed',
        seo_title: 'Social Media Graphics Campaign - GreenLife Organics',
        seo_description: 'Complete social media graphics package for marketing campaign.',
        seo_keywords: 'social media graphics, marketing campaign, brand consistency',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Projects', null, {});
  }
};