import express from 'express';
import Joi from 'joi';
import { protect, admin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const ulbSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('municipal_corporation', 'municipality', 'town_panchayat', 'cantonment_board').required(),
  state: Joi.string().required(),
  district: Joi.string().required(),
  population: Joi.number().integer().min(1).required(),
  area: Joi.number().min(0.1).required(), // in sq km
  contactInfo: Joi.object({
    address: Joi.string().required(),
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri()
  }).required(),
  adminDetails: Joi.object({
    name: Joi.string().required(),
    designation: Joi.string().required(),
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email().required()
  }).required()
});

const wasteManagementStatusSchema = Joi.object({
  ulbId: Joi.string().required(),
  wasteGeneration: Joi.object({
    daily: Joi.number().min(0).required(), // tons per day
    composition: Joi.object({
      organic: Joi.number().min(0).max(100),
      recyclable: Joi.number().min(0).max(100),
      hazardous: Joi.number().min(0).max(100),
      inert: Joi.number().min(0).max(100)
    })
  }),
  collectionEfficiency: Joi.number().min(0).max(100).required(), // percentage
  segregationAtSource: Joi.number().min(0).max(100).required(), // percentage
  treatmentCapacity: Joi.number().min(0).required(), // tons per day
  actualTreatment: Joi.number().min(0).required(), // tons per day
  disposalMethod: Joi.array().items(
    Joi.string().valid('landfill', 'composting', 'biomethanization', 'wte', 'recycling')
  ).required(),
  complianceScore: Joi.number().min(0).max(100).required()
});

const policySchema = Joi.object({
  ulbId: Joi.string().required(),
  policyType: Joi.string().valid('collection_schedule', 'segregation_rules', 'penalty_structure', 'incentive_scheme').required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  effectiveDate: Joi.string().isoDate().required(),
  applicableTo: Joi.array().items(
    Joi.string().valid('citizens', 'bulk_generators', 'collectors', 'all')
  ).required(),
  policyDocument: Joi.string(), // URL to document
  isActive: Joi.boolean().default(true)
});

// @desc    Register new ULB
// @route   POST /api/ulb/register
// @access  Admin only
router.post('/register', protect, admin, asyncHandler(async (req, res) => {
  const { error, value } = ulbSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if ULB already exists
  const existingUlb = await FirestoreService.getAll('ulbs', [
    { field: 'name', operator: '==', value: value.name },
    { field: 'district', operator: '==', value: value.district }
  ]);

  if (existingUlb.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'ULB with this name already exists in the district'
    });
  }

  const ulbData = {
    ...value,
    ulbCode: `ULB_${Date.now()}`,
    registrationDate: new Date().toISOString(),
    status: 'active',
    facilities: [],
    performance: {
      overallScore: 0,
      lastAssessment: null,
      improvements: []
    },
    statistics: {
      totalCitizens: 0,
      totalWorkers: 0,
      totalFacilities: 0,
      wasteProcessed: 0
    }
  };

  const ulb = await FirestoreService.create('ulbs', ulbData);

  res.status(201).json({
    success: true,
    message: 'ULB registered successfully',
    data: ulb
  });
}));

