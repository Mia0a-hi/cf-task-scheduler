/**
 * Generic Starter Templates for Open Source Scheduler
 */

export const TEMPLATES = {
  health_check: {
    name: '服务健康检查 (Health Check)',
    cron: '*/15 * * * *',
    description: '每 15 分钟探测目标服务是否存活，异常时可触发报警',
    env_vars: {
      URL: 'https://httpbin.org/status/200',
      METHOD: 'GET',
      WEBHOOK_URL: ''
    },
    script: 'http'
  },

  http_get: {
    name: '通用 HTTP GET 定时请求',
    cron: '0 8 * * *',
    description: '每天早上 08:00 定时请求目标接口并抓取状态数据',
    env_vars: {
      URL: 'https://httpbin.org/get',
      METHOD: 'GET',
      HEADERS: {
        'User-Agent': 'CF-Task-Scheduler/1.0',
        'Accept': 'application/json'
      }
    },
    script: 'http'
  },

  http_post: {
    name: '通用 Webhook POST 请求',
    cron: '0 * * * *',
    description: '每小时整点向指定 Webhook 投递 JSON 数据包',
    env_vars: {
      URL: 'https://httpbin.org/post',
      METHOD: 'POST',
      HEADERS: {
        'Content-Type': 'application/json'
      },
      BODY: {
        event: 'hourly_ping',
        source: 'cf-task-scheduler'
      }
    },
    script: 'http'
  },

  wecom_notify: {
    name: '企业微信机器人定时通知',
    cron: '30 9 * * 1-5',
    description: '工作日 09:30 定时触发企业微信群机器人通知',
    env_vars: {
      URL: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_BOT_KEY',
      METHOD: 'POST',
      BODY: {
        msgtype: 'markdown',
        markdown: {
          content: '### ☀️ 早上好！\n\n> 定时任务服务正常运行中\n> 时间：' + new Date().toISOString()
        }
      }
    },
    script: 'http'
  },

  bark_push: {
    name: 'Bark 移动端推送提醒',
    cron: '0 9 * * *',
    description: '每天 09:00 发送一条 Bark iOS 消息提醒',
    env_vars: {
      URL: 'https://api.day.app/YOUR_BARK_KEY/定时任务提醒/系统运行正常',
      METHOD: 'GET'
    },
    script: 'http'
  }
};
