# openEuler Portal MCP Server

[![npm version](https://img.shields.io/npm/v/openeuler-portal-mcp.svg)](https://www.npmjs.com/package/openeuler-portal-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

openEuler Model Context Protocol (MCP) 服务器，为 AI 助手提供 openEuler 社区相关信息的查询能力。

## 安装

### 方式 1：使用 npx（推荐）

npx 会在首次使用时自动从 npm 下载包并运行，无需手动执行安装命令。当 MCP 客户端启动时会自动执行。

**优点：**
- 无需手动执行安装命令
- 配置即可使用
- 自动使用最新版本

**注意：** 首次启动时需要联网下载包，之后会使用缓存。

### 方式 2：全局安装

提前手动安装到系统，启动更快。

```bash
npm install -g openeuler-portal-mcp
```

**优点：**
- 启动速度更快（无需下载）
- 可以固定版本
- 离线也能使用

### 方式 3：本地开发

克隆源码进行开发和调试。

```bash
# 克隆仓库
git clone https://github.com/gzbang/openEuler-portal-mcp.git
cd openEuler-portal-mcp

# 安装依赖
npm install
```

**优点：**
- 可以修改源码
- 适合贡献代码
- 适合调试问题

## 配置

### Claude Desktop

编辑配置文件：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**使用 npx（推荐）：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"]
    }
  }
}
```

**使用全局安装：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "openeuler-portal-mcp"
    }
  }
}
```

**使用本地路径：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "node",
      "args": ["/path/to/openEuler-portal-mcp/src/index.js"]
    }
  }
}
```

### Cursor

在 Cursor 的 MCP 配置中添加：

**使用 npx（推荐）：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"]
    }
  }
}
```

**使用全局安装：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "openeuler-portal-mcp"
    }
  }
}
```

**使用本地路径：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "node",
      "args": ["/path/to/openEuler-portal-mcp/src/index.js"]
    }
  }
}
```

### Cline (VS Code Extension)

在 VS Code 设置中配置 MCP servers：

**使用 npx（推荐）：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"]
    }
  }
}
```

**使用全局安装：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "openeuler-portal-mcp"
    }
  }
}
```

**使用本地路径：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "node",
      "args": ["/path/to/openEuler-portal-mcp/src/index.js"]
    }
  }
}
```

## 功能

本服务器提供 3 个工具，AI 助手会根据用户的问题自动选择合适的工具。

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

### 3. 组织信息查询 (`get_organization_info`)

查询 openEuler 社区组织架构和成员信息。

**何时使用：**
- 用户询问社区组织结构
- 用户想了解委员会、工作组信息
- 用户查询社区成员和角色

**参数：**
- `query` (string, 必需): 查询关键词

**示例问题：**
- "openEuler 有哪些委员会？"
- "技术委员会的成员有谁？"

> 💡 **提示：** AI 助手会根据工具的描述自动选择合适的工具。详细了解工具选择机制，请查看 [TOOL_SELECTION.md](./TOOL_SELECTION.md)

## 高级用法

### SSE 模式（远程连接）

如果需要通过 HTTP 远程访问 MCP server：

```bash
# 使用 npx
npx openeuler-portal-mcp --sse

# 或指定端口
PORT=3000 npx openeuler-portal-mcp --sse

# 或使用全局安装
openeuler-portal-mcp --sse
```

SSE 模式提供以下端点：
- `http://localhost:3000/sse` - SSE 连接端点
- `http://localhost:3000/message` - 消息处理端点
- `http://localhost:3000/health` - 健康检查端点

### Docker 部署

```bash
# 构建镜像
docker build -t openeuler-portal-mcp .

# 运行容器（SSE 模式）
docker run -p 3000:3000 openeuler-portal-mcp
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/gzbang/openEuler-portal-mcp.git
cd openEuler-portal-mcp

# 安装依赖
npm install

# 启动开发服务器（Stdio 模式）
npm start

# 或启动 SSE 模式
npm run start:sse
```

## 项目结构

```
openeuler-portal-mcp/
├── src/
│   ├── index.js                    # 主入口文件
│   └── tools/                      # 工具函数目录
│       ├── getSigInfo.js           # SIG 信息查询
│       ├── getOpenEulerInfo.js     # 文档检索
│       └── getOrganizationInfo.js  # 组织信息查询
├── docs/                           # 文档目录
├── package.json
├── Dockerfile
└── README.md
```

## 贡献

欢迎贡献！请随时提交 Issue 或 Pull Request。

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

## 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [openEuler 官网](https://www.openeuler.org/)
- [GitHub 仓库](https://github.com/gzbang/openEuler-portal-mcp)
- [npm 包](https://www.npmjs.com/package/openeuler-portal-mcp)

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者

sig-OpenDesign

---

如有问题或建议，欢迎在 [GitHub Issues](https://github.com/gzbang/openEuler-portal-mcp/issues) 中反馈。
