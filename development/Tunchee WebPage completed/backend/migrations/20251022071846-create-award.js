'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Awards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      award_name: {
        type: Sequelize.STRING
      },
      award_year: {
        type: Sequelize.INTEGER
      },
      awarding_organization: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      certificate_url: {
        type: Sequelize.STRING
      },
      award_link: {
        type: Sequelize.STRING
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      is_featured: {
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
    await queryInterface.dropTable('Awards');
  }
};