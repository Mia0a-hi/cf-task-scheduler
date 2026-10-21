# 案例三：JS 复杂案例 (代码模块级定制)

适用于必须通过**私有加解密、特定签名规则、多重正则清洗**才能完成的复杂任务。

---

## 🎯 业务场景示例
- 像极氪打卡（需要对字符串字典序排序再进行特定 SHA1 计算）。
- 爬虫式抓取：先抓取 HTML，再通过多个正则提取隐藏 Token 与 ViewState，再模拟表单提交。
- 本地密集计算或数据校验。

---

## 🛠️ 操作步骤（需要触碰代码并发布一次）

### 步骤 1：复制文件到 `src/modules/`
将本目录下的 `custom_task.js` 复制到 Worker 项目的 `src/modules/custom_task.js`。

### 步骤 2：在 `src/modules/index.js` 注册
打开 `src/modules/index.js`，添加引用：

```javascript
import { runCustomTask } from './custom_task.js';

export const TASK_MODULES = {
  // ... 其他现有模块
  custom_task: {
    id: 'custom_task',
    name: '自定义签名打卡任务',
    description: '通过 WebCrypto 计算签名并完成接口联动',
    defaultCron: '0 8 * * *',
    run: runCustomTask
  }
};
```

### 步骤 3：部署到 Cloudflare
在终端执行发布命令：
```bash
npx wrangler deploy
```

### 步骤 4：在 Web 管理页面创建任务
打开浏览器控制台，点击 **「+ 新建任务」**：
- **任务名称**：`我的自定义打卡任务`
- **Cron 调度**：`0 8 * * *`
- **调度模块标识 / 说明**：
  ```text
  custom_task
  ```
- **环境变量与凭据 (JSON 格式)**：
  ```json
  {
    "API_KEY": "my_secret_token_12345",
    "WECOM_WEBHOOK": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx"
  }
  ```

👉 **后续维护**：一旦模块发布完成，往后日常更换 `API_KEY` 或调整运行时间，**纯在网页上改即可，再也不需要动代码**！
