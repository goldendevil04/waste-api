import express from 'express';
import Joi from 'joi';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FirestoreService } from '../utils/firestore.js';

const router = express.Router();

// Validation schemas
const kitOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  customerType: Joi.string().valid('citizen', 'bulk_generator').required(),
  kitType: Joi.string().valid('compost', 'dustbin_set').required(),
  variant: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(10).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    city: Joi.string().required(),
    phone: Joi.string().pattern(/^\d{10}$/).required()
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'online', 'points').required(),
  useRewardPoints: Joi.boolean().default(false),
  pointsToRedeem: Joi.number().integer().min(0).default(0)
});

const scrapListingSchema = Joi.object({
  sellerId: Joi.string().required(),
  sellerType: Joi.string().valid('citizen', 'bulk_generator').required(),
  scrapType: Joi.string().valid('plastic', 'paper', 'metal', 'electronic', 'glass', 'textile').required(),
  subCategory: Joi.string().required(),
  quantity: Joi.number().min(0.1).required(), // in kg
  pricePerKg: Joi.number().min(0),
  totalPrice: Joi.number().min(0),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor').required(),
  description: Joi.string().max(500),
  pickupLocation: Joi.object({
    address: Joi.string().required(),
    area: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    coordinates: Joi.object({
      lat: Joi.number(),
      lng: Joi.number()
    })
  }).required(),
  availableFrom: Joi.string().isoDate().required(),
  availableUntil: Joi.string().isoDate().required(),
  contactPreference: Joi.string().valid('phone', 'email', 'both').default('both')
});

// @desc    Get available compost kits
// @route   GET /api/shop/compost-kits
// @access  Protected
router.get('/compost-kits', protect, asyncHandler(async (req, res) => {
  const { category, priceRange } = req.query;

  // Static product catalog for compost kits
  let compostKits = [
    {
      id: 'compost_basic_001',
      name: 'Basic Compost Kit',
      category: 'basic',
      description: 'Perfect for beginners. Includes compost bin, thermometer, and instruction manual.',
      price: 1500,
      pointsRequired: 150,
      features: [
        '20L compost bin with lid',
        'Digital thermometer',
        'pH testing strips',
        'Instruction manual',
        '1 year warranty'
      ],
      images: [
        'https://example.com/images/basic-compost-kit-1.jpg',
        'https://example.com/images/basic-compost-kit-2.jpg'
      ],
      inStock: true,
      stockQuantity: 25,
      rating: 4.2,
      reviews: 18
    },
    {
      id: 'compost_advanced_002',
      name: 'Advanced Compost Kit',
      category: 'advanced',
      description: 'For serious composters. Includes tumbler, moisture meter, and organic activator.',
      price: 3500,
      pointsRequired: 350,
      features: [
        '50L compost tumbler',
        'Moisture and pH meter',
        'Organic compost activator',
        'Detailed guide book',
        'Tool kit included',
        '2 year warranty'
      ],
      images: [
        'https://example.com/images/advanced-compost-kit-1.jpg',
        'https://example.com/images/advanced-compost-kit-2.jpg'
      ],
      inStock: true,
      stockQuantity: 12,
      rating: 4.7,
      reviews: 32
    },
    {
      id: 'compost_premium_003',
      name: 'Premium Electric Composter',
      category: 'premium',
      description: 'Electric composter with automatic mixing and temperature control.',
      price: 8500,
      pointsRequired: 850,
      features: [
        'Electric composter with automatic mixing',
        'Temperature control system',
        'Digital display panel',
        'Smart sensor technology',
        'Mobile app connectivity',
        '3 year warranty'
      ],
      images: [
        'https://example.com/images/premium-composter-1.jpg',
        'https://example.com/images/premium-composter-2.jpg'
      ],
      inStock: true,
      stockQuantity: 5,
      rating: 4.9,
      reviews: 8
    }
  ];

  // Filter by category
  if (category) {
    compostKits = compostKits.filter(kit => kit.category === category);
  }

  // Filter by price range
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    compostKits = compostKits.filter(kit => kit.price >= min && kit.price <= max);
  }

  res.json({
    success: true,
    data: {
      kits: compostKits,
      categories: ['basic', 'advanced', 'premium'],
      priceRanges: [
        { label: 'Under ₹2000', value: '0-2000' },
        { label: '₹2000 - ₹5000', value: '2000-5000' },
        { label: 'Above ₹5000', value: '5000-100000' }
      ]
    }
  });
}));

