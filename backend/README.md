# MomoPix 后端服务文档

## 项目简介

**MomoPix** 是一个基于 Cloudflare Workers 和 Hono 框架的后端服务，用于处理图片上传的预签名 URL 生成。服务结合 Firebase 验证和 Cloudflare R2 存储，提供安全、快速的图片上传解决方案。

## 项目结构

- **`src/index.ts`**：服务的主入口文件。
- **`wrangler.toml`**：Workers 的配置文件，定义了项目变量和 KV 存储绑定。

## 环境要求

1. **Node.js**：
   本项目需要使用 Cloudflare Workers 的 `nodejs_compat` 兼容模式。

2. **Firebase**：

   - 确保项目中已经启用了 Firebase Authentication。
   - 为 Firebase 配置一个合法的 `projectId`。

3. **Cloudflare Workers**：
   - 启用 KV 存储，用于缓存 Firebase 的 JWK 公钥。
   - 启用 R2 存储，用于存储上传的图片。

## 配置项

### 1. `wrangler.toml`

以下是 `wrangler.toml` 中的核心配置：

```toml
name = "momopix"
main = "src/index.ts"
minify = true
compatibility_date = "2024-11-23"

compatibility_flags = [ "nodejs_compat" ]

[vars]
CORS_ORIGIN = "https://img.zla.app"
FIREBASE_PROJECT_ID = "momopix-zla"
PUBLIC_JWK_CACHE_KEY = "firebase-jwk-cache"
PUBLIC_JWK_CACHE_KV = "FIREBASE_PUBLIC_KEYS"
R2_BUCKET = "zla-img"

[[kv_namespaces]]
binding = "FIREBASE_PUBLIC_KEYS"
id = "7f3cfab4ba0248f88f6ceb4efb61595e"
```

#### 变量说明：

- **`CORS_ORIGIN`**：允许跨域请求的域名。
- **`FIREBASE_PROJECT_ID`**：Firebase 项目的 `projectId`，用于验证用户身份。
- **`PUBLIC_JWK_CACHE_KEY`**：缓存 Firebase 公钥的键值。
- **`PUBLIC_JWK_CACHE_KV`**：绑定的 KV 命名空间。
- **`R2_BUCKET`**：Cloudflare R2 存储桶名称。

#### KV 命名空间：

- **`FIREBASE_PUBLIC_KEYS`**：
  - 绑定到 Firebase JWK 缓存。
  - 在 Cloudflare 管理后台可查看其 `id`。

### 2. Workers Secrets

在 `wrangler` CLI 中设置以下 Secret：

```bash
# R2 相关配置
wrangler secret put ACCOUNT_ID         # Cloudflare R2 账户 ID
wrangler secret put ACCESS_KEY_ID      # Cloudflare R2 访问密钥 ID
wrangler secret put SECRET_ACCESS_KEY  # Cloudflare R2 访问密钥 Secret
```

## 使用说明

### 部署服务

1. **安装依赖**：
   确保你已安装 `wrangler` CLI 工具，运行以下命令安装依赖：

   ```bash
   pnpm install
   ```

2. **部署到 Workers**：
   使用 `wrangler` 部署服务：

   ```bash
   wrangler deploy
   ```

3. **检查部署状态**：
   部署完成后，可通过以下命令查看 Workers 的部署状态：

   ```bash
   wrangler tail
   ```

## API 接口文档

### 1. 预签名 URL 生成

**请求 URL**：

```
POST /generate-links
```

**请求头**：

- `Authorization`：用户的 Firebase ID Token。

**请求体**：

```json
{
  "photoData": [
    { "id": "photo123", "url": "path/to/photo.avif" },
    { "id": "photo456", "url": "path/to/another_photo.avif" }
  ]
}
```

**响应体**：
成功时返回预签名 URL 列表：

```json
[
  { "id": "photo123", "signedUrl": "https://..." },
  { "id": "photo456", "signedUrl": "https://..." }
]
```

**错误响应**：

- **401 Unauthorized**：用户未通过 Firebase 验证。
- **400 Bad Request**：请求体格式不正确。
- **500 Internal Server Error**：服务器内部错误。

## 注意事项

1. **安全性**：

   - 使用 HTTPS 访问 API，防止敏感信息泄露。
   - 在 Firebase 控制台中配置合法的域名白名单。

2. **R2 存储桶权限**：

   - API Token 需具有 **Object Read & Write** 权限。

3. **JWT 缓存**：

   - 使用 KV 存储缓存 Firebase 公钥，减少 JWT 验证延迟。

## 问题排查

1. **Firebase 验证失败**：

   - 确认 `FIREBASE_PROJECT_ID` 是否正确。
   - 检查前端是否正确传递 ID Token。

2. **R2 签名失败**：

   - 确保 R2 的密钥配置正确。
   - 确认存储桶名称与路径是否匹配。

3. **服务启动失败**：

   - 使用 `wrangler tail` 查看实时日志，定位问题。
