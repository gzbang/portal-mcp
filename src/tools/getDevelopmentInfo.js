import { appendRecommendation } from "../utils/toolRecommendations.js";

const GITCODE_API_BASE_URL = "https://api.gitcode.com/api/v5";

const TOKEN_CONFIG_GUIDE = "\n⚠️ **未配置 GITCODE_TOKEN**\n\n请先配置您的 GITCODE_TOKEN 以使用此功能。\n\n💡 **如何配置：**\n1. 登录 [Gitcode 平台](https://gitcode.com/)\n2. 进入个人设置页面获取令牌\n3. 在 MCP Server 配置中添加环境变量：\n   GITCODE_TOKEN=your_token_here\n\n配置方式：\n- Claude Code: 在 ~/.claude.json 的 mcpServers 配置中添加 env 字段\n- Cursor: 在 MCP 配置中添加环境变量\n- 命令行: GITCODE_TOKEN=xxx npx openeuler-portal-mcp";

const TOKEN_INVALID_GUIDE = "\n⚠️ **Token 验证失败**\n\n您配置的 GITCODE_TOKEN 无效或已过期。\n\n💡 **如何获取 Token：**\n1. 登录 [Gitcode 平台](https://gitcode.com/)\n2. 进入个人设置页面\n3. 生成或复制您的个人令牌\n4. 将令牌配置到 MCP Server 的 GITCODE_TOKEN 环境变量中";

const ACTION_TYPE_LABELS = {
  1: "创建 MR",
  2: "更新 MR",
  3: "合并 MR",
  4: "关闭 MR",
  5: "代码推送",
  6: "评论",
  7: "创建 Issue",
  8: "更新 Issue",
  9: "关闭 Issue",
  10: "重新打开 Issue",
  11: "创建项目",
  12: "删除项目",
  13: "Fork 项目",
  14: "加入项目",
  15: "离开项目",
  16: "创建分支",
  17: "删除分支",
  18: "创建标签",
  19: "删除标签",
  20: "推送标签",
};

const PR_SCOPE_LABELS = {
  created_by_me: "我创建的",
  assigned_to_me: "分配给我的",
  need_my_review: "需要我评审的",
  need_my_approve: "需要我审批的",
};

function formatActionType(action, actionName) {
  if (ACTION_TYPE_LABELS[action]) {
    return ACTION_TYPE_LABELS[action];
  }
  return actionName || "未知操作";
}

function formatIssue(issue, index) {
  let output = (index + 1) + ". **" + (issue.title || "无标题") + "**\n";
  
  if (issue.project?.path_with_namespace || issue.project_name) {
    output += "   仓库: " + (issue.project?.path_with_namespace || issue.project_name) + "\n";
  }
  
  output += "   状态: " + (issue.state || "未知") + "\n";
  
  if (issue.iid || issue.number) {
    output += "   Issue 编号: #" + (issue.iid || issue.number) + "\n";
  }
  
  if (issue.author?.username || issue.author) {
    output += "   创建者: " + (issue.author?.username || issue.author) + "\n";
  }
  
  if (issue.assignees && issue.assignees.length > 0) {
    const assigneeNames = issue.assignees.map(a => a.username || a.name || a).join(", ");
    output += "   指派给: " + assigneeNames + "\n";
  }
  
  if (issue.created_at) {
    output += "   创建时间: " + new Date(issue.created_at).toLocaleString("zh-CN") + "\n";
  }
  
  if (issue.updated_at) {
    output += "   更新时间: " + new Date(issue.updated_at).toLocaleString("zh-CN") + "\n";
  }
  
  if (issue.web_url || issue.url) {
    output += "   链接: " + (issue.web_url || issue.url) + "\n";
  }
  
  if (issue.labels && issue.labels.length > 0) {
    output += "   标签: " + issue.labels.map(l => l.name || l).join(", ") + "\n";
  }
  
  return output;
}

