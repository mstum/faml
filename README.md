# faml - A Markdown Language (v0.9)
[Documentation and Project Homepage: http://mstum.github.io/faml/](http://mstum.github.io/faml/)

`faml` is a markup language to allow safe and easy formatting of text, which is especially useful for websites that allow users to add contents (e.g., blog comments or forum postings). 

`faml` is inspired by [John Gruber's Markdown](http://daringfireball.net/projects/markdown/) and [CommonMark](http://commonmark.org/) but is not intended to be compatible or a replacement - `faml` is its own markup language with its own focus of basic text formatting.

The `faml.js` reference implementation contains a parser and an HTML renderer and works in browsers (IE9+) and node.js.

## faml.js usage 

Check the [Try it out!](http://mstum.github.io/faml/try.html) page for an interactive sample.

    <script src="faml.js"></script>
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

	// For node.js:
	// npm install faml
	// var faml = require("faml");
