# webmcp-anything

**Turn any Web App into an MCP Tool Server.**

webmcp-anything is a methodology and toolkit that enables AI agents to generate [Model Context Protocol (MCP)](https://modelcontextprotocol.io) Tool integrations for any web application. The agent analyzes your frontend codebase, understands your state management and business logic, and generates Tool definitions that operate your app's real state — not DOM simulations.

Inspired by [CLI-Anything](https://github.com/HKUDS/CLI-Anything) which generates CLI interfaces for desktop GUI software, webmcp-anything applies the same "harness" methodology to the web: **define standards + AI prompts, let the AI generate the integration code.**

## How It Works

```
┌─────────────┐     MCP stdio      ┌──────────────┐     WebSocket      ┌────────────┐
│  AI Agent   │ ◄────────────────► │    Bridge    │ ◄────────────────► │  Web App   │
│ (Claude,    │   JSON-RPC         │  (Node.js)   │   ws://localhost   │  (React,   │
│  Cursor...) │                    │              │   :9100            │  Vue...)   │
└─────────────┘                    └──────────────┘                    └────────────┘
```

1. **You run**: `/webmcp-anything <your-project-path>` in your AI coding agent
2. **AI analyzes** your frontend codebase — framework, state management, routes, TypeScript types
3. **AI generates** MCP Tool definitions that call your app's existing store actions
4. **Bridge connects** your running web app to AI agents via MCP protocol
5. **AI agents** can now operate your web app through structured tool calls

## Key Principles

- **Operate State, Not DOM** — Tools call `dispatch()` / `store.action()`, never `document.querySelector()`
- **Tools Follow Page Lifecycle** — Register on page mount, unregister on unmount
- **Read Before Write** — Every tool group includes a `read_*` tool for agent observability
- **Use Existing Actions** — Wrap your app's existing store actions, don't reimplement
- **AI Generates, Standards Guide** — No code analyzer; provide methodology, let AI do the work

## Quick Start

### 1. Install the SDK in your web app

```bash
npm install @webmcp-anything/sdk
```

### 2. Initialize the Bridge connection

```typescript
// src/main.tsx (or your app entry point)
import { initBridge } from '@webmcp-anything/sdk';

initBridge({
  url: 'ws://localhost:9100',
  appId: 'my-app',
});
```

### 3. Register Tools in your page components

```typescript
// src/pages/Dashboard.tsx
import { useWebMCP } from '@webmcp-anything/sdk';
import { useStore } from '../store';

function Dashboard() {
  const store = useStore();

  useWebMCP({
    name: 'read_dashboard_state',
    description: 'Read the current dashboard metrics and status',
    inputSchema: { type: 'object', properties: {} } as const,
    execute: async () => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalUsers: store.metrics.totalUsers,
            activeToday: store.metrics.activeToday,
            revenue: store.metrics.revenue,
          }, null, 2),
        }],
      };
    },
  });

  return <DashboardView />;
}
```

### 4. Add the Bridge to your MCP config

```json
{
  "mcpServers": {
    "my-webapp": {
      "command": "npx",
      "args": ["webmcp-anything", "start"]
    }
  }
}
```

### 5. Let AI generate the rest

Use the webmcp-anything skill/command in your AI coding agent:

```
/webmcp-anything ./path/to/your/project
```

The AI will analyze your codebase and generate a complete set of Tools.

## AI-Driven Generation

webmcp-anything follows the **harness methodology**: we provide standards and prompts, the AI generates the integration code.

### For Claude Code / Craft Agent

Copy the `skill/` directory into your agent's skills folder and use:

```
/webmcp-anything <project-path>          # Generate all tools
/webmcp-anything:refine <project-path>   # Expand coverage
/webmcp-anything:validate <project-path> # Audit quality
```

### For Codex / Other Agents

Read `skill/SKILL.md` — it contains a self-contained version of the methodology.

## Architecture

### Packages

| Package | Description | npm |
|---------|-------------|-----|
| `@webmcp-anything/sdk` | Browser SDK — Bridge client + `useWebMCP` re-export | `@webmcp-anything/sdk` |
| `@webmcp-anything/bridge` | Node.js Bridge server — WebSocket + MCP stdio | `@webmcp-anything/bridge` |
| `webmcp-anything` | CLI entry point | `webmcp-anything` |

### How the Bridge Works

The Bridge is a **thin pipe** between your web app and AI agents:

```
Browser Tab                    Bridge Server                AI Agent
    │                              │                           │
    │── WS connect ───────────────>│                           │
    │── register {appId, tools} ──>│                           │
    │<─ registered {tabId} ────────│                           │
    │                              │                           │
    │  (useWebMCP mounts tools)    │                           │
    │── tools_updated {tools} ────>│                           │
    │                              │<── tools/list ────────────│
    │                              │──── tools[] ─────────────>│
    │                              │<── tools/call ────────────│
    │<─ execute_tool {name,args} ──│                           │
    │── tool_result {result} ─────>│──── result ──────────────>│
```

**Native WebMCP support**: When `navigator.modelContext` is available (Chrome 146+), the SDK uses it directly — no Bridge needed. The Bridge is the fallback for browsers without native support.

### Multi-Tab Support

When multiple tabs are connected, tools are automatically namespaced:

```
Single tab:   read_questionnaire_state
Multi-tab:    questionnaire-a3f2:read_questionnaire_state
              dashboard-b7c1:read_dashboard_state
```

## Supported Frameworks

| Framework | State Management | Status |
|-----------|-----------------|--------|
| React | Redux / Rematch | Supported |
| React | Zustand | Supported |
| React | Jotai / Recoil | Supported |
| Vue | Pinia | Planned |
| Vue | Vuex | Planned |
| Svelte | Stores | Planned |
| Angular | NgRx / Services | Planned |

The methodology works with any framework — only the hook/registration syntax changes.

## Project Structure

```
webmcp-anything/
├── WEB-HARNESS.md              # Methodology SOP (the "bible")
├── README.md                   # This file
├── packages/
│   ├── sdk/                    # @webmcp-anything/sdk
│   │   └── src/
│   │       ├── index.ts        # Entry: re-exports useWebMCP + bridge
│   │       ├── bridge-client.ts # WebSocket-backed modelContext
│   │       └── result-helpers.ts
│   ├── bridge/                 # @webmcp-anything/bridge
│   │   └── src/
│   │       ├── index.ts        # Entry: startBridge()
│   │       ├── ws-server.ts    # WebSocket server
│   │       ├── tab-registry.ts # Tab connection registry
│   │       ├── mcp-server.ts   # MCP stdio handler
│   │       └── bin.ts          # CLI entry
│   └── cli/                    # webmcp-anything
│       └── src/
│           └── index.ts        # CLI commands
├── skill/                      # AI agent skill definitions
│   ├── SKILL.md                # Self-contained methodology
│   └── commands/
│       ├── generate.md         # /webmcp-anything <path>
│       ├── refine.md           # /webmcp-anything:refine
│       └── validate.md         # /webmcp-anything:validate
└── examples/
    └── react-questionnaire/    # Example integration
```

## Comparison with CLI-Anything

| Aspect | CLI-Anything | webmcp-anything |
|--------|-------------|----------------|
| Target | Desktop GUI software | Web applications |
| Analyzes | Backend source code | Frontend source code |
| Generates | Python CLI (Click) | TypeScript MCP Tools |
| Backend | Real software executable | Real web app state layer |
| Interface | CLI commands + REPL | MCP Tools via Bridge |
| Lifecycle | Static (install once) | Dynamic (mount/unmount per page) |

**Shared**: AI generates the code, methodology provides the standard, read-first pattern, one operation per tool, iterative refinement.

## Comparison with MCP-B

| Aspect | MCP-B | webmcp-anything |
|--------|-------|----------------|
| Transport | postMessage + Chrome Extension | WebSocket (no extension required) |
| Production | Cloud relay (mcp-b.io) | Self-hosted Bridge or native WebMCP |
| Tool Registration | Same (`navigator.modelContext`) | Same (compatible polyfill) |
| Cross-browser | Chrome only (extension) | All browsers (WebSocket) |
| Generation | Manual tool writing | AI-driven with methodology |

webmcp-anything uses the same `useWebMCP` hook from MCP-B's npm ecosystem — they're complementary, not competing.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
