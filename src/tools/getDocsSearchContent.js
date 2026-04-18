import { appendRecommendation } from "../utils/toolRecommendations.js";

// 搜索 openEuler 文档内容
export async function getDocsSearchContent(args = {}) {
  try {
    const { keyword, lang = 'zh', version } = args;
    const usedVersion = version || '24.03_LTS';

    if (!keyword) {
      return `搜索失败：缺少必要参数 keyword。`;
    }

    if (!['zh', 'en'].includes(lang)) {
      return `搜索失败：lang 参数必须是 zh 或 en。`;
    }

    const url = `https://docs.openeuler.openatom.cn/api-search/search/sort/docs`;
    const requestBody = { 
      keyword, 
      lang,
      version: usedVersion,
      page: 1,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://docs.openeuler.openatom.cn",
        "referer": "https://docs.openeuler.openatom.cn"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = await response.json();

      const sections = [];
      sections.push(`
╔════════════════════════════════════════════════════════════╗
║  openEuler 文档搜索结果                                   ║
╚════════════════════════════════════════════════════════════╝`);

      sections.push(`\n搜索词: ${keyword}`);
      sections.push(`语言: ${lang === 'zh' ? '中文' : '英文'}`);
      sections.push(`版本: ${usedVersion}${!version ? '（默认使用最新版本）' : ''}`);

      if (Array.isArray(data?.obj?.records)) {
        sections.push(`\n共找到 ${data.obj.records.length} 个搜索结果\n`);

        data.obj.records.forEach((item, index) => {
          const cleanTitle = item.title ? item.title.replace(/<[^>]*>/g, '') : '无标题';
          const cleanContent = item.textContent ? item.textContent.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '无内容';
          
          const docUrl = `https://docs.openeuler.openatom.cn/${item.path}.html`;

          sections.push(`\n【结果 ${index + 1}】`);
          sections.push(`  标题: ${cleanTitle}`);
          sections.push(`  内容: ${cleanContent}`);
          sections.push(`  版本: ${item.version || '未知'}`);
          sections.push(`  链接: ${docUrl}`);
        });
      } else {
        sections.push(`\n未找到搜索结果或返回数据格式不正确。`);
      }

      sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
      sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      let result = sections.join("\n");
      result = appendRecommendation(result, "get_docs_search_content", { keyword });
      return result;
    } else {
      return `搜索文档时 API 返回错误状态码：${response.status}`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时，请稍后重试。`;
    }
    return `搜索文档时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "get_docs_search_content",
  description: `搜索 openEuler 官方文档内容，包含安装指南、迁移工具、故障排查、技术特性等。

**⚠️ 重要提示：**
这是查询 openEuler 技术文档的核心工具。只要用户问题涉及 openEuler 的使用、配置、故障排查、迁移等，都应该优先使用本工具搜索官方文档。

**适用场景（非常广泛）：**
- 迁移工具使用：x2openEuler、CentOS 迁移、升级迁移、兼容性评估
- 故障排查：安装失败、启动异常、配置错误、运行报错、性能问题、日志分析
- 环境部署：内网环境、离线安装、最小化安装、图形界面安装、特殊硬件部署
- 系统配置：网络配置、存储管理、安全加固、防火墙、SELinux、用户权限
- 软件管理：DNF/YUM 使用、软件包安装、仓库配置、依赖问题解决
- 服务搭建：Web 服务器、数据库、容器、虚拟化、Kubernetes、存储服务
- 内核特性：调度器、内存管理、文件系统、驱动模块、内核参数调优
- 性能调优：CPU 调优、内存优化、磁盘性能、网络性能、应用优化
- 安全特性：安全加固、漏洞修复、加密配置、认证机制、审计日志
- 开发环境：编译工具、开发库、调试工具、测试框架、构建系统
- 项目工具：A-Ops、SysOM、Nutshell、Stratovirt、iSulad 等项目使用指南
- 技术特性：eBPF、Kylin、UKI、热迁移、内存快照、DPU 加速等特性说明

**关键词示例：**
- 迁移类：x2openEuler、CentOS 迁移、升级迁移、迁移工具、兼容性
- 故障类：安装失败、启动失败、配置错误、运行异常、报错、无法启动
- 环境类：内网安装、离线部署、最小化安装、特殊环境、局域网部署
- 配置类：网络配置、防火墙配置、存储配置、SELinux 配置
- 服务类：Apache、Nginx、MySQL、Docker、Kubernetes、虚拟化
- 性能类：性能调优、内核优化、内存管理、调度器、资源限制
- 安全类：安全加固、漏洞修复、SELinux、防火墙、审计

**返回信息：**
- 搜索结果列表（标题、摘要、版本、链接）
- 每条结果的内容摘要（已清理 HTML 标签）
- 文档链接可直接访问查看完整内容

**参数说明：**
- keyword: 搜索关键词（必填），支持中英文，可包含工具名、报错信息、技术术语等
- version: 版本号（可选），建议使用最新版本如 24.03_LTS，不指定时自动使用最新版本
- lang: 语言，zh 或 en（默认 zh）

**示例问题（强烈建议参考）：**
- "x2openEuler 安装失败怎么办？"
- "CentOS 6.9 迁移到 openEuler 的详细步骤"
- "内网环境如何部署 openEuler？"
- "openEuler 启动后无法连接网络"
- "DNF 安装软件包报错依赖冲突"
- "如何配置 openEuler 的防火墙？"
- "openEuler 性能调优的最佳实践"
- "eBPF 在 openEuler 中如何使用？"
- "容器运行时 iSulad 的配置方法"
- "Stratovirt 虚拟化功能介绍"`,
  inputSchema: {
    type: "object",
    properties: {
      keyword: {
        type: "string",
        description: "搜索关键词（必填）。可以是工具名称（如 'x2openEuler'）、技术术语（如 'eBPF'）、问题描述（如 '安装失败'）、配置项（如 '防火墙配置'）等。支持中英文，建议使用具体关键词。"
      },
      lang: {
        type: "string",
        description: "搜索语言：zh（中文，默认）或 en（英文）。",
        enum: ["zh", "en"],
        default: "zh"
      },
      version: {
        type: "string",
        description: "文档版本号（可选）。建议使用最新版本如 '24.03_LTS'，不指定时将自动使用最新版本。如需查询其他版本，可调用 get_docs_version 获取版本列表。"
      }
    },
    required: ["keyword"]
  },
};
