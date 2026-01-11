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

---

## ✨ ფუნქციონალი

| Feature | აღწერა |
|---------|--------|
| **Chat Interface** | მესიჯების გაცვლა AI ასისტენტთან |
| **Loading Phases** | ანიმაციური loading (🔍 ვეძებ...) |
| **Markdown Rendering** | სრული markdown support |
| **Quick Replies** | Backend-დან მოცემული ღილაკები |
| **Conversation History** | Sidebar საუბრების ისტორიით |
| **Scoop Lab Design** | Pine Green, sterile white, medical look |

---

## 🎨 Design - Scoop Lab Brand

| Element | Style |
|---------|-------|
| **Primary Color** | Pine Green `#0A7364` |
| **Background** | Sterile White `#FFFFFF` |
| **User Messages** | Pine Green background, modern corners |
| **Bot Messages** | Light Gray `#F9FAFB` + border |
| **Send Button** | Circular, Pine Green |

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

Widget იყენებს `/chat` endpoint-ს:

```typescript
const response = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    body: JSON.stringify({
        user_id: `widget_${convId}`,
        message: text,
        conversation_id: convId,
    }),
});
```

---

## 📁 პროექტის სტრუქტურა

```
scoop-vercel/
├── Dockerfile          # Cloud Run deploy
├── next.config.ts      # standalone output
├── package.json
├── public/             # Static assets
└── src/
    ├── app/
    │   ├── layout.tsx  # Root layout + fonts
    │   └── page.tsx    # Main page
    ├── components/
    │   └── Chat.tsx    # Main chat component
    └── styles/
        └── widget.css  # Scoop Lab styling
```

---

## 🔗 Related Repositories

- [claude-agent-experiments](https://github.com/Maqashable-284/claude-agent-experiments) - Python Backend (Claude Agent SDK)
- [scoop-chainlit](https://github.com/Maqashable-284/scoop-chainlit) - Chainlit Web UI

---

## 📄 License

MIT
