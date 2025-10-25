'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProjectImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_id: {
        type: Sequelize.INTEGER
      },
      image_url: {
        type: Sequelize.STRING
      },
      image_alt_text: {
        type: Sequelize.STRING
      },
      image_title: {
        type: Sequelize.STRING
      },
      image_description: {
        type: Sequelize.TEXT
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      is_before_after: {
        type: Sequelize.BOOLEAN
      },
      before_after_pair_id: {
        type: Sequelize.INTEGER
      },
      file_size: {
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
    await queryInterface.dropTable('ProjectImages');
  }
};