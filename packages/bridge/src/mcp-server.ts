/**
 * MCP Server — exposes the registered tools from all tabs to AI agents
 * via the Model Context Protocol (stdio transport).
 *
 * Uses @modelcontextprotocol/sdk to handle the MCP protocol.
 * The agent sees a standard MCP server with dynamically-changing tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { TabRegistry } from './tab-registry';
import type { WsServer } from './ws-server';

export interface McpServerOptions {
  registry: TabRegistry;
  wsServer: WsServer;
  name?: string;
  version?: string;
}

export class McpServer {
  private server: Server;

  constructor(private options: McpServerOptions) {
    this.server = new Server(
      {
        name: options.name ?? 'webmcp-anything',
        version: options.version ?? '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();

    // When tabs change, notify agents that tool list changed
    this.options.registry.onChange(() => {
      this.server.notification({
        method: 'notifications/tools/list_changed',
      });
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[bridge] MCP server started on stdio');
  }

  // ── Handlers ──

  private setupHandlers(): void {
    // tools/list — return all tools from all connected tabs
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.options.registry.getAggregatedTools();

      return {
        tools: tools.map((tool) => ({
          name: tool.qualifiedName,
          description: this.formatDescription(tool),
          ...(tool.inputSchema ? { inputSchema: tool.inputSchema } : {
            inputSchema: { type: 'object' as const, properties: {} },
          }),
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
        })),
      };
    });

    // tools/call — route to the correct tab and execute
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const resolved = this.options.registry.resolveToolCall(name);
      if (!resolved) {
        return {
          content: [{ type: 'text', text: `Error: Tool not found: ${name}` }],
          isError: true,
        };
      }

      try {
        const result = await this.options.wsServer.executeTool(
          resolved.tab.tabId,
          resolved.toolName,
          (args ?? {}) as Record<string, unknown>,
        );

        // If the tool already returns MCP format, pass through
        if (isMcpResult(result)) {
          return result;
        }

        // Otherwise wrap in MCP format
        return {
          content: [{
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    });
  }

  private formatDescription(tool: { description: string; tabId: string }): string {
    const tabs = this.options.registry.getAllTabs();
    if (tabs.length <= 1) return tool.description;
    // In multi-tab mode, append tab info to help agent distinguish
    const tab = this.options.registry.getTab(tool.tabId);
    const suffix = tab ? ` [${tab.appId} - ${tab.url}]` : '';
    return `${tool.description}${suffix}`;
  }
}

// ── Helpers ──

function isMcpResult(value: unknown): value is { content: Array<{ type: string; text: string }> } {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.content);
}
