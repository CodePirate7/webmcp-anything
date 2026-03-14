[English](./README.md) | [中文](./README.zh-CN.md)

# webmcp-anything

**将任何 Web App MCP 化。**

webmcp-anything 是一套方法论和工具集，让 AI Agent 能够为任意 Web 应用自动生成 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) Tool 集成。AI 分析你的前端代码库，理解状态管理和业务逻辑，生成直接操作应用真实状态的 Tool 定义——不是 DOM 模拟。

灵感来源于 [CLI-Anything](https://github.com/HKUDS/CLI-Anything)（为桌面 GUI 软件生成 CLI 接口），webmcp-anything 将同样的「harness」方法论应用于 Web：**定义标准 + AI 提示词，让 AI 生成集成代码。**

## 工作原理

```
┌─────────────┐     MCP stdio      ┌──────────────┐     WebSocket      ┌────────────┐
│  AI Agent   │ ◄────────────────► │    Bridge    │ ◄────────────────► │  Web App   │
│ (Claude,    │   JSON-RPC         │  (Node.js)   │   ws://localhost   │  (React,   │
│  Cursor...) │                    │              │   :9100            │  Vue...)   │
└─────────────┘                    └──────────────┘                    └────────────┘
```

1. **你运行**：在 AI 编程 Agent 中执行 `/webmcp-anything <你的项目路径>`
2. **AI 分析**：前端代码库——框架、状态管理、路由、TypeScript 类型
3. **AI 生成**：调用应用现有 store action 的 MCP Tool 定义
4. **Bridge 连接**：运行中的 Web 应用通过 MCP 协议连接到 AI Agent
5. **AI Agent**：通过结构化的 tool call 操作你的 Web 应用

## 核心原则

- **操作状态，不操作 DOM** — Tool 调用 `dispatch()` / `store.action()`，绝不用 `document.querySelector()`
- **Tool 跟随页面生命周期** — 页面加载时注册，页面卸载时注销
- **先读后写** — 每组 Tool 必须包含 `read_*` Tool 提供 Agent 可观测性
- **复用现有 Action** — 包装应用已有的 store action，不重新实现
- **AI 生成，标准引导** — 不写代码分析器；提供方法论，让 AI 完成工作

## 快速开始

### 1. 在 Web 应用中安装 SDK

```bash
npm install @webmcp-anything/sdk
```

### 2. 初始化 Bridge 连接

```typescript
// src/main.tsx（或你的应用入口）
import { initBridge } from '@webmcp-anything/sdk';

initBridge({
  url: 'ws://localhost:9100',
  appId: 'my-app',
});
```

### 3. 在页面组件中注册 Tool

```typescript
// src/pages/Dashboard.tsx
import { useWebMCP } from '@webmcp-anything/sdk';
import { useStore } from '../store';

function Dashboard() {
  const store = useStore();

  useWebMCP({
    name: 'read_dashboard_state',
    description: '读取当前仪表盘的指标和状态',
    inputSchema: { type: 'object', properties: {} } as const,
    execute: async () => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            totalUsers: store.metrics.totalUsers,
            activeToday: store.metrics.activeToday,
            revenue: store.metrics.revenue,
          }, null, 2),
        }],
      };
    },
  });

  return <DashboardView />;
}
```

### 4. 将 Bridge 添加到 MCP 配置

```json
{
  "mcpServers": {
    "my-webapp": {
      "command": "npx",
      "args": ["webmcp-anything", "start"]
    }
  }
}
```

### 5. 让 AI 生成剩余部分

在你的 AI 编程 Agent 中使用 webmcp-anything 的 skill/command：

```
/webmcp-anything ./path/to/your/project
```

AI 会分析你的代码库并生成完整的 Tool 集合。

## AI 驱动的生成

webmcp-anything 遵循 **harness 方法论**：我们提供标准和提示词，AI 生成集成代码。

### Claude Code / Craft Agent

将 `skill/` 目录复制到你的 Agent skills 文件夹中，然后使用：

```
/webmcp-anything <project-path>          # 生成所有 Tool
/webmcp-anything:refine <project-path>   # 扩展覆盖范围
/webmcp-anything:validate <project-path> # 审计质量
```

### Codex / 其他 Agent

阅读 `skill/SKILL.md`——它包含方法论的自包含版本。

## 架构

### 包

| 包 | 描述 | npm |
|---|------|-----|
| `@webmcp-anything/sdk` | 浏览器 SDK — Bridge 客户端 + `useWebMCP` 重导出 | `@webmcp-anything/sdk` |
| `@webmcp-anything/bridge` | Node.js Bridge 服务 — WebSocket + MCP stdio | `@webmcp-anything/bridge` |
| `webmcp-anything` | CLI 入口 | `webmcp-anything` |

### Bridge 工作原理

Bridge 是 Web 应用和 AI Agent 之间的**薄管道**：

```
浏览器标签页                   Bridge 服务                  AI Agent
    │                              │                           │
    │── WS 连接 ─────────────────>│                           │
    │── register {appId, tools} ─>│                           │
    │<─ registered {tabId} ───────│                           │
    │                              │                           │
    │  (useWebMCP 挂载 Tool)       │                           │
    │── tools_updated {tools} ───>│                           │
    │                              │<── tools/list ────────────│
    │                              │──── tools[] ─────────────>│
    │                              │<── tools/call ────────────│
    │<─ execute_tool {name,args} ─│                           │
    │── tool_result {result} ────>│──── result ──────────────>│
```

**原生 WebMCP 支持**：当 `navigator.modelContext` 可用时（Chrome 146+），SDK 直接使用——无需 Bridge。Bridge 是浏览器不支持原生 WebMCP 时的降级方案。

### 多标签页支持

多标签页连接时，Tool 自动加上命名空间：

```
单标签页:  read_questionnaire_state
多标签页:  questionnaire-a3f2:read_questionnaire_state
           dashboard-b7c1:read_dashboard_state
```

## 支持的框架

| 框架 | 状态管理 | 状态 |
|------|---------|------|
| React | Redux / Rematch | 已支持 |
| React | Zustand | 已支持 |
| React | Jotai / Recoil | 已支持 |
| Vue | Pinia | 计划中 |
| Vue | Vuex | 计划中 |
| Svelte | Stores | 计划中 |
| Angular | NgRx / Services | 计划中 |

方法论适用于任何框架——只是 hook/注册的语法不同。

## 项目结构

```
webmcp-anything/
├── WEB-HARNESS.md              # 方法论 SOP（「圣经」）
├── README.md                   # 英文 README
├── README.zh-CN.md             # 中文 README（本文件）
├── packages/
│   ├── sdk/                    # @webmcp-anything/sdk
│   │   └── src/
│   │       ├── index.ts        # 入口：重导出 useWebMCP + bridge
│   │       ├── bridge-client.ts # WebSocket 驱动的 modelContext
│   │       └── result-helpers.ts
│   ├── bridge/                 # @webmcp-anything/bridge
│   │   └── src/
│   │       ├── index.ts        # 入口：startBridge()
│   │       ├── ws-server.ts    # WebSocket 服务
│   │       ├── tab-registry.ts # 标签页连接注册表
│   │       ├── mcp-server.ts   # MCP stdio 处理
│   │       └── bin.ts          # CLI 入口
│   └── cli/                    # webmcp-anything
│       └── src/
│           └── index.ts        # CLI 命令
├── skill/                      # AI Agent 指令定义
│   ├── SKILL.md                # 自包含方法论
│   └── commands/
│       ├── generate.md         # /webmcp-anything <path>
│       ├── refine.md           # /webmcp-anything:refine
│       └── validate.md         # /webmcp-anything:validate
└── examples/
    └── react-questionnaire/    # 示例集成
```

## 与 CLI-Anything 的对比

| 方面 | CLI-Anything | webmcp-anything |
|------|-------------|----------------|
| 目标 | 桌面 GUI 软件 | Web 应用 |
| 分析 | 后端源码 | 前端源码 |
| 生成 | Python CLI (Click) | TypeScript MCP Tool |
| 后端 | 真实软件可执行文件 | Web 应用真实状态层 |
| 接口 | CLI 命令 + REPL | MCP Tool via Bridge |
| 生命周期 | 静态（安装一次） | 动态（随页面挂载/卸载） |

**共同点**：AI 生成代码、方法论提供标准、先读后写模式、单操作单 Tool、迭代式细化。

## 与 MCP-B 的对比

| 方面 | MCP-B | webmcp-anything |
|------|-------|----------------|
| 传输 | postMessage + Chrome 插件 | WebSocket（无需插件） |
| 生产部署 | 云中继 (mcp-b.io) | 自托管 Bridge 或原生 WebMCP |
| Tool 注册 | `navigator.modelContext` | 相同（兼容的 polyfill） |
| 跨浏览器 | 仅 Chrome（需插件） | 所有浏览器（WebSocket） |
| 生成方式 | 手动编写 Tool | AI 驱动 + 方法论 |

webmcp-anything 使用 MCP-B npm 生态中相同的 `useWebMCP` hook——两者互补，不是竞争。

## 灵感与致谢

本项目建立在以下优秀工作之上：

| 项目 | 贡献 | 链接 |
|------|------|------|
| **CLI-Anything** | 「harness」方法论 — AI 阅读标准，生成集成代码。我们的整体方法（WEB-HARNESS.md + skill commands）直接受 CLI-Anything 的 HARNESS.md + commands 模式启发。 | [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) |
| **WebMCP (W3C 草案)** | `navigator.modelContext` 浏览器 API 规范，定义了网页如何向 AI Agent 暴露 Tool。我们的 SDK 以此标准为目标。 | [WebMCP Spec](https://webmachinelearning.github.io/webmcp/) |
| **MCP-B (Browser MCP)** | `useWebMCP` React hook 和 `@mcp-b/webmcp-polyfill`，我们在此基础上构建。MCP-B 开创了使用 Chrome 插件 + 云中继的浏览器到 Agent 桥接概念。 | [anthropics/mcp-b](https://github.com/anthropics/mcp-b) |
| **Model Context Protocol** | 底层协议标准，使 AI Agent 能够发现和调用 Tool。我们的 Bridge 通过 `@modelcontextprotocol/sdk` 实现 MCP。 | [MCP Spec](https://modelcontextprotocol.io) |

**核心区别**：CLI-Anything 为桌面 GUI 软件生成 CLI 命令；webmcp-anything 为 Web 应用生成 MCP Tool。MCP-B 提供 Chrome 插件传输；webmcp-anything 提供跨浏览器的 WebSocket 传输。它们是解决「AI 操作软件」问题的互补方案。

## 贡献

欢迎贡献！请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解指南。

## 许可证

MIT
