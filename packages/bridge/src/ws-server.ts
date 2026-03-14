/**
 * WebSocket Server — accepts connections from browser tabs running the SDK.
 *
 * Handles the page→Bridge message protocol:
 *   register       → Tab connects and provides its tool list
 *   tools_updated  → Tab's tool list changed (mount/unmount)
 *   tool_result    → Tab returns a tool execution result
 *   tool_error     → Tab returns a tool execution error
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { TabRegistry, type ToolDescriptor } from './tab-registry';

export interface WsServerOptions {
  port: number;
  token?: string;
  registry: TabRegistry;
}

interface PendingExecution {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class WsServer {
  private wss: WebSocketServer | null = null;
  private pendingExecutions = new Map<string, PendingExecution>();
  private callIdCounter = 0;

  constructor(private options: WsServerOptions) {}

  start(): void {
    this.wss = new WebSocketServer({ port: this.options.port });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // Token validation
      if (this.options.token) {
        const url = new URL(req.url ?? '', `http://localhost:${this.options.port}`);
        const token = url.searchParams.get('token');
        if (token !== this.options.token) {
          ws.close(4001, 'Invalid token');
          return;
        }
      }

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch {
          console.warn('[bridge] Failed to parse WebSocket message');
        }
      });

      ws.on('close', () => {
        const removed = this.options.registry.unregisterByWs(ws);
        if (removed.length > 0) {
          console.log(`[bridge] Tab(s) disconnected: ${removed.join(', ')}`);
        }
      });
    });

    console.log(`[bridge] WebSocket server listening on ws://localhost:${this.options.port}`);
  }

  stop(): void {
    // Reject all pending executions
    for (const [callId, pending] of this.pendingExecutions) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Bridge shutting down'));
      this.pendingExecutions.delete(callId);
    }

    this.wss?.close();
    this.wss = null;
  }

  /**
   * Execute a tool on a specific tab. Returns a promise that resolves
   * when the tab sends back the result.
   */
  async executeTool(
    tabId: string,
    toolName: string,
    args: Record<string, unknown>,
    timeoutMs = 60000,
  ): Promise<unknown> {
    const tab = this.options.registry.getTab(tabId);
    if (!tab) throw new Error(`Tab not found: ${tabId}`);
    if (tab.ws.readyState !== WebSocket.OPEN) throw new Error(`Tab ${tabId} is not connected`);

    const callId = `${++this.callIdCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingExecutions.delete(callId);
        reject(new Error(`Tool execution timed out: ${toolName} (${timeoutMs}ms)`));
      }, timeoutMs);

      this.pendingExecutions.set(callId, { resolve, reject, timer });

      this.sendToTab(tab.ws, {
        type: 'execute_tool',
        callId,
        name: toolName,
        arguments: args,
      });
    });
  }

  // ── Private ──

  private handleMessage(ws: WebSocket, msg: Record<string, unknown>): void {
    switch (msg.type) {
      case 'register':
        this.handleRegister(ws, msg);
        break;

      case 'tools_updated':
        this.handleToolsUpdated(ws, msg);
        break;

      case 'tool_result':
        this.handleToolResult(msg);
        break;

      case 'tool_error':
        this.handleToolError(msg);
        break;

      default:
        console.warn(`[bridge] Unknown message type: ${msg.type}`);
    }
  }

  private handleRegister(ws: WebSocket, msg: Record<string, unknown>): void {
    const appId = (msg.appId as string) || 'unknown';
    const url = (msg.url as string) || '';
    const tools = (msg.tools as ToolDescriptor[]) || [];

    const tabId = this.options.registry.register(ws, appId, url, tools);
    console.log(`[bridge] Tab registered: ${tabId} (${tools.length} tools) — ${url}`);

    this.sendToTab(ws, {
      type: 'registered',
      tabId,
    });
  }

  private handleToolsUpdated(ws: WebSocket, msg: Record<string, unknown>): void {
    const tab = this.options.registry.findTabByWs(ws);
    if (!tab) return;

    const tools = (msg.tools as ToolDescriptor[]) || [];
    this.options.registry.updateTools(tab.tabId, tools);
    console.log(`[bridge] Tools updated for ${tab.tabId}: ${tools.length} tools`);
  }

  private handleToolResult(msg: Record<string, unknown>): void {
    const callId = msg.callId as string;
    const pending = this.pendingExecutions.get(callId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingExecutions.delete(callId);
    pending.resolve(msg.result);
  }

  private handleToolError(msg: Record<string, unknown>): void {
    const callId = msg.callId as string;
    const pending = this.pendingExecutions.get(callId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingExecutions.delete(callId);
    pending.reject(new Error((msg.error as string) || 'Tool execution failed'));
  }

  private sendToTab(ws: WebSocket, data: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}
