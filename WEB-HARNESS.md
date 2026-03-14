# WebMCP Anything: 将任何 Web App MCP 化

## Purpose

This harness provides a standard operating procedure (SOP) and toolkit for coding
agents (Claude Code, Codex, etc.) to generate WebMCP Tool integrations for any
web application. The goal: let AI agents operate web software through structured
tool calls, not screenshots or DOM scraping.

**Philosophy**: Like CLI-Anything generates CLI commands for desktop software,
WebMCP Anything generates MCP Tools for web applications. The agent analyzes
your frontend codebase, understands your state management and business logic,
and generates Tool definitions that operate your app's real state — not DOM
simulations.

---

## General SOP: Turning Any Web App into an Agent-Usable Tool Server

### Phase 1: Codebase Analysis

1. **Identify the tech stack** — Framework (React/Vue/Svelte/Angular), state
   management (Redux/Zustand/Pinia/MobX/Jotai), router (React Router/Vue Router),
   and language (TypeScript/JavaScript).

2. **Map the route structure** — Every route corresponds to a "page" with its own
   set of user-facing operations. Routes are the primary grouping unit for Tools.
   ```
   /dashboard          → read-only Tools (metrics, status)
   /questionnaire/edit  → CRUD Tools (create, modify, delete questions)
   /settings           → configuration Tools
   ```

3. **Identify the state management layer** — Find where business state lives:
   - Redux/Rematch: `store/`, `models/`, `slices/`
   - Zustand: `stores/`, `useXxxStore.ts`
   - Pinia: `stores/`, `useXxxStore.ts`
   - MobX: `stores/`, `xxxStore.ts`
   - React Context/useReducer: `contexts/`, `providers/`

4. **Map user actions to state operations** — Every button click, form submit,
   drag-drop, and toggle corresponds to a dispatch/action/mutation. Catalog these
   mappings. These are your Tool candidates.

5. **Identify the service/API layer** — Find where backend API calls are made:
   - `services/`, `api/`, `requests/`
   - axios/fetch instances with endpoint definitions
   - TypeScript interfaces for request/response types

6. **Catalog TypeScript types** — Existing interfaces and types are the primary
   source for generating JSON Schema `inputSchema` definitions. Prioritize:
   - API request/response types
   - Store state shape types
   - Form data types
   - Entity types (User, Ticket, Question, etc.)

### Phase 2: Tool Architecture Design

1. **Design the Tool hierarchy** — Tools are organized into two tiers:

   **Global Tools (Navigation-level)** — Always available, survive page transitions:
   ```
   navigate_to_page       — Route to a specific page
   get_current_route      — Read current URL and route params
   get_app_state          — Global state snapshot (user, auth, config)
   get_available_tools    — List currently registered page-level Tools
   ```

   **Page Tools (Page-level)** — Mounted when page loads, destroyed when page unmounts:
   ```
   read_questionnaire_state    — Read current page's business state
   batch_create_questionnaire  — Perform a complete business operation
   modify_question             — Modify a specific entity
   ```

   This mirrors how web apps actually work: the shell (nav, sidebar, auth) persists
   while page content swaps on route change.

2. **Define Tool granularity** — Each Tool should represent a **meaningful business
   operation**, not a DOM interaction:

   ```
   ✅ GOOD: batch_create_questionnaire  — One call creates a complete questionnaire
   ✅ GOOD: modify_question             — Modify one question's properties
   ✅ GOOD: set_question_logic          — Set conditional logic between questions
   ❌ BAD:  click_add_button            — Simulates a DOM click (too low-level)
   ❌ BAD:  set_input_value             — Sets a DOM input (no state binding)
   ❌ BAD:  manage_questionnaire        — Does everything (too coarse)
   ```

   **Rule of thumb**: If a user would describe the operation in one sentence
   ("create a questionnaire with these questions"), that's one Tool.

3. **Design the read-first pattern** — Every Tool group MUST include a `read_*`
   Tool that returns the current state. Agents need to observe before they act:

   ```
   read_questionnaire_state  → Returns full state snapshot with all questions,
                                options, logic rules, save status
   ```

   The read Tool is the agent's "eyes". Without it, the agent operates blind.

