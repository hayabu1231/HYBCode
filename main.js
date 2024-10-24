window.addEventListener('error', (event) => {
    System.notice.add(`${event.message}【${event.source}:${event.lineno}】`);
});

//サービスワーカー
/*
navigator.serviceWorker.register("service-worker.js").then((registration) => {
    let serviceWorker;
    if (registration.installing) {
        serviceWorker = registration.installing;
    } else if (registration.waiting) {
        serviceWorker = registration.waiting;
    } else if (registration.active) {
        serviceWorker = registration.active;
    }
    if (serviceWorker) {
        serviceWorker.addEventListener("statechange", (e) => {
          console.log(e.target.state);
        });
    }
});
*/

//必須クラス
import { Language } from './modules/language.js';
import { FileServiceLocal, FileServiceGitHub, FileServiceHYBFTS } from './modules/fileServices.js';

//固定
const UsableFonts = Object.freeze(['sans-serif', 'serif', 'fantasy', 'system-ui']);
const UsableFileType = Object.freeze(['text', 'JavaScript', 'HTML', 'CSV',  'CSS', 'JSON']);

//時々、変更
const UsableLanguages = new Map();

//頻繁に変更
const EditingFiles = new Map();
const FileInfo = {
    id: 0,
    type: 'text/text',
    name: '新規書類',
    service: 'cache'
};
const System = {
    status: 'loading',
    version: [0,0,0,'alpha'],
    settings: {
        fontFamily: 'system-ui',
        keyCheck: true,
        autoSave: true,
        db: null,
        color: '#f2f2f2',
        background: '#222',
        indent: '    ',
        connections: new Map(),
        change: function(type, value){
            if (type == 'fontFamily' || type == 'color' || type == 'background') {
                document.body.style.setProperty(`--main-${type}`, value);
            }
            System.settings[type] = value;
        }
    },
    update: function() {
    },
    notice: {
        add: function(message) {
            var notice = document.createElement('div');
            notice.className = 'notice';
            notice.innerText = message;
            document.getElementById('notice').append(notice);
            setTimeout(function() {
                System.notice.remove();
            }, 3000);
        },
        remove: function(id) {
            if (id) {
                document.getElementById(id).remove();
            } else {
                document.getElementById('notice').firstElementChild.remove();
            }
        }
    }
};

var LanguageLoadCount = 0;
const xhr = new XMLHttpRequest();
xhr.addEventListener('load', function(data) {
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            UsableLanguages.set(data.type, new Language(data.name, data.type, data.extension, data.list, data.start, data.end, data.commentOut, data.braces, System.settings.indent));
            change();
            LanguageLoadCount++;
            if (LanguageLoadCount < UsableFileType.length) {
                xhr.open('GET', `languages/${UsableFileType[LanguageLoadCount]}.json`, true);
                xhr.send();
            }
        }
    }
});
xhr.open('GET', `languages/${UsableFileType[LanguageLoadCount]}.json`, true);
xhr.send();

