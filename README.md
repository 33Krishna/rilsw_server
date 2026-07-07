# Certificate Verification System - Backend

A robust Node.js backend API for certificate verification and student management system built with Express, TypeScript, and MongoDB.

## 🚀 Features

- **Student Authentication & Registration**: Secure student login with automatic certificate generation
- **Certificate Verification**: Public verification endpoints with QR code generation
- **Role-based Access Control**: Admin, Student, and Verifier roles
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **MongoDB Integration**: Scalable database with proper indexing
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **API Documentation**: Built-in API documentation endpoint
- **TypeScript**: Full TypeScript support with strict typing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/certificate_verification
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── config.ts     # Environment configuration
│   │   └── database.ts   # Database connection
│   ├── controllers/      # Route controllers
│   │   ├── authController.ts
│   │   └── certificateController.ts
│   ├── middleware/       # Custom middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── validation.ts # Input validation
│   │   └── errorHandler.ts # Error handling
│   ├── models/           # MongoDB models
│   │   ├── Student.ts
│   │   └── User.ts
│   ├── routes/           # API routes
│   │   ├── auth.ts
│   │   ├── certificates.ts
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── certificateUtils.ts
│   │   └── jwtUtils.ts
│   └── index.ts          # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/student-login` | Student login/registration | Public |
| POST | `/api/auth/login` | User login (admin/verifier) | Public |
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/profile` | Get current user profile | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Certificate Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/certificates/verify/:id` | Verify certificate by ID | Public |
| GET | `/api/certificates/verify-number/:certificateNo` | Verify by certificate number | Public |
| GET | `/api/certificates` | Get all certificates | Private (Admin/Verifier) |
| GET | `/api/certificates/:id` | Get certificate by ID | Private |
| PUT | `/api/certificates/:id` | Update certificate | Private (Admin) |
| DELETE | `/api/certificates/:id` | Delete certificate | Private (Admin) |
| GET | `/api/certificates/stats/overview` | Get statistics | Private (Admin/Verifier) |

### Utility Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api` | API documentation |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login/Register** to get access and refresh tokens
2. **Include token** in Authorization header: `Bearer <token>`
3. **Refresh token** when access token expires

### Role-based Access

- **Admin**: Full access to all endpoints
- **Verifier**: Can view and verify certificates
- **Student**: Can view their own certificate

## 📊 Database Models

### Student Model
```typescript
{
  certificateNo: string;      // Unique certificate number
  name: string;              // Student full name
  gender: 'male' | 'female';
  courseName: string;
  courseDuration: string;
  stream: string;
  fromDate: Date;
  toDate: Date;
  dateOfCompletion: Date;
  collegeRegdNo: string;     // College registration number
  collegeName?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Model
```typescript
{
  email: string;             // Unique email
  password: string;          // Hashed password
  role: 'admin' | 'student' | 'verifier';
  studentId?: ObjectId;      // Reference to Student (for student users)
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive validation
- **Password Hashing**: bcrypt for password security
- **JWT**: Secure token-based authentication
- **MongoDB Injection Protection**: Mongoose ODM

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 30d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas or production MongoDB
4. Set up proper CORS origins
5. Configure rate limiting appropriately

## 📚 API Examples

### Student Login
```bash
curl -X POST http://localhost:5000/api/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "gender": "male",
    "courseName": "Electric Vehicle Technology",
    "courseDuration": "Three months",
    "stream": "B. Tech 2nd Year 4th Semester Electrical Engineering",
    "fromDate": "2024-05-01",
    "toDate": "2024-07-31",
    "dateOfCompletion": "2024-07-27",
    "collegeRegdNo": "2421110112",
    "collegeName": "Government College of Engineering"
  }'
```

### Verify Certificate
```bash
curl http://localhost:5000/api/certificates/verify/64f8a1b2c3d4e5f6a7b8c9d0
```

### Get All Certificates (with auth)
```bash
curl http://localhost:5000/api/certificates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email mratikrishna@gmail.com or create an issue in the repository. 
