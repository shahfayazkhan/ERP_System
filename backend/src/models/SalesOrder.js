const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SalesOrder = sequelize.define('SalesOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending', 'Paid', 'Shipped', 'Cancelled'),
    defaultValue: 'Pending',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  hooks: {
    beforeValidate: (order) => {
      if (!order.orderNumber) {
        // Generate SO-YYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        order.orderNumber = `SO-${dateStr}-${rand}`;
      }
    },
  },
});

module.exports = SalesOrder;
