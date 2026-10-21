import { runHttp } from './http.js';

export const TASK_MODULES = {
  http: {
    id: 'http',
    name: 'Universal HTTP / Webhook Runner',
    description: 'Trigger any REST API, automated webhook, or periodic health check',
    defaultCron: '*/30 * * * *',
    defaultEnv: {
      URL: 'https://httpbin.org/get',
      METHOD: 'GET',
      HEADERS: {
        'User-Agent': 'CF-Task-Scheduler/1.0'
      },
      WEBHOOK_URL: ''
    },
    run: runHttp
  }
};
