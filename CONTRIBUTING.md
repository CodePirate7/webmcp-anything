# Contributing to webmcp-anything

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/CodePirate7/webmcp-anything.git
cd webmcp-anything

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the Bridge in dev mode
pnpm dev
```

## Project Structure

```
packages/
├── sdk/      # @webmcp-anything/sdk — browser SDK (useWebMCP + Bridge client)
├── bridge/   # @webmcp-anything/bridge — Node.js Bridge server
└── cli/      # webmcp-anything — CLI entry point

skill/        # AI agent skill/command definitions (methodology prompts)
examples/     # Example integrations
```

## What to Contribute

### Good First Issues

- Add Vue composable (`useWebMCPVue`) to the SDK
- Add Svelte adapter to the SDK
- Improve error messages in the Bridge
- Add more examples (Vue + Pinia, React + Zustand)

### Methodology Improvements

The `WEB-HARNESS.md` and `skill/` files define how AI agents generate Tool integrations. If you find patterns that the methodology doesn't cover well:

1. Open an issue describing the gap
2. Propose changes to `WEB-HARNESS.md` or skill commands
3. Include a real-world example showing why the change is needed

### New Framework Support

To add support for a new framework (e.g., Svelte, Angular):

1. Create an adapter in `packages/sdk/src/` (e.g., `use-webmcp-svelte.ts`)
2. Add the framework to the tech stack table in `WEB-HARNESS.md`
3. Add an example in `examples/`
4. Update `skill/SKILL.md` with framework-specific guidance

## Code Style

- TypeScript with strict mode
- ESM modules (`"type": "module"`)
- No default exports — use named exports
- Schemas defined as `const` objects with `as const`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Vue composable for useWebMCP
fix: handle WebSocket reconnection edge case
docs: update WEB-HARNESS.md with Svelte patterns
```

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure TypeScript compiles: `pnpm typecheck`
4. Write a clear PR description explaining **what** and **why**
5. Link any related issues

## Reporting Issues

When reporting bugs, please include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (Node version, browser, framework)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
