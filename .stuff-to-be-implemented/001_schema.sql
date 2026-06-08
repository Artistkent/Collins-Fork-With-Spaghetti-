-- Full schema for the project management platform.
-- Run this once in your Neon SQL editor.

-- Project registry: one row per project
CREATE TABLE IF NOT EXISTS project_registry (
  project_code   TEXT PRIMARY KEY,
  project_name   TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  admin_password TEXT NOT NULL,
  brief          TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks: scoped to project
CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER NOT NULL,
  project_code TEXT    NOT NULL REFERENCES project_registry(project_code) ON DELETE CASCADE,
  description  TEXT    NOT NULL DEFAULT '',
  bucket_id    TEXT,             -- FK to project_buckets.id (nullable = unassigned)
  start_date   DATE,
  end_date     DATE,
  status       TEXT    NOT NULL DEFAULT 'Not Started',
  priority     TEXT    NOT NULL DEFAULT 'Medium',
  notes        TEXT    NOT NULL DEFAULT '',
  pct          INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ,
  PRIMARY KEY (id, project_code)
);

-- Authority buckets: groups of tasks with a login code
CREATE TABLE IF NOT EXISTS project_buckets (
  id           TEXT PRIMARY KEY,          -- client-generated timestamp string
  project_code TEXT NOT NULL REFERENCES project_registry(project_code) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  code         TEXT NOT NULL,             -- the login code, e.g. "DESIGN-X4"
  color        TEXT NOT NULL DEFAULT '#40916C',
  task_ids     JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_code, code)             -- codes must be unique per project
);

-- Bucket members: people who have logged in via a bucket code
CREATE TABLE IF NOT EXISTS bucket_members (
  bucket_id   TEXT NOT NULL REFERENCES project_buckets(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  project_code TEXT NOT NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket_id, member_name)
);

-- RACI state: one JSON blob per project
CREATE TABLE IF NOT EXISTS raci_state (
  project_code TEXT PRIMARY KEY REFERENCES project_registry(project_code) ON DELETE CASCADE,
  data         TEXT NOT NULL DEFAULT '{}',
  saved_by     TEXT NOT NULL DEFAULT '',
  saved_at     TEXT NOT NULL DEFAULT ''
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project      ON tasks(project_code);
CREATE INDEX IF NOT EXISTS idx_buckets_project    ON project_buckets(project_code);
CREATE INDEX IF NOT EXISTS idx_buckets_code       ON project_buckets(code);
CREATE INDEX IF NOT EXISTS idx_bucket_members_bid ON bucket_members(bucket_id);
