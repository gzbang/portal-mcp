import { appendRecommendation } from "../utils/toolRecommendations.js";

// 论坛 API 基础 URL
const FORUM_BASE_URL = "https://forum.openeuler.org";
const FORUM_TOPIC_URL = `${FORUM_BASE_URL}/t`;

// 缓存配置
const CACHE_DURATION = 15 * 60 * 1000; // 15分钟

let latestCache = null;
let latestCacheExpiry = 0;

let topCache = null;
let topCacheExpiry = 0;

const searchCache = new Map(); // keyword → { topics, posts, expiry }
const detailCache = new Map(); // topic_id → { data, expiry }

// 清除缓存（仅供测试使用）
export function _resetCache() {
  latestCache = null;
  latestCacheExpiry = 0;
  topCache = null;
  topCacheExpiry = 0;
  searchCache.clear();
  detailCache.clear();
}

// ─── 公共工具函数 ────────────────────────────────────────────────────────────

/**
 * 发起 GET 请求并解析 JSON
 */
async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "Accept": "application/json", "User-Agent": "openEuler-MCP/1.0" },
  });
  if (!response.ok) {
    throw new Error(`API 请求失败：HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * 构建帖子访问链接
 */
function buildTopicUrl(slug, id) {
  return `${FORUM_TOPIC_URL}/${slug}/${id}`;
}

/**
 * 格式化时间为可读字符串
 */
function formatDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * 构建用户 ID → 用户名映射
 */
function buildUserMap(users) {
  const map = {};
  for (const u of users || []) {
    map[u.id] = u.username;
  }
  return map;
}

// ─── 格式化函数 ──────────────────────────────────────────────────────────────

/**
 * 格式化单条 topic（通用，用于 latest/top）
 */
function formatTopic(topic, index, userMap) {
  const url = buildTopicUrl(topic.slug, topic.id);
  const tags = topic.tags && topic.tags.length > 0 ? `[${topic.tags.join(", ")}]` : "";
  const authorName = userMap[topic.posters?.[0]?.user_id] || "";
  const lastPoster = topic.last_poster_username || "";
  const excerpt = topic.excerpt
    ? `\n   📄 ${topic.excerpt.replace(/\n/g, " ").slice(0, 100)}${topic.excerpt.length > 100 ? "…" : ""}`
    : "";

  let line = `${index}. **${topic.title}**\n`;
  line += `   🔗 ${url}\n`;
  if (tags) line += `   🏷️ ${tags}\n`;
  line += `   👁️ ${topic.views ?? 0} 浏览  💬 ${topic.reply_count ?? 0} 回复  ❤️ ${topic.like_count ?? 0} 点赞`;
  if (topic.has_accepted_answer) line += `  ✅ 已采纳`;
  line += `\n`;
  if (authorName) line += `   👤 发帖人：${authorName}`;
  if (lastPoster && lastPoster !== authorName) line += `  · 最后回复：${lastPoster}`;
  if (authorName || lastPoster) line += `\n`;
  line += `   🕐 发布：${formatDate(topic.created_at)}  · 最后活动：${formatDate(topic.last_posted_at)}`;
  if (topic.pinned || topic.pinned_globally) line += `  📌 置顶`;
  if (topic.closed) line += `  🔒 已关闭`;
  line += excerpt;
  line += `\n`;
  return line;
}

/**
 * 格式化最新帖子列表
 */
function formatLatest(data) {
  const topics = data.topic_list?.topics || [];
  const userMap = buildUserMap(data.users);
  const total = topics.length;

  let out = `=== openEuler 论坛最新帖子 ===\n\n`;
  out += `📊 共 ${total} 条最新帖子\n`;
  out += `🌐 论坛地址：${FORUM_BASE_URL}\n\n`;

  if (total === 0) {
    out += `暂无帖子。\n`;
    return out;
  }

  topics.forEach((topic, i) => {
    out += formatTopic(topic, i + 1, userMap) + "\n";
  });

  out += `---\n数据来源：openEuler 社区论坛\n查询时间：${new Date().toLocaleString("zh-CN")}\n`;
  return out;
}

/**
 * 格式化热门帖子列表
 */
function formatTop(data) {
  const topics = data.topic_list?.topics || [];
  const userMap = buildUserMap(data.users);
  const period = data.topic_list?.for_period || "monthly";
  const periodLabel = period === "monthly" ? "近一个月" : period;
  const total = topics.length;

  let out = `=== openEuler 论坛热门帖子 ===\n\n`;
  out += `📊 ${periodLabel}最热门 ${total} 条帖子（按热度排序）\n`;
  out += `🌐 论坛地址：${FORUM_BASE_URL}\n\n`;

  if (total === 0) {
    out += `暂无帖子。\n`;
    return out;
  }

  topics.forEach((topic, i) => {
    out += formatTopic(topic, i + 1, userMap) + "\n";
  });

  out += `---\n数据来源：openEuler 社区论坛\n查询时间：${new Date().toLocaleString("zh-CN")}\n`;
  return out;
}

/**
 * 格式化搜索结果
 */
function formatSearch(data, keyword) {
  const topics = data.topics || [];
  const posts = data.posts || [];
  const meta = data.grouped_search_result || {};

  let out = `=== openEuler 论坛搜索结果 ===\n\n`;
  out += `🔍 关键词：**${keyword}**\n`;
  out += `📊 命中话题：${topics.length} 条  帖子片段：${posts.length} 条\n\n`;

  if (topics.length === 0 && posts.length === 0) {
    out += `未找到与 "${keyword}" 相关的内容。\n\n`;
    out += `💡 建议：\n`;
    out += `  - 尝试更简短的关键词\n`;
    out += `  - 使用英文关键词搜索\n`;
    out += `  - 使用 query_type="latest" 浏览最新帖子\n`;
    return out;
  }

  // 构建 topic ID → topic 映射，用于帖子片段关联话题标题
  const topicMap = {};
  for (const t of topics) {
    topicMap[t.id] = t;
  }

  // 输出话题列表
  if (topics.length > 0) {
    out += `### 相关话题\n\n`;
    topics.slice(0, 20).forEach((topic, i) => {
      const url = buildTopicUrl(topic.slug, topic.id);
      const tags = topic.tags?.length > 0 ? ` [${topic.tags.join(", ")}]` : "";
      const excerpt = topic.excerpt
        ? `\n   📄 ${topic.excerpt.replace(/\n/g, " ").slice(0, 120)}${topic.excerpt.length > 120 ? "…" : ""}`
        : "";

      out += `${i + 1}. **${topic.title}**${tags}\n`;
      out += `   🔗 ${url}\n`;
      out += `   💬 ${topic.reply_count ?? 0} 回复  `;
      out += `🕐 ${formatDate(topic.created_at)}`;
      if (topic.has_accepted_answer) out += `  ✅ 已采纳`;
      if (topic.closed) out += `  🔒 已关闭`;
      out += excerpt;
      out += `\n\n`;
    });
    if (topics.length > 20) {
      out += `... 共 ${topics.length} 条话题，仅显示前 20 条，建议细化关键词\n\n`;
    }
  }

  // 输出帖子片段（仅展示不在 topics 列表中的，避免重复）
  const topicIdsInList = new Set(topics.map((t) => t.id));
  const extraPosts = posts.filter((p) => !topicIdsInList.has(p.topic_id));

  if (extraPosts.length > 0) {
    out += `### 相关帖子片段\n\n`;
    extraPosts.slice(0, 10).forEach((post, i) => {
      const parentTopic = topicMap[post.topic_id];
      const topicTitle = parentTopic?.title || `话题 #${post.topic_id}`;
      const topicUrl = parentTopic
        ? buildTopicUrl(parentTopic.slug, parentTopic.id)
        : `${FORUM_BASE_URL}/t/${post.topic_id}`;
      const blurb = post.blurb
        ? post.blurb.replace(/\n/g, " ").slice(0, 150) + (post.blurb.length > 150 ? "…" : "")
        : "";

      out += `${i + 1}. **${topicTitle}**（第 ${post.post_number} 楼）\n`;
      out += `   🔗 ${topicUrl}/${post.post_number}\n`;
      out += `   👤 ${post.username}  🕐 ${formatDate(post.created_at)}`;
      if (post.like_count > 0) out += `  ❤️ ${post.like_count}`;
      out += `\n`;
      if (blurb) out += `   📄 ${blurb}\n`;
      out += `\n`;
    });
  }

  out += `---\n数据来源：openEuler 社区论坛\n查询时间：${new Date().toLocaleString("zh-CN")}\n`;
  return out;
}

