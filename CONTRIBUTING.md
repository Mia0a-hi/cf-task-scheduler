# Contributing to CF Task Scheduler

Thank you for your interest in contributing to **CF Task Scheduler**! We welcome bug reports, feature suggestions, documentation improvements, and custom module contributions.

---

## 🛠️ How to Add a Custom Task Module

CF Task Scheduler is built with an extensible module system. If you want to contribute a built-in module for a specific service or automation task:

### 1. Create a Module File in `src/modules/`

Create a new file, e.g., `src/modules/my_service.js`:

```javascript
/**
 * Custom Service Task Module
 */
export async function runMyService({ env, log, warn, error, notify, fetch, sleep }) {
  log('Starting custom service task...');

  const token = env.API_TOKEN;
  if (!token) {
    throw new Error('Missing API_TOKEN in task environment variables');
  }

  // 1. Fetch data or trigger external API
  const response = await fetch('https://api.example.com/v1/check', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  log('API Response:', data);

  // 2. Optional Notification
  if (env.WEBHOOK_URL) {
    await notify.wecom(env.WEBHOOK_URL, `Task completed: ${data.status}`);
  }

  return data;
}
```

### 2. Register Your Module in `src/modules/index.js`

```javascript
import { runMyService } from './my_service.js';

export const TASK_MODULES = {
  // ... existing modules
  my_service: {
    id: 'my_service',
    name: 'My Service Check-in',
    description: 'Daily automated check-in and status monitoring for My Service',
    defaultCron: '0 8 * * *',
    defaultEnv: {
      API_TOKEN: 'your_token_here',
      WEBHOOK_URL: ''
    },
    run: runMyService
  }
};
```

### 3. Add a Starter Template in `src/templates.js`

```javascript
export const TEMPLATES = {
  // ...
  my_service: {
    name: 'My Service Daily Check-in',
    cron: '0 8 * * *',
    description: 'Automated task for My Service',
    env_vars: {
      API_TOKEN: 'your_token_here',
      WEBHOOK_URL: ''
    },
    script: 'my_service'
  }
};
```

---

## 🧪 Local Testing

Before submitting a Pull Request, run the automated test suite to ensure everything passes:

```bash
npm test
```

Start the local development server:

```bash
npm run dev
```

---

## 📜 Pull Request Guidelines

1. **Zero Hardcoded Secrets**: Ensure that **NO personal tokens, passwords, webhooks, or cookies** are included in your commits.
2. **Clear Commit Messages**: Use semantic commit messages (e.g. `feat: add custom module for XYZ`, `fix: handle edge case in cron parser`).
3. **Follow Code Conventions**: Use standard ES Modules syntax and pure async functions.
