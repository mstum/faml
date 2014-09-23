/* faml.js - faml reference implementation
 https://github.com/mstum/faml

 Copyright (c) 2014, Michael Stum
 Based on stmd.js, Copyright (c) 2014, John MacFarlane  / CommonMark - http://commonmark.org/

 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following
 disclaimer in the documentation and/or other materials provided
 with the distribution.

 * Neither the name of Michael Stum nor the names of other
 contributors may be used to endorse or promote products derived
 from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

(function(exports) {

    // Helper function to produce content in a pair of HTML tags.
    var inTags = function(tag, attribs, contents, selfclosing) {
        var result = '<' + tag;
        if (attribs) {
            var i = 0;
            var attrib;
            while ((attrib = attribs[i]) !== undefined) {
                result = result.concat(' ', attrib[0], '="', attrib[1], '"');
                i++;
            }
        }
        if (contents) {
            result = result.concat('>', contents, '</', tag, '>');
        } else if (selfclosing) {
            result = result + ' />';
        } else {
            result = result.concat('></', tag, '>');
        }
        return result;
    };

    // Render an inline element as HTML.
    var renderInline = function(inline) {
        var attrs;
        switch (inline.t) {
            case 'Str':
                return escapeHtml(inline.c);
            case 'Linebreak':
                return inTags('br',[],"",true) + '\n';
            case 'Emph':
                return inTags('em', [], this.renderInlines(inline.c));
            case 'Strong':
                return inTags('strong', [], this.renderInlines(inline.c));
            case 'Entity':
                return inline.c;
            case 'Link':
                attrs = [['href', escapeHtml(inline.destination, true)]];
                if (inline.title) {
                    attrs.push(['title', escapeHtml(inline.title, true)]);
                }
                return inTags('a', attrs, this.renderInlines(inline.label));
            case 'Code':
                return inTags('code', [], escapeHtml(inline.c));
            default:
                console.log("Unknown inline type " + inline.t);
                return "";
        }
    };

    // Render a list of inlines.
    var renderInlines = function(inlines) {
        var result = '';
        for (var i=0; i < inlines.length; i++) {
            result = result + this.renderInline(inlines[i]);
        }
        return result;
    };

    // Render a single block element.
    var renderBlock = function(block, in_tight_list, code_prefix_class) {
        var tag;
        var attr;
        var info_words;
        switch (block.t) {
            case 'Document':
                var whole_doc = this.renderBlocks(block.children, in_tight_list, code_prefix_class);
                return (whole_doc === '' ? '' : whole_doc + '\n');
            case 'Paragraph':
                if (in_tight_list) {
                    // Inside a list, we don't want to render a <p> tag inside the <li> as this
                    // would usually cause large margins in the rendered output.
                    return this.renderInlines(block.inline_content);
                } else {
                    return inTags('p', [], this.renderInlines(block.inline_content));
                }
                break;
            case 'BlockQuote':
                var filling = this.renderBlocks(block.children, in_tight_list, code_prefix_class);
                return inTags('blockquote', [], filling === '' ? '\n' :
                    '\n' + this.renderBlocks(block.children, in_tight_list, code_prefix_class) + '\n');
            case 'ListItem':
                return inTags('li', [], this.renderBlocks(block.children, true, code_prefix_class).trim());
            case 'List':
                tag = block.list_data.type == 'Bullet' ? 'ul' : 'ol';
                attr = (!block.list_data.start || block.list_data.start == 1) ?
                    [] : [['start', block.list_data.start.toString()]];
                return inTags(tag, attr, '\n' + this.renderBlocks(block.children, in_tight_list, code_prefix_class) + '\n');
            case 'Header':
                tag = 'h' + block.level;
                return inTags(tag, [], this.renderInlines(block.inline_content));
            case 'FencedCode':
                info_words = block.info.split(/ +/);
                attr = info_words.length === 0
                    || info_words[0].length === 0
                        ? []
                        : [['class',code_prefix_class + escapeHtml(info_words[0],true)]];
                return inTags('pre', [],
                    inTags('code', attr, escapeHtml(block.string_content)));
            default:
                console.log("Unknown block type " + block.t);
                return "";
        }
    };

    // Render a list of block elements
    var renderBlocks = function(blocks, in_tight_list, code_prefix_class) {
        var result = [];
        for (var i=0; i < blocks.length; i++) {
            result.push(this.renderBlock(blocks[i], in_tight_list, code_prefix_class));
        }
        return result.join('\n');
    };

    var escapeHtml = function(s, preserve_entities) {
        if (preserve_entities) {
            return s.replace(/[&](?![#](x[a-f0-9]{1,8}|[0-9]{1,8});|[a-z][a-z0-9]{1,31};)/gi,'&amp;')
                .replace(/[<]/g,'&lt;')
                .replace(/[>]/g,'&gt;')
                .replace(/["]/g,'&quot;');
        } else {
            return s.replace(/[&]/g,'&amp;')
                .replace(/[<]/g,'&lt;')
                .replace(/[>]/g,'&gt;')
                .replace(/["]/g,'&quot;');
        }
    };

    var internalRenderer =
    {
        renderInline: renderInline,
        renderInlines: renderInlines,
        renderBlock: renderBlock,
        renderBlocks: renderBlocks
    };

    // ctor
    function FamlRenderer(){
        return {
            // Properties
            fencedClass: 'language-',

            // Methods
            render: function(input) {
                return internalRenderer.renderBlock(input, false, this.fencedClass);
            }
        };
    }

    exports.FamlRenderer = FamlRenderer;

})(typeof exports === 'undefined' ? this.faml || (this.faml = {}) : exports);