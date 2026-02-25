CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP,
  tenant VARCHAR(50),
  source VARCHAR(50),
  event_type VARCHAR(50),
  user_name VARCHAR(50),
  src_ip VARCHAR(50),
  raw JSONB,
  severity VARCHAR(10)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password TEXT,
  role VARCHAR(20),
  tenant VARCHAR(50)
);