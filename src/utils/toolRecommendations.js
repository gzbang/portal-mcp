const TOOL_RECOMMENDATIONS = {
  get_sig_info: {
    related: ["get_meeting_info", "get_organization_info", "get_docs_search_content"],
    scenarios: {
      meeting: "如需了解该 SIG 的会议安排，可使用 get_meeting_info 查询",
      docs: "如需了解该 SIG 相关的技术文档，可使用 get_docs_search_content 搜索",
      organization: "如需了解治理委员会信息，请使用 get_organization_info 查询"
    }
  },
  
  get_cve_info: {
    related: ["get_security_notice_info", "get_package_info", "get_docs_search_content"],
    scenarios: {
      security_notice: "如需了解相关安全公告详情，可使用 get_security_notice_info 查询",
      package: "如需了解受影响软件包详情，可使用 get_package_info 查询",
      docs: "如需了解漏洞修复方案，可使用 get_docs_search_content 搜索相关文档"
    }
  },
  
  get_security_notice_info: {
    related: ["get_cve_info", "get_bug_notice_info", "get_package_info"],
    scenarios: {
      cve: "如需了解 CVE 漏洞详情，可使用 get_cve_info 查询",
      bug: "如需了解缺陷修复公告，可使用 get_bug_notice_info 查询",
      package: "如需了解受影响软件包详情，可使用 get_package_info 查询"
    }
  },
  
  get_bug_notice_info: {
    related: ["get_security_notice_info", "get_package_info", "get_docs_search_content"],
    scenarios: {
      security: "如需了解安全公告，可使用 get_security_notice_info 查询",
      package: "如需了解受影响软件包详情，可使用 get_package_info 查询",
      docs: "如需了解缺陷修复方案，可使用 get_docs_search_content 搜索"
    }
  },
  
  get_package_info: {
    related: ["get_cve_info", "get_docs_search_content", "get_forum_info"],
    scenarios: {
      security: "如需了解软件包安全问题，可使用 get_cve_info 查询",
      docs: "如需了解软件包使用文档，可使用 get_docs_search_content 搜索",
      forum: "如需了解软件包相关讨论，可使用 get_forum_info 搜索"
    }
  },
  
  get_docs_search_content: {
    related: ["get_forum_info", "get_sig_info", "get_package_info"],
    scenarios: {
      forum: "如需了解社区相关讨论，可使用 get_forum_info 搜索相同关键词",
      sig: "如需了解相关 SIG 信息，可使用 get_sig_info 查询",
      package: "如需了解相关软件包，可使用 get_package_info 查询"
    }
  },
  
  get_forum_info: {
    related: ["get_docs_search_content", "get_sig_info", "get_search_info"],
    scenarios: {
      docs: "如需了解官方技术文档，可使用 get_docs_search_content 搜索",
      sig: "如需了解相关 SIG 信息，可使用 get_sig_info 查询",
      portal: "如需全站搜索更多信息，可使用 get_search_info 搜索"
    }
  },
  
  get_download_info: {
    related: ["get_compatibility_info", "get_docs_version", "get_docs_search_content"],
    scenarios: {
      compatibility: "如需了解硬件兼容性信息，可使用 get_compatibility_info 查询",
      docs: "如需了解安装文档，可使用 get_docs_search_content 搜索 '安装'",
      version: "如需了解版本生命周期，可使用 get_docs_version 或 get_package_info lifecycle 查询"
    }
  },
  
  get_compatibility_info: {
    related: ["get_download_info", "get_docs_search_content", "get_forum_info"],
    scenarios: {
      download: "如需下载系统镜像，可使用 get_download_info 查询",
      docs: "如需了解硬件安装文档，可使用 get_docs_search_content 搜索",
      forum: "如需了解硬件相关讨论，可使用 get_forum_info 搜索"
    }
  },
  
  get_meeting_info: {
    related: ["get_sig_info", "get_organization_info", "execute_user_operation"],
    scenarios: {
      sig: "如需了解 SIG 详细信息，可使用 get_sig_info 查询",
      organization: "如需了解治理委员会信息，可使用 get_organization_info 查询",
      my_meeting: "如需查询您参加的会议或创建会议，可使用 execute_user_operation"
    }
  },
  
  get_showcase_info: {
    related: ["get_forum_info", "get_docs_search_content", "get_sig_info"],
    scenarios: {
      forum: "如需了解相关实践经验讨论，可使用 get_forum_info 搜索",
      docs: "如需了解相关技术文档，可使用 get_docs_search_content 搜索",
      sig: "如需了解相关 SIG 信息，可使用 get_sig_info 查询"
    }
  },
  
  get_oeep_info: {
    related: ["get_sig_info", "get_meeting_info", "get_docs_search_content"],
    scenarios: {
      sig: "如需了解相关 SIG 信息，可使用 get_sig_info 查询",
      meeting: "如需了解相关会议讨论，可使用 get_meeting_info 查询",
      docs: "如需了解提案相关文档，可使用 get_docs_search_content 搜索"
    }
  },
  
  get_organization_info: {
    related: ["get_sig_info", "get_meeting_info"],
    scenarios: {
      sig: "如需了解技术 SIG 信息，请使用 get_sig_info 查询",
      meeting: "如需了解委员会相关会议，可使用 get_meeting_info 查询"
    }
  },
  
  get_search_info: {
    related: ["get_docs_search_content", "get_forum_info", "get_sig_info"],
    scenarios: {
      docs: "如需精确搜索技术文档，可使用 get_docs_search_content",
      forum: "如需精确搜索论坛讨论，可使用 get_forum_info",
      sig: "如需查询 SIG 信息，可使用 get_sig_info"
    }
  },
  
  execute_user_operation: {
    related: ["get_sig_info", "get_meeting_info", "get_organization_info"],
    scenarios: {
      sig: "如需了解 SIG 详细信息，可使用 get_sig_info 查询",
      meeting: "如需查询公开会议信息，可使用 get_meeting_info 查询",
      organization: "如需了解治理委员会信息，可使用 get_organization_info 查询"
    }
  },
  
  get_development_info: {
    related: ["get_sig_info", "get_docs_search_content", "get_forum_info"],
    scenarios: {
      sig: "如需了解用户参与的 SIG，可使用 get_sig_info 查询",
      docs: "如需了解相关开发文档，可使用 get_docs_search_content 搜索",
      forum: "如需了解开发相关讨论，可使用 get_forum_info 搜索"
    }
  }
};

