/**
 * Helper function to calculate distance between two points using Haversine formula
 * @param {Array} coords1 - [longitude, latitude] of point 1
 * @param {Array} coords2 - [longitude, latitude] of point 2
 * @returns {Number} - Distance in kilometers
 */
exports.calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

/**
 * Convert degrees to radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Helper function to estimate travel time between two points
 * @param {Array} coords1 - [longitude, latitude] of point 1
 * @param {Array} coords2 - [longitude, latitude] of point 2
 * @param {Number} avgSpeed - Average speed in km/h
 * @returns {Number} - Estimated travel time in minutes
 */
exports.estimateTravelTime = (coords1, coords2, avgSpeed = 40) => {
  const distance = exports.calculateDistance(coords1, coords2);
  // Time in hours = distance / speed
  // Convert to minutes
  return Math.round((distance / avgSpeed) * 60);
};

/**
 * Generate a unique confirmation code
 * @returns {String} - 8-character alphanumeric code
 */
exports.generateConfirmationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {String} - Formatted date string
 */
exports.formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Filter out sensitive data from user object
 * @param {Object} user - User object
 * @returns {Object} - Filtered user object
 */
exports.filterUserData = (user) => {
  const { password, resetPasswordToken, resetPasswordExpire, ...filteredUser } = user;
  return filteredUser;
};

/**
 * Process pagination parameters from query
 * @param {Object} query - Request query object
 * @returns {Object} - Pagination options
 */
exports.getPaginationOptions = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  return {
    page,
    limit,
    startIndex,
    skip: startIndex,
  };
};

/**
 * Create pagination result with metadata
 * @param {Object} paginationOptions - Pagination options
 * @param {Number} total - Total number of documents
 * @returns {Object} - Pagination metadata
 */
exports.createPaginationResult = (paginationOptions, total) => {
  const { page, limit } = paginationOptions;
  const totalPages = Math.ceil(total / limit);
  
  const pagination = {
    total,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
  
  return pagination;
};
