[English](./README.md) | [中文](./README.zh-CN.md)

# webmcp-anything

**将任何 Web App 变为 AI 可调用的 MCP 工具的方法论。**

webmcp-anything 教 AI 编码助手（Claude Code、Codex、Cursor 等）如何为任何 Web 应用生成 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 工具集成。AI 分析你的前端代码库，理解状态管理和业务逻辑，生成操作应用真实状态的 Tool 定义——而非 DOM 模拟。

> 灵感来源于 [CLI-Anything](https://github.com/HKUDS/CLI-Anything)，将相同的 "harness" 方法论从桌面软件延伸到 Web。

## 工作原理

```
你的 Web App                               AI Agent
(React, Vue, Svelte...)                    (Claude, Cursor, Codex...)
     │                                          │
     │  1. AI 读取 WEB-HARNESS.md               │
     │  2. AI 分析你的代码库                      │
     │  3. AI 生成 Tool 定义                      │
     │     (dispatch/actions，非 DOM)             │
     │                                          │
     │         MCP-B 基础设施                     │
     │  ┌─────────────────────────────┐         │
     ├──│  @mcp-b/global (polyfill)   │──MCP───►│
     │  │  @mcp-b/webmcp-local-relay  │         │
     │  └─────────────────────────────┘         │
```

1. 在你的 Web App 中**安装** [MCP-B](https://github.com/nicobailon/mcp-b) 基础设施
2. 在你的 AI 编码助手中**加载** webmcp-anything skill
3. **运行** `/webmcp-anything <你的项目路径>`
4. AI 分析代码库并生成 MCP Tool 定义
5. AI Agent 即可通过结构化工具调用操作你的 Web App

## 核心原则

- **操作状态，非 DOM** — Tool 调用 `dispatch()` / `store.action()`，绝不用 `document.querySelector()`
- **Tool 跟随页面生命周期** — 页面挂载时注册，卸载时注销
- **先读后写** — 每组 Tool 必须包含 `read_*` 工具供 Agent 观察
- **复用已有 Action** — 包装应用已有的 store action，不重新实现
- **AI 生成，标准指导** — 我们提供方法论，AI 完成实现

## 快速开始

### 1. 在你的 Web App 中安装 MCP-B 基础设施

```bash
npm install @mcp-b/global usewebmcp
```

### 2. 在应用入口添加 polyfill

```typescript
// src/main.tsx
import '@mcp-b/global';
```

### 3. 在页面组件中注册 Tool

```typescript
// src/pages/Dashboard.tsx
import { useWebMCP } from 'usewebmcp';
import { useStore } from '../store';

function Dashboard() {
  const store = useStore();

  useWebMCP({
    name: 'read_dashboard_state',
    description: '读取当前仪表盘的指标和状态',
    inputSchema: { type: 'object', properties: {} } as const,
    execute: async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalUsers: store.metrics.totalUsers,
          activeToday: store.metrics.activeToday,
          revenue: store.metrics.revenue,
        }, null, 2),
      }],
    }),
  });

  return <DashboardView />;
}
```

### 4. 通过 MCP-B Relay 连接 AI Agent

```bash
npm install @mcp-b/webmcp-local-relay
npx webmcp-local-relay
```

在 MCP 客户端配置中添加：

```json
{
  "mcpServers": {
    "my-webapp": {
      "command": "npx",
      "args": ["webmcp-local-relay"]
    }
  }
}
```

### 5. 让 AI 生成剩余代码

在 AI 编码助手中加载 webmcp-anything skill，然后运行：

```
/webmcp-anything ./path/to/your/project
```

AI 将分析你的代码库，按照 WEB-HARNESS.md 方法论生成完整的 Tool 集。

## AI Skill 命令

| 命令 | 说明 |
|------|------|
| `/webmcp-anything <path>` | 为 Web App 生成全部 Tool |
| `/webmcp-anything:refine <path>` | 增量扩展 Tool 覆盖范围 |
| `/webmcp-anything:validate <path>` | 审计 Tool 质量 |

### Claude Code / Craft Agent

将 `skill/` 目录复制到你的 agent skills 目录。

### Codex / 其他 Agent

阅读 `skill/SKILL.md`——它包含自包含版本的方法论。

## 项目结构

```
webmcp-anything/
├── WEB-HARNESS.md              # 方法论 SOP（核心资产）
├── VISION.md                   # 项目定位与愿景
├── README.md                   # 英文说明
├── skill/                      # AI Skill 定义（核心资产）
│   ├── SKILL.md                # 自包含方法论
│   └── commands/
│       ├── generate.md         # /webmcp-anything <path>
│       ├── refine.md           # /webmcp-anything:refine
│       └── validate.md         # /webmcp-anything:validate
└── examples/                   # 框架示例
    └── react-todo/             # React + MCP-B 完整示例
```

## 基础设施：MCP-B

webmcp-anything 是一个**方法论项目**——不提供自有 SDK 或 Bridge。基础设施推荐使用 [MCP-B](https://github.com/nicobailon/mcp-b) 生态：

| 包 | 用途 |
|----|------|
| `@mcp-b/global` | `navigator.modelContext` polyfill |
| `usewebmcp` | React Hook，注册 Tool |
| `@mcp-b/react-webmcp` | 另一种 React 集成方式 |
| `@mcp-b/webmcp-local-relay` | 本地 Bridge（WebSocket + MCP stdio） |
| MCP-B Chrome Extension | 浏览器直连 Agent |

当浏览器原生支持 `navigator.modelContext`（Chrome 146+）时，无需 Bridge 或 polyfill。

## 支持的框架

方法论适用于**任何前端框架**——只有 hook/注册语法不同：

| 框架 | 状态管理 | 注册方式 |
|------|---------|---------|
| React | Redux / Zustand / Jotai | `useWebMCP` hook |
| Vue | Pinia / Vuex | `useWebMCPVue` composable |
| Svelte | Stores | `onMount` + SDK |
| Angular | NgRx / Services | Decorator 或 service |
| Vanilla JS | 直接状态 | SDK API |

## 致谢

| 项目 | 贡献 |
|------|------|
| [CLI-Anything](https://github.com/HKUDS/CLI-Anything) | "Harness" 方法论——AI 读标准，生成集成代码 |
| [WebMCP (W3C Draft)](https://webmachinelearning.github.io/webmcp/) | `navigator.modelContext` 浏览器 API 规范 |
| [MCP-B](https://github.com/nicobailon/mcp-b) | 浏览器 MCP 基础设施——polyfill、hooks、relay、Chrome 扩展 |
| [Model Context Protocol](https://modelcontextprotocol.io) | 底层协议标准 |

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 协议

MIT
