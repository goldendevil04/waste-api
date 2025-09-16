import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const cleaningEventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  organizerId: Joi.string().required(),
  organizerType: Joi.string().valid('champion', 'admin', 'ulb', 'citizen').required(),
  scheduledDate: Joi.string().isoDate().required(),
  duration: Joi.number().min(30).max(480).required(), // minutes
  location: Joi.object({
    area: Joi.string().required(),
    specificLocation: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number(),
      lng: Joi.number()
    })
  }).required(),
  maxParticipants: Joi.number().min(5).max(1000).default(50),
  requiredSupplies: Joi.array().items(Joi.string()),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/),
    email: Joi.string().email()
  })
});

const participationSchema = Joi.object({
  eventId: Joi.string().required(),
  participantId: Joi.string().required(),
  participantType: Joi.string().valid('citizen', 'government_employee', 'volunteer').required(),
  contactInfo: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email()
  }).required()
});

const attendanceSchema = Joi.object({
  eventId: Joi.string().required(),
  participantId: Joi.string().required(),
  attendanceStatus: Joi.string().valid('present', 'absent', 'late').required(),
  arrivalTime: Joi.string().isoDate(),
  departureTime: Joi.string().isoDate(),
  contributionDetails: Joi.string(),
  hoursContributed: Joi.number().min(0)
});

const campaignSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  campaignType: Joi.string().valid('awareness', 'education', 'behavior_change', 'recruitment').required(),
  organizerId: Joi.string().required(),
  targetAudience: Joi.string().valid('citizens', 'schools', 'businesses', 'government', 'all').required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  budget: Joi.number().min(0),
  expectedReach: Joi.number().min(1),
  materials: Joi.array().items(Joi.string()),
  channels: Joi.array().items(Joi.string().valid('social_media', 'print', 'radio', 'tv', 'door_to_door', 'events'))
});

