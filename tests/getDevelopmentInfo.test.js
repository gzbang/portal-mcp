let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("  ✅ PASS: " + message);
    passed++;
  } else {
    console.error("  ❌ FAIL: " + message);
    failed++;
  }
}

function createMockFetch({ data, forceError, status = 200 } = {}) {
  return function mockFetch(url, options) {
    if (forceError) return Promise.reject(forceError);
    if (status !== 200) {
      return Promise.resolve({ ok: false, status, json: () => Promise.resolve({}), text: () => Promise.resolve("{}") });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve(JSON.stringify(data)) });
  };
}

function makeEventsResponse() {
  return {
    events: {
      "2026-04-18": [
        { action: 5, action_name: "pushed to", project_name: "openeuler/kernel", target_type: "Commit", target_title: "Fix bug", created_at: "2026-04-18T10:00:00Z", author: { username: "testuser" }, push_data: { ref: "master", commit_count: 3 } },
        { action: 1, action_name: "created", project_name: "openeuler/docs", target_type: "MergeRequest", target_title: "Update docs", target_iid: 42, created_at: "2026-04-18T09:00:00Z", author: { username: "testuser" }, merge_request_info: { source_branch: "feature", target_branch: "main" } },
      ],
    },
  };
}

function makeIssuesResponse(count = 3) {
  const issues = [];
  for (let i = 1; i <= count; i++) {
    issues.push({
      id: 100 + i, iid: i, title: "Test Issue " + i, state: i % 2 === 0 ? "closed" : "opened",
      project: { path_with_namespace: "openeuler/kernel" }, author: { username: "user" + i },
      assignees: [{ username: "assignee" + i }], created_at: "2026-04-" + (10 + i) + "T10:00:00Z",
      web_url: "https://gitcode.com/openeuler/kernel/issues/" + i, labels: [{ name: "bug" }],
    });
  }
  return issues;
}

function makePullRequestsResponse(count = 3) {
  const prs = [];
  const states = ["opened", "merged", "closed"];
  for (let i = 1; i <= count; i++) {
    prs.push({
      id: 200 + i, iid: i, number: i, title: "Test PR " + i, state: states[i % 3], body: "Test PR body",
      user: { login: "user" + i, name: "user" + i },
      base: { repo: { full_name: "openeuler/kernel" }, ref: "master" },
      head: { repo: { full_name: "user" + i + "/kernel" }, ref: "feature-" + i },
      source_branch: "feature-" + i, target_branch: "master",
      assignees: [{ login: "assignee" + i }], labels: [{ name: "sig/Kernel" }],
      created_at: "2026-04-" + (10 + i) + "T10:00:00+08:00",
      web_url: "https://gitcode.com/openeuler/kernel/merge_requests/" + i,
      draft: i % 4 === 0, mergeable: i % 5 !== 0, notes: i, added_lines: 100, removed_lines: 20,
    });
  }
  return prs;
}

function makePRFilesResponse(count = 3) {
  const files = [];
  for (let i = 1; i <= count; i++) {
    files.push({
      sha: "abc123" + i, filename: "src/file" + i + ".js", additions: 10 + i * 5, deletions: 2 + i,
      blob_url: "https://gitcode.com/openeuler/test/blob/abc/file" + i + ".js",
      raw_url: "https://raw.gitcode.com/openeuler/test/raw/abc/file" + i + ".js",
      patch: {
        diff: "@@ -1,5 +1,10 @@\n import Vue\n+import { useStore }\n",
        new_file: i === 2, deleted_file: i === 3, renamed_file: false,
        added_lines: 10 + i * 5, removed_lines: 2 + i,
      },
      source_branch: "feature-" + i, target_branch: "master",
    });
  }
  return files;
}

function makeCommentResponse() {
  return {
    id: 12345,
    user: { login: "testuser" },
    body: "这是一条测试评论",
    path: "src/main.c",
    position: 50,
    created_at: "2026-04-18T10:00:00Z",
    html_url: "https://gitcode.com/openeuler/test/pulls/3064#comment_12345",
  };
}

const originalEnv = process.env.GITCODE_TOKEN;

async function importModule() {
  return await import("../src/tools/getDevelopmentInfo.js");
}

