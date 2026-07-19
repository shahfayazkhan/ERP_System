const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  hooks: {
    beforeValidate: (item) => {
      if (item.quantity && item.unitCost) {
        item.totalCost = item.quantity * item.unitCost;
      }
    },
  },
});

module.exports = PurchaseOrderItem;
