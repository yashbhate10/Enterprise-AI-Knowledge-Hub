-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO roles (name, description)
VALUES
('ADMIN', 'System Administrator'),
('MANAGER', 'Workspace Manager'),
('EMPLOYEE', 'Regular Employee')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users
(
    first_name,
    last_name,
    email,
    password
)
VALUES
(
    'System',
    'Administrator',
    'admin@enterpriseai.com',
    '$2a$10$placeholderEncryptedPassword'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT
    u.id,
    r.id
FROM users u
JOIN roles r
ON r.name='ADMIN'
WHERE u.email='admin@enterpriseai.com'
ON CONFLICT DO NOTHING;

INSERT INTO workspaces
(
    name,
    description,
    owner_id
)
SELECT
    'General',
    'Default workspace',
    id
FROM users
WHERE email='admin@enterpriseai.com';