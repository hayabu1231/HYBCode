export class FileServiceLocal {
    constructor(db) {
        this.id = 'local';
        this.type = 'local';
        this.files = [];
        this._db = db;
        this.getAll();
    }
    getAll() {
        var dbConnection = this._db.transaction('files', 'readwrite');
        var filesDB = dbConnection.objectStore('files');
        var request = filesDB.getAll();
        var thisClass = this;
        request.onsuccess = function(event) {
            thisClass.files = event.target.result;
        };
    }
    save(data, returnFunction) {
        var dbConnection = this._db.transaction('files', 'readwrite');
        var filesDB = dbConnection.objectStore('files');
        if (data.id) {
            var request = filesDB.put(data);
        } else {
            var request = filesDB.add(data);
        }
        var thisClass = this;
        request.onsuccess = function(event) {
            thisClass.getAll();
            returnFunction(event.target.result);
        };
    }
}
export class FileServiceHYBFTS {
    constructor(address, id, password) {
        this.id = `${address}@${id}@hybfts`;
        this.type = 'hybfts';
        this.files = [];
        this.xhr = new XMLHttpRequest();
        this._selectedPath = '';
        var thisClass = this;
        this.xhr.addEventListener('load', function() {
            thisClass._receive(thisClass);
        });
        this.xhr.addEventListener('error', (event) => {
            throw new Error('通信中にエラーが発生しました');
        });
        this._address = address;
        this._login(id, password);
    }
    _login(id, password) {
        this.xhr.open('POST', `https://${this._address}/login/`, true);
        this.xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        this.xhr.send(`id=${id}&password=${password}`);
    }
    _getData(url,data) {
        this.xhr.open('GET', `https://${this._address}/${url}?location=${this._selectedPath}&data=${encodeURI(JSON.stringify(data))}`, true);
        this.xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        this.xhr.setRequestHeader('authorization', 'HYB-key ' + this._session);
        this.xhr.send();
    }
    _send(url,data) {
        data.location = this._selectedPath;
        this.xhr.open('POST', `https://${this._address}/${url}`, true);
        this.xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        this.xhr.setRequestHeader('authorization', 'HYB-key ' + this._session);
        this.xhr.send(encodeURIComponent(JSON.stringify(data)));
    }
    _receive(thisClass) {
        if (thisClass.xhr.readyState === 4 && thisClass.xhr.status == 200) {
            var data = JSON.parse(this.xhr.responseText);
            if (data.type == 'login') {
                thisClass._session = data.session;
                thisClass.getAll();
            } else if (data.type == 'file-list') {
                thisClass.files = data.files;
            } else if (data.type == 'create' && data.status == 'success') {
                alert('フォルダ作成完了しました。');
                thisClass.getAll();
            } else if (data.type == 'upload' && data.status == 'success') {
                alert('アップロード完了しました。');
                thisClass.getAll();
            } else if (data.type == 'download' && data.status == 'success') {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var link = document.createElement('a');
                    link.href = reader.result;
                    link.download = data.name;
                    link.click();
                };
                reader.readAsDataURL(new File([atob(data.data)], data.name));
            } else if (data.type == 'rename' && data.status == 'success') {
                alert('変更しました');
                thisClass.getAll();
            } else if (data.type == 'delete' && data.status == 'success') {
                alert('削除しました');
                thisClass.getAll();
            }
        } else if (thisClass.xhr.readyState === 4 && thisClass.xhr.status == 403) {
            throw new Error('認証情報が無効です');
        } else if (thisClass.xhr.readyState === 4) {
            throw new Error('失敗した可能性があります' + thisClass.xhr.status);
        }
    }
    getAll() {
        this._getData('file-list/');
    }
    save(data, returnFunction) {
        /*
        this._sendData();
        returnFunction(id);
        */
    }
}