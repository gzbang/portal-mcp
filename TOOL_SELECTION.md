# Agent 工具选择指南

## Agent 如何选择工具？

Agent（如 Claude）通过以下信息来决定调用哪个工具：

### 1. 工具名称 (`name`)

- 简洁、描述性的名称
- 使用下划线分隔的小写命名
- 例如：`get_sig_info`, `get_cve_info`

### 2. 工具描述 (`description`)

这是最重要的部分！Agent 主要依靠描述来理解工具的用途。

**好的描述应该包括：**

- **简短总结**：一句话说明工具的主要功能
- **使用场景**：列出具体的使用情况
- **示例**：提供具体的输入示例
- **返回信息**：说明会返回什么样的结果

### 3. 输入参数 (`inputSchema`)

- 参数名称和类型
- 参数描述（包含示例）
- 必需/可选标记

---

## 本项目的工具（共 20 个）

### 分类导航

| 分类 | 工具 |
|------|------|
| **社区信息** | `get_sig_info`, `get_organization_info`, `get_meeting_info` |
| **安全公告** | `get_cve_info`, `get_security_notice_info`, `get_bug_notice_info` |
| **下载与软件包** | `get_download_info`, `get_package_info` |
| **文档与技术** | `get_docs_version`, `get_docs_search_content`, `get_compatibility_info` |
| **提案与案例** | `get_oeep_info`, `get_showcase_info` |
| **论坛与社区** | `get_forum_info`, `get_search_info` |
| **开发活动（Gitcode）** | `get_development_info`, `get_issue_info`, `get_pull_request_info` |
| **用户操作** | `execute_user_operation`, `execute_forum_operation` |

---

## 详细工具说明

### 工具 1: `get_sig_info` - SIG 信息查询

**何时使用：**

- 用户询问某个 SIG 的信息、维护者、仓库
- 用户想查看 SIG 成员贡献排行
- 用户查询仓库或 maintainer 属于哪个 SIG
- SIG 名称不确定时（系统自动推荐相近名称）

**触发关键词：**

- "SIG"、"特别兴趣小组"、"工作组"
- "维护者"、"maintainer"、"committer"
- "贡献排行"、"贡献统计"
- 具体 SIG 名称（Kernel, AI, Cloud, Security 等）

**示例用户问题：**

- "Kernel SIG 的信息是什么？"
- "谁是 AI SIG 的维护者？"
- "Cloud SIG 管理哪些仓库？"
- "查看 Kernel SIG 最近一个月的 PR 贡献排行"
- "仓库 src-openeuler/kernel 属于哪个 SIG？"
- "maintainer persimmonzzz 参加了哪些 SIG？"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `sig_name` | string | 是 | SIG 名称、仓库名或 maintainer ID |
| `query_type` | string | 否 | 查询类型：sig/repos/maintainer/contribute |
| `contribute_type` | string | 否 | 贡献类型：pr/issue/comment/all |
| `time_range` | string | 否 | 时间范围：all/lastonemonth/lasthalfyear/lastoneyear |

---

### 工具 2: `get_cve_info` - CVE 安全公告查询

**何时使用：**

- 用户查询安全漏洞信息
- 用户想了解 CVE 详情及受影响版本
- 用户按关键词搜索 CVE 列表

**触发关键词：**

- "CVE"、"安全漏洞"、"漏洞"
- "安全公告"、"漏洞编号"
- 组件名称（kernel, nginx 等）

**示例用户问题：**

- "查询最新的 CVE 安全公告"
- "查看 CVE-2024-1234 的详情"
- "搜索 kernel 相关的 CVE"
- "CVE-2023-4567 影响了哪些版本？"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：list/detail |
| `keyword` | string | 否 | 搜索关键词 |
| `page/page_size` | number | 否 | 分页参数 |
| `cve_id` | string | 详情必需 | CVE 编号 |
| `package_name` | string | 详情必需 | 软件包名 |

---

### 工具 3: `get_download_info` - 下载信息查询

