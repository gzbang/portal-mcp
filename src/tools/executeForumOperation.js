const FORUM_BASE_URL = "https://forum.openeuler.org";

// 用户信息长期化存储（全局变量）
let cachedUserInfo = null;
let userInfoExpiry = 0;
const USER_INFO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

/**
 * 校验 FORUM_TOKEN 是否有效
 * @returns {object} { valid: boolean, username: string, userId: number, message: string }
 */
async function validateToken() {
  const token = process.env.FORUM_TOKEN;

  if (!token) {
const baseUrl = FORUM_BASE_URL;
      return {
        valid: false,
        username: null,
        userId: null,
        message: `❌ 未配置 FORUM_TOKEN 环境变量。

**配置方法：**

1. **获取个人令牌：**
   - 确保你的电脑安装了 Node.js 18+ 版本
   - 在终端里运行生成命令：npx -y @discourse/mcp@latest generate-user-api-key --site https://forum.openeuler.org --save-to openeuler-forum-key.json
   - 按终端提示操作
   - 在openeuler-forum-key.json中获取

2. **配置 MCP Server：**
   在 MCP 配置文件中添加 FORUM_TOKEN 环境变量：

   \`\`\`json
   {
     "mcpServers": {
       "openeuler-portal": {
         "command": "npx",
         "args": ["-y", "openeuler-portal-mcp"],
         "env": {
           "FORUM_TOKEN": "your_forum_token_here"
         }
       }
     }
   }
   \`\`\`

3. **重启 MCP Server** 使配置生效`,
      };
  }

  // 检查缓存
  const now = Date.now();
  if (cachedUserInfo && now < userInfoExpiry) {
    return {
      valid: true,
      username: cachedUserInfo.username,
      userId: cachedUserInfo.id,
      message: `✅ Token 有效（使用缓存）

**用户信息：**
- 用户名：${cachedUserInfo.username}
- 用户 ID：${cachedUserInfo.id}
- 显示名称：${cachedUserInfo.name || cachedUserInfo.username}
- 信任等级：${cachedUserInfo.trust_level || 0}

**论坛地址：** ${FORUM_BASE_URL}`
    };
  }

  try {
    const response = await fetch(`${FORUM_BASE_URL}/session/current.json`, {
      method: "GET",
      headers: {
        "User-Api-Key": token,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        valid: false,
        username: null,
        userId: null,
        message: `❌ Token 校验失败：HTTP ${response.status}

**可能原因：**
- Token 无效或已过期 → 请重新生成 FORUM_TOKEN
- Token 权限不足 → 请检查令牌是否勾选了必要权限
- 网络连接问题 → 请检查网络是否正常

**错误详情：** ${errorText.substring(0, 200)}`
      };
    }

    const data = await response.json();

    if (!data.current_user) {
      return {
        valid: false,
        username: null,
        userId: null,
        message: `❌ Token 校验失败：API 返回数据中未找到 current_user 字段

**可能原因：**
- Token 格式不正确
- Token 权限不足
- API 响应异常`
      };
    }

    const user = data.current_user;

    // 长期化存储用户信息
    cachedUserInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      trust_level: user.trust_level,
      admin: user.admin,
      moderator: user.moderator,
    };
    userInfoExpiry = now + USER_INFO_CACHE_DURATION;

    return {
      valid: true,
      username: user.username,
      userId: user.id,
      message: `✅ Token 校验成功！

**用户信息：**
- 用户名：${user.username}
- 用户 ID：${user.id}
- 显示名称：${user.name || user.username}
- 信任等级：${user.trust_level || 0}
- 管理员：${user.admin ? "是" : "否"}
- 版主：${user.moderator ? "是" : "否"}

**Token 权限：**
- 可上传头像：${user.can_upload_avatar ? "是" : "否"}
- 可编辑内容：${user.can_edit ? "是" : "否"}
- 可创建话题：${user.can_create_topic ? "是" : "否"}

**论坛地址：** ${FORUM_BASE_URL}
**校验时间：** ${new Date().toLocaleString("zh-CN")}

**提示：**
- 用户信息已缓存（24小时有效期）
- 可以立即执行论坛操作（如发布评论）
- Token 有效期到期后需要重新生成`
    };
  } catch (e) {
    if (e.name === "AbortError") {
      return {
        valid: false,
        username: null,
        userId: null,
        message: `❌ Token 校验超时（15s）

**可能原因：**
- 网络连接不稳定
- 论坛服务器响应较慢

**建议：**
- 检查网络连接
- 稍后再次尝试
- 如果持续超时，请联系论坛管理员`
      };
    }
    return {
      valid: false,
      username: null,
      userId: null,
      message: `❌ Token 校验时发生错误：${e.message}`
    };
  }
}

