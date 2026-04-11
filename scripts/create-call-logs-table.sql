CREATE TABLE IF NOT EXISTS call_logs (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('answered', 'missed', 'declined', 'voicemail', 'transferred')),
  duration INTEGER DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