**何时使用：**

- 用户想下载 openEuler ISO 镜像
- 用户查询可用版本、镜像站点
- 用户询问下载地址、安装介质

**触发关键词：**

- "下载"、"安装"、"镜像"
- "ISO"、"镜像站点"
- 版本号（22.03, 24.03 等）

**示例用户问题：**

- "下载 openEuler 22.03 LTS"
- "查询最新的 openEuler 版本"
- "国内镜像站点有哪些？"
- "获取 openEuler 24.03 的下载地址"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 查询关键词或版本号 |
| `query_type` | string | 否 | 查询类型：auto/version/mirror/download |

---

### 工具 4: `get_organization_info` - 组织信息查询

**何时使用：**

- 用户询问 openEuler 社区组织架构
- 用户查询委员会、工作组信息
- 用户想了解社区成员、决策组织

**触发关键词：**

- "组织"、"架构"、"委员会"
- "工作组"、"技术委员会"
- "理事会"、"成员"

**示例用户问题：**

- "openEuler 的组织架构是什么？"
- "技术委员会有哪些成员？"
- "查询 openEuler 理事会信息"
- "社区有哪些工作组？"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 查询关键词（组织名或类型） |

---

### 工具 5: `get_package_info` - 软件包信息查询

**何时使用：**

- 用户查询某个软件包的信息
- 用户了解软件包在哪些版本可用
- 用户查询发行版生命周期

**触发关键词：**

- "软件包"、"包"、"rpm"
- "生命周期"、"版本支持"
- 软件包名（nginx, kernel 等）

**示例用户问题：**

- "查询 nginx 软件包的信息"
- "kernel 包在哪些版本可用？"
- "openEuler 22.03 的生命周期"
- "查看 firefox 包的版本信息"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 软件包名或版本号 |
| `query_type` | string | 否 | 查询类型：auto/package/version |

---

### 工具 6: `get_compatibility_info` - 兼容性测试查询

**何时使用：**

- 用户查询硬件兼容性认证
- 用户了解整机/板卡兼容性
- 用户查询硬件是否支持 openEuler

**触发关键词：**

- "兼容性"、"硬件认证"
- "整机"、"服务器"
- "板卡"、"显卡"、"网卡"
- 厂商名称（华为、联想等）

**示例用户问题：**

- "查询华为服务器的兼容性"
- "查看 openEuler 支持的整机列表"
- "某款网卡是否兼容 openEuler？"
- "兼容性测试结果"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 是 | 查询类型：whole/card |
| `architecture` | string | 否 | 架构：x86_64/aarch64 |
| `os` | string | 否 | 操作系统版本 |
| `keyword` | string | 否 | 搜索关键词 |
| `card_type` | string | 否 | 板卡类型 |

---

### 工具 7: `get_docs_version` - 文档版本查询

**何时使用：**

- 用户想了解可用的文档版本
- 用户获取文档仓库地址
- 用户查询文档版本列表

**触发关键词：**

- "文档版本"、"文档"
- "技术文档"、"手册"
- "可用版本"

**示例用户问题：**

- "openEuler 有哪些文档版本？"
- "获取文档的仓库地址"
- "查看可用的技术文档版本"

**参数说明：**
无参数

---

### 工具 8: `get_docs_search_content` - 文档内容搜索

**何时使用：**

- 用户搜索技术文档内容
- 用户了解技术特性、功能说明
- 用户查找使用指南、配置方法

**触发关键词：**

- "搜索文档"、"查找文档"
- "技术特性"、"功能说明"
- "如何"、"怎么"、"配置"
- 技术术语（DDE, iSula, A-Tune 等）

**示例用户问题：**

- "搜索 iSula 相关的文档"
- "查找 DDE 桌面环境的介绍"
- "如何配置防火墙？"
- "openEuler 的安全特性有哪些？"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词 |
| `version` | string | 是 | 文档版本 |
| `lang` | string | 否 | 语言：zh/en |

---

### 工具 9: `get_meeting_info` - 社区会议查询