function formatPullRequest(pr, index) {
  let output = (index + 1) + ". **" + (pr.title || "无标题") + "**\n";
  
  if (pr.base?.repo?.full_name || pr.project?.path_with_namespace) {
    output += "   仓库: " + (pr.base?.repo?.full_name || pr.project?.path_with_namespace) + "\n";
  }
  
  output += "   状态: " + (pr.state || "未知") + "\n";
  
  if (pr.iid || pr.number) {
    output += "   PR 编号: #" + (pr.iid || pr.number) + "\n";
  }
  
  if (pr.user?.login || pr.author?.username || pr.author) {
    output += "   提交者: " + (pr.user?.login || pr.author?.username || pr.author) + "\n";
  }
  
  if (pr.source_branch) {
    output += "   源分支: " + pr.source_branch + "\n";
  }
  
  if (pr.target_branch) {
    output += "   目标分支: " + pr.target_branch + "\n";
  }
  
  if (pr.assignees && pr.assignees.length > 0) {
    const assigneeNames = pr.assignees.map(a => a.login || a.name || a).join(", ");
    output += "   指派给: " + assigneeNames + "\n";
  }
  
  if (pr.draft !== undefined) {
    output += "   草稿: " + (pr.draft ? "是" : "否") + "\n";
  }
  
  if (pr.mergeable !== undefined) {
    output += "   可合并: " + (pr.mergeable ? "是" : "否") + "\n";
  }
  
  if (pr.added_lines !== undefined || pr.removed_lines !== undefined) {
    output += "   变更: +" + (pr.added_lines || 0) + " -" + (pr.removed_lines || 0) + "\n";
  }
  
  if (pr.notes !== undefined) {
    output += "   评论数: " + pr.notes + "\n";
  }
  
  if (pr.created_at) {
    output += "   创建时间: " + new Date(pr.created_at).toLocaleString("zh-CN") + "\n";
  }
  
  if (pr.updated_at) {
    output += "   更新时间: " + new Date(pr.updated_at).toLocaleString("zh-CN") + "\n";
  }
  
  if (pr.web_url || pr.html_url) {
    output += "   链接: " + (pr.web_url || pr.html_url) + "\n";
  }
  
  if (pr.labels && pr.labels.length > 0) {
    output += "   标签: " + pr.labels.map(l => l.name || l.title || l).join(", ") + "\n";
  }
  
  return output;
}

async function fetchUserEvents(gitcodeId, token) {
  const url = GITCODE_API_BASE_URL + "/users/" + gitcodeId + "/events?access_token=" + token;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: response.status, data: null, error: "token_invalid" };
  }
  
  if (response.status === 404) {
    return { status: response.status, data: null, error: "user_not_found" };
  }
  
  if (!response.ok) {
    return { status: response.status, data: null, error: "HTTP " + response.status };
  }
  
  const data = await response.json();
  return { status: response.status, data, error: null };
}

async function fetchUserIssues(token) {
  const url = GITCODE_API_BASE_URL + "/user/issues?access_token=" + token + "&state=all&per_page=20";
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: response.status, data: null, error: "token_invalid" };
  }
  
  if (!response.ok) {
    return { status: response.status, data: null, error: "HTTP " + response.status };
  }
  
  const data = await response.json();
  return { status: response.status, data, error: null };
}

async function fetchUserPullRequests(token, scope) {
  const params = new URLSearchParams();
  params.set("access_token", token);
  params.set("state", "all");
  params.set("per_page", "20");
  if (scope) params.set("scope", scope);
  
  const url = GITCODE_API_BASE_URL + "/user/pulls?" + params.toString();
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: response.status, data: null, error: "token_invalid" };
  }
  
  if (!response.ok) {
    return { status: response.status, data: null, error: "HTTP " + response.status };
  }
  
  const data = await response.json();
  return { status: response.status, data, error: null };
}

function flattenEvents(eventsData) {
  if (!eventsData || !eventsData.events) {
    return [];
  }
  
  const allEvents = [];
  const eventsByDate = eventsData.events;
  
  for (const date of Object.keys(eventsByDate).sort().reverse()) {
    const dateEvents = eventsByDate[date] || [];
    for (const event of dateEvents) {
      event.event_date = date;
      allEvents.push(event);
    }
  }
  
  return allEvents;
}