//ファイルサービス関連
function connectionsGetAll() {
    var dbConnection = System.settings.db.transaction('connections', 'readwrite');
    var connectionsDB = dbConnection.objectStore('connections');
    var request = connectionsDB.getAll();
    request.onsuccess = function(event) {
        for (let i = 0; i < event.target.result.length; i++) {
            addFilesServices(event.target.result[i].type, event.target.result[i])
        }
    };
}
function addFilesServices(type, data) {
    let service = null;
    if (type == 'local') {
        service = new FileServiceLocal(System.settings.db);
    } else if (type == 'github') {
        service = new FileServiceGitHub(data.token);
    } else if (type == 'hybfts') {
        service = new FileServiceHYBFTS(data.address, data.user.id, data.user.password);
    } else {
        System.notice.add('未対応サービス');
        return;
    }
    System.settings.connections.set(service.id, service);
    showFilesServices();
}
function showFilesServices(id) {
    let services = [];
    let connections = [];
    System.settings.connections.forEach(function(service) {
        var service_element = document.createElement('div');
        service_element.className = 'files-file';
        if (id && id == service.id) {
            service_element.dataset.selected = 'true';
            service.getAll();
        }
        service_element.dataset.type = service.id;
        service_element.addEventListener('click', function() {
            selectFilesService(this.dataset.type);
        });
        var service_icon = document.createElement('img');
        service_icon.src = 'img/host.svg';
        service_element.append(service_icon);
        var service_name = document.createElement('p');
        service_name.innerText = service.id;
        service_element.append(service_name);
        services.push(service_element);
        var service_element = document.createElement('div');
        service_element.className = 'btn btn-open_screen';
        if (id && id == service.id) {
            service_element.dataset.selected = 'true';
        }
        service_element.dataset.type = service.id;
        service_element.addEventListener('click', function() {
            alert(this.dataset.type);
        });
        var service_icon = document.createElement('img');
        service_icon.src = 'img/host.svg';
        service_element.append(service_icon);
        var service_name = document.createElement('p');
        service_name.innerText = service.id;
        service_element.append(service_name);
        connections.push(service_element);
    });
    let service_element = document.createElement('div');
    service_element.className = 'files-file';
    service_element.addEventListener('click', function() {
        document.getElementById('import').click();
    });
    var service_icon = document.createElement('img');
    service_icon.src = 'img/files.svg';
    service_element.append(service_icon);
    var service_name = document.createElement('p');
    service_name.innerText = 'Files';
    service_element.append(service_name);
    services.push(service_element);
    document.getElementById('screen-Files-services').replaceChildren(...services);
    document.getElementById('screen-Connections-list').replaceChildren(...connections);
}
function selectFilesService(name) {
    showFilesServices(name);
    var fileElements = [];
    if (System.settings.connections.has(name)) {
        var files = System.settings.connections.get(name).files;
        for (var i = 0; i < files.length; i++) {
            var file = document.createElement('div');
            file.className = 'files-file';
            file.dataset.id = i;
            file.dataset.type = name;
            var file_icon = document.createElement('img');
            if (files.type == 'folder') {
                file.addEventListener('click', function() {
                });
                file_icon.src = 'img/folder.svg';
            } else {
                file.addEventListener('click', function() {
                    let file = System.settings.connections.get(this.dataset.type).files[Number(this.dataset.id)];
                    File.open(file);
                    FileInfo.id = file.id;
                    FileInfo.service = this.dataset.type;
                    screenClose('Files');
                });
                file_icon.src = 'img/file.svg';
            }
            file.append(file_icon);
            if (UsableLanguages.has(files[i].type)) {
                var fileExtension = UsableLanguages.get(files[i].type).extension;
            } else {
                var fileExtension = 'txt';
            }
            var file_info = document.createElement('div');
            var file_name = document.createElement('p');
            file_name.innerText = `${files[i].name}.${fileExtension}`;
            file_info.append(file_name);
            var file_date = document.createElement('small');
            file_date.innerText = files[i].date;
            file_info.append(file_date);
            var file_size = document.createElement('small');
            file_size.innerText = calcDataSize(files[i].data);
            file_info.append(file_size);
            file.append(file_info);
            fileElements.push(file);
        }
        if (fileElements.length == 0) {
            var file = document.createElement('div');
            file.className = 'files-file';
            file.innerText = 'ファイルがありません';
            fileElements.push(file);
        }
    } else {
        var file = document.createElement('div');
        file.className = 'files-file';
        file.innerText = 'このサービスは未対応です';
        fileElements.push(file);
    }
    var folder = document.createElement('div');
    folder.className = 'files-folder';
    folder.replaceChildren(...fileElements);
    document.getElementById('screen-Files-folders').replaceChildren(folder);
}

//ファイル管理用DB（OPFSが使えるようになったら更新しようね）
var dbRequest = window.indexedDB.open('HYBCode');
dbRequest.onupgradeneeded = function(event) {
    System.settings.db = event.target.result;
    /*バージョン上げないとかも
    if (!System.settings.db.objectStoreNames.contains('connections')) {
        System.settings.db.createObjectStore('connections', {keyPath: 'name'});
    }
    */
    if (!System.settings.db.objectStoreNames.contains('files')) {
        System.settings.db.createObjectStore('files', {keyPath: 'id',autoIncrement: true});
    }
};
dbRequest.onsuccess = function(event) {
    System.settings.db = event.target.result;
    addFilesServices('local');
};

