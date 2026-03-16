/**
 * MCP content format helpers.
 * All Tool results must use this format.
 */

export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

export function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}
