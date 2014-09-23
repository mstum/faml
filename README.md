# faml - A Markdown Language (v0.9)
`faml` is a simple markup language to give users basic text formatting. It is not intended to allow the full feature set of HTML (for that, look into [Markdown](http://daringfireball.net/projects/markdown/syntax), which supports inline-HTML) but instead a small, but useful set of common features.

`faml` is inspired by Markdown and [CommonMark](http://commonmark.org/) but is not intended to be compatible or a replacement - `faml` is its own markup language with its own focus of basic text formatting.

The `faml.js` reference implementation contains a parser and an HTML renderer. The examples below include the output of the reference renderer, but users can create their own renderers. Also, linebreaks (`\n`) have been added for readability in this document.

# Language Specification
## New Lines and Paragraphs
A newline is translated into a linebreak. More than one newline is translated into a single paragraph. `faml` implementation implicitly surrounds the entire input into a paragraph. Carriage returns (`\r`) are removed from the input. 

    Input:
    Line One
    Line Two

    Output:
    <p>Line One<br/>
    Line Two</p>

    Input:
    Line One

    Line Two

    Output:
    <p>Line One</p>
    <p>Line Two</p>

    Input:
    Line One


    Line Two

    Output:
    <p>Line One</p>
    <p>Line Two</p>

## HTML
`faml` does not allow any HTML. All input is HTML Encoded before it's being parsed.

    Input:
    It is true that 3<5 and 5>3. <3 Math :) Sad that they depreciated <blink>blink</blink> tags. I liked them.

    Output:
    <p>It is true that 3&lt;5 and 5&gt;3. &lt;3 Math :) Sad that they depreciated &lt;blink&gt;blink&lt;/blink&gt; tags. I liked them.</p>

## Emphasis and Strong Emphasis (Italic and Bold)
Text surrounded with single asterisks is emphasis, usually rendered italic:

    Input:
    This is *emphasized text*.

	Output:
    <p>This is <em>emphasized text</em>.</p>

Text surrounded with double asterisks is strong emphasis, usually rendered bold:

    Input:
    This is **strongly emphasized text**.

    Output:
    <p>This is <strong>strongly emphasized text</strong>.</p>

Text surrounded with triple asterisks is emphasized strong emphasis, usually rendered italic and bold:

    Input:
    This is ***emphasized strong emphasis***.

    Output:
    <p>This is <em><strong>emphasized strong emphasis</strong></em>.</p>

If you have more than three asterisks, the asterisks are taken as a literal.

    Input:
    *****Five Stars!*****

    Output:
    <p>*****Five Stars!*****</p>

## Escaping
If you need a literal character, prefix it with a backslash. To display a backslash that precedes a character that needs escaping, escape it with another backslash.

    Input:
    This is *Emphasis containing an asterisk, like this: \**.

    Output:
    <p>This is <em>Emphasis containing an asterisk, like this: *</em>.</p>

    Input:
    This is a backslash: \.

    Output:
    <p>This is a backslash: \.</p>

	Input:
    This is a backslash with emphasised text: \\*Hello!*.

    Output:
    <p>This is a backslash with emphasised text: \<em>Hello!</em>.</p>

## HTML Entities
HTML Entities do not have to be explicitly escaped.

    Input:
    Clever & Smart

    &nbsp; &amp; &copy; &AElig; &Dcaron; &frac34; &HilbertSpace; &DifferentialD; &ClockwiseContourIntegral;

    Output:
    <p>Clever &amp; Smart</p>
    <p>&nbsp; &amp; &copy; &AElig; &Dcaron; &frac34; &HilbertSpace; &DifferentialD; &ClockwiseContourIntegral;</p>

## Headings
Up to six levels of headings can be created by starting a line with one to six \# (hash) sign, a space, and the text. The \# sign must be the first character in a line.

    Input:
    # Heading 1
    ## Heading 2
    ### Heading 3
    #### Heading 4
    ##### Heading 5
    ###### Heading 6 - Inline formatting (like *this*) or [links](http://example.com) are supported
    #Missing Space
     # Not the first character in the line

    Output:
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6 - Inline formatting (like <em>this</em>) or <a href="http://example.com">links</a> are supported</h6>
    <p>#Missing Space<br/>
     # Not the first character in the line</p>

## Code/Pre Blocks
You can include inline code blocks by surrounding it with backticks (\`) - the key left of the `1` on a US Keyboard.

    Input:
    This is `an inline code block` in the text.

    Output:
    <p>This is <code>an inline code block</code> in the text.</p>

You can include a preformatted code block by putting exactly three backticks on its own line before and after.

    Input:
    ```
    public class SomeClass
    {
        // This is *a comment*.
        public int Id { get; set; }
    }
    ```

    Output:
    <pre><code>public class SomeClass
    {
        // This is *a comment*.
        public int Id { get; set; }
    }
    </code></pre>

If you want to add a custom CSS class to the output, you can put the class name immediately after the opening backticks. By default, the `Renderer` will prepend `language-` to it, but you can adjust that class name.

    Input:
    ```ruby
    puts 'Hello world'
    ```

    Output:
    <pre><code class="language-ruby">puts 'Hello world'
    </code></pre> 

## Links
By default, links are automatically hyperlinked. If a link starts with `http://`, `https://` or `ftp://` it is a hyperlink:

    Input:
    This is a link to https://github.com/mstum/faml - you can also read the blog on http://stum.de/ - Does anyone remember ftp://ftp.aminet.net ?

    Output:
    <p>This is a link to <a href="https://github.com/mstum/faml">https://github.com/mstum/faml</a> - you can also read the blog on <a href="http://stum.de/">http://stum.de/</a> - Does anyone remember <a href="ftp://ftp.aminet.net">ftp://ftp.aminet.net</a> ?</p>

Explicit links can also be specified. `faml` will not make any attempts to validate the correctness of the link.

    Input:
    This is [a link to my website](http://www.stum.de).

    Output:
    <p>This is <a href="http://www.stum.de">a link to my website</a>.

You can use inline formatting with Link labels:

    Input:
    [Check *this* out!](http://www.stum.de)

    Output:
    <p><a href="http://www.stum.de">Check <em>this</em> out!</a></p>

You can also give the link a title:

    Input:
    [Link With A Title](http://www.stum.de "My Blog")

    Output:
    <p><a href="http://www.stum.de" title="My Blog">Link With A Title</a></p> 

`faml` will balance parentheses to determine what is part of the URL. It is recommended to URL Encode parentheses, e.g. `%28` for `(` and `%29` for `)`.

    Input:
    We can't dance is an album by [Genesis](http://en.wikipedia.org/wiki/Genesis_(band))

    Output:
    We can't dance is an album by <a href="http://en.wikipedia.org/wiki/Genesis_(band)">Genesis</a></p>

    Input:  
    You can search Wikipedia for [In Held ('Twas) in I](http://en.wikipedia.org/w/index.php?search=In+Held+('Twas)+in+I). That's the name of Transatlantic's cover of the song, parentheses included.

    Output:  
    <p>You can search Wikipedia for <a href="http://en.wikipedia.org/w/index.php?search=In+Held+('Twas)+in+I">In Held ('Twas) in I</a>. That's the name of Transatlantic's cover of the song, parentheses included.</p>

`faml` implementations may optionally [URL Encode](http://en.wikipedia.org/wiki/Percent-encoding) the URL. 

## Lists
You can create ordered and unordered lists, with unlimited nesting. Nesting is done by an indent of 2 spaces per level. Unordered Lists have an asterisk as their list item indicator, while ordered lists use a numeral followed by a period. The list item indicator must be the first item in a line, unless it is a nested item. To have two lists follow each other immediately, two empty line is required. A space between the list item indicator and the content is required.

    Input:
    * Unordered List Item One
    * Unordered List Item Two
    * Unordered List Item Three


    * Another Unordered List Item One
    * Another Unordered List Item Two
      * Nested Item Two-One
        * Nested Item Two-One-One
        * Nested Item Two-One-Two
      * Nested Item Two-Two
    * Another Unordered List Item Three


    1. Ordered List Item One
    2. Ordered List Item Two
      1. Ordered List Item Two-One 
    3. Ordered List Item Three
      * Nested Unordered List Item One
      * Nested Unordered List Item Two
        1. Nested Ordered List Item One


    8. This list starts with 8.
    9. Item Nine
    12. Item Ten - ordered lists are sequential after the start!

    Output:
    <ul>
    <li>Unordered List Item One</li>
    <li>Unordered List Item Two</li>
    <li>Unordered List Item Three</li>
    </ul>
    <ul>
    <li>Another Unordered List Item One</li>
    <li>Another Unordered List Item Two
        <ul>
        <li>Nested Item Two-One
            <ul>
            <li>Nested Item Two-One-One</li>
            <li>Nested Item Two-One-Two</li>
            </ul>
        </li>
        </ul>
    </li>
    <li>Another Unordered List Item Three</li>
    </ul>
    <ol>
    <li>Ordered List Item One</li>
    <li>Ordered List Item Two
        <ol>
        <li>Ordered List Item Two-One</li>
        </ol>
    </li>
    <li>Ordered List Item Three
        <ul>
        <li>Nested Unordered List Item One</li>
        <li>Nested Unordered List Item Two
            <ol>
            <li>Nested Ordered List Item One</li>
            </ol>
        </li>
        </ul>
    </li>
    </ol>
    <ol start="8">
    <li>This list starts with 8.</li>
    <li>Item Nine</li>
    <li>Item Ten - ordered lists are sequential after the start!</li>
    </ol>

## Blockquotes
Starting a Line with a caret and space (`> `) will create a blockquote.

    Input:
    > It Belongs In a Museum!
    > *-- Henry Jones Jr., Indiana Jones and the Last Crusade*

    Output:
    <blockquote>
    <p>It Belongs In a Museum!<br /> <em>-- Henry Jones Jr., Indiana Jones and the Last Crusade</em></p>
    </blockquote> 

Newlines do not cancel blockquote mode, an empty line is required.

    Input:
    > It Belongs In a Museum!
    *-- Henry Jones Jr., Indiana Jones and the Last Crusade*

    Output:
    <blockquote>
    <p>It Belongs In a Museum!<br /> <em>-- Henry Jones Jr., Indiana Jones and the Last Crusade</em></p>
    </blockquote> 

An empty line can be used to get out of the blockquote:

    Input:
    > He said, she said

    Lorem Ipsum Dolor Sic Amet.

    Output:
    <blockquote>
    <p>He said, she said</p>
    </blockquote>
    <p>Lorem Ipsum Dolor Sic Amet.</p> 

# faml.js usage
Check the test.html page for an interactive sample.

    <script src="parser.js"></script>
    <script>
        var parser = new faml.FamlParser();
        var renderer = new faml.FamlRenderer();

        var input = "This is *a test*!";
        
        // Convert faml-text to Abstract syntax tree (AST)
        var parsed = parser.parse(input);

        // Render AST to HTML => <p>This is <em>a test</em>!</p>
        var html = renderer.render(parsed);

        // Put the HTML onto the page
        document.getElementById("rendered-html").innerHTML = html;
    </script>

## Parser

### Methods
* `parse(input)` - parses the faml input string and returns an AST

### Properties / Options
There are no options for the parser.

## Renderer

### Methods
* `render(ast)` - renders the given AST to a HTML string

### Properties / Options

#### fencedClass
The CSS class that is prepended to code blocks with a CSS class.
  
Example:

    var renderer = new faml.Renderer();
	renderer.fencedClass = "myClass-";

	Input faml:
    ```ruby
    puts 'Hello world'
    ```

    Output HTML:
    <pre><code class="myClass-ruby">puts 'Hello world'
    </code></pre>

## The Abstract Syntax Tree (AST)
*The AST Format will most likely change with 1.0! This documentation is incomplete.*

The AST is a tree with a root node:

    {
        children: [],
        inline_content: [],
        parent: null,
        t: "Document"
    }

The exact members and their meaning depend on the value of `t` (the node type). The root node *always* has a value of `Document`, and it is the only node with that type. The parser differentiates between *inline* and *block* nodes.

### General Properties
See the individual node type documentations for the exact meaning.

* `t` is the type of the node
* `parent` is the parent node of the current node - `null` for the root `Document` node
* `children` are child nodes of block nodes. This property does not exist on all node types.
* `inline_content` may exist on block nodes and indicates content that should be rendered inline within the block. This property does not exist on all node types.
* `c` is the content of inline nodes. This may be a string or an array of other inline nodes or may not exist at all.
* `string_content` is used by fenced code blocks to indicate that formatting needs to be kept.
* `start_column`, `start_line`, `end_line` indicate which part of the input text this block contains. This may not exactly match the input though because of normalizing line endings or spaces.

### Internal Properties
Any property not documented in the individual node types is used by the parser to maintain state or the result of generic parser code. These undocumented properties are subject to change/removal without notice.

### Block Node Types
#### Document
Exists exactly once, as the root element of the tree.

    {
      children: [],
      parent: null,
      t: "Document"
    }
 
#### Paragraph
Usually rendered as a `<p>` tag. Can contain inline elements, but not other block elements. Check the `inline_content` array.

    {
      inline_content: [
		{ c: "Lorem Ipsum", t: "Str" },
		{ t: "Linebreak" },
		{ c: "Dolor Sic Amet!", t: "Str" }
      ]
      parent: <ParentNode>,
      t: "Paragraph"
    }

### Header
Usually rendered as `<h1>` through `<h6>`. May contain multiple inline elements in `inline_content`. `level` is between 1 and 6.

    {
      inline_content: [
        { c: "This is ", t: "Str" },
		{ c: "an emphasized", t: "Emph" },
		{ c: " Header", t: "Str" },
      ],
      level: 1,
      parent: <ParentNode>,
      t: "Header"
    }

### BlockQuote
Usually rendered as `<blockquote>`. 

    {
      children: [
	    {
	      inline_content: [
			{ c: "Lorem Ipsum", t: "Str" },
			{ t: "Linebreak" },
			{ c: "Dolor Sic Amet!", t: "Str" }
	      ]
	      parent: <ParentNode>,
	      t: "Paragraph"
	    }
      ],
      parent: <ParentNode>,
      t: "BlockQuote"
    }

### FencedCode
Rendered as a `<pre>` with a `<code>` element by default. `info` is the optional CSS class name to be applied to the inner `<code>` element and may be an empty string (which means *not* to apply a class). The actual content is contained in `string_content`.

    {
      info: "ruby",
      parent: <ParentNode>,
      string_content: "puts 'Hello, World!'\nputs 'Example'"
      t: "FencedCode"
    }

### ListItem
Rendered as a `<li>`. The `children` can contain a variety of inline or block nodes.

    {
      children: [],
      parent: <ParentNode>,
      t: "ListItem"
    }

### List
Either an `<ul>` or `<ol>`, depending on the `list_data.type` which can be `Bullet` or `Ordered`. For `Ordered` there is a `list_data.start` property which indicates the start index. If this is not 1, the HTML Renderer will render `<ol start="X">`. 

`children` is an array of `ListItem` nodes.

    // Unordered List
    {
      children: [ <Array of ListItem nodes> ],
      list_data: {
        type: "Bullet"
      },
      parent: <ParentNode>,
      t: "List"
    }

    // Ordered List list_data
    list_data: {
      start: 1,
      type: "Ordered"
    }

### Inline Node Types
#### Str
A literal string that needs to be HTML Encoded.

    {
      c: "Lorem Ipsum Dolor Sic Amet",
      t: "Str"
    }

#### Linebreak
Usually rendered as a `<br/>` tag.

    {
      t: "Linebreak"
    }
 
#### Emph
Usually rendered as a `<em>` tag. The `c` member is an array of other inline elements

    {
      c: [
		{ c: "Lorem Ipsum", t: "Str" },
		{ t: "Linebreak" },
		{ c: "Dolor Sic Amet!", t: "Str" }
      ],
      t: "Emph"
    }

#### Strong
Usually rendered as a `<string>` tag. The `c` member is an array of other inline elements

    {
      c: [
		{ c: "Lorem Ipsum", t: "Str" },
		{ t: "Linebreak" },
		{ c: "Dolor Sic Amet!", t: "Str" }
      ],
      t: "Strong"
    }

#### Entity
A HTML Entity, usually rendered as-is.

    {
      c: "&copy;",
      t: "Entity"
    }

#### Link
Usually rendered as `<a href="http://www.stum.de" title="My Blog">A Link</a>`. `title` maybe be `undefined` if no title was given. `label` is an array of inline elements because link labels may be formatted.

    {
      destination: "http://www.Stum.de",
      label: [
		{ c: "Go To My Blog!", t: "Str" }
      ],
      t: "Link",
      titel: "My Blog"
    }

#### Code
This is an inline `<code>` block.

    {
      c: "var foo = new bar()",
      t: "Code"
    }