async function testEventsQuery() {
  console.log("\n【测试 1】开发活动查询 - events");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeEventsResponse() });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("testuser", "events", "", "", "", 0);
    assert(result.includes("开发活动"), "结果包含标题");
    assert(result.includes("testuser"), "结果包含用户名");
    assert(result.includes("代码推送") || result.includes("pushed"), "结果包含推送活动");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testIssuesQuery() {
  console.log("\n【测试 2】Issue 查询 - issues");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssuesResponse(5) });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "issues", "", "", "", 0);
    assert(result.includes("Issue"), "结果包含 Issue 标题");
    assert(result.includes("Test Issue"), "结果包含标题内容");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testPullsQuery() {
  console.log("\n【测试 3】PR 查询 - pulls");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makePullRequestsResponse(5) });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "pulls", "created_by_me", "", "", 0);
    assert(result.includes("Pull Request"), "结果包含 PR 标题");
    assert(result.includes("我创建的") || result.includes("筛选"), "结果包含筛选条件");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testFilesQuery() {
  console.log("\n【测试 4】PR 文件变更查询 - files");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makePRFilesResponse(5) });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "files", "", "openeuler", "test-repo", 3064);
    assert(result.includes("文件变更"), "结果包含文件变更标题");
    assert(result.includes("test-repo"), "结果包含仓库名");
    assert(result.includes("#3064") || result.includes("3064"), "结果包含 PR 编号");
    assert(result.includes("src/file"), "结果包含文件名");
    assert(result.includes("diff") || result.includes("代码差异"), "结果包含代码差异");
    assert(result.includes("分析") || result.includes("帮我分析"), "结果包含分析建议");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testFilesMissingParams() {
  console.log("\n【测试 5】files 查询缺少参数");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "files", "", "", "", 0);
    assert(result.includes("参数错误") || result.includes("缺少"), "结果包含参数错误提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testCommentQuery() {
  console.log("\n【测试 15】PR 评论 - comment");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  let capturedOptions = null;
  global.fetch = function (url, options) {
    capturedOptions = options;
    return createMockFetch({ data: makeCommentResponse() })(url, options);
  };
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "comment", "", "openeuler", "test-repo", 3064, "这是一条测试评论", "src/main.c", 50);
    assert(result.includes("评论发布成功") || result.includes("成功"), "结果包含成功提示");
    assert(result.includes("test-repo"), "结果包含仓库名");
    assert(result.includes("3064"), "结果包含 PR 编号");
    assert(result.includes("这是一条测试评论"), "结果包含评论内容");
    assert(capturedOptions?.method === "POST", "使用 POST 方法");
    assert(capturedOptions?.body?.includes("body"), "body 参数包含评论内容");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testCommentMissingParams() {
  console.log("\n【测试 16】comment 查询缺少参数");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "comment", "", "", "", 0, "", "", 0);
    assert(result.includes("参数错误") || result.includes("缺少"), "结果包含参数错误提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testCommentRequestParams() {
  console.log("\n【测试 17】comment 请求 URL 参数验证");
  let capturedUrl = null;
  let capturedOptions = null;
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = function (url, options) {
    capturedUrl = url;
    capturedOptions = options;
    return createMockFetch({ data: makeCommentResponse() })(url, options);
  };
  try {
    const { getDevelopmentInfo } = await importModule();
    await getDevelopmentInfo("", "comment", "", "openeuler", "test-repo", 3064, "测试评论", "", 0);
    assert(capturedUrl !== null, "发起了请求");
    assert(capturedUrl.includes("/repos/openeuler/test-repo/pulls/3064/comments"), "URL 包含正确的路径");
    assert(capturedUrl.includes("access_token"), "URL 包含 access_token");
    assert(capturedOptions?.method === "POST", "使用 POST 方法");
    assert(capturedOptions?.body !== undefined, "包含 body 参数");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testCommentPRNotFound() {
  console.log("\n【测试 18】评论时 PR 不存在");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ status: 404 });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "comment", "", "openeuler", "test-repo", 99999, "测试评论", "", 0);
    assert(result.includes("不存在") || result.includes("无法访问"), "结果包含 PR 不存在提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testNoToken() {
  console.log("\n【测试 6】无 Token 配置");
  delete process.env.GITCODE_TOKEN;
  const originalFetch = global.fetch;
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("testuser", "events", "", "", "", 0);
    assert(result.includes("未配置") || result.includes("GITCODE_TOKEN"), "结果包含 Token 提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testTokenInvalid() {
  console.log("\n【测试 7】Token 无效");
  process.env.GITCODE_TOKEN = "invalid_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ status: 401 });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("testuser", "events", "", "", "", 0);
    assert(result.includes("无效") || result.includes("失败"), "结果包含 Token 无效提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testUserNotFound() {
  console.log("\n【测试 8】用户不存在");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ status: 404 });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("nonexistent", "events", "", "", "", 0);
    assert(result.includes("不存在") || result.includes("无法访问"), "结果包含用户不存在提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testPRNotFound() {
  console.log("\n【测试 9】PR 不存在");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ status: 404 });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("", "files", "", "openeuler", "test-repo", 99999);
    assert(result.includes("不存在") || result.includes("无法访问"), "结果包含 PR 不存在提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testTimeout() {
  console.log("\n【测试 10】网络超时");
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ forceError: abortError });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("testuser", "events", "", "", "", 0);
    assert(result.includes("超时"), "结果包含超时提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testEmptyData() {
  console.log("\n【测试 11】空数据返回");
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: { events: {} } });
  try {
    const { getDevelopmentInfo } = await importModule();
    const result = await getDevelopmentInfo("testuser", "events", "", "", "", 0);
    assert(result.includes("暂无") || result.includes("无公开"), "结果包含无数据提示");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 12】toolDefinition 检查");
  try {
    const { toolDefinition } = await importModule();
    assert(toolDefinition.name === "get_development_info", "工具名称正确");
    assert(toolDefinition.inputSchema.properties.gitcode_id !== undefined, "存在 gitcode_id");
    assert(toolDefinition.inputSchema.properties.query_type !== undefined, "存在 query_type");
    assert(toolDefinition.inputSchema.properties.pr_scope !== undefined, "存在 pr_scope");
    assert(toolDefinition.inputSchema.properties.owner !== undefined, "存在 owner");
    assert(toolDefinition.inputSchema.properties.repo !== undefined, "存在 repo");
    assert(toolDefinition.inputSchema.properties.number !== undefined, "存在 number");
    assert(toolDefinition.inputSchema.properties.comment_body !== undefined, "存在 comment_body");
    assert(toolDefinition.inputSchema.properties.comment_path !== undefined, "存在 comment_path");
    assert(toolDefinition.inputSchema.properties.comment_position !== undefined, "存在 comment_position");
    
    const queryTypeEnum = toolDefinition.inputSchema.properties.query_type.enum;
    assert(queryTypeEnum.includes("events"), "包含 events");
    assert(queryTypeEnum.includes("issues"), "包含 issues");
    assert(queryTypeEnum.includes("pulls"), "包含 pulls");
    assert(queryTypeEnum.includes("files"), "包含 files");
    assert(queryTypeEnum.includes("comment"), "包含 comment");
  } catch (e) {
    assert(false, "测试失败: " + e.message);
  }
}

