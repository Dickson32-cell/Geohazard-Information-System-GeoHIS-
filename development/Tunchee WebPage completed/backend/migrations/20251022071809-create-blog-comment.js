'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BlogComments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      blog_post_id: {
        type: Sequelize.INTEGER
      },
      commenter_name: {
        type: Sequelize.STRING
      },
      commenter_email: {
        type: Sequelize.STRING
      },
      comment_text: {
        type: Sequelize.TEXT
      },
      parent_comment_id: {
        type: Sequelize.INTEGER
      },
      is_approved: {
        type: Sequelize.BOOLEAN
      },
      is_spam: {
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
    await queryInterface.dropTable('BlogComments');
  }
};