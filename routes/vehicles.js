const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/vehicles - Get all vehicles for the user's company
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ company: req.user.company })
      .populate('assignedDriver', 'firstName lastName email')
      .sort({ vehicleNumber: 1 });

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles'
    });
  }
});

// POST /api/vehicles - Create a new vehicle
router.post('/', async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      company: req.user.company
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('assignedDriver', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: populatedVehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number already exists in your fleet'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating vehicle'
    });
  }
});

// PUT /api/vehicles/:id - Update a vehicle
router.put('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle with new data
    Object.keys(req.body).forEach(key => {
      if (key !== 'company') { // Don't allow changing company
        if (typeof req.body[key] === 'object' && req.body[key] !== null && !Array.isArray(req.body[key])) {
          vehicle[key] = { ...vehicle[key], ...req.body[key] };
        } else {
          vehicle[key] = req.body[key];
        }
      }
    });

    await vehicle.save();

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('assignedDriver', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: populatedVehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number already exists in your fleet'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating vehicle'
    });
  }
});

// DELETE /api/vehicles/:id - Delete a vehicle
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
});

// GET /api/vehicles/:id - Get a single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('assignedDriver', 'firstName lastName email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle'
    });
  }
});

module.exports = router;