/**
 * Database Layer for Cloudflare D1
 */

export async function initDb(db) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
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
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS task_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        task_name TEXT NOT NULL,
        status TEXT NOT NULL,
        output TEXT DEFAULT '',
        error TEXT DEFAULT '',
        duration_ms INTEGER DEFAULT 0,
        trigger_type TEXT DEFAULT 'cron',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_tasks_enabled ON tasks(enabled, next_run_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_task_logs_created ON task_logs(created_at DESC)`)
  ]);
}

// Settings
export async function getSetting(db, key) {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row ? row.value : null;
}

export async function setSetting(db, key, value) {
  await db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).bind(key, value).run();
}

// User / Auth
export async function getUserCount(db) {
  const result = await db.prepare('SELECT COUNT(*) as count FROM users').first();
  return result ? result.count : 0;
}

export async function getUserByUsername(db, username) {
  return await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
}

export async function getUserById(db, id) {
  return await db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').bind(id).first();
}

export async function createUser(db, username, passwordHash) {
  const res = await db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .bind(username, passwordHash)
    .run();
  return res.meta.last_row_id;
}

export async function updateUserPassword(db, userId, newPasswordHash) {
  await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newPasswordHash, userId)
    .run();
}

// Tasks
export async function getTasks(db) {
  const { results } = await db.prepare('SELECT * FROM tasks ORDER BY id DESC').all();
  return results || [];
}

export async function getTaskById(db, id) {
  return await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
}

export async function createTask(db, { name, description = '', cron, script, env_vars = '{}', enabled = 1, next_run_at }) {
  const res = await db.prepare(`
    INSERT INTO tasks (name, description, cron, script, env_vars, enabled, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(name, description, cron, script, env_vars, enabled, next_run_at).run();
  return res.meta.last_row_id;
}

export async function updateTask(db, id, { name, description, cron, script, env_vars, enabled, next_run_at }) {
  await db.prepare(`
    UPDATE tasks
    SET name = ?, description = ?, cron = ?, script = ?, env_vars = ?, enabled = ?, next_run_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, description, cron, script, env_vars, enabled, next_run_at, id).run();
}

export async function deleteTask(db, id) {
  await db.batch([
    db.prepare('DELETE FROM tasks WHERE id = ?').bind(id),
    db.prepare('DELETE FROM task_logs WHERE task_id = ?').bind(id)
  ]);
}

export async function toggleTask(db, id, enabled, next_run_at) {
  await db.prepare('UPDATE tasks SET enabled = ?, next_run_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(enabled ? 1 : 0, next_run_at, id)
    .run();
}

export async function getDueTasks(db, nowIsoString) {
  const { results } = await db.prepare(`
    SELECT * FROM tasks 
    WHERE enabled = 1 
      AND (next_run_at IS NULL OR next_run_at <= ?)
  `).bind(nowIsoString).all();
  return results || [];
}

export async function updateTaskRunResult(db, id, status, duration, nextRunAt) {
  await db.prepare(`
    UPDATE tasks
    SET last_status = ?, last_duration = ?, last_run_at = CURRENT_TIMESTAMP, next_run_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, duration, nextRunAt, id).run();
}

// Logs
export async function createLog(db, { task_id, task_name, status, output, error = '', duration_ms, trigger_type = 'cron' }) {
  const res = await db.prepare(`
    INSERT INTO task_logs (task_id, task_name, status, output, error, duration_ms, trigger_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(task_id, task_name, status, output, error, duration_ms, trigger_type).run();
  return res.meta.last_row_id;
}

export async function getLogs(db, { taskId, status, limit = 50, offset = 0 } = {}) {
  let query = 'SELECT * FROM task_logs';
  const conditions = [];
  const bindings = [];

  if (taskId) {
    conditions.push('task_id = ?');
    bindings.push(taskId);
  }
  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const { results } = await db.prepare(query).bind(...bindings).all();
  return results || [];
}

export async function getLogById(db, id) {
  return await db.prepare('SELECT * FROM task_logs WHERE id = ?').bind(id).first();
}

export async function clearLogs(db, taskId = null) {
  if (taskId) {
    await db.prepare('DELETE FROM task_logs WHERE task_id = ?').bind(taskId).run();
  } else {
    await db.prepare('DELETE FROM task_logs').run();
  }
}

export async function cleanOldLogs(db, retentionDays = 30) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 3600 * 1000).toISOString();
  await db.prepare('DELETE FROM task_logs WHERE created_at < ?').bind(cutoff).run();
}

/**
 * Pre-seed a clean demo task into D1 on initialization
 */
export async function seedInitialTasks(database, getNextCronRun) {
  const countRes = await database.prepare('SELECT COUNT(*) as count FROM tasks').first();
  if (countRes && countRes.count > 0) return;

  const starterTasks = [
    {
      name: '示例任务: API 可用性探测 (Health Check)',
      description: '定时向测试接口发起 HTTP GET 请求，记录响应状态与延迟',
      cron: '*/30 * * * *',
      script: 'http',
      env_vars: JSON.stringify({
        URL: 'https://httpbin.org/get',
        METHOD: 'GET',
        HEADERS: {
          'User-Agent': 'CF-Task-Scheduler/1.0'
        }
      }, null, 2),
      enabled: 1
    }
  ];

  for (const t of starterTasks) {
    let nextRunIso = null;
    if (typeof getNextCronRun === 'function') {
      try {
        nextRunIso = getNextCronRun(t.cron, new Date(), 8).toISOString();
      } catch {}
    }
    await createTask(database, {
      ...t,
      next_run_at: nextRunIso
    });
  }
}
