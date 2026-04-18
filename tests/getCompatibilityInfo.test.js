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

const MOCK_WHOLE_MACHINE_DATA = {
  code: 0,
  result: {
    totalCount: 2,
    hardwareCompList: [
      { id: 1, hardwareFactory: "华为", hardwareModel: "TaiShan 200", cpu: "鲲鹏 920", architecture: "aarch64", osVersion: "openEuler-22.03-LTS", certificationTime: "2024-01-15" },
      { id: 2, hardwareFactory: "浪潮", hardwareModel: "NF5280M6", cpu: "Intel Xeon", architecture: "x86_64", osVersion: "openEuler-24.03-LTS", certificationTime: "2024-02-20" }
    ]
  }
};

const MOCK_BOARD_CARD_DATA = {
  code: 0,
  result: {
    totalCount: 3,
    driverCompList: [
      { boardCards: "Intel X710 网卡", chipVendor: "Intel", boardModel: "X710-DA4", boardCardType: "网卡", architecture: "x86_64", driverVersion: "2.1.0", certificationTime: "2024-03-01" },
      { boardCards: "Mellanox CX-5 网卡", chipVendor: "Mellanox", boardModel: "MCX516A", boardCardType: "网卡", architecture: "aarch64", certificationTime: "2024-03-10" }
    ]
  }
};

const MOCK_WHOLE_DETAIL_DATA = {
  code: 0,
  result: {
    hardwareFactory: "华为",
    hardwareModel: "TaiShan 200",
    cpu: "鲲鹏 920",
    architecture: "aarch64",
    osVersion: "openEuler-22.03-LTS",
    mainboardModel: "TaiShan 200",
    ram: "64GB",
    certificationTime: "2024-01-15"
  }
};

function createMockFetch(mockData, urlPattern) {
  return function(url, options) {
    const body = options?.body ? JSON.parse(options.body) : {};
    
    if (url.includes("hardwarecomp/findAll")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData)
      });
    }
    if (url.includes("drivercomp/findAll")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_BOARD_CARD_DATA)
      });
    }
    if (url.includes("hardwarecomp/getOne")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_WHOLE_DETAIL_DATA)
      });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };
}

async function testQueryWholeMachine() {
  console.log("\n【测试 1】查询整机兼容性测试");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("whole");
    
    assert(result.includes("整机兼容性"), "结果包含标题");
    assert(result.includes("华为"), "结果包含厂商");
    assert(result.includes("TaiShan"), "结果包含型号");
    assert(result.includes("鲲鹏"), "结果包含 CPU");
    assert(result.includes("aarch64"), "结果包含架构");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryBoardCard() {
  console.log("\n【测试 2】查询板卡兼容性测试");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("board");
    
    assert(result.includes("板卡兼容性"), "结果包含标题");
    assert(result.includes("网卡"), "结果包含板卡类型");
    assert(result.includes("Intel"), "结果包含芯片厂商");
    assert(result.includes("驱动"), "结果包含驱动信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryWithArchitecture() {
  console.log("\n【测试 3】按架构筛选查询");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("whole", "aarch64");
    
    assert(result.includes("架构") || result.includes("aarch64"), "结果包含架构信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryWithKeyword() {
  console.log("\n【测试 4】按关键词筛选查询");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("whole", "", "", "华为");
    
    assert(result.includes("关键词") || result.includes("华为"), "结果包含关键词信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryWithCardType() {
  console.log("\n【测试 5】按板卡类型筛选");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("board", "", "", "", "网卡");
    
    assert(result.includes("网卡"), "结果包含板卡类型筛选");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNotFound() {
  console.log("\n【测试 6】查询不存在的记录");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ code: 0, result: { totalCount: 0, hardwareCompList: [] } });
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("whole", "nonexistent");
    
    assert(result.includes("未找到") || result.includes("暂无"), "未找到时返回提示");
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
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("whole");
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 8】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getCompatibilityInfo.js");
    
    assert(toolDefinition.name === "get_compatibility_info", "工具名称正确");
    assert(toolDefinition.inputSchema.required.includes("query_type"), "query_type 参数必需");
    const queryTypeEnum = toolDefinition.inputSchema.properties.query_type.enum;
    assert(queryTypeEnum.includes("whole"), "包含 whole 查询类型");
    assert(queryTypeEnum.includes("board"), "包含 board 查询类型");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testInvalidQueryType() {
  console.log("\n【测试 9】无效查询类型");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_WHOLE_MACHINE_DATA);
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    const result = await getCompatibilityInfo("invalid_type");
    
    assert(result.includes("不支持") || result.includes("错误"), "无效类型返回错误提示");
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
      json: () => Promise.resolve(MOCK_WHOLE_MACHINE_DATA)
    });
  };
  
  try {
    const { getCompatibilityInfo } = await import("../src/tools/getCompatibilityInfo.js");
    await getCompatibilityInfo("whole");
    const firstCallCount = callCount;
    
    await getCompatibilityInfo("whole");
    
    assert(callCount === firstCallCount, "第二次查询使用缓存");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getCompatibilityInfo 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testQueryWholeMachine,
    testQueryBoardCard,
    testQueryWithArchitecture,
    testQueryWithKeyword,
    testQueryWithCardType,
    testNotFound,
    testNetworkTimeout,
    testToolDefinition,
    testInvalidQueryType,
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