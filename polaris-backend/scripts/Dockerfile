# Use lightweight Python image
FROM python:3.11

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script only
COPY load_can_data.py ./

# Run the script automatically
CMD ["python", "load_can_data.py"]