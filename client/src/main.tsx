import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// When running as a native app, relative /api/* URLs would resolve to
// capacitor://localhost/api/... (a dead end). Patch fetch once at startup
// so every relative API call is transparently rewritten to the real origin.
if (Capacitor.isNativePlatform()) {
  const API_ORIGIN = "https://shvi.app";
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/")) {
      input = `${API_ORIGIN}${input}`;
    } else if (input instanceof Request && input.url.startsWith("/")) {
      input = new Request(`${API_ORIGIN}${input.url}`, input);
    }
    return nativeFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
