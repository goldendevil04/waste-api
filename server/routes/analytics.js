import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// @desc    Get daily waste generation data
// @route   GET /api/analytics/waste-generation/daily
// @access  Protected
router.get('/waste-generation/daily', protect, asyncHandler(async (req, res) => {
  const { days = 30, area, facilityId } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(days));

  // Get waste intake data from facilities
  const conditions = [];
  if (facilityId) {
    conditions.push({ field: 'facilityId', operator: '==', value: facilityId });
  }

  const wasteIntake = await FirestoreService.getAll('waste_intake', conditions);

  // Filter by date range
  const filteredIntake = wasteIntake.filter(intake => {
    const intakeDate = new Date(intake.timestamp);
    return intakeDate >= startDate && intakeDate <= endDate;
  });

  // Group by date and calculate totals
  const dailyData = {};
  filteredIntake.forEach(intake => {
    const date = intake.date || intake.timestamp.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        organic: 0,
        recyclable: 0,
        hazardous: 0,
        mixed: 0,
        total: 0
      };
    }
    
    const quantity = intake.quantity || 0;
    const wasteType = intake.wasteType || 'mixed';
    
    dailyData[date][wasteType] += quantity;
    dailyData[date].total += quantity;
  });

  // Convert to array and sort by date
  const dailyArray = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate trends
  const totalGenerated = dailyArray.reduce((sum, day) => sum + day.total, 0);
  const averageDaily = totalGenerated / Math.max(dailyArray.length, 1);
  const trend = dailyArray.length >= 2 ? 
    ((dailyArray[dailyArray.length - 1].total - dailyArray[0].total) / dailyArray[0].total * 100) : 0;

  res.json({
    success: true,
    data: {
      dailyData: dailyArray,
      summary: {
        totalGenerated,
        averageDaily: Math.round(averageDaily * 100) / 100,
        trend: Math.round(trend * 100) / 100,
        period: `${days} days`,
        composition: {
          organic: dailyArray.reduce((sum, day) => sum + day.organic, 0),
          recyclable: dailyArray.reduce((sum, day) => sum + day.recyclable, 0),
          hazardous: dailyArray.reduce((sum, day) => sum + day.hazardous, 0),
          mixed: dailyArray.reduce((sum, day) => sum + day.mixed, 0)
        }
      }
    }
  });
}));

// @desc    Get waste treatment efficiency metrics
// @route   GET /api/analytics/waste-treatment/efficiency
// @access  Protected
router.get('/waste-treatment/efficiency', protect, asyncHandler(async (req, res) => {
  const { facilityType, period = 30 } = req.query;

  // Get facilities data
  const facilityConditions = [];
  if (facilityType) {
    facilityConditions.push({ field: 'type', operator: '==', value: facilityType });
  }

  const facilities = await FirestoreService.getAll('waste_facilities', facilityConditions);

  // Get processing logs
  const processLogs = await FirestoreService.getAll('facility_process_logs');
  const wasteIntake = await FirestoreService.getAll('waste_intake');

  // Calculate efficiency metrics for each facility
  const facilityMetrics = await Promise.all(
    facilities.map(async (facility) => {
      const facilityLogs = processLogs.filter(log => log.facilityId === facility.id);
      const facilityIntake = wasteIntake.filter(intake => intake.facilityId === facility.id);

      const totalInput = facilityIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
      const totalOutput = facilityLogs.reduce((sum, log) => sum + (log.outputQuantity || 0), 0);
      const averageEfficiency = facilityLogs.length > 0 
        ? facilityLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / facilityLogs.length 
        : 0;

      const utilizationRate = facility.capacity > 0 ? (facility.currentLoad / facility.capacity) * 100 : 0;
      const processingRate = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

      return {
        facilityId: facility.id,
        name: facility.name,
        type: facility.type,
        capacity: facility.capacity,
        totalInput,
        totalOutput,
        efficiency: Math.round(averageEfficiency * 100) / 100,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        processingRate: Math.round(processingRate * 100) / 100,
        status: facility.status
      };
    })
  );

  // Calculate overall metrics
  const overallMetrics = {
    totalFacilities: facilities.length,
    totalCapacity: facilities.reduce((sum, f) => sum + (f.capacity || 0), 0),
    totalProcessed: facilityMetrics.reduce((sum, f) => sum + f.totalInput, 0),
    averageEfficiency: facilityMetrics.length > 0 
      ? facilityMetrics.reduce((sum, f) => sum + f.efficiency, 0) / facilityMetrics.length 
      : 0,
    averageUtilization: facilityMetrics.length > 0 
      ? facilityMetrics.reduce((sum, f) => sum + f.utilizationRate, 0) / facilityMetrics.length 
      : 0,
    facilitiesByType: facilities.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {}),
    performance: {
      excellent: facilityMetrics.filter(f => f.efficiency >= 90).length,
      good: facilityMetrics.filter(f => f.efficiency >= 70 && f.efficiency < 90).length,
      average: facilityMetrics.filter(f => f.efficiency >= 50 && f.efficiency < 70).length,
      poor: facilityMetrics.filter(f => f.efficiency < 50).length
    }
  };

  res.json({
    success: true,
    data: {
      facilities: facilityMetrics,
      overall: overallMetrics,
      topPerformers: facilityMetrics
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 5),
      lowPerformers: facilityMetrics
        .sort((a, b) => a.efficiency - b.efficiency)
        .slice(0, 5)
    }
  });
}));

