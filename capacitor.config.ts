import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.eitaq.shvi',
  appName: 'SHVI',
  webDir: 'dist/public',
  plugins: {
    // Route fetch/XHR through iOS URLSession so session cookies are properly
    // stored and sent on cross-origin requests (capacitor://localhost → shvi.app).
    // WKWebView's JS fetch silently drops Set-Cookie on cross-origin responses.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