**何时使用：**

- 用户查询社区会议安排
- 用户查看 SIG 会议记录
- 用户了解某天的会议

**触发关键词：**

- "会议"、"会议安排"
- "会议记录"、"纪要"
- "SIG 会议"
- 日期（今天、明天、具体日期）

**示例用户问题：**

- "查询今天的会议安排"
- "查看 Kernel SIG 的会议记录"
- "明天有什么会议？"
- "2024-03-15 的会议有哪些？"

**参数说明：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：date/sig |
| `date` | string | date必需 | 查询日期 |
| `sig_name` | string | sig必需 | SIG 名称 |

---

### 工具 10: `get_showcase_info` - 用户案例查询

**何时使用：**
- 用户查询 openEuler 应用案例
- 用户了解某行业的企业使用情况
- 用户搜索特定企业的案例

**触发关键词：**
- "用户案例"、"案例"
- "应用实践"、"成功案例"
- 行业名称（金融、电信、政务等）
- 企业名称

**示例用户问题：**
- "查询金融行业的用户案例"
- "查看 openEuler 的成功案例"
- "某某企业是怎么用 openEuler 的？"
- "电信行业有哪些应用实践？"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 搜索关键词/企业名 |
| `lang` | string | 否 | 语言：zh/en |
| `industry` | string | 否 | 行业分类 |

---

### 工具 11: `get_oeep_info` - 演进提案查询

**何时使用：**
- 用户查询 oEEP 演进提案
- 用户了解社区演进提案详情
- 用户按关键词/作者搜索提案

**触发关键词：**
- "oEEP"、"演进提案"
- "提案"、"流程改进"
- 提案编号

**示例用户问题：**
- "查询 oEEP 列表"
- "查看 oEEP 001 的详情"
- "搜索与安全相关的提案"
- "某某作者提出的 oEEP"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：list/detail |
| `number` | string | detail必需 | 提案编号 |
| `keyword` | string | 否 | 搜索关键词 |

---

### 工具 12: `get_security_notice_info` - 安全公告查询

**何时使用：**
- 用户查询最新安全公告
- 用户了解安全公告详情
- 用户按组件搜索安全公告

**触发关键词：**
- "安全公告"、"SA"
- "安全更新"、"安全修复"
- 公告编号

**示例用户问题：**
- "查询最新的安全公告"
- "查看 SA-2024-001 的详情"
- "搜索 kernel 相关的安全公告"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：list/detail |
| `keyword` | string | 否 | 搜索关键词 |
| `security_notice_no` | string | detail必需 | 公告编号 |

---

### 工具 13: `get_bug_notice_info` - 缺陷公告查询

**何时使用：**
- 用户查询缺陷公告列表
- 用户了解缺陷修复详情
- 用户按组件搜索缺陷

**触发关键词：**
- "缺陷公告"、"BUG"
- "缺陷修复"、"问题修复"
- 公告编号

**示例用户问题：**
- "查询最新的缺陷公告"
- "查看缺陷公告详情"
- "搜索 nginx 相关的缺陷"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：list/detail |
| `keyword` | string | 否 | 搜索关键词 |
| `security_notice_no` | string | detail必需 | 公告编号 |

---

### 工具 14: `get_search_info` - 门户全站搜索

**何时使用：**
- 其他工具未找到结果时的兜底查询
- 用户搜索博客、Issue、代码仓库等
- 用户进行跨类型搜索

**触发关键词：**
- "搜索"、"查找"
- 任意关键词（当其他工具不匹配时）

**示例用户问题：**
- "搜索 openEuler 相关的所有内容"
- "查找关于安全的信息"
- "搜索博客文章"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词 |
| `lang` | string | 否 | 语言：zh/en |

---

### 工具 15: `execute_user_operation` - 用户操作执行

**何时使用：**
- 用户查询 CLA 签署状态
- 用户查询参与的 SIG 组
- 用户管理会议（创建/取消/查询）
- **需要配置 OPENEULER_TOKEN**

