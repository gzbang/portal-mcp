# openEuler MCP Server

openEuler Model Context Protocol (MCP) 服务器，提供 openEuler 社区相关信息的查询功能。

## 功能

本服务器提供 2 个工具，Agent 会根据用户的问题自动选择合适的工具。

### 1. SIG 信息查询 (`get_sig_info`)

查询 openEuler 特别兴趣小组（SIG）的详细信息。

**何时使用：**
- 用户询问某个 SIG 的信息、维护者、仓库等
- 用户提到具体的 SIG 名称（如 Kernel、ai、Cloud）
- 用户想了解 "谁负责 XXX"

**参数：**
- `sig_name` (string, 必需): SIG 名称，例如 "Kernel", "ai", "Cloud"

**返回信息：**
- SIG 基本信息（名称、描述、邮件列表）
- Maintainers 列表和详细信息
- 仓库列表（最多显示 20 个）
- Committers 统计（显示前 10 位活跃贡献者）
- 分支管理信息（显示前 3 个分支组）

**示例问题：**
- "Kernel SIG 的维护者是谁？"
- "ai SIG 管理哪些仓库？"
- "告诉我关于 Cloud SIG 的信息"

### 2. 文档检索 (`get_openEuler_info`)

在 openEuler 官方文档中检索相关信息。

**何时使用：**
- 用户搜索技术特性、功能、文档
- 用户询问 "什么是"、"如何"、"有哪些"
- 用户想了解技术概念或使用指南

**参数：**
- `query` (string, 必需): 检索关键词，支持多关键词（空格分隔）

**特性：**
- 智能段落提取（自动识别完整段落）
- 多关键词匹配（支持空格分隔）
- 相关度排序（按匹配分数排序）
- 返回所有匹配结果（不限数量）

**示例问题：**
- "搜索 openEuler 中关于 kernel 的信息"
- "openEuler 有哪些容器相关的特性？"
- "什么是 openEuler 的安全特性？"

> 💡 **提示：** Agent 会根据工具的描述自动选择合适的工具。详细了解工具选择机制，请查看 [TOOL_SELECTION.md](./TOOL_SELECTION.md)

## 安装

```bash
npm install
```

## 使用

### Stdio 模式（推荐用于 Cursor 等 IDE）

```bash
npm start
# 或
node src/index.js
```

### SSE 模式（用于远程连接）

```bash
npm run start:sse
# 或
node src/index.js --sse
```

SSE 模式会在 `http://localhost:3000` 启动 HTTP 服务器。

## Cursor 配置

在 Cursor 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "openeuler-mcp": {
      "command": "node",
      "args": ["D:\\trae\\portal-mcp\\src\\index.js"]
    }
  }
}
```

或使用 npm：

```json
{
  "mcpServers": {
    "openeuler-mcp": {
      "command": "npm",
      "args": ["start"],
      "cwd": "D:\\trae\\portal-mcp"
    }
  }
}
```

## 项目结构

```
portal-mcp/
├── src/
│   ├── index.js              # 主入口文件
│   └── tools/                # 工具函数目录
│       ├── getSigInfo.js     # SIG 信息查询
│       └── getOpenEulerInfo.js  # 文档检索
├── package.json
└── README.md
```

## 开发

### 添加新工具

1. 在 `src/tools/` 目录下创建新的工具文件
2. 导出工具函数和 `toolDefinition`
3. 在 `src/index.js` 中导入并注册工具

示例：

```javascript
// src/tools/myTool.js
export async function myTool(param) {
  // 工具逻辑
  return "结果";
}

export const toolDefinition = {
  name: "my_tool",
  description: "工具描述",
  inputSchema: {
    type: "object",
    required: ["param"],
    properties: {
      param: {
        type: "string",
        description: "参数描述",
      },
    },
  },
};
```

## 许可证

MIT
