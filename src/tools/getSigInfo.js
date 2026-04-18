import { addField, addFields, addIndentedField, addIndentedFields, truncate, stripHtml } from "../utils/formatHelpers.js";

// 数据源 URL
const SIG_INFO_URL = "https://www.openeuler.openatom.cn/api-magic/stat/sig/info";
const SIG_SEARCH_URL = "https://www.openeuler.openatom.cn/api-search/sigsearch/docs";
const SIG_CONTRIBUTE_URL = "https://www.openeuler.openatom.cn/api-magic/stat/sig/user/contribute";

// SIG 名称列表缓存（用于模糊匹配）
let cachedSigNames = null;
let sigNamesExpiry = 0;
const CACHE_DURATION = 15 * 60 * 1000;

// 贡献类型标签
const CONTRIBUTE_TYPE_LABELS = {
  pr: "PR 合并请求",
  issue: "Issue 需求&评审",
  comment: "评审评论",
};

// 时间范围标签
const TIME_RANGE_LABELS = {
  all: "全部",
  lastonemonth: "最近一个月",
  lasthalfyear: "最近半年",
  lastoneyear: "最近一年",
};

// 辅助函数：从路径中提取 SIG 名称
function extractSigName(path) {
  if (!path) return '';
  const match = path.match(/\/sig\/(.+)$/);
  return match ? match[1] : path;
}

// 辅助函数：尝试不同的大小写变体
function getCaseVariants(name) {
  const variants = [
    name,
    name.toUpperCase(),
    name.toLowerCase(),
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
  ];
  return [...new Set(variants)];
}

