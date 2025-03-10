# Use official Node.js image
FROM node:18 AS dev

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for efficient caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all frontend files
COPY . .

# Expose frontend port
EXPOSE 3000

# Run Next.js in development mode
CMD ["npm", "run", "dev"]