function generateRecommendation(toolName, context = {}) {
  const recommendations = TOOL_RECOMMENDATIONS[toolName];
  
  if (!recommendations) {
    return "";
  }
  
  const { keyword, sigName, packageName, cveId } = context;
  
  let output = "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  output += "💡 **相关工具推荐：**\n\n";
  
  const relatedTools = recommendations.related || [];
  const scenarios = recommendations.scenarios || {};
  
  if (scenarios.docs) {
    output += `- ${scenarios.docs}`;
    if (keyword) output += `（关键词："${keyword}"）`;
    output += "\n";
  }
  
  if (scenarios.forum) {
    output += `- ${scenarios.forum}`;
    if (keyword) output += `（关键词："${keyword}"）`;
    output += "\n";
  }
  
  if (scenarios.sig && sigName) {
    output += `- ${scenarios.sig}`;
    output += "\n";
  }
  
  if (scenarios.package && packageName) {
    output += `- ${scenarios.package}`;
    output += "\n";
  }
  
  if (scenarios.cve && cveId) {
    output += `- ${scenarios.cve}`;
    output += "\n";
  }
  
  if (scenarios.security) {
    output += `- ${scenarios.security}\n`;
  }
  
  if (scenarios.meeting) {
    output += `- ${scenarios.meeting}\n`;
  }
  
  if (scenarios.organization) {
    output += `- ${scenarios.organization}\n`;
  }
  
  if (scenarios.compatibility) {
    output += `- ${scenarios.compatibility}\n`;
  }
  
  if (scenarios.download) {
    output += `- ${scenarios.download}\n`;
  }
  
  if (scenarios.portal) {
    output += `- ${scenarios.portal}`;
    if (keyword) output += `（关键词："${keyword}"）`;
    output += "\n";
  }
  
  if (scenarios.my_meeting) {
    output += `- ${scenarios.my_meeting}\n`;
  }
  
  if (scenarios.version) {
    output += `- ${scenarios.version}\n`;
  }
  
  output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  
  return output;
}

function detectContext(toolName, args) {
  const context = {};
  
  if (args.keyword) context.keyword = args.keyword;
  if (args.sig_name) context.sigName = args.sig_name;
  if (args.package_name) context.packageName = args.package_name;
  if (args.cve_id) context.cveId = args.cve_id;
  if (args.query) context.keyword = args.query;
  
  return context;
}

export function appendRecommendation(result, toolName, args = {}) {
  if (!result || typeof result !== "string") {
    return result;
  }
  
  const context = detectContext(toolName, args);
  const recommendation = generateRecommendation(toolName, context);
  
  if (recommendation && !result.includes("相关工具推荐")) {
    return result + recommendation;
  }
  
  return result;
}

export { TOOL_RECOMMENDATIONS };