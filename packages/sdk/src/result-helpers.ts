/**
 * Result formatting helpers for MCP Tool responses.
 *
 * These match the MCP content format:
 * { content: [{ type: 'text', text: '...' }] }
 */

/** Return a plain text result */
export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

/** Return a JSON-stringified result */
export function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}
