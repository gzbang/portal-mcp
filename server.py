from mcp.server.lowlevel import Server
import mcp.types as types
import httpx
import os
import json
import glob

# 初始化服务器
app = Server("dev-tools-server")

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """处理来自客户端的工具调用。"""
    if name == "search_code":
        return await search_code(arguments.get("query", ""), arguments.get("directory", ""))
    elif name == "analyze_dependencies":
        return await analyze_dependencies(arguments.get("directory", "."))
    elif name == "fetch_documentation":
        return await fetch_documentation(arguments.get("package", ""))
    elif name == "get_sig_info":
        return await get_sig_info(arguments.get("sig_name", ""))
    elif name == "get_openEuler_info":
        return await get_openEuler_info(arguments.get("query", ""))
    else:
        return [types.TextContent(type="text", text=f"错误：未知工具：{name}")]

async def search_code(query: str, directory: str) -> list[types.TextContent]:
    """在代码文件中搜索特定查询内容。"""
    results = []
    for ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css']:
        for filepath in glob.glob(f"{directory}/**/*{ext}", recursive=True):
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                if query.lower() in content.lower():
                    match_context = get_context(content, query)
                    results.append(f"文件：{filepath}\n{match_context}\n--")
            except Exception as e:
                continue
    if results:
        return [types.TextContent(type="text", text="搜索结果：\n\n" + "\n".join(results))]
    else:
        return [types.TextContent(type="text", text=f"在目录'{directory}'中未找到与'{query}'匹配的结果。")]

def get_context(content: str, query: str, context_lines: int = 3) -> str:
    """获取匹配项周围的上下文。"""
    lines = content.split('\n')
    matches = []
    for i, line in enumerate(lines):
        if query.lower() in line.lower():
            start = max(0, i - context_lines)
            end = min(len(lines), i + context_lines + 1)
            context = "\n".join(lines[start:end])
            matches.append(f"行{start+1}-{end}:\n{context}")
    return"\n\n".join(matches)

async def analyze_dependencies(directory: str) -> list[types.TextContent]:
    """分析项目依赖项。"""
    dependency_files = {
        'python': ['requirements.txt', 'setup.py', 'pyproject.toml'],
        'node': ['package.json'],
        'dotnet': ['*.csproj', '*.fsproj', '*.vbproj'],
    }
    results = []
    for lang, files in dependency_files.items():
        for file_pattern in files:
            for filepath in glob.glob(f"{directory}/**/{file_pattern}", recursive=True):
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        content = file.read()
                    results.append(f"在{filepath}中发现{lang}依赖项")
                except Exception:
                    continue
    if results:
        return [types.TextContent(type="text", text="依赖项分析：\n\n" + "\n".join(results))]
    else:
        return [types.TextContent(type="text", text=f"在目录'{directory}'中未找到依赖项文件。")]

async def fetch_documentation(package: str) -> list[types.TextContent]:
    """获取包的文档。"""
    try:
        # 对于Python包
        url = f"https://pypi.org/pypi/{package}/json"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                summary = data.get("info", {}).get("summary", "无摘要可用")
                description = data.get("info", {}).get("description", "无描述可用")
                return [types.TextContent(type="text", text=f"{package}的文档：\n\n摘要：{summary}\n描述：{description}")]
    except Exception:
        pass
    # 如果PyPI失败，尝试npm包
    try:
        url = f"https://registry.npmjs.org/{package}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                description = data.get("description", "无描述可用")
                return [types.TextContent(type="text", text=f"{package}的文档：\n\n描述：{description}")]
    except Exception:
        pass
    return [types.TextContent(type="text", text=f"无法获取'{package}'的文档。")]

