# 🔔 Webhook 通知支持规范说明 (Webhook Specification)

本项目内置原生支持 **企业微信**、**飞书** 与 **iOS Bark** 三大主流通知渠道（已剔除 Telegram 等外部渠道）。

---

## 📌 支持的 Webhook 环境变量字段

在 Web 管理面板配置任务时，可以在「环境变量与凭据 (JSON 格式)」中配置以下字段：

### 1. 简写字段（自动识别通道）

| 字段名 (Key) | 说明 | 示例值 |
|---|---|---|
| `WECOM_WEBHOOK` | **企业微信群机器人** Webhook 完整链接 | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx-xxxx-xxxx` |
| `FEISHU_WEBHOOK` | **飞书群机器人** Webhook 完整链接 | `https://open.feishu.cn/open-apis/bot/v2/hook/xxxx-xxxx-xxxx` |
| `BARK_URL` | **iOS Bark 移动端** 推送完整链接 | `https://api.day.app/YOUR_BARK_KEY/` 或 自建 Bark 服务地址 |

> **提示**：如果配置了简写字段，系统会自动按照对应的通道协议格式化发送。

---

### 2. 标准通用字段（通过 `WEBHOOK_TYPE` 指定类型）

| 字段名 (Key) | 可选值 | 说明 |
|---|---|---|
| `WEBHOOK_URL` | Webhook 地址 | 对应机器人的完整 HTTP/HTTPS 请求链接 |
| `WEBHOOK_TYPE` | `wecom` \| `feishu` \| `bark` | 指定通道协议类型，默认为 `wecom` |

#### 配置示例：
```json
{
  "WEBHOOK_URL": "https://api.day.app/YOUR_BARK_KEY/",
  "WEBHOOK_TYPE": "bark"
}
```

---

## ⚙️ 辅助通知控制字段

| 控制字段 (Key) | 默认值 | 作用说明 |
|---|---|---|
| `NOTIFY_ALWAYS` | `"false"` | 设为 `"true"` 时，**无论任务执行成功还是失败，都会发送通知**；默认仅在失败时报警。 |
| `FAIL_ON_ERROR` | `"true"` | 接口返回非 2xx 状态码时，是否将整个任务标记为失败状态并报警。 |

---

## 📋 三大通道格式与平台配置指引

### 通道一：企业微信机器人 (WeCom)
- **获取方式**：在企业微信电脑端，进入任意内部群 $\rightarrow$ 点击右上角「...」 $\rightarrow$ 「添加群机器人」 $\rightarrow$ 复制 Webhook 地址。
- **消息格式**：支持普通文本（Text）与 Markdown 卡片（卡片标题、引用框、加粗与时间戳）。
- **JSON 配置示例**：
  ```json
  {
    "WECOM_WEBHOOK": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=693a91f6-7xxx-4bc4-97a0-0ec2fa54xxxx"
  }
  ```

---

### 通道二：飞书机器人 (Feishu / Lark)
- **获取方式**：在飞书电脑端，进入任意群组 $\rightarrow$ 点击设置 $\rightarrow$ 「群机器人」 $\rightarrow$ 「添加机器人」 $\rightarrow$ 「自定义机器人」 $\rightarrow$ 复制 Webhook 地址。
- **消息格式**：标准 JSON 纯文本通知。
- **JSON 配置示例**：
  ```json
  {
    "FEISHU_WEBHOOK": "https://open.feishu.cn/open-apis/bot/v2/hook/a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
  ```

---

### 通道三：iOS Bark 移动端推送 (Bark)
- **获取方式**：在 iPhone App Store 搜索下载 **Bark**，打开 App 即可直接复制属于你的专属设备链接。
- **消息格式**：支持移动端通知横幅、震动、铃声及角标。
- **JSON 配置示例**：
  ```json
  {
    "BARK_URL": "https://api.day.app/YOUR_DEVICE_KEY/"
  }
  ```
