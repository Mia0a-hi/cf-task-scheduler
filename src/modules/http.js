/**
 * Universal HTTP / Webhook Runner
 * Supports both single HTTP requests and multi-step declarative pipelines (STEPS)
 */

function getJsonPath(obj, path) {
  if (!obj || typeof obj !== 'object') return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function extractValue(responseObj, rule) {
  if (!rule || typeof rule !== 'string') return undefined;
  
  // 1. Regex rule: "regex:/pattern/" or "regex:pattern"
  if (rule.startsWith('regex:')) {
    const pattern = rule.substring(6);
    const re = new RegExp(pattern);
    const textToSearch = typeof responseObj.body === 'string' 
      ? responseObj.body 
      : JSON.stringify(responseObj.data || {});
    const match = textToSearch.match(re);
    return match ? (match[1] || match[0]) : undefined;
  }

  // 2. Header rule: "headers.header-name"
  if (rule.startsWith('headers.')) {
    const headerKey = rule.substring(8).toLowerCase();
    return responseObj.headers[headerKey];
  }

  // 3. Status code: "status"
  if (rule === 'status') {
    return responseObj.status;
  }

  // 4. Default: JSON Path
  return getJsonPath(responseObj.data, rule);
}

function interpolate(template, vars) {
  if (typeof template === 'string') {
    return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
      return vars[key] !== undefined ? String(vars[key]) : match;
    });
  }
  if (typeof template === 'object' && template !== null) {
    if (Array.isArray(template)) return template.map(item => interpolate(item, vars));
    const res = {};
    for (const [k, v] of Object.entries(template)) {
      res[k] = interpolate(v, vars);
    }
    return res;
  }
  return template;
}

async function sendNotification(webhook, webhookType, message, notify, log, warn) {
  if (!webhook) return;
  try {
    const type = (webhookType || 'wecom').toLowerCase();
    if (type === 'feishu') {
      await notify.feishu(webhook, message);
    } else if (type === 'bark') {
      await notify.bark(webhook, 'Task Notification', message);
    } else {
      await notify.wecom(webhook, message, 'text');
    }
    log('[+] Webhook notification sent successfully');
  } catch (err) {
    warn(`[-] Failed to send webhook notification: ${err.message}`);
  }
}

