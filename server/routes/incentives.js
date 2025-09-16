import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const rewardSchema = Joi.object({
  bulkGeneratorId: Joi.string().required(),
  segregationScore: Joi.number().min(0).max(100).required(),
  wasteQuantity: Joi.number().min(0).required(), // kg
  qualityGrade: Joi.string().valid('A', 'B', 'C', 'D').required(),
  assessedBy: Joi.string().required(),
  period: Joi.string().required() // e.g., "2024-01" for January 2024
});

const redeemSchema = Joi.object({
  citizenId: Joi.string(),
  bulkGeneratorId: Joi.string(),
  points: Joi.number().integer().min(1).required(),
  rewardType: Joi.string().valid('cash', 'voucher', 'product', 'service').required(),
  rewardValue: Joi.number().min(0).required(),
  rewardDescription: Joi.string().required()
});

const penaltySchema = Joi.object({
  violatorType: Joi.string().valid('citizen', 'bulk_generator').required(),
  violatorId: Joi.string().required(),
  violationType: Joi.string().valid('improper_segregation', 'illegal_dumping', 'non_compliance', 'late_payment').required(),
  amount: Joi.number().min(0).required(),
  description: Joi.string().required(),
  evidence: Joi.array().items(Joi.string()), // Photo URLs
  issuedBy: Joi.string().required(),
  dueDate: Joi.string().isoDate()
});

// @desc    Process segregation rewards for bulk generators
// @route   POST /api/incentives/bulk-generator/reward
// @access  Protected
router.post('/bulk-generator/reward', protect, asyncHandler(async (req, res) => {
  const { error, value } = rewardSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { bulkGeneratorId, segregationScore, wasteQuantity, qualityGrade } = value;

  // Get bulk generator details
  const bulkGenerator = await FirestoreService.getById('bulk_generators', bulkGeneratorId);
  if (!bulkGenerator) {
    return res.status(404).json({
      success: false,
      error: 'Bulk generator not found'
    });
  }

  // Calculate reward points based on performance
  let basePoints = Math.floor(wasteQuantity * 0.1); // 0.1 point per kg
  let qualityMultiplier = { 'A': 2, 'B': 1.5, 'C': 1, 'D': 0.5 }[qualityGrade];
  let scoreMultiplier = segregationScore / 100;
  
  const totalPoints = Math.floor(basePoints * qualityMultiplier * scoreMultiplier);

  const rewardData = {
    ...value,
    pointsAwarded: totalPoints,
    calculationMethod: {
      basePoints,
      qualityMultiplier,
      scoreMultiplier,
      formula: 'basePoints * qualityMultiplier * scoreMultiplier'
    },
    awardedAt: new Date().toISOString(),
    status: 'awarded'
  };

  const reward = await FirestoreService.create('incentive_rewards', rewardData);

  // Update bulk generator's total points
  const currentPoints = bulkGenerator.incentives?.points || 0;
  await FirestoreService.update('bulk_generators', bulkGeneratorId, {
    'incentives.points': currentPoints + totalPoints,
    'incentives.rewards': [
      ...(bulkGenerator.incentives?.rewards || []),
      {
        rewardId: reward.id,
        points: totalPoints,
        date: new Date().toISOString(),
        period: value.period
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Reward processed successfully',
    data: {
      reward,
      totalPointsAwarded: totalPoints,
      newTotalPoints: currentPoints + totalPoints
    }
  });
}));

// @desc    Get citizen reward points
// @route   GET /api/incentives/citizen/points/:citizenId
// @access  Protected
router.get('/citizen/points/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  // Get citizen's reward history
  const rewards = await FirestoreService.getAll('citizen_rewards', [
    { field: 'citizenId', operator: '==', value: citizenId }
  ], 'awardedAt', 20);

  // Get redemption history
  const redemptions = await FirestoreService.getAll('point_redemptions', [
    { field: 'citizenId', operator: '==', value: citizenId }
  ], 'redeemedAt', 20);

  const totalEarned = rewards.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
  const totalRedeemed = redemptions.reduce((sum, r) => sum + (r.points || 0), 0);
  const currentBalance = citizen.rewardPoints || 0;

  res.json({
    success: true,
    data: {
      citizenId,
      citizenName: citizen.name,
      currentPoints: currentBalance,
      totalEarned,
      totalRedeemed,
      recentRewards: rewards.slice(0, 10),
      recentRedemptions: redemptions.slice(0, 10)
    }
  });
}));

