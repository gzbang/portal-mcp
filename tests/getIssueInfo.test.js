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

function createMockFetch({ data, forceError, status = 200 } = {}) {
  return function mockFetch(url, options) {
    if (forceError) return Promise.reject(forceError);

    if (status !== 200) {
      return Promise.resolve({
        ok: false,
        status: status,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("{}"),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  };
}

function makeIssueResponse(count = 5) {
  const issues = [];
  for (let i = 1; i <= count; i++) {
    issues.push({
      org: "openeuler",
      repo: "openeuler/kernel",
      sig: "Kernel",
      link: "https://atomgit.com/openeuler/kernel/issues/" + (100 + i),
      number: "1000" + i,
      state: i % 3 === 0 ? "closed" : "open",
      issue_type: i % 2 === 0 ? "缺陷" : "任务",
      issue_state: i % 3 === 0 ? "已完成" : "待办的",
      author: "user" + i,
      reporter: "",
      assignee: "dev" + i,
      created_at: "2026-04-" + (10 + i) + " 10:00:00",
      updated_at: "2026-04-" + (15 + i) + " 11:00:00",
      title: "测试 Issue " + i,
      priority: "高",
      labels: "sig/Kernel",
      branch: "",
      milestone: "",
    });
  }
  return {
    total: count,
    page: 1,
    per_page: 20,
    data: issues,
  };
}

async function importModule() {
  const module = await import("../src/tools/getIssueInfo.js");
  return module;
}

async function testBasicQuery() {
  console.log("\n【测试 1】基本查询 - 返回 Issue 列表");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(5) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ page: 1 });

    assert(result.includes("openEuler 社区 Issue"), "结果包含标题");
    assert(result.includes("共找到"), "结果包含总数");
    assert(result.includes("Issue 1"), "结果包含 Issue 序号");
    assert(result.includes("测试 Issue"), "结果包含 Issue 标题");
    assert(result.includes("kernel"), "结果包含仓库信息");
    assert(result.includes("查询时间"), "结果包含查询时间");
    assert(result.includes("Issue 编号"), "结果包含 Issue 编号字段");
    assert(result.includes("atomgit.com") || result.includes("链接:"), "结果包含 Issue 链接");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testFilterByState() {
  console.log("\n【测试 2】按状态筛选 - 进行中");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(3) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ issue_state: "进行中" });

    assert(result.includes("进行中"), "结果包含状态筛选条件");
    assert(result.includes("Issue"), "结果包含 Issue 信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testFilterByAuthor() {
  console.log("\n【测试 3】按创建者筛选");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(2) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ author: "gzbang" });

    assert(result.includes("创建者"), "结果包含创建者筛选条件");
    assert(result.includes("gzbang"), "结果包含创建者名称");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testFilterByRepo() {
  console.log("\n【测试 4】按仓库筛选");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(3) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ repo: "openeuler/kernel" });

    assert(result.includes("仓库"), "结果包含仓库筛选条件");
    assert(result.includes("kernel"), "结果包含仓库名称");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testSearch() {
  console.log("\n【测试 5】模糊搜索 - 搜索关键词");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(2) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ search: "docker" });

    assert(result.includes("搜索关键词"), "结果包含搜索关键词提示");
    assert(result.includes("docker"), "结果包含搜索关键词");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testPagination() {
  console.log("\n【测试 6】翻页查询 - 第 2 页");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ 
    data: {
      total: 100,
      page: 2,
      per_page: 20,
      data: makeIssueResponse(20).data,
    }
  });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ page: 2 });

    assert(result.includes("第 2 页") || result.includes("page: 2"), "结果包含页码信息");
    assert(result.includes("翻页"), "结果包含翻页提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNoData() {
  console.log("\n【测试 7】无数据返回");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: { total: 0, data: [] } });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ issue_state: "已取消" });

    assert(result.includes("暂无"), "结果包含暂无数据提示");
    assert(result.includes("调整查询条件"), "结果包含调整条件提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testTimeout() {
  console.log("\n【测试 8】网络超时处理");

  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ forceError: abortError });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ page: 1 });

    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testApiError() {
  console.log("\n【测试 9】API 错误状态码");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ status: 500 });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ page: 1 });

    assert(result.includes("错误") || result.includes("失败"), "API 错误时返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testMultipleFilters() {
  console.log("\n【测试 10】多条件组合筛选");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(3) });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({
      issue_state: "进行中",
      author: "gzbang",
      repo: "kernel",
    });

    assert(result.includes("进行中"), "结果包含状态筛选");
    assert(result.includes("gzbang"), "结果包含创建者筛选");
    assert(result.includes("kernel"), "结果包含仓库筛选");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testValidState() {
  console.log("\n【测试 11】状态验证 - 有效状态");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ data: makeIssueResponse(2) });

  try {
    const { getIssueInfo } = await importModule();
    const validStates = ["待办的", "进行中", "已完成", "新建"];

    for (const state of validStates) {
      const result = await getIssueInfo({ issue_state: state });
      assert(result.includes(state) || result.includes("Issue"), "状态 " + state + " 验证成功");
    }
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 12】toolDefinition 检查");

  try {
    const { toolDefinition } = await importModule();

    assert(toolDefinition.name === "get_issue_info", "工具名称正确");
    assert(toolDefinition.inputSchema !== undefined, "存在 inputSchema");
    assert(toolDefinition.inputSchema.properties.page !== undefined, "存在 page 参数");
    assert(toolDefinition.inputSchema.properties.issue_state !== undefined, "存在 issue_state 参数");
    assert(toolDefinition.inputSchema.properties.author !== undefined, "存在 author 参数");
    assert(toolDefinition.inputSchema.properties.repo !== undefined, "存在 repo 参数");
    assert(toolDefinition.inputSchema.properties.search !== undefined, "存在 search 参数");

    const stateEnum = toolDefinition.inputSchema.properties.issue_state.enum;
    assert(stateEnum.includes("进行中"), "状态枚举包含进行中");
    assert(stateEnum.includes("已完成"), "状态枚举包含已完成");
    assert(stateEnum.includes("新建"), "状态枚举包含新建");
  } catch (e) {
    assert(false, "测试失败: " + e.message);
  }
}

