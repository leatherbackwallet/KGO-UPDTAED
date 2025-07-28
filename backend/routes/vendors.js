const express = require('express');
const router = express.Router();
const { Vendor } = require('../models/vendors.model.ts');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /api/vendors - Get all active vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' }).select('storeName _id');
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
  }
});

// GET /api/vendors/all - Get all vendors (admin only)
router.get('/all', auth, role('admin'), async (req, res) => {
  try {
    const vendors = await Vendor.find().select('storeName _id status');
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching all vendors:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch vendors', code: 'FETCH_ERROR' } });
  }
});

module.exports = router; 