# openEuler Portal MCP Server

[![npm version](https://img.shields.io/npm/v/openeuler-portal-mcp.svg)](https://www.npmjs.com/package/openeuler-portal-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

openEuler Model Context Protocol (MCP) Server，为 Claude 等 AI 工具提供 openEuler 官网相关信息的查询能力。

## 环境要求

本项目需要以下环境：

- **Node.js**: >= 18.0.0（推荐使用 LTS 版本）
  - 本项目使用 ES Modules，需要 Node.js 18 或更高版本
  - 下载地址：<https://nodejs.org/>
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

提供 20 个工具函数，根据问题自动选择合适的工具函数。

### 工具列表

| 工具名称 | 函数名 | 功能描述 | 主要参数 | 使用场景 |
|---------|--------|---------|---------|---------|
| SIG 信息查询 | `get_sig_info` | 查询 openEuler SIG 详细信息、成员贡献统计，支持名称模糊推荐 | `sig_name` (必需), `query_type` (可选), `contribute_type` (贡献时可选) | 查询 SIG 维护者、仓库、贡献排行；查询仓库/maintainer 所属的 SIG |
| CVE 安全公告查询 | `get_cve_info` | 查询 openEuler CVE 安全公告信息，支持列表和详情查询 | `query_type` (可选), `keyword` (列表时), `cve_id`+`package_name` (详情时必需) | 查询安全漏洞列表、查看 CVE 详情及受影响产品 |
| 下载信息查询 | `get_download_info` | 查询下载信息、镜像站点、版本列表 | `query` (必需), `query_type` (可选) | 下载 ISO 镜像、查询镜像站点、查看可用版本 |
| 组织信息查询 | `get_organization_info` | 查询 openEuler 社区组织架构和成员信息 | `query` (必需) | 查询委员会、工作组、社区成员信息 |
| 软件包信息查询 | `get_package_info` | 查询发行版软件包信息、生命周期 | `query` (必需), `query_type` (可选) | 查询软件包列表、详情、发行版生命周期 |
| 兼容性测试查询 | `get_compatibility_info` | 查询硬件兼容性测试信息 | `query_type` (必需), `architecture`, `os`, `keyword`, `card_type` | 查询整机/板卡兼容性测试、硬件认证信息 |
| 文档版本查询 | `get_docs_version` | 获取 openEuler 文档版本信息 | 无 | 了解可用文档版本、获取文档仓库地址 |
| 文档内容搜索 | `get_docs_search_content` | 搜索 openEuler 文档内容 | `keyword` (必需), `version` (必需), `lang` (可选) | 搜索技术特性、查找文档说明、了解项目工具、搜索术语解释 |
| 社区会议查询 | `get_meeting_info` | 查询 openEuler 社区开放会议信息 | `query_type` (可选), `date` (按日期时必需), `sig_name` (按SIG时必需) | 查询每日会议安排、SIG 会议记录、无会议时推荐附近日期 |
| 用户案例查询 | `get_showcase_info` | 查询 openEuler 用户案例信息 | `keyword` (可选), `lang` (可选), `industry` (可选) | 查询各行业用户案例、搜索特定企业案例、了解 openEuler 应用实践 |
| 演进提案查询 | `get_oeep_info` | 查询 openEuler 演进提案（oEEP）信息 | `query_type` (可选), `number` (详情时必需), `keyword` (可选) | 查询 oEEP 列表、按关键词/作者过滤、查看具体提案详细内容 |
| 安全公告查询 | `get_security_notice_info` | 查询 openEuler 安全公告列表及详情 | `query_type` (可选), `keyword` (可选), `security_notice_no` (详情时必需) | 查询最新安全公告、按组件名搜索、查看公告完整详情 |
| 缺陷公告查询 | `get_bug_notice_info` | 查询 openEuler 缺陷公告列表及详情 | `query_type` (可选), `keyword` (可选), `security_notice_no` (详情时必需) | 查询最新缺陷公告、按组件名搜索、查看公告完整详情 |
| 门户全站搜索 | `get_search_info` | 全站兜底搜索，覆盖博客/Issue/代码仓库/SIG/会议文档等内容 | `keyword` (必需), `lang` (可选) | 其他工具未找到结果时的兜底查询、搜索博客文章、Issue 等 |
| 用户操作执行 | `execute_user_operation` | 执行用户个人操作（CLA查询、SIG组查询、会议管理等），需配置 OPENEULER_TOKEN | `operation_type` (必需), 其他参数根据操作类型 | 查询 CLA 状态、SIG 组身份、会议查询/创建/取消 |
| 论坛信息查询 | `get_forum_info` | 查询 openEuler 论坛帖子信息（最新、热门、搜索、详情） | `query_type` (可选), `keyword` (搜索时), `topic_id` (详情时) | 查询论坛最新帖子、热门话题、搜索讨论、查看帖子详情 |
| 用户开发活动查询 | `get_development_info` | 查询 Gitcode 用户开发活动、Issue、PR、PR文件变更、PR评论，支持多类型查询，需配置 GITCODE_TOKEN | `gitcode_id` (events必需), `query_type` (可选), `pr_scope` (pulls可选), `owner/repo/number` (files/comment必需), `comment_body` (comment必需), `comment_path/position` (comment可选) | 查询用户开发活动、查看相关Issue/PR、查看PR文件变更、分析代码差异、发表PR评论 |
| 论坛用户操作执行 | `execute_forum_operation` | 执行论坛用户个人操作（评论发布等），需配置 FORUM_TOKEN | `operation_type` (必需), `topic_id` (评论时必需), `raw` (评论时必需) | 在帖子中发布评论、参与社区讨论、回答问题、分享经验 |
| 社区 Issue 查询 | `get_issue_info` | 查询 openEuler 社区 Issue 信息，支持多条件筛选和模糊搜索 | `page` (可选), `issue_state` (可选), `author` (可选), `repo` (可选), `search` (可选) | 查询社区 Issue 列表、按状态/创建者/仓库筛选、模糊搜索 Issue ID/标题 |
| 社区 PR 查询 | `get_pull_request_info` | 查询 openEuler 社区 Pull Request 信息，支持多条件筛选和模糊搜索 | `page` (可选), `state` (可选), `author` (可选), `repo` (可选), `search` (可选) | 查询社区 PR 列表、按状态/提交者/仓库筛选、模糊搜索 SIG/标题 |

### 详细说明

#### 1. SIG 信息查询 (`get_sig_info`)

查询 openEuler 特别兴趣小组（SIG）的详细信息，支持成员贡献统计查询和 SIG 名称模糊推荐。

**何时使用：**

- 用户询问某个 SIG 的信息、维护者、仓库等
- 用户想查看某个 SIG 的成员贡献排行（PR/Issue/评审）
- 用户提到的 SIG 名称不确定（系统自动从 SIG 列表中推荐相近名称）
- 用户想了解某个仓库属于哪些 SIG 组
- 用户想查询某个 maintainer 参与了哪些 SIG 组

**示例问题：**

- "Kernel SIG 的维护者是谁？"
- "ai SIG 管理哪些仓库？"
- "kernel 仓库属于哪些 SIG 组？"
- "bigdata SIG 的成员 PR 贡献排行"
- "查询 ai SIG 的 Issue 贡献情况"
- "big-data SIG 的全部贡献统计"
- "Kernel SIG 最近一个月的 PR 贡献排行"

#### 2. CVE 安全公告查询 (`get_cve_info`)

查询 openEuler CVE（Common Vulnerabilities and Exposures）安全公告信息，支持列表查询和 CVE 详情查询。

**何时使用：**

- 用户询问安全漏洞、CVE 信息
- 用户想了解某个软件包的安全问题
- 用户查询特定 CVE 编号的详情
- 用户想了解某个 CVE 的 CVSS 评分、攻击向量和受影响产品列表

**示例问题：**

- "查询 kernel 相关的 CVE"
- "openssl 有哪些安全漏洞？"
- "CVE-2024-1234 的详细信息"
- "查询 CVE-2026-23865 在 freetype 软件包中的详情"
- "freetype 的 CVE-2026-23865 影响了哪些产品？"

### 3. 下载信息查询 (`get_download_info`)

查询 openEuler 下载信息、镜像仓列表和版本信息。

**何时使用：**

- 用户想下载 openEuler ISO 镜像
- 用户询问某个版本的下载地址
- 用户想查找镜像站点
- 用户想了解有哪些可用版本

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

**示例问题：**

- "查询 x86_64 架构的整机兼容性测试"
- "openEuler-24.03-LTS 支持哪些网卡？"
- "华为服务器的兼容性测试信息"
- "查询 RAID 卡的兼容性测试"

#### 7. 文档版本查询 (`get_docs_version`)

获取 openEuler 文档版本信息。

**何时使用：**

- 用户想了解 openEuler 可用的文档版本
- 用户需要获取文档版本的标签、版本号、终止支持状态和分支名
- 用户想获取对应版本的文档仓库地址
- 用户需要为文档访问和开发提供版本选择依据

**示例问题：**

- "openEuler 有哪些文档版本？"
- "最新的 openEuler 文档版本是什么？"
- "哪个文档版本还在支持中？"
- "获取 openEuler-24.03-LTS 的文档仓库地址"

#### 8. 文档内容搜索 (`get_docs_search_content`)

搜索 openEuler 文档内容，返回与搜索词相关的文档内容。

**何时使用：**

- 用户想搜索 openEuler 的技术特性和功能
- 用户需要查找特定技术的文档说明
- 用户想了解 openEuler 的项目和工具
- 用户需要搜索技术术语、概念解释
- 用户想查找使用指南和最佳实践

**示例问题：**

- "如何在 openEuler 中安装 Docker？"
- "openEuler 的内核特性有哪些？"
- "搜索 openEuler 的安全加固指南"
- "查找 openEuler 的网络配置文档"

#### 9. 社区会议查询 (`get_meeting_info`)

查询 openEuler 社区开放会议信息，支持按日期查询和按 SIG 组查询。

**何时使用：**

- 用户询问某一天有哪些社区会议
- 用户想了解某个 SIG 组的会议安排
- 用户查询会议议题、时间、参与链接
- 用户想查找会议的协作文档或视频回放
- 用户想下载会议字幕文件生成会议总结

**示例问题：**

- "2026年3月3日有哪些 openEuler 社区会议？"
- "Kernel SIG 最近有什么会议安排？"
- "今天的 openEuler 社区会议有哪些？"
- "查看 ai SIG 的会议记录"
- "openEuler 本周有哪些开放会议？"
- "release-management SIG 4月3日的会议有回放吗？"
- "帮我总结一下 release-management SIG 4月3日会议的内容"

#### 10. 用户案例查询 (`get_showcase_info`)

查询 openEuler 在各行业的用户案例，了解 openEuler 在实际生产环境中的应用情况。

**何时使用：**

- 用户询问 openEuler 在某个行业的应用案例
- 用户想查找某个企业使用 openEuler 的案例
- 用户想了解 openEuler 的用户案例列表
- 用户询问 openEuler 在金融、运营商等领域的成功实践

**示例问题：**

- "openEuler 在金融行业有哪些用户案例？"
- "工商银行使用 openEuler 的案例"
- "查询 openEuler 在运营商领域的应用"
- "高校和科研机构使用 openEuler 的案例有哪些？"
- "openEuler 全部用户案例"
- "openEuler 云计算相关案例"

#### 11. 演进提案查询 (`get_oeep_info`)

查询 openEuler 演进提案（oEEP, openEuler Evolution Proposal）信息，了解社区技术决策的来龙去脉。

**何时使用：**

- 用户询问 openEuler 的演进提案、技术提案
- 用户想了解某个社区决策的背景和详情
- 用户搜索特定主题的 oEEP（如内核、镜像、安全、流程）
- 用户查询某个作者或特定状态的 oEEP

**示例问题：**

- "openEuler 有哪些演进提案？"
- "有哪些关于内核的 oEEP？"
- "查看 oEEP-0001 的详细内容"
- "oEEP 5 的方案是什么？"
- "已完成的 oEEP 有哪些？"
- "流程设计类的 oEEP 有哪些？"

#### 12. 安全公告查询 (`get_security_notice_info`)

查询 openEuler 发布的安全公告（Security Notice），支持按关键词搜索列表和查看公告完整详情。

**何时使用：**

- 用户查询某个组件的安全公告（如 kernel、openssl）
- 用户想了解某条安全公告的详细内容
- 用户想了解 openEuler 最新的安全更新
- 用户通过 CVE 编号查找对应的安全公告

**示例问题：**

- "openEuler 最新有哪些安全公告？"
- "kernel 相关的安全公告有哪些？"
- "查询 openEuler-SA-2026-1486 的详细内容"
- "openssl 有哪些安全更新公告？"
- "CVE-2026-2239 对应的公告详情是什么？"

#### 13. 缺陷公告查询 (`get_bug_notice_info`)

查询 openEuler 发布的缺陷公告（Bug Advisory），支持按关键词搜索列表和查看公告完整详情。

**何时使用：**

- 用户查询某个组件的缺陷修复公告（如 kernel、babel、libreport）
- 用户想了解某条缺陷公告的详细内容
- 用户想了解 openEuler 最新的软件缺陷修复情况
- 用户通过缺陷编号（BUG-YYYY-NNNN）查找对应的缺陷公告

**示例问题：**

- "openEuler 最新有哪些缺陷公告？"
- "kernel 组件有哪些缺陷修复公告？"
- "查询 openEuler-BA-2025-1130 的详细内容"
- "babel 相关的缺陷公告有哪些？"
- "BUG-2025-32 对应的公告详情是什么？"

#### 14. 门户全站搜索 (`get_search_info`)

搜索 openEuler 门户网站全站内容，作为其他专项工具都不适用或未查到结果时的兜底查询。

**何时使用：**

- 其他专项工具（CVE 查询、SIG 查询、文档搜索等）均未找到相关结果时
- 问题涉及多个领域，不确定用哪个专项工具时
- 搜索 openEuler 博客文章、新闻资讯
- 搜索社区 Issue、代码提交记录
- 搜索 SIG 组相关内容
- 搜索会议记录（etherpad 文档）
- 泛化问题：如"openEuler 有哪些关于 XXX 的内容？"

**示例问题：**

- "openEuler 社区有关于容器的博客吗？"
- "openEuler 和 RISC-V 相关的内容有哪些？"
- "搜索 openEuler 门户中关于 DPU 的内容"
- "有没有关于 openEuler 虚拟化的文章？"
- "What content does openEuler have about containers?"

#### 15. 用户操作执行 (`execute_user_operation`)

执行 openEuler 社区用户个人操作，需要配置 OPENEULER_TOKEN 环境变量。

**何时使用：**

- 用户想查询自己是否已签署 CLA 协议
- 用户准备贡献代码，需要确认 CLA 签署状态
- 用户想知道自己是哪些 SIG 组的 maintainer 或 committer
- 用户想查询自己参加或预定的会议
- 用户想为自己的 SIG 组创建会议
- 用户想取消已预定的会议
- 用户想取消周期会议中的某一场子会议

**前置条件：**

- 需要在 MCP Server 配置中设置 `OPENEULER_TOKEN` 环境变量
- Token 可从 [openEuler 软件包平台](https://software-pkg.openeuler.org/) 个人设置中获取

**Token 配置方式：**

1. Claude Code 配置：

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"],
      "env": {
        "OPENEULER_TOKEN": "your_token_here"
      }
    }
  }
}
```

命令行启动：

```bash
OPENEULER_TOKEN=your_token_here npx openeuler-portal-mcp
```

**示例问题：**

- "我是否签署了 CLA？"
- "我是哪些 SIG 组的 maintainer？"
- "我参加的会议有哪些？"
- "查询我2026年4月参加的会议"
- "为 sig-OpenDesign 创建一个会议"
- "预定一个周期会议，每周二周五，早上 9:30-10:30"
- "取消周期会议中4月28日的那场子会议"
- "查看我的会议，找到要取消的会议 ID"

#### 16. 论坛信息查询 (`get_forum_info`)

查询 openEuler 论坛（forum.openeuler.org）的帖子信息，支持最新帖子、热门帖子、关键词搜索和帖子详情四种模式。

**何时使用：**

- 用户想了解论坛最近有什么新帖子或讨论
- 用户想查看社区近期热门话题
- 用户搜索特定技术主题的社区讨论
- 用户想查看某个帖子的具体内容

**示例问题：**

- "openEuler 论坛最近有什么新帖子？"
- "社区近一个月讨论最热的话题是什么？"
- "论坛上有关于 kernel 的讨论吗？"
- "查看帖子 197 的具体内容"
- "帮我看看这个帖子说了什么：<https://forum.openeuler.org/t/topic/197">

#### 17. 用户开发活动查询 (`get_development_info`)

查询 Gitcode 平台用户的开发信息，包括开发活动、Issue、Pull Request、PR 文件变更、PR 评论。支持智能推荐，自动关联 SIG 信息、技术文档、论坛讨论等。

**何时使用：**

- 用户想了解某个 Gitcode 用户的开发活动（使用 events）
- 用户想查看与自己相关的 Issue（使用 issues）
- 用户想查看自己创建的 PR（使用 pulls + created_by_me）
- 用户想查看需要自己评审的 PR（使用 pulls + need_my_review）
- 用户想查看分配给自己的 PR（使用 pulls + assigned_to_me）
- 用户想查看某个 PR 的文件变更（使用 files）
- 用户想在 PR 上发表评论或评审意见（使用 comment）
- 用户想对 PR 中特定文件或代码行进行评论（使用 comment + path + position）
- 用户想了解某个用户的开发活跃度

**前置条件：**

- 需要在 MCP Server 配置中设置 `GITCODE_TOKEN` 环境变量
- Token 可从 [Gitcode 平台](https://gitcode.com/) 个人设置中获取

**Token 配置方式：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"],
      "env": {
        "GITCODE_TOKEN": "your_gitcode_token_here",
        "OPENEULER_TOKEN": "your_openeuler_token_here"
      }
    }
  }
}
```

