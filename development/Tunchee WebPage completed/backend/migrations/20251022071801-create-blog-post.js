'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BlogPosts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      slug: {
        type: Sequelize.STRING
      },
      content: {
        type: Sequelize.TEXT
      },
      featured_image_url: {
        type: Sequelize.STRING
      },
      excerpt: {
        type: Sequelize.TEXT
      },
      author_id: {
        type: Sequelize.INTEGER
      },
      category: {
        type: Sequelize.STRING
      },
      reading_time_minutes: {
        type: Sequelize.INTEGER
      },
      view_count: {
        type: Sequelize.INTEGER
      },
      is_published: {
        type: Sequelize.BOOLEAN
      },
      is_featured: {
        type: Sequelize.BOOLEAN
      },
      published_at: {
        type: Sequelize.DATE
      },
      scheduled_for: {
        type: Sequelize.DATE
      },
      seo_title: {
        type: Sequelize.STRING
      },
      seo_description: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BlogPosts');
  }
};