// @desc    Schedule community cleaning day
// @route   POST /api/community/cleaning-day/schedule
// @access  Protected
router.post('/cleaning-day/schedule', protect, asyncHandler(async (req, res) => {
  const { error, value } = cleaningEventSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Check if event date is in the future
  const eventDate = new Date(value.scheduledDate);
  const now = new Date();
  if (eventDate <= now) {
    return res.status(400).json({
      success: false,
      error: 'Event must be scheduled for a future date'
    });
  }

  const eventData = {
    ...value,
    eventId: `CE_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'scheduled',
    registrations: 0,
    participants: [],
    actualParticipants: 0,
    completionStatus: 'pending',
    feedback: [],
    photos: [],
    impact: {
      wasteCollected: 0,
      areasCleaned: 0,
      hoursContributed: 0
    }
  };

  const cleaningEvent = await FirestoreService.create('cleaning_events', eventData);

  res.status(201).json({
    success: true,
    message: 'Community cleaning event scheduled successfully',
    data: cleaningEvent
  });
}));

// @desc    Get participants list for cleaning event
// @route   GET /api/community/cleaning-day/participants/:eventId
// @access  Protected
router.get('/cleaning-day/participants/:eventId', protect, asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Cleaning event not found'
    });
  }

  // Get participant registrations
  const registrations = await FirestoreService.getAll('event_registrations', [
    { field: 'eventId', operator: '==', value: eventId }
  ]);

  // Get attendance records if event has occurred
  const attendance = await FirestoreService.getAll('event_attendance', [
    { field: 'eventId', operator: '==', value: eventId }
  ]);

  res.json({
    success: true,
    data: {
      event: {
        id: event.id,
        title: event.title,
        scheduledDate: event.scheduledDate,
        status: event.status,
        maxParticipants: event.maxParticipants
      },
      registrations: {
        total: registrations.length,
        byType: registrations.reduce((acc, r) => {
          acc[r.participantType] = (acc[r.participantType] || 0) + 1;
          return acc;
        }, {}),
        participants: registrations
      },
      attendance: {
        total: attendance.length,
        present: attendance.filter(a => a.attendanceStatus === 'present').length,
        absent: attendance.filter(a => a.attendanceStatus === 'absent').length,
        records: attendance
      }
    }
  });
}));

// @desc    Register for community cleaning event
// @route   POST /api/community/cleaning-day/register
// @access  Protected
router.post('/cleaning-day/register', protect, asyncHandler(async (req, res) => {
  const { error, value } = participationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { eventId, participantId, participantType, contactInfo } = value;

  // Check if event exists and is open for registration
  const event = await FirestoreService.getById('cleaning_events', eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Cleaning event not found'
    });
  }

  if (event.status !== 'scheduled') {
    return res.status(400).json({
      success: false,
      error: 'Event is not open for registration'
    });
  }

  // Check if event is full
  if (event.registrations >= event.maxParticipants) {
    return res.status(400).json({
      success: false,
      error: 'Event is full. Registration closed.'
    });
  }

  // Check if participant already registered
  const existingRegistration = await FirestoreService.getAll('event_registrations', [
    { field: 'eventId', operator: '==', value: eventId },
    { field: 'participantId', operator: '==', value: participantId }
  ]);

  if (existingRegistration.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Participant already registered for this event'
    });
  }

  const registrationData = {
    eventId,
    participantId,
    participantType,
    contactInfo,
    registeredAt: new Date().toISOString(),
    status: 'registered'
  };

  const registration = await FirestoreService.create('event_registrations', registrationData);

  // Update event registration count
  await FirestoreService.update('cleaning_events', eventId, {
    registrations: event.registrations + 1
  });

  res.status(201).json({
    success: true,
    message: 'Successfully registered for cleaning event',
    data: registration
  });
}));

// @desc    Mark participation attendance
// @route   PUT /api/community/cleaning-day/attendance
// @access  Protected
router.put('/cleaning-day/attendance', protect, asyncHandler(async (req, res) => {
  const { error, value } = attendanceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const attendanceData = {
    ...value,
    recordedAt: new Date().toISOString(),
    recordedBy: req.user.id
  };

  const attendance = await FirestoreService.create('event_attendance', attendanceData);

  // Update event statistics
  const event = await FirestoreService.getById('cleaning_events', value.eventId);
  if (event) {
    const allAttendance = await FirestoreService.getAll('event_attendance', [
      { field: 'eventId', operator: '==', value: value.eventId }
    ]);

    const presentCount = allAttendance.filter(a => a.attendanceStatus === 'present').length;
    const totalHours = allAttendance.reduce((sum, a) => sum + (a.hoursContributed || 0), 0);

    await FirestoreService.update('cleaning_events', value.eventId, {
      actualParticipants: presentCount,
      'impact.hoursContributed': totalHours
    });
  }

  res.json({
    success: true,
    message: 'Attendance recorded successfully',
    data: attendance
  });
}));

// @desc    Log government employee participation
// @route   POST /api/community/government/participation
// @access  Protected
router.post('/government/participation', protect, asyncHandler(async (req, res) => {
  const {
    employeeId,
    employeeName,
    department,
    designation,
    eventId,
    participationType, // voluntary, mandatory, organized
    hoursContributed,
    activityDescription,
    supervisorId
  } = req.body;

  if (!employeeId || !employeeName || !department || !eventId) {
    return res.status(400).json({
      success: false,
      error: 'Employee ID, name, department, and event ID are required'
    });
  }

  const participationData = {
    employeeId,
    employeeName,
    department,
    designation,
    eventId,
    participationType: participationType || 'voluntary',
    hoursContributed: hoursContributed || 0,
    activityDescription,
    supervisorId,
    participatedAt: new Date().toISOString(),
    status: 'verified'
  };

  const participation = await FirestoreService.create('government_participation', participationData);

  // Update department participation statistics
  const deptStats = await FirestoreService.getAll('department_stats', [
    { field: 'department', operator: '==', value: department }
  ]);

  if (deptStats.length > 0) {
    const currentStats = deptStats[0];
    await FirestoreService.update('department_stats', currentStats.id, {
      totalParticipations: (currentStats.totalParticipations || 0) + 1,
      totalHours: (currentStats.totalHours || 0) + (hoursContributed || 0),
      lastParticipation: new Date().toISOString()
    });
  } else {
    await FirestoreService.create('department_stats', {
      department,
      totalParticipations: 1,
      totalHours: hoursContributed || 0,
      uniqueEmployees: 1,
      lastParticipation: new Date().toISOString()
    });
  }

  res.status(201).json({
    success: true,
    message: 'Government employee participation logged successfully',
    data: participation
  });
}));

// @desc    Get community participation statistics
// @route   GET /api/community/participation/stats
// @access  Protected
router.get('/participation/stats', protect, asyncHandler(async (req, res) => {
  const { period = '30', area, eventType } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(period));

  // Get all cleaning events
  const allEvents = await FirestoreService.getAll('cleaning_events');
  const recentEvents = allEvents.filter(e => 
    new Date(e.createdAt) >= startDate && new Date(e.createdAt) <= endDate
  );

  // Get all registrations and attendance
  const allRegistrations = await FirestoreService.getAll('event_registrations');
  const allAttendance = await FirestoreService.getAll('event_attendance');
  const governmentParticipation = await FirestoreService.getAll('government_participation');

  // Calculate statistics
  const totalEvents = recentEvents.length;
  const completedEvents = recentEvents.filter(e => e.status === 'completed').length;
  const totalRegistrations = allRegistrations.length;
  const totalAttendees = allAttendance.filter(a => a.attendanceStatus === 'present').length;
  const attendanceRate = totalRegistrations > 0 ? (totalAttendees / totalRegistrations) * 100 : 0;

  // Participation by type
  const participationByType = {
    citizen: allRegistrations.filter(r => r.participantType === 'citizen').length,
    government_employee: governmentParticipation.length,
    volunteer: allRegistrations.filter(r => r.participantType === 'volunteer').length
  };

  // Government department participation
  const departmentParticipation = governmentParticipation.reduce((acc, p) => {
    acc[p.department] = (acc[p.department] || 0) + 1;
    return acc;
  }, {});

  // Impact metrics
  const totalImpact = recentEvents.reduce((acc, event) => {
    acc.wasteCollected += event.impact?.wasteCollected || 0;
    acc.areasCleaned += event.impact?.areasCleaned || 0;
    acc.hoursContributed += event.impact?.hoursContributed || 0;
    return acc;
  }, { wasteCollected: 0, areasCleaned: 0, hoursContributed: 0 });

  // Top performing areas
  const areaPerformance = recentEvents.reduce((acc, event) => {
    const area = event.location?.area || 'Unknown';
    if (!acc[area]) {
      acc[area] = { events: 0, participants: 0, impact: 0 };
    }
    acc[area].events += 1;
    acc[area].participants += event.actualParticipants || 0;
    acc[area].impact += (event.impact?.wasteCollected || 0);
    return acc;
  }, {});

  const statistics = {
    overview: {
      totalEvents,
      completedEvents,
      totalRegistrations,
      totalAttendees,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      activeParticipants: new Set([
        ...allRegistrations.map(r => r.participantId),
        ...governmentParticipation.map(p => p.employeeId)
      ]).size
    },
    participationBreakdown: participationByType,
    governmentParticipation: {
      totalEmployees: governmentParticipation.length,
      byDepartment: departmentParticipation,
      totalHours: governmentParticipation.reduce((sum, p) => sum + (p.hoursContributed || 0), 0)
    },
    impact: totalImpact,
    areaPerformance: Object.entries(areaPerformance)
      .map(([area, stats]) => ({ area, ...stats }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 10),
    trends: {
      eventsThisMonth: recentEvents.length,
      participationGrowth: 'Calculated based on historical data', // Implement actual calculation
      repeatParticipants: 'Calculated based on participant history'
    }
  };

  res.json({
    success: true,
    data: statistics
  });
}));

// @desc    Create awareness campaign
// @route   POST /api/community/awareness/campaign
// @access  Protected
router.post('/awareness/campaign', protect, asyncHandler(async (req, res) => {
  const { error, value } = campaignSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Validate date range
  const startDate = new Date(value.startDate);
  const endDate = new Date(value.endDate);
  if (endDate <= startDate) {
    return res.status(400).json({
      success: false,
      error: 'End date must be after start date'
    });
  }

  const campaignData = {
    ...value,
    campaignId: `CAMP_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'planned',
    actualReach: 0,
    engagementMetrics: {
      views: 0,
      interactions: 0,
      feedbackReceived: 0,
      behaviorChangeReported: 0
    },
    milestones: [],
    feedback: []
  };

  const campaign = await FirestoreService.create('awareness_campaigns', campaignData);

  res.status(201).json({
    success: true,
    message: 'Awareness campaign created successfully',
    data: campaign
  });
}));

