/**
 * Global Tools — mounted in AppShell, always available.
 *
 * These tools survive page transitions. They provide navigation
 * and app-level observability for the agent.
 */

import { useWebMCP, textResult, jsonResult } from '@webmcp-anything/sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import { store } from '@/store';

const NAVIGATE_SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string', description: '目标路由路径，如 /questionnaire/edit/123' },
  },
  required: ['path'],
} as const;

export function useGlobalTools() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── navigate_to_page ──
  useWebMCP({
    name: 'navigate_to_page',
    description: '导航到指定页面路由',
    inputSchema: NAVIGATE_SCHEMA,
    execute: async ({ path }) => {
      navigate(path);
      return textResult(`已导航到 ${path}`);
    },
  });

  // ── get_current_route ──
  useWebMCP({
    name: 'get_current_route',
    description: '获取当前页面的路由路径和参数',
    inputSchema: { type: 'object', properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      return jsonResult({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      });
    },
  });

  // ── get_app_state ──
  useWebMCP({
    name: 'get_app_state',
    description: '获取应用全局状态（用户信息、认证状态等）',
    inputSchema: { type: 'object', properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = store.getState();
      return jsonResult({
        user: state.user,
        auth: { isLoggedIn: !!state.auth?.token },
      });
    },
  });

  // ── get_available_tools ──
  useWebMCP({
    name: 'get_available_tools',
    description: '列出当前页面已注册的所有 WebMCP Tool（用于了解当前可用操作）',
    inputSchema: { type: 'object', properties: {} } as const,
    annotations: { readOnlyHint: true },
    execute: async () => {
      // This is a placeholder — in practice, the agent uses tools/list
      // But this tool helps when the agent is unsure what's available
      return textResult(
        '请调用 MCP tools/list 获取完整的工具列表。' +
        '当前页面的工具会根据路由自动注册和注销。' +
        '导航到新页面后，请重新调用 tools/list 发现新工具。'
      );
    },
  });
}
