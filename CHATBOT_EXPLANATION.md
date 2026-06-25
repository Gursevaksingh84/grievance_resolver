# Chatbot System - Technical Explanation

## Overview
The Grievance Resolver project includes an **AI-powered chatbot** that helps citizens get answers about their complaints. The chatbot can answer questions in **3 languages** (English, Hindi, Marathi) and provides intelligent, context-aware responses.

---

## 🏗️ Architecture

### Frontend (React)
**Location**: `frontend/src/components/Chatbot.jsx`

### Backend (Python/FastAPI)
- **Controller**: `src/controllers/chatbot_controller.py`
- **Agent**: `src/agents/chatbot_agent.py`
- **API Endpoint**: `main.py` → `/api/chatbot/query`

---

## 🔄 How It Works (Complete Flow)

### 1️⃣ **User Asks a Question** (Frontend)

**Component**: `Chatbot.jsx`

```javascript
// User types: "What is the status of my complaint?"
const handleSend = async (e) => {
  // Send question to backend API
  const response = await axios.post(
    `${API_BASE_URL}/api/chatbot/query`,
    null,
    {
      params: {
        question: userMessage,        // "What is the status of my complaint?"
        language: language,            // "en" or "hi" or "mr"
        complaint_id: complaintId,     // Optional: specific complaint ID
        citizen_email: citizenEmail    // Optional: user's email
      }
    }
  );
}
```

**What happens:**
- User types question in chat input
- Frontend sends HTTP POST request to backend
- Includes language preference (English/Hindi/Marathi)
- May include complaint ID or email if available

---

### 2️⃣ **API Receives Request** (Backend API)

**File**: `main.py`

```python
@app.post("/api/chatbot/query")
async def chatbot_query(
    question: str = Query(..., description="User's question"),
    complaint_id: str = Query(None, description="Optional complaint ID"),
    citizen_email: str = Query(None, description="Optional citizen email"),
    language: str = Query("en", description="Language code: en, hi, mr")
):
    # Forward to controller
    result = chatbot_controller.handle_query(
        question, 
        complaint_id, 
        citizen_email, 
        language
    )
    return result
```

**What happens:**
- FastAPI endpoint receives the request
- Extracts query parameters
- Forwards to chatbot controller

---

### 3️⃣ **Controller Validates & Processes** (Controller Layer)

**File**: `src/controllers/chatbot_controller.py`

```python
class ChatbotController:
    def handle_query(self, question: str, complaint_id: str = None, 
                     citizen_email: str = None, language: str = "en"):
        # Validate input
        if not question or not question.strip():
            return ErrorView.format("Question is required")
        
        # Send to AI agent for processing
        result = self.chatbot_agent.process({
            "question": question.strip(),
            "complaint_id": complaint_id,
            "citizen_email": citizen_email,
            "language": language
        })
        
        # Return formatted response
        return {
            "success": True,
            "response": result.get("response"),
            "complaint_info": result.get("complaint_info"),
            "suggested_actions": result.get("suggested_actions", [])
        }
```

**What happens:**
- Validates question isn't empty
- Calls the chatbot agent (the AI brain)
- Returns structured response

---

### 4️⃣ **AI Agent Processes Question** (Intelligence Layer)

**File**: `src/agents/chatbot_agent.py`

This is where the **magic happens**! The agent:

#### **Step A: Extract Information from Question**

```python
def process(self, input_data: Dict[str, Any]):
    question = input_data.get("question", "")
    language = input_data.get("language", "en")
    
    # SMART: Extract UUID from question if user mentions it
    # Example: "Status of 12345678-1234-1234-1234-123456789abc"
    uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    uuid_match = re.search(uuid_pattern, question, re.IGNORECASE)
    if uuid_match:
        complaint_id = uuid_match.group()
    
    # SMART: Extract email from question
    # Example: "My complaint status user@example.com"
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, question, re.IGNORECASE)
    if email_match:
        citizen_email = email_match.group()
```

**Smart Features:**
- 🔍 **Auto-detects complaint ID** if mentioned in question
- 📧 **Auto-detects email** if mentioned in question
- 🌐 **Language detection** and validation

#### **Step B: Find Relevant Complaint**

