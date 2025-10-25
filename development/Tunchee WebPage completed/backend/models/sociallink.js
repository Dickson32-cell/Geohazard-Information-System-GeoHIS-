'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SocialLink extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SocialLink.init({
    platform: DataTypes.STRING,
    url: DataTypes.STRING,
    handle: DataTypes.STRING,
    display_label: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    display_order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SocialLink',
  });
  return SocialLink;
};