4. **Plan the output format** — Tool results MUST follow MCP content format:
   ```typescript
   // Text result
   { content: [{ type: 'text', text: 'Success: created 5 questions' }] }

   // Structured result (JSON stringified in text)
   { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
   ```

### Phase 3: Implementation

1. **Organize Tools by module** — One file per page/module, containing all Tools
   for that context:

   ```
   src/
   └── webmcp/
       ├── index.ts                          # Global Tool registration
       ├── global-tools.ts                   # Navigation + app-level Tools
       ├── modules/
       │   ├── questionnaire-tools.ts        # Questionnaire page Tools
       │   ├── dashboard-tools.ts            # Dashboard page Tools
       │   └── settings-tools.ts             # Settings page Tools
       └── utils/
           ├── schema-helpers.ts             # JSON Schema builder utilities
           └── result-helpers.ts             # textResult / jsonResult helpers
   ```

2. **Implement each Tool file** following this structure:

   ```typescript
   // webmcp/modules/questionnaire-tools.ts

   import { useWebMCP } from '@webmcp-anything/sdk';
   // ... import store, dispatch, types from the app

   // ── Schemas ──
   const BATCH_CREATE_SCHEMA = {
     type: 'object',
     properties: { ... },
     required: ['title', 'questions']
   } as const;

   // ── Hook ──
   export function useQuestionnaireTools() {
     const dispatch = useDispatch();

     // Read Tool (always first)
     useWebMCP({
       name: 'read_questionnaire_state',
       description: '...',
       inputSchema: EMPTY_SCHEMA,
       execute: async () => { ... }
     });

     // Mutation Tools
     useWebMCP({
       name: 'batch_create_questionnaire',
       description: '...',
       inputSchema: BATCH_CREATE_SCHEMA,
       execute: async (input) => { ... }
     });

     // ... more Tools
   }
   ```

3. **Mount Tools at the right lifecycle point**:

   ```typescript
   // For React — mount in the page component
   function QuestionnaireEditPage() {
     useQuestionnaireTools(); // Tools register on mount, unregister on unmount
     return <QuestionnaireEditor />;
   }

   // For global tools — mount in the app shell
   function AppShell({ children }) {
     useGlobalTools(); // Always mounted
     return <Layout>{children}</Layout>;
   }
   ```

4. **Tool implementation rules**:

   - **Operate state, not DOM** — Call dispatch/actions/mutations, never
     `document.querySelector`. The UI will react to state changes automatically.
   - **Use existing actions** — Wrap the app's existing store actions. Don't
     create parallel mutation paths.
   - **Add delays when needed** — State updates may be async. Use small delays
     (`await delay(50)`) between dependent operations, as seen in real
     implementations.
   - **Always save after mutations** — If the app has an explicit save action
     (like `dispatch.question.setQuestionnaire()`), call it after mutations.
   - **Return meaningful results** — Include enough data for the agent to verify
     the operation succeeded and understand the new state.
   - **Handle errors gracefully** — Wrap execute in try/catch, return error
     messages as text results, never throw.

5. **Schema design rules**:

   - **Use JSON Schema draft-2020-12** — Matching the WebMCP spec.
   - **Derive from TypeScript types** — If the app has `interface CreateQuestionInput`,
     the schema should mirror it.
   - **Add descriptions in the user's language** — If the app is Chinese, write
     Chinese descriptions. The agent uses these to understand the Tool.
   - **Use enums for constrained values** — `enum: ['radio', 'checkbox', 'input']`
     helps the agent pick valid values.
   - **Use 1-based indexing for user-facing IDs** — Even if internal state uses
     0-based, expose 1-based to the agent (more natural for LLMs).
   - **Mark required fields** — Don't make the agent guess which fields are needed.

### Phase 4: Bridge & SDK Integration

The Bridge connects the web page's Tools to AI agents via MCP protocol.

1. **SDK responsibilities** (runs in the browser):
   - Provide `useWebMCP` hook (React) / composable (Vue) / decorator (Angular)
   - Manage Tool lifecycle (register on mount, unregister on unmount)
   - Handle WebSocket connection to Bridge
   - Implement reconnection with exponential backoff
   - Support fallback: detect `navigator.modelContext` → use native WebMCP if
     available, otherwise connect to Bridge

