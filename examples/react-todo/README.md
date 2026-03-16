# React Todo — webmcp-anything Example

A simple Todo app demonstrating the webmcp-anything methodology with [MCP-B](https://github.com/nicobailon/mcp-b) infrastructure.

## What This Demonstrates

- **State-based Tools** — Tools call Zustand store actions, not DOM manipulation
- **Read-first pattern** — `read_todos` lets the agent observe before acting
- **Page lifecycle** — Tools mount with the component, unmount when it leaves
- **MCP-B infrastructure** — `@mcp-b/global` polyfill + `usewebmcp` React hook + `webmcp-local-relay` embed for transport

## MCP Tools

| Tool | Type | Description |
|------|------|-------------|
| `read_todos` | read | Read all todos with stats (total, active, completed) |
| `add_todo` | create | Add a new todo item |
| `toggle_todo` | update | Toggle a todo between active and completed |
| `delete_todo` | delete | Delete a todo by ID |
| `clear_completed_todos` | delete | Remove all completed todos |

## Setup

### 1. Install and start the app

```bash
cd examples/react-todo
pnpm install
pnpm dev
```

The app will start at `http://localhost:5173`.

### 2. Configure your AI agent

Add to your MCP client config (e.g., Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "todo-app": {
      "command": "npx",
      "args": ["-y", "@mcp-b/webmcp-local-relay@latest"]
    }
  }
}
```

The relay starts automatically when your AI client connects. It listens on `localhost:9333` for WebSocket connections from the browser tab.

### 3. Open the app and verify connection

Open `http://localhost:5173` in your browser. The page loads `embed.js` which creates a hidden iframe that connects to the relay via WebSocket.

```
Browser Tab (localhost:5173)           Local Machine
┌──────────────────────────┐         ┌─────────────────────┐
│  React App               │         │  webmcp-local-relay  │
│  ├─ @mcp-b/global        │ embed   │   (MCP server)       │
│  ├─ useWebMCP (Tools)    │ iframe  │                      │
│  └─ embed.js ────────────┼── WS ──►│   stdio ──► AI Agent │
└──────────────────────────┘  :9333  └─────────────────────┘
```

### 4. Use it

Open the app in your browser, then ask your AI agent:

- "Read the todo list"
- "Add a todo: Buy groceries"
- "Mark the first todo as completed"
- "Clear all completed todos"

## Project Structure

```
index.html                               # Loads embed.js for relay connection
src/
├── main.tsx                             # App entry — imports @mcp-b/global polyfill
├── App.tsx                              # Main component — mounts useTodoTools()
├── store/
│   └── todo-store.ts                    # Zustand store — the app's state layer
└── webmcp/
    ├── modules/
    │   └── todo-tools.ts                # MCP Tool definitions (read, add, toggle, delete, clear)
    └── utils/
        └── result-helpers.ts            # MCP content format helpers
```

## How It Follows WEB-HARNESS.md

1. **Operate State, Not DOM** — Tools call `store.getState().addTodo()`, `toggleTodo()`, etc.
2. **Read Before Write** — `read_todos` returns full state snapshot with stats
3. **Use Existing Actions** — Tools wrap Zustand actions directly
4. **Page Lifecycle** — `useTodoTools()` called in App component
5. **Schema is the Contract** — Every parameter has `type` and `description`
6. **One Tool, One Purpose** — Separate tools for add, toggle, delete, clear
