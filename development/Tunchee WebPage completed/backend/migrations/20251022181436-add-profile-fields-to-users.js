'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'profile_picture_url', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Users', 'about_me', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Users', 'what_i_can_do', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'profile_picture_url');
    await queryInterface.removeColumn('Users', 'about_me');
    await queryInterface.removeColumn('Users', 'what_i_can_do');
  }
};
