import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const workerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  employeeId: Joi.string().required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  area: Joi.string().required(),
  role: Joi.string().valid('collector', 'driver', 'supervisor', 'cleaner').required(),
  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    city: Joi.string().required()
  }).required()
});

const trainingPhaseSchema = Joi.object({
  workerId: Joi.string().required(),
  phase: Joi.number().integer().min(1).max(3).required(),
  modules: Joi.array().items(Joi.string()).required()
});

const safetyGearRequestSchema = Joi.object({
  workerId: Joi.string().required(),
  items: Joi.array().items(
    Joi.string().valid('helmet', 'gloves', 'uniform', 'boots', 'mask')
  ).required()
});

// @desc    Register waste worker
// @route   POST /api/workers/register
// @access  Protected
router.post('/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = workerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if worker already exists
  const existingWorker = await FirestoreService.getAll('waste_workers', [
    { field: 'employeeId', operator: '==', value: value.employeeId }
  ]);

  if (existingWorker.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Worker with this Employee ID already exists'
    });
  }

  const workerData = {
    ...value,
    trainingPhases: {
      phase1: null,
      phase2: null,
      phase3: null
    },
    safetyGear: {
      helmet: false,
      gloves: false,
      uniform: false,
      boots: false,
      mask: false
    },
    attendance: [],
    performanceRating: 0,
    joiningDate: new Date().toISOString(),
    status: 'active'
  };

  const newWorker = await FirestoreService.create('waste_workers', workerData);

  res.status(201).json({
    success: true,
    message: 'Waste worker registered successfully',
    data: newWorker
  });
}));

// @desc    Update worker profile
// @route   PUT /api/workers/profile
// @access  Protected
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { workerId, ...updateData } = req.body;

  if (!workerId) {
    return res.status(400).json({
      success: false,
      error: 'Worker ID is required'
    });
  }

  const updatedWorker = await FirestoreService.update('waste_workers', workerId, updateData);

  res.json({
    success: true,
    message: 'Worker profile updated successfully',
    data: updatedWorker
  });
}));

// @desc    Get workers by area
// @route   GET /api/workers/list
// @access  Protected
router.get('/list', protect, asyncHandler(async (req, res) => {
  const { area, role, status } = req.query;
  const conditions = [];

  if (area) {
    conditions.push({ field: 'area', operator: '==', value: area });
  }
  if (role) {
    conditions.push({ field: 'role', operator: '==', value: role });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const workers = await FirestoreService.getAll('waste_workers', conditions);

  res.json({
    success: true,
    data: workers
  });
}));

// @desc    Get worker by ID
// @route   GET /api/workers/:workerId
// @access  Protected
router.get('/:workerId', protect, asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await FirestoreService.getById('waste_workers', workerId);

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Worker not found'
    });
  }

  res.json({
    success: true,
    data: worker
  });
}));

// @desc    Enroll in training phase
// @route   POST /api/workers/training/phase/:phase
// @access  Protected
router.post('/training/phase/:phase', protect, asyncHandler(async (req, res) => {
  const { phase } = req.params;
  const { error, value } = trainingPhaseSchema.validate({
    ...req.body,
    phase: parseInt(phase)
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { workerId, modules } = value;

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Worker not found'
    });
  }

  // Create training enrollment
  const trainingData = {
    workerId,
    phase: parseInt(phase),
    modules,
    enrolledAt: new Date().toISOString(),
    status: 'enrolled',
    completedAt: null
  };

  const training = await FirestoreService.create('worker_training', trainingData);

  res.status(201).json({
    success: true,
    message: `Enrolled in Phase ${phase} training successfully`,
    data: training
  });
}));

// @desc    Complete training phase
// @route   PUT /api/workers/training/complete
// @access  Protected
router.put('/training/complete', protect, asyncHandler(async (req, res) => {
  const { workerId, phase } = req.body;

  if (!workerId || !phase) {
    return res.status(400).json({
      success: false,
      error: 'Worker ID and phase are required'
    });
  }

  // Find training record
  const trainings = await FirestoreService.getAll('worker_training', [
    { field: 'workerId', operator: '==', value: workerId },
    { field: 'phase', operator: '==', value: parseInt(phase) }
  ]);

  if (trainings.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Training enrollment not found'
    });
  }

  const training = trainings[0];
  await FirestoreService.update('worker_training', training.id, {
    status: 'completed',
    completedAt: new Date().toISOString()
  });

  // Update worker's training phases
  const updateField = `trainingPhases.phase${phase}`;
  await FirestoreService.update('waste_workers', workerId, {
    [updateField]: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Phase ${phase} training completed successfully`
  });
}));

// @desc    Check safety gear status
// @route   GET /api/workers/safety-gear/status/:workerId
// @access  Protected
router.get('/safety-gear/status/:workerId', protect, asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Worker not found'
    });
  }

  res.json({
    success: true,
    data: {
      workerId,
      safetyGear: worker.safetyGear,
      lastUpdated: worker.updatedAt
    }
  });
}));

// @desc    Request safety equipment
// @route   POST /api/workers/safety-gear/request
// @access  Protected
router.post('/safety-gear/request', protect, asyncHandler(async (req, res) => {
  const { error, value } = safetyGearRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { workerId, items } = value;

  const worker = await FirestoreService.getById('waste_workers', workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Worker not found'
    });
  }

  const gearRequestData = {
    workerId,
    items,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    approvedAt: null,
    deliveredAt: null
  };

  const gearRequest = await FirestoreService.create('safety_gear_requests', gearRequestData);

  res.status(201).json({
    success: true,
    message: 'Safety gear request submitted successfully',
    data: gearRequest
  });
}));

// @desc    Get work schedule
// @route   GET /api/workers/schedule/:workerId
// @access  Protected
router.get('/schedule/:workerId', protect, asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  const { date } = req.query;

  const conditions = [{ field: 'workerId', operator: '==', value: workerId }];
  
  if (date) {
    conditions.push({ field: 'date', operator: '==', value: date });
  }

  const schedules = await FirestoreService.getAll('work_schedules', conditions);

  res.json({
    success: true,
    data: schedules
  });
}));

// @desc    Mark attendance
// @route   PUT /api/workers/attendance
// @access  Protected
router.put('/attendance', protect, asyncHandler(async (req, res) => {
  const { workerId, date, status, location, notes } = req.body;

  if (!workerId || !date || !status) {
    return res.status(400).json({
      success: false,
      error: 'Worker ID, date, and status are required'
    });
  }

  const attendanceData = {
    workerId,
    date,
    status, // present, absent, late, half_day
    location,
    notes,
    markedAt: new Date().toISOString()
  };

  const attendance = await FirestoreService.create('worker_attendance', attendanceData);

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendance
  });
}));

export default router;