# SQL Agent — Intelligent AI SQL Data Analyst with Human-in-the-Loop & Visualization

## 💡 Overview
**SQL Agent** is an **AI-powered data analysis orchestrator** that understands natural language queries, decides whether to execute SQL or visualize results, ensures database safety through **human approval**, and generates **instant visual insights** — all powered by an intelligent **LangGraph agent system**.

It integrates **LangChain**, **LangGraph**, **Google Gemini**, and **HuggingFace models** to deliver safe, autonomous, and interactive data exploration.

---

## ⚙️ Features

### 🧭 1. Automatic Query Routing
- Dynamically decides whether a user query requires:
  - 🧠 **SQL Execution** (`need_sql_agent`)
  - 📊 **Data Visualization** (`need_visualize_agent`)
  - 💬 **General LLM Response** (no database or visualization)
- Uses **Pydantic Output Parsers** for structured decision-making.

---

### 🗄️ 2. Database Connection Validation
- Checks database connectivity before executing any query.  
- Prevents operations if the connection is invalid and notifies the user with a clear error message.

---

### 🛡️ 3. SQL Query Safety Analyzer
- Classifies each query as **safe** or **dangerous**.
- Flags destructive queries (e.g., `DELETE`, `UPDATE`, `DROP`, `INSERT`).
- Only executes **safe** queries automatically — others require explicit approval.

---

### 🧍‍♂️ 4. Human-in-the-Loop Approval
- Requests user confirmation for potentially harmful operations.
- Displays warning messages like:
  > ⚠️ “This query might modify or delete data. Do you want to continue? (Yes/No)”
- Ensures **transparency** and **database protection**.

---

### 🧩 5. Autonomous SQL Execution Agent
- Executes the full SQL pipeline autonomously:
  1. 📋 Lists tables
  2. 🧱 Retrieves table schemas
  3. 🧮 Constructs valid SQL queries
  4. ✅ Checks syntax for errors
  5. ⚙️ Executes and retrieves results
- Afterward, it decides if visualization is beneficial and asks the user.

---

### 📊 6. Visualization Agent
- Transforms SQL results into clean, **Matplotlib-based charts**.  
- Automatically picks chart type (Bar, Line, Pie, etc.) based on data.  
- Saves plots with unique filenames and provides natural-language insights:
  > “Here’s a bar chart showing total sales per region. You can see that the West region performs best.”

---

### 💬 7. General Conversational Agent
- Handles non-database or non-visualization messages seamlessly.  
- Uses a **HuggingFace LLM** to maintain natural, human-like conversation.

---
### 💾 8. Persistent Memory & Context Awareness
- Uses `MemorySaver` to store conversation context.(can be replaced later with an `SQLite checkpointer` for permanent persistence)
- Maintains continuity across sessions and decisions.


---
## 🧱 Tech Stack

| Layer | Tools / Libraries |
|-------|--------------------|
| **Backend Logic** | FastAPI + LangGraph + LangChain |
| **Models** | Google Gemini 2.0 Flash + HuggingFace (GPT-OSS-20B) |
| **Database** | SQLite / Custom SQL Source |
| **Visualization** | Matplotlib (Headless Mode) |
| **Safety Layer** | Human-in-the-Loop + Query Analyzer |
| **Execution Tools** | Python REPL Tool |

---

## 🚀 Highlights
- 🧠 **Self-Routing AI** — Intelligently chooses the best execution path.  
- 🔒 **Safe by Design** — Human approval for risky queries.  
- 👁️ **Human Supervision** — Keeps the user in full control.  
- 📈 **Instant Visualization** — Turns results into charts automatically.  
- 🗣️ **Conversational Interface** — Chat naturally with your data.  
- 🔄 **Fully Autonomous Workflow** — Powered by LangGraph orchestration.

---

## 🧩 Langgraph Workflow Overview  
- The following diagram shows how SQLAgent routes user queries between nodes in LangGraph:

<img src="agent_workflow.png" alt="langgraph workflow" width="700" />

---

## 🚀 Demo
https://github.com/user-attachments/assets/b8396347-db57-4913-bce6-bea23bfe929c

---


