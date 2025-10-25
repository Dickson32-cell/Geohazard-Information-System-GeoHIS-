'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Testimonials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      client_name: {
        type: Sequelize.STRING
      },
      client_company: {
        type: Sequelize.STRING
      },
      client_title: {
        type: Sequelize.STRING
      },
      client_photo_url: {
        type: Sequelize.STRING
      },
      testimonial_text: {
        type: Sequelize.TEXT
      },
      rating: {
        type: Sequelize.INTEGER
      },
      project_type: {
        type: Sequelize.STRING
      },
      client_website: {
        type: Sequelize.STRING
      },
      is_featured: {
        type: Sequelize.BOOLEAN
      },
      is_published: {
        type: Sequelize.BOOLEAN
      },
      is_approved: {
        type: Sequelize.BOOLEAN
      },
      display_order: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Testimonials');
  }
};