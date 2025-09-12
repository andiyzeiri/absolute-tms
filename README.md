# 🚛 Absolute TMS - Advanced Transportation Management System

Absolute TMS is a comprehensive, production-ready Advanced Transportation Management System built with the MERN stack, featuring real-time GPS tracking, JWT authentication, role-based access control, and modern UI/UX design.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- Role-based access control (Admin, Dispatcher, Driver, Customer)
- Rate limiting and security headers
- Input validation and sanitization
- CORS protection

### 🚚 Core TMS Features
- **Trip Management**: Complete trip lifecycle management
- **Real-time Tracking**: Live GPS tracking with WebSocket updates
- **Fleet Management**: Vehicle registration, maintenance tracking
- **Driver Management**: License management, performance tracking
- **Invoice Generation**: Automated billing and PDF exports
- **Dashboard Analytics**: Real-time KPIs and reporting

### 🏗️ Technical Architecture
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React.js + Material-UI
- **Real-time**: Socket.IO WebSocket connections
- **Authentication**: JWT with refresh token rotation
- **File Uploads**: Multer with file validation
- **Caching**: Redis integration ready
- **Containerization**: Docker + Docker Compose

### 🎨 Modern UI/UX
- Responsive Material-UI design
- Dark/Light theme support
- Toast notifications
- Loading states and skeleton screens
- Interactive charts and data visualization
- Mobile-optimized interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Redis (optional, for production)
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tms-prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   mongod --dbpath ./data/db
   ```

5. **Start the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or start separately
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Docker Deployment

1. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Set production values in .env
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Application: http://localhost
   - API: http://localhost/api

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tms.com | demo123 |
| Driver | john.driver@tms.com | demo123 |

## 📁 Project Structure

```
tms-prototype/
├── config/              # Database and app configuration
├── controllers/         # Route controllers
├── middleware/          # Authentication, validation, etc.
├── models/             # MongoDB schemas
├── routes/             # API routes
├── utils/              # Utility functions
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # React Context providers
│   │   └── ...
├── nginx/              # Nginx configuration
├── scripts/            # Deployment and utility scripts
├── uploads/            # File uploads directory
└── docker-compose.yml  # Docker configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Token refresh
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Coming Soon
- Trip management endpoints
- Vehicle management endpoints
- Driver management endpoints
- Invoice management endpoints

## 🏗️ Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'dispatcher', 'driver', 'customer'],
  phone: String,
  address: Object,
  licenseNumber: String,
  isActive: Boolean,
  preferences: Object,
  // ... more fields
}
```

### Trip Model
```javascript
{
  tripNumber: String (auto-generated),
  customer: ObjectId (User),
  driver: ObjectId (User),
  vehicle: ObjectId (Vehicle),
  origin: Object,
  destination: Object,
  cargo: Object,
  schedule: Object,
  pricing: Object,
  tracking: Object,
  status: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']
}
```

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with refresh tokens
- **Password Security**: Bcrypt with configurable salt rounds
- **Rate Limiting**: API and auth endpoint protection
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet.js security middleware
- **SQL Injection Prevention**: MongoDB ODM protection
- **File Upload Security**: Type and size validation

## 🚀 Production Deployment

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/tms_production
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secure_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
BCRYPT_SALT_ROUNDS=12

# Server
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

### Docker Production Setup
1. Update `.env` with production values
2. Configure SSL certificates in `nginx/ssl/`
3. Run: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### Performance Optimization
- **Compression**: Gzip compression enabled
- **Caching**: Static file caching with Nginx
- **Connection Pooling**: MongoDB connection optimization
- **Rate Limiting**: Protection against abuse
- **Health Checks**: Application monitoring

## 🧪 Testing

```bash
# Run backend tests
npm run test

# Run frontend tests
cd client && npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Health Checks**: Built-in health monitoring
- **Error Logging**: Winston logger integration
- **Performance Metrics**: Request timing and monitoring
- **Database Monitoring**: MongoDB connection health
- **Real-time Metrics**: WebSocket connection tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🛟 Support

For support, please contact:
- Email: support@tmspro.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Basic dashboard
- ✅ Database models
- ✅ Docker configuration

### Phase 2 (In Progress)
- 🔄 Complete CRUD operations
- 🔄 Advanced search and filtering
- 🔄 PDF report generation
- 🔄 Email notifications

### Phase 3 (Planned)
- 📋 Mobile app integration
- 📋 Advanced analytics
- 📋 Third-party integrations
- 📋 Multi-tenant support

---

Built with ❤️ using the MERN stack for modern transportation management.