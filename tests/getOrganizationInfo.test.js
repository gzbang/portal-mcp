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

const MOCK_ORGANIZATION_DATA = {
  zh: {
    memberList: [
      {
        title: "技术委员会",
        list: [
          { name: "胡欣蔚", post: "主席", email: "hu@test.com", gitee: "huxinwei" },
          { name: "熊伟", post: "委员", email: "xiong@test.com" }
        ]
      },
      {
        title: "品牌委员会",
        list: [
          { name: "梁冰", post: "主席" }
        ]
      },
      {
        title: "主委员会",
        list: [
          {
            title: "常务委员",
            personalList: [
              { name: "张三", position: ["常务委员"] },
              { name: "李四", position: ["常务委员", "执行总监"] }
            ]
          }
        ]
      }
    ],
    notice: "openEuler 社区治理架构"
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

async function testQueryAllCommittees() {
  console.log("\n【测试 1】查询所有委员会");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("所有");
    
    assert(result.includes("openEuler 组织架构"), "结果包含标题");
    assert(result.includes("技术委员会"), "结果包含技术委员会");
    assert(result.includes("品牌委员会"), "结果包含品牌委员会");
    assert(result.includes("治理架构"), "结果包含 notice");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryCommitteeByName() {
  console.log("\n【测试 2】按委员会名称查询");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("技术委员会");
    
    assert(result.includes("技术委员会"), "结果包含委员会名称");
    assert(result.includes("胡欣蔚"), "结果包含成员姓名");
    assert(result.includes("主席"), "结果包含职位");
    assert(result.includes("hu@test.com"), "结果包含邮箱");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryMemberByName() {
  console.log("\n【测试 3】按成员姓名查询");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("熊伟");
    
    assert(result.includes("熊伟"), "结果包含查询的成员");
    assert(result.includes("技术委员会"), "结果显示所属委员会");
    assert(result.includes("委员"), "结果包含职位");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryNestedStructure() {
  console.log("\n【测试 4】查询嵌套结构（personalList）");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("主委员会");
    
    assert(result.includes("主委员会"), "结果包含委员会名称");
    assert(result.includes("常务委员"), "结果包含分组标题");
    assert(result.includes("张三"), "结果包含成员");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryNotFound() {
  console.log("\n【测试 5】查询不存在的信息");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("不存在的人");
    
    assert(result.includes("未找到"), "结果包含未找到提示");
    assert(result.includes("可以查询"), "结果包含查询建议");
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
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("技术委员会");
    
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
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    const result = await getOrganizationInfo("技术委员会");
    
    assert(result.includes("错误") || result.includes("失败"), "API 错误时返回错误提示");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 8】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/getOrganizationInfo.js");
    
    assert(toolDefinition.name === "get_organization_info", "工具名称正确");
    assert(toolDefinition.description.length > 0, "存在描述");
    assert(toolDefinition.inputSchema.required.includes("query"), "query 参数必需");
    assert(toolDefinition.description.includes("治理委员会"), "描述区分治理委员会");
    assert(toolDefinition.description.includes("技术 SIG"), "描述区分技术 SIG");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testCacheMechanism() {
  console.log("\n【测试 9】缓存机制验证");
  
  let callCount = 0;
  const originalFetch = global.fetch;
  global.fetch = function(url, options) {
    callCount++;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_ORGANIZATION_DATA)
    });
  };
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    await getOrganizationInfo("技术委员会");
    const firstCallCount = callCount;
    
    await getOrganizationInfo("品牌委员会");
    
    assert(callCount === firstCallCount, "第二次查询使用缓存（未发起新请求）");
  } finally {
    global.fetch = originalFetch;
  }
}

async function testQueryAllKeywordVariants() {
  console.log("\n【测试 10】查询所有委员会的关键词变体");
  
  const originalFetch = global.fetch;
  global.fetch = createMockFetch(MOCK_ORGANIZATION_DATA);
  
  try {
    const { getOrganizationInfo } = await import("../src/tools/getOrganizationInfo.js");
    
    const resultAll = await getOrganizationInfo("所有");
    assert(resultAll.includes("组织架构"), "'所有' 关键词返回所有委员会");
    
    const resultAll2 = await getOrganizationInfo("全部");
    assert(resultAll2.includes("组织架构"), "'全部' 关键词返回所有委员会");
    
    const resultAll3 = await getOrganizationInfo("ALL");
    assert(resultAll3.includes("组织架构"), "'ALL' 关键词返回所有委员会");
  } finally {
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" getOrganizationInfo 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testQueryAllCommittees,
    testQueryCommitteeByName,
    testQueryMemberByName,
    testQueryNestedStructure,
    testQueryNotFound,
    testNetworkTimeout,
    testApiError,
    testToolDefinition,
    testCacheMechanism,
    testQueryAllKeywordVariants,
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