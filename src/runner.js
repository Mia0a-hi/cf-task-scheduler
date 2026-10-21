/**
 * Task Execution Engine
 * Safely executes registered task modules in Cloudflare Workers isolate
 */

import { TASK_MODULES } from './modules/index.js';

function formatTimestamp() {
  const d = new Date();
  const beijingTime = new Date(d.getTime() + 8 * 3600000);
  return beijingTime.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);
}

// Built-in notification providers
const notifyHelpers = {
  async wecom(webhookUrl, content, msgtype = 'markdown') {
    if (!webhookUrl) throw new Error('WeCom webhookUrl is empty');
    const body = msgtype === 'markdown' 
      ? { msgtype: 'markdown', markdown: { content } }
      : { msgtype: 'text', text: { content } };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await resp.json();
  },

  async feishu(webhookUrl, text) {
    if (!webhookUrl) throw new Error('Feishu webhookUrl is empty');
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'text',
        content: { text }
      })
    });
    return await resp.json();
  },

  async telegram(botToken, chatId, text) {
    if (!botToken || !chatId) throw new Error('Telegram botToken or chatId is empty');
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return await resp.json();
  },

  async bark(keyOrUrl, title, body = '') {
    if (!keyOrUrl) throw new Error('Bark key or URL is empty');
    let url = keyOrUrl.startsWith('http') 
      ? keyOrUrl 
      : `https://api.day.app/${keyOrUrl}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`;
    const resp = await fetch(url);
    return await resp.json();
  }
};

/**
 * Identify matching module
 */
function resolveModule(script, envVars) {
  const trimmed = (script || '').trim().toLowerCase();
  
  if (envVars._module && TASK_MODULES[envVars._module]) {
    return TASK_MODULES[envVars._module];
  }

  if (TASK_MODULES[trimmed]) {
    return TASK_MODULES[trimmed];
  }

  // Default to universal HTTP runner
  return TASK_MODULES.http;
}

/**
 * Execute a task and collect output logs
 */
export async function executeScript(script, envVars = {}, globalEnv = {}) {
  const startTime = Date.now();
  const logBuffer = [];

  const appendLog = (level, ...args) => {
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const line = `[${formatTimestamp()}] [${level}] ${formattedArgs}`;
    logBuffer.push(line);
  };

  const customConsole = {
    log: (...args) => appendLog('INFO', ...args),
    info: (...args) => appendLog('INFO', ...args),
    warn: (...args) => appendLog('WARN', ...args),
    error: (...args) => appendLog('ERROR', ...args)
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runnerContext = {
    console: customConsole,
    log: customConsole.log,
    info: customConsole.info,
    warn: customConsole.warn,
    error: customConsole.error,
    env: envVars,
    notify: notifyHelpers,
    sleep,
    fetch: globalThis.fetch.bind(globalThis),
    globalEnv
  };

  try {
    const targetModule = resolveModule(script, envVars);
    appendLog('INFO', `=== 任务启动: [${targetModule.name}] ===`);

    const result = await targetModule.run(runnerContext);

    if (result !== undefined) {
      appendLog('INFO', `执行返回结果: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
    }

    const durationMs = Date.now() - startTime;
    appendLog('INFO', `=== 任务执行成功，总耗时: ${durationMs}ms ===`);

    return {
      success: true,
      output: logBuffer.join('\n'),
      durationMs
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errMessage = err.stack || err.message || String(err);
    appendLog('ERROR', `任务执行失败: ${errMessage}`);
    appendLog('INFO', `=== 任务异常终止，耗时: ${durationMs}ms ===`);

    return {
      success: false,
      output: logBuffer.join('\n'),
      error: errMessage,
      durationMs
    };
  }
}
