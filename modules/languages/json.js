function checkSpell(text) {
    let result = '';
    try {
        JSON.parse(text);
    } catch (e) {
        result = e.message
    }
    return result;
}

exports.type = 'application/json';
exports.name = 'JSON';
exports.extension = 'json';

exports.checkSpell = checkSpell;
exports.indent = (text) => {
    let data = JSON.parse(text);
    return JSON.stringify(data, null, 4);
};

//旧パーサー（仮）
const searchList = [
    {
        "start": true,
        "end": true,
        "reg": /(\s|:)(true)(\s|,)/g,
        "color": "blue"
    },
    {
        "start": true,
        "end": true,
        "reg": /(\s|:)(false)(\s|,)/g,
        "color": "blue"
    }
];
function parse(text) {
    text = quotesCheck(text);
    for (var i = 0; i < searchList.length; i++) {
        text = text.replaceAll(searchList[i].reg, '$1<span_class="' + searchList[i].color + '">$2</span>$3');
    }
    text = colorCode(text);
    text = text.replaceAll('    ', '    <span_class="indent"></span>');
    text = text.replaceAll(' ', ' ');//<svg height="14" width="4.49"><circle cx="2.3" cy="10" r="1" fill="#888"/></svg>
    text = text.replaceAll('<span_style', '<span style');
    text = text.replaceAll('<span_class', '<span class');
    return text;
}
function quotesCheck(text) {
    var result = '';
    var mode = 'none';//none,text,colored,escape
    for (var i = 0; i < text.length; i++) {
        if (mode == 'none') {
            if (text.charAt(i) == '"') {
                result += '<span_class="red">';
                mode = '"';
            } else if (text.charAt(i) == "'") {
                result += '<span_class="red">';
                mode = "'";
            }
            result += text.charAt(i);
        } else if (mode == '"') {
            result += text.charAt(i);
            if (text.charAt(i) == '"') {
                result += '</span>';
                mode = 'none';
            }
        } else if (mode == "'") {
            result += text.charAt(i);
            if (text.charAt(i) == "'") {
                result += '</span>';
                mode = 'none';
            }
        }
    }
    return result;
}
function colorCode(text) {
    text = text.replaceAll(/#([0-9a-f]{6}|[0-9a-f]{3})/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
    text = text.replaceAll(/rgb\( ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9]{3} ?(?:|\/ ?[0-9.]+)\)/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
    text = text.replaceAll(/rgba\( ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9]{3} ?, ?[0-9.]+ ?\)/g, '$&<span_style="position: absolute;display: inline-block;background:$&;width: 10px;height: 10px; border: solid 1px #888;opacity: 0.7;"></span>');
    return text;
}

exports.parse = (text) => {
    return parse(text);
    /*
    正式なパーサー（まだ準備中）
    let data = [{
        type: 'normal',
        value: ''
    }];
    let position = 0;
    let isEscaped = false;
    let isKey = false;
    let key = null;
    for (let i = 0; i < text.length; i++) {
        if (!isEscaped) {
            if (text[i] == '"') {
                if (isKey && key == text[i]) {
                    position++;
                    data[position] = {
                        key: key,
                        value: '',
                    };
                    key = '"';
                    isKey = false;
                } else {
                    isKey = true; 
                }
                isEscaped = false;
            } else if (text[i] == '\\') {
                isEscaped = true;
            } else {
                if (isKey) {
                    key += text[i];
                } else {
                    data[position].value += text[i];
                }
            }
        } else {
            isEscaped = false;
        }
        data[position].value += text[i];
    }
    */
    return data;
};