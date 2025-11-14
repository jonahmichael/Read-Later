# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
# --no-cache-dir ensures that pip doesn't store downloaded packages locally, reducing image size.
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port that the app will run on. Cloud Run expects containers to listen on PORT 8080 by default.
ENV PORT 8080
EXPOSE $PORT

# Run Gunicorn when the container launches.
# Gunicorn is a production-ready WSGI HTTP Server.
# --bind :$PORT tells Gunicorn to listen on the port defined by the PORT environment variable.
# --workers 1: For a small free-tier app, 1 worker is often sufficient.
# --threads 8: Use multiple threads for concurrent requests within a worker.
# app:app refers to the 'app' variable (your Flask instance) inside the 'app.py' file.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 app:app
