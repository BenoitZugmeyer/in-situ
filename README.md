# in-situ

`in-situ` is a simple CLI application taking a JavaScript file URL and a line/column location inside
it. It will download the JavaScript file, beautify it, and print the context around the given
location.

## Installation

Install it globally with your favorite node package manager. Example:

```
npm install --global in-situ
```

Note: instead of installing it, you can use `npx in-situ` to run it directly.

## Usage

```
Usage: in-situ [options] <LOCATION>

Download, beautify and print lines from a minified JavaScript source

The <LOCATION> argument is an URL or a file path to a JavaScript bundle, followed by a location formatted as ':line:column' or ':osition'. Example: 'https://example.com/bundle.js:10:20' or './bundle.js:123'.

Options:
  -A, --after-context <num>   print <num> lines of trailing context after the selected line
  -B, --before-context <num>  print <num> lines of leading context before the selected line
  -C, --context <num>         print <num> lines of leading and trailing context surrounding the selected line
  --no-source-map             don't try to use a source map
  -d, --debug                 output extra debugging
  -V, --version               output the version number
  -h, --help                  output usage information
```

## Example

```
in-situ https://unpkg.com/preact@10.4.4/dist/preact.min.js:1:3389
```

```js
File: ../src/diff/props.js
                                }
                        }

                        if (value) {
                                for (let i in value) {
                                        if (!oldValue || value[i] !== oldValue[i]) {
                                                                      ^
                                                setStyle(s, i, value[i]);
                                        }
                                }
                        }
                }
```