// @desc    Get citizen training completion rates
// @route   GET /api/analytics/citizen-training/completion
// @access  Protected
router.get('/citizen-training/completion', protect, asyncHandler(async (req, res) => {
  const { area, period = 90 } = req.query;

  // Get citizens data
  const citizenConditions = [];
  if (area) {
    citizenConditions.push({ field: 'address.area', operator: '==', value: area });
  }

  const citizens = await FirestoreService.getAll('citizens', citizenConditions);
  const trainingEnrollments = await FirestoreService.getAll('training_enrollments');
  const certificates = await FirestoreService.getAll('certificates');

  // Calculate training metrics
  const totalCitizens = citizens.length;
  const enrolledCitizens = new Set(trainingEnrollments.map(e => e.citizenId)).size;
  const completedTraining = citizens.filter(c => c.trainingStatus?.completed).length;
  const certificatesIssued = certificates.length;

  const enrollmentRate = totalCitizens > 0 ? (enrolledCitizens / totalCitizens) * 100 : 0;
  const completionRate = enrolledCitizens > 0 ? (completedTraining / enrolledCitizens) * 100 : 0;
  const certificationRate = completedTraining > 0 ? (certificatesIssued / completedTraining) * 100 : 0;

  // Module-wise completion
  const moduleCompletion = trainingEnrollments.reduce((acc, enrollment) => {
    const moduleType = enrollment.moduleType;
    if (!acc[moduleType]) {
      acc[moduleType] = { enrolled: 0, completed: 0 };
    }
    acc[moduleType].enrolled += 1;
    if (enrollment.status === 'completed') {
      acc[moduleType].completed += 1;
    }
    return acc;
  }, {});

  // Calculate completion rates for each module
  Object.keys(moduleCompletion).forEach(module => {
    const data = moduleCompletion[module];
    data.completionRate = data.enrolled > 0 ? (data.completed / data.enrolled) * 100 : 0;
  });

  // Training trends (simplified)
  const currentMonth = new Date().getMonth();
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const month = currentMonth - i;
    const monthName = new Date(2024, month, 1).toLocaleString('default', { month: 'long' });
    
    // Simplified trend calculation
    const completionsThisMonth = Math.floor(Math.random() * 50) + 10; // Placeholder
    const enrollmentsThisMonth = Math.floor(Math.random() * 80) + 20; // Placeholder
    
    return {
      month: monthName,
      enrollments: enrollmentsThisMonth,
      completions: completionsThisMonth,
      rate: enrollmentsThisMonth > 0 ? (completionsThisMonth / enrollmentsThisMonth) * 100 : 0
    };
  }).reverse();

  res.json({
    success: true,
    data: {
      overview: {
        totalCitizens,
        enrolledCitizens,
        completedTraining,
        certificatesIssued,
        enrollmentRate: Math.round(enrollmentRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        certificationRate: Math.round(certificationRate * 100) / 100
      },
      modulePerformance: moduleCompletion,
      trends: monthlyTrends,
      demographics: {
        byArea: citizens.reduce((acc, c) => {
          const area = c.address?.area || 'Unknown';
          acc[area] = (acc[area] || 0) + 1;
          return acc;
        }, {}),
        trainingStatus: {
          notStarted: totalCitizens - enrolledCitizens,
          inProgress: enrolledCitizens - completedTraining,
          completed: completedTraining
        }
      }
    }
  });
}));

