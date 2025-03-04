# Use the official Go image for development
FROM golang:1.21 AS dev

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies
RUN go mod tidy

# Expose backend port
EXPOSE 5000

# Run backend in development mode
CMD ["go", "run", "main.go"]