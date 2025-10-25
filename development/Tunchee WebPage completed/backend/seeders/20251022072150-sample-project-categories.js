'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert sample project categories
    await queryInterface.bulkInsert('ProjectCategories', [
      {
        name: 'Web Design',
        slug: 'web-design',
        description: 'Responsive website design and development',
        display_order: 1,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Brand Identity',
        slug: 'brand-identity',
        description: 'Complete brand identity including logos, color palettes, and guidelines',
        display_order: 2,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'UI/UX Design',
        slug: 'ui-ux-design',
        description: 'User interface and user experience design',
        display_order: 3,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Packaging Design',
        slug: 'packaging-design',
        description: 'Product packaging and label design',
        display_order: 4,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Social Media Graphics',
        slug: 'social-media-graphics',
        description: 'Social media posts, stories, and promotional graphics',
        display_order: 5,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Print Design',
        slug: 'print-design',
        description: 'Business cards, brochures, flyers, and other print materials',
        display_order: 6,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Logo Design',
        slug: 'logo-design',
        description: 'Professional logo design and brand mark creation',
        display_order: 7,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Motion Graphics',
        slug: 'motion-graphics',
        description: 'Animated graphics, video content, and motion design',
        display_order: 8,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Illustration',
        slug: 'illustration',
        description: 'Custom illustrations, icons, and graphic artwork',
        display_order: 9,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Typography Design',
        slug: 'typography-design',
        description: 'Custom typography, font design, and lettering',
        display_order: 10,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProjectCategories', null, {});
  }
};
