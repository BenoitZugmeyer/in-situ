# in-situ

`in-situ` is a simple CLI application taking a JavaScript file URL and a line/column position inside
it.  It will download the JavaScript file, beautify it, and print the context around the given
position.

## Installation

```
npm install --global in-situ
```

## Usage

```
in-situ URL:LINE:COLUMN
```

## Example

```
in-situ https://unpkg.com/preact@8.2.9/dist/preact.min.js:1:3427
```
```js
            var n = t ? document.createElementNS("http://www.w3.org/2000/svg", e) : document.createElement(e);
            return n.__n = e, n;
        }(u, E), e)) {
            for (;e.firstChild; ) l.appendChild(e.firstChild);
            e.parentNode && e.parentNode.replaceChild(l, e), d(e, !0);
                              ^^^^^^^^^^
        }
        var _ = l.firstChild, p = l.__preactattr_, c = t.children;
        if (null == p) {
            p = l.__preactattr_ = {};
            for (var s = l.attributes, h = s.length; h--; ) p[s[h].name] = s[h].value;
```
