import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
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

  // Overlay the status bar so the webview fills edge-to-edge
  StatusBar.setOverlaysWebView({ overlay: true });

  const applyStatusBarStyle = () => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      (!localStorage.getItem('theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Dark hero → light (white) icons; Light hero → dark icons
    StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
  };

  applyStatusBarStyle();

  // Re-apply whenever the theme class on <html> changes
  new MutationObserver(applyStatusBarStyle).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

createRoot(document.getElementById("root")!).render(<App />);
