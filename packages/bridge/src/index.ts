/**
 * @webmcp-anything/bridge
 *
 * Bridge server that connects browser tabs (via WebSocket) to AI agents
 * (via MCP protocol). This is the central routing layer.
 *
 * Architecture:
 *   Browser Tab ←→ WebSocket ←→ Bridge ←→ MCP stdio ←→ AI Agent
 *
 * The Bridge is a "thin pipe" — it routes messages between tabs and agents
 * without interpreting or transforming tool inputs/outputs.
 */

import crypto from 'node:crypto';
import { TabRegistry } from './tab-registry';
import { WsServer } from './ws-server';
import { McpServer } from './mcp-server';

export interface BridgeOptions {
  /** WebSocket port for browser connections. Default: 9100 */
  port?: number;
  /** Auth token. If not provided, a random one is generated. */
  token?: string;
  /** Server name exposed via MCP. Default: 'webmcp-anything' */
  name?: string;
  /** Server version exposed via MCP. Default: '0.1.0' */
  version?: string;
}

export async function startBridge(options: BridgeOptions = {}): Promise<{
  token: string;
  port: number;
  registry: TabRegistry;
  stop: () => void;
}> {
  const port = options.port ?? 9100;
  const token = options.token ?? crypto.randomBytes(16).toString('hex');

  const registry = new TabRegistry();

  // Start WebSocket server for browser tabs
  const wsServer = new WsServer({ port, token, registry });
  wsServer.start();

  // Start MCP server for AI agents
  const mcpServer = new McpServer({
    registry,
    wsServer,
    name: options.name,
    version: options.version,
  });
  await mcpServer.start();

  // Print connection info to stderr (stdout is reserved for MCP stdio)
  console.error(`[bridge] Ready!`);
  console.error(`[bridge] WebSocket: ws://localhost:${port}?token=${token}`);
  console.error(`[bridge] MCP: connected via stdio`);
  console.error(`[bridge] Waiting for browser tabs to connect...`);

  return {
    token,
    port,
    registry,
    stop: () => {
      wsServer.stop();
    },
  };
}

// Export components for custom usage
export { TabRegistry } from './tab-registry';
export { WsServer } from './ws-server';
export { McpServer } from './mcp-server';
export type { ToolDescriptor, TabEntry } from './tab-registry';
