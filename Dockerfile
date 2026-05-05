# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.13-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=True

# Create and change to the app directory.
WORKDIR /app

# Copy application dependency manifests to the container image.
# Copying this separately prevents re-running pip install on every code change.
COPY requirements.txt ./

# Install dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup using uvicorn.
# Cloud Run injects the PORT environment variable (default 8080)
CMD exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}