**触发关键词：**
- "CLA"、"签署状态"
- "我的 SIG"、"参与的组"
- "创建会议"、"取消会议"
- "我的会议"

**示例用户问题：**
- "查询我的 CLA 签署状态"
- "查看我参与了哪些 SIG 组"
- "创建一个会议"
- "取消会议 ID 123"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `operation_type` | string | 是 | 操作类型：check_cla/check_group/manage_meeting |
| 其他参数 | - | 根据操作类型 | 会议管理需要多个参数 |

---

### 工具 16: `get_forum_info` - 论坛信息查询

**何时使用：**
- 用户查询论坛帖子
- 用户查看热门讨论
- 用户搜索论坛内容

**触发关键词：**
- "论坛"、"帖子"
- "讨论"、"话题"
- "热门帖子"
- 帖子 ID

**示例用户问题：**
- "查询论坛最新帖子"
- "查看热门讨论"
- "搜索论坛关于 kernel 的讨论"
- "查看帖子 197 的详情"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `query_type` | string | 否 | 查询类型：latest/popular/search/detail |
| `keyword` | string | search必需 | 搜索关键词 |
| `topic_id` | string | detail必需 | 帖子 ID |

---

### 工具 17: `get_development_info` - 用户开发活动查询（Gitcode）

**何时使用：**
- 用户查询 Gitcode 用户开发活动
- 用户查看相关 Issue/PR
- 用户查看 PR 文件变更
- 用户发表 PR 评论
- **需要配置 GITCODE_TOKEN**

**触发关键词：**
- "开发活动"、"Gitcode 活动"
- "我的 Issue"、"我的 PR"
- "PR 文件变更"、"diff"
- "评论 PR"、"评审 PR"
- Gitcode 用户名

**查询类型：**
- `events`：用户开发活动（默认）
- `issues`：与用户相关的 Issue
- `pulls`：与用户相关的 PR
- `files`：PR 文件变更详情
- `comment`：发表 PR 评论

**示例用户问题：**
- "查询 Gitcode 用户 persimmonzzz 的开发活动"
- "查看与我相关的 Issue"
- "查询我创建的 Pull Request"
- "查看需要我评审的 PR"
- "查看 openeuler/kernel PR #123 的文件变更"
- "在 openeuler/kernel PR #123 发表评论：代码很棒"
- "对 PR #123 的 src/main.c 第 50 行发表评论"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `gitcode_id` | string | events必需 | Gitcode 用户 ID |
| `query_type` | string | 否 | 查询类型：events/issues/pulls/files/comment |
| `pr_scope` | string | pulls可选 | PR 筛选：created_by_me/assigned_to_me/need_my_review |
| `owner` | string | files/comment必需 | 仓库所有者 |
| `repo` | string | files/comment必需 | 仓库名 |
| `number` | number | files/comment必需 | PR 编号 |
| `comment_body` | string | comment必需 | 评论内容 |
| `comment_path` | string | comment可选 | 文件路径 |
| `comment_position` | number | comment可选 | 代码行数 |

---

### 工具 18: `execute_forum_operation` - 论坛用户操作执行

**何时使用：**
- 用户在论坛帖子中发表评论
- 用户参与社区讨论
- **需要配置 FORUM_TOKEN**

**触发关键词：**
- "发表评论"、"回复帖子"
- "参与讨论"

**示例用户问题：**
- "在帖子 197 中发表评论：感谢分享"
- "回复帖子..."

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `operation_type` | string | 是 | 操作类型：validate_token/comment |
| `topic_id` | string | comment必需 | 帖子 ID |
| `raw` | string | comment必需 | 评论内容 |

---

### 工具 19: `get_issue_info` - 社区 Issue 查询

**何时使用：**
- 用户查询 openEuler 社区 Issue 列表
- 用户按状态/创建者/仓库筛选 Issue
- 用户模糊搜索 Issue

**触发关键词：**
- "Issue"、"问题"
- "社区 Issue"
- 状态（进行中、已完成）
- Issue 编号