// @desc    Get all facilities in ULB
// @route   GET /api/ulb/:ulbId/facilities
// @access  Protected
router.get('/:ulbId/facilities', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { type, status } = req.query;

  // Verify ULB exists
  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    return res.status(404).json({
      success: false,
      error: 'ULB not found'
    });
  }

  const conditions = [{ field: 'ulbId', operator: '==', value: ulbId }];
  
  if (type) {
    conditions.push({ field: 'type', operator: '==', value: type });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const facilities = await FirestoreService.getAll('waste_facilities', conditions);

  // Get facility performance data
  const facilitiesWithPerformance = await Promise.all(
    facilities.map(async (facility) => {
      // Get recent processing data
      const processLogs = await FirestoreService.getAll('facility_process_logs', [
        { field: 'facilityId', operator: '==', value: facility.id }
      ], 'timestamp', 7); // Last 7 entries

      const wasteIntake = await FirestoreService.getAll('waste_intake', [
        { field: 'facilityId', operator: '==', value: facility.id }
      ], 'timestamp', 7);

      const totalInput = wasteIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
      const averageEfficiency = processLogs.length > 0 
        ? processLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / processLogs.length 
        : 0;

      return {
        ...facility,
        performance: {
          recentInput: totalInput,
          averageEfficiency: Math.round(averageEfficiency * 100) / 100,
          utilizationRate: facility.capacity > 0 ? (facility.currentLoad / facility.capacity) * 100 : 0
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      ulb: {
        id: ulb.id,
        name: ulb.name,
        type: ulb.type
      },
      facilities: facilitiesWithPerformance,
      summary: {
        total: facilities.length,
        byType: facilities.reduce((acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        }, {}),
        byStatus: facilities.reduce((acc, f) => {
          acc[f.status] = (acc[f.status] || 0) + 1;
          return acc;
        }, {}),
        totalCapacity: facilities.reduce((sum, f) => sum + (f.capacity || 0), 0),
        totalCurrentLoad: facilities.reduce((sum, f) => sum + (f.currentLoad || 0), 0)
      }
    }
  });
}));

// @desc    Update waste management status
// @route   PUT /api/ulb/waste-management/status
// @access  Protected
router.put('/waste-management/status', protect, asyncHandler(async (req, res) => {
  const { error, value } = wasteManagementStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { ulbId, ...statusData } = value;

  // Verify ULB exists
  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    return res.status(404).json({
      success: false,
      error: 'ULB not found'
    });
  }

  // Create waste management status record
  const wmStatusData = {
    ulbId,
    ...statusData,
    reportDate: new Date().toISOString(),
    reportedBy: req.user.id,
    period: new Date().toISOString().slice(0, 7) // YYYY-MM format
  };

  const wmStatus = await FirestoreService.create('waste_management_status', wmStatusData);

  // Update ULB's current performance score
  await FirestoreService.update('ulbs', ulbId, {
    'performance.overallScore': statusData.complianceScore,
    'performance.lastAssessment': new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Waste management status updated successfully',
    data: wmStatus
  });
}));