**示例问题：**

- "查询 Gitcode 用户 persimmonzzz 的开发活动"
- "查询与我相关的 Issue"
- "查询我创建的 Pull Request"
- "查看需要我评审的 PR"
- "查询分配给我的 PR"
- "查看 PR #123 的文件变更（仓库：openeuler/community）"
- "帮我分析这个 PR 的改动内容"
- "在 openeuler/kernel PR #123 发表评论：代码实现很清晰"
- "对 openeuler/kernel PR #123 的 src/main.c 第 50 行发表评论：建议增加错误处理"

#### 18. 论坛用户操作执行 (`execute_forum_operation`)

执行 openEuler 社区论坛用户个人操作，需要在 MCP 配置中设置 FORUM_TOKEN 环境变量。

**何时使用：**

- 查询当前用户信息和权限
- 用户想在某个帖子中发表评论、观点或建议
- 用户想回答帖子中的问题、分享经验或补充信息

**前置条件：**

- 需要在 MCP Server 配置中设置 `FORUM_TOKEN` 环境变量
- Token 获取方式：在终端里运行生成命令并按终端提示操作

```bash
npx -y @discourse/mcp@latest generate-user-api-key --site https://forum.openeuler.org --save-to openeuler-forum-key.json
```

**环境变量配置：**