**示例用户问题：**
- "查询社区最新的 Issue"
- "查看进行中的 Issue"
- "搜索某某用户创建的 Issue"
- "查看 src-openeuler/kernel 仓库的 Issue"
- "搜索标题包含 'bug' 的 Issue"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `issue_state` | string | 否 | 状态：进行中/已完成/新建/待办 |
| `author` | string | 否 | 创建者 |
| `repo` | string | 否 | 仓库名 |
| `search` | string | 否 | 搜索关键词 |

---

### 工具 20: `get_pull_request_info` - 社区 PR 查询

**何时使用：**
- 用户查询 openEuler 社区 PR 列表
- 用户按状态/提交者/仓库筛选 PR
- 用户模糊搜索 PR

**触发关键词：**
- "PR"、"Pull Request"
- "合并请求"、"MR"
- 状态（open、merged、closed）
- PR 编号

**示例用户问题：**
- "查询社区最新的 PR"
- "查看已合并的 PR"
- "搜索某某用户提交的 PR"
- "查看 src-openeuler/kernel 仓库的 PR"
- "搜索标题包含 'fix' 的 PR"

**参数说明：**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `state` | string | 否 | 状态：open/closed/merged |
| `author` | string | 否 | 提交者 |
| `repo` | string | 否 | 仓库名 |
| `search` | string | 否 | 搜索关键词 |

---

## 工具选择流程图

```
用户提问
    │
    ▼
┌─────────────────────────────────────────────┐
│ 1. 检查是否需要 Token                        │
│    - execute_user_operation → OPENEULER_TOKEN │
│    - get_development_info → GITCODE_TOKEN    │
│    - execute_forum_operation → FORUM_TOKEN   │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 2. 关键词匹配                                │
│    - SIG → get_sig_info                     │
│    - CVE → get_cve_info                     │
│    - 下载/镜像 → get_download_info           │
│    - 组织/委员会 → get_organization_info     │
│    - 软件包 → get_package_info               │
│    - 兼容性 → get_compatibility_info         │
│    - 文档 → get_docs_version/search          │
│    - 会议 → get_meeting_info                 │
│    - 案例 → get_showcase_info                │
│    - oEEP → get_oeep_info                    │
│    - 安全公告 → get_security_notice_info     │
│    - 缺陷 → get_bug_notice_info              │
│    - 论坛 → get_forum_info                   │
│    - 开发活动/Gitcode → get_development_info │
│    - Issue → get_issue_info / get_development_info │
│    - PR → get_pull_request_info / get_development_info │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ 3. 兜底搜索                                  │
│    其他工具未匹配 → get_search_info           │
└─────────────────────────────────────────────┘
```

---

## 工具冲突处理

### Issue 查询冲突

| 场景 | 推荐工具 | 说明 |
|------|----------|------|
| 查询社区 Issue 列表 | `get_issue_info` | 不需要 Token，查询公开 Issue |
| 查询与我相关的 Issue | `get_development_info` | 需要 GITCODE_TOKEN，查询个人 Issue |

### PR 查询冲突

| 场景 | 推荐工具 | 说明 |
|------|----------|------|
| 查询社区 PR 列表 | `get_pull_request_info` | 不需要 Token，查询公开 PR |
| 查询与我相关的 PR | `get_development_info` | 需要 GITCODE_TOKEN，查询个人 PR |
| 查看 PR 文件变更 | `get_development_info` | files 模式 |
| 评论 PR | `get_development_info` | comment 模式 |

### 搜索冲突

| 场景 | 推荐工具 | 说明 |
|------|----------|------|
| 搜索技术文档 | `get_docs_search_content` | 需要版本参数 |
| 搜索论坛帖子 | `get_forum_info` | search 模式 |
| 全站搜索 | `get_search_info` | 兜底工具 |

---

## 测试场景

### 场景 1：SIG 查询
**用户问题：** "Kernel SIG 的维护者是谁？"
**期望工具：** `get_sig_info`
**参数：** `sig_name: "Kernel", query_type: "sig"`

