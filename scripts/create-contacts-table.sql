CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
