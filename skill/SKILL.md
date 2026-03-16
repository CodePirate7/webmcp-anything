---
name: webmcp-anything
description: Use when the user wants to generate, refine, test, or validate WebMCP Tool integrations for a web application. Adapts the webmcp-anything methodology to turn any frontend app into an MCP-compatible Tool server that AI agents can operate.
---

# WebMCP Anything

Use this skill when the user wants to make a web application operable by AI agents through MCP Tools.

If this skill is being used from inside the `webmcp-anything` repository, read `./WEB-HARNESS.md` before implementation. That file is the full methodology source of truth. If it is not available, follow the condensed rules below.

## Inputs

Accept either:

- A local path to a frontend project (e.g., `./apps/questionnaire`, `/path/to/webapp`)
- A GitHub repository URL

The project must be a frontend web application with identifiable state management (Redux, Zustand, Pinia, MobX, Context API, etc.).

## Modes

### Generate

Use when the user wants a new Tool integration for their web app.

Produce this structure:

```text
src/
└── webmcp/
    ├── index.ts
    ├── global-tools.ts
    ├── tool-manifest.json
    ├── README.md
    ├── modules/
    │   └── <page>-tools.ts
    ├── utils/
    │   ├── schema-helpers.ts
    │   └── result-helpers.ts
    └── __tests__/
        ├── TEST.md
        └── <page>-tools.test.ts
```

Generate Tools that:

- Operate the app's state management layer (dispatch, actions, mutations) — never DOM
- Follow page lifecycle (mount on page load, unmount on page leave)
- Include a `read_*` Tool for every page module (mandatory)
- Include global navigation Tools (`navigate_to_page`, `get_current_route`, `get_app_state`)
- Use JSON Schemas derived from the app's existing TypeScript types
- Return results in MCP content format: `{ content: [{ type: 'text', text: ... }] }`
- Follow `verb_noun_qualifier` naming convention

### Refine

Use when Tool integration already exists.

First inventory current Tools and tests, then do gap analysis against the app's full capabilities. Prefer:

- High-impact missing features
- Easy wraps around existing store actions
- Additions that compose well with existing Tools

Do not remove existing Tools unless the user explicitly asks.

### Validate

Check that the Tool integration:

- Has `read_*` Tools for every module
- Uses state operations (no DOM manipulation)
- Has complete JSON Schemas with descriptions
- Follows naming conventions
- Returns MCP content format
- Has matching `tool-manifest.json`
- Has tests for each module

## Critical Design Principles

1. **Operate State, Not DOM** — Tools call dispatch/actions/mutations. Never `document.querySelector`. The UI reacts to state changes automatically.

2. **Tools Follow Page Lifecycle** — Tools register on page mount, unregister on unmount. Global Tools persist in app shell. Agent must call `tools/list` after navigation.

3. **Read Before Write** — Every Tool group needs a read Tool. Agents observe before acting.

4. **Use Existing Actions** — Wrap the app's existing store actions. Don't create parallel business logic.

5. **Infrastructure is External** — Use [MCP-B](https://github.com/nicobailon/mcp-b) for polyfill (`@mcp-b/global`), hooks (`usewebmcp`), and relay (`@mcp-b/webmcp-local-relay`). No business logic in the transport.

6. **Schema is the Contract** — Complete, accurate, typed, described. Every property needs `type` and `description`.

7. **One Tool, One Purpose** — No `mode` parameters. Separate Tools for separate operations.

## Tech Stack Adaptation

| Stack | State Access | Action Dispatch | Registration |
|-------|-------------|-----------------|--------------|
| React + Redux/Rematch | `store.getState()` | `dispatch.model.action()` | `useWebMCP` from `usewebmcp` |
| React + Zustand | `useStore.getState()` | `useStore.getState().action()` | `useWebMCP` from `usewebmcp` |
| Vue + Pinia | `useStore().$state` | `useStore().action()` | `useWebMCPVue` in setup |
| Svelte | `get(store)` | `store.set(value)` | `onMount` + `@mcp-b/global` |
| Angular | `inject(Store)` | `store.dispatch(action)` | Decorator or service |

The pattern is always: **read state → call existing actions → return result**. Only syntax changes.

## Workflow

1. Analyze the project: framework, state management, routes, types
2. Design Tool hierarchy: global + page-level, with read-first pattern
3. Present Tool plan to user — wait for confirmation
4. Generate Tool modules, schemas, execute functions
5. Mount hooks in page components and app shell
6. Write TEST.md, then tests, then run them
7. Generate tool-manifest.json and README.md

## Output Expectations

When reporting progress or final results, include:

- Target app and tech stack identified
- Tool count (global + page-level)
- Files added or changed
- Test results summary
- Any gaps or limitations noted
