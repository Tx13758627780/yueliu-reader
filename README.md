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

本版本参考 BiliPai 的 WBI 搜索及 UP 主投稿接口流程，移植签名规则并接入实际访客 SPI / nav 参数。搜索支持分页与排序，视频和专栏可以直接生成为 JSON Feed；默认不再依赖 RSSHub 节点。RSSHub 保留为可选入口。旧的 B 站 RSSHub 订阅和手动选定的备用实例继续通过该实例读取，避免备用入口再次转回直连。WBI 不能保证解除 B 站的访问限制：遇到风险挑战、登录要求或超时会返回具体错误，不自动伪造登录、绕过验证码或反复换身份。

Folo 部分参考其内容分区、OPML 预览导入、正文 Readability 和字符编码处理思路：新增文章／视频／音频／图片分区，支持订阅重命名、分组和手动指定内容类型。订阅管理可从 Folo 等客户端导出的 OPML 迁入。B 站视频使用官方嵌入播放器，视频简介与笔记并排显示；音频 enclosure 可直接播放。不调用 Folo 私有服务，也未复制其图标。

笔记+ 部分参考其阅读与草稿并排的交互，自行实现浏览器版：统一选词操作栏、正文四种标记、文字编辑、多页草稿、钢笔／荧光笔／橡皮／套索移动、撤销／重做、纸张样式和缩放、录音。并非嵌入笔记+软件，不包含其原生 iCloud、PDF 引擎或系统级手写能力。默认隔离各本笔记，恢复码提供跨设备访问；同时编辑时最后保存生效。

查看 `THIRD_PARTY.md` 获取来源与许可证说明。项目按 GPL-3.0 开放源码，第三方依赖遵循各自许可证。

## 外观、自由笔记与引用

侧栏的「外观与色调」支持主题色、纸张底色和夜读模式，设置按设备保存。移动端订阅标签改为独立网格，按钮高度随文字增长，避免标签换行重叠。

「自由笔记」提供 A4 竖向（794×1123）、A4 横向、大画布和超大画布。支持文字卡片、手写、橡皮、缩放、拖动画布、撤销和重做，卡片之间可连线并填写关系说明。画布先写入 IndexedDB；网页版在联网后同步到原有笔记本。A4 表示画布比例与 96 dpi 尺寸，屏幕上的实际毫米数取决于设备和缩放。

文章工具栏、划词菜单和已保存笔记都有「复制链接」。自由笔记也可复制整本或单张卡片的链接。在画布点「引用」，可搜索文章、文章笔记、其他画布，或粘贴片段链接。同一篇来源可在多张卡片中重复引用。链接只用于定位，不会公开私人笔记或授予笔记本访问权。其他设备需导入备份或恢复同一本笔记本；文章未缓存时需要联网提取。

## 离线使用和备份

网页版准备好离线页面后，再次打开可离线阅读。支持离线创建 / 编辑文字、手写、录音和自由笔记。订阅列表、文章正文和译文改为 IndexedDB 存储，兼容读取旧版本浏览器记录。点击文章上的「离线保存」下载图片与已有录音；视频流、播客音频不会自动整段下载。缓存仅包含网站已公开并成功读取的内容。

侧栏「离线与客户端」显示联网状态、笔记同步情况、客户端直接下载和网页离线更新。新版离线页面下载后，点击「更新并重新打开」应用；更新保留本机文章、笔记和图片缓存。也可导出 / 导入 JSON 备份。备份包含文章、译文和已下载录音，**不含 API 密钥和文章图片**。导入时按稳定 ID 合并，本机较新的笔记保留。备份写入采用跨表事务，失败时不会留下只导入一半的数据。Android 备份及 OPML 导出使用系统文件保存窗口，取消不会显示导出成功。离线副本不能替代备份；卸载客户端或清除网站数据会移除本机数据。

联网功能包括刷新 RSS、下载新文章、外部 AI、Google / DeepL 翻译。此项目不内置离线大模型或离线机器翻译引擎。