async def get_sig_info(sig_name: str) -> list[types.TextContent]:
    """获取openEuler SIG的相关信息。"""
    try:
        # 使用新的API接口
        url = f"https://www.openeuler.openatom.cn/api-magic/stat/sig/info"
        params = {
            "community": "openeuler",
            "sig": sig_name
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code == 200:
                try:
                    data = response.json()
                    # 检查响应数据结构
                    if isinstance(data, dict):
                        # 格式化SIG信息
                        info_lines = []
                        info_lines.append(f"{sig_name} SIG信息：")
                        info_lines.append("")
                        
                        # 遍历所有键值对
                        for key, value in data.items():
                            if value is not None:
                                info_lines.append(f"{key}: {value}")
                        
                        if len(info_lines) > 2:
                            return [types.TextContent(type="text", text="\n".join(info_lines))]
                        else:
                            return [types.TextContent(type="text", text=f"{sig_name} SIG信息存在但为空。")]
                    else:
                        return [types.TextContent(type="text", text=f"获取{sig_name} SIG信息时，API返回的不是预期的JSON结构。")]
                except json.JSONDecodeError:
                    return [types.TextContent(type="text", text=f"获取{sig_name} SIG信息时，API返回的不是有效的JSON格式。")]
            else:
                return [types.TextContent(type="text", text=f"获取SIG信息时API返回错误状态码：{response.status_code}")]
    except httpx.RequestError as e:
        return [types.TextContent(type="text", text=f"网络请求错误：{str(e)}")]
    except Exception as e:
        return [types.TextContent(type="text", text=f"获取SIG信息时发生错误：{str(e)}")]
    return [types.TextContent(type="text", text=f"无法获取'{sig_name}'的SIG信息。")]

async def get_openEuler_info(query: str) -> list[types.TextContent]:
    """获取openEuler相关信息的检索功能。"""
    try:
        # 首先尝试从vitepress-plugin-llms生成的txt文件中检索
        txt_url = "https://openeuler.test.osinfra.cn/llms-full.txt"
        async with httpx.AsyncClient() as client:
            response = await client.get(txt_url, timeout=10.0)
            if response.status_code == 200:
                content = response.text
                query_lower = query.lower()
                content_lower = content.lower()
                
                if query_lower in content_lower:
                    # 查找匹配内容的上下文
                    lines = content.split('\n')
                    results = []
                    for i, line in enumerate(lines):
                        if query_lower in line.lower():
                            start = max(0, i - 2)
                            end = min(len(lines), i + 3)
                            context = "\n".join(lines[start:end])
                            results.append(f"在第{i+1}行附近找到：\n{context}\n--")
                    
                    if results:
                        return [types.TextContent(type="text", text=f"在openEuler文档中找到'{query}'的相关信息：\n\n" + "\n".join(results[:5]))]
                else:
                    return [types.TextContent(type="text", text=f"在openEuler文档中未找到'{query}'的相关信息，请访问 https://openeuler.test.osinfra.cn/ 查看详细文档。")]
            else:
                # 如果txt文件无法访问，返回访问文档站点的提示
                return [types.TextContent(type="text", text=f"文档检索服务暂不可用，请访问 https://openeuler.test.osinfra.cn/ 查看openEuler相关文档。")]
    except httpx.RequestError as e:
        # 如果网络请求失败，返回访问文档站点的提示
        return [types.TextContent(type="text", text=f"文档检索服务暂不可用，请访问 https://openeuler.test.osinfra.cn/ 查看openEuler相关文档。\n错误信息：{str(e)}")]
    except Exception as e:
        return [types.TextContent(type="text", text=f"获取openEuler信息时发生错误：{str(e)}\n请访问 https://openeuler.test.osinfra.cn/ 查看详细文档。")]

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    """列出可用工具。"""
    return [
        types.Tool(
            name="search_code",
            description="在代码文件中搜索特定查询内容",
            inputSchema={
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {"type": "string", "description": "要在代码文件中搜索的查询内容"},
                    "directory": {"type": "string", "description": "搜索目录（默认：当前目录）"}
                }
            }
        ),
        types.Tool(
            name="analyze_dependencies",
            description="分析项目依赖项",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory": {"type": "string", "description": "分析目录（默认：当前目录）"}
                }
            }
        ),
        types.Tool(
            name="fetch_documentation",
            description="获取包的文档",
            inputSchema={
                "type": "object",
                "required": ["package"],
                "properties": {
                    "package": {"type": "string", "description": "要获取文档的包名"}
                }
            }
        ),
        types.Tool(
            name="get_sig_info",
            description="获取openEuler SIG的相关信息",
            inputSchema={
                "type": "object",
                "required": ["sig_name"],
                "properties": {
                    "sig_name": {"type": "string", "description": "要获取信息的SIG名称"}
                }
            }
        ),
        types.Tool(
            name="get_openEuler_info",
            description="获取openEuler相关信息的检索功能",
            inputSchema={
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {"type": "string", "description": "要检索的openEuler相关信息关键词"}
                }
            }
        )
    ]

if __name__ == "__main__":
    import sys
    # 默认使用标准输入输出传输
    transport = "stdio"
    port = 8000
    # 检查命令行参数
    if len(sys.argv) > 1:
        if sys.argv[1] == "sse":
            transport = "sse"
        if len(sys.argv) > 2:
            try:
                port = int(sys.argv[2])
            except ValueError:
                pass
    if transport == "sse":
        from mcp.server.sse import SseServerTransport
        from starlette.applications import Starlette
        from starlette.routing import Mount, Route
        import uvicorn
        sse = SseServerTransport("/messages/")
        async def handle_sse(request):
            async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
                await app.run(streams[0], streams[1], app.create_initialization_options())
        starlette_app = Starlette(
            debug=True,
            routes=[
                Route("/sse", endpoint=handle_sse),
                Mount("/messages/", app=sse.handle_post_message),
            ]
        )
        print(f"在端口{port}上启动MCP服务器，使用SSE传输")
        uvicorn.run(starlette_app, host="0.0.0.0", port=port)
    else:
        from mcp.server.stdio import stdio_server
        import anyio
        async def run_stdio():
            async with stdio_server() as streams:
                await app.run(streams[0], streams[1], app.create_initialization_options())
        print("使用标准输入输出传输启动MCP服务器")
        anyio.run(run_stdio)