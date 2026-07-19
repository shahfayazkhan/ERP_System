const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SalesOrderItem = sequelize.define('SalesOrderItem', {
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
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  hooks: {
    beforeValidate: (item) => {
      if (item.quantity && item.unitPrice) {
        item.totalPrice = item.quantity * item.unitPrice;
      }
    },
  },
});

module.exports = SalesOrderItem;