/**
 * 剥离 HTML 标签，返回可读纯文本
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 获取帖子详情（带缓存）
 * @param {number|string} topicId - 帖子唯一 ID（来自列表结果的 id 字段）
 */
async function fetchTopicDetail(topicId) {
  const now = Date.now();
  const cached = detailCache.get(String(topicId));
  if (cached && now < cached.expiry) return cached.data;

  const data = await fetchJson(`${FORUM_TOPIC_URL}/${topicId}.json`);
  detailCache.set(String(topicId), { data, expiry: now + CACHE_DURATION });
  return data;
}

/**
 * 格式化帖子详情
 */
function formatTopicDetail(data) {
  const posts = data.post_stream?.posts || [];
  const createdBy = data.details?.created_by;
  const lastPoster = data.details?.last_poster;

  let out = `=== openEuler 论坛帖子详情 ===\n\n`;
  out += `**标题：** ${data.title || data.fancy_title || "(无标题)"}\n`;
  out += `**帖子 ID：** ${data.id}\n`;
  out += `🔗 链接：${FORUM_TOPIC_URL}/${data.slug}/${data.id}\n`;
  if (data.tags && data.tags.length > 0) out += `🏷️ 标签：${data.tags.join(", ")}\n`;

  // 统计行：浏览、楼数、点赞、参与人数、字数
  out += `👁️ ${data.views ?? 0} 浏览  💬 ${data.posts_count ?? 0} 楼  ❤️ ${data.like_count ?? 0} 点赞`;
  if (data.participant_count > 0) out += `  👥 ${data.participant_count} 人参与`;
  if (data.word_count > 0) out += `  📝 ${data.word_count} 字`;
  if (data.vote_count > 0) out += `  🗳️ ${data.vote_count} 票`;
  out += `\n`;

  // 时间行
  out += `🕐 发布：${formatDate(data.created_at)}`;
  if (data.last_posted_at) out += `  · 最后回复：${formatDate(data.last_posted_at)}`;
  out += `\n`;

  // 状态标记
  const statusFlags = [];
  if (data.closed) statusFlags.push(`🔒 已关闭`);
  if (data.archived) statusFlags.push(`📦 已归档`);
  if (data.pinned || data.pinned_globally) statusFlags.push(`📌 置顶`);
  if (data.has_accepted_answer) statusFlags.push(`✅ 已有采纳答案`);
  if (statusFlags.length > 0) out += statusFlags.join("  ") + `\n`;

  // 参与者信息
  if (createdBy) {
    out += `👤 发帖人：${createdBy.name || createdBy.username}`;
    if (lastPoster && lastPoster.id !== createdBy.id) {
      out += `  · 最后回复：${lastPoster.name || lastPoster.username}`;
    }
    out += `\n`;
  }
  out += `\n`;

  if (posts.length === 0) {
    out += `暂无内容。\n`;
    return out;
  }

  // 最多展示前 10 楼
  const displayPosts = posts.slice(0, 10);
  out += `━━━ 帖子内容（共 ${data.posts_count ?? posts.length} 楼，显示前 ${displayPosts.length} 楼）━━━\n\n`;

  displayPosts.forEach((post) => {
    const content = stripHtml(post.cooked);
    const truncated = content.length > 800 ? content.slice(0, 800) + "\n…（内容过长已截断）" : content;

    // 楼层头部：楼号、回复关系、作者、时间、身份标记
    const replyInfo = post.reply_to_post_number ? ` （回复第 ${post.reply_to_post_number} 楼）` : "";
    const staffBadge = post.staff ? ` 🛡️` : "";
    const editedFlag = post.updated_at && post.updated_at !== post.created_at ? ` ✏️ 已编辑` : "";
    const acceptedFlag = post.accepted_answer ? ` ✅ 已采纳` : "";
    out += `**第 ${post.post_number} 楼**${replyInfo}${acceptedFlag}  👤 ${post.display_username || post.username}${staffBadge}  🕐 ${formatDate(post.created_at)}${editedFlag}\n`;

    // 互动数据：点赞（reactions 明细）、阅读、回复、引用
    const likeAction = post.actions_summary?.find((a) => a.id === 2);
    const totalLikes = likeAction?.count ?? 0;
    const reactions = post.reactions || [];
    if (totalLikes > 0) {
      const reactionDetail = reactions.length > 0
        ? reactions.map((r) => `${r.id} ×${r.count}`).join("  ")
        : null;
      out += `❤️ ${totalLikes} 点赞`;
      if (reactionDetail) out += `（${reactionDetail}）`;
      out += `\n`;
    }
    const meta = [];
    if (post.reads > 0) meta.push(`👁️ ${post.reads} 次阅读`);
    if (post.reply_count > 0) meta.push(`💬 ${post.reply_count} 个回复`);
    if (post.quote_count > 0) meta.push(`🔁 被引用 ${post.quote_count} 次`);
    if (post.incoming_link_count > 0) meta.push(`🔗 ${post.incoming_link_count} 条引用链接`);
    if (meta.length > 0) out += meta.join("  ") + `\n`;

    out += `\n${truncated}\n\n`;
  });

  if ((data.posts_count ?? posts.length) > 10) {
    out += `… 共 ${data.posts_count} 楼，访问链接查看完整内容：${FORUM_TOPIC_URL}/${data.slug}/${data.id}\n\n`;
  }

  out += `---\n数据来源：openEuler 社区论坛\n查询时间：${new Date().toLocaleString("zh-CN")}\n`;
  return out;
}

