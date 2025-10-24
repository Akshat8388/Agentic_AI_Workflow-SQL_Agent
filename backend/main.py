from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel 
from typing import Optional 
from langchain_core.messages import HumanMessage 
import uuid 
import json 
from fastapi.responses import StreamingResponse,HTMLResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from sql_agent import agent
import os

app = FastAPI(title="SQLAgent API", version="1.0") 
# Allow frontend access (update origins for your frontend URL) 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
scripts_dir = os.path.join(frontend_dir, 'scripts')
styles_dir = os.path.join(frontend_dir, 'styles')
plots_dir = os.path.join(BASE_DIR, 'plots')


app.mount("/scripts", StaticFiles(directory=scripts_dir), name="scripts")
app.mount("/styles", StaticFiles(directory=styles_dir), name="styles")
app.mount("/plots", StaticFiles(directory=plots_dir), name="plots")




# ---- Request & Response Models ---- 
class QueryRequest(BaseModel):
     user_message: Optional[str] = None
     db_path: Optional[str] = None 
     status :Optional[str] = None

thread_id = str(uuid.uuid4())
config = {"configurable": {"thread_id": thread_id}}

@app.post("/chat") 
async def chat_with_agent(request: QueryRequest): 
    """ Accepts a user query and streams the agent's response. If human approval is needed, it sends a warning then pauses. """ 
    async def stream_events(): 
        try: 
            initial_state = { "messages": [HumanMessage(content=request.user_message)], "db_path": request.db_path } 
            seen_nodes = set() 
            async for event in agent.astream_events(initial_state, config=config, version="v1"): 
                node_name = event["metadata"].get("langgraph_node") 
                if event["event"] == "on_chain_start" and node_name in ["checking_user_query","checking_database_connection","human_approval","query_safety_analysis","SQL_Agent","general_LLM_agent","visualization_agent"]: 
                  if node_name not in seen_nodes: 
                    seen_nodes.add(node_name) 
                    yield json.dumps({"node_executed": node_name}) + "\n" 
                if event["event"] == "on_chat_model_stream" and node_name in ["agent","general_LLM_agent","visualization_agent"]: 
                    content = event["data"]["chunk"].content 
                    if content:
                         yield json.dumps({"token": content}) + "\n"

                if event["event"]=="on_chat_model_stream" and node_name in ["visualization_agent"]:
                    content = event["data"]["chunk"].content 
                    if content:
                         yield json.dumps({"token": content}) + "\n"

                if event["event"]=="on_chain_end" and node_name in ["visualization_agent"]:
                    img_path = event["data"]["output"].get("img_path")
                    if img_path:
                        yield json.dumps({"img_url": img_path}) + "\n"         
                                 
                elif event["event"] == "on_chain_stream" and node_name in ["checking_database_connection", "human_approval"]: 
                    data = event["data"]["chunk"] 
                    if node_name == "checking_database_connection": 
                        if "messages" in data and len(data["messages"]) > 0: 
                            for msg in data["messages"]: 
                                yield json.dumps({"token": msg.content}) + "\n" 
                                # --- INTEGRATED LOGIC FOR HUMAN APPROVAL --- 
                    elif node_name == "human_approval": 
                        warning = data.get("warning_msg") 
                        if isinstance(warning, list): 
                            warning_content = warning[0].content 
                        else: warning_content = getattr(warning, "content", str(warning)) 
                        yield json.dumps({ "warning": warning_content}) + "\n"
            
        except Exception as e: yield json.dumps({"error": f"An error occurred: {str(e)}"}) + "\n" 
    
    return StreamingResponse(stream_events(), media_type="application/x-ndjson") 


@app.post("/resume")
async def resume_agent(request: QueryRequest):
    """
    Resumes a paused agent execution thread and streams the subsequent events.
    """
    async def stream_remaining_events():
        try:
            # If the user said no, just end the conversation gracefully.
            if request.status == "no":
                yield json.dumps({"token": "Operation cancelled by user."}) + "\n"
                return

            # Update the state to continue the graph
            agent.update_state(config=config, values={"status": request.status})
    
            # Stream the rest of the agent's execution
            async for event in agent.astream_events(None,config=config,version="v1"):
                
                if event["event"]=="on_chat_model_stream":
                    yield json.dumps({"agent": event["data"]["chunk"].content}) + "\n"

            agent.update_state(config=config,values={"status":None})         
                    

        except Exception as e:
            yield json.dumps({"error": f"An error occurred during resume: {str(e)}"}) + "\n"

        yield json.dumps({"done": True}) + "\n"    

    return StreamingResponse(stream_remaining_events(), media_type="application/x-ndjson")

@app.get("/", response_class=HTMLResponse)
def serve_auth():

    return FileResponse(os.path.join(BASE_DIR, "../frontend/index.html"))
