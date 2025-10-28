// utils/keyStore.js
const STORAGE_KEY = "gemini_api_key";

export function getApiKey() {
  try {
    const url = new URL(window.location.href);
    const k = url.searchParams.get("key");
    if (k) {
      localStorage.setItem(STORAGE_KEY, k);
      url.searchParams.delete("key");
      window.history.replaceState({}, "", url.toString());
      return k;
    }
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

