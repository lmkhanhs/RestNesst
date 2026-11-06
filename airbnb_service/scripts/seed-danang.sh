#!/usr/bin/env bash
set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root/airbnb_service"

# Compile the explicit command; do not start Spring, run initializers, send mail, or run tests.
mvn -q -DskipTests compile dependency:build-classpath -Dmdep.outputFile=target/danang-seed-classpath.txt
classpath="target/classes:$(cat target/danang-seed-classpath.txt)"
exec java -Drestnesst.root="$root" -cp "$classpath" com.pbl5cnpm.airbnb_service.seed.DaNangDevSeed "$@"