2. **Bridge responsibilities** (runs as Node.js process):
   - WebSocket server accepting page connections
   - Tab Registry: track which tabs have which Tools
   - MCP Server: expose registered Tools via MCP protocol (stdio or HTTP/SSE)
   - Route tool calls to the correct tab
   - Handle tab connect/disconnect gracefully

3. **Deployment modes**:

   ```
   Mode A (Development):
     Bridge runs on localhost
     Agent connects via MCP stdio
     → For local development with Claude Code, Cursor, etc.

   Mode B (Production):
     Bridge deployed as cloud service
     Agent connects via MCP HTTP/SSE with auth token
     → For remote agents (Claude Desktop, ChatGPT, etc.)
   ```

4. **Connection protocol**:

   ```
   Page → Bridge:
     register    { appId, url, tools[] }        → On page load
     tools_updated  { tools[] }                  → On Tool mount/unmount
     tool_result    { callId, result }           → Tool execution result
     tool_error     { callId, error }            → Tool execution error

   Bridge → Page:
     registered     { tabId }                    → Confirm registration
     execute_tool   { callId, name, arguments }  → Request Tool execution
   ```

5. **Security**:
   - Bridge generates a random token on startup
   - SDK must present token during WebSocket handshake
   - In production mode: use proper auth (JWT, API key)
   - Validate Origin header to prevent cross-site connections

### Phase 5: Test Planning

**BEFORE writing any test code**, create a test plan covering:

1. **Tool unit tests** — Each Tool tested in isolation:
   - Mock the store/dispatch
   - Call execute with valid input → verify dispatch was called correctly
   - Call execute with invalid input → verify error message returned
   - Verify returned result structure matches MCP content format

2. **Tool integration tests** — Tools tested against real store:
   - Create a real store instance
   - Call Tool execute → verify store state changed correctly
   - Call read Tool → verify it returns accurate state snapshot

3. **Lifecycle tests** — Verify mount/unmount behavior:
   - Mount page component → verify Tools appear in registry
   - Unmount page component → verify Tools removed from registry
   - Navigate between pages → verify Tools swap correctly

4. **Bridge E2E tests** — Full pipeline:
   - Start Bridge → connect SDK → register Tools → call via MCP → verify result

### Phase 6: Test Implementation

```typescript
// __tests__/questionnaire-tools.test.ts

describe('batch_create_questionnaire', () => {
  it('creates questionnaire with title and questions', async () => {
    const store = createMockStore();
    const tool = createToolInstance(batchCreateQuestionnaire, { store });

    const result = await tool.execute({
      title: '满意度调查',
      questions: [
        { type: 'radio', title: '您的评价', options: ['满意', '一般', '不满意'] },
        { type: 'input', title: '其他建议' }
      ]
    });

    expect(JSON.parse(result.content[0].text)).toMatchObject({
      success: true,
      questionsCreated: 2
    });
    expect(store.getState().question.blocks).toHaveLength(2);
  });

  it('returns error for empty questions', async () => {
    const result = await tool.execute({ title: '空问卷', questions: [] });
    expect(result.content[0].text).toContain('不能为空');
  });
});
```

### Phase 7: Documentation

Each Tool module must have:

1. **Tool manifest** (`webmcp/tool-manifest.json`):
   ```json
   {
     "app": "questionnaire-editor",
     "version": "1.0.0",
     "globalTools": ["navigate_to_page", "get_current_route", "get_app_state"],
     "pageTools": {
       "/questionnaire/edit": [
         "read_questionnaire_state",
         "batch_create_questionnaire",
         "add_questions",
         "modify_question",
         "delete_questions",
         "update_questionnaire_title",
         "set_question_logic",
         "clear_question_logic"
       ]
     }
   }
   ```

2. **README.md** in the `webmcp/` directory explaining:
   - What Tools are available
   - How to start the Bridge
   - How to test

---

## Critical Design Principles

### 1. Operate State, Not DOM

**This is the #1 rule.** Tools MUST call the app's existing state management
layer (dispatch, actions, mutations) — never manipulate the DOM directly.

