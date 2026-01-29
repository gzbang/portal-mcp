#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { glob } from "glob";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化服务器
const server = new Server(
  {
    name: "dev-tools-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 在代码文件中搜索特定查询内容
async function searchCode(query, directory = ".") {
  const results = [];
  const extensions = [".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css"];

  for (const ext of extensions) {
    const pattern = `${directory}/**/*${ext}`;
    const files = await glob(pattern, { ignore: "node_modules/**" });

    for (const filepath of files) {
      try {
        const content = await readFile(filepath, "utf-8");
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const matchContext = getContext(content, query);
          results.push(`文件：${filepath}\n${matchContext}\n--`);
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (results.length > 0) {
    return `搜索结果：\n\n${results.join("\n")}`;
  } else {
    return `在目录'${directory}'中未找到与'${query}'匹配的结果。`;
  }
}

// 获取匹配项周围的上下文
function getContext(content, query, contextLines = 3) {
  const lines = content.split("\n");
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length, i + contextLines + 1);
      const context = lines.slice(start, end).join("\n");
      matches.push(`行${start + 1}-${end}:\n${context}`);
    }
  }

  return matches.join("\n\n");
}

// 分析项目依赖项
async function analyzeDependencies(directory = ".") {
  const dependencyFiles = {
    python: ["requirements.txt", "setup.py", "pyproject.toml"],
    node: ["package.json"],
    dotnet: ["*.csproj", "*.fsproj", "*.vbproj"],
  };

  const results = [];

  for (const [lang, files] of Object.entries(dependencyFiles)) {
    for (const filePattern of files) {
      const pattern = `${directory}/**/${filePattern}`;
      const foundFiles = await glob(pattern, { ignore: "node_modules/**" });

      for (const filepath of foundFiles) {
        try {
          await readFile(filepath, "utf-8");
          results.push(`在${filepath}中发现${lang}依赖项`);
        } catch (e) {
          continue;
        }
      }
    }
  }

  if (results.length > 0) {
    return `依赖项分析：\n\n${results.join("\n")}`;
  } else {
    return `在目录'${directory}'中未找到依赖项文件。`;
  }
}

// 获取包的文档
async function fetchDocumentation(packageName) {
  try {
    // 对于Python包
    const pypiUrl = `https://pypi.org/pypi/${packageName}/json`;
    const pypiResponse = await fetch(pypiUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (pypiResponse.ok) {
      const data = await pypiResponse.json();
      const summary = data.info?.summary || "无摘要可用";
      const description = data.info?.description || "无描述可用";
      return `${packageName}的文档：\n\n摘要：${summary}\n描述：${description}`;
    }
  } catch (e) {
    // 继续尝试npm
  }

  // 如果PyPI失败，尝试npm包
  try {
    const npmUrl = `https://registry.npmjs.org/${packageName}`;
    const npmResponse = await fetch(npmUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (npmResponse.ok) {
      const data = await npmResponse.json();
      const description = data.description || "无描述可用";
      return `${packageName}的文档：\n\n描述：${description}`;
    }
  } catch (e) {
    // 失败
  }

  return `无法获取'${packageName}'的文档。`;
}

// 获取openEuler SIG的相关信息
async function getSigInfo(sigName) {
  try {
    const url = "https://www.openeuler.openatom.cn/api-magic/stat/sig/info";
    const params = new URLSearchParams({
      community: "openeuler",
      sig: sigName,
    });

    const response = await fetch(`${url}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      try {
        const result = await response.json();

        // API 返回格式: {code, message, data}
        if (result.code === 1 && result.data) {
          const data = result.data;

          // 格式化输出
          const sections = [];

          // 基本信息
          sections.push(`
╔════════════════════════════════════════════════════════════╗
║  ${sigName} SIG 信息                                         ║
╚════════════════════════════════════════════════════════════╝`);

          if (data.name) {
            sections.push(`\n【名称】${data.name}`);
          }

          if (data.description) {
            sections.push(`\n【描述】${data.description}`);
          }

          if (data.mailing_list) {
            sections.push(`\n【邮件列表】${data.mailing_list}`);
          }

          // Maintainers
          if (data.maintainers && data.maintainers.length > 0) {
            sections.push(`\n【Maintainers】(${data.maintainers.length} 人)`);
            data.maintainers.forEach((m, i) => {
              sections.push(`  ${i + 1}. ${m}`);
            });
          }

          // Maintainer 详细信息
          if (data.maintainer_info && data.maintainer_info.length > 0) {
            sections.push(`\n【Maintainer 详细信息】`);
            data.maintainer_info.forEach((info, i) => {
              sections.push(`  ${i + 1}. ${info.name || info.user_login}`);
              if (info.email) sections.push(`     邮箱: ${info.email}`);
              if (info.user_homepage_url) sections.push(`     主页: ${info.user_homepage_url}`);
            });
          }

          // Repositories
          if (data.repositories && data.repositories.length > 0) {
            sections.push(`\n【仓库】(${data.repositories.length} 个)`);
            data.repositories.slice(0, 20).forEach((repo, i) => {
              sections.push(`  ${i + 1}. ${repo}`);
            });
            if (data.repositories.length > 20) {
              sections.push(`  ... 还有 ${data.repositories.length - 20} 个仓库`);
            }
          }

          // Committers 统计
          if (data.committers && data.committers.length > 0) {
            sections.push(`\n【Committers】共 ${data.committers.length} 人`);
          }

          // Committer 详细信息（只显示前 10 个）
          if (data.committer_info && data.committer_info.length > 0) {
            sections.push(`\n【活跃 Committers】(显示前 10 位)`);
            data.committer_info.slice(0, 10).forEach((info, i) => {
              const name = info.name || info.user_login || info.gitee_id || info.atomgit_id;
              sections.push(`  ${i + 1}. ${name}`);
              if (info.email) sections.push(`     邮箱: ${info.email}`);
              if (info.organization) sections.push(`     组织: ${info.organization}`);
            });
            if (data.committer_info.length > 10) {
              sections.push(`  ... 还有 ${data.committer_info.length - 10} 位 committers`);
            }
          }

          // Branches 信息
          if (data.branches && data.branches.length > 0) {
            sections.push(`\n【分支管理】(${data.branches.length} 个分支组)`);
            data.branches.slice(0, 3).forEach((branch, i) => {
              if (branch.repo_branch && branch.repo_branch.length > 0) {
                sections.push(`  分支组 ${i + 1}: ${branch.repo_branch.length} 个仓库分支`);
                if (branch.keeper && branch.keeper.length > 0) {
                  const keepers = branch.keeper.map(k => k.gitee_id || k.atomgit_id).join(", ");
                  sections.push(`    维护者: ${keepers}`);
                }
              }
            });
            if (data.branches.length > 3) {
              sections.push(`  ... 还有 ${data.branches.length - 3} 个分支组`);
            }
          }

          sections.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          sections.push(`数据来源: ${url}`);
          sections.push(`查询时间: ${new Date().toLocaleString('zh-CN')}`);
          sections.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          return sections.join("\n");
        } else if (result.code !== 1) {
          return `获取 ${sigName} SIG 信息失败：${result.message || '未知错误'}`;
        } else {
          return `${sigName} SIG 信息为空或不存在。`;
        }
      } catch (e) {
        return `解析 ${sigName} SIG 信息时出错：${e.message}`;
      }
    } else {
      return `获取 SIG 信息时 API 返回错误状态码：${response.status}`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时，请稍后重试。`;
    }
    return `获取 SIG 信息时发生错误：${e.message}`;
  }
}

// 获取openEuler相关信息的检索功能
async function getOpenEulerInfo(query) {
  try {
    const txtUrl = "https://openeuler.test.osinfra.cn/llms-full.txt";
    const response = await fetch(txtUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const content = await response.text();
      const queryLower = query.toLowerCase();
      const contentLower = content.toLowerCase();

      if (contentLower.includes(queryLower)) {
        const lines = content.split("\n");
        const results = [];

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            const start = Math.max(0, i - 2);
            const end = Math.min(lines.length, i + 3);
            const context = lines.slice(start, end).join("\n");
            results.push(`在第${i + 1}行附近找到：\n${context}\n--`);
          }
        }

        if (results.length > 0) {
          return `在openEuler文档中找到'${query}'的相关信息：\n\n${results.slice(0, 5).join("\n")}`;
        }
      } else {
        return `在openEuler文档中未找到'${query}'的相关信息，请访问 https://openeuler.test.osinfra.cn/ 查看详细文档。`;
      }
    } else {
      return `文档检索服务暂不可用，请访问 https://openeuler.test.osinfra.cn/ 查看openEuler相关文档。`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `文档检索服务暂不可用，请访问 https://openeuler.test.osinfra.cn/ 查看openEuler相关文档。\n错误信息：请求超时`;
    }
    return `文档检索服务暂不可用，请访问 https://openeuler.test.osinfra.cn/ 查看openEuler相关文档。\n错误信息：${e.message}`;
  }
}

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_code",
        description: "在代码文件中搜索特定查询内容",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "要在代码文件中搜索的查询内容",
            },
            directory: {
              type: "string",
              description: "搜索目录（默认：当前目录）",
            },
          },
        },
      },
      {
        name: "analyze_dependencies",
        description: "分析项目依赖项",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "分析目录（默认：当前目录）",
            },
          },
        },
      },
      {
        name: "fetch_documentation",
        description: "获取包的文档",
        inputSchema: {
          type: "object",
          required: ["package"],
          properties: {
            package: {
              type: "string",
              description: "要获取文档的包名",
            },
          },
        },
      },
      {
        name: "get_sig_info",
        description: "获取openEuler SIG的相关信息",
        inputSchema: {
          type: "object",
          required: ["sig_name"],
          properties: {
            sig_name: {
              type: "string",
              description: "要获取信息的SIG名称",
            },
          },
        },
      },
      {
        name: "get_openEuler_info",
        description: "获取openEuler相关信息的检索功能",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: {
              type: "string",
              description: "要检索的openEuler相关信息关键词",
            },
          },
        },
      },
    ],
  };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "search_code":
        result = await searchCode(args.query || "", args.directory || ".");
        break;

      case "analyze_dependencies":
        result = await analyzeDependencies(args.directory || ".");
        break;

      case "fetch_documentation":
        result = await fetchDocumentation(args.package || "");
        break;

      case "get_sig_info":
        result = await getSigInfo(args.sig_name || "");
        break;

      case "get_openEuler_info":
        result = await getOpenEulerInfo(args.query || "");
        break;

      default:
        result = `错误：未知工具：${name}`;
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `执行工具时发生错误：${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const PORT = process.env.PORT || 3000;

  const httpServer = http.createServer(async (req, res) => {
    // 添加 CORS 头
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // 处理 OPTIONS 预检请求
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === "/sse" && req.method === "GET") {
      console.error(`SSE客户端连接请求`);
      const transport = new SSEServerTransport("/message", res);
      await server.connect(transport);
      console.error(`SSE客户端已连接`);
    } else if (req.url === "/message" && req.method === "POST") {
      // 处理客户端发送的消息
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        console.error(`收到消息: ${body.substring(0, 100)}...`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
      });
    } else if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  httpServer.listen(PORT, () => {
    console.error(`MCP服务器已启动，监听端口 ${PORT}`);
    console.error(`SSE端点: http://localhost:${PORT}/sse`);
    console.error(`健康检查: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error("服务器错误：", error);
  process.exit(1);
});
