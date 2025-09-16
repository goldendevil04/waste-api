import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const facilitySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('biomethanization', 'wte', 'recycling', 'composting', 'landfill').required(),
  capacity: Joi.number().min(0).required(), // tons per day
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().required()
  }).required(),
  ulbId: Joi.string().required(),
  operatorName: Joi.string().required(),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email().required()
  }).required(),
  operatingHours: Joi.object({
    start: Joi.string().required(),
    end: Joi.string().required(),
    daysOfWeek: Joi.array().items(Joi.string()).required()
  }).required()
});

const wasteIntakeSchema = Joi.object({
  facilityId: Joi.string().required(),
  wasteType: Joi.string().valid('organic', 'recyclable', 'hazardous', 'mixed').required(),
  quantity: Joi.number().min(0).required(), // in tons
  sourceType: Joi.string().valid('household', 'bulk_generator', 'collection_vehicle').required(),
  sourceId: Joi.string(),
  vehicleId: Joi.string(),
  qualityGrade: Joi.string().valid('A', 'B', 'C', 'D').required(),
  notes: Joi.string()
});

const processLogSchema = Joi.object({
  facilityId: Joi.string().required(),
  processType: Joi.string().required(),
  inputQuantity: Joi.number().min(0).required(),
  outputQuantity: Joi.number().min(0),
  efficiency: Joi.number().min(0).max(100),
  parameters: Joi.object(),
  operatorId: Joi.string().required(),
  notes: Joi.string()
});

// @desc    Register waste treatment facility
// @route   POST /api/facilities/register
// @access  Protected
router.post('/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = facilitySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const facilityData = {
    ...value,
    registrationDate: new Date().toISOString(),
    status: 'active',
    currentLoad: 0,
    efficiency: 0,
    totalProcessed: 0,
    maintenanceSchedule: [],
    certifications: [],
    environmental: {
      emissions: 0,
      wasteGeneration: 0,
      energyConsumption: 0
    }
  };

  const facility = await FirestoreService.create('waste_facilities', facilityData);

  res.status(201).json({
    success: true,
    message: 'Waste treatment facility registered successfully',
    data: facility
  });
}));

// @desc    Get facility capacity
// @route   GET /api/facilities/capacity/:facilityId
// @access  Protected
router.get('/capacity/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    return res.status(404).json({
      success: false,
      error: 'Facility not found'
    });
  }

  // Get today's intake
  const today = new Date().toISOString().split('T')[0];
  const todayIntake = await FirestoreService.getAll('waste_intake', [
    { field: 'facilityId', operator: '==', value: facilityId },
    { field: 'date', operator: '==', value: today }
  ]);

  const todayQuantity = todayIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
  const utilizationPercentage = (todayQuantity / facility.capacity) * 100;

  res.json({
    success: true,
    data: {
      facilityId,
      name: facility.name,
      type: facility.type,
      totalCapacity: facility.capacity,
      currentLoad: facility.currentLoad || 0,
      todayIntake: todayQuantity,
      utilizationPercentage,
      availableCapacity: Math.max(0, facility.capacity - todayQuantity),
      status: facility.status
    }
  });
}));

