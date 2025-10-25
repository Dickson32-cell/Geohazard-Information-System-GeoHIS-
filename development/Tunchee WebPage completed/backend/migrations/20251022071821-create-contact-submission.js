'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ContactSubmissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      project_type: {
        type: Sequelize.STRING
      },
      budget_range: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      preferred_timeline: {
        type: Sequelize.STRING
      },
      ip_address: {
        type: Sequelize.STRING
      },
      is_read: {
        type: Sequelize.BOOLEAN
      },
      is_archived: {
        type: Sequelize.BOOLEAN
      },
      status: {
        type: Sequelize.STRING
      },
      responded_at: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('ContactSubmissions');
  }
};