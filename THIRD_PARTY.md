# Sources and licenses

## BiliPai
- Repository: https://github.com/jay3-yy/BiliPai
- Reference revision: f3060cc2946f37e6c7845069d6ee3a98f6dbcf31
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
