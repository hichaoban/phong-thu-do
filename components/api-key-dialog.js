// components/api-key-dialog.js
import { getApiKey, setApiKey, clearApiKey } from "../utils/keyStore.js";

export function ensureApiKeyUI(onReady) {
  const has = getApiKey();
  if (has) {
    onReady && onReady();
    return;
  }
  showDialog(onReady);
}

function showDialog(onReady) {
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.45);
    display:flex;align-items:center;justify-content:center;z-index:9999;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    width:420px;max-width:92vw;background:#111;color:#fff;border:1px solid #333;
    border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.4);
    font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  `;
  card.innerHTML = `
    <h3 style="margin:0">Enter Gemini API Key</h3>
    <p style="margin-top:8px;opacity:.8">
      Get one at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">Google AI Studio</a>.
    </p>
    <input id="__k" placeholder="AIza..." style="
      width:100%;padding:10px 12px;border-radius:10px;border:1px solid #333;
      background:#0b0b0b;color:#fff;outline:none;margin-top:8px;
    " />
    <div style="display:flex;gap:8px;margin-top:12px">
      <button id="__save" style="
        padding:8px 12px;background:#3b82f6;color:#fff;border:1px solid #2563eb;
        border-radius:10px;cursor:pointer;
      ">Save</button>
      <button id="__clear" style="
        padding:8px 12px;background:#1f1f1f;color:#fff;border:1px solid #333;
        border-radius:10px;cursor:pointer;
      ">Clear</button>
    </div>
    <p style="margin-top:8px;font-size:12px;opacity:.7">
      Key is stored in your browser (localStorage).
    </p>
  `;

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  card.querySelector("#__save").onclick = () => {
    const key = card.querySelector("#__k").value.trim();
    if (!key) return;
    setApiKey(key);
    document.body.removeChild(backdrop);
    onReady && onReady();
  };
  card.querySelector("#__clear").onclick = () => {
    clearApiKey();
    card.querySelector("#__k").value = "";
  };
}
