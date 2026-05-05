/**
 * DSA Platform — Floating AI Chat Widget
 * Injected into every page.  Works standalone with vanilla JS.
 */
(function () {
  "use strict";

  /* ── Simulated bot responses (dev mode – no API key needed) ── */
  const BOT_RESPONSES = [
    "Great question! I'd recommend starting with the <strong>Arrays &amp; Strings</strong> module — it's the foundation for most interview problems.",
    "That's a classic pattern! Try the <strong>Two-Pointer</strong> technique covered in the <strong>Arrays &amp; Strings</strong> module.",
    "Excellent! The <strong>Arrays &amp; Strings</strong> module has hands-on C++ exercises that will clarify this concept.",
    "Hint: think about the sliding-window approach. Check out the <strong>Arrays &amp; Strings</strong> module to see it in action with C++ code.",
  ];

  let responseIndex = 0;
  const getNextResponse = () =>
    BOT_RESPONSES[responseIndex++ % BOT_RESPONSES.length];

  /* ── Widget HTML ── */
  const widgetHTML = `
  <div id="dsa-chat-widget">
    <!-- Launcher FAB -->
    <button id="dsa-chat-toggle" aria-label="Open AI Chat" title="Ask the DSA AI">
      <svg id="dsa-icon-chat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <svg id="dsa-icon-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="display:none">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- Chat Panel -->
    <div id="dsa-chat-panel" aria-hidden="true">
      <div id="dsa-chat-header">
        <div id="dsa-chat-header-left">
          <div id="dsa-avatar">AI</div>
          <div>
            <div id="dsa-bot-name">DSA Assistant</div>
            <div id="dsa-bot-status">
              <span id="dsa-status-dot"></span> Online — C++ &amp; DSA only
            </div>
          </div>
        </div>
        <button id="dsa-chat-minimize" aria-label="Minimize chat">&#8722;</button>
      </div>

      <div id="dsa-chat-messages" role="log" aria-live="polite">
        <div class="dsa-msg dsa-msg-bot">
          <div class="dsa-bubble">
            👋 Hi! I'm your <strong>C++ &amp; DSA tutor</strong>. Ask me anything about data structures, algorithms, or C++ code — I'll guide you with hints, not spoilers!
          </div>
        </div>
      </div>

      <div id="dsa-chat-footer">
        <textarea
          id="dsa-chat-input"
          placeholder="Ask about arrays, trees, DP…"
          rows="1"
          aria-label="Chat input"
        ></textarea>
        <button id="dsa-chat-send" aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>`;

  /* ── Styles ── */
  const widgetCSS = `
  #dsa-chat-widget {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    font-family: Arial, Helvetica, sans-serif;
  }

  /* FAB */
  #dsa-chat-toggle {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: #0f9d58;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(56,189,248,0.35);
    transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s;
    outline: none;
  }
  #dsa-chat-toggle:hover {
    transform: scale(1.1);
    filter: saturate(0.7) brightness(1.15);
    box-shadow: 0 12px 40px rgba(56,189,248,0.5);
  }
  #dsa-chat-toggle svg {
    width: 26px;
    height: 26px;
    color: #ffffff;
    transition: transform 0.3s;
  }

  /* Panel */
  #dsa-chat-panel {
    position: absolute;
    bottom: 72px;
    right: 0;
    width: 360px;
    max-height: 520px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    transform-origin: bottom right;
    transform: scale(0.85) translateY(10px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease;
    overflow: hidden;
  }
  #dsa-chat-panel.open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  /* Header */
  #dsa-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #0f9d58;
    border-bottom: 1px solid rgba(56,189,248,0.15);
  }
  #dsa-chat-header-left { display: flex; align-items: center; gap: 10px; }
  #dsa-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #0f9d58;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #ffffff;
  }
  #dsa-bot-name { color: #ffffff; font-size: 14px; font-weight: 600; }
  #dsa-bot-status { color: rgba(255, 255, 255, 0.9); font-size: 11px; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
  #dsa-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 6px #4ade80;
    animation: dsa-pulse 2s infinite;
  }
  @keyframes dsa-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  #dsa-chat-minimize {
    background: none; border: none; color: rgba(255, 255, 255, 0.9);
    font-size: 20px; cursor: pointer; line-height: 1;
    padding: 2px 6px; border-radius: 6px; transition: background 0.2s;
  }
  #dsa-chat-minimize:hover { background: rgba(255,255,255,0.08); color: #ffffff; }

  /* Messages */
  #dsa-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: #334155 transparent;
  }
  #dsa-chat-messages::-webkit-scrollbar { width: 4px; }
  #dsa-chat-messages::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

  .dsa-msg { display: flex; }
  .dsa-msg-user { justify-content: flex-end; }
  .dsa-msg-bot  { justify-content: flex-start; }

  .dsa-bubble {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 1.55;
    animation: dsa-fadeUp 0.3s ease;
  }
  @keyframes dsa-fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dsa-msg-bot  .dsa-bubble { background: #f8f9fa; color: #333333; border-bottom-left-radius: 4px; }
  .dsa-msg-user .dsa-bubble { background: #0f9d58; color: #ffffff; border-bottom-right-radius: 4px; }

  /* Typing indicator */
  .dsa-typing .dsa-bubble {
    display: flex; align-items: center; gap: 4px;
    padding: 14px 18px; background: #f8f9fa;
  }
  .dsa-typing .dsa-bubble span {
    width: 7px; height: 7px; border-radius: 50%; background: #38bdf8;
    display: inline-block;
    animation: dsa-bounce 1.2s infinite;
  }
  .dsa-typing .dsa-bubble span:nth-child(2) { animation-delay: 0.2s; }
  .dsa-typing .dsa-bubble span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dsa-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* Footer */
  #dsa-chat-footer {
    display: flex; align-items: flex-end;
    gap: 8px; padding: 12px 14px;
    border-top: 1px solid rgba(56,189,248,0.1);
    background: #f8f9fa;
  }
  #dsa-chat-input {
    flex: 1;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    color: #333333;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    padding: 10px 13px;
    resize: none;
    outline: none;
    max-height: 100px;
    transition: border-color 0.2s;
    scrollbar-width: thin;
  }
  #dsa-chat-input:focus { border-color: #0f9d58; }
  #dsa-chat-input::placeholder { color: #999999; }

  #dsa-chat-send {
    width: 40px; height: 40px; border-radius: 50%;
    background: #0f9d58;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
  }
  #dsa-chat-send:hover { transform: scale(1.1); filter: saturate(0.7) brightness(1.15); box-shadow: 0 4px 16px rgba(56,189,248,0.4); }
  #dsa-chat-send svg { width: 18px; height: 18px; color: #ffffff; }

  @media (max-width: 400px) {
    #dsa-chat-panel { width: calc(100vw - 40px); right: 0; }
  }`;

  /* ── Inject into DOM ── */
  function init() {
    // Style
    const style = document.createElement("style");
    style.textContent = widgetCSS;
    document.head.appendChild(style);

    // HTML
    const container = document.createElement("div");
    container.innerHTML = widgetHTML;
    document.body.appendChild(container.firstElementChild);

    // Elements
    const toggle   = document.getElementById("dsa-chat-toggle");
    const panel    = document.getElementById("dsa-chat-panel");
    const minimize = document.getElementById("dsa-chat-minimize");
    const messages = document.getElementById("dsa-chat-messages");
    const input    = document.getElementById("dsa-chat-input");
    const send     = document.getElementById("dsa-chat-send");
    const iconChat  = document.getElementById("dsa-icon-chat");
    const iconClose = document.getElementById("dsa-icon-close");

    let isOpen = false;

    function openPanel() {
      isOpen = true;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      iconChat.style.display  = "none";
      iconClose.style.display = "block";
      input.focus();
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      iconChat.style.display  = "block";
      iconClose.style.display = "none";
    }

    toggle.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
    minimize.addEventListener("click", closePanel);

    /* Auto-resize textarea */
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });

    /* Send on Enter (Shift+Enter = newline) */
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    send.addEventListener("click", handleSend);

    function appendMsg(html, isUser) {
      const div = document.createElement("div");
      div.className = `dsa-msg ${isUser ? "dsa-msg-user" : "dsa-msg-bot"}`;
      const bubble = document.createElement("div");
      bubble.className = "dsa-bubble";
      bubble.innerHTML = html;
      div.appendChild(bubble);
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function handleSend() {
      const text = input.value.trim();
      if (!text) return;

      appendMsg(text, true);
      input.value = "";
      input.style.height = "auto";

      /* Typing indicator */
      const typingDiv = document.createElement("div");
      typingDiv.className = "dsa-msg dsa-msg-bot dsa-typing";
      typingDiv.innerHTML = '<div class="dsa-bubble"><span></span><span></span><span></span></div>';
      messages.appendChild(typingDiv);
      messages.scrollTop = messages.scrollHeight;

      /* Call Backend API */
      fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [] })
      })
      .then(res => res.json())
      .then(data => {
        typingDiv.remove();
        if (data && data.reply) {
          appendMsg(data.reply, false);
        } else {
          appendMsg("Error: Invalid response format.", false);
        }
      })
      .catch(err => {
        typingDiv.remove();
        appendMsg("Connection error: Cannot reach the chat server.", false);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
