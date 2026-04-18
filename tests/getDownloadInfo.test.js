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

const MOCK_MIRRORS_DATA = [
  { Name: "华为云镜像", HttpURL: "https://mirrors.huawei.com/openeuler", Country: "中国", SponsorName: "华为", NetworkBandwidth: 1000, Enabled: true },
  { Name: "阿里云镜像", HttpURL: "https://mirrors.aliyun.com/openeuler", Country: "中国", SponsorName: "阿里云", NetworkBandwidth: 500, Enabled: true },
  { Name: "禁用镜像", Enabled: false }
];

const MOCK_VERSIONS_DATA = {
  RepoVersion: [
    { Version: "openEuler-24.03-LTS", LTS: true, Arch: ["x86_64", "aarch64"] },
    { Version: "openEuler-22.03-LTS-SP4", LTS: true, Arch: ["x86_64"] }
  ]
};

const MOCK_FILE_TREE_DATA = {
  FileInfo: { Path: "openEuler-24.03-LTS" },
  FileTree: [
    { Scenario: "ISO", Arch: "x86_64", Tree: [
      { Name: "openEuler-24.03-LTS-x86_64-dvd.iso", Size: "4.5GB", Path: "/ISO/x86_64/", ShaCode: "abc123..." }
    ]}
  ]
};

// 创建智能 mock fetch
function smartMockFetch(type) {
  return function(url, options) {
    if (type === "mirrors" && url.includes("mirrorstats=true")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_MIRRORS_DATA),
        text: () => Promise.resolve(JSON.stringify(MOCK_MIRRORS_DATA))
      });
    }
    if (type === "versions" && url === "https://www.openeuler.openatom.cn/api/mirrors/") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(MOCK_VERSIONS_DATA),
        text: () => Promise.resolve(JSON.stringify(MOCK_VERSIONS_DATA))
      });
    }
    if (type === "files") {
      if (url === "https://www.openeuler.openatom.cn/api/mirrors/") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_VERSIONS_DATA),
          text: () => Promise.resolve(JSON.stringify(MOCK_VERSIONS_DATA))
        });
      }
      if (url.includes("openEuler-24.03-LTS")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(MOCK_FILE_TREE_DATA),
          text: () => Promise.resolve(JSON.stringify(MOCK_FILE_TREE_DATA))
        });
      }
    }
    if (type === "notfound") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ FileTree: null }),
        text: () => Promise.resolve("Not Found")
      });
    }
    if (type === "timeout") {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("{}")
    });
  };
}

async function testQueryMirrors() {
  console.log("\n【测试 1】查询镜像仓列表");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("mirrors");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("", "mirrors");
    
    assert(result.includes("镜像仓列表"), "结果包含标题");
    assert(result.includes("华为云镜像"), "结果包含华为云镜像");
    assert(result.includes("阿里云镜像"), "结果包含阿里云镜像");
    assert(!result.includes("禁用镜像"), "结果不包含禁用镜像");
    assert(result.includes("mirrors.huawei.com"), "结果包含镜像 URL");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryVersions() {
  console.log("\n【测试 2】查询版本列表");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("versions");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("", "versions");
    
    assert(result.includes("版本列表"), "结果包含标题");
    assert(result.includes("openEuler-24.03-LTS"), "结果包含版本号");
    assert(result.includes("LTS"), "结果包含 LTS 信息");
    assert(result.includes("x86_64"), "结果包含架构信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryByVersion() {
  console.log("\n【测试 3】按版本号查询下载信息");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("files");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("openEuler-24.03-LTS");
    
    assert(result.includes("openEuler-24.03-LTS"), "结果包含版本号");
    assert(result.includes("ISO"), "结果包含场景类型");
    assert(result.includes("x86_64"), "结果包含架构");
    assert(result.includes("dvd.iso"), "结果包含文件名");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testAutoQueryMode() {
  console.log("\n【测试 4】自动查询模式");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("files");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("openEuler-24.03-LTS", "auto");
    
    assert(result.includes("下载信息") || result.includes("搜索结果") || result.includes("openEuler-24.03-LTS"), "自动模式返回下载信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNotFound() {
  console.log("\n【测试 5】查询不存在的版本");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("notfound");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("nonexistent-version");
    
    assert(result.includes("未找到") || result.includes("建议") || result.includes("无"), "未找到时返回提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNetworkTimeout() {
  console.log("\n【测试 6】网络超时处理");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("timeout");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("", "mirrors");
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 7】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    
    assert(toolDefinition.name === "get_download_info", "工具名称正确");
    assert(toolDefinition.inputSchema.required.includes("query"), "query 参数必需");
    const queryTypeEnum = toolDefinition.inputSchema.properties.query_type.enum;
    assert(queryTypeEnum.includes("auto"), "包含 auto 查询类型");
    assert(queryTypeEnum.includes("mirrors"), "包含 mirrors 查询类型");
    assert(queryTypeEnum.includes("versions"), "包含 versions 查询类型");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testMirrorDetails() {
  console.log("\n【测试 8】镜像详细信息展示");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("mirrors");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("", "mirrors");
    
    assert(result.includes("国家"), "结果包含国家信息");
    assert(result.includes("赞助商"), "结果包含赞助商信息");
    assert(result.includes("带宽"), "结果包含带宽信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testFileDetails() {
  console.log("\n【测试 9】文件详细信息展示");
  
  const originalFetch = global.fetch;
  global.fetch = smartMockFetch("files");
  
  try {
    const { getDownloadInfo } = await import("../src/tools/getDownloadInfo.js?" + Date.now());
    const result = await getDownloadInfo("openEuler-24.03-LTS");
    
    assert(result.includes("4.5GB") || result.includes("大小"), "结果包含文件大小");
    assert(result.includes("/ISO/x86_64/") || result.includes("路径"), "结果包含文件路径");
    assert(result.includes("abc123") || result.includes("SHA") || result.includes("SHA256"), "结果包含 SHA 校验码");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getDownloadInfo 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testQueryMirrors,
    testQueryVersions,
    testQueryByVersion,
    testAutoQueryMode,
    testNotFound,
    testNetworkTimeout,
    testToolDefinition,
    testMirrorDetails,
    testFileDetails,
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