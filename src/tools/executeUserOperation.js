import { addField, addFields, addIndentedField, addIndentedFields, truncate, formatByMapping } from "../utils/formatHelpers.js";

// API 主域名（当前使用测试环境，后续切换到生产环境时修改此处）
const MEETING_API_BASE_URL = "https://openeuler.test.osinfra.cn";

const SOFTWARE_PKG_URL = "https://software-pkg.openeuler.org";
const MEETING_API_URL = `${MEETING_API_BASE_URL}/api-meeting-v2`;

const OPERATION_TYPE_LABELS = {
  check_cla: "CLA 签署状态查询",
  check_sig_groups: "SIG 组身份查询",
  check_my_meetings: "我参加的会议查询",
  create_meeting: "创建会议",
  cancel_meeting: "取消会议",
  cancel_sub_meeting: "取消子会议",
};

const CYCLE_TYPE_LABELS = {
  0: "每天",
  1: "每周",
  2: "每月",
};

const TOKEN_CONFIG_GUIDE = `\n⚠️ **未配置 Token**\n\n请先配置您的 OPENEULER_TOKEN 以使用此功能。\n\n💡 **如何配置：**\n1. 登录 [openEuler 软件包平台](https://software-pkg.openeuler.org/)\n2. 进入个人设置页面获取令牌\n3. 在 MCP Server 配置中添加环境变量：\n   \`OPENEULER_TOKEN=your_token_here\`\n\n配置方式：\n- Claude Code: 在 \`~/.claude.json\` 的 mcpServers 配置中添加 \`env\` 字段\n- Cursor: 在 MCP 配置中添加环境变量\n- 命令行: \`OPENEULER_TOKEN=xxx npx openeuler-portal-mcp\``;

const TOKEN_INVALID_GUIDE = `\n⚠️ **Token 验证失败**\n\n您配置的 OPENEULER_TOKEN 无效或已过期。\n\n💡 **如何获取 Token：**\n1. 登录 [openEuler 软件包平台](https://software-pkg.openeuler.org/)\n2. 进入个人设置页面\n3. 生成或复制您的个人令牌\n4. 将令牌配置到 MCP Server 的 OPENEULER_TOKEN 环境变量中`;

