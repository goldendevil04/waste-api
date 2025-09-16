import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const vehicleSchema = Joi.object({
  vehicleNumber: Joi.string().required(),
  vehicleType: Joi.string().valid('truck', 'compactor', 'tipper', 'auto').required(),
  capacity: Joi.number().min(0).required(), // in tons
  driverId: Joi.string().required(),
  areaAssigned: Joi.array().items(Joi.string()).required(),
  fuelType: Joi.string().valid('diesel', 'cng', 'electric').required()
});

const pickupCompleteSchema = Joi.object({
  vehicleId: Joi.string().required(),
  routeId: Joi.string().required(),
  pickups: Joi.array().items(
    Joi.object({
      householdId: Joi.string(),
      bulkGeneratorId: Joi.string(),
      wasteType: Joi.string().valid('organic', 'recyclable', 'hazardous').required(),
      weight: Joi.number().min(0).required(),
      segregationQuality: Joi.string().valid('excellent', 'good', 'poor', 'rejected').required(),
      notes: Joi.string()
    })
  ).required(),
  totalWeight: Joi.number().min(0).required(),
  completedAt: Joi.string().isoDate()
});

const complaintSchema = Joi.object({
  complainantType: Joi.string().valid('citizen', 'bulk_generator').required(),
  complainantId: Joi.string().required(),
  complaintType: Joi.string().valid('missed_pickup', 'irregular_schedule', 'poor_service', 'vehicle_issue').required(),
  description: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number(),
    lng: Joi.number(),
    address: Joi.string()
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

// @desc    Register waste collection vehicle
// @route   POST /api/collection/vehicles/register
// @access  Protected
router.post('/vehicles/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if vehicle already exists
  const existingVehicle = await FirestoreService.getAll('collection_vehicles', [
    { field: 'vehicleNumber', operator: '==', value: value.vehicleNumber }
  ]);

  if (existingVehicle.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle with this number already exists'
    });
  }

  const vehicleData = {
    ...value,
    registrationDate: new Date().toISOString(),
    status: 'active',
    currentLocation: null,
    lastMaintenance: null,
    fuelEfficiency: 0,
    totalTrips: 0,
    totalWasteCollected: 0
  };

  const vehicle = await FirestoreService.create('collection_vehicles', vehicleData);

  res.status(201).json({
    success: true,
    message: 'Collection vehicle registered successfully',
    data: vehicle
  });
}));

// @desc    Get real-time GPS tracking
// @route   GET /api/collection/vehicles/location/:vehicleId
// @access  Protected
router.get('/vehicles/location/:vehicleId', protect, asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const vehicle = await FirestoreService.getById('collection_vehicles', vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: 'Vehicle not found'
    });
  }

  // Get latest location updates
  const locationUpdates = await FirestoreService.getAll('vehicle_locations', [
    { field: 'vehicleId', operator: '==', value: vehicleId }
  ], 'timestamp', 10);

  res.json({
    success: true,
    data: {
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        status: vehicle.status
      },
      currentLocation: vehicle.currentLocation,
      locationHistory: locationUpdates
    }
  });
}));

// @desc    Update vehicle status
// @route   PUT /api/collection/vehicles/status
// @access  Protected
router.put('/vehicles/status', protect, asyncHandler(async (req, res) => {
  const { vehicleId, status, location, notes } = req.body;

  if (!vehicleId || !status) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle ID and status are required'
    });
  }

  const updateData = {
    status, // active, maintenance, out_of_service, on_route
    notes,
    lastUpdated: new Date().toISOString()
  };

  if (location) {
    updateData.currentLocation = location;
    
    // Also create a location history record
    await FirestoreService.create('vehicle_locations', {
      vehicleId,
      location,
      timestamp: new Date().toISOString(),
      status
    });
  }

  const updatedVehicle = await FirestoreService.update('collection_vehicles', vehicleId, updateData);

  res.json({
    success: true,
    message: 'Vehicle status updated successfully',
    data: updatedVehicle
  });
}));

