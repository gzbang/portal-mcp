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

const MOCK_CLA_SIGNED = { code: "", msg: "", data: { signed: true, sign_time: "2024-01-15", user_name: "testuser" } };
const MOCK_CLA_NOT_SIGNED = { code: "", msg: "", data: { signed: false } };
const MOCK_SIG_GROUPS = { code: 200, data: [{ group_name: "sig-OpenDesign", etherpad: "https://etherpad.openeuler.org/p/OpenDesign", email_list: "opendesign@openeuler.org" }] };
const MOCK_MY_MEETINGS = { code: 200, data: [{ mid: 147, topic: "技术讨论", group_name: "sig-OpenDesign", date: "2024-04-17", start: "14:00", end: "16:00" }] };
const MOCK_CREATE_MEETING = { code: 200, data: 148 };
const MOCK_CANCEL_MEETING = { code: 200 };

function createMockFetch(mockData, status = 200) {
  return function(url, options) {
    return Promise.resolve({
      ok: status === 200,
      status,
      json: () => Promise.resolve(mockData)
    });
  };
}

async function testCheckClaNoToken() {
  console.log("\n【测试 1】CLA 查询 - 未配置 Token");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  process.env.OPENEULER_TOKEN = "";
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_cla");
    
    assert(result.includes("未配置") || result.includes("Token"), "未配置 Token 返回提示");
    assert(result.includes("如何配置"), "包含配置指引");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
  }
}

async function testCheckClaSigned() {
  console.log("\n【测试 2】CLA 查询 - 已签署");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "test_token";
  global.fetch = createMockFetch(MOCK_CLA_SIGNED);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_cla");
    
    assert(result.includes("已签署"), "显示已签署状态");
    assert(result.includes("testuser"), "显示签署账号");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function testCheckClaNotSigned() {
  console.log("\n【测试 3】CLA 查询 - 未签署");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "test_token";
  global.fetch = createMockFetch(MOCK_CLA_NOT_SIGNED);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_cla");
    
    assert(result.includes("未签署"), "显示未签署状态");
    assert(result.includes("如何签署"), "包含签署指引");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function testCheckSigGroups() {
  console.log("\n【测试 4】SIG 组身份查询");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "test_token";
  global.fetch = createMockFetch(MOCK_SIG_GROUPS);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_sig_groups");
    
    assert(result.includes("SIG 组"), "显示 SIG 组信息");
    assert(result.includes("sig-OpenDesign"), "显示 SIG 组名称");
    assert(result.includes("etherpad"), "显示 etherpad 信息");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function testCheckMyMeetings() {
  console.log("\n【测试 5】我参加的会议查询");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "test_token";
  global.fetch = createMockFetch(MOCK_MY_MEETINGS);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_my_meetings");
    
    assert(result.includes("会议"), "显示会议信息");
    assert(result.includes("技术讨论"), "显示会议议题");
    assert(result.includes("147"), "显示会议 ID");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function testInvalidOperationType() {
  console.log("\n【测试 6】无效操作类型");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  process.env.OPENEULER_TOKEN = "test_token";
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("invalid_operation");
    
    assert(result.includes("不支持"), "显示不支持提示");
    assert(result.includes("check_cla"), "显示支持的操作列表");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
  }
}

async function testNetworkTimeout() {
  console.log("\n【测试 7】网络超时处理");
  
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "test_token";
  global.fetch = () => Promise.reject(abortError);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_cla");
    
    assert(result.includes("超时"), "超时时返回超时提示");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function testToolDefinition() {
  console.log("\n【测试 8】toolDefinition 检查");
  
  try {
    const { toolDefinition } = await import("../src/tools/executeUserOperation.js");
    
    assert(toolDefinition.name === "execute_user_operation", "工具名称正确");
    assert(toolDefinition.inputSchema.required.includes("operation_type"), "operation_type 参数必需");
    const opTypeEnum = toolDefinition.inputSchema.properties.operation_type.enum;
    assert(opTypeEnum.includes("check_cla"), "包含 check_cla 操作");
    assert(opTypeEnum.includes("check_sig_groups"), "包含 check_sig_groups 操作");
    assert(opTypeEnum.includes("create_meeting"), "包含 create_meeting 操作");
    assert(opTypeEnum.includes("cancel_meeting"), "包含 cancel_meeting 操作");
  } catch (e) {
    assert(false, `测试失败: ${e.message}`);
  }
}

async function testCreateMeetingParams() {
  console.log("\n【测试 9】创建会议参数验证");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  process.env.OPENEULER_TOKEN = "test_token";
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    
    const result1 = await executeUserOperation("create_meeting", {});
    assert(result1.includes("缺少") || result1.includes("topic"), "缺少 topic 返回提示");
    
    const result2 = await executeUserOperation("create_meeting", { topic: "测试会议" });
    assert(result2.includes("缺少") || result2.includes("group_name"), "缺少 group_name 返回提示");
    
    const result3 = await executeUserOperation("create_meeting", { topic: "测试", group_name: "sig-Test" });
    assert(result3.includes("缺少") || result3.includes("platform"), "缺少 platform 返回提示");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
  }
}

async function testCancelMeetingParams() {
  console.log("\n【测试 10】取消会议参数验证");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  process.env.OPENEULER_TOKEN = "test_token";
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("cancel_meeting", {});
    
    assert(result.includes("缺少") || result.includes("meeting_id"), "缺少 meeting_id 返回提示");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
  }
}

async function testTokenInvalidGuide() {
  console.log("\n【测试 11】Token 无效提示");
  
  const originalToken = process.env.OPENEULER_TOKEN;
  const originalFetch = global.fetch;
  process.env.OPENEULER_TOKEN = "invalid_token";
  global.fetch = createMockFetch({}, 403);
  
  try {
    const { executeUserOperation } = await import("../src/tools/executeUserOperation.js");
    const result = await executeUserOperation("check_sig_groups");
    
    assert(result.includes("无效") || result.includes("过期"), "显示 Token 无效提示");
    assert(result.includes("如何获取"), "包含获取 Token 指引");
  } finally {
    process.env.OPENEULER_TOKEN = originalToken;
    global.fetch = originalFetch;
  }
}

async function runAllTests() {
  console.log("==========================================");
  console.log(" executeUserOperation 工具函数单元测试");
  console.log("==========================================");
  
  const tests = [
    testCheckClaNoToken,
    testCheckClaSigned,
    testCheckClaNotSigned,
    testCheckSigGroups,
    testCheckMyMeetings,
    testInvalidOperationType,
    testNetworkTimeout,
    testToolDefinition,
    testCreateMeetingParams,
    testCancelMeetingParams,
    testTokenInvalidGuide,
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