// 获取所有 SIG 名称列表（带缓存）
async function fetchAllSigNames() {
  const now = Date.now();
  if (cachedSigNames && now < sigNamesExpiry) return cachedSigNames;

  const response = await fetch(`${SIG_INFO_URL}?community=openeuler`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return [];

  const data = await response.json();
  if (!data || data.code !== 1 || !data.data) return [];

  let names = [];
  if (Array.isArray(data.data)) {
    names = data.data.map(item => item.name || item.sig_name || item).filter(Boolean);
  } else if (data.data.sig_list) {
    names = data.data.sig_list.map(item => item.name || item.sig_name || item).filter(Boolean);
  }

  cachedSigNames = names;
  sigNamesExpiry = now + CACHE_DURATION;
  return names;
}

// 从 SIG 名称列表中模糊匹配，返回精确匹配名称或候选建议列表
async function matchOrSuggestSig(input) {
  const sigNames = await fetchAllSigNames();
  if (!sigNames || sigNames.length === 0) return { matched: null, suggestions: [] };

  const lower = input.toLowerCase();
  const stripped = lower.replace(/[-_\s]/g, '');

  // 优先级 1：精确匹配
  const exact = sigNames.find(n => n === input);
  if (exact) return { matched: exact, suggestions: [] };

  // 优先级 2：大小写不敏感精确匹配
  const caseMatch = sigNames.find(n => n.toLowerCase() === lower);
  if (caseMatch) return { matched: caseMatch, suggestions: [] };

  // 优先级 3：去除连字符/下划线后匹配（bigdata → big-data，sig-ai → ai）
  const stripMatch = sigNames.find(n => n.toLowerCase().replace(/[-_\s]/g, '') === stripped);
  if (stripMatch) return { matched: stripMatch, suggestions: [] };

  // 优先级 4：收集模糊候选（含前缀/包含关系）
  const candidates = [];
  for (const name of sigNames) {
    const nameLower = name.toLowerCase();
    const nameStripped = nameLower.replace(/[-_\s]/g, '');

    if (nameLower.startsWith(lower) || lower.startsWith(nameLower)) {
      candidates.push({ name, priority: 2 });
    } else if (nameLower.includes(lower) || lower.includes(nameLower)) {
      candidates.push({ name, priority: 1 });
    } else if (nameStripped.includes(stripped) || stripped.includes(nameStripped)) {
      candidates.push({ name, priority: 1 });
    }
  }

  // 如果只有一个候选，视为最佳匹配直接使用
  if (candidates.length === 1) return { matched: candidates[0].name, suggestions: [] };

  // 按优先级排序，取前 10 个
  candidates.sort((a, b) => b.priority - a.priority);
  return { matched: null, suggestions: candidates.slice(0, 10).map(c => c.name) };
}

// 查询 SIG 信息（支持大小写模糊搜索）
async function querySigInfo(sigName) {
  const variants = getCaseVariants(sigName);

  for (const variant of variants) {
    const params = new URLSearchParams({ community: "openeuler", sig: variant });
    const response = await fetch(`${SIG_INFO_URL}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 1 && result.data) {
        return { success: true, data: result.data };
      }
    }
  }

  return { success: false };
}

// 查询仓库或 maintainer 所属的 SIG 组
async function queryBelongsToSigs(keyword, keywordType) {
  const response = await fetch(SIG_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, keywordType }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`API 返回错误状态码：${response.status}`);
  }

  const text = await response.text();

  // API 返回两个 JSON 对象连在一起，只取第一个
  let depth = 0;
  let firstJsonEnd = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) { firstJsonEnd = i + 1; break; }
    }
  }

  if (firstJsonEnd > 0) {
    return JSON.parse(text.substring(0, firstJsonEnd));
  }
  throw new Error(`无法解析响应：${text.substring(0, 200)}`);
}

// 查询 SIG 成员贡献
async function fetchSigContribute(sigName, contributeType, timeRange = "all") {
  const params = new URLSearchParams({
    contributeType,
    timeRange,
    community: "openeuler",
    sig: sigName,
  });

  const response = await fetch(`${SIG_CONTRIBUTE_URL}?${params}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`API 请求失败：HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// 格式化单个贡献类型的结果
function formatContributeSection(typeLabel, timeRangeLabel, data) {
  if (!data || data.code !== 1 || !Array.isArray(data.data) || data.data.length === 0) {
    return `\n**${typeLabel}（${timeRangeLabel}）：** 暂无数据\n`;
  }

  let out = `\n**${typeLabel}（${timeRangeLabel}，共 ${data.data.length} 人）：**\n`;
  data.data.slice(0, 20).forEach((item, i) => {
    const user = item.user_login || item.gitee_id || item.atomgit_id || item.user || item.name || "未知";
    const count = item.contribute ?? item.contribute_count ?? item.count ?? item.num ?? "N/A";
    out += `   ${i + 1}. ${user}  ${count} 次\n`;
    out = addIndentedFields(out, item, [
      { field: 'usertype', label: '用户类型' },
      { field: 'organization', label: '组织' },
      { field: 'email', label: '邮箱' },
      { field: 'atomgit_id', label: 'AtomGit ID' },
      { field: 'user_homepage_url', label: '主页' },
    ], 6);
    if (item.gitee_id && item.user_login !== item.gitee_id) {
      out += `      Gitee ID: ${item.gitee_id}\n`;
    }
  });
  if (data.data.length > 20) {
    out += `   ... 共 ${data.data.length} 人\n`;
  }
return out;
}

// 格式化 SIG 信息输出
function formatSigInfo(sigName, data) {
  let output = `
╔════════════════════════════════════════════════════════════╗
║  ${sigName} SIG 信息                                         ║
╚════════════════════════════════════════════════════════════╝`;

  const basicFields = [
    { field: 'sig_name', label: '名称', formatter: v => v || data.name },
    { field: 'sig_type', label: '类型' },
    { field: 'status', label: '状态' },
    { field: 'community', label: '所属社区' },
    { field: 'description', label: '描述' },
    { field: 'mailing_list', label: '邮件列表' },
    { field: 'homepage_url', label: '主页' },
    { field: 'logo_url', label: 'Logo' },
    { field: 'creator', label: '创建者' },
    { field: 'created_at', label: '创建时间' },
    { field: 'updated_at', label: '更新时间' },
  ];
  
  output += '\n';
  output = addFields(output, data, basicFields);

  if (data.maintainers?.length > 0) {
    output += `\n【Maintainers】(${data.maintainers.length} 人)\n`;
    data.maintainers.forEach((m, i) => output += `  ${i + 1}. ${m}\n`);
  }

  if (data.maintainer_info?.length > 0) {
    output += '\n【Maintainer 详细信息】\n';
    data.maintainer_info.forEach((info, i) => {
      const name = info.name || info.user_login || info.gitee_id || info.atomgit_id || "未知";
      output += `  ${i + 1}. ${name}\n`;
      output = addIndentedFields(output, info, [
        { field: 'gitee_id', label: 'Gitee ID' },
        { field: 'atomgit_id', label: 'AtomGit ID' },
        { field: 'email', label: '邮箱' },
        { field: 'organization', label: '组织' },
        { field: 'usertype', label: '用户类型' },
        { field: 'user_homepage_url', label: '主页' },
      ], 5);
    });
  }

  if (data.repositories?.length > 0) {
    output += `\n【仓库】(${data.repositories.length} 个)\n`;
    data.repositories.slice(0, 20).forEach((repo, i) => {
      if (typeof repo === 'string') {
        output += `  ${i + 1}. ${repo}\n`;
      } else {
        output += `  ${i + 1}. ${repo.name || repo.repo_name || repo}\n`;
        output = addIndentedFields(output, repo, [
          { field: 'url', label: 'URL' },
          { field: 'description', label: '描述', formatter: v => truncate(stripHtml(v), 100) },
          { field: 'language', label: '语言' },
        ], 5);
      }
    });
    if (data.repositories.length > 20) {
      output += `  ... 还有 ${data.repositories.length - 20} 个仓库\n`;
    }
  }

  if (data.contributors?.length > 0) {
    output += `\n【Contributors】共 ${data.contributors.length} 人\n`;
  }

  if (data.committers?.length > 0) {
    output += `\n【Committers】共 ${data.committers.length} 人\n`;
  }

  if (data.committer_info?.length > 0) {
    output += `\n【活跃 Committers】(显示前 10 位)\n`;
    data.committer_info.slice(0, 10).forEach((info, i) => {
      const name = info.name || info.user_login || info.gitee_id || info.atomgit_id;
      output += `  ${i + 1}. ${name}\n`;
      output = addIndentedFields(output, info, [
        { field: 'gitee_id', label: 'Gitee ID' },
        { field: 'atomgit_id', label: 'AtomGit ID' },
        { field: 'email', label: '邮箱' },
        { field: 'organization', label: '组织' },
        { field: 'usertype', label: '用户类型' },
        { field: 'user_homepage_url', label: '主页' },
      ], 5);
    });
    if (data.committer_info.length > 10) {
      output += `  ... 还有 ${data.committer_info.length - 10} 位 committers\n`;
    }
  }

  if (data.branches?.length > 0) {
    output += `\n【分支管理】(${data.branches.length} 个分支组)\n`;
    data.branches.slice(0, 3).forEach((branch, i) => {
      const branchName = branch.branch_name || branch.name || `分支组 ${i + 1}`;
      output += `  ${i + 1}. ${branchName}\n`;
      output = addIndentedFields(output, branch, [
        { field: 'branch_type', label: '类型' },
      ], 5);
      if (branch.repo_branch?.length > 0) {
        output += `     仓库分支数: ${branch.repo_branch.length}\n`;
      }
      if (branch.keeper?.length > 0) {
        const keepers = branch.keeper.map(k => k.gitee_id || k.atomgit_id || k.name || k).join(", ");
        output += `     维护者: ${keepers}\n`;
      }
      output = addIndentedField(output, branch, 'created_at', '创建时间', 5);
    });
    if (data.branches.length > 3) {
      output += `  ... 还有 ${data.branches.length - 3} 个分支组\n`;
    }
  }

  output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  output += `\n💡 提示：可用 query_type="contribute" 查询该 SIG 的成员贡献统计。`;
  output += `\n数据来源: openEuler SIG 数据平台`;
  output += `\n查询时间: ${new Date().toLocaleString('zh-CN')}`;
  output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return output;
}

// 格式化 SIG 名称建议输出
function formatSigSuggestions(input, suggestions) {
  let out = `=== SIG 名称建议 ===\n\n`;
  out += `未找到名称为 "${input}" 的 SIG 组。\n\n`;
  if (suggestions.length > 0) {
    out += `以下是相似的 SIG 名称，请确认是否为其中之一：\n`;
    suggestions.forEach((name, i) => { out += `   ${i + 1}. ${name}\n`; });
    out += `\n💡 提示：请用精确的 SIG 名称重新查询，例如 sig_name="${suggestions[0]}"。\n`;
  } else {
    out += `💡 提示：请检查 SIG 名称是否正确，或使用 get_sig_info 智能查询模式搜索仓库/maintainer。\n`;
  }
  return out;
}

// 获取 openEuler SIG 的相关信息
export async function getSigInfo(sigName, queryType = "sig", contributeType = "pr", timeRange = "all") {
  try {
    // ===== 贡献查询模式 =====
    if (queryType === "contribute") {
      // 先从 SIG 列表中精确匹配名称
      const { matched, suggestions } = await matchOrSuggestSig(sigName);

      if (!matched) {
        return formatSigSuggestions(sigName, suggestions);
      }

      const typeLabel = CONTRIBUTE_TYPE_LABELS[contributeType] || contributeType;
      const timeRangeLabel = TIME_RANGE_LABELS[timeRange] || timeRange;

      if (contributeType === "all") {
        // 并行查询 pr、issue、comment 三种贡献
        const [prData, issueData, commentData] = await Promise.all([
          fetchSigContribute(matched, "pr", timeRange),
          fetchSigContribute(matched, "issue", timeRange),
          fetchSigContribute(matched, "comment", timeRange),
        ]);

        let output = `=== ${matched} SIG 成员贡献统计（全部类型）===\n`;
        output += `时间范围：${timeRangeLabel}\n`;
        output += formatContributeSection(CONTRIBUTE_TYPE_LABELS.pr, timeRangeLabel, prData);
        output += formatContributeSection(CONTRIBUTE_TYPE_LABELS.issue, timeRangeLabel, issueData);
        output += formatContributeSection(CONTRIBUTE_TYPE_LABELS.comment, timeRangeLabel, commentData);
        output += `\n---\n数据来源: openEuler SIG 数据平台\n`;
        output += `查询时间: ${new Date().toLocaleString("zh-CN")}\n`;
        return output;
      }

      const data = await fetchSigContribute(matched, contributeType, timeRange);
      let output = `=== ${matched} SIG 成员贡献统计 ===\n\n`;
      output += `贡献类型：${typeLabel}\n`;
      output += `时间范围：${timeRangeLabel}\n`;
      output += formatContributeSection(typeLabel, timeRangeLabel, data);
      output += `\n---\n`;
      output += `💡 提示：可将 contribute_type 改为 "issue"、"comment" 或 "all" 查询其他贡献类型；将 time_range 改为 "lastonemonth"、"lasthalfyear"、"lastoneyear" 查询不同时间范围。\n`;
      output += `数据来源: openEuler SIG 数据平台\n`;
      output += `查询时间: ${new Date().toLocaleString("zh-CN")}\n`;
      return output;
    }

    // ===== 仓库查询模式 =====
    if (queryType === "repos") {
      const result = await queryBelongsToSigs(sigName, "repos");
      if (result && result.repos && result.repos.length > 0) {
        return formatReposResult(sigName, result.repos);
      }
      return `未找到与 "${sigName}" 相关的仓库信息。`;
    }

    // ===== maintainer 查询模式 =====
    if (queryType === "maintainer") {
      const result = await queryBelongsToSigs(sigName, "maintainer");
      if (result && result.giteeIds && result.giteeIds.length > 0) {
        return formatMaintainerResult(sigName, result.giteeIds);
      }
      return `未找到 maintainer "${sigName}" 的相关信息。`;
    }

    // ===== 默认：智能查询模式 =====
    // 步骤 1：直接 SIG 查询（含大小写变体）
    const sigQueryResult = await querySigInfo(sigName);
    if (sigQueryResult.success) {
      return formatSigInfo(sigName, sigQueryResult.data);
    }

    // 步骤 2：从 SIG 列表中模糊匹配
    const { matched, suggestions } = await matchOrSuggestSig(sigName);
    if (matched && matched !== sigName) {
      // 用匹配到的正确名称重新查询
      const retryResult = await querySigInfo(matched);
      if (retryResult.success) {
        return formatSigInfo(matched, retryResult.data);
      }
    }
    if (!matched && suggestions.length > 0) {
      // 有多个候选，返回建议（但继续尝试 repos/maintainer 兜底）
      // 只在 repos/maintainer 也无结果时才返回建议
    }

    // 步骤 3：尝试仓库查询
    try {
      const reposResult = await queryBelongsToSigs(sigName, "repos");
      if (reposResult && reposResult.repos && reposResult.repos.length > 0) {
        return formatReposResult(sigName, reposResult.repos);
      }
    } catch (_) { /* 继续尝试 */ }

    // 步骤 4：尝试 maintainer 查询
    try {
      const maintainerResult = await queryBelongsToSigs(sigName, "maintainer");
      if (maintainerResult && maintainerResult.giteeIds && maintainerResult.giteeIds.length > 0) {
        return formatMaintainerResult(sigName, maintainerResult.giteeIds);
      }
    } catch (_) { /* 继续 */ }

    // 步骤 5：所有查询失败，如果有相似 SIG 推荐则展示
    if (suggestions.length > 0) {
      return formatSigSuggestions(sigName, suggestions);
    }

    return `未找到与 "${sigName}" 相关的信息。已尝试：SIG 查询、仓库查询、Maintainer 查询。`;
  } catch (e) {
    if (e.name === "AbortError") return "网络请求超时，请稍后重试。";
    return `获取 SIG 信息时发生错误：${e.message}`;
  }
}

// 格式化仓库查询结果
function formatReposResult(sigName, repos) {
  const sections = [];
  sections.push(`
╔════════════════════════════════════════════════════════════╗
║  仓库 "${sigName}" 的搜索结果                                 ║
╚════════════════════════════════════════════════════════════╝`);

  const sigGroups = {};
  repos.forEach(repo => {
    const sig = extractSigName(repo.path);
    if (!sigGroups[sig]) sigGroups[sig] = [];
    sigGroups[sig].push(repo);
  });

  let i = 1;
  for (const [sig, rs] of Object.entries(sigGroups)) {
    sections.push(`\n【SIG ${i}: ${sig}】`);
    sections.push(`  包含 ${rs.length} 个相关仓库：`);
    rs.forEach((r, j) => {
      sections.push(`    ${j + 1}. ${stripHtml(r.name)} (匹配度: ${r.socre?.toFixed(2) || 'N/A'})`);
      if (r.url) sections.push(`       URL: ${r.url}`);
      if (r.description) sections.push(`       描述: ${stripHtml(r.description).substring(0, 100)}`);
      if (r.language) sections.push(`       语言: ${r.language}`);
      if (r.stars) sections.push(`       Stars: ${r.stars}`);
      if (r.forks) sections.push(`       Forks: ${r.forks}`);
    });
    i++;
  }

  sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(`共找到 ${Object.keys(sigGroups).length} 个 SIG 组，${repos.length} 个相关仓库`);
  sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  return sections.join("\n");
}

// 格式化 maintainer 查询结果
function formatMaintainerResult(sigName, giteeIds) {
  const sections = [];
  sections.push(`
╔════════════════════════════════════════════════════════════╗
║  Maintainer "${sigName}" 的搜索结果                           ║
╚════════════════════════════════════════════════════════════╝`);

  giteeIds.forEach((item, i) => {
    const name = stripHtml(item.name) || item.gitee_id || item.atomgit_id || "未知";
    sections.push(`\n【结果 ${i + 1}】`);
    sections.push(`  Maintainer: ${name}`);
    sections.push(`  所属 SIG: ${extractSigName(item.path)}`);
    sections.push(`  SIG 路径: ${item.path}`);
    sections.push(`  匹配度: ${item.socre?.toFixed(2) || 'N/A'}`);
    if (item.gitee_id) sections.push(`  Gitee ID: ${item.gitee_id}`);
    if (item.atomgit_id) sections.push(`  AtomGit ID: ${item.atomgit_id}`);
    if (item.email) sections.push(`  邮箱: ${item.email}`);
    if (item.organization) sections.push(`  组织: ${item.organization}`);
    if (item.usertype) sections.push(`  用户类型: ${item.usertype}`);
  });

  sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  sections.push(`共找到 ${giteeIds.length} 条结果`);
  sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
  sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  return sections.join("\n");
}

// 工具定义
export const toolDefinition = {
  name: "get_sig_info",
  description: `查询 openEuler 技术特别兴趣小组（Technical SIG）的详细信息，支持 SIG 信息查询、成员贡献统计、仓库归属查询、maintainer 归属查询。

⚠️ **重要区分：**
- 本工具用于查询【技术 SIG】：如 Kernel SIG、Cloud SIG、AI SIG 等技术工作组
- 如需查询【治理委员会】：如技术委员会、品牌委员会等，请使用 get_organization_info 工具

⚠️ **重要说明：GitCode = AtomGit**
在 openEuler 生态中，**GitCode 和 AtomGit 是同一个代码托管平台的不同名称**：
- 返回结果中的 atomgit_id 就是 gitcode_id，两者指向同一个用户标识
- 如需查询某用户的开发活动，可将 atomgit_id 值传递给 get_development_info 工具
- 输出中显示 "AtomGit ID" 或 "GitCode ID" 均可，建议使用 "GitCode ID"（用户友好）

**查询模式：**

1. 智能查询（默认）：query_type = "sig"
   - 自动按顺序尝试：SIG 查询 → 仓库查询 → Maintainer 查询
   - SIG 查询支持模糊搜索，当名称不明确时自动从 SIG 列表推荐相近名称
   - 如果 SIG 查询无结果，自动尝试作为仓库名/maintainer 查询

2. 贡献统计查询：query_type = "contribute"
    - 查询指定 SIG 组成员的贡献数据（PR、Issue、评审评论）
    - 需提供 sig_name（SIG 名称）和 contribute_type（贡献类型）
    - 自动对 SIG 名称进行大小写修正，名称不明确时给出推荐
    - contribute_type:
      - "pr": PR 合并请求数量排行
      - "issue": Issue 需求&评审数量排行
      - "comment": 评审评论数量排行
      - "all": 一次性查询全部三种类型
    - time_range（时间范围）:
      - "all": 全部时间（默认）
      - "lastonemonth": 最近一个月
      - "lasthalfyear": 最近半年
      - "lastoneyear": 最近一年

3. 仓库查询：query_type = "repos"
   - 输入仓库名称，查询该仓库属于哪些 SIG 组

4. Maintainer 查询：query_type = "maintainer"
   - 输入 maintainer 的 Gitee ID 或 AtomGit ID，查询参与了哪些 SIG 组

**使用场景：**
- 查询某个技术 SIG 的基本信息（名称、描述、Maintainers、仓库列表）
- 查询某个 SIG 的成员贡献排行（PR/Issue/评审）
- 查询某个仓库属于哪些 SIG 组
- 查询某个 maintainer 参与了哪些 SIG 组
- 获取用户的 atomgit_id 后，进一步用 get_development_info 查询开发活动

**常见技术 SIG 名称示例：**
Kernel、ai、Compiler、Networking、Security、Storage、BigData、Virt、sig-SDS、sig-UKUI

**示例问题：**
- "Kernel SIG 的维护者是谁？"
- "ai SIG 管理哪些仓库？"
- "kernel 仓库属于哪些 SIG 组？"
- "gzbang 这个 maintainer 参与了哪些 SIG？"
- "bigdata SIG 的成员 PR 贡献排行"
- "查询 ai SIG 的 Issue 贡献情况"
- "big-data SIG 的全部贡献统计"
- "查询 Kernel SIG 成员 persimmonzzz（atomgit_id）的开发活动"`,
  inputSchema: {
    type: "object",
    required: ["sig_name"],
    properties: {
      sig_name: {
        type: "string",
        description: "查询关键词。可以是 SIG 名称（如 'Kernel'、'ai'、'BigData'）、仓库名称（如 'kernel'、'gcc'）、或 maintainer 的 Gitee ID（如 'gzbang'）。系统会自动进行大小写修正和模糊匹配。",
      },
      query_type: {
        type: "string",
        enum: ["sig", "repos", "maintainer", "contribute"],
        description: "查询类型：'sig'（智能查询，默认）、'repos'（仓库归属查询）、'maintainer'（maintainer 归属查询）、'contribute'（SIG 成员贡献统计）。",
        default: "sig",
      },
      contribute_type: {
        type: "string",
        enum: ["pr", "issue", "comment", "all"],
        description: "贡献类型（query_type 为 'contribute' 时有效）：'pr'（PR 合并请求）、'issue'（Issue 需求&评审）、'comment'（评审评论）、'all'（全部三种类型）。默认为 'pr'。",
        default: "pr",
      },
      time_range: {
        type: "string",
        enum: ["all", "lastonemonth", "lasthalfyear", "lastoneyear"],
        description: "时间范围（query_type 为 'contribute' 时有效）：'all'（全部时间，默认）、'lastonemonth'（最近一个月）、'lasthalfyear'（最近半年）、'lastoneyear'（最近一年）。",
        default: "all",
      },
    },
  },
};
