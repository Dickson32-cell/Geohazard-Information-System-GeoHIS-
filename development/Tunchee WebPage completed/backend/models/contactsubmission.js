'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ContactSubmission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ContactSubmission.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    project_type: DataTypes.STRING,
    budget_range: DataTypes.STRING,
    message: DataTypes.TEXT,
    preferred_timeline: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    is_read: DataTypes.BOOLEAN,
    is_archived: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    responded_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ContactSubmission',
  });
  return ContactSubmission;
};