const File = {
    create: function() {
        File.open({
            name: '新規書類',
            type: 'text/text',
            data: '',
            service: 'cache'
        });
    },
    save: function() {
        var data = {
            name: FileInfo.name,
            type: FileInfo.type,
            service: FileInfo.service,
            data: document.getElementById('input').innerText,
            date: new Date()
        };
        if (FileInfo.id) {
            data.id = FileInfo.id;
        }
        if (!FileInfo.service || !System.settings.connections.has(FileInfo.service)) {
            System.notice.add('ローカルに保存します');
            FileInfo.service = 'local';
            data.service = 'local';
        }
        System.settings.connections.get(FileInfo.service).save(data, function (id) {
            System.notice.add('保存しました');
            FileInfo.id = id;
        });
    },
    open: function(data) {
        FileInfo.id = data.id;
        FileInfo.name = data.name;
        FileInfo.type = data.type;
        FileInfo.service = data.service;
        document.getElementById('input').innerText = data.data;
        change();
        if (!EditingFiles.has(`${data.id}@${data.type}@${data.service}@${data.name}`)) {
            EditingFiles.set(`${data.id}@${data.type}@${data.service}@${data.name}`, data);
        }
        var files = [];
        EditingFiles.forEach(function(EditingFile) {
            var file = document.createElement('div');
            file.className = 'menu_files-file';
            if (EditingFiles.has(`${EditingFile.id}@${EditingFile.type}@${EditingFile.service}@${EditingFile.name}`)) {
                file.dataset.selected = 'true';
            }
            if (UsableLanguages.has(EditingFile.type)) {
                var fileExtension = UsableLanguages.get(EditingFile.type).extension;
            } else {
                var fileExtension = 'txt';
            }
            var file_name = document.createElement('p');
            file_name.className = 'menu_files-file-name';
            file_name.innerText = `${EditingFile.name}.${fileExtension}`;
            file_name.dataset.id = `${EditingFile.id}@${EditingFile.type}@${EditingFile.service}@${EditingFile.name}`;
            file_name.addEventListener('click', function() {
                File.open(EditingFiles.get(`${EditingFile.id}@${EditingFile.type}@${EditingFile.service}@${EditingFile.name}`));
            });
            file.append(file_name);
            var file_button = document.createElement('input');
            file_button.type = 'image';
            file_button.className = 'menu_files-file-close';
            file_button.src = 'img/close.svg';
            file_button.dataset.id = `${EditingFile.id}@${EditingFile.type}@${EditingFile.service}@${EditingFile.name}`;
            file_button.addEventListener('click', function() {
                File.close(EditingFiles.get(`${EditingFile.id}@${EditingFile.type}@${EditingFile.service}@${EditingFile.name}`));
            });
            file.append(file_button);
            files.push(file);
        });
        document.getElementById('menu-files').replaceChildren(...files);
     },
    close: function(data) {
        if (EditingFiles.has(`${data.id}@${data.type}@${data.service}@${data.name}`)) {
            EditingFiles.delete(`${data.id}@${data.type}@${data.service}@${data.name}`);
        }
        if (EditingFiles.size > 0) {
            var files = EditingFiles.values();
            File.open(files.next().value);
        } else {
            FileInfo.id = 0;
            FileInfo.name = '新規書類';
            FileInfo.type = 'text/text';
            FileInfo.service = 'cache';
            document.getElementById('input').innerText = null;
            change();
            document.getElementById('menu-files').replaceChildren();
        }
     },
    download: function() {
        if (UsableLanguages.has(FileInfo.type)) {
            var fileExtension = UsableLanguages.get(FileInfo.type).extension;
        } else {
            var fileExtension = 'txt';
        }
        var blob = new Blob([document.getElementById('input').innerText],{type:FileInfo.type});
        document.getElementById('screen-Export-icon').dataset.type = FileInfo.type;
        document.getElementById('screen-Export-icon').dataset.data = document.getElementById('input').innerText;
        document.getElementById('screen-Export-preview').src = URL.createObjectURL(blob);
        document.getElementById('screen-Export-name').innerText = `${FileInfo.name}.${fileExtension}`;
        document.getElementById('screen-Export-download').src = URL.createObjectURL(blob);
        document.getElementById('screen-Export-download').setAttribute('download', `${FileInfo.name}.${fileExtension}`);
        screenOpen('Export');
    },
    upload: function() {
        var files = document.getElementById('import').files;
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            FileInfo.id = null;
            FileInfo.type = 'text/example';
            UsableLanguages.forEach(function(language) {
                if (language.extension == file.name.split('.').at(-1)){
                    FileInfo.type = language.type;
                }
            });
            var reader = new FileReader();
            reader.onload = ()=> {
                File.open({
                    type: FileInfo.type,
                    name: file.name.split('.').slice(0,-1).join(''),
                    data: reader.result
                });
            };
            reader.readAsText(file, 'UTF-8');
        }
    }
};

