import { executeForumOperation, toolDefinition } from "../src/tools/executeForumOperation.js";

console.log("=== executeForumOperation 工具测试 ===\n");

// 测试 1: 工具定义
console.log("1. 测试工具定义");
console.log("工具名称:", toolDefinition.name);
console.log("支持的操作:", toolDefinition.inputSchema.properties.operation_type.enum);
console.log("默认操作:", toolDefinition.inputSchema.properties.operation_type.default);
console.log("✅ 工具定义正确\n");

// 测试 2: 未配置 FORUM_TOKEN 的 validate_token
console.log("2. 测试未配置 FORUM_TOKEN 的 validate_token");
delete process.env.FORUM_TOKEN;
const result1 = await executeForumOperation("validate_token");
console.log("返回结果:", result1.substring(0, 150));
console.log(result1.includes("未配置 FORUM_TOKEN") ? "✅ 正确返回未配置提示" : "❌ 未正确返回提示");
console.log("\n");

// 测试 3: 配置 FORUM_TOKEN
console.log("3. 测试配置 FORUM_TOKEN");
process.env.FORUM_TOKEN = "test_token";
console.log("FORUM_TOKEN:", process.env.FORUM_TOKEN);
console.log("✅ FORUM_TOKEN 配置完成\n");

// 测试 4: Token 校验（实际调用 API）
console.log("4. 测试 Token 校验（validate_token）");
const result2 = await executeForumOperation("validate_token");
console.log("返回结果:\n", result2.substring(0, 300));
console.log(result2.includes("✅ Token 校验成功") ? "✅ Token 校验成功" : "❌ Token 校验失败");
console.log("\n");

// 测试 5: 查询用户行为（全部类型）
console.log("5. 测试查询用户行为（get_user_actions，不传filter）");
const result3 = await executeForumOperation("get_user_actions");
console.log("返回结果:\n", result3.substring(0, 300));
console.log(result3.includes("✅ 用户行为查询成功") || result3.includes("✅ 查询完成") ? "✅ 查询成功" : "❌ 查询失败");
console.log("\n");

// 测试 6: 查询用户行为（特定类型）
console.log("6. 测试查询用户行为（get_user_actions，filter=5）");
const result4 = await executeForumOperation("get_user_actions", { filter: "5" });
console.log("返回结果:\n", result4.substring(0, 300));
console.log(result4.includes("filter=5") ? "✅ filter参数正确传递" : "❌ filter参数未正确传递");
console.log("\n");

// 测试 7: 缺少 topic_id 参数的 create_post
console.log("7. 测试缺少 topic_id 参数的 create_post");
const result5 = await executeForumOperation("create_post", {
  topic_id: 0,
  raw: "这是一条测试评论",
});
console.log("返回结果:", result5.substring(0, 150));
console.log(result5.includes("缺少必需参数") ? "✅ 正确返回参数缺失提示" : "❌ 未正确返回提示");
console.log("\n");

// 测试 8: 缺少 raw 参数的 create_post
console.log("8. 测试缺少 raw 参数的 create_post");
const result6 = await executeForumOperation("create_post", {
  topic_id: 197,
  raw: "",
});
console.log("返回结果:", result6.substring(0, 150));
console.log(result6.includes("缺少必需参数") ? "✅ 正确返回参数缺失提示" : "❌ 未正确返回提示");
console.log("\n");

// 测试 9: 不支持的操作类型
console.log("9. 测试不支持的操作类型");
const result7 = await executeForumOperation("invalid_operation", {});
console.log("返回结果:", result7.substring(0, 150));
console.log(result7.includes("不支持的操作类型") ? "✅ 正确返回不支持提示" : "❌ 未正确返回提示");
console.log("\n");

// 清除测试 Token
delete process.env.FORUM_TOKEN;

console.log("=== 所有测试完成 ===");