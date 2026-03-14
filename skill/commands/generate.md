# webmcp-anything Command

Generate a complete WebMCP Tool integration for any web application.

## CRITICAL: Read WEB-HARNESS.md First

**Before doing anything else, you MUST read `./WEB-HARNESS.md`.** It defines the complete methodology, design principles, and implementation patterns. Every phase below follows WEB-HARNESS.md. Do not improvise — follow the harness specification.

## Usage

```bash
/webmcp-anything <project-path>
```

## Arguments

- `<project-path>` - **Required.** Either:
  - A **local path** to the frontend project source code (e.g., `/home/user/my-webapp`, `./apps/questionnaire`)
  - A **GitHub repository URL** (e.g., `https://github.com/org/webapp`)

  If a GitHub URL is provided, the agent clones the repo locally first.

  **Note:** The project must be a frontend web application with identifiable state management. Static sites, server-rendered-only apps, or backend-only repos are not supported.

## What This Command Does

This command implements the complete webmcp-anything methodology to generate production-ready MCP Tool definitions for a web application. **All phases follow the standards defined in WEB-HARNESS.md.**

### Phase 1: Codebase Analysis

- Read `package.json` to identify framework, state management, router, language
- Map the route structure — every route is a potential Tool group
- Locate the state management layer (Redux/Zustand/Pinia/MobX/Context)
- Catalog state shapes, actions, and TypeScript types
- Locate the service/API layer and its TypeScript interfaces
- Map user actions (buttons, forms, toggles) to their underlying state operations
- **Output**: Present a structured analysis to the user:
  ```
  Tech Stack: React 18 + Rematch + React Router v6
  State: store/models/ (8 models found)
  Routes: 12 routes mapped
  API Layer: services/ (15 service files)
  Types: 43 relevant interfaces found
  ```

### Phase 2: Tool Architecture Design

- Design Global Tools (navigation-level, always mounted):
  - `navigate_to_page` — route to any page
  - `get_current_route` — read current URL and params
  - `get_app_state` — global state snapshot
  - `get_available_tools` — list currently registered page Tools
- Design Page Tools for each route, following the rules:
  - One `read_*` Tool per page (mandatory)
  - Mutation Tools at business-operation granularity
  - Tool names follow `verb_noun_qualifier` convention
  - JSON Schemas derived from existing TypeScript types
- **Output**: Present the Tool plan as a table to the user:
  ```
  Page: /questionnaire/edit
  Tools:
    read_questionnaire_state    [read]   — Full state snapshot
    batch_create_questionnaire  [create] — Create complete questionnaire
    add_questions               [create] — Add questions to existing
    modify_question             [update] — Modify a single question
    delete_questions            [delete] — Remove questions by index
    update_questionnaire_title  [update] — Change title
    set_question_logic          [update] — Set conditional logic
    clear_question_logic        [delete] — Remove conditional logic
  ```
- **Wait for user confirmation** before proceeding to implementation.

### Phase 3: Implementation

For each Tool module, generate files in `src/webmcp/`:

1. **Schema definitions** — `const` objects with full JSON Schema:
   - Every property has `type` and `description`
   - Enums for constrained values
   - `required` array for mandatory fields
   - Descriptions in the app's primary language

2. **Hook functions** — One hook per page module:
   - Import store/dispatch from the app's state layer
   - `useWebMCP()` calls for each Tool
   - Execute functions that call existing store actions
   - Error handling with try/catch → text result
   - `await delay()` between dependent state operations

3. **Global Tools** — `src/webmcp/global-tools.ts`:
   - Use the app's router for navigation
   - Read current route from router state
   - Aggregate global state for app-level snapshot

4. **Utils** — `src/webmcp/utils/`:
   - `result-helpers.ts`: `textResult()`, `jsonResult()` formatters
   - `schema-helpers.ts`: common schema patterns (if needed)

5. **Mount points** — Add hook calls to page components:
   - Page-level: `useXxxTools()` in the page component
   - Global: `useGlobalTools()` in the app shell

### Phase 4: SDK Integration

- Install `@webmcp-anything/sdk` dependency
- Configure Bridge connection in `src/webmcp/index.ts`
- Verify SDK's `useWebMCP` hook is correctly imported and used
- Ensure native WebMCP detection fallback is in place

### Phase 5: Test Planning

- Create `src/webmcp/__tests__/TEST.md` with test plan:
  - Unit tests: each Tool with mocked store
  - Integration tests: Tools against real store instance
  - Lifecycle tests: mount/unmount/navigation behavior
  - Schema validation tests: all schemas valid JSON Schema

### Phase 6: Test Implementation

- Write unit tests for each Tool module
- Write lifecycle tests for mount/unmount behavior
- Run all tests and record results in `TEST.md`

### Phase 7: Documentation

- Generate `src/webmcp/tool-manifest.json` — inventory of all Tools with page mapping
- Generate `src/webmcp/README.md` — usage, Tool list, how to start Bridge
- Update project's main README if appropriate

## Output Structure

```
src/
└── webmcp/
    ├── index.ts                    # SDK init + Bridge config
    ├── global-tools.ts             # Global navigation Tools
    ├── tool-manifest.json          # Tool inventory
    ├── README.md                   # Usage documentation
    ├── modules/
    │   ├── questionnaire-tools.ts  # Page-level Tools (example)
    │   ├── dashboard-tools.ts
    │   └── settings-tools.ts
    ├── utils/
    │   ├── schema-helpers.ts
    │   └── result-helpers.ts
    └── __tests__/
        ├── TEST.md
        ├── questionnaire-tools.test.ts
        ├── global-tools.test.ts
        └── lifecycle.test.ts
```

## Example

```bash
# Generate Tools for a React questionnaire editor
/webmcp-anything /home/user/apps/questionnaire

# Generate Tools from a GitHub repo
/webmcp-anything https://github.com/org/my-webapp
```

## Success Criteria

The command succeeds when:
1. All page modules have a `read_*` Tool and relevant mutation Tools
2. Global Tools (navigation, route, app state) are implemented
3. All Tools follow the naming convention and use existing store actions
4. Schemas are complete with types, descriptions, and enums
5. Tools are correctly mounted at page lifecycle boundaries
6. Unit and integration tests pass
7. `tool-manifest.json` accurately lists all Tools and page mappings
8. README.md documents all Tools and Bridge setup
9. SDK integration is configured and functional
