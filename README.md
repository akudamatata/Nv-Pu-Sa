# Nv-Pu-Sa (女菩萨) 🌸

> **Nv-Pu-Sa (女菩萨)** 是一款专为个人打造的 X (Twitter) 关注列表自动备份、全量博主墙归档与高颜值精选画廊系统。
> 支持本地 Node.js 快速运行，亦支持 100% 部署在 Cloudflare Pages & D1 数据库，实现全网免费、无限扩容的分布式云端部署。

![Nv-Pu-Sa Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## ✨ 核心特性

- 🌸 **高颜值暗黑精选画廊**：极简高颜值 UI，支持卡片与列表切换、多维排序与精准关键词模糊搜索。
- 🔑 **全新 GraphQL 2026 爬虫引擎**：自动锁在线最新 GraphQL QueryID，彻底告别旧版 REST API 404 限制。
- 🎯 **目标关注数精准即停**：在线识别账号关注总数（`following_count`），抓满即秒级自动安全打断，防止无用下翻页。
- 🔗 **100% 完整 Bio 还原**：自动展开 `t.co` 链接，完整保留原生段落换行、主页外部网址 (Website)、位置 (Location) 与注册时间。
- 🔒 **私密 Passcode Vault**：双层独立隔离——管理员通过 Passcode 锁屏防护，后台卡片安全掌控 X Cookie 凭据。
- ☁️ **Cloudflare 边缘全免费架构**：完美适配 Cloudflare Pages Functions 与 D1 边缘 Serverless 数据库。
- 📦 **开箱即用 / 一键导出**：支持标准 JSON 全量数据导入、导出与一键归档恢复。

---

## 🚀 部署指南

### 方案 A：本地运行 (Node.js Express 快速开启)

```bash
# 1. 克隆本项目
git clone https://github.com/你的用户名/Nv-Pu-Sa.git
cd Nv-Pu-Sa

# 2. 安装依赖
npm install

# 3. 启动服务
npm start
```

服务启动后：
- 🌐 **公开展示墙**：[http://localhost:3000](http://localhost:3000)
- 🔒 **私密控制台**：[http://localhost:3000/admin](http://localhost:3000/admin) （默认 Admin 密码：`admin` / `admin123`）

---

### 方案 B：Cloudflare Pages 零成本分布式边缘部署 (全免费)

本项目原生支持部署在 **Cloudflare Pages** 边缘网络上，搭配 **Cloudflare D1** 数据库，实现零成本、高并发的个人私有服务。

#### 1. Fork 或上传仓库到 GitHub
确保你已经将本项目推送到你自己的 GitHub 账号下。

#### 2. 创建 Cloudflare D1 数据库
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 导航至 **Workers & Pages** → **Storage & Databases** → **D1**。
3. 点击 **Create database**，数据库名称填入 `nv_pu_sa_db`。
4. 进入刚创建的数据库，选择 **Console** 选项卡，粘贴项目根目录下 [`schema.sql`](schema.sql) 的代码并运行以创建数据表：
   ```sql
   CREATE TABLE IF NOT EXISTS bloggers (
     id TEXT PRIMARY KEY,
     screen_name TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     avatar_url TEXT,
     cover_url TEXT,
     followers_count INTEGER DEFAULT 0,
     description TEXT,
     verified INTEGER DEFAULT 0,
     backed_up_at TEXT
   );
   ```

#### 3. 创建 Cloudflare Pages 项目
1. 导航至 **Workers & Pages** → **Overview** → **Create application** → **Pages** → **Connect to Git**。
2. 选择你的 `Nv-Pu-Sa` GitHub 仓库。
3. **构建配置 (Build settings)**：
   - **Framework preset**：选择 `None`
   - **Build command**：（留空）
   - **Build output directory**：填入 `public`
4. 点击 **Save and Deploy** 完成初次构建。

#### 4. 绑定 D1 数据库与密钥环境变量
1. 在刚创建的 Pages 项目中，进入 **Settings** → **Functions**。
2. 找到 **D1 database bindings**，点击 **Add binding**：
   - **Variable name**：必须填入 `DB`
   - **D1 database**：选择上面创建的 `nv_pu_sa_db`
3. 找到 **Environment variables** (环境变量)，点击 **Add variable**，设置管理员登录通行密码：
   - `ADMIN_USER` = `你的后台管理员用户名` (如: admin)
   - `ADMIN_PASS` = `你的后台密码` (如: admin123)
4. 进入 **Deployments** 选项卡，点击最新构建右侧的 **...** → **Retry deployment** 重新部署。

🎉 **部署完成！** 你将获得 Cloudflare 免费分配的专属域名（例如 `nv-pu-sa.pages.dev`），全网零延迟访问你的个人【女菩萨】关注博主归档画廊！

---

## 🛠️ 技术栈

- **后端**：Node.js Express / Cloudflare Pages Functions (Edge Serverless)
- **前端**：Vanilla HTML5 + Modern CSS3 (Dark Glassmorphic Theme) + Pure JS (ES6+)
- **存储**：JSON Local Persistence / Cloudflare D1 Database

---

## 📜 许可证

[MIT License](LICENSE)