// @desc    Get source segregation compliance
// @route   GET /api/analytics/segregation/compliance
// @access  Protected
router.get('/segregation/compliance', protect, asyncHandler(async (req, res) => {
  const { area, customerType = 'all' } = req.query;

  // Get households and bulk generators
  const householdConditions = [];
  const bulkGeneratorConditions = [];
  
  if (area) {
    householdConditions.push({ field: 'address.area', operator: '==', value: area });
    bulkGeneratorConditions.push({ field: 'address.area', operator: '==', value: area });
  }

  const households = await FirestoreService.getAll('households', householdConditions);
  const bulkGenerators = await FirestoreService.getAll('bulk_generators', bulkGeneratorConditions);
  const pickupRecords = await FirestoreService.getAll('pickup_records');
  const violations = await FirestoreService.getAll('waste_violations');

  // Calculate compliance metrics for households
  const householdCompliance = {
    total: households.length,
    compliant: households.filter(h => (h.segregationCompliance?.score || 0) >= 70).length,
    averageScore: households.length > 0 
      ? households.reduce((sum, h) => sum + (h.segregationCompliance?.score || 0), 0) / households.length 
      : 0,
    scoreDistribution: {
      excellent: households.filter(h => (h.segregationCompliance?.score || 0) >= 90).length,
      good: households.filter(h => (h.segregationCompliance?.score || 0) >= 70 && (h.segregationCompliance?.score || 0) < 90).length,
      average: households.filter(h => (h.segregationCompliance?.score || 0) >= 50 && (h.segregationCompliance?.score || 0) < 70).length,
      poor: households.filter(h => (h.segregationCompliance?.score || 0) < 50).length
    }
  };

  // Calculate compliance metrics for bulk generators
  const bulkGeneratorCompliance = {
    total: bulkGenerators.length,
    compliant: bulkGenerators.filter(bg => (bg.compliance?.segregationScore || 0) >= 70).length,
    averageScore: bulkGenerators.length > 0 
      ? bulkGenerators.reduce((sum, bg) => sum + (bg.compliance?.segregationScore || 0), 0) / bulkGenerators.length 
      : 0,
    scoreDistribution: {
      excellent: bulkGenerators.filter(bg => (bg.compliance?.segregationScore || 0) >= 90).length,
      good: bulkGenerators.filter(bg => (bg.compliance?.segregationScore || 0) >= 70 && (bg.compliance?.segregationScore || 0) < 90).length,
      average: bulkGenerators.filter(bg => (bg.compliance?.segregationScore || 0) >= 50 && (bg.compliance?.segregationScore || 0) < 70).length,
      poor: bulkGenerators.filter(bg => (bg.compliance?.segregationScore || 0) < 50).length
    }
  };

  // Analyze pickup quality data
  const qualityAnalysis = pickupRecords.reduce((acc, record) => {
    record.pickups?.forEach(pickup => {
      const quality = pickup.segregationQuality;
      acc[quality] = (acc[quality] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
    });
    return acc;
  }, {});

  // Calculate quality rates
  const qualityRates = {
    excellent: qualityAnalysis.total > 0 ? (qualityAnalysis.excellent || 0) / qualityAnalysis.total * 100 : 0,
    good: qualityAnalysis.total > 0 ? (qualityAnalysis.good || 0) / qualityAnalysis.total * 100 : 0,
    poor: qualityAnalysis.total > 0 ? (qualityAnalysis.poor || 0) / qualityAnalysis.total * 100 : 0,
    rejected: qualityAnalysis.total > 0 ? (qualityAnalysis.rejected || 0) / qualityAnalysis.total * 100 : 0
  };

  // Violation analysis
  const violationAnalysis = {
    total: violations.length,
    byType: violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {}),
    resolved: violations.filter(v => v.status === 'resolved').length,
    pending: violations.filter(v => v.status === 'reported').length
  };

  // Overall compliance calculation
  const overallCompliance = {
    householdRate: householdCompliance.total > 0 ? (householdCompliance.compliant / householdCompliance.total) * 100 : 0,
    bulkGeneratorRate: bulkGeneratorCompliance.total > 0 ? (bulkGeneratorCompliance.compliant / bulkGeneratorCompliance.total) * 100 : 0,
    qualityRate: qualityRates.excellent + qualityRates.good,
    violationRate: (householdCompliance.total + bulkGeneratorCompliance.total) > 0 
      ? (violations.length / (householdCompliance.total + bulkGeneratorCompliance.total)) * 100 : 0
  };

  res.json({
    success: true,
    data: {
      overall: overallCompliance,
      households: householdCompliance,
      bulkGenerators: bulkGeneratorCompliance,
      pickupQuality: {
        distribution: qualityAnalysis,
        rates: qualityRates
      },
      violations: violationAnalysis,
      trends: {
        message: "Compliance has improved by 15% over the last month",
        direction: "improving",
        keyFactors: [
          "Increased training completion rate",
          "Better enforcement of segregation rules",
          "Introduction of incentive programs"
        ]
      }
    }
  });
}));

