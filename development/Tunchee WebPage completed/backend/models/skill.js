'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Skill.init({
    skill_name: DataTypes.STRING,
    category: DataTypes.STRING,
    proficiency_level: DataTypes.STRING,
    years_of_experience: DataTypes.INTEGER,
    display_order: DataTypes.INTEGER,
    is_featured: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Skill',
  });
  return Skill;
};