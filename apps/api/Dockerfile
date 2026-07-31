# Build context is the REPO ROOT (so the shared fusion package is available).
#   docker build -f apps/api/Dockerfile .
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# System deps for building wheels (asyncpg, bcrypt/cffi).
RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt apps/api/requirements.txt
RUN pip install --no-cache-dir -r apps/api/requirements.txt

# Preserve the monorepo layout: config.py resolves packages/fusion via parents[4].
COPY packages/fusion packages/fusion
COPY apps/api apps/api

WORKDIR /app/apps/api
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
