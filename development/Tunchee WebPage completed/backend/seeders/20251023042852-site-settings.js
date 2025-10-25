'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert default site settings
    await queryInterface.bulkInsert('SiteSettings', [
      // Hero Section
      {
        key: 'hero_title_line1',
        value: 'Crafting Compelling',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_title_line2',
        value: 'Brand Identities',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_subtitle',
        value: 'Professional graphic designer specializing in logo design, branding, and creative visual solutions that tell your story.',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_cta_primary_text',
        value: 'View My Work',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_cta_primary_link',
        value: '/portfolio',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_cta_secondary_text',
        value: 'Get a Quote',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'hero_cta_secondary_link',
        value: '/contact',
        category: 'hero',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Stats Section
      {
        key: 'stats_projects_completed',
        value: '50+',
        category: 'stats',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'stats_years_experience',
        value: '5+',
        category: 'stats',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'stats_happy_clients',
        value: '25+',
        category: 'stats',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'stats_client_satisfaction',
        value: '100%',
        category: 'stats',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Services Section
      {
        key: 'services_title',
        value: 'What I Do',
        category: 'services',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'services_subtitle',
        value: 'From concept to creation, I bring your vision to life with professional design services.',
        category: 'services',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'services_cta_text',
        value: 'View All Services',
        category: 'services',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'services_cta_link',
        value: '/services',
        category: 'services',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Social Media Section
      {
        key: 'social_title',
        value: 'Follow My Creative Journey',
        category: 'social',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'social_subtitle',
        value: 'Stay updated with my latest projects, design tips, and creative insights',
        category: 'social',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // SEO/Metadata
      {
        key: 'seo_title',
        value: 'Anyetei Sowah Joseph - Graphic Designer | Professional Portfolio',
        category: 'seo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'seo_description',
        value: 'Professional graphic designer specializing in brand identity, logo design, and creative visual solutions. View my portfolio and get a quote for your project.',
        category: 'seo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'seo_keywords',
        value: 'graphic designer, logo design, branding, UI/UX design, portfolio, Anyetei Sowah Joseph',
        category: 'seo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SiteSettings', null, {});
  }
};
