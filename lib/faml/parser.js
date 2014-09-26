/* faml.js - faml reference implementation
   https://github.com/mstum/faml

   Copyright (c) 2014, Michael Stum
   Based on stmd.js, Copyright (c) 2014, John MacFarlane  / CommonMark - http://commonmark.org/
   Inspired by Markdown, Copyright © 2004, John Gruber - http://daringfireball.net/projects/markdown/

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
     // The Version of the Tree Format
    var ASTVersion = 1;

    // Some regexps used in inline parser:
    var ESCAPABLE = '[!"#$%&\'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]';
    var ESCAPED_CHAR = '\\\\' + ESCAPABLE;
    var REG_CHAR = '[^\\\\()\\x00-\\x20]';
    var IN_PARENS_NOSP = '\\((' + REG_CHAR + '|' + ESCAPED_CHAR + ')*\\)';

    var reLinkTitle = new RegExp(
            '^(?:"(' + ESCAPED_CHAR + '|[^"\\x00])*"' +
            '|' +
            '\'(' + ESCAPED_CHAR + '|[^\'\\x00])*\'' +
            '|' +
            '\\((' + ESCAPED_CHAR + '|[^)\\x00])*\\))');

    var reLinkDestinationBraces = new RegExp(
            '^(?:[<](?:[^<>\\n\\\\\\x00]' + '|' + ESCAPED_CHAR + '|' + '\\\\)*[>])');

    var reLinkDestination = new RegExp(
            '^(?:' + REG_CHAR + '+|' + ESCAPED_CHAR + '|' + IN_PARENS_NOSP + ')*');

    var reEscapable = new RegExp(ESCAPABLE);

    var reAllEscapedChar = new RegExp('\\\\(' + ESCAPABLE + ')', 'g');

    var reAllTab = /\t/g;

     var makeBlock = function (tag, start_line, start_column) {
         return { t: tag,
             open: true,
             last_line_blank: false,
             start_line: start_line,
             start_column: start_column,
             end_line: start_line,
             children: [],
             parent: null,
             // string_content is formed by concatenating strings, in finalize:
             strings: [],
             inline_content: []
         };
     };

     var stripBlock = function(block){
         delete block["open"];
         delete block.last_line_blank;
         delete block.start_line;
         delete block.start_column;
         delete block.end_line;
         delete block.strings;
         delete block.inline_content;
         if(block.children){
             for(var ix in block.children){
                 if(block.children.hasOwnProperty(ix)){
                     stripBlock(block.children[ix]);
                 }
             }
         }
     };

     var parse = function(input){
         var doc = makeBlock('Document', 1, 1);
         doc["version"] = ASTVersion;
         var tip = doc;

         // Remove the very last newline to avoid a stray empty line
         var lines = input.replace(/\n$/, '').split(/\r\n|\n|\r/);
         var len = lines.length;
         for (var i = 0; i < len; i++) {
             //incorporateLine(lines[i], i + 1);
         }
         while (tip) {
             //finalize(this.tip, len - 1);
         }
         //processInlines(doc);

         stripBlock(doc);
         return doc;
     };


    function FamlParser() {
        return {
            // Methods
            parse: parse
        };
    }

    exports.FamlParser = FamlParser;

})(typeof exports === 'undefined' ? this.faml || (this.faml = {}) : exports);