// @desc    Log waste intake
// @route   PUT /api/facilities/intake
// @access  Protected
router.put('/intake', protect, asyncHandler(async (req, res) => {
  const { error, value } = wasteIntakeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check facility exists and has capacity
  const facility = await FirestoreService.getById('waste_facilities', value.facilityId);
  if (!facility) {
    return res.status(404).json({
      success: false,
      error: 'Facility not found'
    });
  }

  // Check if facility has enough capacity
  const today = new Date().toISOString().split('T')[0];
  const todayIntake = await FirestoreService.getAll('waste_intake', [
    { field: 'facilityId', operator: '==', value: value.facilityId },
    { field: 'date', operator: '==', value: today }
  ]);

  const todayQuantity = todayIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
  const remainingCapacity = facility.capacity - todayQuantity;

  if (value.quantity > remainingCapacity) {
    return res.status(400).json({
      success: false,
      error: `Insufficient capacity. Available: ${remainingCapacity} tons, Requested: ${value.quantity} tons`
    });
  }

  const intakeData = {
    ...value,
    date: today,
    timestamp: new Date().toISOString(),
    recordedBy: req.user.id
  };

  const intake = await FirestoreService.create('waste_intake', intakeData);

  // Update facility's current load and total processed
  await FirestoreService.update('waste_facilities', value.facilityId, {
    currentLoad: todayQuantity + value.quantity,
    totalProcessed: (facility.totalProcessed || 0) + value.quantity
  });

  res.json({
    success: true,
    message: 'Waste intake logged successfully',
    data: intake
  });
}));

// @desc    Get processing status
// @route   GET /api/facilities/processing-status/:facilityId
// @access  Protected
router.get('/processing-status/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const { date } = req.query;

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    return res.status(404).json({
      success: false,
      error: 'Facility not found'
    });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Get processing logs for the date
  const processLogs = await FirestoreService.getAll('facility_process_logs', [
    { field: 'facilityId', operator: '==', value: facilityId },
    { field: 'date', operator: '==', value: targetDate }
  ]);

  // Get waste intake for the date
  const wasteIntake = await FirestoreService.getAll('waste_intake', [
    { field: 'facilityId', operator: '==', value: facilityId },
    { field: 'date', operator: '==', value: targetDate }
  ]);

  const totalInput = wasteIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
  const totalOutput = processLogs.reduce((sum, log) => sum + (log.outputQuantity || 0), 0);
  const averageEfficiency = processLogs.length > 0 
    ? processLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / processLogs.length 
    : 0;

  res.json({
    success: true,
    data: {
      facilityId,
      facilityName: facility.name,
      facilityType: facility.type,
      date: targetDate,
      processing: {
        totalInput,
        totalOutput,
        efficiency: averageEfficiency,
        processLogs
      },
      status: facility.status,
      lastUpdated: new Date().toISOString()
    }
  });
}));

// @desc    Log biomethanization process
// @route   POST /api/facilities/biomethanization/log
// @access  Protected
router.post('/biomethanization/log', protect, asyncHandler(async (req, res) => {
  const processData = {
    ...req.body,
    processType: 'biomethanization',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };

  const { error, value } = processLogSchema.validate(processData);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Add biomethanization-specific parameters
  const bioProcessData = {
    ...value,
    parameters: {
      temperature: req.body.parameters?.temperature || 0,
      pH: req.body.parameters?.pH || 7,
      biogas: req.body.parameters?.biogas || 0, // cubic meters
      methaneContent: req.body.parameters?.methaneContent || 0, // percentage
      residualSlurry: req.body.parameters?.residualSlurry || 0 // tons
    }
  };

  const processLog = await FirestoreService.create('facility_process_logs', bioProcessData);

  res.status(201).json({
    success: true,
    message: 'Biomethanization process logged successfully',
    data: processLog
  });
}));

// @desc    Log Waste-to-Energy processing
// @route   POST /api/facilities/wte/log
// @access  Protected
router.post('/wte/log', protect, asyncHandler(async (req, res) => {
  const processData = {
    ...req.body,
    processType: 'waste_to_energy',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };

  const { error, value } = processLogSchema.validate(processData);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Add WTE-specific parameters
  const wteProcessData = {
    ...value,
    parameters: {
      temperature: req.body.parameters?.temperature || 0,
      energyGenerated: req.body.parameters?.energyGenerated || 0, // kWh
      emissions: req.body.parameters?.emissions || 0, // tons CO2
      ash: req.body.parameters?.ash || 0, // tons
      flyAsh: req.body.parameters?.flyAsh || 0 // tons
    }
  };

  const processLog = await FirestoreService.create('facility_process_logs', wteProcessData);

  res.status(201).json({
    success: true,
    message: 'Waste-to-Energy process logged successfully',
    data: processLog
  });
}));

