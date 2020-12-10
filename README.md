# javascript-deobfuscator

Experimental Javascript Deobfuscator based on AST transformations.

## Features
Currently, implements the following transformations:

- Simplify unary and binary expressions when operators are literals

```Javascript
'a' + 'b' + "c" + "\x64" --> 'abcd'
!!![] --> false
+(-(7*4+0xdf)) --> -251;
```


- Simplify member access when accessor is a literal value:

```Javascript
// Computed member expression to non-computed
"abcdef"['length'] --> "abcdef".length
// Combined with the previous transformation
"abcdef"['le'+'\x6e'+'g'+'th'] --> "abcdef".length 
'whatever'[0] --> 'w'
```

## Examples


## TODO
- Analyze and replace final/effectively final variables.


