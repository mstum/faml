'use strict';
var faml = require("faml");

var parser = new faml.FamlParser();
var renderer = new faml.FamlRenderer();

var input = "test *with emph*";
var parsed = parser.parse(input);
var rendered = renderer.render(parsed);
console.log(rendered);