// @desc    Order compost kit
// @route   POST /api/shop/compost-kits/order
// @access  Protected
router.post('/compost-kits/order', protect, asyncHandler(async (req, res) => {
  const { error, value } = kitOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { customerId, customerType, kitType, variant, quantity, deliveryAddress, paymentMethod, useRewardPoints, pointsToRedeem } = value;

  // Get customer details for validation
  const collection = customerType === 'citizen' ? 'citizens' : 'bulk_generators';
  const customer = await FirestoreService.getById(collection, customerId);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }

  // Validate reward points if being used
  if (useRewardPoints && pointsToRedeem > 0) {
    const availablePoints = customerType === 'citizen' 
      ? customer.rewardPoints || 0 
      : customer.incentives?.points || 0;

    if (pointsToRedeem > availablePoints) {
      return res.status(400).json({
        success: false,
        error: `Insufficient points. Available: ${availablePoints}, Required: ${pointsToRedeem}`
      });
    }
  }

  // Get product details (in real app, this would be from a products collection)
  const productPrices = {
    'compost_basic_001': { price: 1500, pointsRequired: 150 },
    'compost_advanced_002': { price: 3500, pointsRequired: 350 },
    'compost_premium_003': { price: 8500, pointsRequired: 850 }
  };

  const product = productPrices[variant];
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product variant not found'
    });
  }

  const totalPrice = product.price * quantity;
  const pointsDiscount = pointsToRedeem * 10; // 1 point = ₹10
  const finalPrice = Math.max(0, totalPrice - pointsDiscount);

  const orderData = {
    orderId: `KIT_${Date.now()}`,
    customerId,
    customerType,
    kitType,
    variant,
    quantity,
    unitPrice: product.price,
    totalPrice,
    pointsUsed: pointsToRedeem,
    pointsDiscount,
    finalPrice,
    paymentMethod,
    deliveryAddress,
    orderDate: new Date().toISOString(),
    status: 'confirmed',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed'
  };

  const order = await FirestoreService.create('kit_orders', orderData);

  // Deduct reward points if used
  if (useRewardPoints && pointsToRedeem > 0) {
    const currentPoints = customerType === 'citizen' 
      ? customer.rewardPoints || 0 
      : customer.incentives?.points || 0;

    const newPoints = currentPoints - pointsToRedeem;
    
    if (customerType === 'citizen') {
      await FirestoreService.update('citizens', customerId, {
        rewardPoints: newPoints
      });
    } else {
      await FirestoreService.update('bulk_generators', customerId, {
        'incentives.points': newPoints
      });
    }

    // Record points redemption
    await FirestoreService.create('point_redemptions', {
      citizenId: customerType === 'citizen' ? customerId : null,
      bulkGeneratorId: customerType === 'bulk_generator' ? customerId : null,
      points: pointsToRedeem,
      rewardType: 'product',
      rewardValue: pointsDiscount,
      rewardDescription: `Discount on ${kitType} order #${order.id}`,
      redeemedAt: new Date().toISOString(),
      status: 'processed'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      order,
      estimatedDelivery: orderData.estimatedDelivery,
      paymentRequired: finalPrice > 0 ? finalPrice : 0
    }
  });
}));

