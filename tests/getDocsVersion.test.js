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

const MOCK_VERSIONS_DATA = [
  { label: "24.03 LTS", value: "24.03_LTS", eom: false, branch: "stable2-24.03_LTS" },
  { label: "22.03 LTS SP4", value: "22.03_LTS_SP4", eom: false, branch: "stable2-22.03_LTS_SP4" },
  { label: "20.03 LTS", value: "20.03_LTS", eom: true, branch: "stable-20.03_LTS" }
];

function createMockFetch(mockData, status = 200) {
  return function(url, options) {
    return Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(mockData)
    });
  };
}

async function testGetDocsVersion() {
  console.log("\n【测试 1】获取文档版本列表");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_VERSIONS_DATA);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("文档版本"), "结果包含标题");
    assert(result.includes("24.03 LTS"), "结果包含版本标签");
    assert(result.includes("24.03_LTS"), "结果包含版本号");
    assert(result.includes("否"), "结果显示未终止支持状态");
    assert(result.includes("stable2"), "结果包含分支名");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testVersionSorting() {
  console.log("\n【测试 2】版本按版本号排序");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch([
    { label: "20.03 LTS", value: "20.03_LTS", eom: true, branch: "stable-20.03_LTS" },
    { label: "24.03 LTS", value: "24.03_LTS", eom: false, branch: "stable2-24.03_LTS" }
  ]);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    const indexOf24 = result.indexOf("24.03");
    const indexOf20 = result.indexOf("20.03");
    
    assert(indexOf24 < indexOf20, "版本按降序排列（24 在 20 之前）");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testGitRepoUrlGeneration() {
  console.log("\n【测试 3】文档仓库地址生成");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_VERSIONS_DATA);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("atomgit.com"), "结果包含 atomgit 域名");
    assert(result.includes("docs-centralized"), "结果包含 docs-centralized 仓库（stable2 分支）");
    assert(result.includes("docs"), "结果包含 docs 仓库（stable 分支）");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testEomStatus() {
  console.log("\n【测试 4】终止支持状态显示");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_VERSIONS_DATA);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("eom"), "结果包含 eom 字段说明");
    assert(result.includes("是"), "结果显示终止支持状态");
    assert(result.includes("否"), "结果显示未终止支持状态");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testEmptyResponse() {
  console.log("\n【测试 5】空响应处理");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch([]);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("0 个文档版本"), "空响应显示 0 个版本");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNetworkTimeout() {
  console.log("\n【测试 6】网络超时处理");
  
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  
  const originalFetch = global.fetch;
  global.fetch = () => Promise.reject(abortError);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testApiError() {
  console.log("\n【测试 7】API 错误处理");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({}, 500);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("错误") || result.includes("失败"), "API 错误时返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testInvalidResponseFormat() {
  console.log("\n【测试 8】无效响应格式处理");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ notArray: true });
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("失败") || result.includes("格式不正确"), "无效格式返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 9】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getDocsVersion.js");
    
    assert(toolDefinition.name === "get_docs_version", "工具名称正确");
    assert(toolDefinition.description.length > 0, "存在描述");
    assert(!toolDefinition.inputSchema.required || toolDefinition.inputSchema.required.length === 0, "无必填参数");
    assert(toolDefinition.description.includes("文档版本"), "描述包含关键词");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testVersionCount() {
  console.log("\n【测试 10】版本数量统计");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch([
    { label: "24.03 LTS", value: "24.03_LTS", eom: false, branch: "stable2-24.03_LTS" },
    { label: "22.03 LTS SP4", value: "22.03_LTS_SP4", eom: false, branch: "stable2-22.03_LTS_SP4" }
  ]);
  
  try {
    const { getDocsVersion } = await import("../src/tools/getDocsVersion.js");
    const result = await getDocsVersion();
    
    assert(result.includes("共找到 2 个文档版本"), "正确统计版本数量");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getDocsVersion 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testGetDocsVersion,
    testVersionSorting,
    testGitRepoUrlGeneration,
    testEomStatus,
    testEmptyResponse,
    testNetworkTimeout,
    testApiError,
    testInvalidResponseFormat,
    testToolDefinition,
    testVersionCount,
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