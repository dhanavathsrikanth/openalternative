-- 0024_add_reports_table.sql

-- Create report reason enum
CREATE TYPE report_reason AS ENUM (
    'broken_link',
    'incorrect',
    'outdated',
    'spam',
    'inappropriate',
    'other'
);

-- Create report status enum
CREATE TYPE report_status AS ENUM (
    'pending',
    'resolved',
    'dismissed'
);

-- Create reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reporter_id INTEGER REFERENCES contributors(id) ON DELETE SET NULL,
    reason report_reason NOT NULL,
    detail TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolver_id TEXT
);

-- Index for filtering by product
CREATE INDEX reports_product_id_idx ON reports(product_id);

-- Index for filtering by status
CREATE INDEX reports_status_idx ON reports(status);

-- Index for filtering by reporter
CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);

-- Prevent duplicate pending reports from same reporter on same product for same reason
CREATE UNIQUE INDEX reports_pending_unique_idx
    ON reports(product_id, reporter_id, reason)
    WHERE status = 'pending';