// @desc    Get available dustbin types
// @route   GET /api/shop/dustbins
// @access  Protected
router.get('/dustbins', protect, asyncHandler(async (req, res) => {
  const { type, capacity, material } = req.query;

  // Static product catalog for dustbins
  let dustbins = [
    {
      id: 'dustbin_3bin_set_001',
      name: '3-Bin Segregation Set',
      type: 'set',
      capacity: '40L each',
      material: 'plastic',
      description: 'Complete 3-bin set for organic, recyclable, and hazardous waste segregation.',
      price: 2500,
      pointsRequired: 250,
      colors: ['Green (Organic)', 'Blue (Recyclable)', 'Red (Hazardous)'],
      features: [
        'Color-coded for easy segregation',
        'Pedal operation',
        'Tight-fitting lids',
        'Easy to clean',
        '2 year warranty'
      ],
      images: [
        'https://example.com/images/3-bin-set-1.jpg',
        'https://example.com/images/3-bin-set-2.jpg'
      ],
      inStock: true,
      stockQuantity: 50,
      rating: 4.4,
      reviews: 25
    },
    {
      id: 'dustbin_smart_001',
      name: 'Smart Dustbin with Sensor',
      type: 'smart',
      capacity: '50L',
      material: 'stainless_steel',
      description: 'Motion sensor dustbin with automatic lid opening and mobile app connectivity.',
      price: 4500,
      pointsRequired: 450,
      features: [
        'Motion sensor technology',
        'Mobile app connectivity',
        'Battery indicator',
        'Fingerprint resistant',
        'Easy maintenance',
        '1 year warranty'
      ],
      images: [
        'https://example.com/images/smart-dustbin-1.jpg',
        'https://example.com/images/smart-dustbin-2.jpg'
      ],
      inStock: true,
      stockQuantity: 15,
      rating: 4.6,
      reviews: 12
    },
    {
      id: 'dustbin_large_001',
      name: 'Large Capacity Bin',
      type: 'large',
      capacity: '120L',
      material: 'hdpe',
      description: 'Heavy-duty large capacity bin for bulk generators and commercial use.',
      price: 3500,
      pointsRequired: 350,
      features: [
        'Heavy-duty construction',
        'UV resistant',
        'Easy wheel mobility',
        'Secure locking lid',
        'Weather resistant',
        '3 year warranty'
      ],
      images: [
        'https://example.com/images/large-bin-1.jpg',
        'https://example.com/images/large-bin-2.jpg'
      ],
      inStock: true,
      stockQuantity: 20,
      rating: 4.3,
      reviews: 18
    }
  ];

  // Apply filters
  if (type) {
    dustbins = dustbins.filter(bin => bin.type === type);
  }
  if (capacity) {
    dustbins = dustbins.filter(bin => bin.capacity.includes(capacity));
  }
  if (material) {
    dustbins = dustbins.filter(bin => bin.material === material);
  }

  res.json({
    success: true,
    data: {
      dustbins,
      filters: {
        types: ['set', 'smart', 'large', 'compact'],
        capacities: ['20L', '40L', '50L', '80L', '120L'],
        materials: ['plastic', 'stainless_steel', 'hdpe']
      }
    }
  });
}));

// @desc    Order dustbin set
// @route   POST /api/shop/dustbins/order
// @access  Protected
router.post('/dustbins/order', protect, asyncHandler(async (req, res) => {
  const { error, value } = kitOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { customerId, customerType, variant, quantity, deliveryAddress, paymentMethod, useRewardPoints, pointsToRedeem } = value;

  // Similar order processing logic as compost kits
  const productPrices = {
    'dustbin_3bin_set_001': { price: 2500, pointsRequired: 250 },
    'dustbin_smart_001': { price: 4500, pointsRequired: 450 },
    'dustbin_large_001': { price: 3500, pointsRequired: 350 }
  };

  const product = productPrices[variant];
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product variant not found'
    });
  }

  const totalPrice = product.price * quantity;
  const pointsDiscount = pointsToRedeem * 10;
  const finalPrice = Math.max(0, totalPrice - pointsDiscount);

  const orderData = {
    orderId: `DUST_${Date.now()}`,
    customerId,
    customerType,
    kitType: 'dustbin_set',
    variant,
    quantity,
    unitPrice: product.price,
    totalPrice,
    pointsUsed: pointsToRedeem,
    pointsDiscount,
    finalPrice,
    paymentMethod,
    deliveryAddress,
    orderDate: new Date().toISOString(),
    status: 'confirmed',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed'
  };

  const order = await FirestoreService.create('dustbin_orders', orderData);

  res.status(201).json({
    success: true,
    message: 'Dustbin order placed successfully',
    data: {
      order,
      estimatedDelivery: orderData.estimatedDelivery,
      paymentRequired: finalPrice
    }
  });
}));