// ─── 供外部调用的原始搜索函数 ────────────────────────────────────────────────
/**
 * 获取论坛搜索原始数据（带缓存），供 getUnifiedSearch 使用
 * @returns {{ topics: Array, posts: Array, topicMap: object }}
 */
async function fetchForumSearchRaw(kw) {
  const now = Date.now();
  const cached = searchCache.get(kw);
  if (cached && now < cached.expiry) {
    return { topics: cached.topics, posts: cached.posts, topicMap: cached.topicMap };
  }

  const data = await fetchJson(
    `${FORUM_BASE_URL}/search/query?term=${encodeURIComponent(kw)}`
  );

  const topics = data.topics || [];
  const posts = data.posts || [];
  const topicMap = {};
  for (const t of topics) topicMap[t.id] = t;

  searchCache.set(kw, { topics, posts, topicMap, expiry: now + CACHE_DURATION });
  return { topics, posts, topicMap };
}

/**
 * 论坛关键词搜索，返回原始结果（供 getUnifiedSearch 使用）
 * @returns {{ topics: Array, posts: Array, topicMap: object }}
 */
export async function searchForumRaw(keyword) {
  const kw = keyword.trim();
  if (!kw) return { topics: [], posts: [], topicMap: {} };
  return fetchForumSearchRaw(kw);
}