/**
 * 执行论坛评论操作
 * @param {number} topicId - 帖子 ID
 * @param {string} raw - 评论内容
 * @returns {string} 操作结果
 */
async function createPost(topicId, raw) {
  const token = process.env.FORUM_TOKEN;

  if (!token) {
    return `❌ 操作失败：未配置 FORUM_TOKEN 环境变量。

请先配置 FORUM_TOKEN，或使用 operation_type="validate_token" 校验 Token 配置。`;
  }

  // 先校验 Token（使用缓存）
  const validation = await validateToken();
  if (!validation.valid) {
    return `❌ Token 校验失败，无法执行评论操作。

${validation.message}`;
  }

  if (!topicId) {
    return `❌ 操作失败：缺少必需参数 topic_id（帖子 ID）。

**获取帖子 ID 的方法：**
- 使用 get_forum_info 工具搜索帖子，从结果的 id 字段获取
- 从论坛链接中读取数字部分，如 ${FORUM_BASE_URL}/t/topic/197 中的 197`;
  }

  if (!raw || !raw.trim()) {
    return `❌ 操作失败：缺少必需参数 raw（评论内容）。

请提供要发布的评论内容。`;
  }

  try {
    const formData = new FormData();
    formData.append("topic_id", topicId);
    formData.append("raw", raw.trim());

    const response = await fetch(`${FORUM_BASE_URL}/posts.json`, {
      method: "POST",
      headers: {
        "User-Api-Key": token,
      },
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors) {
          errorMsg = errorData.errors.join(", ");
        }
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }

      return `❌ 评论失败：${errorMsg}

**常见错误原因：**
- 令牌无效或已过期 → 请重新生成 FORUM_TOKEN
- 帖子已关闭或锁定 → 无法在已关闭的帖子中评论
- 帖子不存在 → 请确认 topic_id 是否正确
- 权限不足 → 请检查令牌是否有评论权限
- 内容违规 → 评论内容可能触发了论坛的审核机制`;
    }

    const data = await response.json();

    const postId = data.id || data.post_number || "未知";
    const postNumber = data.post_number || "未知";
    const topicTitle = data.topic_slug ? `帖子 "${data.topic_slug}"` : `帖子 ${topicId}`;

    let result = `✅ 评论发布成功！

**评论详情：**
- 帖子：${topicTitle}（ID: ${topicId}）
- 评论楼层：第 ${postNumber} 楼
- 评论 ID：${postId}
- 评论用户：${validation.username}（ID: ${validation.userId})
- 评论内容：${raw.trim().substring(0, 100)}${raw.trim().length > 100 ? "..." : ""}
- 发布时间：${new Date().toLocaleString("zh-CN")}

**查看评论：**
${FORUM_BASE_URL}/t/${data.topic_slug || `topic`}/${topicId}/${postNumber}

**提示：**
- 评论已成功发布，其他用户可以看到你的评论
- 如果需要继续讨论，可以再次调用本工具发布新评论
- 如果需要回复特定楼层，请在评论内容中说明`;

    return result;
  } catch (e) {
    if (e.name === "AbortError") {
      return `❌ 网络请求超时（15s），请稍后重试。

论坛服务器可能响应较慢，建议：
- 检查网络连接
- 稍后再次尝试
- 如果持续超时，请联系论坛管理员`;
    }
    return `❌ 评论操作时发生错误：${e.message}`;
  }
}

/**
 * 查询用户行为记录
 * @param {string} filter - 行为类型过滤（逗号拼接）
 * @returns {string} 操作结果
 */
