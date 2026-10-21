/**
 * Cloudflare Task Scheduler Main Entrypoint
 * Handles HTTP requests (Dashboard & REST API) and Scheduled Cron Triggers
 */

import { renderDashboardHtml } from './ui.js';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from './auth.js';
import { getNextCronRun, describeCron } from './cron.js';
import { executeScript } from './runner.js';
import { TEMPLATES } from './templates.js';
import * as db from './db.js';

// Get or auto-generate stable JWT Secret
async function getJwtSecret(database, env) {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  let secret = await db.getSetting(database, 'jwt_secret');
  if (!secret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    await db.setSetting(database, 'jwt_secret', secret);
  }
  return secret;
}

// Extract session token from Cookie or Authorization header
function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// JSON Response helper
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

async function getSystemTimezone(database, env) {
  const tz = await db.getSetting(database, 'timezone');
  return tz || env.TIMEZONE || 'Asia/Shanghai';
}

// Execute scheduled tasks
async function handleScheduledEvent(env) {
  const database = env.DB;
  await db.initDb(database);

  const tz = await getSystemTimezone(database, env);
  const now = new Date();
  const nowIso = now.toISOString();

  // Find all due tasks
  const dueTasks = await db.getDueTasks(database, nowIso);
  console.log(`[Scheduler] Cron triggered (${tz}): Found ${dueTasks.length} due task(s) to execute`);

  for (const task of dueTasks) {
    console.log(`[Scheduler] Executing task #${task.id}: ${task.name}`);
    let envVars = {};
    try {
      envVars = JSON.parse(task.env_vars || '{}');
    } catch {
      envVars = {};
    }

    const runResult = await executeScript(task.script, envVars, env);

    // Save execution log
    await db.createLog(database, {
      task_id: task.id,
      task_name: task.name,
      status: runResult.success ? 'success' : 'failed',
      output: runResult.output,
      error: runResult.error || '',
      duration_ms: runResult.durationMs,
      trigger_type: 'cron'
    });

    // Calculate next run time
    let nextRunIso = null;
    try {
      const nextRunDate = getNextCronRun(task.cron, new Date(), tz);
      nextRunIso = nextRunDate.toISOString();
    } catch (e) {
      console.error(`[Scheduler] Failed to calculate next run time for #${task.id}:`, e);
    }

    // Update task status and next run time
    await db.updateTaskRunResult(
      database,
      task.id,
      runResult.success ? 'success' : 'failed',
      runResult.durationMs,
      nextRunIso
    );
  }

  // Auto clean logs older than retention period
  const retentionDays = parseInt(env.MAX_LOG_RETENTION_DAYS || '30', 10);
  await db.cleanOldLogs(database, retentionDays);
}

