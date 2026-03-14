/**
 * WebMCP initialization for the Questionnaire Editor app.
 *
 * Call this once in your app's entry point (e.g., main.tsx).
 * It connects to the Bridge server and installs navigator.modelContext
 * so that all useWebMCP() hooks work transparently.
 */

import { initBridge } from '@webmcp-anything/sdk';

export function setupWebMCP() {
  const bridge = initBridge({
    url: import.meta.env.VITE_WEBMCP_BRIDGE_URL ?? 'ws://localhost:9100',
    appId: 'questionnaire',
    token: import.meta.env.VITE_WEBMCP_TOKEN,
    onConnectionChange: (connected) => {
      console.log(`[webmcp] Bridge ${connected ? 'connected' : 'disconnected'}`);
    },
  });

  return bridge;
}
