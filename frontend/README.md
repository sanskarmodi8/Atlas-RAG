# AtlasRAG Frontend

Next.js 14 frontend for AtlasRAG multi-document research assistant.

## Prerequisites

- Node.js 18+ 
- Backend running on `http://localhost:8000`

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Upload PDF Documents** - Multi-file upload support
- **QA Mode** - Ask questions with citations
- **Summarize Mode** - Generate document summaries
- **Conversation Memory** - Context-aware chat
- **Session Persistence** - Maintains state across page reloads

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React Icons

## Project Structure

```
atlasrag-frontend/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main application
│   └── globals.css      # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Integration

Backend endpoints:
- `POST /docs/upload` - Upload PDFs
- `POST /chat/ask` - QA and summarization

See backend documentation for full API details.
