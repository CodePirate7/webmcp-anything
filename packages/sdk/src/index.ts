/**
 * @webmcp-anything/sdk
 *
 * Browser SDK for webmcp-anything. Provides two things:
 *
 * 1. Re-exports `useWebMCP` from the `usewebmcp` package (the standard React hook
 *    for registering MCP Tools on navigator.modelContext).
 *
 * 2. Provides `initBridge()` which installs a WebSocket-backed navigator.modelContext
 *    polyfill when native WebMCP is not available. This means existing useWebMCP hooks
 *    work transparently — they don't need to know whether they're talking to a native
 *    browser API or a Bridge server.
 *
 * ## Usage
 *
 * ```typescript
 * // In your app's entry point (e.g., main.tsx):
 * import { initBridge } from '@webmcp-anything/sdk';
 *
 * initBridge({
 *   url: 'ws://localhost:9100',
 *   appId: 'my-app',
 * });
 *
 * // In your page components (unchanged — same as with native WebMCP):
 * import { useWebMCP } from '@webmcp-anything/sdk';
 *
 * function MyPage() {
 *   useWebMCP({
 *     name: 'read_page_state',
 *     description: 'Read the current page state',
 *     execute: async () => { ... },
 *   });
 * }
 * ```
 */

// Re-export the standard useWebMCP hook
export { useWebMCP } from 'usewebmcp';
export type {
  WebMCPConfig,
  WebMCPReturn,
  ToolExecutionState,
  ToolExecuteFunction,
} from 'usewebmcp';

// Export Bridge client
export {
  initBridge,
  cleanupBridge,
  getBridge,
} from './bridge-client';
export type { BridgeClientOptions } from './bridge-client';

// Export result helpers
export { textResult, jsonResult } from './result-helpers';
