function checkSpell(text) {
    let result = '';
    try {
        JSON.parse(text);
    } catch(e) {
        result = e.message
    }
    return result;
}

exports.checkSpell = checkSpell;
exports.indent = (text) => {
    let data = JSON.parse(text);
    return JSON.stringify(data, null, 4);
};
exports.parse = (text) => {
    let data = [];
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
        }
    }
    return data;
};