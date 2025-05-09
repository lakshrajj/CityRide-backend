const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport middleware
app.use(passport.initialize());
require('./config/passport')(passport);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Carpooling API',
      version: '1.0.0',
      description: 'A local carpooling application API',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import and use routes
app.use('/api/v1', require('./routes/index'));

// Serve static assets for admin panel in production
if (process.env.NODE_ENV === 'production') {
  app.use('/admin', express.static(path.join(__dirname, 'admin/build')));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/build', 'index.html'));
  });
}

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;