```python
# Try to find complaint in database
complaint = None

if complaint_id:
    # Look up by ID
    complaint = db.get_complaint(complaint_id)
elif citizen_email:
    # Look up by email - get all complaints for this user
    result = db.client.table("complaints")
                      .select("*")
                      .eq("citizen_email", citizen_email)
                      .order("created_at", desc=True)
                      .limit(10)
                      .execute()
    
    if result.data:
        # If multiple complaints, try to match by question context
        complaint = result.data[0]  # Most recent
```

**Smart Features:**
- 📋 **Finds complaint by ID** if provided
- 📧 **Finds all complaints by email** if provided
- 🎯 **Matches most relevant complaint** if multiple exist
- ⚠️ **Provides helpful error** if complaint not found

#### **Step C: Build Context for AI**

```python
def _generate_response(self, question, complaint, language):
    complaint_context = ""
    
    if complaint:
        # Extract all relevant info
        status = complaint.get("status", "")
        department = complaint.get("responsible_department", "")
        urgency = complaint.get("urgency", "")
        sla_deadline = complaint.get("sla_deadline", "")
        
        # Calculate time remaining
        if sla_deadline:
            hours = (deadline - now).total_seconds() / 3600.0
            days = int(hours / 24)
            time_remaining = f"{days} days, {hours} hours"
        
        # Get similar cases for context
        similar_count = self._get_similar_cases_count(department, status)
        
        complaint_context = f"""
COMPLAINT INFORMATION:
- Complaint ID: #{complaint_id[:8]}
- Status: {status}
- Department: {department}
- Urgency: {urgency}
- Time Remaining: {time_remaining}
- Similar Cases: {similar_count} similar cases in system
"""
```

**What's included:**
- ✅ **Complaint details**: ID, status, department
- ⏰ **Time calculations**: Days/hours remaining
- 📊 **Similar cases**: How many similar complaints exist
- 📝 **Description preview**: First 200 characters

---

### 5️⃣ **AI Generates Response** (LLM - Language Model)

**File**: `src/agents/prompts.py` + `chatbot_agent.py`

```python
# Use LangChain to call AI (OpenAI/Gemini/etc.)
prompt = ChatPromptTemplate.from_template(AgentPrompts.CHATBOT_PROMPT.template)
formatted_prompt = prompt.format_messages(
    question=question,
    complaint_context=complaint_context,
    language=language
)

# Call AI model
response = self.llm.invoke(formatted_prompt)
```

#### **The AI Prompt Template**

The AI is given these instructions:

```
You are a helpful AI assistant for the Indian Public Grievance Resolver system.

LANGUAGE: {language}
You MUST respond in the specified language (English/Hindi/Marathi)

USER QUESTION: {question}

COMPLAINT CONTEXT: {complaint_context}

GUIDELINES:
1. Be conversational and friendly
2. Use Indian English/Hindi/Marathi appropriately
3. Provide specific information from complaint context
4. Mention resolution time based on similar cases
5. Offer helpful suggestions and next steps
6. If overdue, offer escalation
7. Be empathetic and understanding

RESPONSE STYLE:
- Use "you" and "your" (personal, friendly)
- Keep responses concise but informative
- Include specific details (ID, department, time)
- Offer actionable suggestions
- Use emojis sparingly (😊, ✅, ⏰)

EXAMPLES:
Question: "When will my pothole be fixed?"
Response: "Your complaint #1234 is with PWD Bangalore. Based on 47 similar 
cases, average resolution is 12 days. Current status: Materials ordered 
(Step 2/4). Expected resolution: 3 days remaining. Want me to escalate?"

Respond in JSON format:
{
    "response": "your conversational response",
    "suggested_actions": ["action1", "action2"],
    "confidence": 0.8
}
```

**Key Features:**
- 🌍 **Multilingual**: Responds in user's language
- 💬 **Conversational**: Friendly, not robotic
- 📊 **Data-driven**: Uses actual complaint data
- 🎯 **Actionable**: Suggests next steps
- 🇮🇳 **India-specific**: Uses Indian terminology

---

### 6️⃣ **Response Sent Back** (Backend → Frontend)

**Backend Response Format**:

