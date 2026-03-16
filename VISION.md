# Vision

## One-Line Positioning

**webmcp-anything is a methodology for developers to AI-ify their own Web Apps.**

## Core Audience

Frontend developers who have source code access to their web applications and want to make them operable by AI agents through MCP Tools.

## Core Value

We provide **WEB-HARNESS.md** — a standard operating procedure that teaches AI coding agents how to:

1. Analyze a frontend codebase (framework, state management, routes, types)
2. Design MCP Tool definitions at the right abstraction level
3. Generate Tool code that operates the app's real state layer
4. Follow best practices for lifecycle, naming, schemas, and testing

The AI does the implementation work. The methodology ensures quality and consistency.

## What We Do

- **WEB-HARNESS.md** — 7-phase SOP for turning any Web App into MCP Tools
- **AI Skill commands** — `/webmcp-anything`, `/webmcp-anything:refine`, `/webmcp-anything:validate`
- **Framework examples** — Complete reference implementations using MCP-B infrastructure
- **Design principles** — State-not-DOM, read-first, page lifecycle, one-tool-one-purpose

## What We Don't Do

- **No SDK/toolkit** — We recommend [MCP-B](https://github.com/nicobailon/mcp-b) for polyfill, hooks, Bridge, and Chrome Extension
- **No "no-source-code" scraping** — We don't generate Tools by scraping APIs or automating browsers. Projects like [opencli](https://github.com/jackwener/opencli) and [bb-browser](https://github.com/nicobailon/bb-browser) serve that use case well
- **No runtime infrastructure** — No Bridge server, no relay, no browser extension

## Why This Split

**Code-internal Tools ≠ API-scraping CLIs.**

When you have source code, Tools can operate the app's state management layer directly (dispatch, actions, mutations). This gives you:

- Full business flow integrity (validation, side effects, cascading updates)
- State consistency (UI reacts automatically)
- Access to internal state that no API exposes

This is fundamentally different from scraping HTTP APIs or automating browser UI, and requires a different methodology.

## Roadmap

1. **v1.0** — Core methodology (WEB-HARNESS.md + Skill) with React example using MCP-B
2. **v1.1** — Vue and Vanilla JS examples
3. **v1.2** — Advanced patterns: multi-page workflows, complex state, real-time updates
4. **v2.0** — Community-contributed framework adapters and methodology extensions
