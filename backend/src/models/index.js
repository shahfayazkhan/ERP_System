const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const SalesOrder = require('./SalesOrder');
const SalesOrderItem = require('./SalesOrderItem');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const InventoryTransaction = require('./InventoryTransaction');

// 1. Category <-> Product (One-to-Many)
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// 2. Customer <-> SalesOrder (One-to-Many)
Customer.hasMany(SalesOrder, { foreignKey: 'customerId', as: 'salesOrders', onDelete: 'SET NULL' });
SalesOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// 3. SalesOrder <-> SalesOrderItem (One-to-Many, cascade deletion of items)
SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'salesOrderId', as: 'items', onDelete: 'CASCADE' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });

// 4. Product <-> SalesOrderItem (One-to-Many)
Product.hasMany(SalesOrderItem, { foreignKey: 'productId', as: 'salesOrderItems', onDelete: 'RESTRICT' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// 5. Supplier <-> PurchaseOrder (One-to-Many)
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'purchaseOrders', onDelete: 'SET NULL' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// 6. PurchaseOrder <-> PurchaseOrderItem (One-to-Many, cascade deletion of items)
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'purchaseOrder' });

// 7. Product <-> PurchaseOrderItem (One-to-Many)
Product.hasMany(PurchaseOrderItem, { foreignKey: 'productId', as: 'purchaseOrderItems', onDelete: 'RESTRICT' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// 8. Product <-> InventoryTransaction (One-to-Many)
Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'inventoryTransactions', onDelete: 'CASCADE' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  User,
  Category,
  Product,
  Customer,
  Supplier,
  SalesOrder,
  SalesOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryTransaction,
};
