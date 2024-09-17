#!/bin/bash

set -euo pipefail

DEFAULT_TEST_PATTERN='**/*.test.{js,ts}'

has_test_pattern=false
for arg in "$@"; do
  if [[ $arg != --* ]]; then
    has_test_pattern=true
    break
  fi
done

args=("$@")
if [[ $has_test_pattern == false ]]; then
  args+=("$DEFAULT_TEST_PATTERN")
fi

rm -fr coverage lcov.info

command=(node --test --experimental-strip-types "${args[@]}")
echo Running: "${command[@]}"
"${command[@]}"
