const { SalesOrder, PurchaseOrder, Product, Category, Customer, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard summary statistics
// @route   GET /api/v1/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Total Sales (Paid or Shipped orders)
    const salesTotalRes = await SalesOrder.sum('totalAmount', {
      where: { status: { [Op.in]: ['Paid', 'Shipped'] } }
    });
    const totalSales = Number(salesTotalRes || 0);

    // 2. Total Purchase Expenses (Received orders)
    const purchaseTotalRes = await PurchaseOrder.sum('totalAmount', {
      where: { status: 'Received' }
    });
    const totalPurchases = Number(purchaseTotalRes || 0);

    // 3. Profit
    const netProfit = totalSales - totalPurchases;

    // 4. Product Statistics
    const totalProducts = await Product.count();
    
    // Low stock count
    const lowStockCount = await Product.count({
      where: {
        stockQuantity: {
          [Op.lte]: sequelize.col('lowStockThreshold')
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalSales,
        totalPurchases,
        netProfit,
        totalProducts,
        lowStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly sales vs purchase expense trends (last 6 months)
// @route   GET /api/v1/dashboard/trends
// @access  Private
const getDashboardTrends = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Fetch Sales Orders
    const sales = await SalesOrder.findAll({
      where: {
        status: { [Op.in]: ['Paid', 'Shipped'] },
        orderDate: { [Op.gte]: sixMonthsAgo }
      },
      attributes: ['totalAmount', 'orderDate'],
      raw: true
    });

    // Fetch Purchase Orders
    const purchases = await PurchaseOrder.findAll({
      where: {
        status: 'Received',
        orderDate: { [Op.gte]: sixMonthsAgo }
      },
      attributes: ['totalAmount', 'orderDate'],
      raw: true
    });

    // Create 6-month array template
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData.push({
        month: monthLabel,
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        sales: 0,
        purchases: 0
      });
    }

    // Aggregate Sales in JS
    sales.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const monthObj = monthlyData.find(m => m.key === key);
      if (monthObj) {
        monthObj.sales += Number(order.totalAmount || 0);
      }
    });

    // Aggregate Purchases in JS
    purchases.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const monthObj = monthlyData.find(m => m.key === key);
      if (monthObj) {
        monthObj.purchases += Number(order.totalAmount || 0);
      }
    });

    res.json({
      success: true,
      trends: monthlyData.map(({ month, sales, purchases }) => ({
        month,
        sales: Number(sales.toFixed(2)),
        purchases: Number(purchases.toFixed(2))
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent sales & purchase activities combined
// @route   GET /api/v1/dashboard/activities
// @access  Private
const getRecentActivities = async (req, res, next) => {
  try {
    const recentSales = await SalesOrder.findAll({
      limit: 5,
      order: [['orderDate', 'DESC']],
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }]
    });

    const recentPurchases = await PurchaseOrder.findAll({
      limit: 5,
      order: [['orderDate', 'DESC']],
      include: [{ model: Supplier, as: 'supplier', attributes: ['name'] }]
    });

    const activities = [];

    recentSales.forEach(order => {
      activities.push({
        id: order.id,
        type: 'SALE',
        reference: order.orderNumber,
        party: order.customer ? order.customer.name : 'Unknown Customer',
        date: order.orderDate,
        amount: Number(order.totalAmount),
        status: order.status
      });
    });

    recentPurchases.forEach(order => {
      activities.push({
        id: order.id,
        type: 'PURCHASE',
        reference: order.orderNumber,
        party: order.supplier ? order.supplier.name : 'Unknown Supplier',
        date: order.orderDate,
        amount: Number(order.totalAmount),
        status: order.status
      });
    });

    // Sort combined by date descending and take top 8
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const finalActivities = activities.slice(0, 8);

    res.json({ success: true, activities: finalActivities });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardTrends,
  getRecentActivities
};
