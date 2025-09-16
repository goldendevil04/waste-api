import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const citizenSchema = Joi.object({
  name: Joi.string().min(2).required(),
  aadhaar: Joi.string().pattern(/^\d{12}$/).required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    city: Joi.string().required(),
    state: Joi.string().required()
  }).required(),
  email: Joi.string().email()
});

const trainingEnrollSchema = Joi.object({
  citizenId: Joi.string().required(),
  moduleId: Joi.string().required(),
  moduleType: Joi.string().valid('basic_segregation', 'composting', 'recycling', 'waste_reduction').required()
});

const kitRequestSchema = Joi.object({
  citizenId: Joi.string().required(),
  kitType: Joi.string().valid('dustbin', 'compost').required(),
  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required()
  }).required()
});

// @desc    Register new citizen
// @route   POST /api/citizens/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = citizenSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if citizen already exists
  const existingCitizen = await FirestoreService.getAll('citizens', [
    { field: 'aadhaar', operator: '==', value: value.aadhaar }
  ]);

  if (existingCitizen.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Citizen with this Aadhaar already exists'
    });
  }

  // Create citizen with initial data structure
  const citizenData = {
    ...value,
    trainingStatus: {
      completed: false,
      modules: [],
      certificate: null
    },
    kitsReceived: {
      dustbins: null,
      compostKit: null
    },
    segregationCompliance: {
      score: 0,
      violations: []
    },
    rewardPoints: 0,
    penaltyHistory: [],
    registrationDate: new Date().toISOString(),
    status: 'active'
  };

  const newCitizen = await FirestoreService.create('citizens', citizenData);

  res.status(201).json({
    success: true,
    message: 'Citizen registered successfully',
    data: newCitizen
  });
}));

// @desc    Update citizen profile
// @route   PUT /api/citizens/profile
// @access  Protected
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { citizenId, ...updateData } = req.body;

  if (!citizenId) {
    return res.status(400).json({
      success: false,
      error: 'Citizen ID is required'
    });
  }

  const updatedCitizen = await FirestoreService.update('citizens', citizenId, updateData);

  res.json({
    success: true,
    message: 'Citizen profile updated successfully',
    data: updatedCitizen
  });
}));

// @desc    Get citizen details
// @route   GET /api/citizens/:citizenId
// @access  Protected
router.get('/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  const citizen = await FirestoreService.getById('citizens', citizenId);

  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  res.json({
    success: true,
    data: citizen
  });
}));

// @desc    Get all citizens
// @route   GET /api/citizens
// @access  Protected
router.get('/', protect, asyncHandler(async (req, res) => {
  const { area, status, page = 1, limit = 10 } = req.query;
  const conditions = [];

  if (area) {
    conditions.push({ field: 'address.area', operator: '==', value: area });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const citizens = await FirestoreService.getAll('citizens', conditions);

  res.json({
    success: true,
    data: citizens,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: citizens.length
    }
  });
}));

// @desc    Enroll in training
// @route   POST /api/citizens/training/enroll
// @access  Protected
router.post('/training/enroll', protect, asyncHandler(async (req, res) => {
  const { error, value } = trainingEnrollSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { citizenId, moduleId, moduleType } = value;

  // Get citizen data
  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  // Create training enrollment record
  const enrollmentData = {
    citizenId,
    moduleId,
    moduleType,
    enrolledAt: new Date().toISOString(),
    status: 'enrolled',
    progress: 0,
    completedAt: null
  };

  const enrollment = await FirestoreService.create('training_enrollments', enrollmentData);

  // Update citizen's training modules
  const updatedModules = [...(citizen.trainingStatus.modules || []), moduleId];
  await FirestoreService.update('citizens', citizenId, {
    'trainingStatus.modules': updatedModules
  });

  res.status(201).json({
    success: true,
    message: 'Enrolled in training successfully',
    data: enrollment
  });
}));

