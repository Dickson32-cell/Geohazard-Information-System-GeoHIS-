'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ServicePackages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      service_id: {
        type: Sequelize.INTEGER
      },
      package_name: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.DECIMAL
      },
      description: {
        type: Sequelize.TEXT
      },
      deliverables: {
        type: Sequelize.TEXT
      },
      revision_count: {
        type: Sequelize.INTEGER
      },
      turnaround_days: {
        type: Sequelize.INTEGER
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      is_popular: {
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
    await queryInterface.dropTable('ServicePackages');
  }
};