function formatEvent(event, index) {
  let output = (index + 1) + ". **" + formatActionType(event.action, event.action_name) + "**\n";
  
  if (event.project_name) {
    output += "   仓库: " + event.project_name + "\n";
  }
  
  if (event.created_at) {
    const date = new Date(event.created_at);
    output += "   时间: " + date.toLocaleString("zh-CN") + "\n";
  }
  
  if (event.author && event.author.username) {
    output += "   操作者: " + event.author.username + "\n";
  }
  
  if (event.target_type) {
    output += "   对象类型: " + (event.target_type === "MergeRequest" ? "合并请求" : event.target_type === "Issue" ? "问题" : event.target_type) + "\n";
  }
  
  if (event.target_title) {
    const title = event.target_title.length > 80 ? event.target_title.substring(0, 80) + "..." : event.target_title;
    output += "   标题: " + title + "\n";
  }
  
  if (event.target_iid) {
    const targetPrefix = event.target_type === "MergeRequest" ? "MR" : event.target_type === "Issue" ? "Issue" : "#";
    output += "   " + targetPrefix + "编号: " + event.target_iid + "\n";
  }
  
  if (event._links && event._links.action_type) {
    output += "   链接: " + event._links.action_type + "\n";
  }
  
  return output;
}

export async function getDevelopmentInfo(gitcodeId, queryType, prScope, owner, repo, number, commentBody, commentPath, commentPosition) {
  const token = process.env.GITCODE_TOKEN;
  
  if (!token) {
    return TOKEN_CONFIG_GUIDE;
  }
  
  if (queryType === "issues") {
    return handleIssuesQuery(token);
  }
  
  if (queryType === "pulls") {
    return handlePullRequestsQuery(token, prScope);
  }
  
  if (queryType === "files") {
    return handleFilesQuery(owner, repo, number, token);
  }
  
  if (queryType === "comment") {
    return handleCommentQuery(owner, repo, number, commentBody, commentPath, commentPosition, token);
  }
  
  return handleEventsQuery(gitcodeId, token);
}

async function handleIssuesQuery(token) {
  try {
    const result = await fetchUserIssues(token);
    
    if (result.error === "token_invalid") {
      return TOKEN_INVALID_GUIDE;
    }
    
    if (result.error) {
      return "\n❌ **查询失败**\n\n错误信息：" + result.error + "\n\n请稍后重试。";
    }
    
    const issues = result.data || [];
    
    if (!issues || issues.length === 0) {
      return "\n📋 **用户 Issue 查询结果**\n\n暂无与您相关的 Issue。\n\n💡 **提示：**\n- Issue 可能尚未创建\n- 您可能未被指派任何 Issue\n- 请检查您的 Token 权限\n";
    }
    
    const displayCount = Math.min(issues.length, 20);
    
    let output = "\n📋 **用户 Issue 查询结果**\n\n";
    output += "共找到 " + issues.length + " 条与您相关的 Issue";
    if (issues.length > displayCount) {
      output += "，显示前 " + displayCount + " 条";
    }
    output += "\n\n---\n\n";
    
    issues.slice(0, displayCount).forEach((issue, index) => {
      output += formatIssue(issue, index);
      output += "\n";
    });
    
    output += "---\n";
    output += "数据来源: Gitcode API\n";
    output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
    
    return output;
    
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "查询 Issue 时发生错误：" + e.message;
  }
}

async function handlePullRequestsQuery(token, scope) {
  try {
    const result = await fetchUserPullRequests(token, scope);
    
    if (result.error === "token_invalid") {
      return TOKEN_INVALID_GUIDE;
    }
    
    if (result.error) {
      return "\n❌ **查询失败**\n\n错误信息：" + result.error + "\n\n请稍后重试。";
    }
    
    const pulls = result.data || [];
    
    if (!pulls || pulls.length === 0) {
      let scopeLabel = scope ? PR_SCOPE_LABELS[scope] || scope : "全部";
      return "\n📋 **用户 Pull Request 查询结果**\n\n筛选条件：" + scopeLabel + "\n\n暂无符合条件的 Pull Request。\n\n💡 **提示：**\n- PR 可能尚未创建\n- 您可能未被分配相关 PR\n- 请检查您的 Token 权限\n";
    }
    
    const displayCount = Math.min(pulls.length, 20);
    const scopeLabel = scope ? PR_SCOPE_LABELS[scope] || scope : "全部";
    
    let output = "\n📋 **用户 Pull Request 查询结果**\n\n";
    output += "筛选条件：" + scopeLabel + "\n";
    output += "共找到 " + pulls.length + " 条 Pull Request";
    if (pulls.length > displayCount) {
      output += "，显示前 " + displayCount + " 条";
    }
    output += "\n\n---\n\n";
    
    pulls.slice(0, displayCount).forEach((pr, index) => {
      output += formatPullRequest(pr, index);
      output += "\n";
    });
    
    output += "---\n";
    output += "数据来源: Gitcode API\n";
    output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
    
    return output;
    
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "查询 Pull Request 时发生错误：" + e.message;
  }
}

