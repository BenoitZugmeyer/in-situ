2024-09-17 v2.3.0

- Feature: add support for specifying a character position instead of line/column
- Improve: improved error messages

2024-09-09 v2.2.0

- Fix: compatibility with latest NodeJS versions
- Improve: Migrate codebase to TypeScript
- Improve: Drop Jest in favor of native NodeJS test runner
- Improve: Drop Commander in favor of native NodeJS argument parser

2022-03-06 v2.1.0

- Feature: read from local files
- Build: upgrade dependencies
- Fix: improve error message in case of syntax error

2021-05-07 v2.0.2

- Security: upgrade dependencies

2020-09-04 v2.0.1

- Build: upgrade and reduce dependencies

2020-06-22 v2.0.0 - the `zugstack` release

- Breaking change: project renamed to `in-situ`
- Feature: use source maps if available
- Feature: use terser instead of uglify-es
- Feature: add options to configure how much lines are displayed
- Feature: more verbose output, and add an option to print debug messages
- Feature: only highlight code if stdout is a tty
- Feature: improve context format a bit
- Fix: don't break if the context code fails to parse
- Fix: don't mangle or compress the source code
- Fix: support wide characters (tab, emojis, ...)
- Security: update dependencies

2020-04-27 v1.0.2

- Security: update dependencies

2020-02-13 v1.0.1

- Fix: don't break if the `lastColumn` isn't provided by the source map
- Security: update dependencies

2018-07-19 v1.0.0

- Initial implementation
