const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
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
    type: DataTypes.ENUM('Draft', 'Pending', 'Received', 'Cancelled'),
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
        // Generate PO-YYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        order.orderNumber = `PO-${dateStr}-${rand}`;
      }
    },
  },
});

module.exports = PurchaseOrder;
