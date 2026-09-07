# 阅流 · RSS + AI 阅读器

中文个人阅读器，支持 RSS、Atom、JSON Feed，原网页图文提取、翻译、AI 总结与文章问答。

## 功能

- 订阅网站或 RSS 地址，自动发现网页声明的订阅源。
- 搜索、收藏、已读与未读；记录保存在当前浏览器。
- Mozilla Readability + 少数派 / 微信专用正文识别，DOMPurify 清理外部 HTML。
- 自定义 OpenAI 兼容 API，支持 OpenRouter，模型列表和连接测试。
- RSSHub 实例与路由配置，公众号搜狗来源和已有公众号 RSS 接入。
- 公共实例名单刷新、按当前路由实时检测和选择；官网不可达时使用带日期的快照，并重新检测。

## 本地开发

要求 Node.js 22.13 或更新版本，以及 npm。推荐 Node.js 24 LTS。

```bash
npm ci
npm run selfhost:dev
```

打开终端输出的本地地址。API 密钥在网页的「AI 设置」中填写，不要提交到 GitHub。

## 自行部署到 Cloudflare Workers

当前工程基于 Vinext + Cloudflare Workers，不需要数据库。这是一套带服务端 API 的应用，不能直接放到 GitHub Pages 等纯静态托管。

1. 安装依赖：`npm ci`。
2. 登录你自己的 Cloudflare：`npx wrangler login`。
3. 执行 `npm run selfhost:deploy`，脚本先构建，再发布到你账号中的 `yueliu-reader` Worker。
4. 访问命令返回的地址，配置订阅和 AI。

只构建、不发布：

```bash
npm run selfhost:build
```

若有多个 Cloudflare 账号，运行前设置 `CLOUDFLARE_ACCOUNT_ID`。自动化环境可使用 `CLOUDFLARE_API_TOKEN`，请放在 CI Secrets，不要写入源码。登录与计费属于你自己的 Cloudflare 账号。

`selfhost:*` 命令使用项目内的 Node 脚本，不依赖原 Sites 构建脚本中的 GNU timeout/flock。需要更改 Worker 名称时，修改 `vite.config.ts` 的 selfHost 配置。

### 访问控制

原 ChatGPT Sites 的私有访问权限不会迁移到你自己的 Worker。本应用没有内置登录；个人使用时请通过 Cloudflare Access 或已有认证网关限制访问，尤其是 `/api/*` 路由。

### 数据和 API

- 订阅、收藏、已读记录、正文缓存使用 localStorage，不跨设备同步。换域名后不会自动带走旧站点的浏览器数据。
- API Key 默认放在本次浏览器会话；勾选记住后存放在本机 localStorage。服务端只转发请求，不在数据库中保存密钥。
- AI 服务的 Base URL 需支持 `/chat/completions`；模型列表使用 `/models`。
- 为限制服务端请求目的地，只接受公开 HTTPS 域名；不支持内网 IP 和非 443 端口。
- 原网页提取不绕过付费、登录或验证码，图片也可能被原站防盗链限制。
- RSSHub 接入连接外部实例，不在 Worker 中运行完整 RSSHub。公众号服务、登录和 Cookie 需要由所选上游配置。
- 公共实例检测表示指定路由在指定时间返回有效 RSS/Atom/JSON Feed，不代表所有路由始终可用。

## 测试

```bash
npm run test:reader
```

覆盖正文提取、图文清理、微信结构、RSSHub 路由拼接、名单解析、有效 Feed 判定和超时参数。真实上游可用性需在你部署的网络中检测；没有 API Key 时无法验证真实模型调用。

## 目录

- `app/page.tsx`：阅读界面、订阅和 AI 配置。
- `app/api/`：订阅抓取、原文抓取、AI 转发、RSSHub 检测。
- `components/article-body.tsx`：经过清理的图文正文渲染。
- `components/rsshub-instances.tsx`：公共实例选择和检测进度。
- `lib/`：正文提取、地址校验、Feed 判定及名单快照。
- `scripts/selfhost.mjs`：自行部署命令。

`.openai/hosting.json`、`build/sites-vite-plugin.ts` 和原 `build` 命令保留用于 ChatGPT Sites。自行部署使用 `selfhost:*`，无需原 Sites 账号或其发布凭证。第三方组件保留各自的许可证，详见对应 npm 包及 vendor 目录。