function calcDataSize(data) {
    var size = encodeURIComponent(data).replace(/%../g,"x").length;
    if (size > 1000000000) {
        size = `${Math.floor(((size / 1000) / 1000) / 100) / 10}GB`;
    } else if (size > 1000000) {
        size = `${Math.floor((size / 1000) / 100) / 10}MB`;
    } else if (size > 1000) {
        size = `${Math.floor(size / 100) / 10}KB`;
    } else {
        size = `${size}byte`;
    }
    return size;
}

var oldFileData = '';
function change() {
    if (!document.getElementById('input') || oldFileData == document.getElementById('input').innerText) {
        return;
    }
    oldFileData = document.getElementById('input').innerText;
    if (EditingFiles.has(`${FileInfo.id}@${FileInfo.type}@${FileInfo.service}@${FileInfo.name}`)) {
        let EditingFile = EditingFiles.get(`${FileInfo.id}@${FileInfo.type}@${FileInfo.service}@${FileInfo.name}`);
        EditingFile.data = document.getElementById('input').innerText;
        EditingFiles.set(`${FileInfo.id}@${FileInfo.type}@${FileInfo.service}@${FileInfo.name}`, EditingFile);
    }
    if(System.settings.autoSave){
        localStorage.setItem('fileData', document.getElementById('input').innerText);
        localStorage.setItem('fileId', FileInfo.id);
        localStorage.setItem('fileName', FileInfo.name);
        localStorage.setItem('fileType', FileInfo.type);
        localStorage.setItem('fileService', FileInfo.service);
    }
    textColorChange();
    document.getElementById('side').innerHTML = '';
    for(var i = 1; i <= document.getElementById('input').innerHTML.split('<br>').length; i++){
        document.getElementById('side').innerHTML += i + '<br>';
    }
}
function quotesCheck(text){
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

const HTMLReplaceWords = [
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
];

function textColorChange() {
    var text = document.getElementById('input').innerText;
    for (var i = 0; i < HTMLReplaceWords.length; i++) {
        text = text.replaceAll(HTMLReplaceWords[i][0], HTMLReplaceWords[i][1]);
    }
    var list = [];
    var regList = [' |^',' |^'];
    if(UsableLanguages.has(FileInfo.type)){
        text = UsableLanguages.get(FileInfo.type).parse(text);
        } else {
        text = quotesCheck(text);
        for(var i = 0; i < list.length; i++){
            var reg = '(' + regList[0] + ')(' + list[i][0] + ')(' + regList[1] + ')';
            reg = new RegExp(reg,'g');
            text = text.replaceAll(reg,'$1<span_class="' + list[i][1] + '">$2</span>$3');
        }
        text = text.replaceAll('    ', '    <span_class="indent"></span>');
        text = text.replaceAll(' ', ' ');//<svg height="14" width="4.49"><circle cx="2.3" cy="10" r="1" fill="#888"/></svg>
        text = text.replaceAll('<span_class="indent">','<span class="indent">');
        text = text.replaceAll('<span_class="green">','<span class="green">');
        text = text.replaceAll('<span_class="blue">','<span class="blue">');
        text = text.replaceAll('<span_class="red">','<span class="red">');
        text = text.replaceAll('<span_class="yellow">','<span class="yellow">');
    }
    document.getElementById('editor').innerHTML = text;
}
function manualIndent() {
    var text = document.getElementById('input').innerText;
    if(UsableLanguages.has(FileInfo.type)) {
        text = UsableLanguages.get(FileInfo.type).indent(text);
    }
    document.getElementById('input').innerText = text;
    change();
}

function screenOpen(type){
    var content = '<button class="close_btn" onclick="screenClose()">×</button><h1 class="center">' + type + '</h1>';
    if (type == 'Preview') {
        document.getElementById('screen-Preview-frame').href = '';
    } else if (type == 'Detail') {
        document.getElementById('screen-Detail-name').value = FileInfo.name;
        var select = [];
        UsableLanguages.forEach(function(language) {
            let option = document.createElement('option');
            if (language.type == FileInfo.type) {
                option.selected = true;
            }
            option.value = language.type;
            option.innerText = language.name;
            select.push(option);
        });
        document.getElementById('screen-Detail-type').replaceChildren(...select);
    } else if (type == 'Files') {
        showFilesServices();
    } else if (type == 'Settings'){
        var select = [];
        for (let i = 0; i < UsableFonts.length; i++) {
            let option = document.createElement('option');
            if (System.settings.fontFamily == UsableFonts[i]) {
                option.selected = true;
            }
            option.innerText = UsableFonts[i];
            select.push(option);
        }
        document.getElementById('screen-Settings-font').replaceChildren(...select);
        document.getElementById('screen-Settings-background').value = System.settings.background;
        document.getElementById('screen-Settings-color').value = System.settings.color;
        document.getElementById('screen-Settings-autoSave').dataset.check = System.settings.autoSave;
        document.getElementById('screen-Settings-deleteSave').innerHTML = `保存済みデータ削除(${storageSize()})`;
    } else if(type == 'Connections'){
        showFilesServices();
    }
    if (document.getElementById('screen-' + type) && document.getElementById('screen-' + type).dataset.modal == 'false') {
        document.getElementById('screen-' + type).show();
    } else if (document.getElementById('screen-' + type)) {
        document.getElementById('screen-' + type).showModal();
    } else {
        document.getElementById('screen').innerHTML = content;
        document.getElementById('screen').showModal();
    }
    System.settings.keyCheck = false;
}
function storageSize() {
    return calcDataSize(localStorage.getItem('fileId') + localStorage.getItem('fileName') + localStorage.getItem('fileType') + localStorage.getItem('fileService') + localStorage.getItem('fileData'));
}
function storageClear(element){
    localStorage.clear();
    element.innerText = `保存済みデータ削除(${storageSize()})`;
}
function filesDBclear() {
    var dbConnection = System.settings.db.transaction('files', 'readwrite');
    var filesDB = dbConnection.objectStore('files');
    var request = filesDB.clear();
    request.onsuccess = function(event) {
        System.notice.add('削除しました');
        System.settings.connections.get('local').getAll();
    };
}
function originalSwitch(element){
    if(element.dataset.check == "true"){
        element.dataset.check = "false";
        System.settings.autoSave = false;
        } else if(element.dataset.check == "false"){
        element.dataset.check = "true";
        System.settings.autoSave = true;
        localStorage.setItem('fileData', document.getElementById('input').innerText);
        localStorage.setItem('fileId', FileInfo.id);
        localStorage.setItem('fileName', FileInfo.name);
        localStorage.setItem('fileType', FileInfo.type);
        localStorage.setItem('fileService', FileInfo.service);
    }
}
function screenClose(type) {
    if (document.getElementById('screen-' + type)) {
        document.getElementById('screen-' + type).close();
        } else {
        document.getElementById('screen').close();
    }
    System.settings.keyCheck = true;
    if(System.settings.autoSave){
        localStorage.setItem('fileData', document.getElementById('input').innerText);
        localStorage.setItem('fileId', FileInfo.id);
        localStorage.setItem('fileName', FileInfo.name);
        localStorage.setItem('fileType', FileInfo.type);
        localStorage.setItem('fileService', FileInfo.service);
    }
}

const OnclickData = [
    ['btn-createFile', File.create],
    ['btn-saveEditingFile', File.save],
    ['btn-fileExport', File.download],
    ['btn-manualIndent', manualIndent],
    ['screen-Connections-github-send', function() {
        addFilesServices('github', {token: document.getElementById('screen-Connections-github-token').value});
        screenClose('NewConnectionsGitHub');
        screenClose('NewConnections');
    }],
    ['screen-Connections-FTS-send', function() {
        addFilesServices('hybfts', {address: `${document.getElementById('screen-Connections-FTS-address').value}:${document.getElementById('screen-Connections-FTS-port').value}`, user: {id: document.getElementById('screen-Connections-FTS-user').value, password: document.getElementById('screen-Connections-FTS-password').value}});
        screenClose('NewConnectionsHyb');
        screenClose('NewConnections');
    }],
    ['screen-Settings-autoSave', function() {
         originalSwitch(this);
    }],
    ['screen-Settings-deleteSave', function() {
         storageClear(this);
    }],
    ['screen-Settings-deleteLocal', function() {
         filesDBclear();
    }],
    ['screen-About-update', System.update]
];
const OnchangeData = [
    ['input', change],
    ['import', File.upload],
    ['screen-Settings-font', function() {
         System.settings.change('fontFamily', this.value);
    }],
    ['screen-Settings-background', function() {
         System.settings.change('background', this.value);
    }],
    ['screen-Settings-color', function() {
         System.settings.change('color', this.value);
    }],
    ['screen-Detail-name', function() {
         FileInfo.name = this.value;
    }],
    ['screen-Detail-type', function() {
         FileInfo.type = this.value;
         change();
    }]
];
window.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('keyup', change);
    setInterval(() => {
        if(System.settings.keyCheck) {
            var selection = document.getSelection();
            if (selection.rangeCount > 0) {
                let nowTextFirst = selection.getRangeAt(0).getBoundingClientRect();
                document.getElementById('cursor').style.top = `${nowTextFirst.top}px`;
                document.getElementById('cursor').style.left = `${nowTextFirst.left}px`;
                if (selection.rangeCount > 1) {
                    let nowTextLast = selection.getRangeAt(selection.rangeCount - 1).getBoundingClientRect();
                    document.getElementById('cursor-box').setAttribute('height', `${nowTextLast.bottom - nowTextFirst.top}px`);
                    document.getElementById('cursor-box').setAttribute('width', `${nowTextLast.left - nowTextFirst.right}px`);
                } else {
                    document.getElementById('cursor-box').setAttribute('height', '14px');
                    document.getElementById('cursor-box').setAttribute('width', '1px');
                }
            }
        }
    }, 100);
    document.getElementById('input').addEventListener("focus", () => {
        document.getElementById('cursor').style.display = 'block';
    });
    document.getElementById('input').addEventListener("blur", () => {
        document.getElementById('cursor').style.display = 'none';
    });
    for (let i = 0; i < OnclickData.length; i++) {
        document.getElementById(OnclickData[i][0]).addEventListener("click", OnclickData[i][1]);
    }
    for (let i = 0; i < OnchangeData.length; i++) {
        document.getElementById(OnchangeData[i][0]).addEventListener("change", OnchangeData[i][1]);
    }
    var elements = document.getElementsByClassName('btn-open_screen');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("click", function(event) {
            screenOpen(this.dataset.name);
        });
    }
    var elements = document.getElementsByClassName('btn-screen_close');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("click", function(event) {
            screenClose(this.dataset.name);
        });
    }
    var elements = document.getElementsByClassName('screen');
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("click", function(event) {
            var rect = this.getBoundingClientRect();
            if (
            event.clientX < rect.x ||
            event.clientY < rect.y ||
            event.clientX > (rect.x + rect.width) ||
            event.clientY > (rect.y + rect.height)
            ) {
                screenClose(this.dataset.type);
            }
        });
    }
    document.getElementById('screen-Export-icon').addEventListener('dragstart', function(event) {
        event.dataTransfer.dropEffect = "copy";
        //var blob = new Blob([document.getElementById('input').innerText],{type:FileInfo.type});
        event.dataTransfer.setData(FileInfo.type, document.getElementById('input').innerText);
    });
    var data = {
        id: localStorage.getItem('fileId'),
        name: localStorage.getItem('fileName'),
        type: localStorage.getItem('fileType'),
        service: localStorage.getItem('fileService'),
        data: localStorage.getItem('fileData')
    };
    if (data.id && data.service && data.name && data.type && data.data) {
        File.open(data);
    }
    System.status = 'loaded';
});