// @desc    Generate optimized collection routes
// @route   GET /api/collection/routes/optimize
// @access  Protected
router.get('/routes/optimize', protect, asyncHandler(async (req, res) => {
  const { areaId, vehicleId, date } = req.query;

  if (!areaId) {
    return res.status(400).json({
      success: false,
      error: 'Area ID is required'
    });
  }

  // Get households in the area
  const households = await FirestoreService.getAll('households', [
    { field: 'address.area', operator: '==', value: areaId },
    { field: 'status', operator: '==', value: 'active' }
  ]);

  // Get bulk generators in the area
  const bulkGenerators = await FirestoreService.getAll('bulk_generators', [
    { field: 'address.area', operator: '==', value: areaId },
    { field: 'status', operator: '==', value: 'active' }
  ]);

  // Simple route optimization (in production, use actual optimization algorithms)
  const optimizedRoute = {
    routeId: `ROUTE_${Date.now()}`,
    areaId,
    vehicleId,
    date: date || new Date().toISOString().split('T')[0],
    households: households.map(h => ({
      id: h.id,
      address: h.address || 'Address not available',
      estimatedTime: '10 minutes',
      wasteTypes: ['organic', 'recyclable']
    })),
    bulkGenerators: bulkGenerators.map(bg => ({
      id: bg.id,
      organizationName: bg.organizationName,
      address: bg.address,
      estimatedTime: '20 minutes',
      wasteTypes: bg.wasteTypes
    })),
    estimatedDuration: '4 hours',
    totalStops: households.length + bulkGenerators.length,
    createdAt: new Date().toISOString()
  };

  // Save the optimized route
  const savedRoute = await FirestoreService.create('collection_routes', optimizedRoute);

  res.json({
    success: true,
    message: 'Route optimized successfully',
    data: savedRoute
  });
}));

