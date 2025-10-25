'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BlogComment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BlogComment.init({
    blog_post_id: DataTypes.INTEGER,
    commenter_name: DataTypes.STRING,
    commenter_email: DataTypes.STRING,
    comment_text: DataTypes.TEXT,
    parent_comment_id: DataTypes.INTEGER,
    is_approved: DataTypes.BOOLEAN,
    is_spam: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'BlogComment',
  });
  return BlogComment;
};