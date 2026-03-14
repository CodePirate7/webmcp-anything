# webmcp-anything:validate Command

Validate an existing WebMCP Tool integration for correctness, completeness, and adherence to WEB-HARNESS.md standards.

## CRITICAL: Read WEB-HARNESS.md First

**Before validating, read `./WEB-HARNESS.md`.** Validation checks are based on the rules and principles defined there.

## Usage

```bash
/webmcp-anything:validate <project-path>
```

## Arguments

- `<project-path>` - **Required.** Local path to the web app source code containing the `src/webmcp/` directory.

## What This Command Does

This command audits an existing Tool integration and reports issues, warnings, and suggestions.

### Check 1: Structure

- Verify `src/webmcp/` directory exists with expected structure
- Verify `tool-manifest.json` exists and is valid JSON
- Verify `global-tools.ts` exists
- Verify at least one module in `modules/`
- Verify `utils/result-helpers.ts` exists

### Check 2: Design Principles

For each Tool module:

- **State-not-DOM**: Scan for `document.querySelector`, `document.getElementById`, `.click()`, `.value =` — flag any DOM manipulation
- **Read-first**: Every module MUST have a `read_*` Tool. Flag modules without one
- **Naming convention**: All Tool names MUST match `verb_noun[_qualifier]`. Flag violations
- **One Tool one purpose**: Flag Tools with `mode` or `action` parameters that switch behavior

### Check 3: Schema Quality

For each Tool's `inputSchema`:

- Verify it's valid JSON Schema
- Verify every property has `type` and `description`
- Verify `required` array is present for schemas with properties
- Flag any property missing `description`
- Flag any enum with fewer than 2 values
- Warn about schemas with more than 10 required properties (might be too complex)

### Check 4: Lifecycle

- Verify global Tools are mounted in the app shell (not a page component)
- Verify page Tools use `useWebMCP` inside a hook that's called in a page component
- Verify page hooks call cleanup (unregister) on unmount
- Cross-reference `tool-manifest.json` page mappings with actual mount points

### Check 5: Results Format

- Verify all execute functions return MCP content format: `{ content: [{ type: 'text', text: ... }] }`
- Flag any execute that returns raw objects instead of MCP format
- Flag any execute that throws instead of returning error text

### Check 6: Tests

- Verify test files exist for each module
- Verify each Tool has at least one test case
- Run tests if possible and report results
- Check that `TEST.md` exists and contains results

### Check 7: Manifest Accuracy

- Compare `tool-manifest.json` entries against actual Tool registrations in code
- Flag Tools in manifest but not in code (phantom Tools)
- Flag Tools in code but not in manifest (undocumented Tools)

## Output

The validation report uses this format:

```
WebMCP Anything Validation Report
================================

Project: /path/to/webapp
Tools found: 12 (4 global + 8 page-level)
Modules: 3

[PASS] Structure — all required files present
[PASS] Naming — all 12 Tools follow verb_noun convention
[WARN] Schema — modify_question.options[].label missing description
[FAIL] Read-first — settings-tools.ts has no read_* Tool
[FAIL] State-not-DOM — dashboard-tools.ts:45 uses document.querySelector
[PASS] Lifecycle — all page Tools mounted correctly
[WARN] Tests — settings-tools.test.ts missing
[PASS] Manifest — all Tools accounted for

Summary: 4 PASS, 2 WARN, 2 FAIL
```

## Example

```bash
/webmcp-anything:validate ./apps/questionnaire
```

## Success Criteria

- Report is generated covering all 7 check categories
- Every FAIL has a specific file path and line number
- Every WARN has a concrete suggestion for improvement
- Zero FAILs means the integration meets WEB-HARNESS.md standards