**The anti-pattern:**
```typescript
// ❌ WRONG — DOM manipulation
execute: async (input) => {
  document.querySelector('#title-input').value = input.title;
  document.querySelector('#submit-btn').click();
}
```

**The correct approach:**
```typescript
// ✅ RIGHT — State operation
execute: async (input) => {
  dispatch.question.updateTitle(input.title);
  await delay(100);
  dispatch.question.setQuestionnaire(); // trigger save
}
```

**Why**: DOM manipulation doesn't trigger React/Vue reactivity, breaks undo/redo,
doesn't persist, and is fragile to UI changes. State operations are what the
app's own UI uses — they're the "real" interface.

### 2. Tools Follow Page Lifecycle

Tools are NOT static. They mount and unmount with their page component:

```
Agent calls tools/list    → sees: [navigate_to_page, get_current_route]
Agent calls navigate_to_page("/edit/123")
  → page mounts, Tools register
Agent calls tools/list    → sees: [navigate_to_page, ..., read_questionnaire_state, ...]
Agent does work...
Agent calls navigate_to_page("/dashboard")
  → edit page unmounts, Tools unregister
  → dashboard page mounts, dashboard Tools register
Agent calls tools/list    → sees: [navigate_to_page, ..., read_dashboard_state, ...]
```

**The agent MUST call `tools/list` after navigation** to discover newly
available Tools. The global `get_available_tools` Tool can also help.

### 3. Read Before Write

Every Tool group MUST provide a read Tool. The agent's workflow is always:

```
1. read_xxx_state     → Understand current state
2. (decide what to do based on state)
3. batch_create / modify / delete  → Mutate
4. read_xxx_state     → Verify result
```

Without a read Tool, the agent operates blind and will make mistakes.

### 4. Use Existing Actions — Don't Reimplement

**This is equivalent to CLI-Anything's "use the real software" principle.**

The Tool's `execute` function should call the app's existing store actions,
service functions, or API wrappers. Don't create parallel business logic:

```typescript
// ❌ WRONG — Reimplements the app's add logic
execute: async (input) => {
  const block = { id: uuid(), type: input.type, ... };
  store.setState(prev => ({ blocks: [...prev.blocks, block] }));
}

// ✅ RIGHT — Uses the app's existing action
execute: async (input) => {
  dispatch.question.addBlock({ type: input.type, ... });
}
```

### 5. Bridge is a Thin Pipe

The Bridge should do as little as possible:
- Route messages between pages and agents
- Manage tab connections
- Expose MCP protocol

It should NOT:
- Parse or transform Tool inputs/outputs
- Cache state
- Make business decisions
- Call APIs directly

All intelligence is in the Tools (which run in the browser).

### 6. Schema is the Contract

The `inputSchema` is the single source of truth for what a Tool accepts.
It must be:
- **Complete** — Every parameter documented with description
- **Accurate** — Enums match actual valid values
- **Typed** — Correct JSON Schema types (string, number, array, object)
- **Described** — Natural language descriptions help the agent understand intent

### 7. One Tool, One Purpose

Each Tool should do one thing. If you need "create questionnaire" and
"update questionnaire", make them two separate Tools, not one with a
`mode` parameter. This helps the agent reason about which Tool to use.

Exception: `batch_create_questionnaire` combining "set title + add all questions"
is fine because it represents one complete user intent ("make me a questionnaire").

---

## Tool Naming Convention

```
{verb}_{noun}[_{qualifier}]

Verbs:
  read_     — Read/query state (readOnlyHint: true)
  create_   — Create new entity
  batch_create_ — Create multiple entities at once
  add_      — Add to existing collection
  modify_   — Update properties of existing entity
  delete_   — Remove entity
  set_      — Set a specific property or configuration
  clear_    — Remove/reset a specific property
  update_   — Update a single field

Nouns:
  Match the app's domain entities: questionnaire, question, ticket, user, etc.

Examples:
  read_questionnaire_state
  batch_create_questionnaire
  add_questions
  modify_question
  delete_questions
  set_question_logic
  clear_question_logic
  navigate_to_page
  get_current_route
```

---

## Directory Structure

