# in-situ

`in-situ` is a simple CLI application taking a JavaScript file URL and a line/column position inside
it.  It will download the JavaScript file, beautify it, and print the context around the given
position.

## Installation

Install it globally with your favorite node package manager.  Example:
```
npm install --global in-situ
```

Note: instead of installing it, you can use `npx in-situ` to run it directly.

## Usage

```
Usage: in-situ [options] [command]

Download, beautify and print lines from a minified JavaScript source

Options:
  -V, --version                        output the version number
  -d, --debug                          output extra debugging
  -h, --help                           display help for command

Commands:
  context [options] <URL:LINE:COLUMN>
  help [command]                       display help for command
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