// @desc    Get ULB performance dashboard
// @route   GET /api/ulb/performance/dashboard/:ulbId
// @access  Protected
router.get('/performance/dashboard/:ulbId', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { period = '30' } = req.query; // days

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    return res.status(404).json({
      success: false,
      error: 'ULB not found'
    });
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(period));

  // Get waste management status reports
  const wmReports = await FirestoreService.getAll('waste_management_status', [
    { field: 'ulbId', operator: '==', value: ulbId }
  ], 'reportDate', 12); // Last 12 reports

  // Get facilities data
  const facilities = await FirestoreService.getAll('waste_facilities', [
    { field: 'ulbId', operator: '==', value: ulbId }
  ]);

  // Get citizen data for this ULB (assuming area-based mapping)
  const citizens = await FirestoreService.getAll('citizens');
  const workers = await FirestoreService.getAll('waste_workers');

  // Get recent violations and complaints
  const violations = await FirestoreService.getAll('waste_violations');
  const complaints = await FirestoreService.getAll('collection_complaints');

  // Calculate key metrics
  const latestReport = wmReports[0];
  const previousReport = wmReports[1];

  const kpiMetrics = {
    wasteGeneration: {
      current: latestReport?.wasteGeneration?.daily || 0,
      trend: previousReport ? 
        ((latestReport?.wasteGeneration?.daily || 0) - (previousReport?.wasteGeneration?.daily || 0)) : 0
    },
    collectionEfficiency: {
      current: latestReport?.collectionEfficiency || 0,
      trend: previousReport ? 
        ((latestReport?.collectionEfficiency || 0) - (previousReport?.collectionEfficiency || 0)) : 0
    },
    segregationRate: {
      current: latestReport?.segregationAtSource || 0,
      trend: previousReport ? 
        ((latestReport?.segregationAtSource || 0) - (previousReport?.segregationAtSource || 0)) : 0
    },
    treatmentRate: {
      current: latestReport?.actualTreatment || 0,
      capacity: latestReport?.treatmentCapacity || 0,
      utilization: latestReport?.treatmentCapacity > 0 ? 
        ((latestReport?.actualTreatment || 0) / latestReport.treatmentCapacity) * 100 : 0
    },
    complianceScore: {
      current: latestReport?.complianceScore || 0,
      trend: previousReport ? 
        ((latestReport?.complianceScore || 0) - (previousReport?.complianceScore || 0)) : 0
    }
  };

  // Facility performance
  const facilityPerformance = facilities.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    capacity: f.capacity,
    currentLoad: f.currentLoad,
    utilization: f.capacity > 0 ? (f.currentLoad / f.capacity) * 100 : 0,
    efficiency: f.efficiency || 0,
    status: f.status
  }));

  // Issue tracking
  const issueTracking = {
    violations: {
      total: violations.length,
      resolved: violations.filter(v => v.status === 'resolved').length,
      pending: violations.filter(v => v.status === 'reported').length
    },
    complaints: {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      pending: complaints.filter(c => c.status === 'open').length
    }
  };

  // Performance trends (historical data)
  const performanceTrends = wmReports.slice(0, 6).reverse().map(report => ({
    date: report.reportDate,
    collectionEfficiency: report.collectionEfficiency,
    segregationRate: report.segregationAtSource,
    complianceScore: report.complianceScore,
    wasteGeneration: report.wasteGeneration?.daily
  }));

  const dashboardData = {
    ulbInfo: {
      id: ulb.id,
      name: ulb.name,
      type: ulb.type,
      population: ulb.population,
      area: ulb.area
    },
    kpiMetrics,
    facilities: {
      total: facilities.length,
      performance: facilityPerformance,
      typeDistribution: facilities.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {})
    },
    resourceUtilization: {
      citizens: citizens.length,
      workers: workers.length,
      facilities: facilities.length,
      totalCapacity: facilities.reduce((sum, f) => sum + (f.capacity || 0), 0)
    },
    issueTracking,
    performanceTrends,
    lastUpdated: latestReport?.reportDate || 'No data available'
  };

  res.json({
    success: true,
    data: dashboardData
  });
}));