async function handleEventsQuery(gitcodeId, token) {
  if (!gitcodeId || gitcodeId.trim() === "") {
    return "❌ **参数错误**\n\n缺少必需参数：gitcode_id（Gitcode 用户 ID）\n\n请提供 Gitcode 用户 ID，例如：\n- \"查询 Gitcode 用户 persimmonzzz 的开发情况\"\n- \"查看 Gitcode 用户 gzbang 最近的活动\"";
  }
  
  const cleanGitcodeId = gitcodeId.trim();
  
  try {
    const result = await fetchUserEvents(cleanGitcodeId, token);
    
    if (result.error === "token_invalid") {
      return TOKEN_INVALID_GUIDE;
    }
    
    if (result.error === "user_not_found") {
      return "\n❌ **用户不存在**\n\nGitcode 用户 \"" + cleanGitcodeId + "\" 不存在或无法访问。\n\n💡 **可能原因：**\n1. 用户 ID 输入错误，请检查拼写\n2. 用户账号已注销或被封禁\n3. 用户设置了隐私保护\n\n请确认用户 ID 是否正确。";
    }
    
    if (result.error) {
      return "\n❌ **查询失败**\n\n错误信息：" + result.error + "\n\n请稍后重试。";
    }
    
    const events = flattenEvents(result.data);
    
    if (!events || events.length === 0) {
      return "\n📋 **用户开发活动查询结果**\n\n查询用户：" + cleanGitcodeId + "\n\n暂无公开的开发活动记录。\n\n💡 **可能原因：**\n1. 用户刚注册，尚未开始开发活动\n2. 用户的活动设置为私密\n3. 用户仅参与私有仓库的开发\n";
    }
    
    const displayCount = Math.min(events.length, 20);
    
    let output = "\n📋 **用户开发活动查询结果**\n\n";
    output += "查询用户：" + cleanGitcodeId + "\n";
    output += "共找到 " + events.length + " 条活动记录";
    if (events.length > displayCount) {
      output += "，显示前 " + displayCount + " 条";
    }
    output += "\n\n---\n\n";
    
    events.slice(0, displayCount).forEach((event, index) => {
      output += formatEvent(event, index);
      output += "\n";
    });
    
    output += "---\n";
    output += "数据来源: Gitcode API\n";
    output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
    
    return appendRecommendation(output, "get_development_info", { keyword: cleanGitcodeId });
    
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "查询用户开发活动时发生错误：" + e.message;
  }
}

async function fetchPRFiles(owner, repo, number, token) {
  const url = GITCODE_API_BASE_URL + "/repos/" + owner + "/" + repo + "/pulls/" + number + "/files?access_token=" + token;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: response.status, data: null, error: "token_invalid" };
  }
  
  if (response.status === 404) {
    return { status: response.status, data: null, error: "pr_not_found" };
  }
  
  if (!response.ok) {
    return { status: response.status, data: null, error: "HTTP " + response.status };
  }
  
  const data = await response.json();
  return { status: response.status, data, error: null };
}

async function postPRComment(owner, repo, number, body, path, position, token) {
  const url = GITCODE_API_BASE_URL + "/repos/" + owner + "/" + repo + "/pulls/" + number + "/comments?access_token=" + token;
  
  const requestBody = { body };
  if (path) requestBody.path = path;
  if (position) requestBody.position = position;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });
  
  if (response.status === 401 || response.status === 403) {
    return { status: response.status, data: null, error: "token_invalid" };
  }
  
  if (response.status === 404) {
    return { status: response.status, data: null, error: "pr_not_found" };
  }
  
  if (!response.ok) {
    let errorMsg = "HTTP " + response.status;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMsg = errorData.message;
    } catch (e) {}
    return { status: response.status, data: null, error: errorMsg };
  }
  
  const data = await response.json();
  return { status: response.status, data, error: null };
}

