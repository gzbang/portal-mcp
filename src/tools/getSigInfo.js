// 辅助函数：清理 HTML 标签
function stripHtmlTags(str) {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '');
}

// 辅助函数：从路径中提取 SIG 名称
function extractSigName(path) {
  if (!path) return '';
  // path 格式: /sig/sig-OpenDesign 或 /sig/Kernel
  const match = path.match(/\/sig\/(.+)$/);
  return match ? match[1] : path;
}

// 辅助函数：尝试不同的大小写变体
function getCaseVariants(name) {
  const variants = [
    name,                                    // 原始输入
    name.toUpperCase(),                      // 全大写
    name.toLowerCase(),                      // 全小写
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), // 首字母大写
  ];
  // 去重
  return [...new Set(variants)];
}

// 查询 SIG 信息（支持模糊搜索）
async function querySigInfo(sigName) {
  const url = "https://www.openeuler.openatom.cn/api-magic/stat/sig/info";
  const variants = getCaseVariants(sigName);

  for (const variant of variants) {
    const params = new URLSearchParams({
      community: "openeuler",
      sig: variant,
    });

    const response = await fetch(`${url}?${params}`, {
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
  const url = "https://www.openeuler.openatom.cn/api-search/sigsearch/docs";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keyword: keyword,
      keywordType: keywordType,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (response.ok) {
    const text = await response.text();

    // API 返回两个 JSON 对象连在一起，我们只需要第一个
    // 格式: {"giteeIds":[...]}{"status":201,"msg":"查询失败"}
    // 或: {"repos":[...]}{"status":201,"msg":"查询失败"}
    try {
      // 找到第一个完整的 JSON 对象
      let depth = 0;
      let firstJsonEnd = -1;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
          depth--;
          if (depth === 0) {
            firstJsonEnd = i + 1;
            break;
          }
        }
      }

      if (firstJsonEnd > 0) {
        const firstJson = text.substring(0, firstJsonEnd);
        return JSON.parse(firstJson);
      } else {
        throw new Error(`无法解析响应：${text.substring(0, 200)}`);
      }
    } catch (e) {
      throw new Error(`JSON 解析失败：${e.message}。响应内容：${text.substring(0, 200)}`);
    }
  }

  throw new Error(`API 返回错误状态码：${response.status}`);
}

// 获取 openEuler SIG 的相关信息
export async function getSigInfo(sigName, queryType = "sig") {
  try {
    // 如果明确指定了查询类型为 repos
    if (queryType === "repos") {
      const result = await queryBelongsToSigs(sigName, "repos");

      if (result && result.repos && result.repos.length > 0) {
        const sections = [];
        sections.push(`
╔════════════════════════════════════════════════════════════╗
║  仓库 "${sigName}" 的搜索结果                                 ║
╚════════════════════════════════════════════════════════════╝`);

        // 按 SIG 分组
        const sigGroups = {};
        result.repos.forEach(repo => {
          const sigName = extractSigName(repo.path);
          if (!sigGroups[sigName]) {
            sigGroups[sigName] = [];
          }
          sigGroups[sigName].push(repo);
        });

        let sigIndex = 1;
        for (const [sigName, repos] of Object.entries(sigGroups)) {
          sections.push(`\n【SIG ${sigIndex}: ${sigName}】`);
          sections.push(`  包含 ${repos.length} 个相关仓库：`);
          repos.forEach((repo, i) => {
            const cleanName = stripHtmlTags(repo.name);
            sections.push(`    ${i + 1}. ${cleanName} (匹配度: ${repo.socre?.toFixed(2) || 'N/A'})`);
          });
          sigIndex++;
        }

        sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        sections.push(`共找到 ${Object.keys(sigGroups).length} 个 SIG 组，${result.repos.length} 个相关仓库`);
        sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
        sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return sections.join("\n");
      } else {
        return `未找到与 "${sigName}" 相关的仓库信息。`;
      }
    }

    // 如果明确指定了查询类型为 maintainer
    if (queryType === "maintainer") {
      const result = await queryBelongsToSigs(sigName, "maintainer");

      if (result && result.giteeIds && result.giteeIds.length > 0) {
        const sections = [];
        sections.push(`
╔════════════════════════════════════════════════════════════╗
║  Maintainer "${sigName}" 的搜索结果                           ║
╚════════════════════════════════════════════════════════════╝`);

        result.giteeIds.forEach((item, i) => {
          const cleanName = stripHtmlTags(item.name);
          const sigName = extractSigName(item.path);
          sections.push(`\n【结果 ${i + 1}】`);
          sections.push(`  Maintainer: ${cleanName}`);
          sections.push(`  所属 SIG: ${sigName}`);
          sections.push(`  SIG 路径: ${item.path}`);
          sections.push(`  匹配度: ${item.socre?.toFixed(2) || 'N/A'}`);
        });

        sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        sections.push(`共找到 ${result.giteeIds.length} 条结果`);
        sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
        sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return sections.join("\n");
      } else {
        return `未找到 maintainer "${sigName}" 的相关信息。`;
      }
    }

    // 默认：智能查询模式（按 sig → repos → maintainer 顺序尝试）
    // 1. 首先尝试 SIG 查询（支持模糊搜索）
    const sigQueryResult = await querySigInfo(sigName);

    if (sigQueryResult.success) {
      const data = sigQueryResult.data;

          // 格式化输出
          const sections = [];

          // 基本信息
          sections.push(`
╔════════════════════════════════════════════════════════════╗
║  ${sigName} SIG 信息                                         ║
╚════════════════════════════════════════════════════════════╝`);

          if (data.name) {
            sections.push(`\n【名称】${data.name}`);
          }

          if (data.description) {
            sections.push(`\n【描述】${data.description}`);
          }

          if (data.mailing_list) {
            sections.push(`\n【邮件列表】${data.mailing_list}`);
          }

          // Maintainers
          if (data.maintainers && data.maintainers.length > 0) {
            sections.push(`\n【Maintainers】(${data.maintainers.length} 人)`);
            data.maintainers.forEach((m, i) => {
              sections.push(`  ${i + 1}. ${m}`);
            });
          }

          // Maintainer 详细信息
          if (data.maintainer_info && data.maintainer_info.length > 0) {
            sections.push(`\n【Maintainer 详细信息】`);
            data.maintainer_info.forEach((info, i) => {
              sections.push(`  ${i + 1}. ${info.name || info.user_login}`);
              if (info.email) sections.push(`     邮箱: ${info.email}`);
              if (info.user_homepage_url) sections.push(`     主页: ${info.user_homepage_url}`);
            });
          }

          // Repositories
          if (data.repositories && data.repositories.length > 0) {
            sections.push(`\n【仓库】(${data.repositories.length} 个)`);
            data.repositories.slice(0, 20).forEach((repo, i) => {
              sections.push(`  ${i + 1}. ${repo}`);
            });
            if (data.repositories.length > 20) {
              sections.push(`  ... 还有 ${data.repositories.length - 20} 个仓库`);
            }
          }

          // Committers 统计
          if (data.committers && data.committers.length > 0) {
            sections.push(`\n【Committers】共 ${data.committers.length} 人`);
          }

          // Committer 详细信息（只显示前 10 个）
          if (data.committer_info && data.committer_info.length > 0) {
            sections.push(`\n【活跃 Committers】(显示前 10 位)`);
            data.committer_info.slice(0, 10).forEach((info, i) => {
              const name = info.name || info.user_login || info.gitee_id || info.atomgit_id;
              sections.push(`  ${i + 1}. ${name}`);
              if (info.email) sections.push(`     邮箱: ${info.email}`);
              if (info.organization) sections.push(`     组织: ${info.organization}`);
            });
            if (data.committer_info.length > 10) {
              sections.push(`  ... 还有 ${data.committer_info.length - 10} 位 committers`);
            }
          }

          // Branches 信息
          if (data.branches && data.branches.length > 0) {
            sections.push(`\n【分支管理】(${data.branches.length} 个分支组)`);
            data.branches.slice(0, 3).forEach((branch, i) => {
              if (branch.repo_branch && branch.repo_branch.length > 0) {
                sections.push(`  分支组 ${i + 1}: ${branch.repo_branch.length} 个仓库分支`);
                if (branch.keeper && branch.keeper.length > 0) {
                  const keepers = branch.keeper.map(k => k.gitee_id || k.atomgit_id).join(", ");
                  sections.push(`    维护者: ${keepers}`);
                }
              }
            });
            if (data.branches.length > 3) {
              sections.push(`  ... 还有 ${data.branches.length - 3} 个分支组`);
            }
          }

          sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          sections.push(`数据来源: https://www.openeuler.openatom.cn/api-magic/stat/sig/info`);
          sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
          sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          return sections.join("\n");
    }

    // 2. SIG 查询失败，尝试仓库查询
    try {
      const reposResult = await queryBelongsToSigs(sigName, "repos");

      if (reposResult && reposResult.repos && reposResult.repos.length > 0) {
        const sections = [];
        sections.push(`
╔════════════════════════════════════════════════════════════╗
║  仓库 "${sigName}" 的搜索结果                                 ║
╚════════════════════════════════════════════════════════════╝`);

        // 按 SIG 分组
        const sigGroups = {};
        reposResult.repos.forEach(repo => {
          const sigName = extractSigName(repo.path);
          if (!sigGroups[sigName]) {
            sigGroups[sigName] = [];
          }
          sigGroups[sigName].push(repo);
        });

        let sigIndex = 1;
        for (const [sigName, repos] of Object.entries(sigGroups)) {
          sections.push(`\n【SIG ${sigIndex}: ${sigName}】`);
          sections.push(`  包含 ${repos.length} 个相关仓库：`);
          repos.forEach((repo, i) => {
            const cleanName = stripHtmlTags(repo.name);
            sections.push(`    ${i + 1}. ${cleanName} (匹配度: ${repo.socre?.toFixed(2) || 'N/A'})`);
          });
          sigIndex++;
        }

        sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        sections.push(`共找到 ${Object.keys(sigGroups).length} 个 SIG 组，${reposResult.repos.length} 个相关仓库`);
        sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
        sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return sections.join("\n");
      }
    } catch (e) {
      // 仓库查询失败，继续尝试 maintainer 查询
    }

    // 3. 仓库查询也失败，尝试 maintainer 查询
    try {
      const maintainerResult = await queryBelongsToSigs(sigName, "maintainer");

      if (maintainerResult && maintainerResult.giteeIds && maintainerResult.giteeIds.length > 0) {
        const sections = [];
        sections.push(`
╔════════════════════════════════════════════════════════════╗
║  Maintainer "${sigName}" 的搜索结果                           ║
╚════════════════════════════════════════════════════════════╝`);

        maintainerResult.giteeIds.forEach((item, i) => {
          const cleanName = stripHtmlTags(item.name);
          const sigName = extractSigName(item.path);
          sections.push(`\n【结果 ${i + 1}】`);
          sections.push(`  Maintainer: ${cleanName}`);
          sections.push(`  所属 SIG: ${sigName}`);
          sections.push(`  SIG 路径: ${item.path}`);
          sections.push(`  匹配度: ${item.socre?.toFixed(2) || 'N/A'}`);
        });

        sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        sections.push(`共找到 ${maintainerResult.giteeIds.length} 条结果`);
        sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
        sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return sections.join("\n");
      }
    } catch (e) {
      // maintainer 查询也失败
    }

    // 4. 所有查询都失败
    return `未找到与 "${sigName}" 相关的信息。已尝试：SIG 查询、仓库查询、Maintainer 查询。`;
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时，请稍后重试。`;
    }
    return `获取 SIG 信息时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "get_sig_info",
  description: `查询 openEuler 技术特别兴趣小组（Technical SIG）的详细信息，或查询仓库/maintainer 所属的 SIG 组。

⚠️ 重要区分：
- 本工具用于查询【技术 SIG】：如 Kernel SIG、Cloud SIG、AI SIG 等技术工作组
- 如需查询【治理委员会】：如技术委员会、品牌委员会等，请使用 get_organization_info 工具

SIG（Special Interest Group）是 openEuler 社区中负责具体技术领域开发和维护的工作组，每个 SIG 管理特定技术方向的代码仓库。

**查询模式：**
1. 智能查询（默认）：query_type = "sig" 或不指定
   - 自动按顺序尝试：SIG 查询 → 仓库查询 → Maintainer 查询
   - SIG 查询支持模糊搜索，自动尝试不同大小写变体（如 ai → AI）
   - 如果 SIG 查询无结果，自动尝试作为仓库名查询
   - 如果仓库查询也无结果，自动尝试作为 maintainer 查询
   - 直到找到结果或全部尝试完毕

2. 指定仓库查询：query_type = "repos"
   - 仅查询仓库，不尝试其他类型
   - 输入仓库名称，查询该仓库属于哪些 SIG 组

3. 指定 maintainer 查询：query_type = "maintainer"
   - 仅查询 maintainer，不尝试其他类型
   - 输入 maintainer 的 Gitee ID，查询该 maintainer 属于哪些 SIG 组

**推荐用法：**
- 大多数情况下，直接使用默认的智能查询模式即可，无需指定 query_type
- 系统会自动识别输入是 SIG 名、仓库名还是 maintainer 名
- 只有在明确知道查询类型时，才需要指定 query_type

**使用场景：**
- 查询某个技术 SIG 的基本信息（名称、描述、邮件列表）
- 了解 SIG 的代码维护者（Maintainers）和活跃贡献者（Committers）
- 查看 SIG 管理的 Git 代码仓库列表
- 获取 SIG 的分支管理和开发信息
- 查询某个仓库属于哪些 SIG 组
- 查询某个 maintainer 参与了哪些 SIG 组

**常见技术 SIG 名称示例：**
- Kernel（内核开发）
- ai（人工智能技术）
- Compiler（编译器）
- Networking（网络技术）
- Security（安全技术）
- Storage（存储）

**不要使用本工具查询：**
- ❌ "技术委员会" - 这是治理组织，请用 get_organization_info
- ❌ "品牌委员会" - 这是治理组织，请用 get_organization_info
- ❌ "用户委员会" - 这是治理组织，请用 get_organization_info

**返回信息包括：**
- SIG 基本信息（名称、描述、邮件列表）
- Maintainers 列表及联系方式
- 管理的代码仓库（最多显示 20 个）
- Committers 统计和活跃贡献者（前 10 位）
- 分支管理信息（前 3 个分支组）`,
  inputSchema: {
    type: "object",
    required: ["sig_name"],
    properties: {
      sig_name: {
        type: "string",
        description: "查询关键词。可以是 SIG 名称（如 'Kernel'、'ai'）、仓库名称（如 'kernel'、'gcc'）、或 maintainer 的 Gitee ID（如 'gzbang'）。默认智能查询模式会自动识别类型。",
      },
      query_type: {
        type: "string",
        enum: ["sig", "repos", "maintainer"],
        description: "查询类型（可选）：'sig'（智能查询，默认）、'repos'（仅查询仓库）、'maintainer'（仅查询 maintainer）。大多数情况下无需指定，使用默认的智能查询即可。",
        default: "sig",
      },
    },
  },
};
