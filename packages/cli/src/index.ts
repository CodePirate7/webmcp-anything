#!/usr/bin/env node

/**
 * @webmcp-anything/cli
 *
 * CLI entry point for the webmcp-anything project.
 *
 * Commands:
 *   webmcp-anything start    — Start the Bridge server
 *   webmcp-anything info     — Show connection info
 *   webmcp-anything --help   — Show help
 */

import { startBridge } from '@webmcp-anything/bridge';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [command, ...args] = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function loadConfig(): Record<string, unknown> {
  const configPath = resolve(process.cwd(), 'webmcp.config.json');
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
      console.warn(`[cli] Failed to parse ${configPath}`);
    }
  }
  return {};
}

async function main() {
  switch (command) {
    case 'start':
    case undefined: {
      const config = loadConfig();
      const port = getArg('port') ? parseInt(getArg('port')!, 10) : (config.port as number) ?? 9100;
      const token = getArg('token') ?? (config.token as string) ?? undefined;

      const bridge = await startBridge({ port, token });

      // Handle graceful shutdown
      const shutdown = () => {
        console.error('\n[cli] Shutting down...');
        bridge.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      break;
    }

    case 'info': {
      console.log('webmcp-anything');
      console.log('  Bridge WebSocket: ws://localhost:9100');
      console.log('  MCP transport:    stdio');
      console.log('');
      console.log('Quick start:');
      console.log('  1. Add to your MCP config:');
      console.log('     { "command": "npx", "args": ["webmcp-anything"] }');
      console.log('  2. In your app, call initBridge() from @webmcp-anything/sdk');
      console.log('  3. Use useWebMCP() hooks to register tools');
      break;
    }

    case '--help':
    case '-h':
    case 'help': {
      console.log(`
webmcp-anything — Turn any Web App into an MCP Tool Server

USAGE
  webmcp-anything [command] [options]

COMMANDS
  start        Start the Bridge server (default)
  info         Show connection info and quick start guide
  help         Show this help message

OPTIONS
  --port NUM   WebSocket port (default: 9100)
  --token STR  Auth token (default: auto-generated)

CONFIGURATION
  Place a webmcp.config.json in your project root:
  {
    "port": 9100,
    "token": "my-secret-token"
  }

EXAMPLES
  webmcp-anything                     # Start with defaults
  webmcp-anything start --port 9200   # Custom port
  webmcp-anything info                # Show setup instructions
`.trim());
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "webmcp-anything --help" for usage');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('[cli] Fatal error:', err);
  process.exit(1);
});