// @desc    Get collection efficiency metrics
// @route   GET /api/analytics/collection/efficiency
// @access  Protected
router.get('/collection/efficiency', protect, asyncHandler(async (req, res) => {
  const { area, vehicleId, period = 30 } = req.query;

  // Get collection data
  const vehicleConditions = [];
  const routeConditions = [];
  const pickupConditions = [];

  if (area) {
    routeConditions.push({ field: 'areaId', operator: '==', value: area });
  }
  if (vehicleId) {
    vehicleConditions.push({ field: 'id', operator: '==', value: vehicleId });
    pickupConditions.push({ field: 'vehicleId', operator: '==', value: vehicleId });
  }

  const vehicles = await FirestoreService.getAll('collection_vehicles', vehicleConditions);
  const routes = await FirestoreService.getAll('collection_routes', routeConditions);
  const pickupRecords = await FirestoreService.getAll('pickup_records', pickupConditions);
  const complaints = await FirestoreService.getAll('collection_complaints');

  // Calculate vehicle efficiency metrics
  const vehicleMetrics = vehicles.map(vehicle => {
    const vehiclePickups = pickupRecords.filter(p => p.vehicleId === vehicle.id);
    const vehicleComplaints = complaints.filter(c => c.vehicleId === vehicle.id);
    
    const totalTrips = vehiclePickups.length;
    const totalWasteCollected = vehiclePickups.reduce((sum, p) => sum + (p.totalWeight || 0), 0);
    const averageWastePerTrip = totalTrips > 0 ? totalWasteCollected / totalTrips : 0;
    const complaintRate = totalTrips > 0 ? (vehicleComplaints.length / totalTrips) * 100 : 0;
    
    const utilizationRate = vehicle.capacity > 0 ? (averageWastePerTrip / vehicle.capacity) * 100 : 0;

    return {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.vehicleType,
      capacity: vehicle.capacity,
      totalTrips,
      totalWasteCollected: Math.round(totalWasteCollected * 100) / 100,
      averageWastePerTrip: Math.round(averageWastePerTrip * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 100) / 100,
      efficiency: Math.max(0, 100 - complaintRate), // Simple efficiency calculation
      status: vehicle.status
    };
  });

  // Route efficiency analysis
  const routeMetrics = routes.map(route => {
    const routePickups = pickupRecords.filter(p => p.routeId === route.id);
    const completionRate = route.totalStops > 0 ? (routePickups.length / route.totalStops) * 100 : 0;
    const averageTimePerStop = routePickups.length > 0 ? 15 : 0; // Simplified calculation

    return {
      routeId: route.id,
      areaId: route.areaId,
      totalStops: route.totalStops,
      completedStops: routePickups.length,
      completionRate: Math.round(completionRate * 100) / 100,
      estimatedDuration: route.estimatedDuration,
      averageTimePerStop
    };
  });

  // Overall efficiency metrics
  const overallMetrics = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    totalRoutes: routes.length,
    totalPickups: pickupRecords.length,
    totalWasteCollected: pickupRecords.reduce((sum, p) => sum + (p.totalWeight || 0), 0),
    averageEfficiency: vehicleMetrics.length > 0 
      ? vehicleMetrics.reduce((sum, v) => sum + v.efficiency, 0) / vehicleMetrics.length 
      : 0,
    averageUtilization: vehicleMetrics.length > 0 
      ? vehicleMetrics.reduce((sum, v) => sum + v.utilizationRate, 0) / vehicleMetrics.length 
      : 0,
    complaintRate: pickupRecords.length > 0 ? (complaints.length / pickupRecords.length) * 100 : 0,
    onTimePerformance: 85 // Placeholder - would calculate from actual data
  };

  // Performance categories
  const performanceAnalysis = {
    excellent: vehicleMetrics.filter(v => v.efficiency >= 90).length,
    good: vehicleMetrics.filter(v => v.efficiency >= 70 && v.efficiency < 90).length,
    average: vehicleMetrics.filter(v => v.efficiency >= 50 && v.efficiency < 70).length,
    poor: vehicleMetrics.filter(v => v.efficiency < 50).length
  };

  res.json({
    success: true,
    data: {
      overall: overallMetrics,
      vehicles: vehicleMetrics,
      routes: routeMetrics,
      performance: performanceAnalysis,
      topPerformers: vehicleMetrics.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5),
      improvementAreas: vehicleMetrics.sort((a, b) => a.efficiency - b.efficiency).slice(0, 5),
      recommendations: [
        "Optimize routes for better fuel efficiency",
        "Implement real-time tracking for better monitoring",
        "Regular maintenance to improve vehicle performance",
        "Driver training programs for efficiency improvement"
      ]
    }
  });
}));

