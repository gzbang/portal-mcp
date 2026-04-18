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

const MOCK_SEARCH_RESULT = {
  obj: {
    records: [
      { title: "openEuler 安装指南", textContent: "本文档介绍 openEuler 的安装步骤...", path: "docs/installation", version: "24.03_LTS" },
      { title: "内核配置", textContent: "内核配置是系统优化的关键...", path: "docs/kernel", version: "24.03_LTS" }
    ]
  }
};

function createMockFetch(mockData, status = 200) {
  return function(url, options) {
    return Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(mockData)
    });
  };
}

async function testSearchWithKeyword() {
  console.log("\n【测试 1】关键词搜索文档");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_SEARCH_RESULT);
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装", version: "24.03_LTS" });
    
    assert(result.includes("文档搜索结果"), "结果包含标题");
    assert(result.includes("安装"), "结果包含搜索关键词");
    assert(result.includes("openEuler 安装指南"), "结果包含文档标题");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testMissingKeyword() {
  console.log("\n【测试 2】缺少关键词参数");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ version: "24.03_LTS" });
    
    assert(result.includes("缺少") || result.includes("失败"), "缺少关键词返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testMissingVersion() {
  console.log("\n【测试 3】缺少版本参数");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装" });
    
    assert(result.includes("缺少") || result.includes("失败"), "缺少版本返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testInvalidLang() {
  console.log("\n【测试 4】无效语言参数");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({});
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "install", version: "24.03_LTS", lang: "fr" });
    
    assert(result.includes("必须是") || result.includes("失败"), "无效语言返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testZhLang() {
  console.log("\n【测试 5】中文语言搜索");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_SEARCH_RESULT);
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装", version: "24.03_LTS", lang: "zh" });
    
    assert(result.includes("中文"), "结果包含语言信息");
    assert(result.includes("安装"), "结果包含中文关键词");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testEnLang() {
  console.log("\n【测试 6】英文语言搜索");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_SEARCH_RESULT);
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "kernel", version: "24.03_LTS", lang: "en" });
    
    assert(result.includes("英文") || result.includes("en"), "结果包含语言信息");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testNoResults() {
  console.log("\n【测试 7】无搜索结果");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch({ obj: { records: [] } });
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "nonexistent", version: "24.03_LTS" });
    
    assert(result.includes("未找到") || result.includes("0 个"), "无结果返回提示");
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
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装", version: "24.03_LTS" });
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 9】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getDocsSearchContent.js");
    
    assert(toolDefinition.name === "get_docs_search_content", "工具名称正确");
    assert(toolDefinition.inputSchema.required.includes("keyword"), "keyword 参数必需");
    assert(toolDefinition.inputSchema.required.includes("version"), "version 参数必需");
    const langEnum = toolDefinition.inputSchema.properties.lang.enum;
    assert(langEnum.includes("zh"), "支持中文");
    assert(langEnum.includes("en"), "支持英文");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testDocLinkGeneration() {
  console.log("\n【测试 10】文档链接生成");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_SEARCH_RESULT);
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装", version: "24.03_LTS" });
    
    assert(result.includes("docs.openeuler.openatom.cn"), "结果包含文档域名");
    assert(result.includes(".html"), "结果包含 .html 扩展名");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testHtmlTagRemoval() {
  console.log("\n【测试 11】HTML 标签清理");
  
  const mockDataWithHtml = {
    obj: {
      records: [
        { title: "<span>安装指南</span>", textContent: "<p>本文档介绍安装步骤</p>", path: "docs/install", version: "24.03" }
      ]
    }
  };
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(mockDataWithHtml);
  
  try {
    const { getDocsSearchContent } = await import("../src/tools/getDocsSearchContent.js");
    const result = await getDocsSearchContent({ keyword: "安装", version: "24.03" });
    
    assert(!result.includes("<span>"), "标题中 HTML 标签被移除");
    assert(!result.includes("<p>"), "内容中 HTML 标签被移除");
    assert(result.includes("安装指南"), "结果包含清理后的标题");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getDocsSearchContent 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testSearchWithKeyword,
    testMissingKeyword,
    testMissingVersion,
    testInvalidLang,
    testZhLang,
    testEnLang,
    testNoResults,
    testNetworkTimeout,
    testToolDefinition,
    testDocLinkGeneration,
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