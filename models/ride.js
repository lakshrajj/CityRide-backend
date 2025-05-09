const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    address: {
      type: String,
      required: [true, 'Source address is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  destination: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  intermediateStops: [{
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    }
  }],
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  estimatedArrivalTime: {
    type: Date
  },
  seatsAvailable: {
    type: Number,
    required: [true, 'Number of available seats is required'],
    min: [1, 'At least one seat must be available']
  },
  seatsTotal: {
    type: Number,
    required: [true, 'Total number of seats is required']
  },
  pricePerSeat: {
    type: Number,
    required: [true, 'Price per seat is required'],
    min: [0, 'Price cannot be negative']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  vehicleDetails: {
    model: String,
    color: String,
    licensePlate: String
  },
  preferences: {
    smoking: {
      type: Boolean,
      default: false
    },
    pets: {
      type: Boolean,
      default: false
    },
    music: {
      type: Boolean,
      default: true
    },
    luggage: {
      type: Boolean,
      default: true
    }
  },
  additionalNotes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'weekdays', 'weekends', 'custom'],
    },
    days: [Number], // 0-6 representing Sunday-Saturday
    endDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial indexes for location-based queries
RideSchema.index({ 'source.location': '2dsphere' });
RideSchema.index({ 'destination.location': '2dsphere' });

// Update the timestamps before saving
RideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ride', RideSchema);