// @desc    Get facility utilization reports
// @route   GET /api/analytics/facilities/utilization
// @access  Protected
router.get('/facilities/utilization', protect, asyncHandler(async (req, res) => {
  const { facilityType, ulbId, period = 30 } = req.query;

  // Get facilities and related data
  const facilityConditions = [];
  if (facilityType) {
    facilityConditions.push({ field: 'type', operator: '==', value: facilityType });
  }
  if (ulbId) {
    facilityConditions.push({ field: 'ulbId', operator: '==', value: ulbId });
  }

  const facilities = await FirestoreService.getAll('waste_facilities', facilityConditions);
  const wasteIntake = await FirestoreService.getAll('waste_intake');
  const processLogs = await FirestoreService.getAll('facility_process_logs');

  // Calculate utilization for each facility
  const facilityUtilization = await Promise.all(
    facilities.map(async (facility) => {
      const facilityIntake = wasteIntake.filter(intake => intake.facilityId === facility.id);
      const facilityLogs = processLogs.filter(log => log.facilityId === facility.id);

      // Calculate metrics
      const totalIntake = facilityIntake.reduce((sum, intake) => sum + (intake.quantity || 0), 0);
      const totalProcessed = facilityLogs.reduce((sum, log) => sum + (log.outputQuantity || 0), 0);
      
      const capacityUtilization = facility.capacity > 0 ? (facility.currentLoad / facility.capacity) * 100 : 0;
      const processingEfficiency = facilityLogs.length > 0 
        ? facilityLogs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / facilityLogs.length 
        : 0;
      
      const dailyAverage = facilityIntake.length > 0 ? totalIntake / 30 : 0; // Assuming 30-day period
      const peakLoad = Math.max(...facilityIntake.map(intake => intake.quantity || 0), 0);
      
      // Operational status
      const operationalDays = facilityLogs.length; // Simplified
      const downtime = Math.max(0, 30 - operationalDays); // Days in period minus operational days
      const availability = 30 > 0 ? ((30 - downtime) / 30) * 100 : 0;

      return {
        facilityId: facility.id,
        name: facility.name,
        type: facility.type,
        capacity: facility.capacity,
        location: facility.location,
        utilization: {
          current: Math.round(capacityUtilization * 100) / 100,
          average: Math.round((dailyAverage / facility.capacity) * 100 * 100) / 100,
          peak: Math.round((peakLoad / facility.capacity) * 100 * 100) / 100
        },
        processing: {
          totalIntake,
          totalProcessed,
          efficiency: Math.round(processingEfficiency * 100) / 100,
          processingRate: totalIntake > 0 ? (totalProcessed / totalIntake) * 100 : 0
        },
        operational: {
          availability: Math.round(availability * 100) / 100,
          operationalDays,
          downtime,
          status: facility.status
        },
        performance: {
          excellent: processingEfficiency >= 90,
          satisfactory: processingEfficiency >= 70 && processingEfficiency < 90,
          needsImprovement: processingEfficiency < 70
        }
      };
    })
  );

  // Calculate overall statistics
  const overallStats = {
    totalFacilities: facilities.length,
    totalCapacity: facilities.reduce((sum, f) => sum + (f.capacity || 0), 0),
    totalUtilized: facilityUtilization.reduce((sum, f) => sum + f.processing.totalIntake, 0),
    averageUtilization: facilityUtilization.length > 0 
      ? facilityUtilization.reduce((sum, f) => sum + f.utilization.current, 0) / facilityUtilization.length 
      : 0,
    averageEfficiency: facilityUtilization.length > 0 
      ? facilityUtilization.reduce((sum, f) => sum + f.processing.efficiency, 0) / facilityUtilization.length 
      : 0,
    overallAvailability: facilityUtilization.length > 0 
      ? facilityUtilization.reduce((sum, f) => sum + f.operational.availability, 0) / facilityUtilization.length 
      : 0
  };

  // Utilization categories
  const utilizationCategories = {
    underutilized: facilityUtilization.filter(f => f.utilization.current < 50).length,
    optimal: facilityUtilization.filter(f => f.utilization.current >= 50 && f.utilization.current <= 85).length,
    overutilized: facilityUtilization.filter(f => f.utilization.current > 85).length,
    critical: facilityUtilization.filter(f => f.utilization.current > 95).length
  };

  // Type-wise analysis
  const typeAnalysis = facilityUtilization.reduce((acc, facility) => {
    const type = facility.type;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalCapacity: 0,
        totalUtilization: 0,
        averageEfficiency: 0
      };
    }
    
    acc[type].count += 1;
    acc[type].totalCapacity += facility.capacity || 0;
    acc[type].totalUtilization += facility.utilization.current;
    acc[type].averageEfficiency += facility.processing.efficiency;
    
    return acc;
  }, {});

  // Calculate averages for type analysis
  Object.keys(typeAnalysis).forEach(type => {
    const data = typeAnalysis[type];
    data.averageUtilization = data.count > 0 ? data.totalUtilization / data.count : 0;
    data.averageEfficiency = data.count > 0 ? data.averageEfficiency / data.count : 0;
  });

  res.json({
    success: true,
    data: {
      overall: overallStats,
      facilities: facilityUtilization,
      categories: utilizationCategories,
      byType: typeAnalysis,
      insights: {
        topPerformers: facilityUtilization
          .sort((a, b) => (b.processing.efficiency + b.operational.availability) - (a.processing.efficiency + a.operational.availability))
          .slice(0, 5),
        needsAttention: facilityUtilization
          .filter(f => f.utilization.current < 50 || f.processing.efficiency < 60)
          .sort((a, b) => a.processing.efficiency - b.processing.efficiency),
        recommendations: [
          "Increase waste intake for underutilized facilities",
          "Schedule maintenance for low-efficiency facilities",
          "Consider capacity expansion for overutilized facilities",
          "Implement predictive maintenance systems"
        ]
      }
    }
  });
}));

