import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const householdSchema = Joi.object({
  citizenId: Joi.string().required(),
  householdSize: Joi.number().integer().min(1).required(),
  wasteGenerationEstimate: Joi.number().min(0).required(), // kg per day
  segregationCapability: Joi.string().valid('excellent', 'good', 'average', 'poor').required(),
  composting: Joi.boolean().default(false),
  specialRequirements: Joi.array().items(Joi.string())
});

const bulkGeneratorSchema = Joi.object({
  organizationName: Joi.string().required(),
  organizationType: Joi.string().valid('restaurant', 'hotel', 'market', 'office', 'mall', 'factory').required(),
  contactPerson: Joi.string().required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  email: Joi.string().email().required(),
  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    city: Joi.string().required()
  }).required(),
  dailyWasteGeneration: Joi.number().min(0).required(), // kg per day
  wasteTypes: Joi.array().items(Joi.string().valid('organic', 'recyclable', 'hazardous', 'electronic')).required()
});

const violationSchema = Joi.object({
  reporterId: Joi.string().required(),
  reporterType: Joi.string().valid('citizen', 'champion', 'worker').required(),
  violationType: Joi.string().valid('improper_segregation', 'illegal_dumping', 'non_compliance', 'littering').required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string()
  }).required(),
  description: Joi.string().required(),
  photosEvidence: Joi.array().items(Joi.string()),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

// @desc    Register household for waste collection
// @route   POST /api/waste/household/register
// @access  Protected
router.post('/household/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = householdSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if household already registered
  const existingHousehold = await FirestoreService.getAll('households', [
    { field: 'citizenId', operator: '==', value: value.citizenId }
  ]);

  if (existingHousehold.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Household already registered for this citizen'
    });
  }

  const householdData = {
    ...value,
    registrationDate: new Date().toISOString(),
    collectionSchedule: {
      organic: 'daily',
      recyclable: 'weekly',
      hazardous: 'monthly'
    },
    segregationCompliance: {
      score: 0,
      lastAssessment: null,
      violations: []
    },
    status: 'active'
  };

  const household = await FirestoreService.create('households', householdData);

  res.status(201).json({
    success: true,
    message: 'Household registered for waste collection successfully',
    data: household
  });
}));

// @desc    Update segregation compliance status
// @route   PUT /api/waste/household/segregation-status
// @access  Protected
router.put('/household/segregation-status', protect, asyncHandler(async (req, res) => {
  const { householdId, complianceScore, assessmentNotes, assessedBy } = req.body;

  if (!householdId || complianceScore === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Household ID and compliance score are required'
    });
  }

  const updateData = {
    'segregationCompliance.score': complianceScore,
    'segregationCompliance.lastAssessment': new Date().toISOString(),
    'segregationCompliance.assessedBy': assessedBy,
    'segregationCompliance.notes': assessmentNotes
  };

  const updatedHousehold = await FirestoreService.update('households', householdId, updateData);

  res.json({
    success: true,
    message: 'Segregation compliance updated successfully',
    data: updatedHousehold
  });
}));

// @desc    Get collection schedule
// @route   GET /api/waste/household/collection-schedule/:householdId
// @access  Protected
router.get('/household/collection-schedule/:householdId', protect, asyncHandler(async (req, res) => {
  const { householdId } = req.params;

  const household = await FirestoreService.getById('households', householdId);
  if (!household) {
    return res.status(404).json({
      success: false,
      error: 'Household not found'
    });
  }

  // Get upcoming collection dates
  const today = new Date();
  const collectionDates = {
    organic: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    recyclable: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
    hazardous: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next month
  };

  res.json({
    success: true,
    data: {
      household: household,
      schedule: household.collectionSchedule,
      upcomingCollections: collectionDates
    }
  });
}));

// @desc    Register bulk waste generator
// @route   POST /api/waste/bulk-generator/register
// @access  Protected
router.post('/bulk-generator/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = bulkGeneratorSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if bulk generator already exists
  const existingGenerator = await FirestoreService.getAll('bulk_generators', [
    { field: 'email', operator: '==', value: value.email }
  ]);

  if (existingGenerator.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Bulk generator with this email already exists'
    });
  }

  const generatorData = {
    ...value,
    registrationDate: new Date().toISOString(),
    compliance: {
      segregationScore: 0,
      lastAudit: null,
      violations: [],
      certifications: []
    },
    incentives: {
      points: 0,
      rewards: []
    },
    status: 'active'
  };

  const generator = await FirestoreService.create('bulk_generators', generatorData);

  res.status(201).json({
    success: true,
    message: 'Bulk generator registered successfully',
    data: generator
  });
}));