## Windows EXE 和 Android APK

客户端加载随安装包内置的网页，不依赖远程首页，也可在首次启动时断网创建笔记。原生客户端的笔记独立保存在设备上，用备份和网页版互相迁移；目前不自动同步原生客户端笔记到云端。

GitHub Actions 的 **Windows EXE and Android APK** 工作流在相关代码推送到 main 时运行，也可从 Actions → Run workflow 手动触发。Windows 与 Android 均成功后，会把新的客户端版本发布到 [Releases 下载页面](https://github.com/Tx13758627780/yueliu-reader/releases)，可直接下载 EXE / APK，无需登录 GitHub。Artifacts 也保留 90 天作为构建记录。已存在的版本保留其原文件，发布下一版需同时更新 `native/package.json` 与锁文件的版本，并维护 `native/RELEASE_NOTES.md`。不要将配置文件或尚在运行的任务当成已生成的安装包。

- Windows：NSIS 安装 EXE 和便携 EXE。未配置商业代码签名证书，系统可能显示发布者未知。
- Android：可自行安装的 debug APK。面向自己测试，不作为应用商店 release 签名包；更新前先备份，换构建机器的 debug 签名可能不同。

本机打包需要 Node.js 22.13+，Android 还需要 Java 21 和 Android SDK，Windows 打包建议在 Windows 运行。

```bash
npm ci
npm ci --prefix native
npm run desktop:windows
# Windows 输出：native/releases/

npm run android:prepare
cd native/android
./gradlew assembleDebug
# Android 输出：app/build/outputs/apk/debug/app-debug.apk
```

`npm run desktop:dev` 启动桌面开发客户端。Windows 包包含独立的 Node API 适配层，用于 RSS / Bilibili / AI 等在线访问；不依赖托管站点。Android 在线请求通过 Capacitor 的原生 HTTP 能力访问设置中的阅流 HTTPS 服务，可改成自己的部署。原生网页仅运行打包脚本；Electron 禁用 Node 集成并启用隔离和沙箱，外部链接交给系统浏览器。

## RSSHub 实例与个人设备

实例目录汇总官方网页、[官方名单源码](https://github.com/RSSNext/rsshub-docs/blob/main/.vitepress/theme/components/InstanceList.vue)及明确对外开放的社区节点，并保留节点路径前缀。名单来自来源记录，不代表服务健康；必须按所选路由逐个测试。可搜索域名、地区、维护者，批量导入 / 导出个人实例（每行一个地址）。Kael 社区节点按维护者公告在 2026-12-31 后不再加入动态名单。

Windows 客户端中，在 RSSHub 页面展开「把这台设备变成 RSSHub 实例」。先安装并启动 Docker Desktop，然后点「一键启用本机实例」。应用启动独立的 `diygod/rsshub:chromium-bundled` 容器，使用固定的应用标签识别自己创建的容器，不会覆盖其他同名容器。默认仅绑定 `127.0.0.1:1200`，不会自动将设备公开到互联网；可停止或重新使用。

网页版提供 Windows 和 Linux / macOS 启动脚本。Android 提供 Termux 安装脚本（需要网络与 Node 环境，受 RSSHub 上游依赖兼容性影响，不包含 Chromium）；APK 不内嵌 RSSHub 后台进程。云端服务无法访问用户设备的 localhost。Android 的原生客户端支持连接同机 `http://127.0.0.1:1200`；远程 / 跨设备实例需自行配置公网 HTTPS 地址。需要登录、Cookie 或浏览器的路由仍需在 RSSHub 端配置。

## Android 应用内更新

在「离线与客户端」检查更新，Android 可直接下载新版、查看进度、取消或重试，完成后点击「继续安装」。首次安装需在系统中允许阅流安装应用；授权后回到阅流再次点击安装。系统安装器负责最后确认。下载由 Android 管理，关掉更新窗口后仍可继续，重新打开会恢复状态。

安装前检查固定 GitHub 仓库下载地址、文件长度、GitHub 提供的 SHA-256、包名、递增版本和签名。签名不同会阻止覆盖升级并保留原应用，不自动卸载或清空笔记。目前不支持签名轮换，只接受相同签名证书。

### 配置固定签名（保留数据覆盖更新必需）

维护者在 GitHub 仓库 Settings → Secrets and variables → Actions 添加一个名为 `ANDROID_SIGNING_JSON` 的 Repository secret，内容为：

```json
{
  "keystore": "签名 keystore 文件的 Base64 内容",
  "alias": "yueliu",
  "storePassword": "密钥库密码",
  "keyPassword": "签名密钥密码"
}
```

如果已有签名密钥，必须一直使用原来的密钥。没有时可用 JDK 自带的 keytool 创建 PKCS12 密钥库：

```bash
keytool -genkeypair -keystore yueliu-release.p12 -storetype PKCS12 -alias yueliu -keyalg RSA -keysize 3072 -validity 10000
```

妥善备份密钥库和密码，不要把它们提交到源码仓库。配置后工作流自动生成固定签名的 release APK；没有 secret 时仍生成 debug 测试 APK，明确提示可能无法跨构建覆盖升级。临时密钥文件在构建后删除。第一次从旧测试签名迁移到固定签名时，仍需先完整备份并确认备份可用，再迁移安装；此后保持同一签名才能保留本机数据覆盖升级。


### 修复 Android 覆盖安装冲突（维护者一次性操作）

v0.2.3 与 v0.2.5 实际使用了不同的临时测试签名，不能相互覆盖。新建固定签名不能恢复旧签名，也不能直接保留数据覆盖这些旧测试版。先在旧版导出笔记备份并确认文件存在；固定签名版发布前不要卸载旧版。

当前打包流程在缺少 `ANDROID_SIGNING_JSON` 时会停止，不再自动发布随机签名的测试 APK。

在你自己的电脑安装 Node.js、Java JDK 和 GitHub CLI，下载本仓库源码，在源码目录运行：

```sh
gh auth login
node scripts/setup-android-signing.mjs
```

脚本会在个人目录的 `.yueliu-signing` 中创建密钥和配置备份，通过 GitHub CLI 将配置写入本仓库的 Actions Secret。它不会把密钥写到源码目录，也不会打印密码；若仓库已有该 Secret，它会停止以免覆盖既有签名。请安全备份整个 `.yueliu-signing` 目录，不要提交到公开仓库。若已有历史正式签名密钥，请使用原来的备份，不要生成新的。

配置完成后发布一个更高版本的新 APK。签名不同的旧测试版需要一次备份迁移，此后各版保持同一固定签名即可覆盖更新。


### 扩展订阅目录

「添加订阅 → 订阅目录」可切换 79 个精选订阅 与 Folo 平台目录。公开快照含 1501 个平台和 3066 个可配置路由（非实时排行榜）；82 个平台未能静态提取路由，只提供官方资料入口。可搜索名称、域名、内容并按分类浏览。选中平台后填写作者 / 频道 / 栏目，再用当前 RSSHub 实例订阅或切换实例检测。

Nature 主刊与系列期刊提供官方 RSS。柳叶刀官方 RSS 可能超时或拒绝抓取，另提供明确标注的 Crossref 论文题录源，包含标题、作者、出版日期与 DOI，不提供付费全文。Android 对 Crossref 的解析也在客户端实现，可兼容尚未更新的阅读服务。

数据来源及许可见 THIRD_PARTY.md。重新生成目录：将 Folo 的公开 discover-sources.json 与 RSSHub 的 lib/routes 源码下载到本地，再运行 `node scripts/import-discovery.mjs <folo-json> <rsshub-lib-routes-directory>`；脚本仅解析声明，不执行上游代码。

0.2.7：新增 Nature / 柳叶刀专用目录，柳叶刀系列 Crossref 题录按各期刊标注。B 站支持 UP 主视频、专栏、动态（含图文），安卓通过原生 HTTP 请求接口；视频详情提供简介和分 P 信息，不冒充字幕。
