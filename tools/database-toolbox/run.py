#!/usr/bin/env python3
"""Start the project MCP Toolbox without putting credentials in its arguments."""

import json
import os
from pathlib import Path
import stat
import sys


def main():
    directory = Path(__file__).resolve().parent
    binary = directory / ".bin" / "toolbox"
    if not binary.is_file():
        sys.exit("Toolbox is missing. Run bash tools/database-toolbox/install.sh first.")

    environment = os.environ.copy()
    if not environment.get("RESTNESST_MYSQL_PASSWORD"):
        credentials = directory / ".local" / "credentials.json"
        if not credentials.is_file():
            sys.exit("Missing local codex_dev credentials. See tools/database-toolbox/README.md.")
        metadata = credentials.stat()
        if metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) & 0o077:
            sys.exit("Local credentials must belong to the current user and have mode 0600.")
        try:
            password = json.loads(credentials.read_text())["password"]
        except (ValueError, KeyError):
            sys.exit("Invalid local credentials file; expected a password field.")
        if not isinstance(password, str) or not password:
            sys.exit("Local codex_dev password is empty.")
        environment["RESTNESST_MYSQL_PASSWORD"] = password

    os.execve(binary, [
        str(binary), "--stdio", "--config", str(directory / "tools.yaml"),
        "--disable-reload", "--disable-version-check", "--log-level", "ERROR",
    ], environment)


if __name__ == "__main__":
    main()
