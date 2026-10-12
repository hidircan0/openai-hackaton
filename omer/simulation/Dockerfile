FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY omer/simulation/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY omer/simulation ./omer/simulation

EXPOSE 8000
CMD ["uvicorn", "omer.simulation.main:app", "--host", "0.0.0.0", "--port", "8000"]
