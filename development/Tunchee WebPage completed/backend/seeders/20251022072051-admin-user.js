'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', salt);

    await queryInterface.bulkInsert('Users', [{
      email: process.env.ADMIN_EMAIL || 'sowahjoseph81@gmail.com',
      password_hash: hashedPassword,
      full_name: 'Anyetei Sowah Joseph',
      role: 'admin',
      two_factor_enabled: false,
      login_attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: process.env.ADMIN_EMAIL || 'sowahjoseph81@gmail.com'
    }, {});
  }
};