// @desc    Update bulk generator compliance
// @route   PUT /api/waste/bulk-generator/compliance
// @access  Protected
router.put('/bulk-generator/compliance', protect, asyncHandler(async (req, res) => {
  const { generatorId, segregationScore, auditNotes, auditorId, violations } = req.body;

  if (!generatorId || segregationScore === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Generator ID and segregation score are required'
    });
  }

  const updateData = {
    'compliance.segregationScore': segregationScore,
    'compliance.lastAudit': new Date().toISOString(),
    'compliance.auditorId': auditorId,
    'compliance.notes': auditNotes
  };

  if (violations && violations.length > 0) {
    updateData['compliance.violations'] = violations;
  }

  const updatedGenerator = await FirestoreService.update('bulk_generators', generatorId, updateData);

  res.json({
    success: true,
    message: 'Bulk generator compliance updated successfully',
    data: updatedGenerator
  });
}));

// @desc    Get segregation guidelines
// @route   GET /api/waste/segregation/guidelines
// @access  Public
router.get('/segregation/guidelines', asyncHandler(async (req, res) => {
  const { wasteType } = req.query;

  const guidelines = {
    organic: {
      description: 'Biodegradable waste that can be composted',
      examples: ['Food scraps', 'Vegetable peels', 'Garden waste', 'Paper plates'],
      color: 'Green bin',
      doNots: ['Meat bones', 'Dairy products', 'Oil'],
      tips: ['Keep dry', 'Chop large items', 'Mix with dry leaves']
    },
    recyclable: {
      description: 'Materials that can be processed and reused',
      examples: ['Plastic bottles', 'Glass containers', 'Metal cans', 'Paper', 'Cardboard'],
      color: 'Blue bin',
      doNots: ['Dirty containers', 'Mixed materials', 'Broken glass'],
      tips: ['Clean containers', 'Remove labels', 'Separate by material']
    },
    hazardous: {
      description: 'Harmful waste requiring special disposal',
      examples: ['Batteries', 'Electronics', 'Chemicals', 'Medical waste', 'Paint'],
      color: 'Red bin',
      doNots: ['Mix with other waste', 'Dispose in regular bins'],
      tips: ['Use original containers', 'Label clearly', 'Store safely']
    }
  };

  const responseData = wasteType && guidelines[wasteType] 
    ? { [wasteType]: guidelines[wasteType] }
    : guidelines;

  res.json({
    success: true,
    data: responseData
  });
}));

// @desc    Report segregation violation
// @route   POST /api/waste/segregation/violation
// @access  Protected
router.post('/segregation/violation', protect, asyncHandler(async (req, res) => {
  const { error, value } = violationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const violationData = {
    ...value,
    violationId: `VIO_${Date.now()}`,
    reportedAt: new Date().toISOString(),
    status: 'reported',
    investigationStatus: 'pending',
    actionTaken: null,
    penaltyImposed: null,
    resolvedAt: null
  };

  const violation = await FirestoreService.create('waste_violations', violationData);

  res.status(201).json({
    success: true,
    message: 'Violation reported successfully',
    data: violation
  });
}));

// @desc    Get waste statistics
// @route   GET /api/waste/statistics
// @access  Protected
router.get('/statistics', protect, asyncHandler(async (req, res) => {
  const { area, dateFrom, dateTo } = req.query;

  const conditions = [];
  if (area) {
    conditions.push({ field: 'area', operator: '==', value: area });
  }

  // Get households data
  const households = await FirestoreService.getAll('households', conditions);
  
  // Get bulk generators data
  const bulkGenerators = await FirestoreService.getAll('bulk_generators', conditions);
  
  // Get violations data
  const violations = await FirestoreService.getAll('waste_violations', conditions);

  const statistics = {
    households: {
      total: households.length,
      active: households.filter(h => h.status === 'active').length,
      averageCompliance: households.reduce((sum, h) => sum + (h.segregationCompliance?.score || 0), 0) / households.length || 0
    },
    bulkGenerators: {
      total: bulkGenerators.length,
      byType: bulkGenerators.reduce((acc, bg) => {
        acc[bg.organizationType] = (acc[bg.organizationType] || 0) + 1;
        return acc;
      }, {}),
      totalWasteGeneration: bulkGenerators.reduce((sum, bg) => sum + bg.dailyWasteGeneration, 0)
    },
    violations: {
      total: violations.length,
      byType: violations.reduce((acc, v) => {
        acc[v.violationType] = (acc[v.violationType] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {}),
      resolved: violations.filter(v => v.status === 'resolved').length
    }
  };

  res.json({
    success: true,
    data: statistics
  });
}));

export default router;