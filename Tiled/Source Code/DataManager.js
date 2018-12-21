DataManager._tempTiledData = null;
DataManager._tiledLoaded = false;
DataManager._tilesetToLoad = 0;

let _loadMapData = DataManager.loadMapData;
DataManager.loadMapData = function (mapId) {
    _loadMapData.call(this, mapId);
    if (mapId > 0) {
        this.loadTiledMapData(mapId);
    } else {
        this.unloadTiledMapData();
    }
};

DataManager.loadTiledMapData = function (mapId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "./maps/Map" + mapId + ".json");
    xhr.overrideMimeType('application/json');

    // on success callback
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.responseText !== "") {
                DataManager._tempTiledData = JSON.parse(xhr.responseText);
            }
            DataManager.loadTilesetData();
            DataManager._tiledLoaded = true;
        }
    };

    // set data to null and send request
    this.unloadTiledMapData();
    xhr.send();
};

DataManager.loadTilesetData = function () {
    for (let tileset of DataManager._tempTiledData.tilesets) {
        if (!tileset.source) {
            continue;
        }

        DataManager._tilesetToLoad++;
        let filename = tileset.source.replace(/^.*[\\\/]/, '');
        let xhr = new XMLHttpRequest();

        xhr.open('GET', "./maps/" + filename);
        xhr.overrideMimeType('application/json');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.responseText !== "") {
                    Object.assign(tileset, JSON.parse(xhr.responseText));
                }
                DataManager._tilesetToLoad--;
            }
        };

        xhr.send();
    }
};

DataManager.unloadTiledMapData = function () {
    DataManager._tempTiledData = null;
    DataManager._tiledLoaded = false;
    DataManager._tilesetToLoad = 0;
};

let _isMapLoaded = DataManager.isMapLoaded;
DataManager.isMapLoaded = function () {
    let defaultLoaded = _isMapLoaded.call(this);
    let tiledLoaded = DataManager._tiledLoaded;
    let tilesetLoaded = DataManager._tilesetToLoad <= 0;

    return defaultLoaded && tiledLoaded && tilesetLoaded;
};