// @desc    Get all community events
// @route   GET /api/community/events
// @access  Protected
router.get('/events', protect, asyncHandler(async (req, res) => {
  const { status, area, type, upcoming } = req.query;
  const conditions = [];

  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }
  if (area) {
    conditions.push({ field: 'location.area', operator: '==', value: area });
  }

  let events = await FirestoreService.getAll('cleaning_events', conditions, 'scheduledDate');

  // Filter for upcoming events if requested
  if (upcoming === 'true') {
    const now = new Date();
    events = events.filter(event => new Date(event.scheduledDate) > now);
  }

  res.json({
    success: true,
    data: events
  });
}));

// @desc    Get campaigns
// @route   GET /api/community/campaigns
// @access  Protected
router.get('/campaigns', protect, asyncHandler(async (req, res) => {
  const { status, type, active } = req.query;
  const conditions = [];

  if (status) {
    conditions.push({ field: 'status', operator: '==', value: status });
  }
  if (type) {
    conditions.push({ field: 'campaignType', operator: '==', value: type });
  }

  let campaigns = await FirestoreService.getAll('awareness_campaigns', conditions, 'createdAt');

  // Filter for active campaigns if requested
  if (active === 'true') {
    const now = new Date();
    campaigns = campaigns.filter(campaign => {
      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);
      return start <= now && end >= now;
    });
  }

  res.json({
    success: true,
    data: campaigns
  });
}));

export default router;