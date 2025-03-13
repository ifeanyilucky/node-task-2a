"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define("Task", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flowId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("http", "email", "notification"), // Define specific allowed values
      allowNull: false,
    },
    defaultInput: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Flow, {
      foreignKey: "flowId",
      as: "flow",
    });
  };

  return Task;
};