// @desc    Log recycling activities
// @route   POST /api/facilities/recycling/log
// @access  Protected
router.post('/recycling/log', protect, asyncHandler(async (req, res) => {
  const processData = {
    ...req.body,
    processType: 'recycling',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };

  const { error, value } = processLogSchema.validate(processData);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Add recycling-specific parameters
  const recyclingProcessData = {
    ...value,
    parameters: {
      materials: req.body.parameters?.materials || {}, // {plastic: 10, paper: 15, metal: 5}
      qualityGrade: req.body.parameters?.qualityGrade || 'B',
      contamination: req.body.parameters?.contamination || 0, // percentage
      recovery: req.body.parameters?.recovery || 0 // percentage
    }
  };

  const processLog = await FirestoreService.create('facility_process_logs', recyclingProcessData);

  res.status(201).json({
    success: true,
    message: 'Recycling process logged successfully',
    data: processLog
  });
}));

// @desc    Get facility efficiency metrics
// @route   GET /api/facilities/efficiency/:facilityId
// @access  Protected
router.get('/efficiency/:facilityId', protect, asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const { period = '30' } = req.query; // days

  const facility = await FirestoreService.getById('waste_facilities', facilityId);
  if (!facility) {
    return res.status(404).json({
      success: false,
      error: 'Facility not found'
    });
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(period));

  // Get process logs for the period
  const processLogs = await FirestoreService.getAll('facility_process_logs', [
    { field: 'facilityId', operator: '==', value: facilityId }
  ]);

  // Get waste intake for the period
  const wasteIntake = await FirestoreService.getAll('waste_intake', [
    { field: 'facilityId', operator: '==', value: facilityId }
  ]);

  // Calculate metrics
  const totalInput = wasteIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
  const totalOutput = processLogs.reduce((sum, log) => sum + (log.outputQuantity || 0), 0);
  const averageEfficiency = processLogs.length > 0 
    ? processLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / processLogs.length 
    : 0;

  // Calculate capacity utilization
  const operatingDays = parseInt(period);
  const maxPossibleInput = facility.capacity * operatingDays;
  const capacityUtilization = maxPossibleInput > 0 ? (totalInput / maxPossibleInput) * 100 : 0;

  // Environmental impact (example calculations)
  const environmentalImpact = {
    carbonFootprint: totalInput * 0.5, // Example: 0.5 tons CO2 per ton waste
    energyGenerated: facility.type === 'wte' ? totalOutput * 500 : 0, // kWh
    biogasProduced: facility.type === 'biomethanization' ? totalOutput * 200 : 0 // cubic meters
  };

  res.json({
    success: true,
    data: {
      facilityId,
      facilityName: facility.name,
      period: `${period} days`,
      metrics: {
        totalWasteProcessed: totalInput,
        totalOutput,
        averageEfficiency: Math.round(averageEfficiency * 100) / 100,
        capacityUtilization: Math.round(capacityUtilization * 100) / 100,
        operationalDays: operatingDays,
        averageProcessingPerDay: totalInput / operatingDays
      },
      environmentalImpact,
      trends: {
        dailyAverage: totalInput / operatingDays,
        peakDay: Math.max(...wasteIntake.map(w => w.quantity)),
        consistency: 'Good' // This would be calculated based on variance
      }
    }
  });
}));

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Protected
router.get('/', protect, asyncHandler(async (req, res) => {
  const { ulbId, type, status } = req.query;
  const conditions = [];

  if (ulbId) {
    conditions.push({ field: 'ulbId', operator: '==', value: ulbId });
  }
  if (type) {
    conditions.push({ field: 'type', operator: '==', value: type });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const facilities = await FirestoreService.getAll('waste_facilities', conditions);

  res.json({
    success: true,
    data: facilities
  });
}));

export default router;