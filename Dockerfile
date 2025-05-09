FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Create logs directory
RUN mkdir -p logs

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
