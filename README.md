# openEuler MCP Server

这是一个MCP (Model Context Protocol) 服务器，提供openEuler相关的开发工具功能。

## 功能

- **search_code**: 在代码文件中搜索特定查询内容
- **analyze_dependencies**: 分析项目依赖项
- **fetch_documentation**: 获取包的文档（支持PyPI和npm）
- **get_sig_info**: 获取openEuler SIG的相关信息
- **get_openEuler_info**: 获取openEuler相关信息的检索功能

## 依赖

- Node.js 18+
- @modelcontextprotocol/sdk
- glob

## 安装

```bash
npm install
```

## 运行

```bash
npm start
```

## 配置

在Claude Desktop配置文件中添加：

```json
{
  "mcpServers": {
    "openeuler": {
      "command": "node",
      "args": ["/path/to/portal-mcp/src/index.js"]
    }
  }
}
```

## 项目结构

```
portal-mcp/
├── src/
│   └── index.js       # MCP服务器主文件
├── package.json       # 项目配置
├── README.md          # 说明文档
└── .gitignore         # Git忽略文件
```