### 场景 2：CVE 查询
**用户问题：** "CVE-2024-1234 的详情"
**期望工具：** `get_cve_info`
**参数：** `query_type: "detail", cve_id: "CVE-2024-1234"`

### 场景 3：下载查询
**用户问题：** "下载 openEuler 22.03 LTS"
**期望工具：** `get_download_info`
**参数：** `query: "22.03 LTS"`

### 场景 4：文档搜索
**用户问题：** "搜索 iSula 相关文档（版本 22.03）"
**期望工具：** `get_docs_search_content`
**参数：** `keyword: "iSula", version: "22.03"`

### 场景 5：会议查询
**用户问题：** "查询今天 Kernel SIG 的会议"
**期望工具：** `get_meeting_info`
**参数：** `query_type: "sig", sig_name: "Kernel"`

### 场景 6：个人开发活动
**用户问题：** "查看我创建的 PR"
**期望工具：** `get_development_info`
**参数：** `query_type: "pulls", pr_scope: "created_by_me"`
**注意：** 需要 GITCODE_TOKEN

### 场景 7：PR 文件变更
**用户问题：** "查看 openeuler/kernel PR #123 的文件变更"
**期望工具：** `get_development_info`
**参数：** `query_type: "files", owner: "openeuler", repo: "kernel", number: 123`

### 场景 8：PR 评论
**用户问题：** "在 openeuler/kernel PR #123 发表评论：代码很好"
**期望工具：** `get_development_info`
**参数：** `query_type: "comment", owner: "openeuler", repo: "kernel", number: 123, comment_body: "代码很好"`

### 场景 9：社区 Issue
**用户问题：** "查询进行中的社区 Issue"
**期望工具：** `get_issue_info`
**参数：** `issue_state: "进行中"`

### 场景 10：论坛帖子
**用户问题：** "查看论坛热门帖子"
**期望工具：** `get_forum_info`
**参数：** `query_type: "popular"`

---

## 工具描述优化原则

### ✅ 好的描述

```javascript
{
  name: "get_sig_info",
  description: `查询 openEuler 特别兴趣小组（SIG）的详细信息，支持成员贡献统计查询和 SIG 名称模糊推荐。

SIG（Special Interest Group）是 openEuler 社区中负责特定技术领域的工作组。

**何时使用：**
- 用户询问某个 SIG 的信息、维护者、仓库等
- 用户想查看某个 SIG 的成员贡献排行（PR/Issue/评审）
- 用户提到的 SIG 名称不确定（系统自动从 SIG 列表中推荐相近名称）

**示例问题：**
- "Kernel SIG 的信息是什么？"
- "查看 Kernel SIG 最近一个月的 PR 贡献排行"

**返回信息包括：**
- SIG 基本信息
- Maintainers 列表
- 代码仓库列表`,
}
```

### ❌ 不好的描述

```javascript
{
  name: "get_sig_info",
  description: "获取 SIG 信息",  // 太简短，缺少上下文
}
```

---

## 调试技巧

如果 Agent 选择了错误的工具：

1. **检查描述**：描述是否清晰地说明了工具的用途？
2. **添加场景**：在描述中添加更多使用场景
3. **提供示例**：添加具体的输入输出示例
4. **区分工具**：确保不同工具的描述有明显区别
5. **测试提示词**：尝试不同的用户问题，看 Agent 的选择是否合理

---

## 提示

1. **描述要详细**：Agent 只能通过描述来理解工具，描述越详细越好
2. **提供示例**：具体的示例帮助 Agent 理解如何使用
3. **说明场景**：明确列出使用场景，帮助 Agent 判断
4. **参数说明**：参数描述中包含示例值
5. **使用 Markdown**：描述支持 Markdown 格式，可以使用列表、加粗等
6. **注意 Token**：标记哪些工具需要 Token 配置
7. **处理冲突**：对于功能相近的工具，明确说明使用场景差异