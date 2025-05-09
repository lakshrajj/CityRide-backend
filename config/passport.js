const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const logger = require('../utils/logger');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id).select('-password');
        
        if (!user) {
          return done(null, false);
        }
        
        if (!user.isActive) {
          return done(null, false, { message: 'User account is deactivated' });
        }
        
        return done(null, user);
      } catch (err) {
        logger.error('Error authenticating user:', err);
        return done(err, false);
      }
    })
  );
};
