const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  referenceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = InventoryTransaction;
