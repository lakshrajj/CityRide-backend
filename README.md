# CityRide - Local Carpooling Application Backend

A comprehensive Node.js + Express backend for a local carpooling application, with MongoDB as the database.

## Features

- **User Management**:
  - Registration and authentication (JWT-based)
  - User profiles with passenger/driver roles
  - Email verification and phone verification (OTP)
  - Password reset functionality

- **Ride Management**:
  - Create, update, and manage rides
  - Advanced ride search with filters
  - Support for recurring rides
  - Ride status tracking (scheduled, in-progress, completed, cancelled)

- **Booking System**:
  - Request, approve, and reject booking requests
  - Booking status tracking
  - Support for custom pickup/dropoff points

- **Rating and Review System**:
  - Rate and review drivers and passengers
  - Category-based ratings (punctuality, cleanliness, etc.)
  - Rating statistics and history

- **Notifications**:
  - In-app notifications
  - Email notifications
  - Push notifications (Firebase)
  - SMS notifications (Twilio)

- **Admin Panel**:
  - User management
  - Ride monitoring
  - Booking oversight
  - System-wide notifications
  - Dashboard with statistics

- **Security**:
  - JWT-based authentication
  - Role-based access control
  - Input validation
  - Rate limiting
  - Helmet security headers

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Passport.js
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Notifications**: Nodemailer, Firebase Admin, Twilio
- **Security**: Helmet, Rate-limiting, bcrypt
- **Containerization**: Docker, Docker Compose
- **Logging**: Winston

## Prerequisites

- Node.js (16.x or higher)
- MongoDB (4.x or higher)
- Docker and Docker Compose (optional, for containerized deployment)

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/carpooling-app.git
   cd carpooling-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values.

5. Start the development server:
   ```bash
   npm run dev
   ```

### Using Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/carpooling-app.git
   cd carpooling-app
   ```

2. Create a `.env` file based on the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration values.

4. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

## API Documentation

The API is documented using Swagger/OpenAPI. After starting the server, you can access the documentation at:

```
http://localhost:5000/api-docs
```

## Project Structure

```
carpooling-app/
├── config/                 # Configuration files
├── controllers/            # Request handlers
├── middlewares/            # Express middlewares
├── models/                 # Mongoose models
├── routes/                 # API routes
├── services/               # External services (email, SMS, etc.)
├── utils/                  # Utility functions
├── logs/                   # Log files
├── .env.example            # Environment variables example
├── .gitignore              # Git ignore file
├── app.js                  # Express app setup
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration
├── package.json            # Project dependencies
├── README.md               # Project documentation
└── server.js               # Server entry point
```

## Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with nodemon
- `npm test`: Run tests
- `npm run lint`: Run ESLint

## API Endpoints

The API provides the following main endpoints:

- **Authentication**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Rides**: `/api/v1/rides/*`
- **Bookings**: `/api/v1/bookings/*`
- **Ratings**: `/api/v1/ratings/*`
- **Notifications**: `/api/v1/notifications/*`
- **Admin**: `/api/v1/admin/*`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
