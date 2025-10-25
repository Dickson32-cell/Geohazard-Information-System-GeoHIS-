'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ClientLogo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ClientLogo.init({
    client_name: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    industry: DataTypes.STRING,
    project_type: DataTypes.STRING,
    display_order: DataTypes.INTEGER,
    is_published: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ClientLogo',
  });
  return ClientLogo;
};