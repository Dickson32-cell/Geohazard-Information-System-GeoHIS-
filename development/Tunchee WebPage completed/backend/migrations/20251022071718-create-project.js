'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Projects', {
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
      description: {
        type: Sequelize.TEXT
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      client_name: {
        type: Sequelize.STRING
      },
      client_industry: {
        type: Sequelize.STRING
      },
      completion_date: {
        type: Sequelize.DATE
      },
      featured_image_url: {
        type: Sequelize.STRING
      },
      view_count: {
        type: Sequelize.INTEGER
      },
      is_featured: {
        type: Sequelize.BOOLEAN
      },
      is_published: {
        type: Sequelize.BOOLEAN
      },
      status: {
        type: Sequelize.STRING
      },
      seo_title: {
        type: Sequelize.STRING
      },
      seo_description: {
        type: Sequelize.STRING
      },
      seo_keywords: {
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
    await queryInterface.dropTable('Projects');
  }
};