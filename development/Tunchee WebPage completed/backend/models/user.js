'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    full_name: DataTypes.STRING,
    role: DataTypes.STRING,
    two_factor_enabled: DataTypes.BOOLEAN,
    two_factor_secret: DataTypes.STRING,
    last_login: DataTypes.DATE,
    login_attempts: DataTypes.INTEGER,
    locked_until: DataTypes.DATE,
    profile_picture_url: DataTypes.STRING,
    about_me: DataTypes.TEXT,
    what_i_can_do: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};