function getFileStatus(file) {
  if (file.patch?.new_file) return "新增";
  if (file.patch?.deleted_file) return "删除";
  if (file.patch?.renamed_file) return "重命名";
  return "修改";
}

function formatDiff(diff, maxLines) {
  if (!diff) return "";
  const lines = diff.split("\n");
  const displayLines = Math.min(lines.length, maxLines);
  let formatted = lines.slice(0, displayLines).join("\n");
  if (lines.length > maxLines) {
    formatted += "\n... (共 " + lines.length + " 行，已截断)";
  }
  return formatted;
}

async function handleFilesQuery(owner, repo, number, token) {
  if (!owner || !repo || !number) {
    return "❌ **参数错误**\n\n缺少必需参数。\n\n请提供：\n- owner: 仓库所属空间地址（如 openeuler）\n- repo: 仓库路径（如 openEuler-portal）\n- number: PR 编号（如 3064）\n\n示例：\"查询 openeuler/openEuler-portal PR #3064 的文件变更\"";
  }
  
  try {
    const result = await fetchPRFiles(owner, repo, number, token);
    
    if (result.error === "token_invalid") {
      return TOKEN_INVALID_GUIDE;
    }
    
    if (result.error === "pr_not_found") {
      return "\n❌ **PR 不存在**\n\nPR #" + number + " 在仓库 " + owner + "/" + repo + " 中不存在或无法访问。\n\n请确认 PR 编号和仓库地址是否正确。";
    }
    
    if (result.error) {
      return "\n❌ **查询失败**\n\n错误信息：" + result.error + "\n\n请稍后重试。";
    }
    
    const files = result.data || [];
    
    if (!files || files.length === 0) {
      return "\n📋 **PR 文件变更查询结果**\n\n仓库: " + owner + "/" + repo + "\nPR 编号: #" + number + "\n\n该 PR 暂无文件变更记录。\n";
    }
    
    const displayCount = Math.min(files.length, 20);
    const totalAdditions = files.reduce((sum, f) => sum + (f.additions || f.patch?.added_lines || 0), 0);
    const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || f.patch?.removed_lines || 0), 0);
    
    let output = "\n╔════════════════════════════════════════════════════════════╗\n";
    output += "║  PR 文件变更详情                                              ║\n";
    output += "╚════════════════════════════════════════════════════════════╝\n";
    
    output += "\n仓库: " + owner + "/" + repo + "\n";
    output += "PR 编号: #" + number + "\n";
    
    if (files[0]?.source_branch) output += "源分支: " + files[0].source_branch + "\n";
    if (files[0]?.target_branch) output += "目标分支: " + files[0].target_branch + "\n";
    
    output += "共 " + files.length + " 个文件变更";
    if (files.length > displayCount) output += "，显示前 " + displayCount + " 个";
    output += "，总变更: +" + totalAdditions + " -" + totalDeletions + "\n";
    
    output += "\n" + "─".repeat(60) + "\n";
    
    files.slice(0, displayCount).forEach((file, index) => {
      const status = getFileStatus(file);
      const additions = file.additions || file.patch?.added_lines || 0;
      const deletions = file.deletions || file.patch?.removed_lines || 0;
      
      output += "\n【文件 " + (index + 1) + "】 " + status + "\n";
      output += "  文件名: " + file.filename + "\n";
      output += "  变更: +" + additions + " -" + deletions + " 行\n";
      
      if (file.sha) output += "  SHA: " + file.sha.substring(0, 12) + "...\n";
      if (file.blob_url) output += "  文件链接: " + file.blob_url + "\n";
      
      if (file.patch?.old_path && file.patch?.new_path && file.patch.old_path !== file.patch.new_path) {
        output += "  旧路径: " + file.patch.old_path + "\n";
        output += "  新路径: " + file.patch.new_path + "\n";
      }
      
      if (file.patch?.diff) {
        output += "\n  **代码差异:**\n";
        output += "  ┌────────────────────────────────────────\n";
        formatDiff(file.patch.diff, 30).split("\n").forEach(line => {
          output += "  │ " + line + "\n";
        });
        output += "  └────────────────────────────────────────\n";
      }
    });
    
    output += "\n" + "─".repeat(60) + "\n";
    output += "\n💡 提示：\n";
    output += "   - diff 内容已截断显示（最多30行），完整内容请访问 blob_url\n";
    output += "   - 使用 blob_url 查看文件完整内容\n";
    output += "\n🔍 **分析建议：**\n";
    output += "   如果您想深入了解这些改动，可以问我：\n";
    output += "   - \"帮我分析这个 PR 的改动内容\"\n";
    output += "   - \"这些文件变更解决了什么问题？\"\n";
    output += "   - \"总结一下这个 PR 的核心修改\"\n";
    output += "\n数据来源: Gitcode API\n";
    output += "查询时间: " + new Date().toLocaleString("zh-CN") + "\n";
    output += "━".repeat(60) + "\n";
    
    return output;
    
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "查询 PR 文件变更时发生错误：" + e.message;
  }
}

