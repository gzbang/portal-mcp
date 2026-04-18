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

const MOCK_LIFECYCLE_DATA = {
  data: [
    { name: "openEuler-24.03-LTS", releaseDate: "2024-03-15", eolDate: "2029-03-15", status: "维护中" },
    { name: "openEuler-22.03-LTS-SP4", releaseDate: "2024-06-30", eolDate: "2027-06-30", status: "维护中" }
  ]
};

const MOCK_PACKAGE_LIST_DATA = {
  data: [
    {
      children: [
        { name: "kernel", description: "Linux 内核", version: "5.10", pkgIds: { RPM: "123", OEPKG: "456" } },
        { name: "nginx", description: "高性能 Web 服务器", version: "1.24", pkgIds: { RPM: "789" } },
        { name: "redis", description: "内存数据库", version: "7.0", pkgIds: { RPM: "abc", IMAGE: "def" } }
      ]
    }
  ]
};

const MOCK_PACKAGE_DETAIL_DATA = {
  data: {
    RPM: {
      name: "kernel",
      version: "5.10.0",
      summary: "Linux 内核",
      license: "GPL",
      maintainerGiteeId: "kernel-maintainer"
    }
  }
};

function createMockFetchByUrl(urlMatch, mockData) {
  return function(url, options) {
    if (urlMatch(url)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData)
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({})
    });
  };
}

async function testQueryLifecycle() {
  console.log("\n【测试 1】查询发行版生命周期");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("eulerLifecycle"),
    MOCK_LIFECYCLE_DATA
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("", "lifecycle");
    
    assert(result.includes("生命周期"), "结果包含标题");
    assert(result.includes("openEuler-24.03-LTS"), "结果包含版本名称");
    assert(result.includes("发布日期"), "结果包含发布日期");
    assert(result.includes("EOL"), "结果包含 EOL 日期");
    assert(result.includes("状态"), "结果包含状态");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryPackageList() {
  console.log("\n【测试 2】查询软件包列表");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("mainPage"),
    MOCK_PACKAGE_LIST_DATA
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("kernel", "list");
    
    assert(result.includes("软件包列表"), "结果包含标题");
    assert(result.includes("kernel"), "结果包含软件包名");
    assert(result.includes("描述"), "结果包含描述信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryPackageDetail() {
  console.log("\n【测试 3】查询软件包详情");
  
  const originalFetch = global.fetch;
  global.fetch = function(url, options) {
    if (url.includes("mainPage")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_PACKAGE_LIST_DATA)
      });
    }
    if (url.includes("detail")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_PACKAGE_DETAIL_DATA)
      });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("kernel", "detail");
    
    assert(result.includes("软件包详情"), "结果包含详情标题");
    assert(result.includes("kernel"), "结果包含软件包名");
    assert(result.includes("RPM"), "结果包含包类型");
    assert(result.includes("GPL"), "结果包含许可证");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testAutoQueryEmpty() {
  console.log("\n【测试 4】自动查询模式 - 空查询返回生命周期");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("eulerLifecycle"),
    MOCK_LIFECYCLE_DATA
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("", "auto");
    
    assert(result.includes("生命周期"), "空查询返回生命周期信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testAutoQueryKeyword() {
  console.log("\n【测试 5】自动查询模式 - 关键词查询返回列表");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("mainPage"),
    MOCK_PACKAGE_LIST_DATA
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("nginx", "auto");
    
    assert(result.includes("软件包"), "关键词查询返回软件包信息");
    assert(result.includes("nginx"), "结果包含查询关键词");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNotFound() {
  console.log("\n【测试 6】查询不存在的软件包");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("mainPage"),
    { data: [] }
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("nonexistent", "list");
    
    assert(result.includes("未找到"), "未找到时返回提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNetworkTimeout() {
  console.log("\n【测试 7】网络超时处理");
  
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  
  const originalFetch = global.fetch;
  global.fetch = () => Promise.reject(abortError);
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("kernel", "list");
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 8】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getPackageInfo.js");
    
    assert(toolDefinition.name === "get_package_info", "工具名称正确");
    assert(toolDefinition.inputSchema.required.includes("query"), "query 参数必需");
    const queryTypeEnum = toolDefinition.inputSchema.properties.query_type.enum;
    assert(queryTypeEnum.includes("auto"), "包含 auto 查询类型");
    assert(queryTypeEnum.includes("lifecycle"), "包含 lifecycle 查询类型");
    assert(queryTypeEnum.includes("list"), "包含 list 查询类型");
    assert(queryTypeEnum.includes("detail"), "包含 detail 查询类型");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testPackageTypes() {
  console.log("\n【测试 9】软件包类型显示");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetchByUrl(
    url => url.includes("mainPage"),
    MOCK_PACKAGE_LIST_DATA
  );
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    const result = await getPackageInfo("redis", "list");
    
    assert(result.includes("可用类型") || result.includes("IMAGE") || result.includes("RPM"), "显示包类型信息");
  } finally {
    global.fetch = originalFetch;
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
      json: () => Promise.resolve(MOCK_LIFECYCLE_DATA)
    });
  };
  
  try {
    const { getPackageInfo } = await import("../src/tools/getPackageInfo.js");
    await getPackageInfo("", "lifecycle");
    const firstCallCount = callCount;
    
    await getPackageInfo("", "lifecycle");
    
    assert(callCount === firstCallCount, "第二次查询使用缓存");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getPackageInfo 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testQueryLifecycle,
    testQueryPackageList,
    testQueryPackageDetail,
    testAutoQueryEmpty,
    testAutoQueryKeyword,
    testNotFound,
    testNetworkTimeout,
    testToolDefinition,
    testPackageTypes,
    testCacheMechanism,
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