export async function runHttp({ env, log, warn, notify, fetch, sleep }) {
  const webhook = env.WEBHOOK_URL || env.webhook_url;
  const webhookType = env.WEBHOOK_TYPE || 'wecom'; // 'wecom' | 'feishu' | 'bark'

  // ==========================================
  // Mode 1: Multi-Step Declarative Pipeline
  // ==========================================
  const rawSteps = env.STEPS || env.steps;
  if (rawSteps) {
    let steps = [];
    try {
      steps = typeof rawSteps === 'string' ? JSON.parse(rawSteps) : rawSteps;
    } catch (e) {
      throw new Error(`Invalid STEPS configuration: ${e.message}`);
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('STEPS must be a non-empty array of step definitions');
    }

    log(`[*] Starting multi-step workflow (${steps.length} steps configured)...`);
    const contextVars = { ...(env.VARS || env.vars || {}) };
    const stepResults = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepIndex = i + 1;
      const stepName = step.name || `step_${stepIndex}`;
      log(`\n--- [Step ${stepIndex}/${steps.length}] ${stepName} ---`);

      // 1. Interpolate variables into URL, Headers, Body
      const targetUrl = interpolate(step.url, contextVars);
      const method = (step.method || 'GET').toUpperCase();
      let rawHeaders = step.headers || {};
      if (typeof rawHeaders === 'string') {
        try { rawHeaders = JSON.parse(rawHeaders); } catch { rawHeaders = {}; }
      }
      const headers = interpolate(rawHeaders, contextVars);
      const rawBody = step.body !== undefined ? interpolate(step.body, contextVars) : undefined;

      if (!targetUrl) {
        throw new Error(`Step "${stepName}" missing required "url"`);
      }

      const options = {
        method,
        headers: { ...headers }
      };

      if (rawBody !== undefined && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        options.body = typeof rawBody === 'object' ? JSON.stringify(rawBody) : String(rawBody);
        if (!options.headers['Content-Type'] && !options.headers['content-type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }

      log(`[*] ${method} ${targetUrl}`);
      const startTime = Date.now();
      const resp = await fetch(targetUrl, options);
      const duration = Date.now() - startTime;
      const responseText = await resp.text();

      log(`[+] Status: ${resp.status} ${resp.statusText} (${duration}ms)`);
      log(`[+] Body: ${responseText.substring(0, 300)}`);

      let responseJson = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {}

      // Convert headers to object for easier extraction
      const respHeadersObj = {};
      resp.headers.forEach((v, k) => { respHeadersObj[k.toLowerCase()] = v; });

      const responseBundle = {
        status: resp.status,
        headers: respHeadersObj,
        data: responseJson,
        body: responseText
      };

      stepResults.push({
        step: stepName,
        status: resp.status,
        ok: resp.ok,
        durationMs: duration
      });

      // 2. Extract variables if defined
      if (step.extract && typeof step.extract === 'object') {
        for (const [varName, rule] of Object.entries(step.extract)) {
          const val = extractValue(responseBundle, rule);
          if (val !== undefined) {
            contextVars[varName] = val;
            log(`[+] Extracted [${varName}]: ${String(val).substring(0, 50)}...`);
          } else {
            warn(`[!] Failed to extract [${varName}] using rule: "${rule}"`);
          }
        }
      }

      // Check step success
      if (!resp.ok && step.failOnError !== false && env.FAIL_ON_ERROR !== 'false') {
        const errMsg = `Step "${stepName}" failed with status ${resp.status}`;
        log(`[-] ${errMsg}`);
        await sendNotification(webhook, webhookType, `[CF Task Scheduler] Step Failed: ${stepName} (${resp.status})`, notify, log, warn);
        throw new Error(errMsg);
      }

      // Step delay
      if (step.sleep && typeof step.sleep === 'number' && i < steps.length - 1) {
        log(`[*] Waiting ${step.sleep}ms before next step...`);
        if (typeof sleep === 'function') await sleep(step.sleep);
      }
    }

    log('\n🎉 Multi-step workflow completed successfully!');
    const summaryText = stepResults.map(s => `• ${s.step}: ${s.status} (${s.durationMs}ms)`).join('\n');
    log(summaryText);

    if (webhook && (env.NOTIFY_ALWAYS === 'true')) {
      await sendNotification(webhook, webhookType, `[CF Task Scheduler] Workflow Completed\n${summaryText}`, notify, log, warn);
    }

    return {
      success: true,
      stepsCount: steps.length,
      results: stepResults
    };
  }

  // ==========================================
  // Mode 2: Standard Single HTTP Request
  // ==========================================
  const url = env.URL || env.url;
  const method = (env.METHOD || env.method || 'GET').toUpperCase();
  const headers = env.HEADERS || env.headers || {};
  const body = env.BODY || env.body;

  if (!url) {
    throw new Error('Missing required environment variable: URL (or provide STEPS for multi-step workflow)');
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

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    options.body = typeof body === 'object' ? JSON.stringify(body) : String(body);
    if (!options.headers['Content-Type'] && !options.headers['content-type']) {
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

  const shouldNotify = webhook && (!resp.ok || env.NOTIFY_ALWAYS === 'true');
  if (shouldNotify) {
    const alertMsg = `[CF Task Scheduler] HTTP Task Alert\nTarget: [${method}] ${url}\nStatus: ${resp.status} ${resp.statusText}\nTime: ${new Date().toISOString()}`;
    await sendNotification(webhook, webhookType, alertMsg, notify, log, warn);
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