export default {
  /**
   * Cloudflare Cron Trigger Handler
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduledEvent(env));
  },

  /**
   * HTTP Fetch Handler (Dashboard UI & REST API)
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const database = env.DB;

    // Auto initialize schema if needed
    await db.initDb(database);

    // Route: Static Web Dashboard
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(renderDashboardHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Route: Get template definition
    if (url.pathname.startsWith('/api/templates/')) {
      const key = url.pathname.replace('/api/templates/', '');
      const tpl = TEMPLATES[key];
      if (!tpl) return jsonResponse({ error: '模板不存在' }, 404);
      return jsonResponse(tpl);
    }

    // Route: Auth check
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const count = await db.getUserCount(database);
      if (count === 0) {
        return jsonResponse({ uninitialized: true });
      }

      const jwtSecret = await getJwtSecret(database, env);
      const token = extractToken(request);
      const session = await verifySessionToken(token, jwtSecret);

      if (!session) {
        return jsonResponse({ user: null });
      }

      const user = await db.getUserById(database, session.sub);
      const timezone = await getSystemTimezone(database, env);
      return jsonResponse({ user, timezone });
    }

    // Route: Initialize first admin user
    if (url.pathname === '/api/auth/init' && request.method === 'POST') {
      const count = await db.getUserCount(database);
      if (count > 0) {
        return jsonResponse({ error: '系统已完成初始化，禁止重复设置' }, 400);
      }

      const { username, password } = await request.json();
      if (!username || !password || password.length < 8) {
        return jsonResponse({ error: '密码长度至少需8位字符' }, 400);
      }

      const passwordHash = await hashPassword(password);
      const userId = await db.createUser(database, username, passwordHash);

      // Pre-seed clean starter task into D1
      const tz = await getSystemTimezone(database, env);
      await db.seedInitialTasks(database, (cron, date) => getNextCronRun(cron, date, tz));

      const jwtSecret = await getJwtSecret(database, env);
      const sessionToken = await createSessionToken(
        { sub: userId, username, exp: Date.now() + 7 * 24 * 3600 * 1000 },
        jwtSecret
      );

      return jsonResponse(
        { success: true, user: { id: userId, username } },
        200,
        {
          'Set-Cookie': `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        }
      );
    }

    // Route: User Login
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const { username, password } = await request.json();
      const user = await db.getUserByUsername(database, username);

      if (!user) {
        return jsonResponse({ error: '用户名或密码错误' }, 401);
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return jsonResponse({ error: '用户名或密码错误' }, 401);
      }

      const jwtSecret = await getJwtSecret(database, env);
      const sessionToken = await createSessionToken(
        { sub: user.id, username: user.username, exp: Date.now() + 7 * 24 * 3600 * 1000 },
        jwtSecret
      );

      return jsonResponse(
        { success: true, user: { id: user.id, username: user.username } },
        200,
        {
          'Set-Cookie': `session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        }
      );
    }

    // Route: Logout
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return jsonResponse({ success: true }, 200, {
        'Set-Cookie': 'session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      });
    }

    // --- Authentication Barrier for Management APIs ---
    const jwtSecret = await getJwtSecret(database, env);
    const token = extractToken(request);
    const session = await verifySessionToken(token, jwtSecret);

    if (!session) {
      return jsonResponse({ error: '未授权或登录已过期' }, 401);
    }

    // Route: Change Password
    if (url.pathname === '/api/auth/password' && request.method === 'POST') {
      const { oldPassword, newPassword } = await request.json();
      if (!newPassword || newPassword.length < 8) {
        return jsonResponse({ error: '新密码至少需 8 位字符' }, 400);
      }

      const user = await db.getUserByUsername(database, session.username);
      if (!user) return jsonResponse({ error: '用户不存在' }, 404);

      const isOldValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isOldValid) {
        return jsonResponse({ error: '原旧密码验证错误' }, 400);
      }

      const newHash = await hashPassword(newPassword);
      await db.updateUserPassword(database, user.id, newHash);

      return jsonResponse({ success: true, message: '密码已成功更新' });
    }

    // Route: List Tasks
    if (url.pathname === '/api/tasks' && request.method === 'GET') {
      let tasks = await db.getTasks(database);
      const tz = await getSystemTimezone(database, env);
      if (tasks.length === 0) {
        await db.seedInitialTasks(database, (cron, date) => getNextCronRun(cron, date, tz));
        tasks = await db.getTasks(database);
      }
      return jsonResponse({ tasks });
    }

    // Route: Create Task
    if (url.pathname === '/api/tasks' && request.method === 'POST') {
      const body = await request.json();
      const { name, description, cron, script, env_vars } = body;

      if (!name || !cron || !script) {
        return jsonResponse({ error: '名称、Cron 规则和执行脚本不可为空' }, 400);
      }

      const tz = await getSystemTimezone(database, env);
      let nextRunIso = null;
      try {
        const nextDate = getNextCronRun(cron, new Date(), tz);
        nextRunIso = nextDate.toISOString();
      } catch (err) {
        return jsonResponse({ error: 'Cron 规则解析失败: ' + err.message }, 400);
      }

      const taskId = await db.createTask(database, {
        name,
        description: description || '',
        cron,
        script,
        env_vars: typeof env_vars === 'object' ? JSON.stringify(env_vars) : (env_vars || '{}'),
        enabled: 1,
        next_run_at: nextRunIso
      });

      return jsonResponse({ success: true, taskId });
    }

    // Route: Update Task
    if (url.pathname.startsWith('/api/tasks/') && request.method === 'PUT') {
      const id = parseInt(url.pathname.replace('/api/tasks/', ''), 10);
      const body = await request.json();
      const { name, description, cron, script, env_vars } = body;

      const existing = await db.getTaskById(database, id);
      if (!existing) return jsonResponse({ error: '任务不存在' }, 404);

      const tz = await getSystemTimezone(database, env);
      let nextRunIso = existing.next_run_at;
      try {
        const nextDate = getNextCronRun(cron, new Date(), tz);
        nextRunIso = nextDate.toISOString();
      } catch (err) {
        return jsonResponse({ error: 'Cron 规则解析失败: ' + err.message }, 400);
      }

      await db.updateTask(database, id, {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        cron: cron || existing.cron,
        script: script || existing.script,
        env_vars: typeof env_vars === 'object' ? JSON.stringify(env_vars) : (env_vars || existing.env_vars),
        enabled: existing.enabled,
        next_run_at: nextRunIso
      });

      return jsonResponse({ success: true });
    }

    // Route: Delete Task
    if (url.pathname.startsWith('/api/tasks/') && request.method === 'DELETE') {
      const id = parseInt(url.pathname.replace('/api/tasks/', ''), 10);
      await db.deleteTask(database, id);
      return jsonResponse({ success: true });
    }

    // Route: Toggle Task Enabled / Disabled
    if (url.pathname.match(/^\/api\/tasks\/(\d+)\/toggle$/) && request.method === 'POST') {
      const match = url.pathname.match(/^\/api\/tasks\/(\d+)\/toggle$/);
      const id = parseInt(match[1], 10);
      const task = await db.getTaskById(database, id);
      if (!task) return jsonResponse({ error: '任务不存在' }, 404);

      const tz = await getSystemTimezone(database, env);
      const newEnabled = task.enabled ? 0 : 1;
      let nextRunIso = null;
      if (newEnabled) {
        try {
          const nextDate = getNextCronRun(task.cron, new Date(), tz);
          nextRunIso = nextDate.toISOString();
        } catch {
          nextRunIso = null;
        }
      }

      await db.toggleTask(database, id, newEnabled, nextRunIso);
      return jsonResponse({ success: true, enabled: newEnabled });
    }

    // Route: Trigger manual execution of a task
    if (url.pathname.match(/^\/api\/tasks\/(\d+)\/run$/) && request.method === 'POST') {
      const match = url.pathname.match(/^\/api\/tasks\/(\d+)\/run$/);
      const id = parseInt(match[1], 10);
      const task = await db.getTaskById(database, id);
      if (!task) return jsonResponse({ error: '任务不存在' }, 404);

      let envVars = {};
      try {
        envVars = JSON.parse(task.env_vars || '{}');
      } catch {
        envVars = {};
      }

      const result = await executeScript(task.script, envVars, env);

      // Save execution log
      const logId = await db.createLog(database, {
        task_id: task.id,
        task_name: task.name,
        status: result.success ? 'success' : 'failed',
        output: result.output,
        error: result.error || '',
        duration_ms: result.durationMs,
        trigger_type: 'manual'
      });

      // Update task last status
      const tz = await getSystemTimezone(database, env);
      let nextRunIso = task.next_run_at;
      if (task.enabled) {
        try {
          nextRunIso = getNextCronRun(task.cron, new Date(), tz).toISOString();
        } catch {
          // keep previous
        }
      }

      await db.updateTaskRunResult(
        database,
        task.id,
        result.success ? 'success' : 'failed',
        result.durationMs,
        nextRunIso
      );

      const logRecord = await db.getLogById(database, logId);
      return jsonResponse(logRecord);
    }

    // Route: Get Settings
    if (url.pathname === '/api/settings' && request.method === 'GET') {
      const tz = await getSystemTimezone(database, env);
      return jsonResponse({ timezone: tz });
    }

    // Route: Update Timezone Setting
    if (url.pathname === '/api/settings/timezone' && request.method === 'POST') {
      const { timezone } = await request.json();
      if (!timezone) {
        return jsonResponse({ error: '请提供时区名称' }, 400);
      }
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      } catch {
        return jsonResponse({ error: '无效的 IANA 时区标识 (如 Asia/Shanghai, UTC)' }, 400);
      }

      await db.setSetting(database, 'timezone', timezone);

      // Recalculate next run time for all active tasks
      const allTasks = await db.getTasks(database);
      for (const t of allTasks) {
        if (t.enabled) {
          try {
            const nextIso = getNextCronRun(t.cron, new Date(), timezone).toISOString();
            await db.updateTask(database, t.id, {
              name: t.name,
              description: t.description,
              cron: t.cron,
              script: t.script,
              env_vars: t.env_vars,
              enabled: t.enabled,
              next_run_at: nextIso
            });
          } catch (e) {
            console.error(`Failed to recalculate task #${t.id}:`, e);
          }
        }
      }

      return jsonResponse({ success: true, timezone });
    }

    // Route: Get Logs
    if (url.pathname === '/api/logs' && request.method === 'GET') {
      const taskId = url.searchParams.get('taskId');
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const logs = await db.getLogs(database, { taskId, status, limit, offset });
      return jsonResponse({ logs });
    }

    // Route: Clear Logs
    if (url.pathname === '/api/logs' && request.method === 'DELETE') {
      const taskId = url.searchParams.get('taskId');
      await db.clearLogs(database, taskId);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Endpoint Not Found' }, 404);
  }
};
