# Smart Waste Management System

A comprehensive waste management system with complete API architecture and responsive admin dashboard.

## 🚀 Features

### Backend APIs (12+ Modules)
- **Citizen Management & Training APIs** - Registration, training enrollment, certificate generation
- **Waste Worker Management APIs** - Worker registration, training phases, safety gear tracking
- **Green Champions APIs** - Area committee management, monitoring reports, performance tracking
- **Waste Generation & Source Segregation APIs** - Household and bulk generator registration
- **Waste Collection & Transportation APIs** - Vehicle management, route optimization, GPS tracking
- **Waste Treatment Facility APIs** - Facility registration, capacity monitoring, process logging
- **Digital Monitoring & Photo Upload APIs** - Geo-tagged reporting, dumping site tracking
- **Incentive & Penalty Management APIs** - Reward processing, penalty imposition, payment tracking
- **Community Participation APIs** - Event scheduling, campaign management, participation tracking
- **ULB Management APIs** - Urban Local Body registration, performance dashboards
- **Digital Shopping & Utilities APIs** - Product catalog, order management, recycling centers
- **Analytics & Reporting APIs** - Comprehensive analytics and performance metrics

### Frontend Admin Dashboard
- **Responsive Design** - Mobile-first design optimized for all devices
- **Real-time Analytics** - Interactive charts and data visualization
- **Role-based Access Control** - Secure authentication with JWT tokens
- **Comprehensive Management Panels** - 12+ specialized management interfaces
- **Modern UI/UX** - Clean, professional design with Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express.js, Firebase Firestore
- **Authentication**: JWT tokens with role-based access
- **Database**: Firebase Firestore (NoSQL)
- **Deployment**: Vercel (Full-stack deployment)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore enabled
- Vercel account for deployment

### Local Development

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd smart-waste-management-system
   npm install
   ```

2. **Firebase Setup**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Get your Firebase configuration from Project Settings

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Firebase configuration:
   ```env
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   This will start both the API server (port 3001) and React app (port 5173)

5. **Access the Application**
   - Admin Dashboard: http://localhost:5173
   - API Documentation: http://localhost:3001/api/health

### Default Login Credentials
- **Email**: admin@wastems.com
- **Password**: admin123

## 🚀 Deployment to Vercel

### Automatic Deployment (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub/GitLab
   - Connect your repository to Vercel
   - Vercel will automatically detect the configuration

