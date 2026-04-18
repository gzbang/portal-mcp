import { addField, addFields, addIndentedField, addIndentedFields, truncate, stripHtml } from "../utils/formatHelpers.js";

const BASE_URL = "https://quickissue.openeuler.openatom.cn/api-issues/issues/";

let cachedData = null;
let cacheExpiry = 0;
let cacheKey = "";
const CACHE_DURATION = 15 * 60 * 1000;

const ISSUE_STATE_LABELS = {
  "待办的": "待办的",
  "进行中": "进行中",
  "已完成": "已完成",
  "已拒绝": "已拒绝",
  "已确认": "已确认",
  "设计中": "设计中",
  "开发中": "开发中",
  "已验证": "已验证",
  "修复中": "修复中",
  "已取消": "已取消",
  "已挂起": "已挂起",
  "新建": "新建",
  "已接纳": "已接纳",
};

const VALID_STATES = Object.keys(ISSUE_STATE_LABELS);

function validateState(state) {
  if (!state) return null;
  if (VALID_STATES.includes(state)) return state;
  return null;
}

function buildCacheKey(params) {
  return JSON.stringify(params);
}

async function fetchIssues(params) {
  const key = buildCacheKey(params);
  const now = Date.now();

  if (cachedData && cacheKey === key && now < cacheExpiry) {
    return cachedData;
  }

  const queryParams = new URLSearchParams();
  queryParams.set("per_page", "20");
  queryParams.set("sort", "created_at");

  if (params.page) queryParams.set("page", params.page);
  if (params.issue_state) queryParams.set("issue_state", params.issue_state);
  if (params.author) queryParams.set("author", params.author);
  if (params.repo) queryParams.set("repo", params.repo);
  if (params.search) queryParams.set("search", params.search);

  const url = `${BASE_URL}?${queryParams.toString()}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败：HTTP ${response.status}`);
  }

  const data = await response.json();

  cachedData = data;
  cacheKey = key;
  cacheExpiry = now + CACHE_DURATION;

  return data;
}

function formatIssueList(data, params) {
  if (!data || !data.data || data.data.length === 0) {
    let noDataMsg = "=== openEuler 社区 Issue 查询结果 ===\n\n";
    noDataMsg += "暂无符合条件的 Issue。\n\n";
    if (params.issue_state) noDataMsg += "筛选条件：状态 = " + params.issue_state + "\n";
    if (params.author) noDataMsg += "筛选条件：创建者 = " + params.author + "\n";
    if (params.repo) noDataMsg += "筛选条件：仓库 = " + params.repo + "\n";
    if (params.search) noDataMsg += "搜索关键词：" + params.search + "\n";
    noDataMsg += "\n💡 提示：尝试调整查询条件或使用 search 参数进行模糊搜索。\n";
    return noDataMsg;
  }

  const total = data.total || data.data.length;
  const page = data.page || params.page || 1;
  const perPage = data.per_page || 20;
  const displayCount = data.data.length;

  let output = "\n╔════════════════════════════════════════════════════════════╗\n";
  output += "║  openEuler 社区 Issue 查询结果                                 ║\n";
  output += "╚════════════════════════════════════════════════════════════╝\n";

  output += "\n共找到 " + total + " 条 Issue，当前显示第 " + page + " 页（" + displayCount + " 条）\n";

  if (params.issue_state) output += "筛选状态：" + params.issue_state + "\n";
  if (params.author) output += "创建者：" + params.author + "\n";
  if (params.repo) output += "仓库：" + params.repo + "\n";
  if (params.search) output += "搜索关键词：" + params.search + "\n";

  output += "\n" + "─".repeat(60) + "\n";

  data.data.forEach((issue, i) => {
    const num = (page - 1) * perPage + i + 1;
    output += "\n【Issue " + num + "】\n";

    output = addIndentedFields(output, issue, [
      { field: 'number', label: 'Issue 编号' },
      { field: 'title', label: '标题', formatter: v => truncate(stripHtml(v), 100) },
      { field: 'state', label: '状态（open/closed）' },
      { field: 'issue_state', label: '处理状态' },
      { field: 'issue_type', label: '类型' },
      { field: 'repo', label: '仓库' },
      { field: 'sig', label: '所属 SIG' },
      { field: 'author', label: '创建者' },
      { field: 'assignee', label: '指派给' },
      { field: 'priority', label: '优先级' },
      { field: 'created_at', label: '创建时间' },
      { field: 'updated_at', label: '更新时间' },
    ], 2);

    if (issue.labels) {
      output += "  标签: " + stripHtml(issue.labels) + "\n";
    }

    if (issue.link) {
      output += "  链接: " + issue.link + "\n";
    }

    if (issue.org) {
      output += "  组织: " + issue.org + "\n";
    }
  });

  output += "\n" + "─".repeat(60) + "\n";
  output += "\n💡 提示：\n";
  output += "   - 使用 pag 参数翻页查看更多结果\n";
  output += "   - 使用 issue_state 参数筛选特定状态的 Issue\n";
  output += "   - 使用 author 参数查询某用户创建的 Issue\n";
  output += "   - 使用 repo 参数查询特定仓库的 Issue\n";
  output += "   - 使用 search 参数按 Issue ID/仓库/标题模糊搜索\n";
  output += "\n数据来源: openEuler QuickIssue 平台\n";
  output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
  output += "━".repeat(60) + "\n";

  return output;
}