async function handleCommentQuery(owner, repo, number, body, path, position, token) {
  if (!owner || !repo || !number || !body) {
    return "❌ **参数错误**\n\n缺少必需参数。\n\n请提供：\n- owner: 仓库所属空间地址（如 openeuler）\n- repo: 仓库路径（如 openEuler-portal）\n- number: PR 编号（如 3064）\n- comment_body: 评论内容（必需）\n\n可选参数：\n- comment_path: 文件的相对路径（针对特定文件评论）\n- comment_position: 代码行数（针对特定行评论）\n\n示例：\"在 openeuler/openEuler-portal PR #3064 发表评论：代码看起来不错\"";
  }
  
  try {
    const result = await postPRComment(owner, repo, number, body, path, position, token);
    
    if (result.error === "token_invalid") {
      return TOKEN_INVALID_GUIDE;
    }
    
    if (result.error === "pr_not_found") {
      return "\n❌ **PR 不存在**\n\nPR #" + number + " 在仓库 " + owner + "/" + repo + " 中不存在或无法访问。\n\n请确认 PR 编号和仓库地址是否正确。";
    }
    
    if (result.error) {
      return "\n❌ **评论发布失败**\n\n错误信息：" + result.error + "\n\n请稍后重试。";
    }
    
    const comment = result.data;
    
    let output = "\n╔════════════════════════════════════════════════════════════╗\n";
    output += "║  PR 评论发布成功                                              ║\n";
    output += "╚════════════════════════════════════════════════════════════╝\n";
    
    output += "\n仓库: " + owner + "/" + repo + "\n";
    output += "PR 编号: #" + number + "\n";
    
    if (path) {
      output += "评论文件: " + path + "\n";
      if (position) output += "代码行数: " + position + "\n";
    } else {
      output += "评论类型: PR 整体评论\n";
    }
    
    output += "\n---\n\n";
    output += "评论内容:\n";
    output += (body.length > 200 ? body.substring(0, 200) + "..." : body) + "\n";
    
    output += "\n---\n";
    
    if (comment?.id) output += "评论 ID: " + comment.id + "\n";
    if (comment?.user?.login || comment?.author?.username) {
      output += "发布者: " + (comment.user?.login || comment.author?.username) + "\n";
    }
    if (comment?.created_at) {
      output += "发布时间: " + new Date(comment.created_at).toLocaleString("zh-CN") + "\n";
    }
    if (comment?.html_url || comment?.web_url) {
      output += "评论链接: " + (comment.html_url || comment.web_url) + "\n";
    }
    
    output += "\n💡 提示：\n";
    output += "   - 评论已成功发布到 PR\n";
    output += "   - 如需查看其他评论，请访问 PR 页面\n";
    output += "\n数据来源: Gitcode API\n";
    output += "操作时间: " + new Date().toLocaleString("zh-CN") + "\n";
    output += "━".repeat(60) + "\n";
    
    return output;
    
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时，请稍后重试。";
    }
    return "发布 PR 评论时发生错误：" + e.message;
  }
}

