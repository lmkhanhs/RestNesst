#!/usr/bin/env python3
"""Insert the ten reviewed local-image amenities through bounded MCP tools."""

import argparse
import json
from pathlib import Path
import selectors
import subprocess
import sys
import tempfile
import time
import unicodedata


def normalized(value):
    value = unicodedata.normalize("NFD", value).lower().replace("đ", "d")
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).split())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Insert only missing requested amenities.")
    options = parser.parse_args()
    directory = Path(__file__).resolve().parent
    root = directory.parents[1]
    catalog = json.loads((root / "airbnb_service/scripts/seed/amenities.json").read_text())
    if len(catalog) != 10 or len({normalized(row["name"]) for row in catalog}) != 10:
        raise RuntimeError("Expected ten distinct amenities in the local seed catalog.")
    for row in catalog:
        path = row["thumbnail_url"]
        if not path.startswith("/uploads/amenities/") or not path.endswith(".png") or ".." in path:
            raise RuntimeError("Refusing a thumbnail outside the local amenities folder.")
        if not (root / ("airbnb_service/src/main/resources/static" + path)).is_file():
            raise RuntimeError("A local amenity PNG is missing.")

    with tempfile.TemporaryFile(mode="w+") as errors:
        server = subprocess.Popen([sys.executable, str(directory / "run.py")],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=errors, text=True)
        selector = selectors.DefaultSelector()
        selector.register(server.stdout, selectors.EVENT_READ)
        sequence = 0

        def request(method, params):
            nonlocal sequence
            sequence += 1
            server.stdin.write(json.dumps({"jsonrpc": "2.0", "id": sequence,
                                          "method": method, "params": params}) + "\n")
            server.stdin.flush()
            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                if not selector.select(timeout=1):
                    if server.poll() is not None:
                        raise RuntimeError("Toolbox exited. Check local credentials and MySQL.")
                    continue
                line = server.stdout.readline()
                if not line:
                    raise RuntimeError("Toolbox closed its output.")
                message = json.loads(line)
                if message.get("id") == sequence:
                    if "error" in message:
                        raise RuntimeError("MCP protocol error: " + str(message["error"]))
                    result = message["result"]
                    if result.get("isError"):
                        raise RuntimeError("Amenity tool failed: " + json.dumps(result.get("content"), ensure_ascii=False))
                    return result
            raise TimeoutError("Toolbox request timed out.")

        def listing():
            result = request("tools/call", {"name": "amenities-list", "arguments": {}})
            rows = []
            for block in result.get("content", []):
                if block.get("type") == "text":
                    value = json.loads(block["text"])
                    rows.extend(value if isinstance(value, list) else [value])
            return {normalized(row["name"]): row for row in rows}

        try:
            request("initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                                    "clientInfo": {"name": "restnesst-local-amenities-seed", "version": "1.0"}})
            server.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n')
            server.stdin.flush()
            request("tools/list", {})
            existing = listing()
            created = skipped = 0
            for row in catalog:
                key = normalized(row["name"])
                if key in existing:
                    skipped += 1
                    print(f"SKIP id={existing[key]['id']}: {row['name']}")
                    continue
                if not options.apply:
                    print(f"NEW: {row['name']} -> {row['thumbnail_url']}")
                    continue
                request("tools/call", {"name": "amenities-create-local", "arguments": row})
                existing = listing()
                inserted = existing.get(key)
                if not inserted or inserted["thumnail_url"] != row["thumbnail_url"]:
                    raise RuntimeError("Inserted amenity did not match the requested local image; inspect before retrying.")
                if inserted["deleted"] != 0 or inserted["is_active"] != 1:
                    raise RuntimeError("Inserted amenity is not active and visible.")
                created += 1
                print(f"CREATED id={inserted['id']}: {row['name']} -> {row['thumbnail_url']}")
            print(f"Created={created}; skipped={skipped}; mode={'APPLY' if options.apply else 'READ-ONLY PREVIEW'}")
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
        print("Stopped; earlier individual inserts, if any, remain. Re-running skips existing names.", file=sys.stderr)
        sys.exit(1)
