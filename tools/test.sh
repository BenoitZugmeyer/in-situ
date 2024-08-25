#!/bin/bash

set -euo pipefail

rm -fr coverage lcov.info
node --test --experimental-test-snapshots --experimental-strip-types "${@}" '**/*.test.{js,ts}'
