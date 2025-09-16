import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Configure multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation schemas
const photoUploadSchema = Joi.object({
  reporterId: Joi.string().required(),
  reporterType: Joi.string().valid('citizen', 'champion', 'worker', 'admin').required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string()
  }).required(),
  description: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  tags: Joi.array().items(Joi.string())
});

const wasteMovementSchema = Joi.object({
  reporterId: Joi.string().required(),
  reporterType: Joi.string().valid('citizen', 'champion', 'worker').required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string()
  }).required(),
  wasteType: Joi.string().valid('mixed', 'organic', 'recyclable', 'hazardous', 'construction').required(),
  estimatedQuantity: Joi.string().valid('small', 'medium', 'large', 'very_large').required(),
  description: Joi.string().required(),
  urgency: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

const cleanlinessScoreSchema = Joi.object({
  assessorId: Joi.string().required(),
  areaId: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().required()
  }).required(),
  overallScore: Joi.number().min(0).max(100).required(),
  categories: Joi.object({
    wasteSegregation: Joi.number().min(0).max(100),
    streetCleanliness: Joi.number().min(0).max(100),
    drainageCleanliness: Joi.number().min(0).max(100),
    publicToilets: Joi.number().min(0).max(100),
    wasteCollection: Joi.number().min(0).max(100)
  }).required(),
  observations: Joi.string(),
  recommendations: Joi.string()
});

