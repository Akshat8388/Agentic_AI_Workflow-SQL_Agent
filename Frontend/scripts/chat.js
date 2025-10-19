const messages = document.getElementById("messages");
const inputBox = document.getElementById("inputBox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const intro = document.getElementById("intro");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const approvalModal = document.getElementById("approvalModal");
const approvalMessage = document.getElementById("approvalMessage");
const dbModal = document.getElementById("dbModal");
const dbConnectBtn = document.getElementById("dbConnectBtn");
const connectDbBtn = document.getElementById("connectDbBtn");
const cancelDbBtn = document.getElementById("cancelDbBtn");
const dbUriInput = document.getElementById("dbUriInput");

let activated = false;
let db_path = "";

var typed = new Typed('.element', {
  strings: [
    'Connect your database and visualize insights instantly',
    'From SQL to smart charts — your AI data analyst',
    'Transform raw data into meaningful decisions',
  ],
  typeSpeed: 30,
  backSpeed: 30,
  loop: true
});

// Theme Toggle
const sunIcon = '<path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z"/>';
const moonIcon = '<path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/>';

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  themeIcon.innerHTML = isLight ? sunIcon : moonIcon;
  themeIcon.setAttribute("fill", isLight ? "#1a1a1a" : "#FFFFFF");
});

function appendMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function addTyping() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "ai");
  typingDiv.innerHTML = `
    <div class="typing">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>`;
  messages.appendChild(typingDiv);
  messages.scrollTop = messages.scrollHeight;
  return typingDiv;
}

// Handle "Try Sample DB" click
document.querySelector(".db_btn").addEventListener("click", () => {
  const btn = document.querySelector(".db_btn");
  const indicator = document.querySelector(".db_indicator");

  if (db_path && db_path.includes("SampleDatabase")) {
    db_path = "";
    indicator.style.backgroundColor = "red";
    btn.style.background = "";
  } else {
    db_path = "SampleDatabase/company_database.db";
    indicator.style.backgroundColor = "#32ff5e";
    btn.style.transform = "scale(0.97)";
    setTimeout(() => (btn.style.transform = "scale(1)"), 200);
  }
});

dbConnectBtn.addEventListener("click", () => {
    dbModal.style.display = "flex";
});

cancelDbBtn.addEventListener("click", () => {
    dbModal.style.display = "none";
});

connectDbBtn.addEventListener("click", () => {
    const uri = dbUriInput.value.trim();
    if (uri) {
        db_path = uri;
        document.querySelector(".db_indicator").style.backgroundColor = "#32ff5e";
        dbModal.style.display = "none";
        appendMessage(`System: Attempting to connect to your database.`, "ai");
    }
});


function showApprovalPopup(warningText) {
  approvalMessage.textContent = warningText;
  approvalModal.style.display = "flex";
}

async function approval_is_yes() {
  approvalModal.style.display = "none";
  const aiMsgElement = addTyping();

  try {
    const response = await fetch("/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "yes" }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.agent) {
            aiMsgElement.innerText += data.agent;
          } else if (data.error) {
            aiMsgElement.innerText = `❌ Error: ${data.error}`;
          }
        } catch (e) {
          console.error("Error parsing JSON:", line, e);
        }
      }

      messages.scrollTop = messages.scrollHeight;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      aiMsgElement.innerText = "❌ Error connecting to the server.";
      console.error(err);
    }
  }
}

function approval_is_no() {
  approvalModal.style.display = "none";
  const aiMsgElement = addTyping();
  setTimeout(() => {
    aiMsgElement.innerHTML ="❌ Action cancelled by user.";
    messages.scrollTop = messages.scrollHeight;
  }, 300);
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  if (!activated) {
    inputBox.classList.remove("centered-input");
    inputBox.classList.add("bottom-input");
    intro.style.display = "none";
    document.body.style.overflow = "auto";
    activated = true;
  }

  appendMessage(text, "user");
  input.value = "";

  const aiMsgElement = addTyping();

  try {
   
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_message: text,
        db_path: db_path || "",
      }),
     
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    aiMsgElement.innerText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const data = JSON.parse(line);

          if (data.node_executed) {
            const ai_flow = document.createElement("div");
            ai_flow.style.fontSize = "13px";
            ai_flow.style.opacity = "0.8";
            ai_flow.innerText = `⚙️ ${data.node_executed.replace(/_/g, " ")}`;
            messages.insertBefore(ai_flow, aiMsgElement);

          } else if (data.warning) {
            aiMsgElement.remove();
            showApprovalPopup(data.warning);
            break;

          } else if (data.token) {
            aiMsgElement.innerText += data.token;
            
          } else if(data.img_url){
            const img = document.createElement('img');
            img.src = data.img_url;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.marginTop = '10px';
            aiMsgElement.appendChild(img);
          } else if (data.error) {
            aiMsgElement.innerText = `❌ Error: ${data.error}`;
          }
        } catch (e) {
          console.error("Error parsing JSON line:", line, e);
        }
      }
      messages.scrollTop = messages.scrollHeight;
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      aiMsgElement.innerText = "❌ Error connecting to the server.";
      console.error(err);
    }
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
