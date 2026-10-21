-- Cloudflare D1 Database Schema for Task Scheduler

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cron TEXT NOT NULL,
    script TEXT NOT NULL,
    env_vars TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    last_run_at TIMESTAMP,
    last_status TEXT DEFAULT 'pending',
    last_duration INTEGER DEFAULT 0,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success' | 'failed'
    output TEXT DEFAULT '',
    error TEXT DEFAULT '',
    duration_ms INTEGER DEFAULT 0,
    trigger_type TEXT DEFAULT 'cron', -- 'cron' | 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_enabled_next_run ON tasks(enabled, next_run_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at DESC);
