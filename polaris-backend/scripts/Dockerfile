FROM python:3.11

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the data loader script
COPY load_data.py ./

CMD ["python", "load_data.py"]