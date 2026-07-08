FROM python:3.9-slim

# Set up a new user named "user" with UID 1000
RUN useradd -m -u 1000 user

WORKDIR /home/user/app

# Install dependencies as root to cache them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Switch to the non-root user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Copy application files and set ownership to "user"
COPY --chown=user . .

# Expose port
EXPOSE 7860

# Run the python server
CMD ["python", "server.py"]
