FROM python:3.12-slim

# certs for SSL + clean image
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# app code
COPY postgres.py .

# helpful default
ENV PYTHONUNBUFFERED=1

CMD ["python", "postgres.py"]

EXPOSE 5432