export async function getIssueInfo(params = {}) {
  try {
    const validatedState = validateState(params.issue_state);

    const queryParams = {
      page: params.page || 1,
      issue_state: validatedState,
      author: params.author || null,
      repo: params.repo || null,
      search: params.search || null,
    };

    const data = await fetchIssues(queryParams);
    return formatIssueList(data, queryParams);
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return `查询 Issue 时发生错误：${e.message}`;
  }
}

export const toolDefinition = {
  name: "get_issue_info",
  description: `查询 openEuler 社区 Issue 信息，支持多种筛选条件和模糊搜索。

**何时使用：**
- 用户想查询 openEuler 社区的 Issue 列表
- 用户想查询某个用户创建的 Issue
- 用户想查询某个仓库的 Issue
- 用户想查询特定状态的 Issue（待办的、进行中、已完成等）
- 用户想通过 Issue ID、标题进行模糊搜索
- 用户想了解社区问题跟踪情况

**参数说明：**
- page (number, 可选): 翻页页码，默认为 1。每页固定显示 20 条记录。
- issue_state (string, 可选): Issue 状态筛选，支持以下中文状态：
  - 待办的、进行中、已完成、已拒绝、已确认
  - 设计中、开发中、已验证、修复中、已取消
  - 已挂起、新建、已接纳
- author (string, 可选): 创建者 GitCode ID，查询某用户创建的 Issue
- repo (string, 可选): 仓库名称，查询特定仓库的 Issue
- search (string, 可选): 搜索关键词，支持按 Issue ID、仓库、标题进行模糊匹配

**返回信息：**
- Issue 编号、标题、类型
- 状态（open/closed）、处理状态
- 所属仓库、所属 SIG、组织
- 创建者、指派人员
- 优先级、标签
- 创建时间、更新时间
- Issue 链接

**特性：**
- 15 分钟缓存：减少重复 API 调用
- 每页 20 条：兼顾性能和消耗
- 按创建时间排序：默认展示最新 Issue
- 多条件组合筛选：支持状态、创建者、仓库组合查询

**示例问题：**
- "查询 openEuler 社区最近的 Issue"
- "查询 kernel 仓库的 Issue"
- "查询用户 gzbang 创建的 Issue"
- "查询状态为进行中的 Issue"
- "搜索标题包含 docker 的 Issue"
- "查询 Issue 编号 1234 的信息"
- "查询 ai SIG 相关的 Issue"`,
  inputSchema: {
    type: "object",
    properties: {
      page: {
        type: "number",
        description: "翻页页码，默认为 1。每页固定显示 20 条记录。",
        default: 1,
      },
      issue_state: {
        type: "string",
        description: "Issue 状态筛选，支持中文状态值：待办的、进行中、已完成、已拒绝、已确认、设计中、开发中、已验证、修复中、已取消、已挂起、新建、已接纳。",
        enum: VALID_STATES,
      },
      author: {
        type: "string",
        description: "创建者 GitCode ID，查询某用户创建的 Issue。",
      },
      repo: {
        type: "string",
        description: "仓库名称，查询特定仓库的 Issue。",
      },
      search: {
        type: "string",
        description: "搜索关键词，支持按 Issue ID、仓库、标题进行模糊匹配查询。",
      },
    },
  },
};