```
src/
└── webmcp/
    ├── index.ts                    # Registration entry point
    ├── global-tools.ts             # Global Tools (navigation, app state)
    ├── tool-manifest.json          # Tool inventory and page mapping
    ├── modules/
    │   ├── questionnaire-tools.ts  # Page-level Tools
    │   ├── dashboard-tools.ts
    │   └── settings-tools.ts
    ├── utils/
    │   ├── schema-helpers.ts       # JSON Schema utilities
    │   └── result-helpers.ts       # MCP result formatters
    └── __tests__/
        ├── questionnaire-tools.test.ts
        ├── global-tools.test.ts
        └── lifecycle.test.ts
```

**Key rule**: The `webmcp/` directory lives inside the user's existing `src/`.
Tools import from the user's store, services, and types. They are part of the
app, not an external wrapper.

---

## Monorepo Structure (webmcp-anything project)

```
webmcp-anything/
├── WEB-HARNESS.md                  # This file — methodology SOP
├── README.md                       # Project overview and quick start
├── packages/
│   ├── sdk/                        # Browser SDK (@webmcp-anything/sdk)
│   │   ├── src/
│   │   │   ├── useWebMCP.ts        # React hook
│   │   │   ├── useWebMCPVue.ts     # Vue composable (future)
│   │   │   ├── bridge-client.ts    # WebSocket client to Bridge
│   │   │   └── native-detect.ts    # navigator.modelContext detection
│   │   └── package.json
│   ├── bridge/                     # Bridge server (@webmcp-anything/bridge)
│   │   ├── src/
│   │   │   ├── index.ts            # Entry: start WS + MCP
│   │   │   ├── ws-server.ts        # WebSocket server
│   │   │   ├── tab-registry.ts     # Tab connection registry
│   │   │   └── mcp-server.ts       # MCP protocol handler
│   │   └── package.json
│   └── cli/                        # CLI entry (@webmcp-anything/cli)
│       ├── src/
│       │   └── index.ts            # `webmcp-anything start` etc.
│       └── package.json
├── skill/                          # AI agent skill/command definitions
│   ├── SKILL.md                    # For Codex/Craft Agent
│   └── commands/
│       ├── generate.md             # /webmcp-anything <project-path>
│       ├── refine.md               # /webmcp-anything:refine <project-path>
│       └── validate.md             # /webmcp-anything:validate <project-path>
└── examples/
    └── react-questionnaire/        # Example integration
```

---

## Agent Workflow: How the AI Generates Tools

When an agent receives `/webmcp-anything <project-path>`, it follows this SOP:

### Step 1: Analyze the Project

Read the following files (in order of priority):

1. `package.json` — Identify framework, state management, router
2. Router config — Map all routes to pages
3. Store/state files — Understand state shape and available actions
4. Service/API files — Understand backend interactions and types
5. Page components — Understand what each page renders and what user
   actions are available
6. TypeScript types — Source material for JSON Schemas

### Step 2: Plan Tools

For each page identified in Step 1:

1. List all user-visible actions (buttons, forms, toggles, drags)
2. Map each action to its underlying state operation
3. Group related actions into Tools at the right granularity
4. Design a `read_*` Tool for each page's state
5. Design global navigation Tools
6. Write JSON Schemas derived from existing TypeScript types

Present the Tool plan to the user for confirmation before implementing.

### Step 3: Generate Tool Code

For each planned Tool:

1. Create the Tool file in `src/webmcp/modules/`
2. Define the JSON Schema (inputSchema)
3. Implement the execute function using existing store actions
4. Add error handling and result formatting
5. Mount the hook in the appropriate page component

### Step 4: Generate Global Tools

Create `src/webmcp/global-tools.ts` with:

1. `navigate_to_page` — Uses the app's router
2. `get_current_route` — Reads current location
3. `get_app_state` — Returns global state snapshot
4. `get_available_tools` — Lists currently registered page Tools

Mount in the app shell component.

### Step 5: Generate Tests

For each Tool module:

1. Unit tests with mocked store
2. Integration tests with real store instance
3. Lifecycle tests for mount/unmount behavior

### Step 6: Generate Manifest and Documentation

