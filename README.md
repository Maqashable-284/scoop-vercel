# Scoop AI Next.js Frontend 🍨

**ქართული სპორტული კვების AI ჩატბოტის веб-ინტერფეისი**

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Cloud Run](https://img.shields.io/badge/Google-Cloud%20Run-blue.svg)](https://cloud.google.com/run)

---

## 🎯 რა არის?

Next.js 15-ზე დაფუძნებული веб-ინტერფეისი **Scoop AI Agent**-ისთვის. სრული ფუნქციონალით:
- 💬 Chat interface ქართულ ენაზე
- 📱 Responsive design
- 🎨 Scoop Lab brand design
- ⚡ Real-time API integration
- 🤖 **Dynamic LLM Responses** with Markdown rendering

---

## ✨ ფუნქციონალი (v2.0)

| Feature | აღწერა |
|---------|--------|
| **Chat Interface** | მესიჯების გაცვლა AI ასისტენტთან |
| **Perplexity-Style Loader** | ანიმაციური skeleton loader ("ვამოწმებ ხელმისაწვდომობას...") |
| **Dynamic Quick Replies** | LLM-ის მიერ გენერირებული follow-up კითხვები |
| **Markdown Rendering** | სრული markdown support პასუხებში |
| **Conversation History** | Sidebar საუბრების ისტორიით (list-based rendering) |
| **Scoop Lab Design** | Pine Green, sterile white, medical look |
| **Hover Effects** | Interactive buttons with Pine Green hover state |

---

## 🎨 Design - Scoop Lab Brand

| Element | Style |
|---------|-------|
| **Primary Color** | Pine Green `#0A7364` |
| **Background** | Sterile White `#FFFFFF` |
| **Accent** | Metallic Gold `#D9B444` |
| **User Messages** | Pine Green background, modern corners |
| **Bot Messages** | White card with light border |
| **Buttons** | Hover: Pine Green border + tint |

---

## 📁 კომპონენტები

| Component | აღწერა |
|-----------|--------|
| `Chat.tsx` | მთავარი chat component - state management, API calls |
| `chat-response.tsx` | LLM პასუხების ჩვენება markdown-ად + quick replies |
| `chat-loader.tsx` | Perplexity-style skeleton loader ანიმაციებით |
| `empty-screen.tsx` | საწყისი ეკრანი კატეგორიების ღილაკებით |
| `scoop-logo.tsx` | Scoop AI SVG ლოგო კომპონენტი |

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

გახსენით http://localhost:3000

---

## 📦 Build & Deploy

### Local Build
```bash
npm run build
npm start
```

### Docker (Cloud Run)
```bash
docker build -t scoop-vercel .
docker run -p 8080:8080 scoop-vercel
```

### Cloud Run Auto-Deploy
GitHub push → ავტომატური Cloud Run deploy

---

## 🔧 Configuration

### Environment Variables

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://scoop-ai-sdk-xxx.run.app` |

### Backend Integration

Widget იყენებს `/chat` endpoint-ს და იღებს dynamic quick_replies:

```typescript
const response = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    body: JSON.stringify({
        user_id: `widget_${convId}`,
        message: text,
        conversation_id: convId,
    }),
});

const data = await response.json();
// data.response_text_geo - LLM response (markdown)
// data.quick_replies - Dynamic follow-up buttons
```

---

## 🔗 Related Repositories

- [claude-agent-experiments](https://github.com/Maqashable-284/claude-agent-experiments) - Python Backend (Claude Agent SDK)
- [scoop-chainlit](https://github.com/Maqashable-284/scoop-chainlit) - Chainlit Web UI
- [Vercel-designer](https://github.com/Maqashable-284/Vercel-designer) - Design Source

---

## 📄 License

MIT