async function testRequestParams() {
  console.log("\n【测试 13】请求 URL 参数验证");
  let capturedUrl = null;
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = function (url, options) {
    capturedUrl = url;
    return createMockFetch({ data: makePullRequestsResponse(1) })(url, options);
  };
  try {
    const { getDevelopmentInfo } = await importModule();
    await getDevelopmentInfo("", "pulls", "created_by_me", "", "", 0);
    assert(capturedUrl !== null, "发起了请求");
    assert(capturedUrl.includes("/user/pulls"), "URL 包含 user/pulls");
    assert(capturedUrl.includes("access_token"), "URL 包含 access_token");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function testFilesRequestParams() {
  console.log("\n【测试 14】files 请求 URL 参数验证");
  let capturedUrl = null;
  process.env.GITCODE_TOKEN = "test_token";
  const originalFetch = global.fetch;
  global.fetch = function (url, options) {
    capturedUrl = url;
    return createMockFetch({ data: makePRFilesResponse(1) })(url, options);
  };
  try {
    const { getDevelopmentInfo } = await importModule();
    await getDevelopmentInfo("", "files", "", "openeuler", "test-repo", 3064);
    assert(capturedUrl !== null, "发起了请求");
    assert(capturedUrl.includes("/repos/openeuler/test-repo/pulls/3064/files"), "URL 包含正确的路径");
    assert(capturedUrl.includes("access_token"), "URL 包含 access_token");
  } finally {
    global.fetch = originalFetch;
    process.env.GITCODE_TOKEN = originalEnv;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getDevelopmentInfo 工具函数单元测试");
  console.log("==========================================");

  const tests = [
    testEventsQuery,
    testIssuesQuery,
    testPullsQuery,
    testFilesQuery,
    testFilesMissingParams,
    testCommentQuery,
    testCommentMissingParams,
    testCommentRequestParams,
    testCommentPRNotFound,
    testNoToken,
    testTokenInvalid,
    testUserNotFound,
    testPRNotFound,
    testTimeout,
    testEmptyData,
    testToolDefinition,
    testRequestParams,
    testFilesRequestParams,
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (e) {
      console.error("  ❌ 测试异常: " + e.message);
      failed++;
    }
  }

  console.log("\n==========================================");
  console.log(" 测试结果: " + passed + " 通过, " + failed + " 失败");
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

runAllTests().catch((e) => {
  console.error("测试运行失败:", e);
  process.exit(1);
});