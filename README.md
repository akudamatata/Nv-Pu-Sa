# Nv-Pu-Sa (女菩萨) 🌸

> **Nv-Pu-Sa** 是一款专为个人打造的 X (Twitter) 关注列表自动备份、全量博主墙归档与高颜值精选画廊系统。

![Nv-Pu-Sa Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## ✨ 核心特性

- 🌸 **高颜值暗黑精选画廊**：极简高颜值 UI，支持卡片与列表切换、多维排序与精准关键词模糊搜索。
- 🔑 **全新 GraphQL 2026 爬虫引擎**：自动锁定最新 GraphQL QueryID，彻底告别旧版 REST API 404 限制。
- 🎯 **目标关注数精准即停**：在线识别账号关注总数（`following_count`），抓满即秒级自动安全打断，防止无用下翻页。
- 🔗 **100% 完整 Bio 还原**：自动展开 `t.co` 链接，完整保留原生段落换行、主页外部网址 (Website)、位置 (Location) 与注册时间。
- 🔒 **私密 Passcode Vault**：双层独立隔离——管理员通过 Passcode 锁屏防护，后台卡片安全掌控 X Cookie 凭据。
- 📦 **开箱即用 / 一键导出**：支持标准 JSON 全量数据导入、导出与一键归档恢复。

---

## 🚀 快速开始

### 1. 本地运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

服务启动后：
- 🌐 **公开展示墙**：[http://localhost:3000](http://localhost:3000)
- 🔒 **私密控制台**：[http://localhost:3000/admin](http://localhost:3000/admin) （默认 Admin 密码：`admin` / `admin123`）

---

## 🛠️ 技术栈

- **后端**：Node.js Express + 原生 Fetch API
- **前端**：Vanilla HTML5 + Modern CSS3 (Dark Glassmorphic Theme) + Pure JS (ES6+)
- **存储**：JSON Local Persistence / Cloudflare D1 Compatible

---

## 📜 许可证

[MIT License](LICENSE)
