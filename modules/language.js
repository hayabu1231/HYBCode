export class Language {
    constructor(name, type, extension, searchList, start, end, commentParser, braces, indent) {
        this.type = type;
        for (var i = 0; i < searchList.length; i++) {
            if (searchList[i].start && searchList[i].end) {
                searchList[i].reg = `(${start})(${searchList[i].reg})(${end})`;
            }
        }
        this.searchList = searchList;
        this.commentParser = commentParser;
        this.braces = braces;
        this.indent = indent;
    }
    parse(text) {
        text = this._quotesCheck(text);
        if (this.commentParser) {
            text = text.replaceAll(new RegExp(this.commentParser, 'g'), '<span_class="grey">$&</span>');
        }
        for(var i = 0; i < this.searchList.length; i++){
            text = text.replaceAll(new RegExp(this.searchList[i].reg,'g'),'$1<span_class="' + this.searchList[i].color + '">$2</span>$3');
        }
        text = this._colorCode(text);
        text = text.replaceAll('    ', '    <span_class="indent"></span>');
        text = text.replaceAll(' ', ' ');//<svg height="14" width="4.49"><circle cx="2.3" cy="10" r="1" fill="#888"/></svg>
        if (this.braces) {
            //text = this._bracesCheck(text);
        }
        text = text.replaceAll('<span_style','<span style');
        text = text.replaceAll('<span_class','<span class');
        return text;
    }
    _quotesCheck(text) {
        var result = '';
        var mode = 'none';//none,text,colored,escape
        for (var i = 0; i < text.length; i++){
            if (mode == 'none'){
                if (text.charAt(i) == '"'){
                    result += '<span_class="red">';
                    mode = '"';
                    } else if (text.charAt(i) == "'"){
                    result += '<span_class="red">';
                    mode = "'";
                }
                result += text.charAt(i);
                } else if (mode == '"'){
                result += text.charAt(i);
                if (text.charAt(i) == '"'){
                    result += '</span>';
                    mode = 'none';
                }
                } else if (mode == "'"){
                result += text.charAt(i);
                if (text.charAt(i) == "'"){
                    result += '</span>';
                    mode = 'none';
                }
            }
        }
        return result;
    }
    _colorCode(text) {
        text = text.replaceAll(/#([0-9a-f]{6}|[0-9a-f]{3})/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
        text = text.replaceAll(/rgb\( ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9]{3} ?(?:|\/ ?[0-9.]+)\)/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
        text = text.replaceAll(/rgba\( ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9.]+ ?\)/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
        return text;
    }
    _bracesCheck(text) {
        for (var i = 0; i < this.braces.length; i++) {
            var count = 0;
            var lastBase = 0;
            for (var h = 0; h < text.length; h++) {
                if (text[h] == this.braces[i][0]) {
                    if (count == 0) {
                        lastBase = h;
                    }
                    count++;
                    } else if (text[h] == this.braces[i][1]) {
                    count--;
                }
                if (count < 0) {
                    text = text.replace(text.substring(0, h + 1), `${text.substring(0, h)}<span_style="background: #f00; color: #fff;">${text.substring(h, h + 1)}</span>`);
                    return text;
                }
            }
            if (text.split(this.braces[i][0]).length != text.split(this.braces[i][1]).length) {
                text = text.replace(text.substring(0, lastBase + 1), `${text.substring(0, lastBase)}<span_style="background: #f00; color: #fff;">${text.substring(lastBase, lastBase + 1)}</span>`);
            }
        }
        return text;
    }
    indent(text) {
        if (this.braces) {
            let lines = text.split('\n');
            let count = 0;
            for (let i = 0; i < lines.length; i++) {
                let beforeCount = count;
                for (let h = 0; h < this.braces.length; h++) {
                    count -= lines[i].split(this.braces[h][1]).length - 1;
                    count += lines[i].split(this.braces[h][0]).length - 1;
                }
                lines[i] = lines[i].trimStart();
                for (let h = 0; h < count; h++) {
                    if (beforeCount < count && h == count - 1) {} else {
                        lines[i] = this.indent + lines[i];
                    }
                }
            }
            return lines.join('\n');
        }
    }
}