async function getUserActions(filter) {
  const token = process.env.FORUM_TOKEN;

  if (!token) {
    return `❌ 操作失败：未配置 FORUM_TOKEN 环境变量。

请先配置 FORUM_TOKEN，或使用 operation_type="validate_token" 校验 Token 配置。`;
  }

  // 先校验 Token（使用缓存）
  const validation = await validateToken();
  if (!validation.valid) {
    return `❌ Token 校验失败，无法执行查询操作。

${validation.message}`;
  }

  // 使用缓存的 username
  const username = validation.username;

  if (!username) {
    return `❌ 操作失败：无法获取用户名。

请先使用 operation_type="validate_token" 校验 Token 并获取用户信息。`;
  }

  // filter 类型说明
  const filterTypes = {
    "1": "用户的回复",
    "3": "用户被@的记录",
    "4": "用户发起的主题",
    "5": "用户发布的全部帖子",
    "8": "用户的关注列表",
    "11": "点赞列表",
    "13": "用户的收藏",
  };

  // 默认返回全部类型（如果用户未指定filter）
  const usedFilter = filter || "1,3,4,5,8,11,13";

  try {
    const baseUrl = FORUM_BASE_URL;
    const url = `${baseUrl}/user_actions.json?username=${encodeURIComponent(username)}&filter=${usedFilter}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Api-Key": token,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `❌ 查询失败：HTTP ${response.status}

**可能原因：**
- Token 无效或已过期 → 请重新生成 FORUM_TOKEN
- Token 权限不足 → 请检查令牌是否勾选了必要权限
- 用户不存在 → 请确认 username 是否正确
- 网络连接问题 → 请检查网络是否正常

**错误详情：** ${errorText.substring(0, 200)}`;
    }

    const data = await response.json();

    if (!data.user_actions || data.user_actions.length === 0) {
      // 解析filter参数，显示查询的类型
      const filterCodes = usedFilter.split(",");
      const filterNames = filterCodes.map(code => filterTypes[code] || `类型${code}`).join("、");

      return `✅ 查询完成，未找到用户行为记录。

**查询信息：**
- 用户名：${username}（ID: ${validation.userId})
- 查询类型：${filterNames}
- 论坛地址：${baseUrl}
- 查询时间：${new Date().toLocaleString("zh-CN")}

**提示：**
- 该用户可能暂无相关行为记录
- 可以尝试查询其他类型（如 filter="5" 查看用户发布的全部帖子）
- 可以使用 get_forum_info 搜索帖子查看社区内容`;
    }

    // 格式化输出
    let result = `✅ 用户行为查询成功！

**查询信息：**
- 用户名：${username}（ID: ${validation.userId})
- 查询类型：filter=${usedFilter}
- 结果数量：${data.user_actions.length} 条
- 论坛地址：${baseUrl}
- 查询时间：${new Date().toLocaleString("zh-CN")}

---

**用户行为列表：**\n\n`;

    // 显示每条记录
    data.user_actions.slice(0, 20).forEach((action, index) => {
      const actionTypeName = filterTypes[action.action_type] || `类型${action.action_type}`;
      const topicUrl = `${baseUrl}/t/${action.slug}/${action.topic_id}`;
      const postUrl = `${topicUrl}/${action.post_number}`;

      result += `**${index + 1}. ${actionTypeName}**\n`;
      result += `   📌 话题：${action.title || "（无标题）"}\n`;
      result += `   🔗 链接：${postUrl}\n`;
      
      if (action.excerpt) {
        const excerpt = action.excerpt.replace(/\n/g, " ").substring(0, 150);
        result += `   📄 内容：${excerpt}${action.excerpt.length > 150 ? "..." : ""}\n`;
      }
      
      result += `   🕐 时间：${new Date(action.created_at).toLocaleString("zh-CN")}\n`;
      result += `   📊 帖子ID：${action.post_id}  楼层：第${action.post_number}楼\n`;
      
      if (action.deleted) result += `   ⚠️ 已删除\n`;
      if (action.hidden) result += `   🔒 已隐藏\n`;
      if (action.closed) result += `   🔒 话题已关闭\n`;
      if (action.archived) result += `   📦 话题已归档\n`;
      
      result += `\n`;
    });

    if (data.user_actions.length > 20) {
      result += `... 共 ${data.user_actions.length} 条记录，仅显示前 20 条\n\n`;
    }

    result += `---\n`;
    result += `**提示：**\n`;
    result += `- 点击链接可查看具体内容\n`;
    result += `- 可以使用 get_forum_info 查看帖子详情（topic_id=${data.user_actions[0]?.topic_id})\n`;
    result += `- 可以使用不同的 filter 参数查询特定类型的行为\n`;
    result += `- filter 参数说明：\n`;
    result += `  - 1：用户的回复\n`;
    result += `  - 3：用户被@的记录\n`;
    result += `  - 4：用户发起的主题\n`;
    result += `  - 5：用户发布的全部帖子\n`;
    result += `  - 8：用户的关注列表\n`;
    result += `  - 11：点赞列表\n`;
    result += `  - 13：用户的收藏\n`;
    result += `  - 可组合使用（逗号分隔）：如 filter="4,5" 查询主题和帖子\n`;

    return result;
  } catch (e) {
    if (e.name === "AbortError") {
      return `❌ 网络请求超时（15s），请稍后重试。

