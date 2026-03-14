#!/usr/bin/env node

/**
 * CLI entry point for @webmcp-anything/bridge.
 *
 * Usage:
 *   webmcp-bridge                    # Start with defaults (port 9100, random token)
 *   webmcp-bridge --port 9200        # Custom port
 *   webmcp-bridge --token mytoken    # Custom token
 */

import { startBridge } from './index';

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const port = getArg('port') ? parseInt(getArg('port')!, 10) : undefined;
const token = getArg('token');

startBridge({ port, token }).catch((err) => {
  console.error('[bridge] Failed to start:', err);
  process.exit(1);
});
