import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const championSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  email: Joi.string().email().required(),
  areaAssigned: Joi.string().required(),
  qualification: Joi.string().required(),
  experience: Joi.string(),
  address: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    city: Joi.string().required()
  }).required()
});

const monitoringReportSchema = Joi.object({
  championId: Joi.string().required(),
  areaId: Joi.string().required(),
  reportType: Joi.string().valid('compliance', 'violation', 'improvement', 'general').required(),
  description: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  photos: Joi.array().items(Joi.string())
});

// @desc    Register green champion
// @route   POST /api/green-champions/register
// @access  Protected
router.post('/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = championSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if champion already exists
  const existingChampion = await FirestoreService.getAll('green_champions', [
    { field: 'email', operator: '==', value: value.email }
  ]);

  if (existingChampion.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Green champion with this email already exists'
    });
  }

  const championData = {
    ...value,
    citizensUnderSupervision: [],
    trainingsConducted: [],
    violationsReported: [],
    performanceMetrics: {
      trainingsSessions: 0,
      citizensTrained: 0,
      violationsReported: 0,
      complianceImprovement: 0
    },
    joinedAt: new Date().toISOString(),
    status: 'active'
  };

  const newChampion = await FirestoreService.create('green_champions', championData);

  res.status(201).json({
    success: true,
    message: 'Green champion registered successfully',
    data: newChampion
  });
}));

// @desc    Get champions for specific area
// @route   GET /api/green-champions/area/:areaId
// @access  Protected
router.get('/area/:areaId', protect, asyncHandler(async (req, res) => {
  const { areaId } = req.params;

  const champions = await FirestoreService.getAll('green_champions', [
    { field: 'areaAssigned', operator: '==', value: areaId },
    { field: 'status', operator: '==', value: 'active' }
  ]);

  res.json({
    success: true,
    data: champions
  });
}));

