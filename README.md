# 阅流 · RSS + AI 阅读器

中文个人阅读器，支持 RSS、Atom、JSON Feed，原网页图文提取、翻译、AI 总结与文章问答。

## 功能

- 订阅网站或 RSS 地址，自动发现网页声明的订阅源。
- 搜索、收藏、已读与未读；记录保存在当前浏览器。
- 无 RSS 的公开列表页可配置 CSS 链接规则，在阅读器内订阅更新。
- 原文 / 译文切换，逐段翻译进度、停止生成、保留部分译文和明确错误提示。
- 选中文字后点击「引用问 AI」，可单独提问并携带附近上下文。
- Mozilla Readability + 少数派 / 微信专用正文识别，DOMPurify 清理外部 HTML。
- 独立翻译服务：Google Cloud Translation Basic、DeepL API Free / Pro、AI 翻译，支持目标语言与表达风格。
- 自定义 OpenAI 兼容 API，支持 OpenRouter，可搜索的模型列表和连接测试。
- 44 个内置 Feed，按主题与语言搜索、多选批量添加，已订阅列表可按分区筛选。
- B 站专区：UP 主搜索、热门 / 榜单视频作者、UID / 主页链接，RSSHub 视频与图文订阅。
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
3. 创建笔记数据库 `npx wrangler d1 create yueliu-notes`，创建录音桶 `npx wrangler r2 bucket create yueliu-notes`（需要账号已启用 R2）。
4. 设置环境变量 `YUELIU_D1_ID` 为上一步返回的数据库 ID；如使用其他桶名，设置 `YUELIU_R2_BUCKET`。
5. 执行 `npm run selfhost:deploy`，脚本先构建、应用笔记表迁移，再发布到你账号中的 `yueliu-reader` Worker。
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

### 翻译服务与 B 站

在文章上方点击翻译服务设置，分别填写 Google Cloud Translation API Key 或 DeepL API Key；传统翻译不需要 AI 模型。DeepL 网页版 Pro 与 DeepL API 是不同服务，请选择匹配密钥的 Free / Pro 端点。可先用「测试翻译」验证。默认翻译密钥仅留在浏览器会话；勾选记住后保存到本地。

Google 使用官方神经翻译；AI 会参考相邻片段并遵循风格提示，DeepL 使用上下文、质量优先模式和自定义表达要求。翻译不保证没有误差。

B 站实时查询使用公开网站接口，可能返回风控错误；不伪造热门结果。入门推荐是编辑列表。UID / 主页链接订阅依赖所选 RSSHub 实例，部分实例需要配置 B 站 Cookie；本应用不会代为获取登录信息。Feed 目录在添加时验证可读性，不表示所有上游永久可用。

接口参考：

- https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate
- https://developers.deepl.com/api-reference/translate/request-translation
- https://github.com/DIYgod/RSSHub/tree/master/lib/routes/bilibili

## 测试

```bash
npm run test:reader
```

覆盖正文提取、图文清理、微信结构、RSSHub 路由拼接、名单解析、有效 Feed 判定和超时参数。另有模拟上游的翻译、错误响应、结构化文本、选词问答及分段完整性测试。真实上游可用性需在你部署的网络中检测；没有 API Key 时无法验证真实模型调用。

## 目录

- `app/page.tsx`：阅读界面、订阅和 AI 配置。
- `app/api/`：订阅抓取、原文抓取、AI 转发、RSSHub 检测。
- `components/article-body.tsx`：经过清理的图文正文渲染。
- `components/rsshub-instances.tsx`：公共实例选择和检测进度。
- `lib/`：正文提取、地址校验、Feed 判定及名单快照。
- `scripts/selfhost.mjs`：自行部署命令。

`.openai/hosting.json`、`build/sites-vite-plugin.ts` 和原 `build` 命令保留用于 ChatGPT Sites。自行部署使用 `selfhost:*`，无需原 Sites 账号或其发布凭证。第三方组件保留各自的许可证，详见对应 npm 包及 vendor 目录。

## 文章笔记与沉浸阅读

- 选词后可添加下划线、文字、手写草稿和录音，也可继续引用问 AI。一条笔记可同时包含三种附件内容。
- Apple Pencil 使用「笔划标记」从文字开头划到结尾选中片段。该模式暂停正文滚动，关闭即可继续阅读。草稿纸支持笔色、粗细、撤销；默认忽略触摸落笔，可开启手指书写。
- 录音需要 HTTPS 和麦克风授权，最长 5 分钟／12 MB；不支持录音的浏览器可以上传音频。
- 笔记元数据和矢量笔画存 D1，录音存 R2；各请求按随机 HttpOnly Cookie 凭证隔离，Cookie 原文不写入数据库。服务器保存可跨刷新使用，提供笔记本恢复码，可在另一台设备打开同一本笔记；请妥善保存，持码者拥有访问权限。Cookie 随使用续期，清除 Cookie 后可用恢复码找回。恢复码不包含订阅列表。
- 沉浸模式隐藏订阅和文章列表，可调整 16–32 px 正文字号。系统全屏取决于浏览器支持，iPad 不支持时仍使用铺满页面的沉浸模式。

## 参考项目与新版工作区

本版本参考 BiliPai 的 WBI 搜索及 UP 主投稿接口流程，移植签名规则并接入实际访客 SPI / nav 参数。搜索支持分页与排序，视频和专栏可以直接生成为 JSON Feed；默认不再依赖 RSSHub 节点。RSSHub 保留为可选入口。旧的 B 站 RSSHub 订阅在本阅读器刷新时也尝试直接接口。WBI 不能保证解除 B 站的访问限制：遇到风险挑战、登录要求或超时会返回具体错误，不自动伪造登录、绕过验证码或反复换身份。

Folo 部分参考其内容分区、OPML 预览导入、正文 Readability 和字符编码处理思路：新增文章／视频／音频／图片分区，支持订阅重命名、分组和手动指定内容类型。订阅管理可从 Folo 等客户端导出的 OPML 迁入。B 站视频使用官方嵌入播放器，视频简介与笔记并排显示；音频 enclosure 可直接播放。不调用 Folo 私有服务，也未复制其图标。

笔记+ 部分参考其阅读与草稿并排的交互，自行实现浏览器版：统一选词操作栏、正文四种标记、文字编辑、多页草稿、钢笔／荧光笔／橡皮／套索移动、撤销／重做、纸张样式和缩放、录音。并非嵌入笔记+软件，不包含其原生 iCloud、PDF 引擎或系统级手写能力。默认隔离各本笔记，恢复码提供跨设备访问；同时编辑时最后保存生效。

查看 `THIRD_PARTY.md` 获取来源与许可证说明。项目按 GPL-3.0 开放源码，第三方依赖遵循各自许可证。
