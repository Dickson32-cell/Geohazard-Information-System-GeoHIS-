'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      password_hash: {
        type: Sequelize.STRING
      },
      full_name: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN
      },
      two_factor_secret: {
        type: Sequelize.STRING
      },
      last_login: {
        type: Sequelize.DATE
      },
      login_attempts: {
        type: Sequelize.INTEGER
      },
      locked_until: {
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
    await queryInterface.dropTable('Users');
  }
};