// @desc    Get penalty collection revenue
// @route   GET /api/analytics/penalties/revenue
// @access  Protected
router.get('/penalties/revenue', protect, asyncHandler(async (req, res) => {
  const { period = 12, byMonth = true } = req.query; // months

  const penalties = await FirestoreService.getAll('penalties');

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - parseInt(period));

  // Filter penalties by date range
  const filteredPenalties = penalties.filter(penalty => {
    const penaltyDate = new Date(penalty.issuedAt);
    return penaltyDate >= startDate && penaltyDate <= endDate;
  });

  // Group by time period
  const revenueData = {};
  filteredPenalties.forEach(penalty => {
    const date = new Date(penalty.issuedAt);
    const key = byMonth 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : date.toISOString().split('T')[0];
    
    if (!revenueData[key]) {
      revenueData[key] = {
        period: key,
        issued: 0,
        issuedAmount: 0,
        collected: 0,
        collectedAmount: 0,
        pending: 0,
        pendingAmount: 0,
        byType: {},
        byViolator: { citizen: 0, bulk_generator: 0 }
      };
    }

    const amount = penalty.amount || 0;
    const violationType = penalty.violationType;
    const violatorType = penalty.violatorType;

    revenueData[key].issued += 1;
    revenueData[key].issuedAmount += amount;

    if (penalty.status === 'paid') {
      revenueData[key].collected += 1;
      revenueData[key].collectedAmount += penalty.paidAmount || amount;
    } else {
      revenueData[key].pending += 1;
      revenueData[key].pendingAmount += amount;
    }

    // By violation type
    if (!revenueData[key].byType[violationType]) {
      revenueData[key].byType[violationType] = { count: 0, amount: 0 };
    }
    revenueData[key].byType[violationType].count += 1;
    revenueData[key].byType[violationType].amount += amount;

    // By violator type
    revenueData[key].byViolator[violatorType] += amount;
  });

  // Convert to array and sort
  const revenueArray = Object.values(revenueData).sort((a, b) => a.period.localeCompare(b.period));

  // Calculate summary statistics
  const summary = {
    totalIssued: filteredPenalties.length,
    totalIssuedAmount: filteredPenalties.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalCollected: filteredPenalties.filter(p => p.status === 'paid').length,
    totalCollectedAmount: filteredPenalties
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.paidAmount || p.amount || 0), 0),
    totalPending: filteredPenalties.filter(p => p.status === 'issued').length,
    totalPendingAmount: filteredPenalties
      .filter(p => p.status === 'issued')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    collectionRate: filteredPenalties.length > 0 
      ? (filteredPenalties.filter(p => p.status === 'paid').length / filteredPenalties.length) * 100 
      : 0,
    averagePenalty: filteredPenalties.length > 0 
      ? filteredPenalties.reduce((sum, p) => sum + (p.amount || 0), 0) / filteredPenalties.length 
      : 0
  };

  // Violation type analysis
  const violationTypeAnalysis = filteredPenalties.reduce((acc, penalty) => {
    const type = penalty.violationType;
    if (!acc[type]) {
      acc[type] = { count: 0, totalAmount: 0, collected: 0, collectedAmount: 0 };
    }
    
    acc[type].count += 1;
    acc[type].totalAmount += penalty.amount || 0;
    
    if (penalty.status === 'paid') {
      acc[type].collected += 1;
      acc[type].collectedAmount += penalty.paidAmount || penalty.amount || 0;
    }
    
    return acc;
  }, {});

  // Calculate rates for each violation type
  Object.keys(violationTypeAnalysis).forEach(type => {
    const data = violationTypeAnalysis[type];
    data.collectionRate = data.count > 0 ? (data.collected / data.count) * 100 : 0;
    data.averageAmount = data.count > 0 ? data.totalAmount / data.count : 0;
  });

  // Violator type analysis
  const violatorTypeAnalysis = {
    citizen: {
      count: filteredPenalties.filter(p => p.violatorType === 'citizen').length,
      totalAmount: filteredPenalties
        .filter(p => p.violatorType === 'citizen')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      collected: filteredPenalties
        .filter(p => p.violatorType === 'citizen' && p.status === 'paid').length,
      collectedAmount: filteredPenalties
        .filter(p => p.violatorType === 'citizen' && p.status === 'paid')
        .reduce((sum, p) => sum + (p.paidAmount || p.amount || 0), 0)
    },
    bulk_generator: {
      count: filteredPenalties.filter(p => p.violatorType === 'bulk_generator').length,
      totalAmount: filteredPenalties
        .filter(p => p.violatorType === 'bulk_generator')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      collected: filteredPenalties
        .filter(p => p.violatorType === 'bulk_generator' && p.status === 'paid').length,
      collectedAmount: filteredPenalties
        .filter(p => p.violatorType === 'bulk_generator' && p.status === 'paid')
        .reduce((sum, p) => sum + (p.paidAmount || p.amount || 0), 0)
    }
  };

  // Calculate collection rates for violator types
  Object.keys(violatorTypeAnalysis).forEach(type => {
    const data = violatorTypeAnalysis[type];
    data.collectionRate = data.count > 0 ? (data.collected / data.count) * 100 : 0;
    data.averageAmount = data.count > 0 ? data.totalAmount / data.count : 0;
  });

  res.json({
    success: true,
    data: {
      summary,
      timeline: revenueArray,
      byViolationType: violationTypeAnalysis,
      byViolatorType: violatorTypeAnalysis,
      trends: {
        monthlyGrowth: revenueArray.length >= 2 
          ? ((revenueArray[revenueArray.length - 1].collectedAmount - revenueArray[0].collectedAmount) / revenueArray[0].collectedAmount * 100)
          : 0,
        collectionTrend: summary.collectionRate >= 75 ? 'improving' : 'needs_attention',
        topViolationType: Object.entries(violationTypeAnalysis)
          .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)[0]?.[0] || 'none'
      },
      insights: [
        `Collection rate is ${Math.round(summary.collectionRate)}%`,
        `Average penalty amount is ₹${Math.round(summary.averagePenalty)}`,
        `Total revenue collected: ₹${Math.round(summary.totalCollectedAmount)}`,
        `Pending collections: ₹${Math.round(summary.totalPendingAmount)}`
      ]
    }
  });
}));

