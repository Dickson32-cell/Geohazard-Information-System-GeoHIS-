'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Award extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Award.init({
    award_name: DataTypes.STRING,
    award_year: DataTypes.INTEGER,
    awarding_organization: DataTypes.STRING,
    description: DataTypes.TEXT,
    certificate_url: DataTypes.STRING,
    award_link: DataTypes.STRING,
    display_order: DataTypes.INTEGER,
    is_featured: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Award',
  });
  return Award;
};