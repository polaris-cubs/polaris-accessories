FROM golang:1.23

# Install Air for hot reloading using the new module path
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# Copy go.mod and download dependencies
COPY go.mod .
RUN go mod download

# Copy the rest of the source code
COPY . .

EXPOSE 8080

CMD ["air"]