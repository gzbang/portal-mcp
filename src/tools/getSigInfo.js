// 获取 openEuler SIG 的相关信息
export async function getSigInfo(sigName) {
  try {
    const url = "https://www.openeuler.openatom.cn/api-magic/stat/sig/info";
    const params = new URLSearchParams({
      community: "openeuler",
      sig: sigName,
    });

    const response = await fetch(`${url}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      try {
        const result = await response.json();

        // API 返回格式: {code, message, data}
        if (result.code === 1 && result.data) {
          const data = result.data;

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
          sections.push(`数据来源: ${url}`);
          sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
          sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          return sections.join("\n");
        } else if (result.code !== 1) {
          return `获取 ${sigName} SIG 信息失败：${result.message || '未知错误'}`;
        } else {
          return `${sigName} SIG 信息为空或不存在。`;
        }
      } catch (e) {
        return `解析 ${sigName} SIG 信息时出错：${e.message}`;
      }
    } else {
      return `获取 SIG 信息时 API 返回错误状态码：${response.status}`;
    }
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
  description: `查询 openEuler 技术特别兴趣小组（Technical SIG）的详细信息。

⚠️ 重要区分：
- 本工具用于查询【技术 SIG】：如 Kernel SIG、Cloud SIG、AI SIG 等技术工作组
- 如需查询【治理委员会】：如技术委员会、品牌委员会等，请使用 get_organization_info 工具

SIG（Special Interest Group）是 openEuler 社区中负责具体技术领域开发和维护的工作组，每个 SIG 管理特定技术方向的代码仓库。

**使用场景：**
- 查询某个技术 SIG 的基本信息（名称、描述、邮件列表）
- 了解 SIG 的代码维护者（Maintainers）和活跃贡献者（Committers）
- 查看 SIG 管理的 Git 代码仓库列表
- 获取 SIG 的分支管理和开发信息

**常见技术 SIG 名称示例：**
- Kernel（内核开发）
- ai（人工智能技术）
- Cloud（云计算技术）
- Networking（网络技术）
- Security（安全技术）
- Compiler（编译器）
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
        description: "技术 SIG 的名称（不是委员会名称），例如：'Kernel'、'ai'、'Cloud'、'Networking'、'Security' 等。注意：如果要查询'技术委员会'等治理组织，请使用 get_organization_info 工具。",
      },
    },
  },
};
