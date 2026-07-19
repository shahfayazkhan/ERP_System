const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDashboardTrends, getRecentActivities } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All dashboard views require a valid user session

router.get('/summary', getDashboardSummary);
router.get('/trends', getDashboardTrends);
router.get('/activities', getRecentActivities);

module.exports = router;
