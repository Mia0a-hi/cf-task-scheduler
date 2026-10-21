/**
 * Generic HTTP Request & Webhook Runner
 */

export async function runHttp({ env, log, warn, notify, fetch }) {
  const url = env.URL || env.url;
  const method = (env.METHOD || env.method || 'GET').toUpperCase();
  const headers = env.HEADERS || env.headers || {};
  const body = env.BODY || env.body;
  const webhook = env.WEBHOOK_URL || env.webhook_url;
  const webhookType = env.WEBHOOK_TYPE || 'wecom'; // 'wecom' | 'feishu' | 'telegram' | 'bark'

  if (!url) {
    throw new Error('Missing required environment variable: URL');
  }

  log(`[*] Sending ${method} request to: ${url}`);
  
  let parsedHeaders = {};
  if (typeof headers === 'string') {
    try {
      parsedHeaders = JSON.parse(headers);
    } catch {
      parsedHeaders = {};
    }
  } else if (typeof headers === 'object' && headers !== null) {
    parsedHeaders = { ...headers };
  }

  const options = {
    method,
    headers: parsedHeaders
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = typeof body === 'object' ? JSON.stringify(body) : String(body);
    if (!options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
  }

  const startTime = Date.now();
  const resp = await fetch(url, options);
  const duration = Date.now() - startTime;
  const text = await resp.text();

  log(`[+] Response: ${resp.status} ${resp.statusText} (${duration}ms)`);
  log(`[+] Preview (first 500 chars): ${text.substring(0, 500)}`);

  let resData;
  try {
    resData = JSON.parse(text);
  } catch {
    resData = text;
  }

  // Optional webhook alert on failure or if NOTIFY_ALWAYS is enabled
  const shouldNotify = webhook && (!resp.ok || env.NOTIFY_ALWAYS === 'true');
  if (shouldNotify) {
    const alertMsg = `[CF Task Scheduler] HTTP Task Alert\nTarget: [${method}] ${url}\nStatus: ${resp.status} ${resp.statusText}\nTime: ${new Date().toISOString()}`;
    try {
      if (webhookType === 'feishu') {
        await notify.feishu(webhook, alertMsg);
      } else if (webhookType === 'bark') {
        await notify.bark(webhook, 'Task Notification', alertMsg);
      } else if (webhookType === 'telegram') {
        const [token, chatId] = webhook.split('|');
        if (token && chatId) await notify.telegram(token, chatId, alertMsg);
      } else {
        await notify.wecom(webhook, alertMsg, 'text');
      }
      log('[+] Webhook alert sent successfully');
    } catch (notifyErr) {
      warn(`[-] Failed to send webhook alert: ${notifyErr.message}`);
    }
  }

  if (!resp.ok && env.FAIL_ON_ERROR !== 'false') {
    throw new Error(`HTTP request failed with status code ${resp.status}`);
  }

  return {
    status: resp.status,
    ok: resp.ok,
    durationMs: duration,
    preview: typeof resData === 'object' ? resData : text.substring(0, 300)
  };
}
