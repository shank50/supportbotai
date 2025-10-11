# SupportBotAI# SupportBotAI



AI-powered customer support bot with contextual memory, FAQ matching, and automatic escalation handling.Minimal AI-powered customer support bot.



## Tech Stack## Objective

Simulate customer support interactions using AI for FAQs and escalation scenarios.

**Backend**: Express.js, TypeScript, Node.js 18+  

**AI/LLM**: Google Gemini API (gemini-2.0-flash-exp)  ## Scope

**Database**: PostgreSQL (NeonDB), Drizzle ORM  - Input: FAQs dataset & customer queries

**Frontend**: React 18, TanStack Query, Wouter, Tailwind CSS  - Contextual memory to retain previous conversation

**Build**: Vite, tsx- Escalation simulation when query not answered

- Optional frontend chat interface

## Setup

## Technical Expectations

1. Clone the repository- Backend API with REST endpoints

```bash- LLM integration for response generation

git clone https://github.com/shank50/supportbotai 

cd SupportBotAI

```## LLM Usage Guidance

- Generate responses, summarize conversations, suggest next actions

2. Install dependencies

```bash## Deliverables

npm install- GitHub repo

```- README documenting prompts



3. Configure environment variables

Create a `.env` file

```env- Conversational accuracy

DATABASE_URL=your_neondb_connection_string

GEMINI_API_KEY=your_gemini_api_key

```



4. Initialize database

```bash

npm run db:push

```
## API Endpoints

**POST** `/api/session` — Create session

5. Start development server

```bash**POST** `/api/chat` — Send message, get AI response

npm run dev

```**GET** `/api/session/:sessionId` — Get session details



Server runs on `http://localhost:5000`**GET** `/api/session/:sessionId/summary` — Get conversation summary



## API Reference---



### 1. Create Session## API Testing (curl)

**POST** `/api/session`

Create session:

Creates a new chat session.```bash

curl -X POST http://localhost:5000/api/session

**Response:**```

```json

{Send message:

  "sessionId": "uuid-string"```bash

}curl -X POST http://localhost:5000/api/chat \

```  -H "Content-Type: application/json" \

  -d '{"sessionId":"SESSION_ID","message":"What are your business hours?"}'

---```



### 2. Send MessageGet session details:

**POST** `/api/chat````bash

curl http://localhost:5000/api/session/SESSION_ID

Sends a message and receives AI response.```



**Request Body:**Get summary:

```json```bash

{curl http://localhost:5000/api/session/SESSION_ID/summary

  "sessionId": "uuid-string",```

  "message": "What are your business hours?"
}
```

**Response:**
```json
{
  "userMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "sender": "user",
    "content": "What are your business hours?",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "metadata": null
  },
  "botMessage": {
    "id": "uuid",
    "sessionId": "uuid",
    "sender": "bot",
    "content": "We are open Monday to Friday, 9 AM to 6 PM EST...",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "metadata": {
      "matchedFAQ": {
        "question": "What are your business hours?",
        "category": "General"
      },
      "suggestedActions": ["contact_support", "view_pricing"]
    }
  },
  "escalation": null,
  "shouldEscalate": false
}
```

**Escalation Response:**
```json
{
  "userMessage": { ... },
  "botMessage": { ... },
  "escalation": {
    "id": "uuid",
    "sessionId": "uuid",
    "reason": "Complex technical query requiring human expertise",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "resolved": false
  },
  "shouldEscalate": true
}
```

---

### 3. Get Session Details
**GET** `/api/session/:sessionId`

Retrieves complete session information including all messages and escalations.

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastActivityAt": "2024-01-01T00:05:00.000Z"
  },
  "messages": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "sender": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "metadata": null
    },
    {
      "id": "uuid",
      "sessionId": "uuid",
      "sender": "bot",
      "content": "Hello! How can I help you today?",
      "timestamp": "2024-01-01T00:00:01.000Z",
      "metadata": { ... }
    }
  ],
  "escalations": []
}
```

---

### 4. Get Conversation Summary
**GET** `/api/session/:sessionId/summary`

Generates an AI-powered summary of the conversation.

**Response:**
```json
{
  "summary": "Customer inquired about business hours and pricing plans. Provided information about Monday-Friday 9 AM - 6 PM EST schedule and directed to pricing page for plan details. No escalation required."
}
```

## Testing with curl

```bash
# 1. Create session
curl -X POST http://localhost:5000/api/session

# 2. Send message (replace SESSION_ID)
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","message":"What are your business hours?"}'

# 3. Get session details
curl http://localhost:5000/api/session/SESSION_ID

# 4. Get summary
curl http://localhost:5000/api/session/SESSION_ID/summary
```
