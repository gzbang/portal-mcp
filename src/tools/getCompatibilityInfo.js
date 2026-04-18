import { addField, addFields, addIndentedField, addIndentedFields } from "../utils/formatHelpers.js";

// 数据源 URL
const WHOLE_MACHINE_URL = "https://www.openeuler.openatom.cn/api-cve/cve-security-notice-server/hardwarecomp/findAll";
const WHOLE_MACHINE_DETAIL_URL = "https://www.openeuler.openatom.cn/api-cve/cve-security-notice-server/hardwarecomp/getOne";
const BOARD_CARD_URL = "https://www.openeuler.openatom.cn/api-cve/cve-security-notice-server/drivercomp/findAll";

// 缓存数据和过期时间（15分钟）
let cachedWholeData = null;
let wholeDataExpiry = 0;
let cachedBoardData = null;
let boardDataExpiry = 0;
const CACHE_DURATION = 15 * 60 * 1000;

// 查询整机测试列表
async function fetchWholeCompatibility(architecture = "", os = "", keyword = "", page = 1, size = 10) {
  const now = Date.now();
  const cacheKey = `${architecture}-${os}-${keyword}-${page}-${size}`;

  // 简单缓存检查（仅缓存第一页默认大小的查询）
  if (page === 1 && size === 10 && cachedWholeData && now < wholeDataExpiry &&
      cachedWholeData.key === cacheKey) {
    return cachedWholeData.data;
  }

  const requestBody = {
    pages: { page, size }
  };

  if (architecture) requestBody.architecture = architecture;
  if (os) requestBody.os = os;
  if (keyword) requestBody.keyword = keyword;

  const response = await fetch(WHOLE_MACHINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`获取整机兼容性测试列表失败：HTTP ${response.status}`);
  }

  const data = await response.json();

  // 更新缓存
  if (page === 1 && size === 10) {
    cachedWholeData = { key: cacheKey, data };
    wholeDataExpiry = now + CACHE_DURATION;
  }

  return data;
}

// 查询整机详情
async function fetchWholeDetail(id) {
  const url = `${WHOLE_MACHINE_DETAIL_URL}?id=${id}`;

  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`获取整机详情失败：HTTP ${response.status}`);
  }

  return await response.json();
}

// 查询板卡测试列表
async function fetchBoardCompatibility(architecture = "", os = "", keyword = "", cardType = "", page = 1, size = 10) {
  const now = Date.now();
  const cacheKey = `${architecture}-${os}-${keyword}-${cardType}-${page}-${size}`;

  // 简单缓存检查（仅缓存第一页默认大小的查询）
  if (page === 1 && size === 10 && cachedBoardData && now < boardDataExpiry &&
      cachedBoardData.key === cacheKey) {
    return cachedBoardData.data;
  }

  const requestBody = {
    pages: { page, size }
  };

  if (architecture) requestBody.architecture = architecture;
  if (os) requestBody.os = os;
  if (keyword) requestBody.keyword = keyword;
  if (cardType) requestBody.cardType = cardType;

  const response = await fetch(BOARD_CARD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`获取板卡兼容性测试列表失败：HTTP ${response.status}`);
  }

  const data = await response.json();

  // 更新缓存
  if (page === 1 && size === 10) {
    cachedBoardData = { key: cacheKey, data };
    boardDataExpiry = now + CACHE_DURATION;
  }

  return data;
}