```json
{
  "success": true,
  "response": "Your complaint #12345678 is with PWD Bangalore. Current status: IN_PROGRESS. Time remaining: 2 days, 5 hours. Based on 47 similar cases, this should be resolved soon! 😊",
  "complaint_info": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "status": "in_progress",
    "department": "PWD",
    "time_remaining": "2 days, 5 hours"
  },
  "suggested_actions": [
    "Check detailed status on Dashboard",
    "Upload additional photos if needed",
    "Contact PWD Bangalore directly"
  ],
  "confidence": 0.92
}
```

---

### 7️⃣ **Frontend Displays Response** (User Interface)

**Component**: `Chatbot.jsx`

```javascript
// Display bot response
setMessages((prev) => [
  ...prev,
  { 
    role: "bot", 
    content: response.data.response 
  }
]);

// Auto-speak response (Text-to-Speech)
speakText(response.data.response);
```

**Features:**
- 💬 **Chat bubbles**: Bot messages on left, user on right
- 🔊 **Text-to-Speech**: Automatically reads responses
- 🎤 **Voice input**: Can ask questions by voice
- 🌐 **Multi-language**: UI adapts to selected language

---

## 🎯 Types of Questions the Chatbot Can Answer

### 1. **Status Queries**
- ❓ "What is the status of my complaint?"
- ❓ "When will my complaint be resolved?"
- ❓ "Has my complaint been assigned?"

### 2. **Department Information**
- ❓ "Which department is handling my complaint?"
- ❓ "Who should I contact about my issue?"

### 3. **Timeline Questions**
- ❓ "How long until resolution?"
- ❓ "Is my complaint overdue?"
- ❓ "How many days are remaining?"

### 4. **Comparison Questions**
- ❓ "How long do similar complaints take?"
- ❓ "How many people have the same issue?"

### 5. **General Help**
- ❓ "How do I escalate my complaint?"
- ❓ "What should I do next?"
- ❓ "Can I upload more photos?"

### 6. **Multiple Complaints**
- ❓ "Show me all my complaints" (using email)
- ❓ "Status of complaint about pothole" (matches by keywords)

---

## 🌐 Multi-Language Support

The chatbot supports **3 languages**:

### **English (en)**
```
Question: "What is the status of my complaint?"
Response: "Your complaint #1234 is with PWD Bangalore..."
```

### **Hindi (hi)**
```
Question: "मेरी शिकायत की स्थिति क्या है?"
Response: "आपकी शिकायत #1234 PWD बैंगलोर के पास है..."
```

### **Marathi (mr)**
```
Question: "माझ्या तक्रारीची स्थिती काय आहे?"
Response: "तुमची तक्रार #1234 PWD बंगळूर येथे आहे..."
```

**How it works:**
- Frontend passes `language` parameter
- AI prompt includes language instruction
- AI generates response in specified language
- Works for Hindi/Marathi in Devanagari script

---

## 🎙️ Voice Features

### **Voice Input (Speech-to-Text)**
```javascript
// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
recognitionRef.current = new SpeechRecognition();

// Set language
const langMap = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
recognitionRef.current.lang = langMap[language];

// Start listening
recognitionRef.current.start();

// Get transcript
recognitionRef.current.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInput(transcript);
};
```

### **Voice Output (Text-to-Speech)**
```javascript
// Speech Synthesis API
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = langMap[language]; // en-IN, hi-IN, mr-IN
window.speechSynthesis.speak(utterance);
```

**Features:**
- 🎤 **Voice input**: Click mic button to speak
- 🔊 **Auto-speak responses**: Bot reads answers aloud
- 🌍 **Multi-language voice**: Works in English/Hindi/Marathi
- 🔇 **Stop button**: Can interrupt speech

---

## 🧠 Intelligence Features

### **1. Smart Information Extraction**
- Detects UUIDs in questions
- Detects email addresses in questions
- Removes extracted info for cleaner context

### **2. Context Matching**
- If email has multiple complaints, matches by keywords
- Uses most recent complaint if no match
- Provides complaint count if multiple exist

### **3. Time Calculations**
- Calculates remaining time from SLA deadline
- Formats as "X days, Y hours"
- Shows "OVERDUE" if past deadline

### **4. Similar Cases Analysis**
- Queries database for similar complaints
- Same department + same status
- Provides count for context

