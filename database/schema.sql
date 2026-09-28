-- ============================================================
-- Enterprise AI Knowledge Hub
-- Database Schema
-- ============================================================

-- ==========================
-- Roles
-- ==========================

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- Users
-- ==========================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    enabled BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- User Roles
-- ==========================

CREATE TABLE IF NOT EXISTS user_roles (

    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    PRIMARY KEY(user_id, role_id),

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
);

-- ==========================
-- Workspaces
-- ==========================

CREATE TABLE IF NOT EXISTS workspaces (

    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    owner_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workspace_owner
        FOREIGN KEY(owner_id)
        REFERENCES users(id)
);

-- ==========================
-- Documents
-- ==========================

CREATE TABLE IF NOT EXISTS documents (

    id BIGSERIAL PRIMARY KEY,

    workspace_id BIGINT,

    uploaded_by BIGINT,

    file_name VARCHAR(255) NOT NULL,

    file_type VARCHAR(50),

    file_size BIGINT,

    storage_path TEXT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workspace
        FOREIGN KEY(workspace_id)
        REFERENCES workspaces(id),

    CONSTRAINT fk_uploaded_by
        FOREIGN KEY(uploaded_by)
        REFERENCES users(id)
);

-- ==========================
-- Document Versions
-- ==========================

CREATE TABLE IF NOT EXISTS document_versions (

    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT,

    version_number INT NOT NULL,

    storage_path TEXT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);

-- ==========================
-- Permissions
-- ==========================

CREATE TABLE IF NOT EXISTS permissions (

    id BIGSERIAL PRIMARY KEY,

    workspace_id BIGINT,

    user_id BIGINT,

    permission VARCHAR(50),

    CONSTRAINT fk_permission_workspace
        FOREIGN KEY(workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_permission_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================
-- Chat History
-- ==========================

CREATE TABLE IF NOT EXISTS chat_history (

    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    question TEXT,

    answer TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================
-- Activity Logs
-- ==========================

CREATE TABLE IF NOT EXISTS activity_logs (

    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    activity TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ==========================
-- Notifications
-- ==========================

CREATE TABLE IF NOT EXISTS notifications (

    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    title VARCHAR(255),

    message TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);