// @desc    Get all green champions
// @route   GET /api/green-champions
// @access  Protected
router.get('/', protect, asyncHandler(async (req, res) => {
  const { area, status } = req.query;
  const conditions = [];

  if (area) {
    conditions.push({ field: 'areaAssigned', operator: '==', value: area });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const champions = await FirestoreService.getAll('green_champions', conditions);

  res.json({
    success: true,
    data: champions
  });
}));

// @desc    Submit monitoring report
// @route   POST /api/green-champions/monitoring/report
// @access  Protected
router.post('/monitoring/report', protect, asyncHandler(async (req, res) => {
  const { error, value } = monitoringReportSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const reportData = {
    ...value,
    reportId: `RPT_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    actionTaken: null,
    resolvedAt: null
  };

  const report = await FirestoreService.create('monitoring_reports', reportData);

  // Update champion's performance metrics
  const champion = await FirestoreService.getById('green_champions', value.championId);
  if (champion) {
    const updatedMetrics = {
      ...champion.performanceMetrics,
      violationsReported: (champion.performanceMetrics.violationsReported || 0) + 1
    };
    
    await FirestoreService.update('green_champions', value.championId, {
      performanceMetrics: updatedMetrics
    });
  }

  res.status(201).json({
    success: true,
    message: 'Monitoring report submitted successfully',
    data: report
  });
}));

// @desc    Get monitoring dashboard
// @route   GET /api/green-champions/monitoring/dashboard/:championId
// @access  Protected
router.get('/monitoring/dashboard/:championId', protect, asyncHandler(async (req, res) => {
  const { championId } = req.params;

  const champion = await FirestoreService.getById('green_champions', championId);
  if (!champion) {
    return res.status(404).json({
      success: false,
      error: 'Green champion not found'
    });
  }

  // Get recent reports
  const recentReports = await FirestoreService.getAll('monitoring_reports', [
    { field: 'championId', operator: '==', value: championId }
  ], 'submittedAt', 10);

  // Get area statistics
  const areaReports = await FirestoreService.getAll('monitoring_reports', [
    { field: 'areaId', operator: '==', value: champion.areaAssigned }
  ]);

  const dashboardData = {
    champion,
    recentReports,
    statistics: {
      totalReports: recentReports.length,
      pendingReports: recentReports.filter(r => r.status === 'pending').length,
      resolvedReports: recentReports.filter(r => r.status === 'resolved').length,
      areaPerformance: {
        totalAreaReports: areaReports.length,
        highSeverityReports: areaReports.filter(r => r.severity === 'high' || r.severity === 'critical').length
      }
    }
  };

  res.json({
    success: true,
    data: dashboardData
  });
}));

// @desc    Schedule citizen training
// @route   POST /api/green-champions/training/schedule
// @access  Protected
router.post('/training/schedule', protect, asyncHandler(async (req, res) => {
  const {
    championId,
    trainingTitle,
    description,
    scheduledDate,
    duration,
    maxParticipants,
    location,
    modules
  } = req.body;

  if (!championId || !trainingTitle || !scheduledDate) {
    return res.status(400).json({
      success: false,
      error: 'Champion ID, training title, and scheduled date are required'
    });
  }

  const trainingData = {
    championId,
    trainingTitle,
    description,
    scheduledDate,
    duration: duration || 120, // Default 2 hours
    maxParticipants: maxParticipants || 50,
    location,
    modules: modules || [],
    participants: [],
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  const training = await FirestoreService.create('scheduled_trainings', trainingData);

  res.status(201).json({
    success: true,
    message: 'Training scheduled successfully',
    data: training
  });
}));

// @desc    Report waste segregation violations
// @route   PUT /api/green-champions/violations/report
// @access  Protected
router.put('/violations/report', protect, asyncHandler(async (req, res) => {
  const {
    championId,
    citizenId,
    violationType,
    description,
    location,
    photosEvidence,
    severity
  } = req.body;

  if (!championId || !violationType || !description) {
    return res.status(400).json({
      success: false,
      error: 'Champion ID, violation type, and description are required'
    });
  }

  const violationData = {
    championId,
    citizenId,
    violationType, // improper_segregation, illegal_dumping, non_compliance
    description,
    location,
    photosEvidence: photosEvidence || [],
    severity: severity || 'medium',
    reportedAt: new Date().toISOString(),
    status: 'reported',
    penaltyImposed: null,
    resolvedAt: null
  };

  const violation = await FirestoreService.create('segregation_violations', violationData);

  res.json({
    success: true,
    message: 'Violation reported successfully',
    data: violation
  });
}));

// @desc    Get area performance metrics
// @route   GET /api/green-champions/performance/:championId
// @access  Protected
router.get('/performance/:championId', protect, asyncHandler(async (req, res) => {
  const { championId } = req.params;

  const champion = await FirestoreService.getById('green_champions', championId);
  if (!champion) {
    return res.status(404).json({
      success: false,
      error: 'Green champion not found'
    });
  }

  // Get training statistics
  const trainings = await FirestoreService.getAll('scheduled_trainings', [
    { field: 'championId', operator: '==', value: championId }
  ]);

  // Get violation reports
  const violations = await FirestoreService.getAll('segregation_violations', [
    { field: 'championId', operator: '==', value: championId }
  ]);

  // Get monitoring reports
  const monitoringReports = await FirestoreService.getAll('monitoring_reports', [
    { field: 'championId', operator: '==', value: championId }
  ]);

  const performanceData = {
    championInfo: champion,
    metrics: {
      trainingsScheduled: trainings.length,
      trainingsCompleted: trainings.filter(t => t.status === 'completed').length,
      totalParticipants: trainings.reduce((sum, t) => sum + (t.participants?.length || 0), 0),
      violationsReported: violations.length,
      monitoringReports: monitoringReports.length,
      averageResponseTime: '2.5 hours', // Calculate from actual data
      areaComplianceScore: 85 // Calculate from actual compliance data
    },
    recentActivity: [
      ...trainings.slice(0, 5).map(t => ({ type: 'training', data: t })),
      ...violations.slice(0, 5).map(v => ({ type: 'violation', data: v })),
      ...monitoringReports.slice(0, 5).map(r => ({ type: 'report', data: r }))
    ].sort((a, b) => new Date(b.data.createdAt || b.data.reportedAt || b.data.submittedAt) - 
                     new Date(a.data.createdAt || a.data.reportedAt || a.data.submittedAt))
  };

  res.json({
    success: true,
    data: performanceData
  });
}));

export default router;