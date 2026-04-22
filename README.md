# Cultura Segreta

An interactive travel-chat web app for discovering Italian cities through fictionalized message threads, local guides, cultural prompts, photo check-ins, and Kimi-powered free chat.

Live site: https://cultura-segreta.vercel.app/

## 中文简介

Cultura Segreta 是一个“像收到意大利本地人消息一样旅行”的互动网页应用。用户可以选择城市，阅读角色聊天、打开作品和地点卡片、完成轻量打卡，并通过安全的后端代理向角色继续提问。

## What It Does

- Pick one of six Italian city routes.
- Read scripted iMessage-style conversations with artists, locals, guides, and city personas.
- Open artwork, place, tip, and reference cards inside the chat flow.
- Ask characters follow-up questions through a secure Vercel API proxy.
- Save photo check-ins locally in the browser and browse them by tag.
- Track lightweight city tasks and hidden character moments.

## Tech Stack

- React 18
- Vite
- Vercel Serverless Functions
- Moonshot/Kimi chat completions API

## Project Structure

```text
.
+-- api/
|   +-- chat.js                  # Server-side Kimi API proxy
+-- src/
|   +-- main.jsx                 # React entry point
+-- conversations.js             # Characters, groups, scripted chat content
+-- cultural-gossip-guide.jsx    # Main application UI
+-- data.js                      # City metadata and image references
+-- index.html
+-- package.json
+-- vite.config.js
```

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file if you want to test free chat:

```bash
cp .env.example .env
```

Then set:

```text
MOONSHOT_API_KEY=your_kimi_api_key_here
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Vercel Setup

Add these environment variables in Vercel Project Settings:

| Name | Required | Notes |
| --- | --- | --- |
| `MOONSHOT_API_KEY` | Yes | Your Kimi/Moonshot API key. Do not expose this in frontend code. |
| `KIMI_MODEL` | No | Defaults to `kimi-k2.5`. |
| `MOONSHOT_ENDPOINT` | No | Defaults to `https://api.moonshot.cn/v1/chat/completions`. |

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## Security Notes

The Kimi API key is only read by `api/chat.js` on the server. The frontend calls `/api/chat`, so the key is not bundled into the browser.

Never commit `.env`, `.env.local`, Vercel local config, or API keys.

## License

See [LICENSE](./LICENSE). Source code is MIT licensed. Original narrative, app copy, and creative content are for non-commercial use with attribution unless the author grants separate permission.
