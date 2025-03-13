"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FlowLog extends Model {
    static associate(models) {
      FlowLog.belongsTo(models.Flow, {
        foreignKey: {
          name: "flowId",
          allowNull: false,
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      FlowLog.belongsTo(models.Task, {
        foreignKey: {
          name: "taskId",
          allowNull: false,
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  FlowLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      flowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      input: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      output: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILURE"),
        allowNull: false,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "FlowLog",
      tableName: "flow_logs",
      timestamps: false,
    }
  );

  return FlowLog;
};