async function testRequestParams() {
  console.log("\n【测试 13】请求 URL 参数验证");

  let capturedUrl = null;

  const originalFetch = global.fetch;
  global.fetch = function (url, options) {
    capturedUrl = url;
    return createMockFetch({ data: makeIssueResponse(1) })(url, options);
  };

  try {
    const { getIssueInfo } = await importModule();
    await getIssueInfo({ page: 2, issue_state: "进行中", author: "test" });

    assert(capturedUrl !== null, "发起了请求");
    assert(capturedUrl.includes("page=2"), "URL 包含 page 参数");
    assert(capturedUrl.includes("per_page=20"), "URL 包含 per_page=20");
    assert(capturedUrl.includes("sort=created_at"), "URL 包含 sort=created_at");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testCaching() {
  console.log("\n【测试 14】缓存机制验证");

  let callCount = 0;

  const originalFetch = global.fetch;
  global.fetch = function (url, options) {
    callCount++;
    return createMockFetch({ data: makeIssueResponse(1) })(url, options);
  };

  try {
    const { getIssueInfo } = await importModule();

    await getIssueInfo({ page: 1 });
    await getIssueInfo({ page: 1 });

    assert(callCount === 1, "相同参数只调用一次 API（缓存生效）");

    await getIssueInfo({ page: 2 });
    assert(callCount === 2, "不同参数触发新的 API 调用");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testIssueDetailFormat() {
  console.log("\n【测试 15】Issue 详细信息格式化");

  const originalFetch = global.fetch;
  global.fetch = createMockFetch({
    data: {
      total: 1,
      page: 1,
      per_page: 20,
      data: [
        {
          org: "openeuler",
          repo: "src-openeuler/kernel",
          sig: "Kernel",
          link: "https://atomgit.com/openeuler/kernel/issues/123",
          number: "3851234",
          state: "open",
          issue_type: "缺陷",
          issue_state: "进行中",
          author: "developer1",
          reporter: "",
          assignee: "reviewer1",
          created_at: "2026-04-01 10:00:00",
          updated_at: "2026-04-15 11:00:00",
          title: "这是一个很长的标题测试截断功能超过100字符",
          priority: "高",
          labels: "bug,critical",
          branch: "",
          milestone: "",
        },
      ],
    },
  });

  try {
    const { getIssueInfo } = await importModule();
    const result = await getIssueInfo({ page: 1 });

    assert(result.includes("Issue 编号"), "结果包含 Issue 编号标签");
    assert(result.includes("标题"), "结果包含标题标签");
    assert(result.includes("状态"), "结果包含状态标签");
    assert(result.includes("仓库"), "结果包含仓库标签");
    assert(result.includes("创建者"), "结果包含创建者标签");
    assert(result.includes("优先级"), "结果包含优先级标签");
    assert(result.includes("链接"), "结果包含链接标签");
    assert(result.includes("类型"), "结果包含类型标签");
    assert(result.includes("处理状态"), "结果包含处理状态标签");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getIssueInfo 工具函数单元测试");
  console.log("==========================================");

  const tests = [
    testBasicQuery,
    testFilterByState,
    testFilterByAuthor,
    testFilterByRepo,
    testSearch,
    testPagination,
    testNoData,
    testTimeout,
    testApiError,
    testMultipleFilters,
    testValidState,
    testToolDefinition,
    testRequestParams,
    testCaching,
    testIssueDetailFormat,
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