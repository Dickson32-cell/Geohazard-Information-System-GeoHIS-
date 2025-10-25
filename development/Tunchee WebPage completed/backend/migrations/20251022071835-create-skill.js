'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Skills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      skill_name: {
        type: Sequelize.STRING
      },
      category: {
        type: Sequelize.STRING
      },
      proficiency_level: {
        type: Sequelize.STRING
      },
      years_of_experience: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Skills');
  }
};