// @desc    Upload geo-tagged dumping site photos
// @route   POST /api/monitoring/photo-upload
// @access  Protected
router.post('/photo-upload', protect, upload.array('photos', 5), asyncHandler(async (req, res) => {
  const { error, value } = photoUploadSchema.validate(JSON.parse(req.body.data || '{}'));
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one photo is required'
    });
  }

  // In a real implementation, you would upload photos to Firebase Storage
  // For now, we'll simulate the upload process
  const photoUrls = req.files.map((file, index) => ({
    url: `https://storage.googleapis.com/waste-management/${Date.now()}_${index}.jpg`,
    filename: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString()
  }));

  const reportData = {
    ...value,
    photos: photoUrls,
    reportId: `PHOTO_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'reported',
    verificationStatus: 'pending',
    actionTaken: null,
    resolvedAt: null
  };

  const report = await FirestoreService.create('photo_reports', reportData);

  res.status(201).json({
    success: true,
    message: 'Photos uploaded and report created successfully',
    data: report
  });
}));

// @desc    Get reported dumping sites
// @route   GET /api/monitoring/dumping-sites
// @access  Protected
router.get('/dumping-sites', protect, asyncHandler(async (req, res) => {
  const { status, severity, area, limit = 50 } = req.query;
  const conditions = [];

  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }
  if (severity) {
    conditions.push({ field: 'severity', operator: '==', value: severity });
  }
  if (area) {
    conditions.push({ field: 'location.address', operator: '>=', value: area });
  }

  const dumpingSites = await FirestoreService.getAll('photo_reports', conditions, 'submittedAt', parseInt(limit));

  // Get additional statistics
  const totalReports = dumpingSites.length;
  const pendingReports = dumpingSites.filter(site => site.status === 'reported').length;
  const resolvedReports = dumpingSites.filter(site => site.status === 'resolved').length;

  res.json({
    success: true,
    data: {
      reports: dumpingSites,
      statistics: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        byStatus: dumpingSites.reduce((acc, site) => {
          acc[site.status] = (acc[site.status] || 0) + 1;
          return acc;
        }, {}),
        bySeverity: dumpingSites.reduce((acc, site) => {
          acc[site.severity] = (acc[site.severity] || 0) + 1;
          return acc;
        }, {})
      }
    }
  });
}));

// @desc    Mark cleanup completion
// @route   PUT /api/monitoring/dumping-sites/cleanup
// @access  Protected
router.put('/dumping-sites/cleanup', protect, asyncHandler(async (req, res) => {
  const { reportId, cleanupDetails, beforeAfterPhotos, cleanupBy } = req.body;

  if (!reportId) {
    return res.status(400).json({
      success: false,
      error: 'Report ID is required'
    });
  }

  const report = await FirestoreService.getById('photo_reports', reportId);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }

  const updateData = {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    cleanupDetails,
    beforeAfterPhotos: beforeAfterPhotos || [],
    cleanupBy,
    verificationStatus: 'verified'
  };

  const updatedReport = await FirestoreService.update('photo_reports', reportId, updateData);

  // Create cleanup record
  const cleanupRecord = {
    reportId,
    originalReport: report,
    cleanupDetails,
    cleanupBy,
    completedAt: new Date().toISOString(),
    beforeAfterPhotos: beforeAfterPhotos || []
  };

  await FirestoreService.create('cleanup_records', cleanupRecord);

  res.json({
    success: true,
    message: 'Cleanup marked as completed successfully',
    data: updatedReport
  });
}));

// @desc    Report waste movement ("If you see waste, send photo")
// @route   POST /api/monitoring/waste-movement/report
// @access  Protected
router.post('/waste-movement/report', protect, upload.array('photos', 3), asyncHandler(async (req, res) => {
  const { error, value } = wasteMovementSchema.validate(JSON.parse(req.body.data || '{}'));
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Process uploaded photos (if any)
  const photoUrls = req.files ? req.files.map((file, index) => ({
    url: `https://storage.googleapis.com/waste-management/movement/${Date.now()}_${index}.jpg`,
    filename: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString()
  })) : [];

  const movementReportData = {
    ...value,
    photos: photoUrls,
    reportId: `MOVE_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'reported',
    actionRequired: true,
    assignedTo: null,
    resolvedAt: null
  };

  const movementReport = await FirestoreService.create('waste_movement_reports', movementReportData);

  res.status(201).json({
    success: true,
    message: 'Waste movement reported successfully',
    data: movementReport
  });
}));

// @desc    Get community reported issues
// @route   GET /api/monitoring/community-reports
// @access  Protected
router.get('/community-reports', protect, asyncHandler(async (req, res) => {
  const { reporterType, status, urgency, limit = 50 } = req.query;
  const conditions = [];

  if (reporterType) {
    conditions.push({ field: 'reporterType', operator: '==', value: reporterType });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }
  if (urgency) {
    conditions.push({ field: 'urgency', operator: '==', value: urgency });
  }

  // Get both photo reports and waste movement reports
  const photoReports = await FirestoreService.getAll('photo_reports', conditions, 'submittedAt', parseInt(limit));
  const movementReports = await FirestoreService.getAll('waste_movement_reports', conditions, 'submittedAt', parseInt(limit));

  // Combine and sort by submission date
  const allReports = [
    ...photoReports.map(r => ({ ...r, type: 'photo_report' })),
    ...movementReports.map(r => ({ ...r, type: 'movement_report' }))
  ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.json({
    success: true,
    data: allReports.slice(0, parseInt(limit))
  });
}));

// @desc    Submit area cleanliness score
// @route   POST /api/monitoring/area-cleanliness/score
// @access  Protected
router.post('/area-cleanliness/score', protect, asyncHandler(async (req, res) => {
  const { error, value } = cleanlinessScoreSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const cleanlinessData = {
    ...value,
    assessmentId: `CLEAN_${Date.now()}`,
    assessmentDate: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    photos: [], // Could be added if photos are uploaded
    followUpRequired: value.overallScore < 70, // Follow-up required for scores below 70
    status: 'completed'
  };

  const assessment = await FirestoreService.create('cleanliness_assessments', cleanlinessData);

  // Update area's average cleanliness score
  const areaAssessments = await FirestoreService.getAll('cleanliness_assessments', [
    { field: 'areaId', operator: '==', value: value.areaId }
  ], 'timestamp', 10); // Get last 10 assessments

  const averageScore = areaAssessments.reduce((sum, a) => sum + a.overallScore, 0) / areaAssessments.length;

  // Check if area record exists, create or update
  const existingAreaRecords = await FirestoreService.getAll('area_performance', [
    { field: 'areaId', operator: '==', value: value.areaId }
  ]);

  if (existingAreaRecords.length > 0) {
    await FirestoreService.update('area_performance', existingAreaRecords[0].id, {
      currentCleanlinessScore: value.overallScore,
      averageCleanlinessScore: averageScore,
      lastAssessment: new Date().toISOString(),
      totalAssessments: areaAssessments.length
    });
  } else {
    await FirestoreService.create('area_performance', {
      areaId: value.areaId,
      currentCleanlinessScore: value.overallScore,
      averageCleanlinessScore: averageScore,
      lastAssessment: new Date().toISOString(),
      totalAssessments: 1
    });
  }

  res.status(201).json({
    success: true,
    message: 'Area cleanliness score submitted successfully',
    data: {
      assessment,
      areaAverageScore: Math.round(averageScore * 100) / 100
    }
  });
}));

// @desc    Get monitoring dashboard data
// @route   GET /api/monitoring/dashboard
// @access  Protected
router.get('/dashboard', protect, asyncHandler(async (req, res) => {
  const { areaId, dateFrom, dateTo } = req.query;

  // Get recent reports
  const conditions = areaId ? [{ field: 'location.area', operator: '==', value: areaId }] : [];
  
  const recentPhotoReports = await FirestoreService.getAll('photo_reports', conditions, 'submittedAt', 10);
  const recentMovementReports = await FirestoreService.getAll('waste_movement_reports', conditions, 'submittedAt', 10);
  const recentAssessments = await FirestoreService.getAll('cleanliness_assessments', 
    areaId ? [{ field: 'areaId', operator: '==', value: areaId }] : [], 'timestamp', 10);

  // Calculate statistics
  const totalReports = recentPhotoReports.length + recentMovementReports.length;
  const pendingReports = [...recentPhotoReports, ...recentMovementReports]
    .filter(r => r.status === 'reported').length;
  const resolvedReports = [...recentPhotoReports, ...recentMovementReports]
    .filter(r => r.status === 'resolved').length;

  const averageCleanlinessScore = recentAssessments.length > 0 
    ? recentAssessments.reduce((sum, a) => sum + a.overallScore, 0) / recentAssessments.length 
    : 0;

  // Trend analysis (simplified)
  const thisWeekReports = [...recentPhotoReports, ...recentMovementReports]
    .filter(r => new Date(r.submittedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  
  const lastWeekReports = [...recentPhotoReports, ...recentMovementReports]
    .filter(r => {
      const reportDate = new Date(r.submittedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      return reportDate >= twoWeeksAgo && reportDate < weekAgo;
    }).length;

  const dashboardData = {
    overview: {
      totalReports,
      pendingReports,
      resolvedReports,
      averageCleanlinessScore: Math.round(averageCleanlinessScore * 100) / 100,
      responseRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
    },
    trends: {
      reportsThisWeek: thisWeekReports,
      reportsLastWeek: lastWeekReports,
      trend: thisWeekReports > lastWeekReports ? 'increasing' : 'decreasing'
    },
    recentActivity: {
      photoReports: recentPhotoReports.slice(0, 5),
      movementReports: recentMovementReports.slice(0, 5),
      assessments: recentAssessments.slice(0, 5)
    },
    mapData: [
      ...recentPhotoReports.map(r => ({ ...r, type: 'photo_report' })),
      ...recentMovementReports.map(r => ({ ...r, type: 'movement_report' }))
    ].filter(r => r.location && r.location.lat && r.location.lng)
  };

  res.json({
    success: true,
    data: dashboardData
  });
}));

export default router;