// ─── 主查询函数 ──────────────────────────────────────────────────────────────

/**
 * 主查询函数
 * @param {string} queryType - "latest" | "top" | "search" | "detail"
 * @param {string} keyword   - 搜索关键词（search 模式必填）
 * @param {string|number} topicId - 帖子 ID（detail 模式必填，来自列表结果的 id 字段）
 */
export async function getForumInfo(queryType = "latest", keyword = "", topicId = "") {
  try {
    const now = Date.now();

    // ===== 帖子详情 =====
    if (queryType === "detail") {
      if (!topicId) {
        return `detail 模式必须提供 topic_id 参数（帖子唯一 ID）。\n\n💡 可从 latest/top/search 查询结果中获取帖子的 ID 字段，或直接从论坛链接中读取数字部分，如 https://forum.openeuler.org/t/topic/197 中的 197。`;
      }
      const data = await fetchTopicDetail(topicId);
      let result = formatTopicDetail(data);
      result = appendRecommendation(result, "get_forum_info", {});
      return result;
    }

    // ===== 最新帖子 =====
    if (queryType === "latest") {
      if (latestCache && now < latestCacheExpiry) {
        return formatLatest(latestCache);
      }
      const data = await fetchJson(`${FORUM_BASE_URL}/latest.json`);
      latestCache = data;
      latestCacheExpiry = now + CACHE_DURATION;
      return formatLatest(data);
    }

    // ===== 热门帖子 =====
    if (queryType === "top") {
      if (topCache && now < topCacheExpiry) {
        return formatTop(topCache);
      }
      const data = await fetchJson(`${FORUM_BASE_URL}/top.json`);
      topCache = data;
      topCacheExpiry = now + CACHE_DURATION;
      return formatTop(data);
    }

    // ===== 关键词搜索 =====
    if (queryType === "search") {
      const kw = keyword.trim();
      if (!kw) {
        return `search 模式必须提供 keyword 参数（搜索关键词）。\n\n💡 使用 query_type="latest" 可浏览最新帖子；使用 query_type="top" 可查看热门帖子。`;
      }

      const { topics, posts, topicMap } = await fetchForumSearchRaw(kw);
      let result = formatSearch({ topics, posts, grouped_search_result: {} }, kw);
      result = appendRecommendation(result, "get_forum_info", { keyword: kw });
      return result;
    }

    return `不支持的查询类型 "${queryType}"，请使用 "latest"、"top" 或 "search"。`;
  } catch (e) {
    if (e.name === "AbortError") {
      return "网络请求超时（15s），请稍后重试。";
    }
    return `查询论坛信息时发生错误：${e.message}`;
  }
}