// @desc    Mark pickup completion
// @route   POST /api/collection/pickup/complete
// @access  Protected
router.post('/pickup/complete', protect, asyncHandler(async (req, res) => {
  const { error, value } = pickupCompleteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const pickupData = {
    ...value,
    completedAt: value.completedAt || new Date().toISOString(),
    recordedBy: req.user.id
  };

  const pickup = await FirestoreService.create('pickup_records', pickupData);

  // Update vehicle statistics
  const vehicle = await FirestoreService.getById('collection_vehicles', value.vehicleId);
  if (vehicle) {
    await FirestoreService.update('collection_vehicles', value.vehicleId, {
      totalTrips: (vehicle.totalTrips || 0) + 1,
      totalWasteCollected: (vehicle.totalWasteCollected || 0) + value.totalWeight
    });
  }

  // Update household/bulk generator compliance scores based on segregation quality
  for (const pickup of value.pickups) {
    if (pickup.householdId) {
      const household = await FirestoreService.getById('households', pickup.householdId);
      if (household) {
        const qualityScore = pickup.segregationQuality === 'excellent' ? 10 : 
                           pickup.segregationQuality === 'good' ? 8 :
                           pickup.segregationQuality === 'poor' ? 4 : 0;
        
        const newScore = Math.min(100, (household.segregationCompliance?.score || 0) + qualityScore);
        await FirestoreService.update('households', pickup.householdId, {
          'segregationCompliance.score': newScore,
          'segregationCompliance.lastAssessment': new Date().toISOString()
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    message: 'Pickup completed successfully',
    data: pickup
  });
}));

// @desc    Reject non-segregated waste
// @route   PUT /api/collection/pickup/reject
// @access  Protected
router.put('/pickup/reject', protect, asyncHandler(async (req, res) => {
  const { householdId, bulkGeneratorId, reason, photosEvidence, rejectedBy } = req.body;

  if ((!householdId && !bulkGeneratorId) || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Household/Bulk Generator ID and reason are required'
    });
  }

  const rejectionData = {
    householdId,
    bulkGeneratorId,
    reason,
    photosEvidence: photosEvidence || [],
    rejectedBy,
    rejectedAt: new Date().toISOString(),
    followUpRequired: true,
    status: 'rejected'
  };

  const rejection = await FirestoreService.create('pickup_rejections', rejectionData);

  // Reduce compliance score for repeated violations
  if (householdId) {
    const household = await FirestoreService.getById('households', householdId);
    if (household) {
      const penaltyScore = 15; // Deduct 15 points for rejection
      const newScore = Math.max(0, (household.segregationCompliance?.score || 0) - penaltyScore);
      
      await FirestoreService.update('households', householdId, {
        'segregationCompliance.score': newScore,
        'segregationCompliance.violations': [
          ...(household.segregationCompliance?.violations || []),
          {
            type: 'pickup_rejection',
            reason,
            date: new Date().toISOString()
          }
        ]
      });
    }
  }

  res.json({
    success: true,
    message: 'Waste pickup rejected successfully',
    data: rejection
  });
}));

// @desc    Get collection schedule for area
// @route   GET /api/collection/schedule/:areaId
// @access  Protected
router.get('/schedule/:areaId', protect, asyncHandler(async (req, res) => {
  const { areaId } = req.params;
  const { date } = req.query;

  const conditions = [{ field: 'areaId', operator: '==', value: areaId }];
  if (date) {
    conditions.push({ field: 'date', operator: '==', value: date });
  }

  const routes = await FirestoreService.getAll('collection_routes', conditions);

  res.json({
    success: true,
    data: routes
  });
}));

// @desc    Log collection complaints
// @route   POST /api/collection/complaints
// @access  Protected
router.post('/complaints', protect, asyncHandler(async (req, res) => {
  const { error, value } = complaintSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const complaintData = {
    ...value,
    complaintId: `COMP_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'open',
    assignedTo: null,
    resolvedAt: null,
    resolution: null
  };

  const complaint = await FirestoreService.create('collection_complaints', complaintData);

  res.status(201).json({
    success: true,
    message: 'Complaint logged successfully',
    data: complaint
  });
}));

// @desc    Get collection statistics
// @route   GET /api/collection/statistics
// @access  Protected
router.get('/statistics', protect, asyncHandler(async (req, res) => {
  const { area, vehicleId, dateFrom, dateTo } = req.query;

  const conditions = [];
  if (area) {
    conditions.push({ field: 'areaId', operator: '==', value: area });
  }
  if (vehicleId) {
    conditions.push({ field: 'vehicleId', operator: '==', value: vehicleId });
  }

  // Get pickup records
  const pickupRecords = await FirestoreService.getAll('pickup_records', conditions);
  
  // Get complaints
  const complaints = await FirestoreService.getAll('collection_complaints', conditions);
  
  // Get vehicles
  const vehicles = await FirestoreService.getAll('collection_vehicles');

  const statistics = {
    totalPickups: pickupRecords.length,
    totalWasteCollected: pickupRecords.reduce((sum, record) => sum + (record.totalWeight || 0), 0),
    averagePickupsPerDay: pickupRecords.length / 30, // Assuming 30-day period
    segregationQuality: {
      excellent: pickupRecords.filter(p => 
        p.pickups?.some(pickup => pickup.segregationQuality === 'excellent')
      ).length,
      good: pickupRecords.filter(p => 
        p.pickups?.some(pickup => pickup.segregationQuality === 'good')
      ).length,
      poor: pickupRecords.filter(p => 
        p.pickups?.some(pickup => pickup.segregationQuality === 'poor')
      ).length
    },
    vehicles: {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'active').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length
    },
    complaints: {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      byType: complaints.reduce((acc, c) => {
        acc[c.complaintType] = (acc[c.complaintType] || 0) + 1;
        return acc;
      }, {})
    }
  };

  res.json({
    success: true,
    data: statistics
  });
}));

export default router;