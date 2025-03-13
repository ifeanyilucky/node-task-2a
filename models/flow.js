"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Flow extends Model {
    static associate(models) {
      Flow.hasMany(models.Task, {
        foreignKey: "flowId",
        as: "tasks",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Flow.hasMany(models.FlowLog, {
        foreignKey: "flowId",
        as: "logs",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Flow.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookToken: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Flow",
      tableName: "flows",
    }
  );

  return Flow;
};
