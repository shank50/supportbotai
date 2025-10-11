# SupportBotAI
AI-powered customer support bot with contextual memory, FAQ matching, and automatic escalation handling.

A minimal AI-driven customer support system designed to simulate real-world interactions, handle FAQs, and escalate complex queries intelligently.

## Tech Stack

### Backend
- Express.js
- TypeScript
- Node.js 18+
- Drizzle ORM
- PostgreSQL (NeonDB)

### AI / LLM
- Google Gemini API (gemini-2.0-flash-exp)

### Frontend
- React 18
- TanStack Query
- Wouter
- Tailwind CSS
- Build Tool: Vite, tsx

## Objective

Simulate customer support interactions using AI for FAQs and escalation scenarios with:
- Contextual memory for retaining previous messages.
- Escalation simulation when AI cannot answer.
- Optional web chat interface.

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/shank50/supportbotai
cd SupportBotAI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup FAQ Corpus

Create a JSON file with all the FAQ dataset and customer queries at `server/faqs.json`

### 4. Configure environment variables
Create a `.env` file:
```env
DATABASE_URL=your_neondb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Initialize database
```bash
npm run db:push
```

### 6. Start the development server
```bash
npm run dev
```
Server runs on http://localhost:5000

## API Endpoints

### POST /api/session — Create a new session
Creates a new chat session.

#### Example:
```bash
curl -X POST http://localhost:5000/api/session
```

**Response:**
```json
{
  "sessionId": "uuid-string"
}
```

### POST /api/chat — Send a message and get AI response
Sends a message from the user and retrieves an AI-generated response.

#### Request Body:
```json
{
  "sessionId": "uuid-string",
  "message": "What are your business hours?"
}
```

#### Example:
```bash
curl -X POST http://localhost:5000/api/chat   -H "Content-Type: application/json"   -d '{"sessionId":"SESSION_ID","message":"What are your business hours?"}'
```

#### Response:
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

#### Escalation Response Example:
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

### GET /api/session/:sessionId — Get session details
Retrieves complete session data, including all messages and escalations.

#### Example:
```bash
curl http://localhost:5000/api/session/SESSION_ID
```

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
      "metadata": { }
    }
  ],
  "escalations": []
}
```

### GET /api/session/:sessionId/summary — Get conversation summary
Generates an AI summary of the session conversation.

#### Example:
```bash
curl http://localhost:5000/api/session/SESSION_ID/summary
```

**Response:**
```json
{
  "summary": "Customer inquired about business hours and pricing plans. Provided details about the 9 AM - 6 PM schedule and linked to the pricing page. No escalation required."
}
```

## Testing with curl

```bash
# 1. Create session
curl -X POST http://localhost:5000/api/session

# 2. Send message (replace SESSION_ID)
curl -X POST http://localhost:5000/api/chat   -H "Content-Type: application/json"   -d '{"sessionId":"SESSION_ID","message":"What are your business hours?"}'

# 3. Get session details
curl http://localhost:5000/api/session/SESSION_ID

# 4. Get summary
curl http://localhost:5000/api/session/SESSION_ID/summary
```


- README documenting setup, endpoints, and sample prompts
- Demonstration of contextual conversation accuracy
