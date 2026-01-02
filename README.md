# SupportBotAI

**Next-Gen AI Customer Support Agent** with session-scoped custom knowledge base, intelligent escalation, and a premium "Earth Tones" UI.

Built with **Google Gemini 2.5 Flash**, Node.js, and React.


## Key Features

- **Contextual Memory**: Remembers conversation history for fluid interactions.
- **Custom Knowledge Base**: Upload your own files (**PDF, DOCX, TXT, JSON, MD**) to create a session-specific knowledge base instantly.
- **Intelligent Escalation**: Detects frustration or complex queries and simulates human hand-off.
- **Premium UI**: "Earth Tones" dark-mode first design with glassmorphism and smooth animations.
- **Resilient AI**: Robust retry logic and model fallback strategy (Gemini 2.5 -> 1.5) for reliability.
- **Secure Parsing**: Native file parsing (no external binaries) with automatic session cleanup.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (NeonDB) with Drizzle ORM
- **AI Model**: Google Gemini 2.5 Flash (via `@google/genai`)
- **File Parsing**: 
  - `pdf2json` (PDF)
  - `mammoth` (DOCX)
  - Native JSON/Text parsing

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State**: TanStack Query
- **Routing**: Wouter

## Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/shank50/supportbotai
cd SupportBotAI

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5000 
```

### 3. Database Setup
Push the schema to your NeonDB instance:
```bash
npm run db:push
```

### 4. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```
Server runs on `http://localhost:5000`.

## API Endpoints

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/session` | Create a new anonymous session |
| `GET` | `/api/session/:id` | Get session details & history |
| `GET` | `/api/session/:id/summary` | Get AI summary of conversation |

### Chat & Context

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message & get response |
| `POST` | `/api/session/:id/context` | Upload custom context file (Multipart form-data) |
| `GET` | `/api/session/:id/context` | Get current context metadata |
| `DELETE`| `/api/session/:id/context` | Remove custom context (Revert to Default FAQs) |

## Custom Context Guide

The bot accepts dynamic context uploads. When a file is uploaded, the bot switches from the default `faqs.json` to the uploaded document for its knowledge base.

- **Supported Files**: `.pdf`, `.docx`, `.txt`, `.json`, `.md`
- **Max Size**: 10MB
- **Cleanup**: Files are automatically deleted after 30 minutes of inactivity.
