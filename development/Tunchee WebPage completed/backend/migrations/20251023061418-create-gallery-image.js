'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GalleryImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false
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
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      file_size: {
        type: Sequelize.INTEGER
      },
      file_name: {
        type: Sequelize.STRING
      },
      mime_type: {
        type: Sequelize.STRING
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        }
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
    await queryInterface.dropTable('GalleryImages');
  }
};