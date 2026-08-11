-- =========================================================
-- Cloudflare D1 Database Schema for X-Follow-Archive
-- 支持全量登录态持久化、Cookie凭据及博主落库
-- =========================================================

-- 1. 管理员 Session 登录持久化表
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  x_name TEXT,
  x_screen_name TEXT,
  x_avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 2. X (Twitter) Cookie 凭据加密配置表
CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ct0 TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 全量关注博主归档表
CREATE TABLE IF NOT EXISTS archived_bloggers (
  id_str TEXT PRIMARY KEY,
  screen_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  followers_count INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  cover_url TEXT,
  category TEXT,
  backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
