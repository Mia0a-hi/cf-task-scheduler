/**
 * 案例三：自定义复杂 JavaScript 任务模块
 * 适用于：特定私有哈希算法、网页深度解析、复杂数据清洗等场景
 */

export async function runCustomTask({ env, log, warn, error, notify, fetch, sleep }) {
  log('🚀 === 开始执行自定义业务任务 ===');

  // 1. 读取任务私有凭证（由 Web 面板中的 JSON 传入）
  const apiKey = env.API_KEY;
  const webhook = env.WECOM_WEBHOOK;

  if (!apiKey) {
    throw new Error('未在 Web 面板的环境变量中配置 API_KEY');
  }

  // 2. 第一步：获取当前服务器时间与动态签名
  log('[步骤 1/3] 正在生成请求签名与防重放时间戳...');
  const timestamp = Date.now();
  
  // 演示使用 WebCrypto 计算 SHA-256 签名
  const enc = new TextEncoder();
  const signRaw = `key=${apiKey}&time=${timestamp}`;
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(signRaw));
  const signature = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  log(`[+] 签名计算完成: ${signature.substring(0, 16)}...`);

  // 3. 延时防频控
  log('[*] 等待 1 秒...');
  await sleep(1000);

  // 4. 第二步：发起接口调用
  log('[步骤 2/3] 发送签名业务请求...');
  const targetUrl = 'https://httpbin.org/post';
  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': String(timestamp)
    },
    body: JSON.stringify({
      action: 'daily_reward',
      client: 'cf-scheduler'
    })
  });

  const responseJson = await resp.json();
  log(`[+] 接口响应成功: HTTP ${resp.status}`);

  // 5. 第三步：组装结果并推送企微或 Bark 通知
  log('[步骤 3/3] 正在分发执行通报...');
  const reportTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const resultMsg = `### 🌟 自定义任务执行成功\n- **时间**: ${reportTime}\n- **状态**: HTTP ${resp.status}\n- **签名摘要**: \`${signature.substring(0, 12)}...\``;

  if (webhook) {
    await notify.wecom(webhook, resultMsg, 'markdown');
    log('[+] 已发送企业微信通知');
  }

  log('🎉 === 任务全部顺利结束 ===');
  return {
    status: resp.status,
    signature,
    timestamp
  };
}