// @desc    Award points to citizen
// @route   POST /api/incentives/citizen/award
// @access  Protected
router.post('/citizen/award', protect, asyncHandler(async (req, res) => {
  const { citizenId, points, reason, awardedBy } = req.body;

  if (!citizenId || !points || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Citizen ID, points, and reason are required'
    });
  }

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  const rewardData = {
    citizenId,
    pointsAwarded: points,
    reason,
    awardedBy,
    awardedAt: new Date().toISOString(),
    type: 'bonus' // compliance, training, bonus, etc.
  };

  const reward = await FirestoreService.create('citizen_rewards', rewardData);

  // Update citizen's total points
  const newTotal = (citizen.rewardPoints || 0) + points;
  await FirestoreService.update('citizens', citizenId, {
    rewardPoints: newTotal
  });

  res.status(201).json({
    success: true,
    message: 'Points awarded successfully',
    data: {
      reward,
      newTotalPoints: newTotal
    }
  });
}));

// @desc    Redeem reward points
// @route   POST /api/incentives/redeem
// @access  Protected
router.post('/redeem', protect, asyncHandler(async (req, res) => {
  const { error, value } = redeemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { citizenId, bulkGeneratorId, points, rewardType, rewardValue, rewardDescription } = value;

  // Determine user type and get user data
  let user, userType, userCollection;
  if (citizenId) {
    user = await FirestoreService.getById('citizens', citizenId);
    userType = 'citizen';
    userCollection = 'citizens';
  } else if (bulkGeneratorId) {
    user = await FirestoreService.getById('bulk_generators', bulkGeneratorId);
    userType = 'bulk_generator';
    userCollection = 'bulk_generators';
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if user has enough points
  const availablePoints = userType === 'citizen' 
    ? user.rewardPoints || 0 
    : user.incentives?.points || 0;

  if (availablePoints < points) {
    return res.status(400).json({
      success: false,
      error: `Insufficient points. Available: ${availablePoints}, Required: ${points}`
    });
  }

  const redemptionData = {
    citizenId,
    bulkGeneratorId,
    points,
    rewardType,
    rewardValue,
    rewardDescription,
    redeemedAt: new Date().toISOString(),
    status: 'processed',
    redemptionId: `RED_${Date.now()}`
  };

  const redemption = await FirestoreService.create('point_redemptions', redemptionData);

  // Update user's points
  const newPointBalance = availablePoints - points;
  if (userType === 'citizen') {
    await FirestoreService.update('citizens', citizenId, {
      rewardPoints: newPointBalance
    });
  } else {
    await FirestoreService.update('bulk_generators', bulkGeneratorId, {
      'incentives.points': newPointBalance
    });
  }

  res.json({
    success: true,
    message: 'Points redeemed successfully',
    data: {
      redemption,
      previousBalance: availablePoints,
      newBalance: newPointBalance,
      pointsRedeemed: points
    }
  });
}));

// @desc    Impose segregation violation fine
// @route   POST /api/penalties/impose
// @access  Protected
router.post('/impose', protect, asyncHandler(async (req, res) => {
  const { error, value } = penaltySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const penaltyData = {
    ...value,
    penaltyId: `PEN_${Date.now()}`,
    issuedAt: new Date().toISOString(),
    status: 'issued',
    paidAt: null,
    paymentMethod: null,
    dueDate: value.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
  };

  const penalty = await FirestoreService.create('penalties', penaltyData);

  // Update violator's penalty history
  const { violatorType, violatorId } = value;
  const collection = violatorType === 'citizen' ? 'citizens' : 'bulk_generators';
  
  const violator = await FirestoreService.getById(collection, violatorId);
  if (violator) {
    const penaltyHistory = violatorType === 'citizen' 
      ? violator.penaltyHistory || []
      : violator.compliance?.violations || [];

    const newPenalty = {
      penaltyId: penalty.id,
      amount: value.amount,
      type: value.violationType,
      issuedAt: penaltyData.issuedAt,
      status: 'unpaid'
    };

    if (violatorType === 'citizen') {
      await FirestoreService.update('citizens', violatorId, {
        penaltyHistory: [...penaltyHistory, newPenalty]
      });
    } else {
      await FirestoreService.update('bulk_generators', violatorId, {
        'compliance.violations': [...penaltyHistory, newPenalty]
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Penalty imposed successfully',
    data: penalty
  });
}));

// @desc    Get citizen penalty history
// @route   GET /api/penalties/citizen/:citizenId
// @access  Protected
router.get('/citizen/:citizenId', protect, asyncHandler(async (req, res) => {
  const { citizenId } = req.params;

  const citizen = await FirestoreService.getById('citizens', citizenId);
  if (!citizen) {
    return res.status(404).json({
      success: false,
      error: 'Citizen not found'
    });
  }

  // Get detailed penalty records
  const penalties = await FirestoreService.getAll('penalties', [
    { field: 'violatorId', operator: '==', value: citizenId },
    { field: 'violatorType', operator: '==', value: 'citizen' }
  ]);

  const totalPenalties = penalties.length;
  const totalAmount = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidPenalties = penalties.filter(p => p.status === 'paid').length;
  const unpaidPenalties = penalties.filter(p => p.status === 'issued').length;
  const overduePenalties = penalties.filter(p => 
    p.status === 'issued' && new Date(p.dueDate) < new Date()
  ).length;

  res.json({
    success: true,
    data: {
      citizenId,
      citizenName: citizen.name,
      summary: {
        totalPenalties,
        totalAmount,
        paidPenalties,
        unpaidPenalties,
        overduePenalties
      },
      penalties: penalties.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    }
  });
}));

// @desc    Process penalty payment
// @route   PUT /api/penalties/payment
// @access  Protected
router.put('/payment', protect, asyncHandler(async (req, res) => {
  const { penaltyId, paymentMethod, transactionId, paidAmount } = req.body;

  if (!penaltyId || !paymentMethod || !paidAmount) {
    return res.status(400).json({
      success: false,
      error: 'Penalty ID, payment method, and paid amount are required'
    });
  }

  const penalty = await FirestoreService.getById('penalties', penaltyId);
  if (!penalty) {
    return res.status(404).json({
      success: false,
      error: 'Penalty not found'
    });
  }

  if (penalty.status === 'paid') {
    return res.status(400).json({
      success: false,
      error: 'Penalty already paid'
    });
  }

  if (paidAmount < penalty.amount) {
    return res.status(400).json({
      success: false,
      error: `Insufficient payment. Required: ₹${penalty.amount}, Paid: ₹${paidAmount}`
    });
  }

  const updateData = {
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentMethod,
    transactionId,
    paidAmount
  };

  const updatedPenalty = await FirestoreService.update('penalties', penaltyId, updateData);

  // Update penalty history in user record
  const collection = penalty.violatorType === 'citizen' ? 'citizens' : 'bulk_generators';
  const violator = await FirestoreService.getById(collection, penalty.violatorId);
  
  if (violator) {
    const historyField = penalty.violatorType === 'citizen' ? 'penaltyHistory' : 'compliance.violations';
    const history = penalty.violatorType === 'citizen' 
      ? violator.penaltyHistory || []
      : violator.compliance?.violations || [];

    const updatedHistory = history.map(h => 
      h.penaltyId === penaltyId ? { ...h, status: 'paid', paidAt: updateData.paidAt } : h
    );

    await FirestoreService.update(collection, penalty.violatorId, {
      [historyField]: updatedHistory
    });
  }

  res.json({
    success: true,
    message: 'Penalty payment processed successfully',
    data: updatedPenalty
  });
}));

// @desc    Suspend waste collection for violations
// @route   POST /api/penalties/waste-collection/suspend
// @access  Protected
router.post('/waste-collection/suspend', protect, asyncHandler(async (req, res) => {
  const { violatorType, violatorId, suspensionDays, reason, issuedBy } = req.body;

  if (!violatorType || !violatorId || !suspensionDays || !reason) {
    return res.status(400).json({
      success: false,
      error: 'Violator type, ID, suspension days, and reason are required'
    });
  }

  const collection = violatorType === 'citizen' ? 'households' : 'bulk_generators';
  
  // Find the violator's household/bulk generator record
  const conditions = violatorType === 'citizen' 
    ? [{ field: 'citizenId', operator: '==', value: violatorId }]
    : [{ field: 'id', operator: '==', value: violatorId }];

  const records = await FirestoreService.getAll(collection, conditions);
  
  if (records.length === 0) {
    return res.status(404).json({
      success: false,
      error: `${violatorType} record not found`
    });
  }

  const record = records[0];
  const suspensionEndDate = new Date();
  suspensionEndDate.setDate(suspensionEndDate.getDate() + suspensionDays);

  const suspensionData = {
    violatorType,
    violatorId,
    recordId: record.id,
    suspensionDays,
    reason,
    issuedBy,
    issuedAt: new Date().toISOString(),
    suspensionEndDate: suspensionEndDate.toISOString(),
    status: 'active'
  };

  const suspension = await FirestoreService.create('collection_suspensions', suspensionData);

  // Update the record status
  await FirestoreService.update(collection, record.id, {
    status: 'suspended',
    suspensionDetails: {
      reason,
      suspendedAt: new Date().toISOString(),
      suspensionEndDate: suspensionEndDate.toISOString(),
      issuedBy
    }
  });

  res.status(201).json({
    success: true,
    message: 'Waste collection suspended successfully',
    data: {
      suspension,
      suspensionEndDate: suspensionEndDate.toISOString()
    }
  });
}));

// @desc    Get incentives and penalties statistics
// @route   GET /api/incentives/statistics
// @access  Protected
router.get('/statistics', protect, asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  // Get rewards data
  const rewards = await FirestoreService.getAll('incentive_rewards');
  const citizenRewards = await FirestoreService.getAll('citizen_rewards');
  const redemptions = await FirestoreService.getAll('point_redemptions');
  const penalties = await FirestoreService.getAll('penalties');

  // Calculate statistics
  const totalRewardsAwarded = rewards.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0) +
                             citizenRewards.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + (r.points || 0), 0);
  const totalPenaltyAmount = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidPenalties = penalties.filter(p => p.status === 'paid');
  const totalPenaltyRevenue = paidPenalties.reduce((sum, p) => sum + (p.amount || 0), 0);

  const statistics = {
    rewards: {
      totalPointsAwarded: totalRewardsAwarded,
      totalBulkGeneratorRewards: rewards.length,
      totalCitizenRewards: citizenRewards.length,
      averageRewardPerRecipient: rewards.length > 0 ? totalRewardsAwarded / rewards.length : 0
    },
    redemptions: {
      totalRedemptions: redemptions.length,
      totalPointsRedeemed,
      totalValueRedeemed: redemptions.reduce((sum, r) => sum + (r.rewardValue || 0), 0),
      byType: redemptions.reduce((acc, r) => {
        acc[r.rewardType] = (acc[r.rewardType] || 0) + 1;
        return acc;
      }, {})
    },
    penalties: {
      totalPenalties: penalties.length,
      totalAmount: totalPenaltyAmount,
      totalRevenue: totalPenaltyRevenue,
      collectionRate: penalties.length > 0 ? (paidPenalties.length / penalties.length) * 100 : 0,
      byViolationType: penalties.reduce((acc, p) => {
        acc[p.violationType] = (acc[p.violationType] || 0) + 1;
        return acc;
      }, {}),
      byStatus: penalties.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {})
    },
    overview: {
      activeIncentiveUsers: new Set([...rewards.map(r => r.bulkGeneratorId), ...citizenRewards.map(r => r.citizenId)]).size,
      totalTransactions: rewards.length + citizenRewards.length + redemptions.length + penalties.length,
      netPointsInCirculation: totalRewardsAwarded - totalPointsRedeemed
    }
  };

  res.json({
    success: true,
    data: statistics
  });
}));

export default router;