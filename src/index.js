#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { glob } from "glob";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      try {
        const data = await response.json();

        if (typeof data === "object" && data !== null) {
          const infoLines = [`${sigName} SIG信息：`, ""];

          for (const [key, value] of Object.entries(data)) {
            if (value !== null) {
              infoLines.push(`${key}: ${value}`);
            }
          }

          if (infoLines.length > 2) {
            return infoLines.join("\n");
          } else {
            return `${sigName} SIG信息存在但为空。`;
          }
        } else {
          return `获取${sigName} SIG信息时，API返回的不是预期的JSON结构。`;
        }
      } catch (e) {
        return `获取${sigName} SIG信息时，API返回的不是有效的JSON格式。`;
      }
    } else {
      return `获取SIG信息时API返回错误状态码：${response.status}`;
    }
  } catch (e) {
    if (e.name === "AbortError") {
      return `网络请求超时：${e.message}`;
    }
    return `获取SIG信息时发生错误：${e.message}`;
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("使用标准输入输出传输启动MCP服务器");
}

main().catch((error) => {
  console.error("服务器错误：", error);
  process.exit(1);
});