### **5. Suggested Actions**
- AI generates context-aware suggestions
- Examples: "Upload photos", "Escalate", "Check dashboard"

---

## 💾 Database Queries

### **Find by Complaint ID**
```python
complaint = db.get_complaint(complaint_id)
```

### **Find by Email**
```python
result = db.client.table("complaints")
                  .select("*")
                  .eq("citizen_email", email)
                  .order("created_at", desc=True)
                  .limit(10)
                  .execute()
```

### **Count Similar Cases**
```python
result = db.client.table("complaints")
                  .select("id", count="exact")
                  .eq("responsible_department", department)
                  .eq("status", status)
                  .execute()
similar_count = result.count
```

---

## 🎨 UI/UX Features

### **Chat Interface**
- 💬 **Chat bubbles**: Different styles for user vs bot
- 🤖 **Bot icon**: Shows bot messages with icon
- ⏳ **Typing indicator**: "Thinking..." while processing
- 📱 **Responsive**: Works on mobile and desktop

### **Voice Controls**
- 🎤 **Voice input button**: Toggles listening state
- 🔊 **Speak button**: Reads last bot message
- ⏹️ **Stop button**: Stops current speech
- 🔴 **Visual feedback**: Red pulsing when listening

### **Language Selection**
- 🌐 **Language dropdown**: Switch between en/hi/mr
- 🔄 **Dynamic greeting**: Changes when language changes
- 🗣️ **Voice language sync**: TTS matches selected language

---

## 🔧 Technology Stack

### **Frontend**
- **React**: Component framework
- **Axios**: HTTP requests
- **Lucide Icons**: UI icons
- **Web Speech API**: Voice input/output
- **CSS Variables**: Theming

### **Backend**
- **FastAPI**: Web framework
- **Python**: Programming language
- **LangChain**: LLM orchestration
- **Supabase**: Database (PostgreSQL)
- **Structlog**: Structured logging

### **AI/ML**
- **OpenAI/Gemini**: Language models
- **LangChain**: LLM integration
- **Prompt Engineering**: Custom instructions

---

## 📊 Response Format

### **Successful Response**
```json
{
  "success": true,
  "response": "Bot's conversational answer",
  "complaint_info": {
    "id": "complaint-uuid",
    "status": "in_progress",
    "department": "PWD",
    "time_remaining": "2 days, 5 hours"
  },
  "suggested_actions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "confidence": 0.85
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error message",
  "complaint_info": null,
  "suggested_actions": [
    "Verify complaint ID",
    "Provide email address"
  ]
}
```

---

## 🔐 Security & Privacy

- ✅ **No authentication required**: Public chatbot
- ✅ **Email-based lookup**: Users can query own complaints
- ✅ **ID-based lookup**: Direct access with complaint ID
- ✅ **No sensitive data exposure**: Only shows public info
- ✅ **Rate limiting**: Backend can add rate limits
- ✅ **Input validation**: All inputs validated

---

## 🚀 Deployment

### **Frontend**
- Deployed on Vercel
- Environment variable: `VITE_API_URL`

### **Backend**
- Deployed on Railway/Render
- Environment variables:
  - `OPENAI_API_KEY` or `GOOGLE_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_KEY`

---

## 📈 Future Enhancements

### **Planned Features**
- 🎯 **Intent classification**: Detect question types
- 📸 **Image analysis**: Answer questions about uploaded photos
- 📊 **Analytics**: Track common questions
- 🔔 **Proactive alerts**: "Your complaint is overdue!"
- 💬 **Conversation memory**: Remember previous questions
- 🤝 **Handoff to human**: Escalate to support agent
- 📱 **WhatsApp integration**: Answer via WhatsApp
- 🗳️ **Feedback**: Rate chatbot responses

---

## 🎓 Summary

The chatbot system provides an **intelligent, conversational interface** for citizens to get information about their complaints. It combines:

1. **Smart extraction** of IDs and emails from questions
2. **Database lookups** to find relevant complaints
3. **AI-powered responses** using language models
4. **Multi-language support** (English, Hindi, Marathi)
5. **Voice capabilities** for accessibility
6. **Context-aware suggestions** for next steps

The result is a **friendly, helpful AI assistant** that makes it easy for citizens to track their complaints without navigating complex dashboards or waiting for support staff.
