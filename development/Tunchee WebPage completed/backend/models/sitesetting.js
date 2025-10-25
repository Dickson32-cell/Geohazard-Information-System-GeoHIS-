'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SiteSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SiteSetting.init({
    key: DataTypes.STRING,
    value: DataTypes.TEXT,
    category: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SiteSetting',
  });
  return SiteSetting;
};