2. **Set Environment Variables in Vercel**
   Go to your Vercel project settings and add these environment variables:
   ```
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - Both the API and frontend will be deployed together

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 📚 API Documentation

### Base URL
- **Local**: http://localhost:3001/api
- **Production**: https://your-app.vercel.app/api

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Core API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Citizens Management
- `POST /api/citizens/register` - Register new citizen
- `GET /api/citizens` - Get all citizens
- `GET /api/citizens/:id` - Get citizen by ID
- `PUT /api/citizens/profile` - Update citizen profile
- `POST /api/citizens/training/enroll` - Enroll in training
- `PUT /api/citizens/training/complete` - Complete training module

#### Workers Management
- `POST /api/workers/register` - Register waste worker
- `GET /api/workers/list` - Get workers by area/role
- `POST /api/workers/training/phase/:phase` - Enroll in training phase
- `GET /api/workers/safety-gear/status/:workerId` - Check safety gear status

#### Green Champions
- `POST /api/green-champions/register` - Register green champion
- `GET /api/green-champions/area/:areaId` - Get champions by area
- `POST /api/green-champions/monitoring/report` - Submit monitoring report
- `GET /api/green-champions/performance/:championId` - Get performance metrics

#### Waste Management
- `POST /api/waste/household/register` - Register household
- `POST /api/waste/bulk-generator/register` - Register bulk generator
- `GET /api/waste/segregation/guidelines` - Get segregation guidelines
- `POST /api/waste/segregation/violation` - Report violation

#### Collection & Transportation
- `POST /api/collection/vehicles/register` - Register collection vehicle
- `GET /api/collection/vehicles/location/:vehicleId` - Get vehicle location
- `GET /api/collection/routes/optimize` - Generate optimized routes
- `POST /api/collection/pickup/complete` - Mark pickup completion

#### Facilities Management
- `POST /api/facilities/register` - Register treatment facility
- `GET /api/facilities/capacity/:facilityId` - Get facility capacity
- `PUT /api/facilities/intake` - Log waste intake
- `GET /api/facilities/efficiency/:facilityId` - Get efficiency metrics

#### Monitoring System
- `POST /api/monitoring/photo-upload` - Upload geo-tagged photos
- `GET /api/monitoring/dumping-sites` - Get reported dumping sites
- `POST /api/monitoring/area-cleanliness/score` - Submit cleanliness score

#### Incentives & Penalties
- `POST /api/incentives/bulk-generator/reward` - Process segregation rewards
- `GET /api/incentives/citizen/points/:citizenId` - Get citizen points
- `POST /api/incentives/redeem` - Redeem reward points
- `POST /api/penalties/impose` - Impose penalty
- `PUT /api/penalties/payment` - Process penalty payment

#### Community Engagement
- `POST /api/community/cleaning-day/schedule` - Schedule cleaning event
- `GET /api/community/events` - Get community events
- `POST /api/community/awareness/campaign` - Create awareness campaign

#### ULB Management
- `POST /api/ulb/register` - Register ULB
- `GET /api/ulb/:ulbId/facilities` - Get ULB facilities
- `GET /api/ulb/performance/dashboard/:ulbId` - Get performance dashboard
- `GET /api/ulb/compliance/report/:ulbId` - Generate compliance report

#### Shop & Marketplace
- `GET /api/shop/compost-kits` - Get available compost kits
- `POST /api/shop/compost-kits/order` - Order compost kit
- `GET /api/shop/recycling-centers` - Get nearby recycling centers
- `POST /api/shop/scrap/sell` - Post scrap for selling

#### Analytics & Reports
- `GET /api/analytics/waste-generation/daily` - Daily waste generation data
- `GET /api/analytics/waste-treatment/efficiency` - Treatment efficiency metrics
- `GET /api/analytics/citizen-training/completion` - Training completion rates
- `GET /api/analytics/segregation/compliance` - Segregation compliance data

## 🗄️ Database Schema

### Firebase Firestore Collections

#### Core Collections
- **citizens** - Citizen registration and profile data
- **waste_workers** - Waste worker information and performance
- **green_champions** - Area committee members and supervisors
- **households** - Household waste generation registration
- **bulk_generators** - Commercial waste generator registration
- **waste_facilities** - Treatment facility information
- **collection_vehicles** - Waste collection vehicle fleet
- **collection_routes** - Optimized collection routes

#### Training & Compliance
- **training_enrollments** - Training module enrollments
- **certificates** - Training completion certificates
- **segregation_violations** - Waste segregation violations
- **monitoring_reports** - Community monitoring reports
- **cleanliness_assessments** - Area cleanliness scoring

#### Operations
- **waste_intake** - Facility waste intake logs
- **facility_process_logs** - Treatment process logging
- **pickup_records** - Collection pickup records
- **vehicle_locations** - Real-time vehicle tracking
- **work_schedules** - Worker schedule management

#### Community & Engagement
- **cleaning_events** - Community cleaning events
- **event_registrations** - Event participant registrations
- **awareness_campaigns** - Public awareness campaigns
- **government_participation** - Government employee participation

#### Commerce & Incentives
- **kit_orders** - Product order management
- **scrap_listings** - Scrap selling marketplace
- **incentive_rewards** - Reward point distribution
- **penalties** - Penalty and fine management
- **point_redemptions** - Reward point redemptions

#### Administration
- **ulbs** - Urban Local Body registration
- **ulb_policies** - ULB policy management
- **waste_management_status** - ULB performance tracking

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, ULB, Supervisor roles
- **Input Validation** - Comprehensive validation using Joi
- **Error Handling** - Robust error handling to prevent crashes
- **Rate Limiting** - API rate limiting for security
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Security headers and protection

## 📱 Responsive Design

The admin dashboard is fully responsive and optimized for:
- **Mobile Devices** (< 768px) - Touch-friendly interface with collapsible navigation
- **Tablets** (768px - 1024px) - Optimized layouts with proper spacing
- **Desktop** (> 1024px) - Full-featured interface with sidebar navigation

## 🎨 Design System

- **Color Palette**: Professional color scheme with semantic colors for different modules
- **Typography**: Consistent font hierarchy with proper line spacing
- **Spacing**: 8px grid system for consistent layouts
- **Components**: Reusable UI components with hover states and transitions
- **Icons**: Lucide React icons for consistent iconography

## 🔧 Development Guidelines

### Code Organization
- **Modular Architecture** - Separate files for each component/functionality
- **Clean Separation** - Clear separation between API routes, middleware, and utilities
- **Type Safety** - Full TypeScript implementation for type safety
- **Error Boundaries** - Comprehensive error handling throughout the application

### API Best Practices
- **RESTful Design** - Following REST principles for API design
- **Consistent Response Format** - Standardized JSON response structure
- **Comprehensive Validation** - Input validation for all endpoints
- **Proper HTTP Status Codes** - Appropriate status codes for different scenarios

## 📊 Monitoring & Analytics

The system includes comprehensive analytics for:
- **Waste Generation Tracking** - Daily waste generation patterns
- **Treatment Efficiency** - Facility performance monitoring
- **Citizen Engagement** - Training completion and participation rates
- **Compliance Monitoring** - Segregation compliance tracking
- **Financial Performance** - Revenue and penalty collection tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Note**: This system is designed to handle India's waste management challenges with a focus on citizen training, decentralized monitoring, and comprehensive digital infrastructure.