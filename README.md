[English](./README.md) | [中文](./README.zh-CN.md)

# webmcp-anything

**A methodology for turning any Web App into AI-callable MCP Tools.**

webmcp-anything teaches AI coding agents (Claude Code, Codex, Cursor, etc.) how to generate [Model Context Protocol (MCP)](https://modelcontextprotocol.io) Tool integrations for any web application. The agent analyzes your frontend codebase, understands your state management and business logic, and generates Tool definitions that operate your app's real state — not DOM simulations.

> Inspired by [CLI-Anything](https://github.com/HKUDS/CLI-Anything) which generates CLI interfaces for desktop software.

## How It Works

```
Your Web App                                AI Agent
(React, Vue, Svelte...)                    (Claude, Cursor, Codex...)
     │                                          │
     │  1. AI reads WEB-HARNESS.md              │
     │  2. AI analyzes your codebase            │
     │  3. AI generates Tool definitions        │
     │     (dispatch/actions, not DOM)           │
     │                                          │
     │         MCP-B Infrastructure             │
     │  ┌─────────────────────────────┐         │
     ├──│  @mcp-b/global (polyfill)   │──MCP───►│
     │  │  @mcp-b/webmcp-local-relay  │         │
     │  └─────────────────────────────┘         │
```

1. **Install** [MCP-B](https://github.com/nicobailon/mcp-b) infrastructure in your web app
2. **Load** the webmcp-anything skill in your AI coding agent
3. **Run** `/webmcp-anything <your-project-path>`
4. AI analyzes your codebase and generates MCP Tool definitions
5. AI agents can now operate your web app through structured tool calls

## Key Principles

- **Operate State, Not DOM** — Tools call `dispatch()` / `store.action()`, never `document.querySelector()`
- **Tools Follow Page Lifecycle** — Register on page mount, unregister on unmount
- **Read Before Write** — Every tool group includes a `read_*` tool for agent observability
- **Use Existing Actions** — Wrap your app's existing store actions, don't reimplement
- **AI Generates, Standards Guide** — We provide methodology, AI does the work

## Quick Start

### 1. Install MCP-B infrastructure in your web app

```bash
npm install @mcp-b/global usewebmcp
```

### 2. Add the polyfill to your app entry

```typescript
// src/main.tsx
import '@mcp-b/global';
```

### 3. Register Tools in your page components

```typescript
// src/pages/Dashboard.tsx
import { useWebMCP } from 'usewebmcp';
import { useStore } from '../store';

function Dashboard() {
  const store = useStore();

  useWebMCP({
    name: 'read_dashboard_state',
    description: 'Read the current dashboard metrics and status',
    inputSchema: { type: 'object', properties: {} } as const,
    execute: async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalUsers: store.metrics.totalUsers,
          activeToday: store.metrics.activeToday,
          revenue: store.metrics.revenue,
        }, null, 2),
      }],
    }),
  });

  return <DashboardView />;
}
```

### 4. Connect to AI agents via MCP-B Relay

```bash
npm install @mcp-b/webmcp-local-relay
npx webmcp-local-relay
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "my-webapp": {
      "command": "npx",
      "args": ["webmcp-local-relay"]
    }
  }
}
```

### 5. Let AI generate the rest

Load the webmcp-anything skill in your AI coding agent, then:

```
/webmcp-anything ./path/to/your/project
```

The AI will analyze your codebase and generate a complete set of Tools following the WEB-HARNESS.md methodology.

## AI Skill Commands

| Command | Description |
|---------|-------------|
| `/webmcp-anything <path>` | Generate all Tools for a web app |
| `/webmcp-anything:refine <path>` | Expand Tool coverage incrementally |
| `/webmcp-anything:validate <path>` | Audit Tool quality against standards |

### For Claude Code / Craft Agent

Copy the `skill/` directory into your agent's skills folder.

### For Codex / Other Agents

Read `skill/SKILL.md` — it contains a self-contained version of the methodology.

## Project Structure

```
webmcp-anything/
├── WEB-HARNESS.md              # Methodology SOP (core asset)
├── VISION.md                   # Project positioning and vision
├── README.md                   # This file
├── skill/                      # AI Skill definition (core asset)
│   ├── SKILL.md                # Self-contained methodology
│   └── commands/
│       ├── generate.md         # /webmcp-anything <path>
│       ├── refine.md           # /webmcp-anything:refine
│       └── validate.md         # /webmcp-anything:validate
└── examples/                   # Framework examples
    └── react-todo/             # React + MCP-B complete example
```

## Infrastructure: MCP-B

webmcp-anything is a **methodology project** — it does not ship its own SDK or Bridge. For infrastructure, we recommend the [MCP-B](https://github.com/nicobailon/mcp-b) ecosystem:

| Package | Purpose |
|---------|---------|
| `@mcp-b/global` | Polyfill for `navigator.modelContext` |
| `usewebmcp` | React hook for registering Tools |
| `@mcp-b/react-webmcp` | Alternative React integration |
| `@mcp-b/webmcp-local-relay` | Local Bridge (WebSocket + MCP stdio) |
| MCP-B Chrome Extension | Direct browser-to-agent connection |

When native `navigator.modelContext` is available (Chrome 146+), no Bridge or polyfill is needed.

## Supported Frameworks

The methodology works with **any frontend framework** — only the hook/registration syntax changes:

| Framework | State Management | Registration |
|-----------|-----------------|--------------|
| React | Redux / Zustand / Jotai | `useWebMCP` hook |
| Vue | Pinia / Vuex | `useWebMCPVue` composable |
| Svelte | Stores | `onMount` + SDK |
| Angular | NgRx / Services | Decorator or service |
| Vanilla JS | Direct state | SDK API directly |

## Inspiration & Credits

| Project | Contribution |
|---------|-------------|
| [CLI-Anything](https://github.com/HKUDS/CLI-Anything) | The "harness" methodology — AI reads standards, generates integration code |
| [WebMCP (W3C Draft)](https://webmachinelearning.github.io/webmcp/) | The `navigator.modelContext` browser API specification |
| [MCP-B](https://github.com/nicobailon/mcp-b) | Browser MCP infrastructure — polyfill, hooks, relay, Chrome extension |
| [Model Context Protocol](https://modelcontextprotocol.io) | The underlying protocol standard |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
