let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

const MOCK_LATEST_DATA = {
  topic_list: {
    topics: [
      { id: 197, slug: "topic", title: "如何安装 openEuler", views: 1000, reply_count: 5, like_count: 10, created_at: "2024-01-15T10:00:00Z", last_posted_at: "2024-01-16T12:00:00Z", posters: [{ user_id: 1 }] }
    ]
  },
  users: [{ id: 1, username: "testuser" }]
};

const MOCK_TOP_DATA = {
  topic_list: {
    topics: [
      { id: 200, slug: "hot-topic", title: "热门讨论：内核优化", views: 5000, reply_count: 50, like_count: 100, created_at: "2024-01-10T08:00:00Z" }
    ],
    for_period: "monthly"
  },
  users: []
};

const MOCK_SEARCH_DATA = {
  topics: [
    { id: 300, slug: "bmc-studio", title: "BMC Studio 使用指南", reply_count: 10, created_at: "2024-02-01T09:00:00Z" }
  ],
  posts: [
    { topic_id: 300, post_number: 5, username: "helper", blurb: "这个工具非常好用...", created_at: "2024-02-02T10:00:00Z" }
  ]
};

const MOCK_DETAIL_DATA = {
  id: 197,
  slug: "topic",
  title: "如何安装 openEuler",
  posts_count: 6,
  views: 1000,
  like_count: 10,
  created_at: "2024-01-15T10:00:00Z",
  post_stream: {
    posts: [
      { post_number: 1, username: "testuser", cooked: "<p>请问如何安装 openEuler？</p>", created_at: "2024-01-15T10:00:00Z" },
      { post_number: 2, username: "helper", cooked: "<p>您可以参考官方文档...</p>", created_at: "2024-01-15T11:00:00Z" }
    ]
  },
  details: { created_by: { id: 1, username: "testuser" } }
};

function createMockFetch(mockData, urlPattern) {
  return function(url, options) {
    if (urlPattern && url.includes(urlPattern)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData)
      });
    }
    if (url.includes("latest.json")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_LATEST_DATA)
      });
    }
    if (url.includes("top.json")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_TOP_DATA)
      });
    }
    if (url.includes("search/query")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_SEARCH_DATA)
      });
    }
    if (url.includes("/t/") && url.includes(".json")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_DETAIL_DATA)
      });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };
}

async function testQueryLatest() {
  console.log("\n【测试 1】查询最新帖子");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_LATEST_DATA);
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("latest");
    
    assert(result.includes("最新帖子"), "结果包含标题");
    assert(result.includes("如何安装 openEuler"), "结果包含帖子标题");
    assert(result.includes("forum.openeuler.org"), "结果包含论坛链接");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryTop() {
  console.log("\n【测试 2】查询热门帖子");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_TOP_DATA);
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("top");
    
    assert(result.includes("热门帖子"), "结果包含标题");
    assert(result.includes("内核优化"), "结果包含帖子标题");
    assert(result.includes("热度"), "结果包含热度排序说明");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQuerySearch() {
  console.log("\n【测试 3】关键词搜索");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_SEARCH_DATA);
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("search", "BMC Studio");
    
    assert(result.includes("搜索结果"), "结果包含标题");
    assert(result.includes("BMC Studio"), "结果包含搜索关键词");
    assert(result.includes("使用指南"), "结果包含帖子标题");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQuerySearchEmptyKeyword() {
  console.log("\n【测试 4】搜索关键词为空");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("search", "");
    
    assert(result.includes("必须提供"), "显示必须提供关键词提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryDetail() {
  console.log("\n【测试 5】查询帖子详情");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_DETAIL_DATA);
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("detail", "", "197");
    
    assert(result.includes("帖子详情"), "结果包含标题");
    assert(result.includes("如何安装 openEuler"), "结果包含帖子标题");
    assert(result.includes("第 1 楼"), "结果包含楼层信息");
    assert(result.includes("testuser"), "结果包含用户名");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryDetailMissingTopicId() {
  console.log("\n【测试 6】查询详情缺少 topic_id");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("detail");
    
    assert(result.includes("必须提供"), "显示必须提供 topic_id 提示");
    assert(result.includes("帖子唯一 ID"), "显示 ID 说明");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testInvalidQueryType() {
  console.log("\n【测试 7】无效查询类型");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("invalid_type");
    
    assert(result.includes("不支持"), "显示不支持提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNetworkTimeout() {
  console.log("\n【测试 8】网络超时处理");
  
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  
  const originalFetch = global.fetch;
  global.fetch = () => Promise.reject(abortError);
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("latest");
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 9】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getForumInfo.js");
    
    assert(toolDefinition.name === "get_forum_info", "工具名称正确");
    const queryTypeEnum = toolDefinition.inputSchema.properties.query_type.enum;
    assert(queryTypeEnum.includes("latest"), "包含 latest 查询类型");
    assert(queryTypeEnum.includes("top"), "包含 top 查询类型");
    assert(queryTypeEnum.includes("search"), "包含 search 查询类型");
    assert(queryTypeEnum.includes("detail"), "包含 detail 查询类型");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testCacheMechanism() {
  console.log("\n【测试 10】缓存机制验证");
  
  let callCount = 0;
  const originalFetch = global.fetch;
  global.fetch = function(url, options) {
    callCount++;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_LATEST_DATA)
    });
  };
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    await getForumInfo("latest");
    const firstCallCount = callCount;
    
    await getForumInfo("latest");
    
    assert(callCount === firstCallCount, "第二次查询使用缓存");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testHtmlTagRemoval() {
  console.log("\n【测试 11】HTML 标签清理");
  
  const mockDataWithHtml = {
    id: 197,
    slug: "topic",
    title: "测试帖子",
    post_stream: {
      posts: [
        { post_number: 1, username: "user", cooked: "<p>这是<strong>测试</strong>内容</p>", created_at: "2024-01-15" }
      ]
    },
    details: { created_by: { id: 1, username: "user" } }
  };
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(mockDataWithHtml, "/t/");
  
  try {
    const { getForumInfo, _resetCache } = await import("../src/tools/getForumInfo.js");
    _resetCache();
    const result = await getForumInfo("detail", "", "197");
    
    assert(!result.includes("<p>"), "HTML 标签被清理");
    assert(!result.includes("<strong>"), "HTML 标签被清理");
    assert(result.includes("测试"), "保留清理后的文本内容");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getForumInfo 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testQueryLatest,
    testQueryTop,
    testQuerySearch,
    testQuerySearchEmptyKeyword,
    testQueryDetail,
    testQueryDetailMissingTopicId,
    testInvalidQueryType,
    testNetworkTimeout,
    testToolDefinition,
    testCacheMechanism,
    testHtmlTagRemoval,
  ];
  
  for (const test of tests) {
    try {
      await test();
    } catch (e) {
      console.error(`  ❌ 测试异常: ${e.message}`);
      failed++;
    }
  }
  
  console.log("\n==========================================");
  console.log(` 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log("==========================================");
  
  if (failed > 0) process.exit(1);
}

runAllTests().catch((e) => {
  console.error("测试运行失败:", e);
  process.exit(1);
});