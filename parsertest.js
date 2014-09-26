var doc = "# Heading 1 - Emphasis\
This is *emphasized* and **strongly emphasized** text, followed by ***strongly emphasized emphasis*** and `inline code`. This is *emphasis containing a \* in it*.\
\
## Heading 2 - Lists\
    * List Item One\
* List Item Two\
* Nested List Item Two-One\
    * Nested List Item Two-One-One\
    * Nested List Item Two-Two\
    * List Item Three\
\
1. Ordered List Item One\
* Nested Unordered List\
* Nested Item 2\
2. Ordered List Item Two\
\
### Heading 3 - Code Fences\
```ruby\
puts 'This is a fenced code block.'\
puts 'It is awesome if you want to copy/paste some code.'\
puts 'It preserves spacing:'\
\
#      **\
#     ****\
#    ******\
#      **\
#      **\
```\
\
#### Heading 4 - Block Quotes\
> It Belongs In a Museum!\
> *-- Henry Jones Jr., Indiana Jones and the Last Crusade*\
\
##### Heading 5 - Links\
Visit my Blog at http://www.stum.de or the [faml GitHub repository](https://github.com/mstum/faml).";


var faml = require("./lib/faml/parser.js");
var parser = new faml.FamlParser();
var tree = parser.parse(doc);
console.log(JSON.stringify(tree, 0, 4));
