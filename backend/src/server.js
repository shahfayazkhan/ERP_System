const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { ensureDatabaseExists, sequelize } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import models for seeding
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/v1/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: error.message
    });
  }
});

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Database Seeding Logic
const seedDatabase = async () => {
  const userCount = await models.User.count();
  if (userCount > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Database is empty. Executing auto-seeding logic...');

  // 1. Create Default Users (Admin, Manager, Employee)
  const admin = await models.User.create({
    username: 'admin',
    email: 'admin@erp.com',
    password: 'admin123', // Will be hashed automatically by beforeCreate hook
    role: 'admin',
    status: 'active'
  });

  const manager = await models.User.create({
    username: 'manager',
    email: 'manager@erp.com',
    password: 'manager123',
    role: 'manager',
    status: 'active'
  });

  const employee = await models.User.create({
    username: 'employee',
    email: 'employee@erp.com',
    password: 'employee123',
    role: 'employee',
    status: 'active'
  });

  console.log('✔ Users seeded (Admin: admin/admin123, Manager: manager/manager123, Employee: employee/employee123)');

  // 2. Create Categories
  const electronics = await models.Category.create({
    name: 'Electronics',
    description: 'Computers, accessories, gadgets, and components'
  });

  const furniture = await models.Category.create({
    name: 'Furniture',
    description: 'Desks, chairs, filing cabinets, and office layout items'
  });

  const officeSupplies = await models.Category.create({
    name: 'Office Supplies',
    description: 'Stationery, paper, pens, and daily consumables'
  });

  console.log('✔ Categories seeded');

  // 3. Create Products
  const macbook = await models.Product.create({
    sku: 'PROD-MACBOOK-01',
    name: 'MacBook Pro M3',
    description: 'Apple MacBook Pro 16-inch, 32GB RAM, 1TB SSD',
    price: 2499.99,
    cost: 1800.00,
    stockQuantity: 15,
    lowStockThreshold: 5,
    categoryId: electronics.id
  });

  const monitor = await models.Product.create({
    sku: 'PROD-DELLMON-02',
    name: 'Dell UltraSharp 27"',
    description: 'Dell UltraSharp 4K USB-C Hub Monitor',
    price: 499.99,
    cost: 320.00,
    stockQuantity: 25,
    lowStockThreshold: 8,
    categoryId: electronics.id
  });

  const deskChair = await models.Product.create({
    sku: 'PROD-OFFCHAIR-03',
    name: 'Ergonomic Mesh Chair',
    description: 'High-back ergonomic mesh office chair with lumbar support',
    price: 299.99,
    cost: 150.00,
    stockQuantity: 4, // Starts below low stock threshold to trigger warnings
    lowStockThreshold: 10,
    categoryId: furniture.id
  });

  const notebooks = await models.Product.create({
    sku: 'PROD-NOTEBOOK-04',
    name: 'A5 Dotted Notebook (10-pack)',
    description: 'Premium hardcover A5 dotted grid journals',
    price: 34.99,
    cost: 15.00,
    stockQuantity: 50,
    lowStockThreshold: 15,
    categoryId: officeSupplies.id
  });

  console.log('✔ Products seeded');

  // Add initial transaction logs for stock
  await models.InventoryTransaction.bulkCreate([
    { productId: macbook.id, type: 'IN', quantity: 15, notes: 'Initial inventory shipment' },
    { productId: monitor.id, type: 'IN', quantity: 25, notes: 'Initial inventory shipment' },
    { productId: deskChair.id, type: 'IN', quantity: 4, notes: 'Initial inventory shipment' },
    { productId: notebooks.id, type: 'IN', quantity: 50, notes: 'Initial inventory shipment' }
  ]);

  // 4. Create Customers
  const customer1 = await models.Customer.create({
    name: 'Acme Technologies Inc.',
    email: 'purchasing@acmetech.com',
    phone: '+1-555-0199',
    address: '123 Tech Blvd, Suite 400, San Francisco, CA'
  });

  const customer2 = await models.Customer.create({
    name: 'Sarah Connor',
    email: 'sconnor@cyberdyne.io',
    phone: '+1-555-0122',
    address: '742 Evergreen Terrace, Los Angeles, CA'
  });

  console.log('✔ Customers seeded');

  // 5. Create Suppliers
  const supplier1 = await models.Supplier.create({
    name: 'Global Tech Distribution',
    contactName: 'Robert Miles',
    email: 'sales@globaltech.com',
    phone: '+1-800-555-1022',
    address: '99 Warehouse Way, Seattle, WA'
  });

  const supplier2 = await models.Supplier.create({
    name: 'Elite Office Wholesalers',
    contactName: 'Clara Oswald',
    email: 'orders@eliteoffice.com',
    phone: '+1-800-555-8833',
    address: '45 Station Rd, Boston, MA'
  });

  console.log('✔ Suppliers seeded');

  console.log('🚀 Auto-seeding completed successfully!');
};

// Start Server Setup
const startServer = async () => {
  try {
    // 1. Ensure DB exists
    await ensureDatabaseExists();

    // 2. Connect & sync schema
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL database has been established successfully.');

    // sync models (creates tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Sequelize models synchronized.');

    // 3. Seed data
    await seedDatabase();

    // 4. Listen
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start ERP Backend Server:', error);
    process.exit(1);
  }
};

startServer();