1. **获取 FORUM_TOKEN：**
   - 访问论坛并登录
   - 进入个人设置 → API → 生成新令牌
   - 复制生成的令牌（建议勾选"写入"权限）

2. **配置 MCP Server：**

```json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"],
      "env": {
        "FORUM_TOKEN": "your_forum_token_here",
        "OPENEULER_TOKEN": "your_openeuler_token_here",
        "GITCODE_TOKEN": "your_gitcode_token_here"
      }
    }
  }
}
```

**命令行启动：**

```bash
FORUM_TOKEN=your_token_here npx openeuler-portal-mcp
```

**示例问题：**

- "查看我的论坛用户信息和权限"
- "查询我在论坛的活动记录"
- "查看我最近发布的帖子"
- "查询我的点赞和收藏列表"
- "在帖子 197 中发表评论：感谢分享这个解决方案！"
- "回复帖子 1451：我遇到了相同的问题，请问是怎么解决的？"
- "在论坛帖子中补充说明：openEuler 24.03 LTS 的安装步骤是..."
- "参与讨论：这个方案很棒，我测试过了，确实有效"

#### 19. 社区 Issue 查询 (`get_issue_info`)

查询 openEuler 社区 Issue 信息，支持多条件筛选和模糊搜索。

**何时使用：**