// 工具定义
export const toolDefinition = {
  name: "get_forum_info",
  description: `查询 openEuler 社区论坛（forum.openeuler.org）的帖子信息。

**⚠️ 重要提示：**
这是查询社区讨论、经验分享、问题求助的核心工具。论坛中包含大量用户分享的实战经验、故障排查案例、技术讨论、最佳实践等内容，非常适合查找实际问题的解决方案。

**为什么应该使用论坛搜索？**
- 实战经验：社区用户分享的真实案例、踩坑经历、解决方案
- 问题讨论：大量技术问题、疑难杂症、故障排查的讨论帖
- 经验分享：配置技巧、性能调优、安全加固等最佳实践
- 活跃社区：持续有新帖子、新讨论、新技术话题

**适用场景（强烈推荐）：**
- 故障排查：安装失败、启动异常、配置报错、运行错误等问题讨论
- 迁移问题：CentOS 迁移遇到的困难、x2openEuler 使用问题、迁移经验分享
- 工具使用：各种工具的使用经验、配置技巧、常见问题解决
- 配置问题：网络、存储、安全、防火墙等配置相关的讨论
- 性能调优：性能优化经验分享、调优技巧讨论、性能问题求助
- 技术讨论：新特性讨论、技术方案分享、架构设计交流
- 经验求助：社区用户互相帮助解决问题、分享解决方案
- 项目交流：开源项目讨论、项目使用经验、项目问题反馈

**关键词示例（建议参考）：**
- 迁移类：x2openEuler、CentOS 迁移、迁移问题、迁移经验、迁移失败
- 故障类：安装失败、启动失败、配置错误、运行异常、报错、无法启动、报错信息
- 工具类：工具名称 + 问题/配置/使用（如 "x2openEuler 安装失败"、"Stratovirt 配置"）
- 配置类：网络配置、防火墙、存储配置、SELinux、权限配置
- 性能类：性能问题、性能优化、调优技巧、CPU 调优、内存优化
- 技术类：技术名称（如 eBPF、Redfish、BMC、Kylin、虚拟化、容器）
- 项目类：项目名称（如 A-Ops、SysOM、Nutshell、iSulad、Stratovirt）
- 场景类：内网部署、离线安装、特殊环境、实战案例

**查询模式：**

1. **关键词搜索**：query_type = "search"（最常用）
   - 根据关键词搜索相关话题和帖子
   - 返回匹配的话题列表和帖子片段（含内容摘要）
   - 支持中英文关键词
   - **这是最推荐的模式，适合查找具体问题的讨论**

2. **最新帖子**：query_type = "latest"（默认）
   - 获取论坛最新发布的 30 条帖子
   - 展示标题、链接、浏览量、回复数、点赞数、发帖人、发布时间
   - 适合了解社区最新动态

3. **热门帖子**：query_type = "top"
   - 获取近一个月论坛热度最高的 50 条帖子（按热度排序）
   - 适合了解社区近期关注的热点话题

4. **帖子详情**：query_type = "detail"
   - 获取指定帖子的完整内容（楼层内容、回复、点赞等）
   - 需提供 topic_id 参数（来自搜索/列表结果的 id 字段）
   - 最多展示前 10 楼正文内容

**参数说明：**
- query_type: 查询类型，search（搜索，最推荐）、latest（最新）、top（热门）、detail（详情）
- keyword: 搜索关键词（search 模式必填），支持中英文
- topic_id: 帖子 ID（detail 模式必填），从搜索结果获取

**返回信息：**
- 话题列表：标题、链接、回复数、点赞数、发帖人、发布时间、标签、摘要
- 帖子片段：帖子楼层内容、回复关系、点赞数、阅读数
- 帖子详情：完整楼层内容（最多前 10 楼）、回复、参与者、互动数据

**示例问题（强烈建议参考）：**
- "论坛上有人遇到过 x2openEuler 安装失败的问题吗？"
- "CentOS 迁移到 openEuler 的经验讨论"
- "内网环境部署 openEuler 的问题求助"
- "openEuler 安装后无法启动的讨论"
- "论坛上关于防火墙配置的讨论有哪些？"
- "有没有人分享过性能调优的经验？"
- "Docker 在 openEuler 上运行的讨论"
- "查找关于 eBPF 的技术讨论"
- "x2openEuler 使用问题讨论"
- "查看帖子 1451 的具体内容"

**典型使用流程：**
1. 使用 search 模式搜索关键词（如 "x2openEuler 安装失败"）
2. 从搜索结果中找到相关话题，查看摘要
3. 如需详细内容，记录话题 ID，使用 detail 模式获取完整帖子`,
  inputSchema: {
    type: "object",
    properties: {
      query_type: {
        type: "string",
        enum: ["latest", "top", "search", "detail"],
        description:
          "查询类型：'search'（关键词搜索，最推荐）、'latest'（最新30条，默认）、'top'（近一个月热门50条）、'detail'（帖子详情）。建议优先使用 search 模式查找具体问题的讨论。",
        default: "latest",
      },
      keyword: {
        type: "string",
        description:
          "搜索关键词（query_type='search' 时必填）。可以是工具名称（如 'x2openEuler'）、技术术语（如 'eBPF'）、问题描述（如 '安装失败'）、配置项（如 '防火墙配置'）、项目名称等。支持中英文。",
      },
      topic_id: {
        type: "string",
        description:
          "帖子唯一 ID（query_type='detail' 时必填）。从 search/latest/top 结果的 id 字段获取，或从论坛链接中读取数字部分，如 https://forum.openeuler.org/t/topic/197 中的 197。",
      },
    },
  },
};
