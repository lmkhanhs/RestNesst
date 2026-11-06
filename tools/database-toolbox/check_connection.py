#!/usr/bin/env python3
"""Check the actual MCP stdio transport using read-only tools only."""

import json
from pathlib import Path
import selectors
import subprocess
import sys
import tempfile
import time


def main():
    directory = Path(__file__).resolve().parent
    with tempfile.TemporaryFile(mode="w+") as errors:
        server = subprocess.Popen(
            [sys.executable, str(directory / "run.py")],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=errors, text=True,
        )
        selector = selectors.DefaultSelector()
        selector.register(server.stdout, selectors.EVENT_READ)
        sequence = 0

        def request(method, params):
            nonlocal sequence
            sequence += 1
            message = {"jsonrpc": "2.0", "id": sequence, "method": method, "params": params}
            server.stdin.write(json.dumps(message) + "\n")
            server.stdin.flush()
            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                if not selector.select(timeout=1):
                    if server.poll() is not None:
                        raise RuntimeError("MCP server exited before responding.")
                    continue
                line = server.stdout.readline()
                if not line:
                    raise RuntimeError("MCP server closed its output.")
                response = json.loads(line)
                if response.get("id") == sequence:
                    if "error" in response:
                        raise RuntimeError("MCP returned a protocol error.")
                    result = response["result"]
                    if result.get("isError"):
                        raise RuntimeError("MCP tool failed. Check MySQL and codex_dev credentials.")
                    return result
            raise TimeoutError("MCP request timed out.")

        try:
            result = request("initialize", {
                "protocolVersion": "2025-03-26", "capabilities": {},
                "clientInfo": {"name": "restnesst-read-only-check", "version": "1.0"},
            })
            print("MCP server:", result["serverInfo"]["name"], result["serverInfo"]["version"])
            server.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
            server.stdin.flush()
            manifest = request("tools/list", {})
            tools = {tool["name"]: tool for tool in manifest["tools"]}
            print("Available tools:", ", ".join(sorted(tools)))
            for name in ["countries-update-details", "countries-delete-unused"]:
                required = tools[name]["inputSchema"].get("required", [])
                if not {"id", "row_version"}.issubset(required):
                    raise RuntimeError("Write tool is missing its required preview parameters.")
            for name, arguments in [
                ("mysql-connection-info", {}),
                ("mysql-current-grants", {}),
                ("mysql-list-tables", {}),
                ("mysql-describe-table", {"table_name": "countries"}),
                ("mysql-list-foreign-keys", {}),
            ]:
                if tools[name].get("annotations", {}).get("readOnlyHint") is not True:
                    raise RuntimeError("Refusing to invoke a tool without its read-only annotation.")
                result = request("tools/call", {"name": name, "arguments": arguments})
                print(name + ":")
                for block in result.get("content", []):
                    if block.get("type") == "text":
                        print(block["text"])
            print("PASS: read-only MCP connection check. No business records were changed.")
        finally:
            selector.close()
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
            server.stdin.close()
            server.stdout.close()


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, TimeoutError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
