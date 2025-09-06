-- Initialize The AXIS database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create custom types for article status
CREATE TYPE article_status AS ENUM (
    'draft',
    'in_review',
    'needs_revision',
    'approved',
    'scheduled',
    'published',
    'archived'
);

-- Create custom types for user roles
CREATE TYPE user_role AS ENUM (
    'reader',
    'staff',
    'section_head',
    'editor_in_chief',
    'adviser'
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE theaxis_dev TO theaxis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO theaxis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO theaxis_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO theaxis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO theaxis_user;
