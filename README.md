# openEuler Portal MCP Server

[![npm version](https://img.shields.io/npm/v/openeuler-portal-mcp.svg)](https://www.npmjs.com/package/openeuler-portal-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

openEuler Model Context Protocol (MCP) Server，为 Claude 等 AI 工具提供 openEuler 官网相关信息的查询能力。

## 环境要求

本项目需要以下环境：

- **Node.js**: >= 18.0.0（推荐使用 LTS 版本）
  - 本项目使用 ES Modules，需要 Node.js 18 或更高版本
  - 下载地址：https://nodejs.org/
- **npm**: >= 9.0.0（随 Node.js 自动安装）

**检查当前版本：**

```bash
node --version
npm --version
```

## 安装

### 方式 1：使用 npx

npx 会在首次使用时自动从 npm 下载包并运行，无需手动执行安装命令。当 MCP 客户端启动时会自动执行。

**注意：** 首次启动时需要联网下载包，之后会使用缓存。

### 方式 2：全局安装

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

## 配置

### Claude Code (终端 CLI)

编辑配置文件：
- macOS/Linux: `~/.claude.json`
- Windows: `%USERPROFILE%\.claude.json`

**使用 npx：**

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

**使用 npx：**

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

**使用 npx：**

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



### Trae-CN

在 trae 设置中配置 MCP servers：

**使用 npx：**

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

提供 6 个工具函数，根据问题自动选择合适的工具函数。

### 工具列表

| 工具名称 | 函数名 | 功能描述 | 主要参数 | 使用场景 |
|---------|--------|---------|---------|---------|
| SIG 信息查询 | `get_sig_info` | 查询 openEuler SIG 的详细信息，支持智能查询 | `sig_name` (必需), `query_type` (可选) | 查询 SIG 维护者、仓库、贡献者；查询仓库/maintainer 所属的 SIG |
| CVE 安全公告查询 | `get_cve_info` | 查询 openEuler CVE 安全公告信息 | `keyword` (必需), `page`, `page_size` | 查询安全漏洞、CVE 详情、软件包安全问题 |
| 下载信息查询 | `get_download_info` | 查询下载信息、镜像站点、版本列表 | `query` (必需), `query_type` (可选) | 下载 ISO 镜像、查询镜像站点、查看可用版本 |
| 组织信息查询 | `get_organization_info` | 查询 openEuler 社区组织架构和成员信息 | `query` (必需) | 查询委员会、工作组、社区成员信息 |
| 软件包信息查询 | `get_package_info` | 查询发行版软件包信息、生命周期 | `query` (必需), `query_type` (可选) | 查询软件包列表、详情、发行版生命周期 |
| 兼容性测试查询 | `get_compatibility_info` | 查询硬件兼容性测试信息 | `query_type` (必需), `architecture`, `os`, `keyword`, `card_type` | 查询整机/板卡兼容性测试、硬件认证信息 |

### 详细说明

#### 1. SIG 信息查询 (`get_sig_info`)

查询 openEuler 特别兴趣小组（SIG）的详细信息，或查询仓库/maintainer 所属的 SIG 组。

**何时使用：**
- 用户询问某个 SIG 的信息、维护者、仓库等
- 用户提到具体的 SIG 名称（如 Kernel、ai、Compiler）
- 用户想了解某个仓库属于哪些 SIG 组
- 用户想查询某个 maintainer 参与了哪些 SIG 组

**参数：**
- `sig_name` (string, 必需): 查询关键词，可以是 SIG 名称、仓库名或 maintainer 的 Gitee ID
- `query_type` (string, 可选): 查询类型，默认为 "sig"（智能查询）
  - `"sig"`: 智能查询模式，自动按 SIG → 仓库 → maintainer 顺序尝试
  - `"repos"`: 仅查询仓库所属的 SIG 组
  - `"maintainer"`: 仅查询 maintainer 所属的 SIG 组

**特性：**
- 智能查询：自动识别输入类型，无需指定查询模式
- 模糊搜索：支持不同大小写变体（如 ai → AI）
- 多类型支持：可查询 SIG、仓库、maintainer

**返回信息：**
- SIG 基本信息（名称、描述、邮件列表）
- Maintainers 列表和详细信息
- 仓库列表（最多显示 20 个）
- Committers 统计（显示前 10 位活跃贡献者）
- 分支管理信息（显示前 3 个分支组）

**示例问题：**
- "Kernel SIG 的维护者是谁？"
- "ai SIG 管理哪些仓库？"
- "kernel 仓库属于哪些 SIG 组？"
- "gzbang 这个 maintainer 参与了哪些 SIG？"

#### 2. CVE 安全公告查询 (`get_cve_info`)

查询 openEuler CVE（Common Vulnerabilities and Exposures）安全公告信息。

**何时使用：**
- 用户询问安全漏洞、CVE 信息
- 用户想了解某个软件包的安全问题
- 用户查询特定 CVE 编号的详情

**参数：**
- `keyword` (string, 必需): 查询关键词，可以是 CVE 编号或软件包名
- `page` (number, 可选): 页码，默认为 1
- `page_size` (number, 可选): 每页显示记录数，默认 20，最大 1000

**返回信息：**
- CVE ID（漏洞编号）
- 摘要（漏洞描述）
- CVSS 评分（漏洞严重程度）
- 状态（如已修复、调查中等）
- 发布时间和更新时间
- 受影响的产品和软件包
- 安全公告编号

**示例问题：**
- "查询 kernel 相关的 CVE"
- "openssl 有哪些安全漏洞？"
- "CVE-2024-1234 的详细信息"

### 3. 下载信息查询 (`get_download_info`)

查询 openEuler 下载信息、镜像仓列表和版本信息。

**何时使用：**
- 用户想下载 openEuler ISO 镜像
- 用户询问某个版本的下载地址
- 用户想查找镜像站点
- 用户想了解有哪些可用版本

**参数：**
- `query` (string, 必需): 查询关键词，可以是版本号或镜像
- `query_type` (string, 可选): 查询类型，默认为 "auto"
  - `"auto"`: 自动查询，支持版本号和模糊搜索
  - `"mirrors"`: 查询镜像仓列表
  - `"versions"`: 查询所有可用版本

**特性：**
- 智能查询：自动识别版本号或关键词
- 模糊搜索：在多个版本中查找匹配的文件
- 镜像列表：显示全球镜像站点信息
- 版本列表：显示所有可用的 openEuler 版本

**返回信息：**
- 下载文件名、大小、路径
- SHA256 校验码
- 支持的架构（aarch64、x86_64 等）
- 镜像站点 URL、国家、带宽
- 版本号、LTS 状态、支持的架构

**示例问题：**
- "openEuler-24.03-LTS 的下载地址"
- "查询 openEuler 镜像站点"
- "有哪些 openEuler 版本可用？"
- "查找 aarch64 架构的 ISO"

#### 4. 组织信息查询 (`get_organization_info`)

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

#### 5. 软件包信息查询 (`get_package_info`)

查询 openEuler 社区发行版软件包信息。

**何时使用：**
- 用户询问 openEuler 发行版的生命周期信息
- 用户想搜索软件包列表
- 用户查询特定软件包的详细信息
- 用户想了解软件包的维护者和分类信息

**参数：**
- `query` (string, 必需): 查询关键词，可以是软件包名称或为空字符串
- `query_type` (string, 可选): 查询类型，默认为 "auto"
  - `"auto"`: 自动查询模式，智能判断返回列表或详情
  - `"lifecycle"`: 查询发行版生命周期信息
  - `"list"`: 搜索软件包列表
  - `"detail"`: 查询软件包详细信息

**特性：**
- 智能查询：自动判断返回列表或详情
- 多类型支持：支持 RPM、OEPKG、IMAGE 等不同类型的包
- 详细信息：包括依赖关系、文件列表、许可证等

**返回信息：**
- 发行版：版本号、发布日期、EOL 日期、支持状态
- 软件包列表：名称、版本、描述、分类、维护者、可用类型
- 软件包详情：完整的包信息、依赖关系、文件列表、许可证等

**示例问题：**
- "openEuler 有哪些版本？"
- "查询 kernel 相关的软件包"
- "redis 软件包的详细信息"
- "nginx 的依赖包有哪些？"

#### 6. 兼容性测试查询 (`get_compatibility_info`)

查询 openEuler 硬件兼容性测试信息。

**何时使用：**
- 用户询问硬件兼容性测试信息
- 用户想了解某个硬件设备在 openEuler 上的认证状态
- 用户查询整机或板卡的兼容性测试列表
- 用户想搜索特定厂商或型号的兼容性信息

**参数：**
- `query_type` (string, 必需): 查询类型
  - `"whole"`: 整机兼容性测试
  - `"board"`: 板卡兼容性测试
- `architecture` (string, 可选): 架构（如 x86_64、aarch64）
- `os` (string, 可选): 操作系统版本（如 openEuler-22.03-LTS-SP4）
- `keyword` (string, 可选): 关键词（厂商名、型号等）
- `card_type` (string, 可选): 板卡类型（仅板卡查询时有效，如网卡、显卡、RAID卡等）

**特性：**
- 多条件查询：支持架构、操作系统、关键词等多条件组合
- 板卡类型筛选：板卡查询支持按类型筛选
- 固定返回前 10 条记录

**返回信息：**
- 整机测试：硬件厂商、型号、CPU、架构、操作系统版本、主板型号、内存、认证时间、产品链接
- 板卡测试：板卡名称、芯片厂商、板卡型号、芯片型号、板卡类型、驱动信息、下载链接、认证时间

**示例问题：**
- "查询 x86_64 架构的整机兼容性测试"
- "openEuler-24.03-LTS 支持哪些网卡？"
- "华为服务器的兼容性测试信息"
- "查询 RAID 卡的兼容性测试"

> 💡 **提示：** 会根据工具的描述自动选择合适的工具。详细了解工具选择机制，请查看 [TOOL_SELECTION.md](./TOOL_SELECTION.md)

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
│       ├── getCveInfo.js           # CVE 安全公告查询
│       ├── getDownloadInfo.js      # 下载信息查询
│       ├── getOrganizationInfo.js  # 组织信息查询
│       ├── getPackageInfo.js       # 软件包信息查询
│       └── getCompatibilityInfo.js # 兼容性测试查询
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
