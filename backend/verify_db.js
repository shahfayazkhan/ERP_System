const { ensureDatabaseExists, sequelize } = require('./src/config/db');
const { User, Product, Category, Customer, Supplier, SalesOrder, PurchaseOrder } = require('./src/models');

const verify = async () => {
  console.log('--- ERP Database Self-Check & Sync Verification ---');
  try {
    // 1. Check auto-create database connection
    console.log('Step 1: Attempting to verify or auto-create Postgres database...');
    await ensureDatabaseExists();

    // 2. Connect & sync schema
    console.log('Step 2: Connecting to database...');
    await sequelize.authenticate();
    console.log('✔ Database connection authenticated successfully.');

    // Sync schemas
    console.log('Step 3: Synchronizing models (Table creation)...');
    await sequelize.sync({ force: false });
    console.log('✔ All models synchronized with database schemas.');

    // 3. Count records to verify seeding
    console.log('Step 4: Checking database records counts...');
    const usersCount = await User.count();
    const productsCount = await Product.count();
    const categoriesCount = await Category.count();
    const customersCount = await Customer.count();
    const suppliersCount = await Supplier.count();
    const salesOrdersCount = await SalesOrder.count();
    const purchaseOrdersCount = await PurchaseOrder.count();

    console.log(`\nDatabase Statistics summary:`);
    console.log(`- Registered Users: ${usersCount}`);
    console.log(`- Categories: ${categoriesCount}`);
    console.log(`- Products/SKUs: ${productsCount}`);
    console.log(`- Customers: ${customersCount}`);
    console.log(`- Suppliers: ${suppliersCount}`);
    console.log(`- Sales Orders / Invoices: ${salesOrdersCount}`);
    console.log(`- Purchase Orders: ${purchaseOrdersCount}`);

    console.log('\n✔ Verification SUCCESS. Database is ready for operational transactions.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification FAILED:', error);
    process.exit(1);
  }
};

verify();
