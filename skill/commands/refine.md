# webmcp-anything:refine Command

Refine an existing WebMCP Tool integration to improve coverage of the web app's capabilities.

## CRITICAL: Read WEB-HARNESS.md First

**Before refining, read `./WEB-HARNESS.md`.** All new Tools and tests must follow the same standards as the original build. WEB-HARNESS.md is the single source of truth for design principles, patterns, and quality requirements.

## Usage

```bash
/webmcp-anything:refine <project-path> [focus]
```

## Arguments

- `<project-path>` - **Required.** Local path to the web app source code. Must be the same project used during the original `/webmcp-anything` build.

- `[focus]` - **Optional.** Natural-language description of the functionality area to target. When provided, the agent skips broad gap analysis and focuses on the specified area.

  Examples:
  - `/webmcp-anything:refine ./apps/questionnaire "conditional logic and branching"`
  - `/webmcp-anything:refine ./apps/crm "contact import and bulk operations"`
  - `/webmcp-anything:refine ./apps/editor "collaborative editing and comments"`

## What This Command Does

This command is used **after** Tools have been generated with `/webmcp-anything`. It analyzes gaps between the web app's full capabilities and current Tool coverage, then expands coverage incrementally.

### Step 1: Inventory Current Coverage

- Read all existing Tool modules in `src/webmcp/modules/`
- List every Tool name, its page mapping, and whether it's read/write
- Read existing tests to understand what's covered
- Read `tool-manifest.json` for the current inventory
- Build a coverage map:
  ```
  /questionnaire/edit:
    read_questionnaire_state    ✅ covered
    batch_create_questionnaire  ✅ covered
    reorder_questions           ❌ missing
    duplicate_question          ❌ missing
    preview_questionnaire       ❌ missing
  ```

### Step 2: Analyze App Capabilities

- Re-scan the project source at `<project-path>`
- Identify state actions and user interactions not yet covered by Tools
- Focus on:
  - Store actions that have no corresponding Tool
  - Page components with interactive UI that lack Tool coverage
  - API endpoints that are called by the UI but not exposed as Tools
- If `[focus]` is provided, narrow to that specific area only

### Step 3: Gap Analysis

- Compare current coverage against full capability set
- Prioritize gaps by:
  1. **High impact** — commonly used features missing from Tools
  2. **Easy wins** — state actions that can be directly wrapped
  3. **Composability** — features that unlock new agent workflows when combined
- **Present the gap report to the user and confirm which gaps to address**

### Step 4: Implement New Tools

- Add new Tools to existing modules or create new modules as appropriate
- Follow the same patterns:
  - Schemas derived from TypeScript types
  - Execute functions using existing store actions
  - Error handling with try/catch
  - MCP content format results
- Update page component mount points if new modules are added
- **Do not remove existing Tools** unless the user explicitly requests it

### Step 5: Expand Tests

- Add unit tests for every new Tool
- Add integration tests for new workflows
- Run all tests (old + new) to ensure no regressions

### Step 6: Update Documentation

- Update `tool-manifest.json` with new Tools
- Update `src/webmcp/README.md` with new Tool descriptions
- Update `TEST.md` with new test results

## Example

```bash
# Broad refinement — find and fill coverage gaps
/webmcp-anything:refine ./apps/questionnaire

# Focused refinement — target conditional logic features
/webmcp-anything:refine ./apps/questionnaire "question logic, skip patterns, and branching rules"

# Focused refinement — add bulk operation tools
/webmcp-anything:refine ./apps/crm "batch import, export, and bulk status updates"
```

## Success Criteria

- All existing tests still pass (no regressions)
- New Tools follow the same design principles (per WEB-HARNESS.md)
- New tests achieve 100% pass rate
- Coverage meaningfully improved (new capabilities exposed as Tools)
- `tool-manifest.json` and README updated
- Refine never removes existing Tools — it only adds or enhances
