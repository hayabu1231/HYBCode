class Connection {
    constructor(data, returnFunction) {
        this.xhr = new XMLHttpRequest();
        var thisClass = this;
        this.xhr.addEventListener('load', function() {
            thisClass._receive(thisClass, returnFunction);
        });
        this.xhr.addEventListener('error', (event) => {
            throw new Error('通信中にエラーが発生しました');
        });
        this._send(data.method, data.url, data.data, data.headers);
    }
    _send(method, url, data, headers) {
        this.xhr.open(method, url, true);
        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                this.xhr.setRequestHeader(headers[i].id, headers[i].value);
            }
        }
        this.xhr.send(data);
    }
    _receive(thisClass, returnFunction) {
        if (thisClass.xhr.readyState === 4 && thisClass.xhr.status == 200) {
            var data = JSON.parse(thisClass.xhr.responseText);
            returnFunction(thisClass.xhr.status, data);
        } else if (thisClass.xhr.readyState === 4 && thisClass.xhr.status == 403) {
            throw new Error('認証情報が無効です');
        } else if (thisClass.xhr.readyState === 4) {
            throw new Error('失敗した可能性があります' + thisClass.xhr.status);
        }
    }
}

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
export class FileServiceGitHub {
    constructor(token) {
        this.id = '';
        this.type = 'github';
        this.files = [];
        this._token = token;
        this._login();
    }
    _login() {
        var thisClass = this;
        this._get('user', null, function(data) {
            if (data.type == 'User') {
                thisClass.id = data.login;
                thisClass.getAll();
            }
        });
    }
    _get(url, data, returnFunction) {
        let request = {
            method: 'GET',
            url: `https://api.github.com/${url}`,
            headers: [
                {id: 'accept', value: 'application/vnd.github+json'},
                {id: 'authorization', value: 'token ' + this._token},
                {id: 'X-GitHub-Api-Version', value: '2022-11-28'}
            ]
        };
        if (data) {
            request.url = `https://api.github.com/${url}?${data}`;
        }
        new Connection(request, returnFunction);
    }
    _send(url, data, returnFunction) {
        let request = {
            method: 'POST',
            url: `https://api.github.com/${url}`,
            headers: [
                {id: 'accept', value: 'application/vnd.github+json'},
                {id: 'authorization', value: 'token ' + this._token},
                {id: 'X-GitHub-Api-Version', value: '2022-11-28'}
            ],
            data: data
        };
        new Connection(request, returnFunction);
    }
    getAll(repo, path) {
        let returnFunction = function() {};
        let url = '';
        var thisClass = this;
        if (repo) {
            url = `/repos/${repo.id}/contents`;
            if (path) {
                url = `/repos/${repo.id}/contents/${path}`;
            }
            returnFunction = function(data) {
                for (let i = 0; i < data.length; i++) {
                    if (data.type == 'dir') {
                        data.type = 'folder';
                    }
                    thisClass.files.push({
                        type: data.type,
                        id: `${repo.id}/contents/${data.path}`,
                        name: data.name
                    });
                }
            };
        } else {
            url = `users/${this.id}/repos`;
            returnFunction = function(data) {
                for (let i = 0; i < data.length; i++) {
                    thisClass.files.push({
                        type: 'repo',
                        id: data.full_name,
                        name: data.name
                    });
                }
            };
        }
        this._get(url, null, returnFunction);
    }
    save(data, returnFunction) {
        var thisClass = this;
        this._send(`/repos/${data.id}`, data, function(data) {
            thisClass.getAll();
            returnFunction(data);
        });
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
    _get(url,data) {
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
        this._get('file-list/');
    }
    save(data, returnFunction) {
        /*
        this._send();
        returnFunction(id);
        */
    }
}