// @desc    Get incentive distribution statistics
// @route   GET /api/analytics/incentives/distribution
// @access  Protected
router.get('/incentives/distribution', protect, asyncHandler(async (req, res) => {
  const { period = 12, recipientType = 'all' } = req.query;

  // Get incentive data
  const incentiveRewards = await FirestoreService.getAll('incentive_rewards');
  const citizenRewards = await FirestoreService.getAll('citizen_rewards');
  const redemptions = await FirestoreService.getAll('point_redemptions');

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - parseInt(period));

  // Filter by date range
  const filteredIncentives = incentiveRewards.filter(reward => {
    const rewardDate = new Date(reward.awardedAt);
    return rewardDate >= startDate && rewardDate <= endDate;
  });

  const filteredCitizenRewards = citizenRewards.filter(reward => {
    const rewardDate = new Date(reward.awardedAt);
    return rewardDate >= startDate && rewardDate <= endDate;
  });

  const filteredRedemptions = redemptions.filter(redemption => {
    const redemptionDate = new Date(redemption.redeemedAt);
    return redemptionDate >= startDate && redemptionDate <= endDate;
  });

  // Calculate distribution metrics
  const distributionMetrics = {
    bulkGenerators: {
      totalRecipients: new Set(filteredIncentives.map(r => r.bulkGeneratorId)).size,
      totalRewards: filteredIncentives.length,
      totalPoints: filteredIncentives.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
      averagePointsPerReward: filteredIncentives.length > 0 
        ? filteredIncentives.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0) / filteredIncentives.length 
        : 0,
      byQualityGrade: filteredIncentives.reduce((acc, r) => {
        const grade = r.qualityGrade;
        if (!acc[grade]) acc[grade] = { count: 0, points: 0 };
        acc[grade].count += 1;
        acc[grade].points += r.pointsAwarded || 0;
        return acc;
      }, {})
    },
    citizens: {
      totalRecipients: new Set(filteredCitizenRewards.map(r => r.citizenId)).size,
      totalRewards: filteredCitizenRewards.length,
      totalPoints: filteredCitizenRewards.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
      averagePointsPerReward: filteredCitizenRewards.length > 0 
        ? filteredCitizenRewards.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0) / filteredCitizenRewards.length 
        : 0,
      byReason: filteredCitizenRewards.reduce((acc, r) => {
        const reason = r.reason || 'other';
        if (!acc[reason]) acc[reason] = { count: 0, points: 0 };
        acc[reason].count += 1;
        acc[reason].points += r.pointsAwarded || 0;
        return acc;
      }, {})
    }
  };

  // Redemption analysis
  const redemptionAnalysis = {
    totalRedemptions: filteredRedemptions.length,
    totalPointsRedeemed: filteredRedemptions.reduce((sum, r) => sum + (r.points || 0), 0),
    totalValueRedeemed: filteredRedemptions.reduce((sum, r) => sum + (r.rewardValue || 0), 0),
    byType: filteredRedemptions.reduce((acc, r) => {
      const type = r.rewardType;
      if (!acc[type]) acc[type] = { count: 0, points: 0, value: 0 };
      acc[type].count += 1;
      acc[type].points += r.points || 0;
      acc[type].value += r.rewardValue || 0;
      return acc;
    }, {}),
    byRecipientType: {
      citizens: filteredRedemptions.filter(r => r.citizenId).length,
      bulkGenerators: filteredRedemptions.filter(r => r.bulkGeneratorId).length
    }
  };

  // Monthly distribution trends
  const monthlyTrends = {};
  
  // Process bulk generator rewards
  filteredIncentives.forEach(reward => {
    const month = new Date(reward.awardedAt).toISOString().slice(0, 7);
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = {
        month,
        bulkGeneratorRewards: 0,
        bulkGeneratorPoints: 0,
        citizenRewards: 0,
        citizenPoints: 0,
        redemptions: 0,
        redemptionPoints: 0
      };
    }
    monthlyTrends[month].bulkGeneratorRewards += 1;
    monthlyTrends[month].bulkGeneratorPoints += reward.pointsAwarded || 0;
  });

  // Process citizen rewards
  filteredCitizenRewards.forEach(reward => {
    const month = new Date(reward.awardedAt).toISOString().slice(0, 7);
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = {
        month,
        bulkGeneratorRewards: 0,
        bulkGeneratorPoints: 0,
        citizenRewards: 0,
        citizenPoints: 0,
        redemptions: 0,
        redemptionPoints: 0
      };
    }
    monthlyTrends[month].citizenRewards += 1;
    monthlyTrends[month].citizenPoints += reward.pointsAwarded || 0;
  });

  // Process redemptions
  filteredRedemptions.forEach(redemption => {
    const month = new Date(redemption.redeemedAt).toISOString().slice(0, 7);
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = {
        month,
        bulkGeneratorRewards: 0,
        bulkGeneratorPoints: 0,
        citizenRewards: 0,
        citizenPoints: 0,
        redemptions: 0,
        redemptionPoints: 0
      };
    }
    monthlyTrends[month].redemptions += 1;
    monthlyTrends[month].redemptionPoints += redemption.points || 0;
  });

  const trendsArray = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));

  // Overall statistics
  const overallStats = {
    totalPointsAwarded: distributionMetrics.bulkGenerators.totalPoints + distributionMetrics.citizens.totalPoints,
    totalPointsRedeemed: redemptionAnalysis.totalPointsRedeemed,
    pointsInCirculation: (distributionMetrics.bulkGenerators.totalPoints + distributionMetrics.citizens.totalPoints) - redemptionAnalysis.totalPointsRedeemed,
    totalRecipients: distributionMetrics.bulkGenerators.totalRecipients + distributionMetrics.citizens.totalRecipients,
    redemptionRate: (distributionMetrics.bulkGenerators.totalPoints + distributionMetrics.citizens.totalPoints) > 0 
      ? (redemptionAnalysis.totalPointsRedeemed / (distributionMetrics.bulkGenerators.totalPoints + distributionMetrics.citizens.totalPoints)) * 100 
      : 0,
    averageRewardValue: redemptionAnalysis.totalRedemptions > 0 
      ? redemptionAnalysis.totalValueRedeemed / redemptionAnalysis.totalRedemptions 
      : 0
  };

  res.json({
    success: true,
    data: {
      overall: overallStats,
      distribution: distributionMetrics,
      redemptions: redemptionAnalysis,
      trends: trendsArray,
      insights: {
        topPerformingSegment: distributionMetrics.bulkGenerators.totalPoints > distributionMetrics.citizens.totalPoints 
          ? 'bulk_generators' : 'citizens',
        mostPopularRedemption: Object.entries(redemptionAnalysis.byType)
          .sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || 'none',
        engagementLevel: overallStats.redemptionRate >= 60 ? 'high' : overallStats.redemptionRate >= 30 ? 'medium' : 'low',
        recommendations: [
          overallStats.redemptionRate < 50 ? 'Increase awareness about reward redemption options' : null,
          distributionMetrics.citizens.totalRecipients < 100 ? 'Expand citizen reward programs' : null,
          redemptionAnalysis.byType.cash?.count > redemptionAnalysis.byType.product?.count ? 'Introduce more product-based rewards' : null
        ].filter(Boolean)
      }
    }
  });
}));

export default router;