export const toolDefinition = {
  name: "get_development_info",
  description: `查询 Gitcode（AtomGit）平台上的开发信息，包括用户开发活动、Issue、Pull Request、PR 文件变更、PR 评论。需要配置 GITCODE_TOKEN 环境变量。

⚠️ **重要说明：GitCode = AtomGit**
在 openEuler 生态中，GitCode 和 AtomGit 是同一个代码托管平台的不同名称。

⚠️ **前置条件：**
需要在 MCP Server 配置中设置 GITCODE_TOKEN 环境变量。

**查询类型（query_type）：**

1. events（默认）- 查询指定用户的开发活动
   - 需要提供 gitcode_id（用户 ID）
   - 返回用户的提交、MR、Issue、评论等活动

2. issues - 查询与当前用户相关的 Issue
   - 不需要 gitcode_id
   - 返回用户创建的、分配给用户的 Issue
   - 使用当前 Token 对应的用户身份

3. pulls - 查询与当前用户相关的 Pull Request
   - 不需要 gitcode_id
   - 可通过 pr_scope 筛选不同类型的 PR
   - 使用当前 Token 对应的用户身份

4. files - 查询某个 PR 的详细文件变更
   - 需要提供 owner（仓库所属空间）、repo（仓库路径）、number（PR编号）
   - 返回每个文件的修改差异（diff）
   - 输出包含分析建议，可让 Agent 帮助解读改动

5. comment - 在某个 PR 上发表评论
   - 需要提供 owner、repo、number、comment_body（评论内容）
   - 可选参数：comment_path（文件路径）、comment_position（代码行数）
   - 用于对特定文件或特定行的代码进行评论

**PR 筛选范围（pr_scope，仅 pulls 模式）：**
- created_by_me: 我创建的 PR
- assigned_to_me: 分配给我的 PR
- need_my_review: 要我评审的 PR
- need_my_approve: 要我审批的 PR

**何时使用：**
- 查询某个 Gitcode 用户的开发活动（events）
- 查看与自己相关的 Issue（issues）
- 查看自己创建/评审的 PR（pulls）
- 查看 PR 具体修改了哪些文件（files）
- 分析 PR 的代码变更详情（files + 询问 Agent 分析）
- 在 PR 上发表评论或评审意见（comment）

**Token 配置示例：**
{
  "mcpServers": {
    "openeuler-portal": {
      "env": {
        "GITCODE_TOKEN": "your_token_here"
      }
    }
  }
}

**示例问题：**
- "查询 Gitcode 用户 persimmonzzz 的开发活动"
- "查看与我相关的 Issue"
- "查询我创建的 Pull Request"
- "查看需要我评审的 PR"
- "查询 openeuler/openEuler-portal PR #3064 的文件变更"
- "帮我分析 PR #3064 的改动内容"
- "在 openeuler/kernel PR #123 发表评论：代码实现很清晰"
- "对 openeuler/kernel PR #123 的 src/main.c 第 50 行发表评论：建议增加错误处理"`,
  inputSchema: {
    type: "object",
    properties: {
      gitcode_id: {
        type: "string",
        description: "Gitcode 用户 ID（仅 query_type=events 时需要）。例如：persimmonzzz、gzbang。",
      },
      query_type: {
        type: "string",
        description: "查询类型：events（开发活动）、issues（用户Issue）、pulls（用户PR）、files（PR文件变更）、comment（PR评论）。默认 events。",
        enum: ["events", "issues", "pulls", "files", "comment"],
        default: "events",
      },
      pr_scope: {
        type: "string",
        description: "PR 筛选范围（仅 query_type=pulls）：created_by_me、assigned_to_me、need_my_review、need_my_approve。",
        enum: ["created_by_me", "assigned_to_me", "need_my_review", "need_my_approve"],
      },
      owner: {
        type: "string",
        description: "仓库所属空间地址（query_type=files 或 comment 时需要）。如 openeuler。",
      },
      repo: {
        type: "string",
        description: "仓库路径（query_type=files 或 comment 时需要）。如 openEuler-portal。",
      },
      number: {
        type: "number",
        description: "PR 编号（query_type=files 或 comment 时需要）。如 3064。",
      },
      comment_body: {
        type: "string",
        description: "评论内容（仅 query_type=comment 时必需）。评论的具体文本内容。",
      },
      comment_path: {
        type: "string",
        description: "文件的相对路径（仅 query_type=comment 时可选）。如 src/main.c，用于对特定文件进行评论。",
      },
      comment_position: {
        type: "number",
        description: "代码行数（仅 query_type=comment 时可选）。如 50，用于对特定行进行评论。",
      },
    },
  },
};