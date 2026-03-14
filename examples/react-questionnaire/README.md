# Example: React Questionnaire Editor

This example demonstrates how webmcp-anything integrates with a React + Redux (Rematch) questionnaire editor application.

## What's Included

```
src/webmcp/
├── index.ts                          # SDK initialization + Bridge config
├── global-tools.ts                   # Navigation tools (always available)
├── modules/
│   └── questionnaire-tools.ts        # Questionnaire editing tools (page-level)
├── utils/
│   └── result-helpers.ts             # MCP result formatting helpers
└── tool-manifest.json                # Tool inventory
```

## Tools

### Global Tools (always mounted)

| Tool | Type | Description |
|------|------|-------------|
| `navigate_to_page` | write | Navigate to a specific route |
| `get_current_route` | read | Get current URL and route params |
| `get_app_state` | read | Get global app state (user, auth) |
| `get_available_tools` | read | List currently registered page tools |

### Questionnaire Page Tools (mounted on `/questionnaire/edit`)

| Tool | Type | Description |
|------|------|-------------|
| `read_questionnaire_state` | read | Full state snapshot with all questions |
| `batch_create_questionnaire` | write | Create complete questionnaire from scratch |
| `add_questions` | write | Add questions to existing questionnaire |
| `modify_question` | write | Modify a single question's properties |
| `delete_questions` | write | Remove questions by index |
| `update_questionnaire_title` | write | Change the questionnaire title |
| `set_question_logic` | write | Set conditional logic between questions |
| `clear_question_logic` | write | Remove conditional logic |

## How It Works

1. `src/webmcp/index.ts` calls `initBridge()` — connects to Bridge via WebSocket
2. `src/webmcp/global-tools.ts` is mounted in `<AppShell>` — always available
3. `src/webmcp/modules/questionnaire-tools.ts` is mounted in `<QuestionnaireEditPage>` — available only when editing
4. When the user navigates away from `/questionnaire/edit`, questionnaire tools are automatically unregistered

## Agent Workflow

```
Agent: tools/list → sees [navigate_to_page, get_current_route, get_app_state, get_available_tools]
Agent: navigate_to_page("/questionnaire/edit/123")
Agent: tools/list → sees all 12 tools (4 global + 8 questionnaire)
Agent: read_questionnaire_state → understands current state
Agent: batch_create_questionnaire({ title: "Customer Survey", questions: [...] })
Agent: read_questionnaire_state → verifies result
```
