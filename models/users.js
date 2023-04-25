'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Posts, {
        sourceKey: 'userId',
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.Likes, {
        sourceKey: 'userId',
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.Comments, {
        sourceKey: 'userId',
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
    }
  }
  Users.init({
    userId: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    nickname: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Users',
  });

  return Users;
};