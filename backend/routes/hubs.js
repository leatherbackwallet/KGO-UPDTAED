/**
 * Hubs Routes - Hub management for logistics system
 * Handles CRUD operations for physical packing stations and fulfillment centers
 */

const express = require('express');
const router = express.Router();
const { Hub } = require('../models/hubs.model');
const auth = require('../middleware/auth.js');
const role = require('../middleware/role.js');

// Get all hubs (admin only)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const hubs = await Hub.find().sort({ name: 1 });
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    console.error('Error fetching hubs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch hubs', code: 'FETCH_ERROR' }
    });
  }
});

// Get active hubs (public)
router.get('/active', async (req, res) => {
  try {
    const hubs = await Hub.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    console.error('Error fetching active hubs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch active hubs', code: 'FETCH_ERROR' }
    });
  }
});

// Get single hub by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
    }
    
    res.json({
      success: true,
      data: hub
    });
  } catch (error) {
    console.error('Error fetching hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch hub', code: 'FETCH_ERROR' }
    });
  }
});

// Create new hub (admin only)
router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { name, address, operatingHours } = req.body;
    
    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and address are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Check if hub with same name already exists
    const existingHub = await Hub.findOne({ name });
    if (existingHub) {
      return res.status(400).json({
        success: false,
        error: { message: 'Hub with this name already exists', code: 'DUPLICATE_HUB' }
      });
    }
    
    const hub = await Hub.create({
      name,
      address,
      operatingHours
    });
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Hub created successfully',
        hub
      }
    });
  } catch (error) {
    console.error('Error creating hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create hub', code: 'CREATE_ERROR' }
    });
  }
});

// Update hub (admin only)
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const { name, address, operatingHours, isActive } = req.body;
    
    const hub = await Hub.findById(req.params.id);
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
    }
    
    // Check if name is being changed and if it conflicts with existing hub
    if (name && name !== hub.name) {
      const existingHub = await Hub.findOne({ name, _id: { $ne: req.params.id } });
      if (existingHub) {
        return res.status(400).json({
          success: false,
          error: { message: 'Hub with this name already exists', code: 'DUPLICATE_HUB' }
        });
      }
    }
    
    // Update fields
    if (name) hub.name = name;
    if (address) hub.address = address;
    if (operatingHours !== undefined) hub.operatingHours = operatingHours;
    if (isActive !== undefined) hub.isActive = isActive;
    
    await hub.save();
    
    res.json({
      success: true,
      data: {
        message: 'Hub updated successfully',
        hub
      }
    });
  } catch (error) {
    console.error('Error updating hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update hub', code: 'UPDATE_ERROR' }
    });
  }
});

// Delete hub (admin only)
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: { message: 'Hub not found', code: 'HUB_NOT_FOUND' }
      });
    }
    
    // Check if hub is being used in any delivery runs
    const DeliveryRun = require('../models/deliveryRuns.model.js');
    const activeRuns = await DeliveryRun.find({ 
      assignedHubId: req.params.id,
      status: { $nin: ['completed', 'cancelled'] }
    });
    
    if (activeRuns.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Cannot delete hub with active delivery runs', 
          code: 'HUB_IN_USE' 
        }
      });
    }
    
    await Hub.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      data: {
        message: 'Hub deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting hub:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete hub', code: 'DELETE_ERROR' }
    });
  }
});

// Get hubs by location (for delivery planning)
router.get('/nearby/:postalCode', auth, async (req, res) => {
  try {
    const { postalCode } = req.params;
    const { radius = 50 } = req.query; // Default 50km radius
    
    // For now, return all active hubs
    // In a real implementation, you would calculate distance based on coordinates
    const hubs = await Hub.find({ isActive: true }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: {
        postalCode,
        radius: parseInt(radius),
        hubs
      }
    });
  } catch (error) {
    console.error('Error fetching nearby hubs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch nearby hubs', code: 'FETCH_ERROR' }
    });
  }
});

module.exports = router; 