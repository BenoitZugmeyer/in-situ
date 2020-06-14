UNRELEASED v2.0.0 - the `zugstack` release

* Breaking change: project renamed to `in-situ`
* Feature: use source maps if available
* Feature: use terser instead of uglify-es
* Feature: more verbose output, and add an option to print debug messages
* Feature: only highlight code if stdout is a tty
* Feature: improve context format a bit
* Fix: don't break if the context code fails to parse
* Fix: don't mangle or compress the source code
* Fix: support wide characters (tab, emojis, ...)
* Security: update dependencies

2020-04-27 v1.0.2

* Security: update dependencies

2020-02-13 v1.0.1

* Fix: don't break if the `lastColumn` isn't provided by the source map
* Security: update dependencies

2018-07-19 v1.0.0

* Initial implementation