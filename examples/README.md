# 📚 CF Task Scheduler 自动化任务实战范例库 (Task Examples)

本目录汇总了三种不同复杂度的自动化任务实现范例，以及完整的 **Webhook 告警通知字段规范**（仅支持企业微信、飞书、Bark，已剔除 Telegram）。

---

## 📁 目录索引

| 目录 | 适用场景 | 需要动代码吗？ | 核心能力 |
|---|---|:---:|---|
| [**1-json-simple**](./1-json-simple/) | **JSON 简单案例**：单接口签到 / 网站健康检查 / 每日资讯推送 | ❌ **0 代码**（纯网页配置） | 自动携带 Header、Token、Body，探测可用性与告警 |
| [**2-json-complex**](./2-json-complex/) | **JSON 复杂案例**：多接口串联（登录拿 Token $\rightarrow$ 提取变量 $\rightarrow$ 带 Token 签到） | ❌ **0 代码**（纯网页配置） | 声明式 `STEPS` 流水线、JSON 路径与正则提取、`{{变量}}` 自动注入 |
| [**3-js-complex**](./3-js-complex/) | **JS 复杂案例**：必须依赖私有算法加密、网页深度爬取的大型脚本 | ✅ **需在本地建文件** | 完整的 JS 自由度，调用 WebCrypto 计算签名，多步判断 |

---

## 🔔 支持的 Webhook 字段速查 (企业微信 / 飞书 / Bark)

详细使用文档参见 👉 [**WEBHOOK_SUPPORT.md**](./WEBHOOK_SUPPORT.md)

### 1. 常用简写字段（自动识别通道）
- **企业微信**：`"WECOM_WEBHOOK": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx"`
- **飞书**：`"FEISHU_WEBHOOK": "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"`
- **iOS Bark**：`"BARK_URL": "https://api.day.app/YOUR_KEY/"`

### 2. 标准通用字段
- `"WEBHOOK_URL": "目标Webhook链接"`
- `"WEBHOOK_TYPE": "wecom" | "feishu" | "bark"`

### 3. 告警控制选项
- `"NOTIFY_ALWAYS": "true"`：无论成功还是失败均推送通知（默认仅失败报警）。
- `"FAIL_ON_ERROR": "true"`：接口返回非 2xx 状态码时判定任务失败并触发报警。