// @desc    Get nearby recycling centers
// @route   GET /api/shop/recycling-centers
// @access  Protected
router.get('/recycling-centers', protect, asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, materialType } = req.query; // radius in km

  // Static data for recycling centers (in real app, use geolocation queries)
  let recyclingCenters = [
    {
      id: 'rc_001',
      name: 'EcoGreen Recycling Hub',
      address: 'Plot No. 45, Industrial Area, Phase-2',
      area: 'Industrial Area',
      pincode: '110020',
      phone: '9876543210',
      email: 'info@ecogreen.com',
      coordinates: { lat: 28.6139, lng: 77.2090 },
      distance: 2.5, // km from user location
      acceptedMaterials: ['plastic', 'paper', 'metal', 'electronic'],
      operatingHours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      pricing: {
        plastic: { min: 8, max: 15, unit: 'per kg' },
        paper: { min: 5, max: 12, unit: 'per kg' },
        metal: { min: 25, max: 45, unit: 'per kg' },
        electronic: { min: 50, max: 200, unit: 'per item' }
      },
      rating: 4.3,
      reviews: 28,
      verified: true
    },
    {
      id: 'rc_002',
      name: 'Green Planet Recyclers',
      address: 'B-12, Eco Park, Green Valley',
      area: 'Green Valley',
      pincode: '110019',
      phone: '9876543211',
      email: 'contact@greenplanet.com',
      coordinates: { lat: 28.5355, lng: 77.3910 },
      distance: 5.8,
      acceptedMaterials: ['plastic', 'paper', 'glass', 'textile'],
      operatingHours: {
        monday: '8:00 AM - 7:00 PM',
        tuesday: '8:00 AM - 7:00 PM',
        wednesday: '8:00 AM - 7:00 PM',
        thursday: '8:00 AM - 7:00 PM',
        friday: '8:00 AM - 7:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: '10:00 AM - 2:00 PM'
      },
      pricing: {
        plastic: { min: 10, max: 18, unit: 'per kg' },
        paper: { min: 6, max: 14, unit: 'per kg' },
        glass: { min: 3, max: 8, unit: 'per kg' },
        textile: { min: 12, max: 25, unit: 'per kg' }
      },
      rating: 4.1,
      reviews: 35,
      verified: true
    }
  ];

  // Filter by material type
  if (materialType) {
    recyclingCenters = recyclingCenters.filter(center => 
      center.acceptedMaterials.includes(materialType)
    );
  }

  // Filter by radius (simplified - in real app use geospatial queries)
  if (lat && lng && radius) {
    recyclingCenters = recyclingCenters.filter(center => 
      center.distance <= parseFloat(radius)
    );
  }

  // Sort by distance
  recyclingCenters.sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    data: {
      centers: recyclingCenters,
      totalFound: recyclingCenters.length,
      searchCriteria: {
        radius: radius ? `${radius} km` : 'All',
        materialType: materialType || 'All materials'
      }
    }
  });
}));

// @desc    Post scrap for selling
// @route   POST /api/shop/scrap/sell
// @access  Protected
router.post('/scrap/sell', protect, asyncHandler(async (req, res) => {
  const { error, value } = scrapListingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  // Validate seller exists
  const collection = value.sellerType === 'citizen' ? 'citizens' : 'bulk_generators';
  const seller = await FirestoreService.getById(collection, value.sellerId);
  
  if (!seller) {
    return res.status(404).json({
      success: false,
      error: 'Seller not found'
    });
  }

  // Calculate pricing if not provided
  const marketRates = {
    plastic: { min: 8, max: 20 },
    paper: { min: 4, max: 15 },
    metal: { min: 30, max: 60 },
    electronic: { min: 100, max: 500 },
    glass: { min: 2, max: 8 },
    textile: { min: 10, max: 30 }
  };

  const rate = marketRates[value.scrapType];
  const suggestedPricePerKg = value.pricePerKg || (rate ? (rate.min + rate.max) / 2 : 10);
  const calculatedTotalPrice = value.totalPrice || (suggestedPricePerKg * value.quantity);

  const listingData = {
    ...value,
    listingId: `SCRAP_${Date.now()}`,
    pricePerKg: suggestedPricePerKg,
    totalPrice: calculatedTotalPrice,
    listedAt: new Date().toISOString(),
    status: 'active', // active, sold, expired, removed
    views: 0,
    inquiries: [],
    expiresAt: new Date(value.availableUntil).toISOString()
  };

  const listing = await FirestoreService.create('scrap_listings', listingData);

  res.status(201).json({
    success: true,
    message: 'Scrap listing created successfully',
    data: {
      listing,
      suggestedPrice: suggestedPricePerKg,
      marketRate: rate,
      estimatedEarnings: calculatedTotalPrice
    }
  });
}));