论坛服务器可能响应较慢，建议：
- 检查网络连接
- 稍后再次尝试
- 如果持续超时，请联系论坛管理员`;
    }
    return `❌ 查询用户行为时发生错误：${e.message}`;
  }
}

/**
 * 主查询函数
 * @param {string} operationType - 操作类型
 * @param {object} params - 操作参数
 */
export async function executeForumOperation(operationType = "validate_token", params = {}) {
  try {
    if (operationType === "validate_token") {
      const validation = await validateToken();
      return validation.message;
    }

    if (operationType === "create_post") {
      return await createPost(params.topic_id, params.raw);
    }

    if (operationType === "get_user_actions") {
      return await getUserActions(params.filter);
    }

    return `❌ 不支持的操作类型 "${operationType}"。

**当前支持的操作：**
- validate_token：校验 FORUM_TOKEN 是否有效（推荐首先执行）
- get_user_actions：查询用户行为记录
- create_post：在帖子中发布评论

**参数说明：**
- validate_token：无额外参数
- get_user_actions：filter（行为类型过滤，可选）
- create_post：topic_id（帖子 ID）、raw（评论内容）`;
  } catch (e) {
    return `❌ 执行论坛操作时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "execute_forum_operation",
  description: `执行 openEuler 社区论坛用户个人操作，需要在 MCP 配置中设置 FORUM_TOKEN 环境变量。

**⚠️ 重要提示：**
本工具需要用户授权令牌才能执行操作。请先配置 FORUM_TOKEN 环境变量，并使用 validate_token 校验 Token 是否有效。

**支持的操作：**

### 1. Token 校验（validate_token）- 推荐首先执行

**何时使用：**
- 配置 FORUM_TOKEN 后，验证 Token 是否有效
- 在执行其他论坛操作前，确认 Token 权限
- 查询当前用户信息和权限
- Token 失效后重新校验

**功能：**
- 调用论坛 API 验证 Token 是否有效
- 返回用户信息（用户名、用户ID、信任等级、权限等）
- **长期化存储 username**（24小时缓存）

**返回信息：**
- Token 校验结果（有效/无效）
- 用户名（username）
- 用户 ID（userId）
- 显示名称、信任等级
- Token 权限列表
- 校验时间

**参数：** 无额外参数

---

### 2. 查询用户行为记录（get_user_actions）

**何时使用：**
- 查询用户在论坛的各种行为记录
- 了解用户最近的活动和参与情况
- 查看用户发布的帖子、回复、点赞、收藏等
- 分析用户的活跃度和参与度

**功能：**
- 调用 "/user_actions.json" API 查询用户行为
- 使用缓存的 username（无需手动传入）
- 支持按行为类型过滤（filter参数）

**行为类型（filter）：**
- **1**：用户的回复（所有评论和回复）
- **3**：用户被@的记录（被他人提及）
- **4**：用户发起的主题（创建的帖子）
- **5**：用户发布的全部帖子（包括主题和回复）
- **8**：用户的关注列表（关注的话题）
- **11**：点赞列表（点赞的内容）
- **13**：用户的收藏（收藏的帖子）

**参数：**
- filter（可选）：行为类型过滤，逗号分隔
  - 默认："1,3,4,5,8,11,13"（查询全部类型）
  - 示例：filter="5" 仅查询用户发布的全部帖子
  - 示例：filter="4,5" 查询用户发起的主题和帖子

**返回信息：**
- 用户行为列表（最多显示20条）
- 每条记录包括：
  - 话题标题、帖子链接
  - 内容摘要（excerpt）
  - 创建时间、帖子ID、楼层号
  - 状态标记（删除、隐藏、关闭、归档）
- 用户信息（username、userId）
- 查询统计（结果数量、查询类型）

**示例用法：**
- 查询全部行为：operation_type="get_user_actions"（不传filter）
- 查询帖子：operation_type="get_user_actions", filter="5"
- 查询主题和帖子：operation_type="get_user_actions", filter="4,5"
- 查询点赞和收藏：operation_type="get_user_actions", filter="11,13"

---

### 3. 在帖子中发布评论（create_post）

**何时使用：**
- 用户想在某个帖子中发表评论、观点或建议
- 用户想回答帖子中的问题
- 用户想分享经验或补充信息
- 用户想参与社区讨论

**前置条件：**
- 必须先校验 Token（operation_type="validate_token")
- Token 有效才能执行评论操作

**操作步骤：**
1. 使用 validate_token 校验 Token 是否有效
2. 使用 get_forum_info 搜索或浏览帖子，获取 topic_id
3. 准备要发布的评论内容（raw）
4. 调用本工具发布评论

**参数：**
- topic_id（必填）：帖子 ID，从 get_forum_info 结果获取或从论坛链接读取
- raw（必填）：评论内容，支持 Markdown 格式

**返回信息：**
- 评论发布成功提示
- 评论楼层号、评论 ID
- 评论用户（username）
- 评论链接（可直接访问查看）
- 发布时间

---

**Token 配置方法：**

1. **获取 FORUM_TOKEN：**
   - 访问论坛并登录
   - 进入个人设置 → API → 生成新令牌
   - 复制生成的令牌（建议勾选"写入"权限）

2. **配置 MCP Server：**
   \`\`\`json
   {
     "mcpServers": {
       "openeuler-portal": {
         "command": "npx",
         "args": ["-y", "openeuler-portal-mcp"],
         "env": {
           "FORUM_TOKEN": "your_forum_token_here"
         }
       }
     }
}
    \`\`\`

---

**常见错误及解决：**
- 令牌无效 → 重新生成 FORUM_TOKEN
- 帖子已关闭 → 无法在已关闭帖子中评论
- 权限不足 → 检查令牌是否有"写入"权限
- 内容违规 → 检查评论内容是否符合社区规范

**示例问题：**
- "校验我的论坛 Token 是否有效"
- "查看我的论坛用户信息"
- "在帖子 197 中发表评论：感谢分享这个解决方案！"
- "回复帖子 1451：我遇到了相同的问题，请问是怎么解决的？"

**推荐使用流程：**
1. validate_token → 校验 Token
2. get_user_actions → 查询用户行为（可选）
3. get_forum_info → 搜索帖子
4. create_post → 发布评论`,
  inputSchema: {
    type: "object",
    required: ["operation_type"],
    properties: {
      operation_type: {
        type: "string",
        enum: ["validate_token", "get_user_actions", "create_post"],
        description: "操作类型：validate_token（校验Token，推荐首先执行）、get_user_actions（查询用户行为记录）、create_post（在帖子中发布评论）。",
        default: "validate_token",
      },
      filter: {
        type: "string",
        description:
          "行为类型过滤（get_user_actions 时可选）。逗号分隔的数字字符串，如 '1,3,4,5,8,11,13'。默认查询全部类型。具体含义：1=用户回复、3=被@记录、4=发起的主题、5=全部帖子、8=关注列表、11=点赞列表、13=用户收藏。",
      },
      topic_id: {
        type: "number",
        description:
          "帖子 ID（create_post 时必填）。从 get_forum_info 结果的 id 字段获取，或从论坛链接中读取数字部分。",
      },
      raw: {
        type: "string",
        description:
          "评论内容（create_post 时必填）。支持 Markdown 格式，可以包含代码、链接、列表等。建议提供有价值的信息、建议或问题回复。",
      },
    },
  },
};