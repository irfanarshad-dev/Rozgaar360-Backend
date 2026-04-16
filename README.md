<div align="center">
  <img src="https://img.shields.io/badge/NestJS-12.0-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io" alt="Socket.io" />
</div>

<h1 align="center">🚀 Rozgaar360 - Backend API</h1>

<p align="center">
  <strong>A production-grade NestJS backend for Pakistan's leading job platform</strong>
</p>

<p align="center">
  RESTful API • Real-time Chat • AI Recommendations • Stripe Payments • JWT Auth • File Upload
</p>

<div align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-endpoints">API Endpoints</a> •
  <a href="#-deployment">Deployment</a>
</div>

---

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication with Passport.js
- **Role-Based Access Control**: Admin, Worker, and Customer roles
- **Password Security**: bcrypt hashing with salt rounds
- **Token Expiry**: Automatic token validation and refresh
- **Protected Routes**: Guards for role-based endpoint protection

### 👥 User Management
- **Multi-Role System**: Separate schemas for Admin, Worker, and Customer
- **Profile Management**: Complete CRUD operations for user profiles
- **CNIC Verification**: Document upload and admin approval workflow
- **Public Profiles**: Worker profiles visible to customers

### 📅 Booking System
- **Complete Lifecycle**: Pending → Confirmed → In Progress → Completed
- **Status Tracking**: Real-time booking status updates
- **History Management**: View past and active bookings
- **Cancellation**: Handle booking cancellations

### 💬 Real-time Chat
- **Socket.io Integration**: Bidirectional real-time communication
- **Conversation Management**: Create and manage conversations
- **Message History**: Persistent message storage
- **Online Status**: Track user online/offline status

### 💳 Payment Integration
- **Stripe Checkout**: Secure payment processing
- **Payment Tracking**: Link payments to bookings
- **Webhook Support**: Handle Stripe webhooks
- **Test Mode**: Sandbox environment for development

### ⭐ Review & Rating System
- **Customer Reviews**: Rate and review completed jobs
- **Star Ratings**: 1-5 star rating system
- **Review Display**: Show reviews on worker profiles
- **Average Calculation**: Automatic rating aggregation

### 🤖 AI-Powered Recommendations
- **Smart Matching**: Weighted scoring algorithm
- **Location-Based**: Filter by city and proximity
- **Skill Matching**: Match workers by required skills
- **Rating Priority**: Higher weight for quality ratings

### 📁 File Upload
- **Cloudinary Integration**: Secure cloud storage
- **CNIC Documents**: Front and back image upload
- **Validation**: File type and size restrictions
- **Secure URLs**: Cloudinary secure URLs

### 📧 Email Service
- **Nodemailer Integration**: Email notifications
- **Password Reset**: Email-based password recovery
- **Booking Confirmations**: Automated email notifications

### 🔔 Notifications
- **Real-time Notifications**: Instant updates
- **Notification Types**: Bookings, messages, reviews
- **Read/Unread Status**: Track notification status

---

## 🛠 Tech Stack

