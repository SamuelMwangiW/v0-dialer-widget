-- Seed agents table with mock data
INSERT INTO agents (name, extension, status) VALUES
  ('Sarah Johnson', 101, 'online'),
  ('Michael Chen', 102, 'online'),
  ('Emily Davis', 103, 'busy'),
  ('David Wilson', 104, 'online'),
  ('Jessica Brown', 105, 'away')
ON CONFLICT (id) DO NOTHING;
