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

    // Matches a character with a special meaning in markdown,
    // or a string of non-special characters.
    var reMain = /^(?:[\n`\[\]\\!<&*_]|[^\n`\[\]\\!<&*_]+)/m;

// UTILITY FUNCTIONS

    // Replace backslash escapes with literal characters.
    var unescape = function (s) {
        return s.replace(reAllEscapedChar, '$1');
    };

    // Attempt to match a regex in string s at offset offset.
    // Return index of match or null.
    var matchAt = function (re, s, offset) {
        var res = s.slice(offset).match(re);
        if (res) {
            return offset + res.index;
        } else {
            return null;
        }
    };

    // Convert tabs to spaces on each line using a 4-space tab stop.
    var detabLine = function (text) {
        if (text.indexOf('\t') == -1) {
            return text;
        } else {
            var lastStop = 0;
            return text.replace(reAllTab, function (match, offset) {
                var result = '    '.slice((offset - lastStop) % 4);
                lastStop = offset + 1;
                return result;
            });
        }
    };

    // INLINE PARSER

    // These are methods of an InlineParser object, defined below.
    // An InlineParser keeps track of a subject (a string to be
    // parsed) and a position in that subject.

    // If re matches at current position in the subject, advance
    // position in subject and return the match; otherwise return null.
    var match = function (re) {
        var match = re.exec(this.subject.slice(this.pos));
        if (match) {
            this.pos += match.index + match[0].length;
            return match[0];
        } else {
            return null;
        }
    };

    // Returns the character at the current subject position, or null if
    // there are no more characters.
    var peek = function () {
        return this.subject[this.pos] || null;
    };

    // Parse zero or more space characters, including at most one newline
    var parseSpaceAndNewline = function () {
        this.match(/^ *(?:\n *)?/);
        return 1;
    };

    // All of the parsers below try to match something at the current position
    // in the subject.  If they succeed in matching anything, they
    // push an inline element onto the 'inlines' list.  They return the
    // number of characters parsed (possibly 0).

    // Attempt to parse backticks, adding either a backtick code span or a
    // literal sequence of backticks to the 'inlines' list.
    var parseBackticks = function (inlines) {
        var startpos = this.pos;
        var ticks = this.match(/^`+/);
        if (!ticks) {
            return 0;
        }
        var afterOpenTicks = this.pos;
        var foundCode = false;
        var match;
        while (!foundCode && (match = this.match(/`+/m))) {
            if (match == ticks) {
                inlines.push({ t: 'Code', c: this.subject.slice(afterOpenTicks,
                        this.pos - ticks.length)
                    .replace(/[ \n]+/g, ' ')
                    .trim() });
                return (this.pos - startpos);
            }
        }
        // If we got here, we didn't match a closing backtick sequence.
        inlines.push({ t: 'Str', c: ticks });
        this.pos = afterOpenTicks;
        return (this.pos - startpos);
    };

    // Parse a backslash-escaped special character, adding either the escaped
    // character or a literal backslash to the 'inlines' list.
    var parseEscaped = function (inlines) {
        var subj = this.subject,
            pos = this.pos;
        if (subj[pos] === '\\') {
            if (reEscapable.test(subj[pos + 1])) {
                inlines.push({ t: 'Str', c: subj[pos + 1] });
                this.pos = this.pos + 2;
                return 2;
            } else {
                this.pos++;
                inlines.push({t: 'Str', c: '\\'});
                return 1;
            }
        } else {
            return 0;
        }
    };

    // Scan a sequence of characters == c, and return information about
    // the number of delimiters and whether they are positioned such that
    // they can open and/or close emphasis or strong emphasis.  A utility
    // function for strong/emph parsing.
    var scanDelims = function (c) {
        var numdelims = 0;
        var first_close_delims = 0;
        var char_before, char_after;
        var startpos = this.pos;

        char_before = this.pos === 0 ? '\n' :
            this.subject[this.pos - 1];

        while (this.peek() === c) {
            numdelims++;
            this.pos++;
        }

        char_after = this.peek() || '\n';

        var can_open = numdelims > 0 && numdelims <= 3 && !(/\s/.test(char_after));
        var can_close = numdelims > 0 && numdelims <= 3 && !(/\s/.test(char_before));
        if (c === '_') {
            can_open = can_open && !((/[a-z0-9]/i).test(char_before));
            can_close = can_close && !((/[a-z0-9]/i).test(char_after));
        }
        this.pos = startpos;
        return { numdelims: numdelims,
            can_open: can_open,
            can_close: can_close };
    };

    // Attempt to parse emphasis or strong emphasis in an efficient way,
    // with no backtracking.
    var parseEmphasis = function (inlines) {
        var startpos = this.pos;
        var c;
        var first_close = 0;
        var nxt = this.peek();
        if (nxt == '*' || nxt == '_') {
            c = nxt;
        } else {
            return 0;
        }

        var numdelims;
        var delimpos;

        // Get opening delimiters.
        res = this.scanDelims(c);
        numdelims = res.numdelims;
        this.pos += numdelims;
        // We provisionally add a literal string.  If we match appropriate
        // closing delimiters, we'll change this to Strong or Emph.
        inlines.push({t: 'Str',
            c: this.subject.substr(this.pos - numdelims, numdelims)});
        // Record the position of this opening delimiter:
        delimpos = inlines.length - 1;

        if (!res.can_open || numdelims === 0) {
            return 0;
        }

        var first_close_delims = 0;

        switch (numdelims) {
            case 1:  // we started with *
                while (true) {
                    res = this.scanDelims(c);
                    if (res.numdelims >= 1 && res.can_close) {
                        this.pos += 1;
                        // Convert the inline at delimpos, currently a string with the delim,
                        // into an Emph whose contents are the succeeding inlines
                        inlines[delimpos].t = 'Emph';
                        inlines[delimpos].c = inlines.slice(delimpos + 1);
                        inlines.splice(delimpos + 1);
                        break;
                    } else {
                        if (this.parseInline(inlines) === 0) {
                            break;
                        }
                    }
                }
                return (this.pos - startpos);

            case 2:  // We started with **
                while (true) {
                    res = this.scanDelims(c);
                    if (res.numdelims >= 2 && res.can_close) {
                        this.pos += 2;
                        inlines[delimpos].t = 'Strong';
                        inlines[delimpos].c = inlines.slice(delimpos + 1);
                        inlines.splice(delimpos + 1);
                        break;
                    } else {
                        if (this.parseInline(inlines) === 0) {
                            break;
                        }
                    }
                }
                return (this.pos - startpos);

            case 3:  // We started with ***
                while (true) {
                    res = this.scanDelims(c);
                    if (res.numdelims >= 1 && res.numdelims <= 3 && res.can_close &&
                        res.numdelims != first_close_delims) {

                        if (first_close_delims === 1 && numdelims > 2) {
                            res.numdelims = 2;
                        } else if (first_close_delims === 2) {
                            res.numdelims = 1;
                        } else if (res.numdelims === 3) {
                            // If we opened with ***, then we interpret *** as ** followed by *
                            // giving us <strong><em>
                            res.numdelims = 1;
                        }

                        this.pos += res.numdelims;

                        if (first_close > 0) { // if we've already passed the first closer:
                            inlines[delimpos].t = first_close_delims === 1 ? 'Strong' : 'Emph';
                            inlines[delimpos].c = [
                                { t: first_close_delims === 1 ? 'Emph' : 'Strong',
                                    c: inlines.slice(delimpos + 1, first_close)}
                            ].concat(inlines.slice(first_close + 1));
                            inlines.splice(delimpos + 1);
                            break;
                        } else {  // this is the first closer; for now, add literal string;
                            // we'll change this when he hit the second closer
                            inlines.push({t: 'Str',
                                c: this.subject.slice(this.pos - res.numdelims,
                                    this.pos) });
                            first_close = inlines.length - 1;
                            first_close_delims = res.numdelims;
                        }
                    } else {  // parse another inline element, til we hit the end
                        if (this.parseInline(inlines) === 0) {
                            break;
                        }
                    }
                }
                return (this.pos - startpos);

            default:
                return res;
        }

        return 0;
    };

    // Attempt to parse link title (sans quotes), returning the string
    // or null if no match.
    var parseLinkTitle = function () {
        var title = this.match(reLinkTitle);
        if (title) {
            // chop off quotes from title and unescape:
            return unescape(title.substr(1, title.length - 2));
        } else {
            return null;
        }
    };

    // Attempt to parse link destination, returning the string or
    // null if no match.
    var parseLinkDestination = function () {
        var res = this.match(reLinkDestinationBraces);
        if (res) {  // chop off surrounding <..>:
            return unescape(res.substr(1, res.length - 2));
        } else {
            res = this.match(reLinkDestination);
            if (res !== null) {
                return unescape(res);
            } else {
                return null;
            }
        }
    };

    // Attempt to parse a link label, returning number of characters parsed.
    var parseLinkLabel = function () {
        if (this.peek() != '[') {
            return 0;
        }
        var startpos = this.pos;
        var nest_level = 0;
        if (this.label_nest_level > 0) {
            // If we've already checked to the end of this subject
            // for a label, even with a different starting [, we
            // know we won't find one here and we can just return.
            // This avoids lots of backtracking.
            // Note:  nest level 1 would be: [foo [bar]
            //        nest level 2 would be: [foo [bar [baz]
            this.label_nest_level--;
            return 0;
        }
        this.pos++;  // advance past [
        var c;
        while ((c = this.peek()) && (c != ']' || nest_level > 0)) {
            switch (c) {
                case '`':
                    this.parseBackticks([]);
                    break;
                case '<':
                    this.parseString([]);
                    break;
                case '[':  // nested []
                    nest_level++;
                    this.pos++;
                    break;
                case ']':  // nested []
                    nest_level--;
                    this.pos++;
                    break;
                case '\\':
                    this.parseEscaped([]);
                    break;
                default:
                    this.parseString([]);
            }
        }
        if (c === ']') {
            this.label_nest_level = 0;
            this.pos++; // advance past ]
            return this.pos - startpos;
        } else {
            if (!c) {
                this.label_nest_level = nest_level;
            }
            this.pos = startpos;
            return 0;
        }
    };

    // Parse raw link label, including surrounding [], and return
    // inline contents.  (Note:  this is not a method of InlineParser.)
    var parseRawLabel = function (s) {
        // note:  parse without a refmap; we don't want links to resolve
        // in nested brackets!
        return new InlineParser().parse(s.substr(1, s.length - 2), {});
    };

    // Attempt to parse a link.
    // If successful, add the link to inlines.
    var parseLink = function (inlines) {
        var startpos = this.pos;
        var n;
        var dest;
        var title;

        n = this.parseLinkLabel();
        if (n === 0) {
            return 0;
        }
        var rawlabel = this.subject.substr(startpos, n);

        // if we got this far, we've parsed a label.
        // Try to parse an explicit link: [label](url "title")
        if (this.peek() == '(') {
            this.pos++;
            if (this.parseSpaceAndNewline() &&
                ((dest = this.parseLinkDestination()) !== null) &&
                this.parseSpaceAndNewline() &&
                // make sure there's a space before the title:
                (/^\s/.test(this.subject[this.pos - 1]) &&
                    (title = this.parseLinkTitle() || '') || true) &&
                this.parseSpaceAndNewline() &&
                this.match(/^\)/)) {
                inlines.push({ t: 'Link',
                    destination: dest,
                    title: title,
                    label: parseRawLabel(rawlabel) });
                return this.pos - startpos;
            } else {
                this.pos = startpos;
                return 0;
            }
        }

        // Nothing worked, rewind:
        this.pos = startpos;
        return 0;
    };

    // Attempt to parse an entity, adding to inlines if successful.
    var parseEntity = function (inlines) {
        var m;
        if ((m = this.match(/^&(?:#x[a-f0-9]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});/i))) {
            inlines.push({ t: 'Entity', c: m });
            return m.length;
        } else {
            return  0;
        }
    };

    // Parse a run of ordinary characters, or a single character with
    // a special meaning in markdown, as a plain string, adding to inlines.
    var parseString = function (inlines) {
        var m;
        if ((m = this.match(reMain))) {
            inlines.push({ t: 'Str', c: m });
            return m.length;
        } else {
            return 0;
        }
    };

    // Parse a newline.  If it was preceded by two spaces, return a hard
    // line break; otherwise a soft line break.
    var parseNewline = function (inlines) {
        if (this.peek() == '\n') {
            this.pos++;
            var last = inlines[inlines.length - 1];
            if (last && last.t == 'Str' && last.c.slice(-1) == ' ') {
                last.c = last.c.slice(0, -1);
            }
            inlines.push({ t: 'Linebreak' });
            return 1;
        } else {
            return 0;
        }
    };

    // Parse the next inline element in subject, advancing subject position
    // and adding the result to 'inlines'.
    var parseInline = function (inlines) {
        var c = this.peek();
        var res;
        switch (c) {
            case '\n':
                res = this.parseNewline(inlines);
                break;
            case '\\':
                res = this.parseEscaped(inlines);
                break;
            case '`':
                res = this.parseBackticks(inlines);
                break;
            case '*':
                res = this.parseEmphasis(inlines);
                break;
            case '[':
                res = this.parseLink(inlines);
                break;
            case '&':
                res = this.parseEntity(inlines);
                break;
            default:
        }
        return res || this.parseString(inlines);
    };

    // Parse s as a list of inlines, using refmap to resolve references.
    var parseInlines = function (s) {
        this.subject = s;
        this.pos = 0;
        var inlines = [];
        while (this.parseInline(inlines)) ;
        return inlines;
    };

    // The InlineParser object.
    function InlineParser() {
        return {
            subject: '',
            label_nest_level: 0, // used by parseLinkLabel method
            pos: 0,
            match: match,
            peek: peek,
            parseSpaceAndNewline: parseSpaceAndNewline,
            parseBackticks: parseBackticks,
            parseEscaped: parseEscaped,
            scanDelims: scanDelims,
            parseEmphasis: parseEmphasis,
            parseLinkTitle: parseLinkTitle,
            parseLinkDestination: parseLinkDestination,
            parseLinkLabel: parseLinkLabel,
            parseLink: parseLink,
            parseEntity: parseEntity,
            parseString: parseString,
            parseNewline: parseNewline,
            parseInline: parseInline,
            parse: parseInlines
        };
    }

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
            string_content: "",
            strings: [],
            inline_content: []
        };
    };

    // Returns true if parent block can contain child block.
    var canContain = function (parent_type, child_type) {
        return ( parent_type == 'Document' ||
            parent_type == 'BlockQuote' ||
            parent_type == 'ListItem' ||
            (parent_type == 'List' && child_type == 'ListItem') );
    };

    // Returns true if block type can accept lines of text.
    var acceptsLines = function (block_type) {
        return ( block_type == 'Paragraph' ||
            block_type == 'FencedCode' );
    };

    // Returns true if block ends with a blank line, descending if needed
    // into lists and sublists.
    var endsWithBlankLine = function (block) {
        if (block.last_line_blank) {
            return true;
        }
        if ((block.t == 'List' || block.t == 'ListItem') && block.children.length > 0) {
            return endsWithBlankLine(block.children[block.children.length - 1]);
        } else {
            return false;
        }
    };

    // Break out of all containing lists, resetting the tip of the
    // document to the parent of the highest list, and finalizing
    // all the lists.  (This is used to implement the "two blank lines
    // break of of all lists" feature.)
    var breakOutOfLists = function (block, line_number) {
        var b = block;
        var last_list = null;
        do {
            if (b.t === 'List') {
                last_list = b;
            }
            b = b.parent;
        } while (b);

        if (last_list) {
            while (block != last_list) {
                this.finalize(block, line_number);
                block = block.parent;
            }
            this.finalize(last_list, line_number);
            this.tip = last_list.parent;
        }
    };

    // Add a line to the block at the tip.  We assume the tip
    // can accept lines -- that check should be done before calling this.
    var addLine = function (ln, offset) {
        var s = ln.slice(offset);
        if (!(this.tip.open)) {
            throw({ msg: "Attempted to add line (" + ln + ") to closed container." });
        }
        this.tip.strings.push(s);
    };

    // Add block of type tag as a child of the tip.  If the tip can't
    // accept children, close and finalize it and try its parent,
    // and so on til we find a block that can accept children.
    var addChild = function (tag, line_number, offset) {
        while (!canContain(this.tip.t, tag)) {
            this.finalize(this.tip, line_number);
        }

        var column_number = offset + 1; // offset 0 = column 1
        var newBlock = makeBlock(tag, line_number, column_number);
        this.tip.children.push(newBlock);
        newBlock.parent = this.tip;
        this.tip = newBlock;
        return newBlock;
    };

    // Parse a list marker and return data on the marker (type,
    // start, delimiter, bullet character, padding) or null.
    var parseListMarker = function (ln, offset) {
        var rest = ln.slice(offset);
        var match;
        var spaces_after_marker;
        var data = {};

        if ((match = rest.match(/^\*(\s|$)/))) {
            spaces_after_marker = match[1].length;
            data.type = 'Bullet';
            data.bullet_char = match[0][0];

        } else if ((match = rest.match(/^(\d+)([.])(\s|$)/))) {
            spaces_after_marker = match[3].length;
            data.type = 'Ordered';
            data.start = parseInt(match[1]);
            data.delimiter = match[2];
        } else {
            return null;
        }
        var blank_item = match[0].length === rest.length;
        if (spaces_after_marker >= 5 ||
            spaces_after_marker < 1 ||
            blank_item) {
            data.padding = match[0].length - spaces_after_marker + 1;
        } else {
            data.padding = match[0].length;
        }
        return data;
    };

    // Returns true if the two list items are of the same type,
    // with the same delimiter and bullet character.  This is used
    // in agglomerating list items into lists.
    var listsMatch = function (list_data, item_data) {
        return list_data.type === item_data.type;
    };

    // Analyze a line of text and update the document appropriately.
    // We parse markdown text by calling this on each line of input,
    // then finalizing the document.
    var incorporateLine = function (ln, line_number) {

        var all_matched = true;
        var last_child;
        var first_nonspace;
        var offset = 0;
        var match;
        var data;
        var blank;
        var indent;
        var last_matched_container;
        var i;

        var container = this.doc;
        var oldtip = this.tip;

        // Convert tabs to spaces:
        ln = detabLine(ln);

        // For each containing block, try to parse the associated line start.
        // Bail out on failure: container will point to the last matching block.
        // Set all_matched to false if not all containers match.
        while (container.children.length > 0) {
            last_child = container.children[container.children.length - 1];
            if (!last_child.open) {
                break;
            }
            container = last_child;

            match = matchAt(/[^ ]/, ln, offset);
            if (match === null) {
                first_nonspace = ln.length;
                blank = true;
            } else {
                first_nonspace = match;
                blank = false;
            }
            indent = first_nonspace - offset;

            switch (container.t) {
                case 'BlockQuote':
                    var matched = indent <= 3 && ln[first_nonspace] === '>';
                    if (matched) {
                        offset = first_nonspace + 1;
                        if (ln[offset] === ' ') {
                            offset++;
                        }
                    } else {
                        all_matched = false;
                    }
                    break;

                case 'ListItem':
                    if (indent >= container.list_data.marker_offset +
                        container.list_data.padding) {
                        offset += container.list_data.marker_offset +
                            container.list_data.padding;
                    } else if (blank) {
                        offset = first_nonspace;
                    } else {
                        all_matched = false;
                    }
                    break;

                case 'Header':
                    // a header can never container > 1 line, so fail to match:
                    all_matched = false;
                    break;

                case 'FencedCode':
                    // skip optional spaces of fence offset
                    i = container.fence_offset;
                    while (i > 0 && ln[offset] === ' ') {
                        offset++;
                        i--;
                    }
                    break;

                case 'Paragraph':
                    if (blank) {
                        container.last_line_blank = true;
                        all_matched = false;
                    }
                    break;

                default:
            }

            if (!all_matched) {
                container = container.parent; // back up to last matching block
                break;
            }
        }

        last_matched_container = container;

        // This function is used to finalize and close any unmatched
        // blocks.  We aren't ready to do this now, because we might
        // have a lazy paragraph continuation, in which case we don't
        // want to close unmatched blocks.  So we store this closure for
        // use later, when we have more information.
        var closeUnmatchedBlocks = function (mythis) {
            // finalize any blocks not matched
            while (!already_done && oldtip != last_matched_container) {
                mythis.finalize(oldtip, line_number);
                oldtip = oldtip.parent;
            }
            var already_done = true;
        };

        // Check to see if we've hit 2nd blank line; if so break out of list:
        if (blank && container.last_line_blank) {
            this.breakOutOfLists(container, line_number);
        }

        // Unless last matched container is a code block, try new container starts,
        // adding children to the last matched container:
        while (container.t != 'FencedCode' &&
            // this is a little performance optimization:
            matchAt(/^[ #`~*+_=<>0-9-]/, ln, offset) !== null) {

            match = matchAt(/[^ ]/, ln, offset);
            if (match === null) {
                first_nonspace = ln.length;
                blank = true;
            } else {
                first_nonspace = match;
                blank = false;
            }
            indent = first_nonspace - offset;

            if (ln[first_nonspace] === '>') {
                // blockquote
                offset = first_nonspace + 1;
                // optional following space
                if (ln[offset] === ' ') {
                    offset++;
                }
                closeUnmatchedBlocks(this);
                container = this.addChild('BlockQuote', line_number, offset);

            } else if ((match = ln.slice(first_nonspace).match(/^#{1,6}(?: +|$)/))) {
                // Header
                offset = first_nonspace + match[0].length;
                closeUnmatchedBlocks(this);
                container = this.addChild('Header', line_number, first_nonspace);
                container.level = match[0].trim().length; // number of #s
                // remove trailing ###s:
                container.strings =
                    [ln.slice(offset).replace(/(?:(\\#) *#*| *#+) *$/, '$1')];
                break;

            } else if ((match = ln.slice(first_nonspace).match(/^`{3,}(?!.*`)|^~{3,}(?!.*~)/))) {
                // fenced code block
                var fence_length = match[0].length;
                closeUnmatchedBlocks(this);
                container = this.addChild('FencedCode', line_number, first_nonspace);
                container.fence_length = fence_length;
                container.fence_char = match[0][0];
                container.fence_offset = first_nonspace - offset;
                offset = first_nonspace + fence_length;
                break;
            } else if ((data = parseListMarker(ln, first_nonspace))) {
                // list item
                closeUnmatchedBlocks(this);
                data.marker_offset = indent;
                offset = first_nonspace + data.padding;

                // add the list if needed
                if (container.t !== 'List' || !(listsMatch(container.list_data, data))) {
                    container = this.addChild('List', line_number, first_nonspace);
                    container.list_data = data;
                }

                // add the list item
                container = this.addChild('ListItem', line_number, first_nonspace);
                container.list_data = data;

            } else {
                break;

            }

            if (acceptsLines(container.t)) {
                // if it's a line container, it can't contain other containers
                break;
            }
        }

        // What remains at the offset is a text line.  Add the text to the
        // appropriate container.

        match = matchAt(/[^ ]/, ln, offset);
        if (match === null) {
            first_nonspace = ln.length;
            blank = true;
        } else {
            first_nonspace = match;
            blank = false;
        }
        indent = first_nonspace - offset;

        // First check for a lazy paragraph continuation:
        if (this.tip !== last_matched_container && !blank &&
            this.tip.t == 'Paragraph' &&
            this.tip.strings.length > 0) {
            // lazy paragraph continuation

            this.last_line_blank = false;
            this.addLine(ln, offset);

        } else { // not a lazy continuation

            // finalize any blocks not matched
            closeUnmatchedBlocks(this);

            // Block quote lines are never blank as they start with >
            // and we don't count blanks in fenced code for purposes of tight/loose
            // lists or breaking out of lists.  We also don't set last_line_blank
            // on an empty list item.
            container.last_line_blank = blank && !(container.t == 'BlockQuote' ||
                container.t == 'FencedCode' ||
                (container.t == 'ListItem' &&
                    container.children.length === 0 &&
                    container.start_line == line_number));

            var cont = container;
            while (cont.parent) {
                cont.parent.last_line_blank = false;
                cont = cont.parent;
            }

            switch (container.t) {
                case 'FencedCode':
                    // check for closing code fence:
                    match = (indent <= 3 &&
                        ln[first_nonspace] == container.fence_char &&
                        ln.slice(first_nonspace).match(/^(?:`{3,}|~{3,})(?= *$)/));
                    if (match && match[0].length >= container.fence_length) {
                        // don't add closing fence to container; instead, close it:
                        this.finalize(container, line_number);
                    } else {
                        this.addLine(ln, offset);
                    }
                    break;

                case 'Header':
                    // nothing to do; we already added the contents.
                    break;

                default:
                    if (acceptsLines(container.t)) {
                        this.addLine(ln, first_nonspace);
                    } else if (blank) {
                        // do nothing
                    } else {
                        // create paragraph container for line
                        container = this.addChild('Paragraph', line_number, first_nonspace);
                        this.addLine(ln, first_nonspace);
                    }
            }
        }
    };

    // Finalize a block.  Close it and do any necessary postprocessing,
    // e.g. creating string_content from strings, setting the 'tight'
    // or 'loose' status of a list, and parsing the beginnings
    // of paragraphs for reference definitions.  Reset the tip to the
    // parent of the closed block.
    var finalize = function (block, line_number) {
        var pos;
        // don't do anything if the block is already closed
        if (!block.open) {
            return 0;
        }
        block.open = false;
        if (line_number > block.start_line) {
            block.end_line = line_number - 1;
        } else {
            block.end_line = line_number;
        }

        switch (block.t) {
            case 'Paragraph':
                block.string_content = block.strings.join('\n').replace(/^  */m, '');
                break;

            case 'Header':
                block.string_content = block.strings.join('\n');
                break;

            case 'FencedCode':
                // first line becomes info string
                block.info = unescape(block.strings[0].trim());
                if (block.strings.length == 1) {
                    block.string_content = '';
                } else {
                    block.string_content = block.strings.slice(1).join('\n') + '\n';
                }
                break;
            default:
                break;
        }

        this.tip = block.parent || this.top;
    };

    // Walk through a block & children recursively, parsing string content
    // into inline content where appropriate.
    var processInlines = function (block) {
        switch (block.t) {
            case 'Paragraph':
            case 'Header':
                block.inline_content =
                    this.inlineParser.parse(block.string_content.trim());
                block.string_content = "";
                break;
            default:
                break;
        }

        if (block.children) {
            for (var i = 0; i < block.children.length; i++) {
                this.processInlines(block.children[i]);
            }
        }

    };

    // The main parsing function.  Returns a parsed document AST.
    var parse = function (input) {
        this.doc = makeBlock('Document', 1, 1);
        this.tip = this.doc;
        var lines = input.replace(/\n$/, '').split(/\r\n|\n|\r/);
        var len = lines.length;
        for (var i = 0; i < len; i++) {
            this.incorporateLine(lines[i], i + 1);
        }
        while (this.tip) {
            this.finalize(this.tip, len - 1);
        }
        this.processInlines(this.doc);
        return this.doc;
    };

    // ctor
     var famlParserInternal = {
         doc: makeBlock('Document', 1, 1),
         tip: this.doc,
         inlineParser: new InlineParser(),
         breakOutOfLists: breakOutOfLists,
         addLine: addLine,
         addChild: addChild,
         incorporateLine: incorporateLine,
         finalize: finalize,
         processInlines: processInlines
     };

    function FamlParser() {
        return {
            parse: function(input) {
                return parse.call(famlParserInternal, input);
            }
        };
    }

    exports.FamlParser = FamlParser;

})(typeof exports === 'undefined' ? this.faml || (this.faml = {}) : exports);