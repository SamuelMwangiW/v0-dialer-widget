-- Admin user seed
-- Password: admin123
-- Hash generated with bcrypt rounds=10
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@callcenter.com', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0/NA2qxFB8i', 'admin')
ON CONFLICT (email) DO NOTHING;