// @desc    Update waste management policies
// @route   POST /api/ulb/policy/update
// @access  Protected
router.post('/policy/update', protect, asyncHandler(async (req, res) => {
  const { error, value } = policySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const policyData = {
    ...value,
    policyId: `POL_${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: req.user.id,
    version: '1.0',
    approvalStatus: 'draft', // draft, approved, implemented
    implementationDate: null
  };

  const policy = await FirestoreService.create('ulb_policies', policyData);

  res.status(201).json({
    success: true,
    message: 'Policy created successfully',
    data: policy
  });
}));

// @desc    Generate compliance report
// @route   GET /api/ulb/compliance/report/:ulbId
// @access  Protected
router.get('/compliance/report/:ulbId', protect, asyncHandler(async (req, res) => {
  const { ulbId } = req.params;
  const { reportType = 'monthly', year, month } = req.query;

  const ulb = await FirestoreService.getById('ulbs', ulbId);
  if (!ulb) {
    return res.status(404).json({
      success: false,
      error: 'ULB not found'
    });
  }

  // Get compliance data based on report type
  let dateFilter;
  if (reportType === 'monthly' && year && month) {
    dateFilter = `${year}-${month.padStart(2, '0')}`;
  } else if (reportType === 'yearly' && year) {
    dateFilter = year;
  }

  // Get waste management reports
  const wmReports = await FirestoreService.getAll('waste_management_status', [
    { field: 'ulbId', operator: '==', value: ulbId }
  ]);

  const filteredReports = dateFilter ? 
    wmReports.filter(r => r.period?.startsWith(dateFilter)) : 
    wmReports.slice(0, 1); // Latest report only

  if (filteredReports.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No compliance data found for the specified period'
    });
  }

  const latestReport = filteredReports[0];

  // Calculate compliance metrics
  const complianceMetrics = {
    wasteCollection: {
      score: latestReport.collectionEfficiency || 0,
      benchmark: 100,
      status: (latestReport.collectionEfficiency || 0) >= 90 ? 'compliant' : 'non-compliant'
    },
    sourceSegregation: {
      score: latestReport.segregationAtSource || 0,
      benchmark: 80,
      status: (latestReport.segregationAtSource || 0) >= 80 ? 'compliant' : 'non-compliant'
    },
    wasteTreatment: {
      score: latestReport.treatmentCapacity > 0 ? 
        (latestReport.actualTreatment / latestReport.treatmentCapacity) * 100 : 0,
      benchmark: 100,
      status: latestReport.treatmentCapacity > 0 && 
        latestReport.actualTreatment >= latestReport.treatmentCapacity ? 'compliant' : 'non-compliant'
    },
    overallCompliance: {
      score: latestReport.complianceScore || 0,
      benchmark: 75,
      status: (latestReport.complianceScore || 0) >= 75 ? 'compliant' : 'non-compliant'
    }
  };

  // Get facilities compliance
  const facilities = await FirestoreService.getAll('waste_facilities', [
    { field: 'ulbId', operator: '==', value: ulbId }
  ]);

  const facilityCompliance = facilities.map(f => ({
    name: f.name,
    type: f.type,
    capacity: f.capacity,
    utilization: f.capacity > 0 ? (f.currentLoad / f.capacity) * 100 : 0,
    efficiency: f.efficiency || 0,
    compliance: f.efficiency >= 70 ? 'compliant' : 'non-compliant'
  }));

  // Generate recommendations
  const recommendations = [];
  if (complianceMetrics.wasteCollection.score < 90) {
    recommendations.push('Improve waste collection efficiency by optimizing routes and increasing vehicle capacity');
  }
  if (complianceMetrics.sourceSegregation.score < 80) {
    recommendations.push('Enhance citizen awareness programs for source segregation');
  }
  if (complianceMetrics.wasteTreatment.score < 100) {
    recommendations.push('Increase waste treatment capacity or improve facility utilization');
  }

  const complianceReport = {
    ulbInfo: {
      id: ulb.id,
      name: ulb.name,
      type: ulb.type,
      population: ulb.population
    },
    reportPeriod: {
      type: reportType,
      period: dateFilter || 'Latest',
      generatedAt: new Date().toISOString()
    },
    complianceMetrics,
    facilityCompliance,
    wasteComposition: latestReport.wasteGeneration?.composition || {},
    performanceTrends: filteredReports.slice(0, 6).map(r => ({
      period: r.period,
      complianceScore: r.complianceScore,
      collectionEfficiency: r.collectionEfficiency,
      segregationRate: r.segregationAtSource
    })),
    recommendations,
    nextAssessmentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    certificationStatus: complianceMetrics.overallCompliance.status === 'compliant' ? 'certified' : 'pending'
  };

  res.json({
    success: true,
    data: complianceReport
  });
}));

// @desc    Get all ULBs
// @route   GET /api/ulb
// @access  Protected
router.get('/', protect, asyncHandler(async (req, res) => {
  const { state, type, status } = req.query;
  const conditions = [];

  if (state) {
    conditions.push({ field: 'state', operator: '==', value: state });
  }
  if (type) {
    conditions.push({ field: 'type', operator: '==', value: type });
  }
  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }

  const ulbs = await FirestoreService.getAll('ulbs', conditions);

  // Get basic statistics for each ULB
  const ulbsWithStats = await Promise.all(
    ulbs.map(async (ulb) => {
      const facilities = await FirestoreService.getAll('waste_facilities', [
        { field: 'ulbId', operator: '==', value: ulb.id }
      ]);

      const latestWmReport = await FirestoreService.getAll('waste_management_status', [
        { field: 'ulbId', operator: '==', value: ulb.id }
      ], 'reportDate', 1);

      return {
        ...ulb,
        statistics: {
          ...ulb.statistics,
          totalFacilities: facilities.length,
          lastReportDate: latestWmReport[0]?.reportDate || null,
          currentScore: latestWmReport[0]?.complianceScore || 0
        }
      };
    })
  );

  res.json({
    success: true,
    data: ulbsWithStats
  });
}));

export default router;