# 案例二：JSON 复杂案例 (多接口变量提取与串联流水线)

适用于需要**多个前置 API 联动**的业务场景：**先请求 API 1 拿 Token / Cookie，提取出变量后，自动注入到 API 2 发起打卡**。

---

## 🎯 业务场景示例
1. **前置步骤**：调用登录接口，输入账号密码，拿到短期 Token。
2. **变量提取**：从返回的 JSON 结果中提取 Token（如 `data.accessToken`）。
3. **后续步骤**：携带该 Token，动态替换到请求头 `Authorization: Bearer {{sessionToken}}` 完成打卡。
4. **全流程通报**：汇总各步骤执行状态并推送到企业微信、飞书或 Bark。

---

## 💻 Web 管理控制台配置步骤

在网页端点击 **「+ 新建任务」**，表单填写如下：

1. **任务名称**：`多接口自动登录并签到`
2. **Cron 调度表达式**：`0 9 * * *`（每天 09:00）
3. **调度模块标识 / 说明**：
   ```text
   http
   ```
4. **环境变量与凭据 (JSON 格式)**：
   粘贴 `task-config.json` 的内容：
   ```json
   {
     "STEPS": [
       {
         "name": "login_step",
         "url": "https://api.example.com/api/v1/auth/login",
         "method": "POST",
         "body": {
           "account": "user_demo",
           "secret": "password123"
         },
         "extract": {
           "sessionToken": "data.accessToken",
           "memberId": "data.user.id"
         },
         "sleep": 1000
       },
       {
         "name": "checkin_step",
         "url": "https://api.example.com/api/v1/user/checkin",
         "method": "POST",
         "headers": {
           "Authorization": "Bearer {{sessionToken}}",
           "Content-Type": "application/json"
         },
         "body": {
           "uid": "{{memberId}}"
         }
       }
     ],
     "WEBHOOK_URL": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WECOM_KEY",
     "WEBHOOK_TYPE": "wecom",
     "NOTIFY_ALWAYS": "true"
   }
   ```

---

## 🔍 `extract` 数据提取语法指南

在任意步骤中添加 `"extract": { "变量名": "提取规则" }`，即可将值保存到内存并在后续步骤使用 `{{变量名}}` 引用：

| 提取场景 | 规则写法 | 示例 |
|---|---|---|
| **JSON 嵌套属性** | 直接写属性路径 | `"token": "data.token"` 或 `"id": "user.info.id"` |
| **Response Headers** | `headers.请求头名` | `"cookie": "headers.set-cookie"` |
| **HTML / 文本正则** | `regex:正则表达式` | `"csrf": "regex:name=\"csrf\" value=\"([^\"]+)\""` |
| **HTTP 状态码** | `status` | `"lastCode": "status"` |