// @desc    Complete training module
// @route   PUT /api/citizens/training/complete
// @access  Protected
router.put('/training/complete', protect, asyncHandler(async (req, res) => {
  const { citizenId, moduleId } = req.body;

  if (!citizenId || !moduleId) {
    return res.status(400).json({
      success: false,
      error: 'Citizen ID and Module ID are required'
    });
  }

  // Find and update training enrollment
  const enrollments = await FirestoreService.getAll('training_enrollments', [
    { field: 'citizenId', operator: '==', value: citizenId },
    { field: 'moduleId', operator: '==', value: moduleId }
  ]);

  if (enrollments.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Training enrollment not found'
    });
  }

  const enrollment = enrollments[0];
  await FirestoreService.update('training_enrollments', enrollment.id, {
    status: 'completed',
    progress: 100,
    completedAt: new Date().toISOString()
  });

  // Check if all required modules are completed
  const allEnrollments = await FirestoreService.getAll('training_enrollments', [
    { field: 'citizenId', operator: '==', value: citizenId }
  ]);

  const completedModules = allEnrollments.filter(e => e.status === 'completed');
  const isTrainingComplete = completedModules.length >= 4; // Assuming 4 required modules

  if (isTrainingComplete) {
    await FirestoreService.update('citizens', citizenId, {
      'trainingStatus.completed': true,
      'trainingStatus.certificate': `CERT_${citizenId}_${Date.now()}`
    });
  }

  res.json({
    success: true,
    message: 'Training module completed successfully',
    data: {
      moduleCompleted: true,
      trainingComplete: isTrainingComplete,
      totalCompleted: completedModules.length
    }
  });
}));

// @desc    Get training status
// @route   GET /api/citizens/training/status/:citizenId
// @access  Protected
router.get('/training/status/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  const enrollments = await FirestoreService.getAll('training_enrollments', [
    { field: 'citizenId', operator: '==', value: citizenId }
  ]);

  res.json({
    success: true,
    data: {
      trainingStatus: citizen.trainingStatus,
      enrollments
    }
  });
}));

// @desc    Generate training certificate
// @route   POST /api/citizens/training/certificate
// @access  Protected
router.post('/training/certificate', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.body;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  if (!citizen.trainingStatus.completed) {
    return res.status(400).json({
      success: false,
      error: 'Training not completed yet'
    });
  }

  const certificateData = {
    citizenId,
    citizenName: citizen.name,
    certificateNumber: `CERT_${citizenId}_${Date.now()}`,
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 year
    modules: citizen.trainingStatus.modules
  };

  const certificate = await FirestoreService.create('certificates', certificateData);

  res.json({
    success: true,
    message: 'Certificate generated successfully',
    data: certificate
  });
}));

// @desc    Check kit distribution eligibility
// @route   GET /api/citizens/dustbin-kit/eligibility/:citizenId
// @access  Protected
router.get('/dustbin-kit/eligibility/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  const isEligible = citizen.trainingStatus.completed && !citizen.kitsReceived.dustbins;

  res.json({
    success: true,
    data: {
      eligible: isEligible,
      reason: !citizen.trainingStatus.completed 
        ? 'Training not completed' 
        : citizen.kitsReceived.dustbins 
        ? 'Kit already received' 
        : 'Eligible for kit distribution'
    }
  });
}));

// @desc    Request dustbin kit
// @route   POST /api/citizens/dustbin-kit/request
// @access  Protected
router.post('/dustbin-kit/request', protect, asyncHandler(async (req, res) => {
  const { error, value } = kitRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { citizenId, address } = value;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  if (!citizen.trainingStatus.completed) {
    return res.status(400).json({
      success: false,
      error: 'Training must be completed before kit request'
    });
  }

  if (citizen.kitsReceived.dustbins) {
    return res.status(400).json({
      success: false,
      error: 'Dustbin kit already received'
    });
  }

  const kitRequestData = {
    citizenId,
    kitType: 'dustbin',
    requestedAt: new Date().toISOString(),
    deliveryAddress: address,
    status: 'pending',
    approvedAt: null,
    deliveredAt: null
  };

  const kitRequest = await FirestoreService.create('kit_requests', kitRequestData);

  res.status(201).json({
    success: true,
    message: 'Dustbin kit request submitted successfully',
    data: kitRequest
  });
}));

// @desc    Request compost kit
// @route   POST /api/citizens/compost-kit/request
// @access  Protected
router.post('/compost-kit/request', protect, asyncHandler(async (req, res) => {
  const { error, value } = kitRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { citizenId, address } = value;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  if (citizen.kitsReceived.compostKit) {
    return res.status(400).json({
      success: false,
      error: 'Compost kit already received'
    });
  }

  const kitRequestData = {
    citizenId,
    kitType: 'compost',
    requestedAt: new Date().toISOString(),
    deliveryAddress: address,
    status: 'pending',
    approvedAt: null,
    deliveredAt: null
  };

  const kitRequest = await FirestoreService.create('kit_requests', kitRequestData);

  res.status(201).json({
    success: true,
    message: 'Compost kit request submitted successfully',
    data: kitRequest
  });
}));

export default router;