// @desc    Get scrap buyers nearby
// @route   GET /api/shop/scrap/buyers
// @access  Protected
router.get('/scrap/buyers', protect, asyncHandler(async (req, res) => {
  const { lat, lng, scrapType, minPrice, radius = 15 } = req.query;

  // Static data for scrap buyers
  let buyers = [
    {
      id: 'buyer_001',
      name: 'Metro Scrap Dealers',
      businessType: 'dealer',
      specialization: ['plastic', 'paper', 'metal'],
      address: 'Shop No. 15, Scrap Market, Industrial Area',
      area: 'Industrial Area',
      pincode: '110020',
      phone: '9876543220',
      coordinates: { lat: 28.6139, lng: 77.2090 },
      distance: 3.2,
      currentRates: {
        plastic: { rate: 12, unit: 'per kg', updated: '2024-01-15' },
        paper: { rate: 8, unit: 'per kg', updated: '2024-01-15' },
        metal: { rate: 35, unit: 'per kg', updated: '2024-01-15' }
      },
      operatingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
      pickupService: true,
      minimumQuantity: { plastic: 5, paper: 10, metal: 2 },
      rating: 4.2,
      reviews: 45,
      verified: true,
      paymentMethods: ['cash', 'upi', 'bank_transfer']
    },
    {
      id: 'buyer_002',
      name: 'EcoWaste Solutions',
      businessType: 'recycling_company',
      specialization: ['electronic', 'metal', 'plastic'],
      address: '45-A, Eco Industrial Park, Phase-3',
      area: 'Eco Industrial Park',
      pincode: '110025',
      phone: '9876543221',
      coordinates: { lat: 28.5355, lng: 77.3910 },
      distance: 7.5,
      currentRates: {
        electronic: { rate: 150, unit: 'per kg', updated: '2024-01-16' },
        metal: { rate: 40, unit: 'per kg', updated: '2024-01-16' },
        plastic: { rate: 15, unit: 'per kg', updated: '2024-01-16' }
      },
      operatingHours: '8:00 AM - 7:00 PM (Mon-Fri), 10:00 AM - 4:00 PM (Sat)',
      pickupService: true,
      minimumQuantity: { electronic: 1, metal: 5, plastic: 10 },
      rating: 4.6,
      reviews: 67,
      verified: true,
      paymentMethods: ['cash', 'upi', 'bank_transfer', 'cheque']
    }
  ];

  // Filter by scrap type
  if (scrapType) {
    buyers = buyers.filter(buyer => 
      buyer.specialization.includes(scrapType) && 
      buyer.currentRates[scrapType]
    );
  }

  // Filter by minimum price
  if (minPrice && scrapType) {
    buyers = buyers.filter(buyer => 
      buyer.currentRates[scrapType]?.rate >= parseFloat(minPrice)
    );
  }

  // Filter by radius
  if (radius) {
    buyers = buyers.filter(buyer => buyer.distance <= parseFloat(radius));
  }

  // Sort by price (descending) then by distance
  buyers.sort((a, b) => {
    if (scrapType && a.currentRates[scrapType] && b.currentRates[scrapType]) {
      const priceDiff = b.currentRates[scrapType].rate - a.currentRates[scrapType].rate;
      if (priceDiff !== 0) return priceDiff;
    }
    return a.distance - b.distance;
  });

  res.json({
    success: true,
    data: {
      buyers,
      totalFound: buyers.length,
      searchCriteria: {
        scrapType: scrapType || 'All types',
        radius: `${radius} km`,
        minPrice: minPrice ? `₹${minPrice}/kg` : 'Any price'
      },
      marketInsights: {
        averageRates: scrapType && buyers.length > 0 ? {
          [scrapType]: {
            average: buyers.reduce((sum, b) => sum + (b.currentRates[scrapType]?.rate || 0), 0) / buyers.length,
            highest: Math.max(...buyers.map(b => b.currentRates[scrapType]?.rate || 0)),
            lowest: Math.min(...buyers.map(b => b.currentRates[scrapType]?.rate || 0))
          }
        } : null
      }
    }
  });
}));

// @desc    Get active scrap listings
// @route   GET /api/shop/scrap/listings
// @access  Protected
router.get('/scrap/listings', protect, asyncHandler(async (req, res) => {
  const { scrapType, area, priceRange, condition } = req.query;
  const conditions = [{ field: 'status', operator: '==', value: 'active' }];

  if (scrapType) {
    conditions.push({ field: 'scrapType', operator: '==', value: scrapType });
  }
  if (area) {
    conditions.push({ field: 'pickupLocation.area', operator: '==', value: area });
  }
  if (condition) {
    conditions.push({ field: 'condition', operator: '==', value: condition });
  }

  let listings = await FirestoreService.getAll('scrap_listings', conditions, 'listedAt');

  // Filter by price range
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    listings = listings.filter(listing => 
      listing.pricePerKg >= min && listing.pricePerKg <= max
    );
  }

  // Remove expired listings
  const now = new Date();
  listings = listings.filter(listing => new Date(listing.expiresAt) > now);

  res.json({
    success: true,
    data: listings
  });
}));

export default router;