async function checkClaStatus(token) {
  const response = await fetch(`${SOFTWARE_PKG_URL}/api/v1/cla`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function checkSigGroups(token) {
  const response = await fetch(`${MEETING_API_URL}/meeting/web/group_info/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data };
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function checkMyMeetings(token, month) {
  const queryMonth = month || getCurrentMonth();
  const url = `${MEETING_API_URL}/meeting/web/?page=1&size=50&order_by=date&order_type=asc&month=${queryMonth}&sponsor=`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data, month: queryMonth };
}

async function getPlatforms(token) {
  const response = await fetch(`${MEETING_API_URL}/meeting/web/platform/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function createMeeting(token, meetingData) {
  const response = await fetch(`${MEETING_API_URL}/meeting/web/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    body: JSON.stringify(meetingData),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function cancelMeeting(token, meetingId) {
  const response = await fetch(`${MEETING_API_URL}/meeting/web/${meetingId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data, meetingId };
}

async function cancelSubMeeting(token, subId) {
  const response = await fetch(`${MEETING_API_URL}/meeting/web/meeting/sub/${subId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "token": token,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  return { status: response.status, data, subId };
}

function formatClaResult(result) {
  const { status, data } = result;

  const NOT_SIGNED_MESSAGE = `\n❌ **CLA 签署状态：未签署**\n\n您尚未签署 openEuler CLA 协议。\n\n💡 **如何签署：**\n1. 登录 [openEuler 软件包平台](https://software-pkg.openeuler.org/)\n2. 点击页面右上角的「Sign CLA」按钮\n3. 使用 Gitee/AtomGit 账号授权登录\n4. 完成 CLA 协议签署\n\n签署后，您即可参与 openEuler 社区的代码贡献。`;

  if (status === 403) {
    return (data?.msg?.code === 1004) ? NOT_SIGNED_MESSAGE : TOKEN_INVALID_GUIDE;
  }

  const formatSignedCla = (claInfo) => {
    let output = `\n✅ **CLA 签署状态：已签署**\n\n`;
    output = addFields(output, claInfo, [
      { field: 'sign_time', label: '签署时间' },
      { field: 'sign_type', label: '签署类型' },
    ]);
    if (claInfo.user_name || claInfo.gitee_id) {
      output += `签署账号：${claInfo.user_name || claInfo.gitee_id}\n`;
    }
    output += `\n您已成功签署 openEuler CLA 协议，可以参与社区代码贡献。`;
    return output;
  };

  if (data?.data) {
    const claInfo = data.data;
    if (claInfo.signed === true) return formatSignedCla(claInfo);
    if (claInfo.signed === false) return NOT_SIGNED_MESSAGE;
  }

  if (data?.code === "success") {
    return formatSignedCla(data.data || {});
  }

  return `\n⚠️ **查询结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

function formatSigGroupsResult(result) {
  const { status, data } = result;

  if (status === 403 || data?.code === 403) {
    return TOKEN_INVALID_GUIDE;
  }

  const NO_SIG_MESSAGE = `\n📋 **SIG 组身份查询结果**\n\n您目前不是任何 SIG 组的 maintainer 或 committer。\n\n💡 **如何加入 SIG 组：**\n1. 找到感兴趣的 SIG 组（可使用 get_sig_info 工具查询）\n2. 通过 SIG 的邮件列表或会议与 maintainer 沟通\n3. 申请成为 contributor 或 committer\n4. 经 maintainer 审核通过后加入`;

  if (data?.code === 200 && data.data) {
    const groups = data.data;
    
    if (!groups?.length) return NO_SIG_MESSAGE;

    let output = `\n📋 **SIG 组身份查询结果**\n\n`;
    output += `您是以下 **${groups.length}** 个 SIG 组的 maintainer/committer：\n\n`;
    
    groups.forEach((group, i) => {
      output += `**${i + 1}. ${group.group_name}**\n`;
      output = addIndentedFields(output, group, [
        { field: 'email_list', label: '邮件列表' },
        { field: 'etherpad', label: '会议协作文档' },
      ], 3);
      output += `\n`;
    });

    output += `---\n💡 提示：作为 maintainer/committer，您可以参与 SIG 组的会议预定、代码审核等管理工作。`;
    return output;
  }

  if (data?.code === 0 && data.data) {
    const groups = data.data;
    
    if (!groups || Object.keys(groups).length === 0) return NO_SIG_MESSAGE;

    let output = `\n📋 **SIG 组身份查询结果**\n\n`;
    
    const maintainers = groups.maintainer_groups || [];
    const committers = groups.committer_groups || [];

    if (maintainers.length > 0) {
      output += `**您是以下 SIG 的 Maintainer（${maintainers.length} 个）：**\n`;
      maintainers.forEach((sig, i) => output += `   ${i + 1}. ${sig}\n`);
      output += `\n`;
    }

    if (committers.length > 0) {
      output += `**您是以下 SIG 的 Committer（${committers.length} 个）：**\n`;
      committers.forEach((sig, i) => output += `   ${i + 1}. ${sig}\n`);
      output += `\n`;
    }

    output += `---\n💡 提示：作为 maintainer/committer，您可以参与 SIG 组的会议预定、代码审核等管理工作。`;
    return output;
  }

  return `\n⚠️ **查询结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

function formatMeeting(meeting, index) {
  let output = `${index + 1}. **${meeting.topic || '未知议题'}**\n`;

  if (meeting.group_name || meeting.sig_name) {
    output += `   SIG 组: ${meeting.group_name || meeting.sig_name}\n`;
  }

  output = addIndentedFields(output, meeting, [
    { field: 'platform', label: '会议平台' },
  ], 3);

  if (meeting.is_cycle) {
    output += `   会议类型: 🔄 周期性会议\n`;
    if (meeting.cycle_start_date && meeting.cycle_end_date) {
      output += `   周期范围: ${meeting.cycle_start_date} 至 ${meeting.cycle_end_date}\n`;
    }
    output = addIndentedFields(output, meeting, [
      { field: 'cycle_start', label: '周期时间', formatter: v => `${v} - ${meeting.cycle_end}` },
      { field: 'cycle_interval', label: '周期间隔', formatter: v => `每 ${v} 天` },
    ], 3);
    
    if (meeting.cycle_sub?.length > 0) {
      output += `   子会议数: ${meeting.cycle_sub.length} 场\n`;
      meeting.cycle_sub.slice(0, 3).forEach((sub, i) => {
        output += `      ${i + 1}. ${sub.date} ${sub.start}-${sub.end}\n`;
      });
      if (meeting.cycle_sub.length > 3) {
        output += `      ... 共 ${meeting.cycle_sub.length} 场子会议\n`;
      }
    }
  } else {
    output = addIndentedField(output, meeting, 'date', '日期', 3);
    const start = meeting.start || meeting.start_time;
    const end = meeting.end || meeting.end_time;
    if (start || end) {
      output += `   时间: ${start || '?'} - ${end || '?'}\n`;
    }
  }

  output = addIndentedFields(output, meeting, [
    { field: 'mid', label: '会议 ID' },
    { field: 'join_url', label: '会议链接' },
    { field: 'etherpad', label: '协作文档' },
    { field: 'sponsor', label: '发起人' },
    { field: 'email_list', label: '邮件列表' },
  ], 3);

  if (meeting.agenda || meeting.summary) {
    output += `   议程: ${truncate(meeting.agenda || meeting.summary, 100)}\n`;
  }

  return output;
}

function formatMyMeetingsResult(result) {
  const { status, data, month } = result;

  if (status === 403 || data?.code === 403) {
    return TOKEN_INVALID_GUIDE;
  }

  if (data?.code === 200 && data.data) {
    const meetings = data.data;
    const total = data.total || meetings.length;

    if (!meetings?.length) {
      return `\n📅 **我参加的会议查询结果**\n\n查询月份：${month}\n\n❌ 该月份暂无您参加的会议。\n\n💡 提示：\n- 您可以尝试查询其他月份\n- 如果您是 SIG 组的 maintainer/committer，可以预定会议\n- 使用 get_meeting_info 工具查看社区公开会议`;
    }

    let output = `\n📅 **我参加的会议查询结果**\n\n`;
    output += `查询月份：${month}\n`;
    output += `共找到 ${total} 场会议${total > meetings.length ? `，显示前 ${meetings.length} 场` : ''}\n\n---\n\n`;

    meetings.slice(0, 20).forEach((meeting, index) => {
      output += formatMeeting(meeting, index) + '\n';
    });

    if (total > meetings.length) {
      output += `⚠️ 共 ${total} 场会议，当前仅显示前 ${meetings.length} 场。\n\n`;
    }

    output += `---\n数据来源: openEuler 会议系统\n查询时间: ${new Date().toLocaleString('zh-CN')}\n`;
    return output;
  }

  if (data?.code !== 200) {
    return `\n⚠️ **查询失败**\n\nAPI 返回错误：${data.msg || data.message || JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
  }

  return `\n⚠️ **查询结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

function formatCreateMeetingResult(result, meetingData) {
  const { status, data } = result;

  if (status === 403 || data?.code === 403) {
    return TOKEN_INVALID_GUIDE;
  }

  if (data?.code === 200) {
    let output = `\n✅ **会议创建成功**\n\n**会议信息：**\n`;
    output += `- 议题：${meetingData.topic}\n`;
    output += `- SIG 组：${meetingData.group_name}\n`;
    output += `- 平台：${meetingData.platform}\n`;
    
    if (meetingData.is_cycle) {
      output += `- 会议类型：🔄 周期性会议\n`;
      output += `- 周期类型：${formatByMapping(meetingData.cycle_type, CYCLE_TYPE_LABELS, '未知')}\n`;
      output += `- 周期范围：${meetingData.cycle_start_date} 至 ${meetingData.cycle_end_date}\n`;
      output += `- 周期时间：${meetingData.cycle_start} - ${meetingData.cycle_end}\n`;
      if (meetingData.cycle_interval) {
        const unit = CYCLE_TYPE_LABELS[meetingData.cycle_type] === '每天' ? '天' 
          : CYCLE_TYPE_LABELS[meetingData.cycle_type] === '每周' ? '周' : '月';
        output += `- 周期间隔：每 ${meetingData.cycle_interval} ${unit}\n`;
      }
      output = addField(output, meetingData, 'cycle_point', '重复日期', v => `重复日期：${v}`);
    } else {
      output += `- 会议类型：单次会议\n`;
      output += `- 日期：${meetingData.date}\n`;
      output += `- 时间：${meetingData.start} - ${meetingData.end}\n`;
    }
    
    if (typeof data.data === 'number') {
      output += `- 会议 ID：${data.data}\n`;
    }
    
    output += `- 协作文档：${meetingData.etherpad}\n`;
    output = addFields(output, meetingData, [
      { field: 'email_list', label: '邮件列表' },
      { field: 'agenda', label: '议程' },
    ]);
    
    if (meetingData.is_record) output += `- 录制：开启\n`;
    if (meetingData.is_private) output += `- 私密：开启\n`;
    
    output += meetingData.is_cycle 
      ? `\n💡 提示：周期会议已成功创建，系统将自动生成子会议。请在协作文档中查看具体安排。`
      : `\n💡 提示：会议已成功创建，请准时参会。会议链接将在会议开始前通过邮件发送给参会者。`;
    return output;
  }

  if (data?.code !== 200) {
    return `\n❌ **会议创建失败**\n\n错误信息：${data.msg || data.message || JSON.stringify(data)}\n\n请检查参数是否正确，或联系社区管理员。`;
  }

  return `\n⚠️ **创建结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

function formatCancelMeetingResult(result) {
  const { status, data, meetingId } = result;

  if (status === 403 || data?.code === 403) {
    return TOKEN_INVALID_GUIDE;
  }

  if (data?.code === 200) {
    return `\n✅ **会议取消成功**\n\n会议 ID ${meetingId} 已成功取消。\n\n💡 提示：\n- 如果是周期会议，所有子会议也将一并取消\n- 已通知参会人员会议取消\n- 如需重新预定，请使用 create_meeting 操作`;
  }

  if (data?.code === 400) {
    return `\n❌ **会议取消失败**\n\n${data.msg || '会议不存在或已取消'}\n\n请确认会议 ID 是否正确，或使用 check_my_meetings 查询您的会议列表。`;
  }

  if (data?.code !== 200) {
    return `\n❌ **会议取消失败**\n\n错误信息：${data.msg || data.message || JSON.stringify(data)}\n\n请稍后重试或联系社区管理员。`;
  }

  return `\n⚠️ **取消结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

function formatCancelSubMeetingResult(result) {
  const { status, data, subId } = result;

  if (status === 403 || data?.code === 403) {
    return TOKEN_INVALID_GUIDE;
  }

  if (data?.code === 200) {
    return `\n✅ **子会议取消成功**\n\n子会议 ID ${subId} 已成功取消。\n\n💡 提示：\n- 仅取消了指定的这一场子会议\n- 周期会议的其他子会议不受影响\n- 如需取消整个周期会议，请使用 cancel_meeting 操作`;
  }

  if (data?.code === 400) {
    return `\n❌ **子会议取消失败**\n\n${data.msg || '子会议不存在或已取消'}\n\n请确认子会议 ID 是否正确。您可以：\n1. 使用 check_my_meetings 查询周期会议\n2. 在 cycle_sub 列表中找到对应的 sub_id`;
  }

  if (data?.code !== 200) {
    return `\n❌ **子会议取消失败**\n\n错误信息：${data.msg || data.message || JSON.stringify(data)}\n\n请稍后重试或联系社区管理员。`;
  }

  return `\n⚠️ **取消结果未知**\n\nAPI 返回：${JSON.stringify(data)}\n\n请联系社区管理员或稍后重试。`;
}

export async function executeUserOperation(operationType, params = {}) {
  const validOperations = ["check_cla", "check_sig_groups", "check_my_meetings", "create_meeting", "cancel_meeting", "cancel_sub_meeting"];
  
  if (!validOperations.includes(operationType)) {
    return `❌ **不支持的操作类型**\n\n您请求的操作类型 "${operationType}" 暂不支持。\n\n当前支持的操作：\n1. check_cla - CLA 签署状态查询\n2. check_sig_groups - SIG 组身份查询\n3. check_my_meetings - 我参加的会议查询\n4. create_meeting - 创建会议\n5. cancel_meeting - 取消整个会议\n6. cancel_sub_meeting - 取消周期会议的子会议\n\n💡 提示：后续将支持更多操作（Issue 创建等）。`;
  }

  const token = process.env.OPENEULER_TOKEN;

  if (!token) {
    return TOKEN_CONFIG_GUIDE;
  }

  if (operationType === "check_cla") {
    try {
      const result = await checkClaStatus(token);
      return formatClaResult(result);
    } catch (e) {
      if (e.name === "AbortError") {
        return "网络请求超时，请稍后重试。";
      }
      return `查询 CLA 状态时发生错误：${e.message}`;
    }
  }

  if (operationType === "check_sig_groups") {
    try {
      const result = await checkSigGroups(token);
      return formatSigGroupsResult(result);
    } catch (e) {
      if (e.name === "AbortError") {
        return "网络请求超时，请稍后重试。";
      }
      return `查询 SIG 组信息时发生错误：${e.message}`;
    }
  }

  if (operationType === "check_my_meetings") {
    try {
      const month = params.month || "";
      if (month && !/^\d{4}-\d{2}$/.test(month)) {
        return `月份格式错误：${month}。请使用 YYYY-MM 格式，例如：2026-04`;
      }
      const result = await checkMyMeetings(token, month);
      return formatMyMeetingsResult(result);
    } catch (e) {
      if (e.name === "AbortError") {
        return "网络请求超时，请稍后重试。";
      }
      return `查询我参加的会议时发生错误：${e.message}`;
    }
  }

  if (operationType === "create_meeting") {
    try {
      const { 
        topic, group_name, platform, date, start, end, agenda, 
        is_record, is_private, is_cycle,
        cycle_interval, cycle_type, cycle_start_date, cycle_end_date, 
        cycle_start, cycle_end, cycle_point 
      } = params;

      if (!topic) {
        return `❌ **参数错误**\n\n缺少必需参数：topic（会议主题）\n\n请提供会议主题，例如："创建一个主题为 '技术讨论' 的会议"`;
      }
      if (!group_name) {
        return `❌ **参数错误**\n\n缺少必需参数：group_name（SIG 组名称）\n\n请提供 SIG 组名称。您可以使用 check_sig_groups 查询您可创建会议的 SIG 组。`;
      }
      if (!platform) {
        return `❌ **参数错误**\n\n缺少必需参数：platform（会议平台）\n\n请提供会议平台：WELINK 或 ZOOM`;
      }

      if (is_cycle) {
        if (!cycle_start_date) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_start_date（周期开始日期）\n\n周期会议需要提供周期开始日期，格式：YYYY-MM-DD，例如：2026-04-16`;
        }
        if (!cycle_end_date) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_end_date（周期结束日期）\n\n周期会议需要提供周期结束日期，格式：YYYY-MM-DD，例如：2026-05-16`;
        }
        if (!cycle_start) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_start（周期开始时间）\n\n周期会议需要提供开始时间，格式：HH:MM，例如：14:00`;
        }
        if (!cycle_end) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_end（周期结束时间）\n\n周期会议需要提供结束时间，格式：HH:MM，例如：16:00`;
        }
        if (cycle_type === undefined || cycle_type === null) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_type（周期类型）\n\n周期会议需要提供周期类型：\n- 0: 每天\n- 1: 每周\n- 2: 每月`;
        }
        if (!cycle_interval) {
          return `❌ **参数错误**\n\n缺少必需参数：cycle_interval（周期间隔）\n\n周期会议需要提供周期间隔，例如：7 表示每 7 天/周/月`;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(cycle_start_date)) {
          return `❌ **参数错误**\n\n周期开始日期格式错误：${cycle_start_date}\n\n请使用 YYYY-MM-DD 格式，例如：2026-04-16`;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cycle_end_date)) {
          return `❌ **参数错误**\n\n周期结束日期格式错误：${cycle_end_date}\n\n请使用 YYYY-MM-DD 格式，例如：2026-05-16`;
        }
        if (!/^\d{2}:\d{2}$/.test(cycle_start)) {
          return `❌ **参数错误**\n\n周期开始时间格式错误：${cycle_start}\n\n请使用 HH:MM 格式，例如：14:00`;
        }
        if (!/^\d{2}:\d{2}$/.test(cycle_end)) {
          return `❌ **参数错误**\n\n周期结束时间格式错误：${cycle_end}\n\n请使用 HH:MM 格式，例如：16:00`;
        }
        if (![0, 1, 2].includes(cycle_type)) {
          return `❌ **参数错误**\n\n周期类型错误：${cycle_type}\n\n周期类型只能是：0（每天）、1（每周）、2（每月）`;
        }
      } else {
        if (!date) {
          return `❌ **参数错误**\n\n缺少必需参数：date（会议日期）\n\n请提供会议日期，格式：YYYY-MM-DD，例如：2026-04-17`;
        }
        if (!start) {
          return `❌ **参数错误**\n\n缺少必需参数：start（开始时间）\n\n请提供开始时间，格式：HH:MM，例如：14:00`;
        }
        if (!end) {
          return `❌ **参数错误**\n\n缺少必需参数：end（结束时间）\n\n请提供结束时间，格式：HH:MM，例如：16:00`;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return `❌ **参数错误**\n\n日期格式错误：${date}\n\n请使用 YYYY-MM-DD 格式，例如：2026-04-17`;
        }
        if (!/^\d{2}:\d{2}$/.test(start)) {
          return `❌ **参数错误**\n\n开始时间格式错误：${start}\n\n请使用 HH:MM 格式，例如：14:00`;
        }
        if (!/^\d{2}:\d{2}$/.test(end)) {
          return `❌ **参数错误**\n\n结束时间格式错误：${end}\n\n请使用 HH:MM 格式，例如：16:00`;
        }
      }

      const sigGroupsResult = await checkSigGroups(token);
      if (sigGroupsResult.status === 403 || (sigGroupsResult.data && sigGroupsResult.data.code === 403)) {
        return TOKEN_INVALID_GUIDE;
      }

      const sigGroups = sigGroupsResult.data?.data || [];
      const targetGroup = sigGroups.find(g => g.group_name === group_name);
      if (!targetGroup) {
        const availableGroups = sigGroups.map(g => g.group_name).join(', ');
        return `❌ **SIG 组验证失败**\n\n您无权为 SIG 组 "${group_name}" 创建会议。\n\n您可创建会议的 SIG 组：${availableGroups || '无'}\n\n请使用 check_sig_groups 查询您可管理的 SIG 组。`;
      }

      const platformsResult = await getPlatforms(token);
      if (platformsResult.status !== 200 || platformsResult.data?.code !== 200) {
        return `❌ **获取平台列表失败**\n\n无法获取可用的会议平台列表，请稍后重试。`;
      }
      const availablePlatforms = platformsResult.data?.data || [];
      if (!availablePlatforms.includes(platform)) {
        return `❌ **会议平台验证失败**\n\n不支持的平台：${platform}\n\n可用平台：${availablePlatforms.join(', ')}`;
      }

      const meetingData = {
        topic,
        group_name,
        platform,
        etherpad: targetGroup.etherpad || `https://etherpad.openeuler.org/p/${group_name}-meetings`,
        email_list: targetGroup.email_list || "",
        agenda: agenda || "",
        is_record: is_record === true,
        is_private: is_private === true,
        is_cycle: is_cycle === true,
      };

      if (is_cycle) {
        meetingData.cycle_interval = cycle_interval;
        meetingData.cycle_type = cycle_type;
        meetingData.cycle_start_date = cycle_start_date;
        meetingData.cycle_end_date = cycle_end_date;
        meetingData.cycle_start = cycle_start;
        meetingData.cycle_end = cycle_end;
        if (cycle_point) {
          meetingData.cycle_point = cycle_point;
        }
      } else {
        meetingData.date = date;
        meetingData.start = start;
        meetingData.end = end;
      }

      const result = await createMeeting(token, meetingData);
      return formatCreateMeetingResult(result, meetingData);
    } catch (e) {
      if (e.name === "AbortError") {
        return "❌ **网络请求超时**\n\n创建会议请求超时，请检查网络连接后重试。";
      }
      return `❌ **创建会议发生错误**\n\n错误详情：${e.message}\n\n请稍后重试或联系社区管理员。`;
    }
  }

  if (operationType === "cancel_meeting") {
    try {
      const { meeting_id } = params;

      if (!meeting_id) {
        return `❌ **参数错误**\n\n缺少必需参数：meeting_id（会议 ID）\n\n请提供要取消的会议 ID。\n\n💡 如何获取会议 ID：\n1. 使用 check_my_meetings 查询您的会议列表\n2. 在返回结果中找到要取消的会议\n3. 使用会议的 id 字段作为 meeting_id`;
      }

      if (!Number.isInteger(meeting_id) || meeting_id <= 0) {
        return `❌ **参数错误**\n\n会议 ID 格式错误：${meeting_id}\n\n会议 ID 应为正整数，例如：147`;
      }

      const result = await cancelMeeting(token, meeting_id);
      return formatCancelMeetingResult(result);
    } catch (e) {
      if (e.name === "AbortError") {
        return "❌ **网络请求超时**\n\n取消会议请求超时，请检查网络连接后重试。";
      }
      return `❌ **取消会议发生错误**\n\n错误详情：${e.message}\n\n请稍后重试或联系社区管理员。`;
    }
  }

  if (operationType === "cancel_sub_meeting") {
    try {
      const { sub_id } = params;

      if (!sub_id) {
        return `❌ **参数错误**\n\n缺少必需参数：sub_id（子会议 ID）\n\n请提供要取消的子会议 ID。\n\n💡 如何获取子会议 ID：\n1. 使用 check_my_meetings 查询您的周期会议\n2. 在返回结果的 cycle_sub 列表中找到要取消的子会议\n3. 使用子会议的 sub_id 字段`;
      }

      if (typeof sub_id !== 'string' || sub_id.trim() === '') {
        return `❌ **参数错误**\n\n子会议 ID 格式错误：${sub_id}\n\n子会议 ID 应为字符串，例如：b3ab4c8867144e70bb0500beab159a7f`;
      }

      const result = await cancelSubMeeting(token, sub_id);
      return formatCancelSubMeetingResult(result);
    } catch (e) {
      if (e.name === "AbortError") {
        return "❌ **网络请求超时**\n\n取消子会议请求超时，请检查网络连接后重试。";
      }
      return `❌ **取消子会议发生错误**\n\n错误详情：${e.message}\n\n请稍后重试或联系社区管理员。`;
    }
  }
}

export const toolDefinition = {
  name: "execute_user_operation",
  description: `执行 openEuler 社区用户个人操作，需要配置 OPENEULER_TOKEN 环境变量。

⚠️ **前置条件：**
- 需要在 MCP Server 配置中设置 \`OPENEULER_TOKEN\` 环境变量
- Token 可从 [openEuler 软件包平台](https://software-pkg.openeuler.org/) 个人设置中获取

**当前支持的操作类型：**

| 操作类型 | 说明 | 必需参数 |
|---------|------|---------|
| check_cla | 查询 CLA 签署状态 | 无 |
| check_sig_groups | 查询可管理的 SIG 组 | 无 |
| check_my_meetings | 查询我参加的会议 | month（可选） |
| create_meeting | 创建会议 | topic, group_name, platform, date/start/end 或周期参数 |
| cancel_meeting | 取消整个会议 | meeting_id |
| cancel_sub_meeting | 取消子会议 | sub_id |

**操作详细说明：**

**1. CLA 签署状态查询** (\`operation_type = "check_cla"\`)
- 查询是否已签署 CLA 协议
- 返回签署状态、时间、账号等信息

**2. SIG 组身份查询** (\`operation_type = "check_sig_groups"\`)
- 查询您是哪些 SIG 的 maintainer/committer
- 返回 SIG 组列表及其 etherpad、email_list

**3. 我参加的会议查询** (\`operation_type = "check_my_meetings"\`)
- 查询您预定或参与的会议
- 支持按月份查询（默认当前月份）
- 周期会议会列出所有子会议（含 sub_id）

**4. 创建会议** (\`operation_type = "create_meeting"\`)
- 为您管理的 SIG 组预定会议
- 支持单次会议和周期会议
- 自动填充 etherpad 和 email_list

**5. 取消会议** (\`operation_type = "cancel_meeting"\`)
- 取消整个会议（含所有子会议）
- 需要提供会议 ID
- 会议 ID 可从 check_my_meetings 获取

**6. 取消子会议** (\`operation_type = "cancel_sub_meeting"\`)
- 仅取消周期会议中的某一场子会议
- 需要提供子会议 ID (sub_id)
- 其他子会议不受影响

**Token 配置方式：**

\`\`\`json
{
  "mcpServers": {
    "openeuler-portal": {
      "command": "npx",
      "args": ["-y", "openeuler-portal-mcp"],
      "env": { "OPENEULER_TOKEN": "your_token_here" }
    }
  }
}
\`\`\`

**常见场景示例：**

| 场景 | 建议操作 |
|-----|---------|
| 查看会议列表 | 先用 check_my_meetings |
| 取消某个会议 | 从会议列表找到 id，用 cancel_meeting |
| 取消某场子会议 | 从周期会议的 cycle_sub 找 sub_id，用 cancel_sub_meeting |
| 创建单次会议 | 用 create_meeting，is_cycle=false |
| 创建周期会议 | 用 create_meeting，is_cycle=true + 周期参数 |`,
inputSchema: {
    type: "object",
    required: ["operation_type"],
    properties: {
      operation_type: {
        type: "string",
        enum: ["check_cla", "check_sig_groups", "check_my_meetings", "create_meeting", "cancel_meeting", "cancel_sub_meeting"],
        description: "操作类型。",
      },
      month: {
        type: "string",
        description: "查询月份，格式 YYYY-MM。仅 operation_type 为 'check_my_meetings' 时有效，默认当前月份。",
        default: ""
      },
      meeting_id: {
        type: "number",
        description: "会议 ID。仅 operation_type 为 'cancel_meeting' 时必需，可从 check_my_meetings 获取。",
        default: 0
      },
      sub_id: {
        type: "string",
        description: "子会议 ID。仅 operation_type 为 'cancel_sub_meeting' 时必需，可从周期会议的 cycle_sub 列表获取。",
        default: ""
      },
      topic: {
        type: "string",
        description: "会议主题。仅 operation_type 为 'create_meeting' 时必需。",
        default: ""
      },
      group_name: {
        type: "string",
        description: "SIG 组名称。仅 operation_type 为 'create_meeting' 时必需。",
        default: ""
      },
      platform: {
        type: "string",
        enum: ["WELINK", "ZOOM"],
        description: "会议平台。仅 operation_type 为 'create_meeting' 时必需。",
        default: ""
      },
      date: {
        type: "string",
        description: "会议日期，格式 YYYY-MM-DD。仅 create_meeting 且 is_cycle=false 时必需。",
        default: ""
      },
      start: {
        type: "string",
        description: "开始时间，格式 HH:MM。仅 create_meeting 且 is_cycle=false 时必需。",
        default: ""
      },
      end: {
        type: "string",
        description: "结束时间，格式 HH:MM。仅 create_meeting 且 is_cycle=false 时必需。",
        default: ""
      },
      agenda: {
        type: "string",
        description: "会议议程。仅 operation_type 为 'create_meeting' 时可选。",
        default: ""
      },
      is_record: {
        type: "boolean",
        description: "是否录制会议。仅 create_meeting 时可选，默认 false。",
        default: false
      },
      is_private: {
        type: "boolean",
        description: "是否私密会议。仅 create_meeting 时可选，默认 false。",
        default: false
      },
      is_cycle: {
        type: "boolean",
        description: "是否周期会议。仅 create_meeting 时可选，默认 false。",
        default: false
      },
      cycle_interval: {
        type: "number",
        description: "周期间隔。仅 is_cycle=true 时必需。",
        default: 0
      },
      cycle_type: {
        type: "number",
        enum: [0, 1, 2],
        description: "周期类型：0=每天，1=每周，2=每月。仅 is_cycle=true 时必需。",
        default: 0
      },
      cycle_start_date: {
        type: "string",
        description: "周期开始日期，格式 YYYY-MM-DD。仅 is_cycle=true 时必需。",
        default: ""
      },
      cycle_end_date: {
        type: "string",
        description: "周期结束日期，格式 YYYY-MM-DD。仅 is_cycle=true 时必需。",
        default: ""
      },
      cycle_start: {
        type: "string",
        description: "周期开始时间，格式 HH:MM。仅 is_cycle=true 时必需。",
        default: ""
      },
      cycle_end: {
        type: "string",
        description: "周期结束时间，格式 HH:MM。仅 is_cycle=true 时必需。",
        default: ""
      },
      cycle_point: {
        type: "string",
        description: "重复日期/星期，逗号分隔。每周如 '1,3,5'(周一三五)，每月如 '1,15'(1号15号)。",
        default: ""
      }
    },
  },
};