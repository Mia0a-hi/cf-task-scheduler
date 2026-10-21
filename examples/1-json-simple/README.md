# 案例一：JSON 简单案例 (单接口自动化)

适用于日常绝大多数场景：**定时向单个接口发送请求（带 Token / Header / Body），并可将结果推送到通知渠道**。

---

## 🎯 业务场景示例
- 每日早晨 08:30 请求每日早报接口并推送到企业微信群。
- 定时向已有 Token 的签到接口发起 POST 打卡。
- 探测网站是否存活（健康检查），宕机时自动 Bark 报警。

---

## 💻 Web 管理控制台配置步骤

在网页端点击 **「+ 新建任务」**，表单填写如下：

1. **任务名称**：`每日早报定时推送`
2. **Cron 调度表达式**：`30 8 * * *`（每天 08:30）
3. **调度模块标识 / 说明**：
   ```text
   http
   ```
4. **环境变量与凭据 (JSON 格式)**：
   直接复制 `task-config.json` 的内容：
   ```json
   {
     "URL": "https://api.vvhan.com/api/daily",
     "METHOD": "GET",
     "HEADERS": {
       "User-Agent": "CF-Task-Scheduler/1.0",
       "Accept": "application/json"
     },
     "WEBHOOK_URL": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WECOM_KEY",
     "WEBHOOK_TYPE": "wecom",
     "NOTIFY_ALWAYS": "true",
     "FAIL_ON_ERROR": "true"
   }
   ```

👉 点击「保存任务」，全部信息自动存入 Cloudflare D1 数据库，即刻生效，**无需编写任何代码**。
