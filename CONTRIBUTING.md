# Contributing to webmcp-anything

Thanks for your interest in contributing! webmcp-anything is a **methodology project** — it teaches AI agents how to turn Web Apps into MCP Tools.

## What You Can Contribute

### Methodology Improvements

The `WEB-HARNESS.md` and `skill/` files define how AI agents generate Tool integrations. If you find patterns that the methodology doesn't cover well:

1. Open an issue describing the gap
2. Propose changes to `WEB-HARNESS.md` or skill commands
3. Include a real-world example showing why the change is needed

### New Framework Examples

To add support for a new framework:

1. Create a new directory under `examples/` (e.g., `examples/vue-todo/`)
2. Use [MCP-B](https://github.com/nicobailon/mcp-b) infrastructure (`@mcp-b/global`, `@mcp-b/webmcp-local-relay`)
3. Follow the design principles in `WEB-HARNESS.md`
4. Include a README with setup instructions

### Skill Command Improvements

The `skill/commands/` directory contains AI-readable prompts for code generation. Improvements to these prompts directly improve the quality of generated Tools.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
docs: update WEB-HARNESS.md with Svelte patterns
feat: add vue-todo example
fix: correct state management guidance in generate command
```

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Write a clear PR description explaining **what** and **why**
4. Link any related issues

## Reporting Issues

When reporting issues, please include:

- What scenario or framework you're working with
- What the methodology recommended vs what actually works
- Suggested improvement

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
