/**
 * Tab Registry — tracks connected browser tabs and their registered tools.
 *
 * Each tab has a unique tabId (format: `{appId}-{random4hex}`) and a list
 * of currently registered tools. The registry is the central truth for
 * "what tools are available right now".
 */

import type { WebSocket } from 'ws';

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema?: object;
  outputSchema?: object;
  annotations?: object;
}

export interface TabEntry {
  tabId: string;
  appId: string;
  url: string;
  ws: WebSocket;
  tools: Map<string, ToolDescriptor>;
  connectedAt: number;
}

export class TabRegistry {
  private tabs = new Map<string, TabEntry>();
  private onChangeCallbacks: Array<() => void> = [];

  /** Register a new tab. Returns the generated tabId. */
  register(ws: WebSocket, appId: string, url: string, tools: ToolDescriptor[]): string {
    const tabId = this.generateTabId(appId);
    const toolMap = new Map<string, ToolDescriptor>();
    for (const tool of tools) {
      toolMap.set(tool.name, tool);
    }

    this.tabs.set(tabId, {
      tabId,
      appId,
      url,
      ws,
      tools: toolMap,
      connectedAt: Date.now(),
    });

    this.notifyChange();
    return tabId;
  }

  /** Remove a tab (e.g., on WebSocket close). */
  unregister(tabId: string): void {
    if (this.tabs.delete(tabId)) {
      this.notifyChange();
    }
  }

  /** Remove all tabs connected via a specific WebSocket. */
  unregisterByWs(ws: WebSocket): string[] {
    const removed: string[] = [];
    for (const [tabId, entry] of this.tabs) {
      if (entry.ws === ws) {
        this.tabs.delete(tabId);
        removed.push(tabId);
      }
    }
    if (removed.length > 0) this.notifyChange();
    return removed;
  }

  /** Update the tool list for a tab. */
  updateTools(tabId: string, tools: ToolDescriptor[]): void {
    const entry = this.tabs.get(tabId);
    if (!entry) return;

    entry.tools.clear();
    for (const tool of tools) {
      entry.tools.set(tool.name, tool);
    }

    this.notifyChange();
  }

  /** Find tab by tabId. */
  getTab(tabId: string): TabEntry | undefined {
    return this.tabs.get(tabId);
  }

  /** Find tab that owns a specific WebSocket. */
  findTabByWs(ws: WebSocket): TabEntry | undefined {
    for (const entry of this.tabs.values()) {
      if (entry.ws === ws) return entry;
    }
    return undefined;
  }

  /** Get all registered tabs. */
  getAllTabs(): TabEntry[] {
    return [...this.tabs.values()];
  }

  /**
   * Get the aggregated tool list across all tabs.
   *
   * When there's only one tab, tool names are returned as-is.
   * When multiple tabs exist, tool names are prefixed with `{tabId}:`.
   *
   * Returns: Array of { name, description, inputSchema, tabId, originalName }
   */
  getAggregatedTools(): Array<ToolDescriptor & { tabId: string; qualifiedName: string }> {
    const allTabs = this.getAllTabs();
    const singleTab = allTabs.length === 1;

    const result: Array<ToolDescriptor & { tabId: string; qualifiedName: string }> = [];

    for (const tab of allTabs) {
      for (const tool of tab.tools.values()) {
        result.push({
          ...tool,
          tabId: tab.tabId,
          qualifiedName: singleTab ? tool.name : `${tab.tabId}:${tool.name}`,
        });
      }
    }

    return result;
  }

  /**
   * Resolve a tool call: find the tab and original tool name from a
   * (possibly qualified) tool name.
   *
   * Handles both:
   * - `read_questionnaire_state` (single-tab mode)
   * - `transfer-a3f2:read_questionnaire_state` (multi-tab mode)
   */
  resolveToolCall(qualifiedName: string): { tab: TabEntry; toolName: string } | null {
    const allTabs = this.getAllTabs();

    // Try qualified name first: `tabId:toolName`
    const colonIdx = qualifiedName.indexOf(':');
    if (colonIdx > 0) {
      const tabId = qualifiedName.slice(0, colonIdx);
      const toolName = qualifiedName.slice(colonIdx + 1);
      const tab = this.tabs.get(tabId);
      if (tab && tab.tools.has(toolName)) {
        return { tab, toolName };
      }
    }

    // Fallback: search all tabs for an unqualified tool name
    for (const tab of allTabs) {
      if (tab.tools.has(qualifiedName)) {
        return { tab, toolName: qualifiedName };
      }
    }

    return null;
  }

  /** Subscribe to registry changes. */
  onChange(callback: () => void): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Current tab count. */
  get size(): number {
    return this.tabs.size;
  }

  // ── Private ──

  private generateTabId(appId: string): string {
    const hex = Math.random().toString(16).slice(2, 6);
    return `${appId}-${hex}`;
  }

  private notifyChange(): void {
    for (const cb of this.onChangeCallbacks) {
      try {
        cb();
      } catch {
        // Ignore callback errors
      }
    }
  }
}
