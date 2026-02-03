// 查询 openEuler CVE 安全公告信息
export async function getCveInfo(keyword, page = 1, pageSize = 20) {
  try {
    const url = "https://www.openeuler.openatom.cn/api-cve/cve-security-notice-server/cvedatabase/findAll";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pages: {
          page: page,
          size: pageSize,
        },
        keyword: keyword,
        noticeType: "cve",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = await response.json();

      if (data && data.result && data.result.cveDatabaseList && data.result.cveDatabaseList.length > 0) {
        const sections = [];
        sections.push(`
╔════════════════════════════════════════════════════════════╗
║  CVE 安全公告查询结果：${keyword}                            ║
╚════════════════════════════════════════════════════════════╝`);

        const totalCount = data.result.totalCount || data.result.cveDatabaseList.length;
        sections.push(`\n共找到 ${totalCount} 条 CVE 记录，显示第 ${page} 页（每页 ${pageSize} 条）\n`);

        data.result.cveDatabaseList.forEach((cve, i) => {
          sections.push(`\n【CVE ${(page - 1) * pageSize + i + 1}】`);

          if (cve.cveId) {
            sections.push(`  CVE ID: ${cve.cveId}`);
          }

          if (cve.summary) {
            // 截断过长的摘要
            const summary = cve.summary.length > 200
              ? cve.summary.substring(0, 200) + "..."
              : cve.summary;
            sections.push(`  摘要: ${summary}`);
          }

          if (cve.cvsssCoreOE && cve.cvsssCoreOE !== "N/A") {
            sections.push(`  CVSS 评分 (OE): ${cve.cvsssCoreOE}`);
          }

          if (cve.cvsssCoreNVD && cve.cvsssCoreNVD !== "N/A") {
            sections.push(`  CVSS 评分 (NVD): ${cve.cvsssCoreNVD}`);
          }

          if (cve.status) {
            sections.push(`  状态: ${cve.status}`);
          }

          if (cve.announcementTime) {
            sections.push(`  发布时间: ${cve.announcementTime}`);
          }

          if (cve.updateTime) {
            sections.push(`  更新时间: ${cve.updateTime}`);
          }

          if (cve.affectedProduct) {
            sections.push(`  受影响产品: ${cve.affectedProduct}`);
          }

          if (cve.packageName) {
            sections.push(`  软件包: ${cve.packageName}`);
          }

          if (cve.securityNoticeNo) {
            sections.push(`  安全公告编号: ${cve.securityNoticeNo}`);
          }
        });

        sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        if (totalCount > pageSize) {
          const totalPages = Math.ceil(totalCount / pageSize);
          sections.push(`提示: 共 ${totalPages} 页，当前第 ${page} 页`);
          if (page < totalPages) {
            sections.push(`可以指定 page 参数查看更多结果`);
          }
        }

        sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
        sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        return sections.join("\n");
      } else {
        return `未找到与 "${keyword}" 相关的 CVE 安全公告。`;
      }
    } else {
      return `查询 CVE 信息时 API 返回错误状态码：${response.status}`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时，请稍后重试。`;
    }
    return `查询 CVE 信息时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "get_cve_info",
  description: `查询 openEuler CVE（Common Vulnerabilities and Exposures）安全公告信息。

CVE 是公开披露的网络安全漏洞标准化标识符。本工具用于查询 openEuler 社区发布的 CVE 安全公告。

**使用场景：**
- 查询特定 CVE 编号的详细信息（如 CVE-2024-1234）
- 搜索特定软件包的安全漏洞（如 kernel、openssl）
- 查看某个组件的安全公告
- 了解漏洞的 CVSS 评分、状态、受影响产品等信息

**查询关键词示例：**
- CVE 编号：CVE-2024-1234、CVE-2023-5678
- 软件包名：kernel、openssl、glibc、python
- 组件名：nginx、apache、mysql
- 关键词：可以是任何相关的搜索词

**返回信息包括：**
- CVE ID（漏洞编号）
- 摘要（漏洞描述）
- CVSS 评分（漏洞严重程度）
- 状态（如已修复、进行中等）
- 发布时间和更新时间
- 受影响的组件和产品
- 软件包名称
- 安全公告编号

**分页说明：**
- 默认每页显示 20 条记录
- 可以通过 page 参数查看不同页的结果
- 可以通过 page_size 参数调整每页显示的记录数（最大 1000）`,
  inputSchema: {
    type: "object",
    required: ["keyword"],
    properties: {
      keyword: {
        type: "string",
        description: "查询关键词。可以是 CVE 编号（如 'CVE-2024-1234'）、软件包名（如 'kernel'、'openssl'）、组件名或其他相关关键词。",
      },
      page: {
        type: "number",
        description: "页码，从 1 开始。默认为 1。",
        default: 1,
        minimum: 1,
      },
      page_size: {
        type: "number",
        description: "每页显示的记录数。默认为 20，最大 1000。",
        default: 20,
        minimum: 1,
        maximum: 1000,
      },
    },
  },
};
