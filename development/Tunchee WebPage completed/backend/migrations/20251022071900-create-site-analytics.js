'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SiteAnalytics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATE
      },
      total_visitors: {
        type: Sequelize.INTEGER
      },
      unique_visitors: {
        type: Sequelize.INTEGER
      },
      page_views: {
        type: Sequelize.INTEGER
      },
      bounce_rate: {
        type: Sequelize.DECIMAL
      },
      avg_session_duration: {
        type: Sequelize.INTEGER
      },
      traffic_source: {
        type: Sequelize.STRING
      },
      device_type: {
        type: Sequelize.STRING
      },
      top_page: {
        type: Sequelize.STRING
      },
      referrer: {
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
    await queryInterface.dropTable('SiteAnalytics');
  }
};