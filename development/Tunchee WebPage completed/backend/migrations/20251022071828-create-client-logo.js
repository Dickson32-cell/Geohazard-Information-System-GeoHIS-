'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClientLogos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      client_name: {
        type: Sequelize.STRING
      },
      logo_url: {
        type: Sequelize.STRING
      },
      industry: {
        type: Sequelize.STRING
      },
      project_type: {
        type: Sequelize.STRING
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      is_published: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('ClientLogos');
  }
};