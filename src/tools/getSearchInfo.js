// 数据源 URL
const SEARCH_URL = "https://www.openeuler.openatom.cn/api-search/search/docsng";
const PORTAL_BASE_URL = "https://www.openeuler.openatom.cn";

// 固定参数
const PAGE = 1;
const PAGE_SIZE = 12;

// 缓存配置
const searchCache = new Map(); // key: `${keyword}__${lang}`
const CACHE_DURATION = 15 * 60 * 1000; // 15分钟

// 结果类型标签
const TYPE_LABELS = {
  blog: "博客文章",
  issue: "Issue",
  gitcode: "代码仓库",
  etherpad: "会议文档",
  sig: "SIG 组",
  docs: "文档",
  news: "新闻",
};

// 提取第一个完整 JSON 对象（API 有时会返回拼接的多个 JSON）
function extractFirstJson(text) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { if (inString) escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === "{" || char === "[") depth++;
      else if (char === "}" || char === "]") {
        if (--depth === 0) return text.substring(0, i + 1);
      }
    }
  }
  return text;
}

// 清理 HTML 标签（包括高亮 span）
function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

// 构建结果项的访问链接
function buildUrl(record) {
  if (!record.path) return null;
  if (record.path.startsWith("http")) return record.path;
  // 相对路径：拼接门户基础 URL
  const path = record.path.startsWith("/") ? record.path : `/${record.path}`;
  return `${PORTAL_BASE_URL}${path}`;
}

