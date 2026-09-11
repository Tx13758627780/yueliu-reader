# Sources and licenses

## BiliPai
- Repository: https://github.com/jay3-yy/BiliPai
- Reference revision: bdceebe32dafc17010c035e23c9c93336d0be497
- Source files: `core/network/WbiUtils.kt`, `core/network/WbiKeyManager.kt`, `core/network/ApiClient.kt`, `data/repository/SearchRepository.kt` under `app/src/main/java/com/android/purebilibili/`.
- Copyright: YangY and BiliPai contributors. License: GNU GPL v3 (see LICENSE).
- `lib/bili-client.ts` adapts the WBI signing protocol to TypeScript/Cloudflare Workers and implements its own bounded read-only session/request flow. No Android binaries, proprietary credentials, or visual assets are distributed.

## Folo
- Repository: https://github.com/RSSNext/Folo
- Reference revision: 41d009a87e651388fa4c4460c90baef3a2bbbdaa
- References: `packages/readability/src/index.ts`, `apps/cli/src/commands/opml.ts`, `apps/mobile/native/ios/Models/ProfileData.swift`.
- License of upstream: AGPL-3.0 with an icon redistribution exception.
- Used to understand content categories, OPML interoperability and reader behavior. Our implementations are independent; no Folo client SDK, source code, private API, logos, or restricted icons are bundled.

## Notes+
- Official site: https://www.notesplus.com/
- Used as a product-interaction reference for reading and handwriting side by side. No Notes+ source code, assets, branding, proprietary APIs, or iCloud integration are included.

## Other dependencies
Mozilla Readability, DOMPurify, React, Lucide and remaining npm dependencies retain their own licenses. See package metadata and installed dependency LICENSE files.

- Electron and electron-builder: desktop runtime and installer tools, original project licenses apply. Capacitor: Android runtime and native HTTP bridge. No remote Node integration is enabled.
- RSSHub remains a separate, user-started Docker / Termux service; this reader does not bundle RSSHub server source or claim all routes work. Official instance data is read from RSSNext/rsshub-docs `.vitepress/theme/components/InstanceList.vue`. Additional Kael instance source: https://github.com/dreamingms/kael-public-services (announced expiry 2026-12-31).


## Subscription discovery metadata

The platform names, hostnames and category facts in `lib/discovery-data.json` are derived from the public RSSNext/Folo `apps/landing/public/discover-sources.json` catalog, retrieved 2026-09-10. No Folo application code or UI was copied. Folo repository: https://github.com/RSSNext/Folo (AGPL-3.0 with its stated exception). This is a static public directory, not Folo private subscriptions, a live popularity ranking, or an affiliation with Folo. Adult-content entries are omitted.

Declarative RSSHub route paths, parameter descriptions and capability metadata were extracted without executing source from https://github.com/DIYgod/RSSHub (revision `0a4ecdb02390fb047bb675a1764e1dedbf5cf9bc`, refreshed 2026-09-11, including TSX route declarations). RSSHub is MIT licensed; see `vendor/rsshub-LICENSE`. Extraction script: `scripts/import-discovery.mjs`. Computed route definitions that cannot be statically extracted link to official source documentation rather than invented paths.

Nature journal RSS belongs to Nature Portfolio. The Lancet official RSS may reject automated access. The separately labeled Crossref feed supplies publication metadata and DOI links only, not full text and not a publisher-operated RSS feed.

Bilibili detail and space-dynamic request contracts reference BiliPai `ApiClient.kt`: `/x/web-interface/view`, `/x/article/view`, and `/x/polymer/web-dynamic/v1/feed/space`. Native Android executes these read-only requests through Capacitor HTTP. `@noble/hashes` (MIT) provides portable MD5 for the public WBI protocol.

Additional journal metadata was checked against Crossref `/journals/{ISSN}` on 2026-09-11; canonical ISSNs and metadata URLs are recorded in `lib/journal-feed.ts`. Nature Reviews Neuroscience RSS is listed at https://www.nature.com/nrn/web-feeds .