- 用户想查询 openEuler 社区的 Issue 列表
- 用户想查询某个用户创建的 Issue
- 用户想查询某个仓库的 Issue
- 用户想查询特定状态的 Issue
- 用户想通过 Issue ID、标题进行模糊搜索
- 用户想了解社区问题跟踪情况

**示例问题：**

- "查询 openEuler 社区最近的 Issue"
- "查询 kernel 仓库的 Issue"
- "查询状态为进行中的 Issue"
- "搜索标题包含 docker 的 Issue"
- "查询 Issue 编号 1234 的信息"
- "查询 ai SIG 相关的 Issue"
- "查询第二页的 Issue 列表"
- "查询已完成的 Issue 有哪些"

#### 20. 社区 PR 查询 (`get_pull_request_info`)

查询 openEuler 社区 Pull Request (PR) 信息，支持多条件筛选和模糊搜索。

**何时使用：**

- 用户想查询 openEuler 社区的 Pull Request 列表
- 用户想查询某个用户提交的 PR
- 用户想查询某个仓库的 PR
- 用户想查询特定状态的 PR（open/closed/merged）
- 用户想通过 SIG、仓库、标题进行模糊搜索
- 用户想了解社区代码合并情况

**示例问题：**

- "查询 openEuler 社区最近的 Pull Request"
- "查询 kernel 仓库的 PR"
- "查询用户 gzbang 提交的 PR"
- "查询状态为 merged 的 PR"
- "搜索 SIG 为 bigdata 的 PR"
- "查询 openeuler/portal 仓库的开放 PR"
- "查询第二页的 PR 列表"
- "查询已合并的 PR 有多少"

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
│       ├── getCompatibilityInfo.js # 兼容性测试查询
│       ├── getDocsVersion.js       # 文档版本查询
│       ├── getDocsSearchContent.js # 文档内容搜索
│       ├── getMeetingInfo.js       # 社区会议查询
│       ├── getShowcaseInfo.js      # 用户案例查询
│       ├── getOEEPInfo.js          # oEEP 演进提案查询
│       ├── getSecurityNoticeInfo.js # 安全公告查询
│       ├── getBugNoticeInfo.js     # 缺陷公告查询
│       ├── getSearchInfo.js        # 门户全站搜索
│       ├── getForumInfo.js         # 论坛信息查询
│       ├── getDevelopmentInfo.js     # 用户开发活动查询（含Issue/PR/文件变更）
│       ├── getIssueInfo.js         # 社区 Issue 查询
│       ├── getPullRequestInfo.js   # 社区 PR 查询
│       ├── executeUserOperation.js # 用户操作执行
│       └── executeForumOperation.js # 论坛用户操作执行
│   └── utils/                        # 工具模块
│       └── toolRecommendations.js    # 工具间智能推荐
│       └── formatHelpers.js           # 格式化辅助函数
├── tests/                          # 测试文件目录
│   ├── getCveInfo.test.js          # CVE 查询工具测试
│   ├── getSigInfo.test.js          # SIG 信息查询工具测试
│   ├── getMeetingInfo.test.js      # 会议查询工具测试
│   ├── getShowcaseInfo.test.js     # 用户案例查询测试
│   ├── getOEEPInfo.test.js         # oEEP 查询测试
│   ├── getSecurityNoticeInfo.test.js # 安全公告查询测试
│   ├── getBugNoticeInfo.test.js    # 缺陷公告查询测试
│   ├── getSearchInfo.test.js       # 门户全站搜索测试
│   ├── getOrganizationInfo.test.js # 组织信息查询测试
│   ├── getDownloadInfo.test.js     # 下载信息查询测试
│   ├── getPackageInfo.test.js      # 软件包信息查询测试
│   ├── getCompatibilityInfo.test.js # 兼容性测试查询测试
│   ├── getDocsVersion.test.js      # 文档版本查询测试
│   ├── getDocsSearchContent.test.js # 文档内容搜索测试
│   ├── executeUserOperation.test.js # 用户操作执行测试
│   ├── getForumInfo.test.js        # 论坛信息查询测试
│   ├── getDevelopmentInfo.test.js  # 用户开发活动查询测试（含Issue/PR/文件变更）
│   ├── executeForumOperation.test.js # 论坛用户操作执行测试
│   ├── getIssueInfo.test.js        # 社区 Issue 查询测试
│   └── getPullRequestInfo.test.js  # 社区 PR 查询测试
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

## 作者

sig-OpenDesign

---

如有问题或建议，欢迎在 [GitHub Issues](https://github.com/gzbang/openEuler-portal-mcp/issues) 中反馈。
