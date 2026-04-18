import { addIndentedFields, truncate, stripHtml } from "../utils/formatHelpers.js";

const BASE_URL = "https://quickissue.openeuler.openatom.cn/api-issues/pulls/";

let cachedData = null;
let cacheExpiry = 0;
let cacheKey = "";
const CACHE_DURATION = 15 * 60 * 1000;

const VALID_STATES = ["open", "closed", "merged"];

function validateState(state) {
  if (!state) return null;
  if (VALID_STATES.includes(state.toLowerCase())) return state.toLowerCase();
  return null;
}

function buildCacheKey(params) {
  return JSON.stringify(params);
}

async function fetchPullRequests(params) {
  const key = buildCacheKey(params);
  const now = Date.now();

  if (cachedData && cacheKey === key && now < cacheExpiry) {
    return cachedData;
  }

  const queryParams = new URLSearchParams();
  queryParams.set("per_page", "20");
  queryParams.set("sort", "created_at");
  queryParams.set("direction", "desc");

  if (params.page) queryParams.set("page", params.page);
  if (params.state) queryParams.set("state", params.state);
  if (params.author) queryParams.set("author", params.author);
  if (params.repo) queryParams.set("repo", params.repo);
  if (params.search) queryParams.set("search", params.search);

  const url = BASE_URL + "?" + queryParams.toString();

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error("API 请求失败：HTTP " + response.status);
  }

  const data = await response.json();

  cachedData = data;
  cacheKey = key;
  cacheExpiry = now + CACHE_DURATION;

  return data;
}

function formatPullRequestList(data, params) {
  if (!data || !data.data || data.data.length === 0) {
    let noDataMsg = "=== openEuler 社区 PR 查询结果 ===\n\n";
    noDataMsg += "暂无符合条件的 Pull Request。\n\n";
    if (params.state) noDataMsg += "筛选条件：状态 = " + params.state + "\n";
    if (params.author) noDataMsg += "筛选条件：提交者 = " + params.author + "\n";
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
  output += "║  openEuler 社区 Pull Request 查询结果                          ║\n";
  output += "╚════════════════════════════════════════════════════════════╝\n";

  output += "\n共找到 " + total + " 条 Pull Request，当前显示第 " + page + " 页（" + displayCount + " 条）\n";

  if (params.state) output += "筛选状态：" + params.state + "\n";
  if (params.author) output += "提交者：" + params.author + "\n";
  if (params.repo) output += "仓库：" + params.repo + "\n";
  if (params.search) output += "搜索关键词：" + params.search + "\n";

  output += "\n" + "─".repeat(60) + "\n";

  data.data.forEach((pr, i) => {
    const num = (page - 1) * perPage + i + 1;
    output += "\n【PR " + num + "】\n";

    output = addIndentedFields(output, pr, [
      { field: "title", label: "标题", formatter: v => truncate(stripHtml(v), 100) },
      { field: "state", label: "状态" },
      { field: "repo", label: "仓库" },
      { field: "ref", label: "目标分支" },
      { field: "sig", label: "所属 SIG" },
      { field: "author", label: "提交者" },
      { field: "assignees", label: "审核人" },
      { field: "draft", label: "草稿", formatter: v => v ? "是" : "否" },
      { field: "mergeable", label: "可合并", formatter: v => v ? "是" : "否" },
      { field: "created_at", label: "创建时间" },
      { field: "updated_at", label: "更新时间" },
    ], 2);

    if (pr.labels) {
      output += "  标签: " + stripHtml(pr.labels) + "\n";
    }

    if (pr.link) {
      output += "  链接: " + pr.link + "\n";
    }

    if (pr.org) {
      output += "  组织: " + pr.org + "\n";
    }
  });

  output += "\n" + "─".repeat(60) + "\n";
  output += "\n💡 提示：\n";
  output += "   - 使用 page 参数翻页查看更多结果\n";
  output += "   - 使用 state 参数筛选 PR 状态（open/closed/merged）\n";
  output += "   - 使用 author 参数查询某用户提交的 PR\n";
  output += "   - 使用 repo 参数查询特定仓库的 PR\n";
  output += "   - 使用 search 参数按 SIG/仓库/标题模糊搜索\n";
  output += "\n数据来源: openEuler QuickIssue 平台\n";
  output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
  output += "━".repeat(60) + "\n";

  return output;
}

export async function getPullRequestInfo(params = {}) {
  try {
    const validatedState = validateState(params.state);

    const queryParams = {
      page: params.page || 1,
      state: validatedState,
      author: params.author || null,
      repo: params.repo || null,
      search: params.search || null,
    };

    const data = await fetchPullRequests(queryParams);
    return formatPullRequestList(data, queryParams);
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "查询 Pull Request 时发生错误：" + e.message;
  }
}

export const toolDefinition = {
  name: "get_pull_request_info",
  description: `查询 openEuler 社区 Pull Request (PR) 信息，支持多种筛选条件和模糊搜索。

**何时使用：**
- 用户想查询 openEuler 社区的 Pull Request 列表
- 用户想查询某个用户提交的 PR
- 用户想查询某个仓库的 PR
- 用户想查询特定状态的 PR（open/closed/merged）
- 用户想通过 SIG、仓库、标题进行模糊搜索
- 用户想了解社区代码合并情况

**参数说明：**
- page (number, 可选): 翻页页码，默认为 1。每页固定显示 20 条记录。
- state (string, 可选): PR 状态筛选，支持以下值：
  - open: 开放的 PR
  - closed: 已关闭的 PR
  - merged: 已合并的 PR
- author (string, 可选): PR 提交者 GitCode ID，查询某用户提交的 PR
- repo (string, 可选): 仓库名称，查询特定仓库的 PR
- search (string, 可选): 搜索关键词，支持按 SIG、仓库、标题进行模糊匹配

**返回信息：**
- PR 标题、状态（open/closed/merged）
- 所属仓库、目标分支
- 所属 SIG、组织
- 提交者、审核人列表
- 是否草稿、是否可合并
- 标签列表
- 创建时间、更新时间
- PR 链接（AtomGit）

**特性：**
- 15 分钟缓存：减少重复 API 调用
- 每页 20 条：兼顾性能和消耗
- 按创建时间倒序排序：默认展示最新 PR
- 多条件组合筛选：支持状态、提交者、仓库组合查询

**示例问题：**
- "查询 openEuler 社区最近的 Pull Request"
- "查询 kernel 仓库的 PR"
- "查询用户 gzbang 提交的 PR"
- "查询状态为 merged 的 PR"
- "搜索 SIG 为 bigdata 的 PR"
- "查询 openeuler/portal 仓库的开放 PR"
- "查询第二页的 PR 列表"`,
  inputSchema: {
    type: "object",
    properties: {
      page: {
        type: "number",
        description: "翻页页码，默认为 1。每页固定显示 20 条记录。",
        default: 1,
      },
      state: {
        type: "string",
        description: "PR 状态筛选，支持：open（开放）、closed（已关闭）、merged（已合并）。",
        enum: VALID_STATES,
      },
      author: {
        type: "string",
        description: "PR 提交者 GitCode ID，查询某用户提交的 PR。",
      },
      repo: {
        type: "string",
        description: "仓库名称，查询特定仓库的 PR。",
      },
      search: {
        type: "string",
        description: "搜索关键词，支持按 SIG、仓库、标题进行模糊匹配查询。",
      },
    },
  },
};