1. Create `tool-manifest.json` listing all Tools and their page mappings
2. Create `webmcp/README.md` with usage instructions
3. Update the app's main README if appropriate

---

## Applying This to Different Tech Stacks

| Tech Stack | State Access | Action Dispatch | Hook/Registration |
|------------|-------------|-----------------|-------------------|
| React + Redux/Rematch | `store.getState()` | `dispatch.model.action()` | `useWebMCP` in component |
| React + Zustand | `useStore.getState()` | `useStore.getState().action()` | `useWebMCP` in component |
| React + Jotai/Recoil | `store.get(atom)` | `store.set(atom, value)` | `useWebMCP` in component |
| Vue + Pinia | `useStore().$state` | `useStore().action()` | `useWebMCPVue` in setup |
| Vue + Vuex | `store.state` | `store.dispatch('action')` | `useWebMCPVue` in setup |
| Svelte | `get(store)` | `store.set(value)` | `onMount` + SDK |
| Angular | `inject(Store)` | `store.dispatch(action)` | Decorator or service |
| Vanilla JS | Direct state object | Direct mutation | SDK API directly |

The pattern is always the same: **read state → call existing actions → return
result**. Only the syntax for accessing state and dispatching actions changes.

---

## Comparison with CLI-Anything

| Aspect | CLI-Anything | WebMCP Anything |
|--------|-------------|----------------|
| Target | Desktop GUI software | Web applications |
| Analyzes | Backend source code | Frontend source code |
| Generates | Python CLI (Click) | TypeScript Tool definitions |
| Backend | Real software executable | Real web app state layer |
| Interface | CLI commands + REPL | MCP Tools via Bridge |
| State | File-based session | In-browser reactive state |
| Lifecycle | Static (install once) | Dynamic (mount/unmount per page) |
| Output mode | `--json` flag | MCP content format |
| Testing | pytest unit + E2E | Jest/Vitest unit + integration |

**Shared principles**:
- Use the real software (state layer), don't reimplement
- AI generates the code, methodology provides the standard
- Read-first pattern (info/status commands = read Tools)
- One operation per command/Tool
- Structured output for agent consumption
- Iterative refinement (`/refine`)

---

## Rules

1. **Tools MUST operate the app's state management layer.** Never manipulate DOM
   directly. Never bypass the app's existing actions/mutations/dispatches.

2. **Every page module MUST include a `read_*` Tool** returning a comprehensive
   state snapshot. Agents cannot operate without observability.

3. **Global navigation Tools MUST be provided.** At minimum: `navigate_to_page`
   and `get_current_route`. Without these, the agent cannot move between pages.

4. **Tools MUST follow page lifecycle.** Register on page mount, unregister on
   unmount. Never leave stale Tools registered.

5. **Tool names MUST follow the naming convention** (`verb_noun_qualifier`).
   Names should be self-describing for an LLM.

6. **inputSchema MUST be complete.** Every parameter needs a type, description,
   and where applicable, enum constraints. Incomplete schemas produce bad agent
   behavior.

7. **Results MUST use MCP content format.**
   `{ content: [{ type: 'text', text: '...' }] }`

8. **Each Tool module MUST be testable in isolation.** Mock the store, call
   execute, verify the result. No reliance on browser environment for unit tests.

9. **The Bridge MUST be a thin transport layer.** No business logic in the Bridge.
   All intelligence lives in the Tools running in the browser.

10. **SDK MUST detect native WebMCP support** (`navigator.modelContext`) and use
    it when available, falling back to Bridge transport when not.

---

## Security Considerations

1. **Token-based Bridge auth** — Bridge generates a random token on startup.
   SDK must present this token during WebSocket handshake.

2. **Tool annotations** — Mark read-only Tools with `readOnlyHint: true`.
   This lets agents and platforms make safety decisions.

3. **Input validation** — Tools should validate inputs against their schema
   before executing. Don't trust the agent to always send valid data.

4. **User confirmation for destructive actions** — Use `ModelContextClient.
   requestUserInteraction()` for operations like "delete all questions" or
   "reset to default".

5. **No credential exposure** — Tools must never return API keys, tokens,
   or passwords in their results.