### Core Framework
- **[NestJS 12.0](https://nestjs.com/)** - Progressive Node.js framework
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Express](https://expressjs.com/)** - Web framework

### Database & ODM
- **[MongoDB 8.0](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose 8.19](https://mongoosejs.com/)** - MongoDB object modeling

### Authentication & Security
- **[@nestjs/jwt 11.0](https://docs.nestjs.com/security/authentication)** - JWT implementation
- **[@nestjs/passport 11.0](https://docs.nestjs.com/security/authentication)** - Authentication strategies
- **[bcrypt 6.0](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing
- **[helmet 8.1](https://helmetjs.github.io/)** - Security headers
- **[express-mongo-sanitize 2.2](https://github.com/fiznool/express-mongo-sanitize)** - NoSQL injection prevention

### Real-time Communication
- **[@nestjs/websockets 11.1](https://docs.nestjs.com/websockets/gateways)** - WebSocket support
- **[@nestjs/platform-socket.io 11.1](https://socket.io/)** - Socket.io integration
- **[socket.io 4.8](https://socket.io/)** - Real-time engine

### Payment Processing
- **[stripe 22.0](https://stripe.com/docs/api)** - Payment gateway integration

### File Upload & Storage
- **[cloudinary 1.41](https://cloudinary.com/documentation)** - Cloud storage
- **[multer 2.0](https://github.com/expressjs/multer)** - File upload middleware
- **[multer-storage-cloudinary 4.0](https://github.com/affanshahid/multer-storage-cloudinary)** - Cloudinary storage engine

### Email Service
- **[nodemailer 8.0](https://nodemailer.com/)** - Email sending

### Validation & Transformation
- **[class-validator 0.14](https://github.com/typestack/class-validator)** - Decorator-based validation
- **[class-transformer 0.5](https://github.com/typestack/class-transformer)** - Object transformation

### Rate Limiting
- **[@nestjs/throttler 6.5](https://docs.nestjs.com/security/rate-limiting)** - Rate limiting

### Development Tools
- **[Jest 30.0](https://jestjs.io/)** - Testing framework
- **[ESLint 9.18](https://eslint.org/)** - Code linting
- **[Prettier 3.4](https://prettier.io/)** - Code formatting

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
MongoDB >= 6.0 (Local or Atlas)
```

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/rozgaar360-backend.git
cd rozgaar360-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=3001
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Cloudinary Configuration
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (Nodemailer + Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

4. **Seed the database (Optional)**

```bash
npm run seed
```

5. **Run the development server**

```bash
npm run start:dev
```

Server will start on `http://localhost:3001`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── admin/                    # Admin management
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── admin.module.ts
│   │
│   ├── auth/                     # Authentication
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.guard.ts
│   │   └── auth.module.ts
│   │
│   ├── bookings/                 # Booking management
│   │   ├── booking.controller.ts
│   │   ├── booking.service.ts
│   │   └── booking.module.ts
│   │
│   ├── chat/                     # Real-time chat
│   │   ├── chat.controller.ts
│   │   ├── chat.gateway.ts
│   │   ├── chat.service.ts
│   │   └── chat.module.ts
│   │
│   ├── notifications/            # Notifications
│   │   ├── notification.controller.ts
│   │   └── notification.module.ts
│   │
│   ├── payments/                 # Payment processing
│   │   ├── payment.controller.ts
│   │   ├── stripe-payment.controller.ts
│   │   ├── stripe-payment.service.ts
│   │   └── payment.module.ts
│   │
│   ├── recommendations/          # AI recommendations
│   │   ├── recommendations.controller.ts
│   │   ├── recommendations.service.ts
│   │   └── recommendations.module.ts
│   │
│   ├── reviews/                  # Review system
│   │   ├── review.controller.ts
│   │   ├── review.service.ts
│   │   └── review.module.ts
│   │
│   ├── users/                    # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── verification/             # CNIC verification
│   │   ├── verification.controller.ts
│   │   ├── verification.service.ts
│   │   ├── cloudinary.config.ts
│   │   └── verification.module.ts
│   │
│   ├── dto/                      # Data Transfer Objects
│   │   ├── auth.dto.ts
│   │   ├── booking.dto.ts
│   │   ├── chat.dto.ts
│   │   └── review.dto.ts
│   │
│   ├── schemas/                  # MongoDB Schemas
│   │   ├── user.schema.ts
│   │   ├── worker.schema.ts
│   │   ├── customer.schema.ts
│   │   ├── admin.schema.ts
│   │   ├── booking.schema.ts
│   │   ├── conversation.schema.ts
│   │   ├── message.schema.ts
│   │   ├── notification.schema.ts
│   │   ├── payment.schema.ts
│   │   ├── review.schema.ts
│   │   └── password-reset.schema.ts
│   │
│   ├── services/                 # Shared services
│   │   ├── email.service.ts
│   │   ├── notification.service.ts
│   │   └── payment.service.ts
│   │
│   ├── app.module.ts             # Root module
│   ├── main.ts                   # Application entry
│   └── seed.ts                   # Database seeder
│
├── test/                         # E2E tests
├── .env                          # Environment variables
├── .gitignore
├── nest-cli.json                 # NestJS CLI config
├── package.json
├── tsconfig.json                 # TypeScript config
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
```http
POST   /api/auth/register              # User registration
POST   /api/auth/login                 # User login
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password with token
```

### Users
```http
GET    /api/users/me                   # Get current user (JWT required)
PUT    /api/users/me                   # Update profile (JWT required)
GET    /api/users/:id                  # Get user by ID
POST   /api/users/upload-photo         # Upload profile photo (JWT required)
```

### Bookings
```http
GET    /api/bookings/my-bookings       # Get user's bookings (JWT required)
POST   /api/bookings                   # Create booking (JWT required)
GET    /api/bookings/:id               # Get booking details (JWT required)
PUT    /api/bookings/:id               # Update booking status (JWT required)
DELETE /api/bookings/:id               # Cancel booking (JWT required)
```

### Payments
```http
GET    /api/payment/checkout           # Create Stripe checkout session
POST   /api/payments/stripe/callback   # Handle Stripe callback
GET    /api/payments/booking/:id       # Get payment for booking
```

### Chat
```http
GET    /api/conversations              # Get user conversations (JWT required)
POST   /api/conversations              # Create conversation (JWT required)
GET    /api/messages/:conversationId   # Get messages (JWT required)
POST   /api/messages                   # Send message (JWT required)
```

### Reviews
```http
POST   /api/reviews                    # Create review (JWT required)
GET    /api/reviews/worker/:workerId   # Get worker reviews
```

### Recommendations
```http
GET    /api/recommendations            # Get AI-powered recommendations
       ?city=Lahore&skill=Electrician&limit=10
```

### Notifications
```http
GET    /api/notifications              # Get user notifications (JWT required)
PUT    /api/notifications/:id/read     # Mark as read (JWT required)
```

### Verification (Workers)
```http
POST   /api/verification/upload        # Upload CNIC (JWT + Worker role)
```

### Admin
```http
GET    /api/admin/dashboard            # Dashboard stats (JWT + Admin role)
GET    /api/admin/users                # Get all users (JWT + Admin role)
GET    /api/admin/workers              # Get all workers (JWT + Admin role)
GET    /api/admin/verifications/pending # Pending verifications (JWT + Admin role)
PUT    /api/admin/verify/:id           # Approve/reject verification (JWT + Admin role)
```

---

## 🤖 AI Recommendation Algorithm

The recommendation system uses a weighted scoring formula:

```typescript
score = 0.7 × ratingNormalized + 0.3 × reviewCountNormalized
```

### Weight Distribution
- **Rating (70%)**: Quality of work is prioritized
- **Review Count (30%)**: Experience and trustworthiness

### Normalization
Min-Max scaling ensures fair comparison:
```typescript
normalized = (value - min) / (max - min)
```

### Filtering
1. Filter by city
2. Filter by skill
3. Calculate scores
4. Sort by score (descending)
5. Return top N results

---

## Deployments Tools

**Railway**
```bash
railway login
railway init
railway add
railway up
```

**AWS EC2**
```bash
# Install Node.js and MongoDB
npm install
npm run build
pm2 start dist/main.js --name rozgaar360-api
```

**Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/main"]
```

---

## 🔒 Security Best Practices

✅ **Environment Variables**: Never commit `.env` files  
✅ **JWT Secret**: Use strong, random secrets  
✅ **Password Hashing**: bcrypt with salt rounds  
✅ **Input Validation**: DTOs with class-validator  
✅ **Rate Limiting**: Throttler for API endpoints  
✅ **CORS**: Configure allowed origins  
✅ **Helmet**: Security headers enabled  
✅ **MongoDB Sanitization**: Prevent NoSQL injection  

---

## 📝 License

This project is part of a Final Year Project (FYP) for educational purposes.

---

## 👨💻 Team

**Rozgaar360 Development Team**
- GitHub: [@irfanarshad-dev](https://github.com/irfanarshad-dev)
- Email: dev.irfan077@gmail.com

---

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- MongoDB for the flexible database
- Stripe for secure payment processing
- Cloudinary for file storage
- All open-source contributors

---



<div align="center">
  <p>Made with ❤️ in Pakistan</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