// 主查询函数
export async function getCompatibilityInfo(queryType = "whole", architecture = "", os = "", keyword = "", cardType = "") {
  try {
    // 固定返回前10条
    const page = 1;
    const size = 10;

    if (queryType === "whole") {
      // 查询整机测试列表
      const data = await fetchWholeCompatibility(architecture, os, keyword, page, size);

      if (!data || data.code !== 0 || !data.result) {
        return "暂无整机兼容性测试信息。";
      }

      const list = data.result.hardwareCompList || [];
      const total = data.result.totalCount || 0;

      // 如果只有一条记录，自动查询详情
      if (list.length === 1 && total === 1) {
        const hardwareId = list[0].id;
        const detailData = await fetchWholeDetail(hardwareId);
        return formatWholeDetail(detailData, list[0]);
      }

      // 如果有多条记录，返回列表并引导用户缩小范围
      if (list.length > 1) {
        let result = formatWholeCompatibility(data, architecture, os, keyword);
        result += "\n💡 提示：找到多条记录。如需查看详细信息，请提供更具体的条件（如厂商名、型号等）以缩小到单条记录。";
        return result;
      }

      // 没有记录
      return formatWholeCompatibility(data, architecture, os, keyword);

    } else if (queryType === "board") {
      // 查询板卡测试列表
      const data = await fetchBoardCompatibility(architecture, os, keyword, cardType, page, size);
      return formatBoardCompatibility(data, architecture, os, keyword, cardType);
    } else {
      return `不支持的查询类型：${queryType}。支持的类型：whole（整机）、board（板卡）`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时，请稍后重试。`;
    }
    return `查询兼容性测试信息时发生错误：${e.message}`;
  }
}

// 格式化整机兼容性测试列表
function formatWholeCompatibility(data, architecture, os, keyword) {
  if (!data || data.code !== 0 || !data.result) {
    return "暂无整机兼容性测试信息。";
  }

  const result = data.result;
  const list = result.hardwareCompList || [];
  const total = result.totalCount || 0;

  let output = "=== openEuler 整机兼容性测试列表 ===\n\n";

  const conditions = [architecture && `架构: ${architecture}`, os && `操作系统: ${os}`, keyword && `关键词: ${keyword}`].filter(Boolean);
  if (conditions.length > 0) {
    output += `查询条件: ${conditions.join(', ')}\n`;
  }

  output += `共找到 ${total} 条记录，显示前 ${Math.min(list.length, 10)} 条\n\n`;

  if (list.length === 0) {
    output += "未找到符合条件的测试记录。\n";
    return output;
  }

  const itemFields = [
    { field: 'cpu', label: 'CPU' },
    { field: 'architecture', label: '架构' },
    { field: 'osVersion', label: '系统版本' },
    { field: 'mainboardModel', label: '主板型号' },
    { field: 'ram', label: '内存' },
    { field: 'certificationTime', label: '认证时间' },
    { field: 'certificationAddr', label: '认证地址' },
    { field: 'friendlyLink', label: '产品链接' },
  ];

  list.forEach((item, index) => {
    output += `${index + 1}. ${item.hardwareFactory || '未知厂商'} - ${item.hardwareModel || '未知型号'}\n`;
    output = addIndentedFields(output, item, itemFields, 3);
    output += '\n';
  });

  if (total > 10) {
    output += `提示：还有 ${total - 10} 条记录未显示\n`;
  }

  return output;
}

// 格式化整机详情
function formatWholeDetail(data, basicInfo) {
  if (!data || data.code !== 0 || !data.result) {
    return "暂无整机详细信息。";
  }

  const detail = data.result;

  let output = "=== 整机兼容性详细信息 ===\n\n";

  output += "【基本信息】\n";
  output += `硬件厂商: ${detail.hardwareFactory || '未知'}\n`;
  output += `硬件型号: ${detail.hardwareModel || '未知'}\n`;
  output += `CPU: ${detail.cpu || '未知'}\n`;
  output += `架构: ${detail.architecture || '未知'}\n`;
  output += `系统版本: ${detail.osVersion || '未知'}\n`;
  output += `认证时间: ${detail.certificationTime || '未知'}\n\n`;

  output += "【硬件配置】\n";
  output = addFields(output, detail, [
    { field: 'mainboardModel', label: '主板型号' },
    { field: 'ram', label: '内存' },
    { field: 'hardDiskDrive', label: '硬盘' },
    { field: 'videoAdapter', label: '显卡' },
    { field: 'hostBusAdapter', label: '主机总线适配器' },
    { field: 'biosUefi', label: 'BIOS/UEFI' },
    { field: 'portsBusTypes', label: '端口/总线类型' },
  ]);
  output += '\n';

  output += "【认证信息】\n";
  output = addFields(output, detail, [
    { field: 'certificationTime', label: '认证时间' },
    { field: 'certificationAddr', label: '认证地址' },
    { field: 'commitID', label: '提交ID' },
  ]);
  output += '\n';

  output += "【产品信息】\n";
  output = addFields(output, detail, [
    { field: 'friendlyLink', label: '产品链接' },
    { field: 'productInformation', label: '产品信息' },
  ]);
  output += '\n';

  if (detail.boardCards?.length > 0) {
    output += "【板卡信息】\n";
    const cardFields = [
      { field: 'chipVendor', label: '芯片厂商' },
      { field: 'boardModel', label: '板卡型号' },
      { field: 'chipModel', label: '芯片型号' },
      { field: 'boardCardType', label: '板卡类型' },
    ];
    detail.boardCards.forEach((card, index) => {
      output += `${index + 1}. ${card.boardCards || '未知板卡'}\n`;
      output = addIndentedFields(output, card, cardFields, 3);
    });
    output += '\n';
  }

  return output;
}

function formatBoardCompatibility(data, architecture, os, keyword, cardType) {
  if (!data || data.code !== 0 || !data.result) {
    return "暂无板卡兼容性测试信息。";
  }

  const result = data.result;
  const list = result.driverCompList || [];
  const total = result.totalCount || 0;

  let output = "=== openEuler 板卡兼容性测试列表 ===\n\n";

  const conditions = [architecture && `架构: ${architecture}`, os && `操作系统: ${os}`, keyword && `关键词: ${keyword}`, cardType && `板卡类型: ${cardType}`].filter(Boolean);
  if (conditions.length > 0) {
    output += `查询条件: ${conditions.join(', ')}\n`;
  }

  output += `共找到 ${total} 条记录，显示前 ${Math.min(list.length, 10)} 条\n\n`;

  if (list.length === 0) {
    output += "未找到符合条件的测试记录。\n";
    return output;
  }

  const itemFields = [
    { field: 'chipVendor', label: '芯片厂商' },
    { field: 'boardModel', label: '板卡型号' },
    { field: 'chipModel', label: '芯片型号' },
    { field: 'boardCardType', label: '板卡类型' },
    { field: 'architecture', label: '架构' },
    { field: 'osVersion', label: '系统版本' },
    { field: 'driverName', label: '驱动名称' },
    { field: 'driverVersion', label: '驱动版本' },
    { field: 'certificationTime', label: '认证时间' },
    { field: 'certificationAddr', label: '认证地址' },
    { field: 'testOrganization', label: '测试机构' },
    { field: 'testResult', label: '测试结果' },
    { field: 'friendlyLink', label: '产品链接' },
  ];

  list.forEach((item, index) => {
    output += `${index + 1}. ${item.boardCards || '未知板卡'}\n`;
    output = addIndentedFields(output, item, itemFields, 3);
    output += '\n';
  });

  if (total > 10) {
    output += `提示：还有 ${total - 10} 条记录未显示\n`;
  }

  return output;
}

// 工具定义
export const toolDefinition = {
  name: "get_compatibility_info",
  description: `查询 openEuler 兼容性测试列表信息。

本工具用于查询 openEuler 社区的硬件兼容性测试信息，包括整机兼容性测试和板卡兼容性测试。

**使用场景：**
- 查询某个架构下的整机兼容性测试列表
- 查询某个操作系统版本的板卡兼容性测试列表
- 搜索特定厂商或型号的兼容性测试信息
- 按板卡类型筛选板卡兼容性测试
- 了解硬件设备在 openEuler 上的认证状态

**查询类型：**

1. 整机兼容性测试：query_type = "whole"
   - 查询整机（服务器、PC等）的兼容性测试信息
   - 返回硬件厂商、型号、CPU、架构、操作系统、认证时间等信息

2. 板卡兼容性测试：query_type = "board"
   - 查询板卡（网卡、显卡、RAID卡等）的兼容性测试信息
   - 返回板卡名称、芯片厂商、型号、驱动信息、下载链接等信息
   - 支持按板卡类型筛选（card_type 参数）

**查询参数：**
- architecture: 架构（如 x86_64、aarch64）
- os: 操作系统（如 openEuler-22.03-LTS-SP4）
- keyword: 关键词（可以是厂商名、型号等）
- card_type: 板卡类型（仅板卡查询时有效，如 网卡、显卡、RAID卡等）

**返回信息：**
- 整机测试：硬件厂商、型号、CPU、架构、操作系统版本、主板型号、内存、认证时间、产品链接
- 板卡测试：板卡名称、芯片厂商、板卡型号、芯片型号、板卡类型、驱动信息、下载链接、认证时间

**注意：**
- 每次查询固定返回前 10 条记录
- 支持多个条件组合查询
- 所有参数都是可选的，不传参数则返回所有记录`,
  inputSchema: {
    type: "object",
    required: ["query_type"],
    properties: {
      query_type: {
        type: "string",
        enum: ["whole", "board"],
        description: "查询类型：'whole'（整机兼容性测试）、'board'（板卡兼容性测试）。"
      },
      architecture: {
        type: "string",
        description: "架构，如 'x86_64'、'aarch64'。可选参数。",
        default: ""
      },
      os: {
        type: "string",
        description: "操作系统，如 'openEuler-22.03-LTS-SP4'、'openEuler-24.03-LTS'。可选参数。",
        default: ""
      },
      keyword: {
        type: "string",
        description: "关键词，可以是厂商名、型号等。可选参数。",
        default: ""
      },
      card_type: {
        type: "string",
        description: "板卡类型，如 '网卡'、'显卡'、'RAID卡'等。仅在 query_type 为 'board' 时有效。可选参数。",
        default: ""
      }
    }
  }
};