// 搜索门户内容（带缓存）
async function fetchSearchResults(keyword, lang) {
  const cacheKey = `${keyword.toLowerCase()}__${lang}`;
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached && now < cached.expiry) return cached.data;

  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, page: PAGE, pageSize: PAGE_SIZE, lang }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败：HTTP ${response.status}`);
  }

  const text = await response.text();
  const data = JSON.parse(extractFirstJson(text));

  if (data.status !== 200 || !data.obj) {
    return { records: [] };
  }

  const result = { records: Array.isArray(data.obj.records) ? data.obj.records : [] };
  searchCache.set(cacheKey, { data: result, expiry: now + CACHE_DURATION });
  return result;
}

// 主查询函数
export async function getSearchInfo(keyword = "", lang = "zh") {
  try {
    if (!keyword || !keyword.trim()) {
      return "请提供搜索关键词。";
    }

    const result = await fetchSearchResults(keyword.trim(), lang);
    const records = result.records;
    const langLabel = lang === "en" ? "英文" : "中文";

    if (records.length === 0) {
      let output = `=== openEuler 门户搜索 ===\n\n`;
      output += `关键词：${keyword}（${langLabel}）\n\n`;
      output += `未在 openEuler 门户中找到与 "${keyword}" 相关的内容。\n`;
      output += `\n💡 提示：可以尝试更换关键词，或使用以下专项工具：\n`;
      output += `   - get_docs_search_content：搜索 openEuler 技术文档\n`;
      output += `   - get_cve_info：查询安全漏洞信息\n`;
      output += `   - get_sig_info：查询 SIG 组信息\n`;
      return output;
    }

    let output = `=== openEuler 门户搜索结果 ===\n\n`;
    output += `关键词：${keyword}（${langLabel}）\n`;
    output += `共返回 ${records.length} 条结果\n\n`;
    output += `---\n\n`;

    records.forEach((record, i) => {
      const title = stripHtml(record.title) || "（无标题）";
      const typeLabel = TYPE_LABELS[record.type] || record.type || "内容";
      const url = buildUrl(record);
      const tags = record.tags && record.tags.length > 0 ? record.tags.join("、") : null;

      output += `**${i + 1}. ${title}**\n`;
      output += `   类型：${typeLabel}\n`;

      if (record.textContent) {
        const excerpt = stripHtml(record.textContent);
        const trimmed = excerpt.length > 120 ? excerpt.substring(0, 120) + "..." : excerpt;
        output += `   摘要：${trimmed}\n`;
      }

      if (record.date) output += `   日期：${record.date}\n`;
      if (tags) output += `   标签：${tags}\n`;
      if (record.author && record.author.length > 0) {
        output += `   作者：${record.author.join("、")}\n`;
      }
      if (url) output += `   链接：${url}\n`;

      output += "\n";
    });

    output += `---\n`;
    output += `数据来源: openEuler 门户全站搜索\n`;
    output += `查询时间: ${new Date().toLocaleString("zh-CN")}\n`;

    return output;
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return `门户搜索时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "get_search_info",
  description: `搜索 openEuler 门户网站全站内容（博客、Issue、代码仓库、会议文档、SIG 页面等）。

**⚠️ 重要提示：**
这是 openEuler 相关问题的**兜底搜索工具**。只要用户问题涉及 openEuler，且其他专项工具（CVE、SIG、安全公告等）不适用或未找到结果，就应该使用本工具进行全站搜索。

**为什么这是必选工具？**
- 覆盖范围最广：博客文章、技术分享、Issue 讨论、代码仓库、会议记录、SIG 组页面
- 场景最全面：迁移经验、故障排查案例、技术讨论、项目动态、社区活动
- 信息最鲜活：包含社区用户分享的实战经验、问题讨论、最佳实践

**适用场景（只要涉及 openEuler 就能用）：**
- 迁移场景：CentOS 迁移经验分享、x2openEuler 使用讨论、迁移遇到的问题案例
- 故障排查：安装失败案例、配置错误讨论、运行异常问题、报错解决方案分享
- 技术讨论：性能优化经验、安全加固实践、网络配置技巧、存储管理心得
- 项目动态：开源项目更新、新特性发布、工具改进、版本变化
- 社区活动：会议讨论、技术分享会、用户案例、SIG 组动态
- 经验分享：最佳实践、踩坑经历、解决方案、配置技巧
- 问题求助：社区 Issue 讨论、技术问答、疑难问题求助帖

**关键词示例（建议参考）：**
- 迁移类：CentOS 迁移、x2openEuler、升级迁移、迁移经验、迁移问题
- 故障类：安装失败、启动异常、配置报错、运行错误、故障案例
- 工具类：x2openEuler 问题、迁移工具使用、工具报错、工具安装失败
- 配置类：网络配置、防火墙设置、存储配置、SELinux 问题
- 性能类：性能优化、性能问题、调优经验、性能测试
- 项目类：项目名称、工具名称、开源项目、社区项目
- 场景类：内网部署、离线安装、特殊环境、实战案例

**不推荐使用本工具的场景（优先使用专项工具）：**
- 查询 CVE 漏洞详情 → 使用 get_cve_info
- 查询 SIG 详细信息（维护者、仓库） → 使用 get_sig_info
- 查询安全公告详情 → 使用 get_security_notice_info
- 查询缺陷公告详情 → 使用 get_bug_notice_info
- 搜索技术文档（含版本） → 使用 get_docs_search_content
- 查询软件包详情 → 使用 get_package_info
- 查询下载镜像 → 使用 get_download_info

**返回信息：**
- 搜索结果列表（最多 12 条）
- 每条结果的类型（博客文章/Issue/代码仓库/SIG 组/会议文档等）
- 标题、内容摘要（最多 120 字符）、日期、标签、作者
- 结果访问链接

**参数说明：**
- keyword: 搜索关键词（必填），支持中英文，可包含工具名、技术术语、问题描述等
- lang: 搜索语言，根据用户提问语言选择；zh（中文，默认）或 en（英文）

**示例问题（强烈建议参考）：**
- "有人遇到过 x2openEuler 安装失败的问题吗？"
- "CentOS 迁移到 openEuler 的经验分享"
- "内网环境部署 openEuler 的案例"
- "openEuler 安装后无法启动的解决方案"
- "有人分享过防火墙配置的最佳实践吗？"
- "Docker 在 openEuler 上运行遇到问题怎么办？"
- "openEuler 性能调优的经验分享"
- "社区有关于 eBPF 的讨论吗？"
- "openEuler 和 RISC-V 相关的内容有哪些？"
- "查找 openEuler 在金融行业的应用案例"`,
  inputSchema: {
    type: "object",
    required: ["keyword"],
    properties: {
      keyword: {
        type: "string",
        description: "搜索关键词（必填）。可以是工具名称（如 'x2openEuler'）、技术术语（如 'eBPF'）、问题描述（如 '安装失败'）、经验分享（如 '迁移经验'）、项目名称等。支持中英文。",
      },
      lang: {
        type: "string",
        enum: ["zh", "en"],
        description: "搜索语言：zh（中文，默认）或 en（英文）。根据用户提问所用语言自动选择。",
        default: "zh",
      },
    },
  },
};
