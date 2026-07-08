FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Hugging Face Spaces expects the app to bind to port 7860
EXPOSE 7860
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Run the python server
CMD ["python", "server.py"]
