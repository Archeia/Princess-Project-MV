import { getProperty } from './helpers'

Object.defineProperty(Game_Map.prototype, 'tiledData', {
    get: function () {
        return DataManager._tempTiledData;
    },
    configurable: true
});

Object.defineProperty(Game_Map.prototype, 'currentMapLevel', {
    get: function () {
        let pluginParams = PluginManager.parameters("YED_Tiled");
        let varID = parseInt(pluginParams["Map Level Variable"]);
        if (!varID) {
            return this._currentMapLevel;
        } else {
            return $gameVariables.value(varID);
        }
    },
    set: function (value) {
        let pluginParams = PluginManager.parameters("YED_Tiled");
        let varID = parseInt(pluginParams["Map Level Variable"]);
        if (!varID) {
            this._currentMapLevel = value;
        } else {
            $gameVariables.setValue(varID, value);
        }
    },
    configurable: true
});


let _setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function (mapId) {
    _setup.call(this, mapId);
    this._isSetupBefore = this._isSetupBefore || {};
    this._collisionMap = [];
    this._arrowCollisionMap = [];
    this._regions = [];
    this._mapLevelChange = [];
    this._currentMapLevel = 0;
    this._reflection = [];
    this.currentMapLevel = 0;
    if (this.isTiledMap()) {
        $dataMap.width = this.tiledData.width;
        $dataMap.height = this.tiledData.height;
        this._setupTiled();
        this._isSetupBefore[mapId] = true;
    }
};

Game_Map.prototype.isTiledMap = function () {
    return !!this.tiledData;
};

Game_Map.prototype.isSaveEventLocations = function () {
    if (!this.tiledData.properties) {
        return false;
    }
    return !!getProperty(this.tiledData.properties, 'saveEventLocations')
};

Game_Map.prototype._setupTiled = function () {
    this._initializeMapLevel(0);

    this._setupCollision();
    this._setupRegion();
    this._setupMapLevelChange();
    this._setupReflection();

    this._setupTiledEvents();
};

Game_Map.prototype._initializeMapLevel = function (id) {
    let width = this.width();
    let height = this.height();
    let size = width * height;

    if (!!this._collisionMap[id]) {
        return;
    }

    this._collisionMap[id] = [];
    this._arrowCollisionMap[id] = [];
    this._regions[id] = [];
    this._mapLevelChange[id] = [];
    for (let x of Array(size).keys()) {
        this._collisionMap[id].push(0);
        this._arrowCollisionMap[id].push(1 | 2 | 4 | 8);
        this._regions[id].push(0);
        this._mapLevelChange[id].push(-1);
    }
};

Game_Map.prototype._getTileProperties = function (tileId) {
    let tilesetId = 0;
    for (let tileset of this.tiledData.tilesets) {
        if (tileId < tileset.firstgid
            || tileId >= tileset.firstgid + tileset.tilecount) {
            tilesetId++;
            continue;
        }
        break;
    }
    let tileset = this.tiledData.tilesets[tilesetId];
    if (!tileId || !tileset || !tileset.tiles) {
        return [];
    }
    return tileset.tiles.find(tile => tile.id === (tileId - tileset.firstgid)).properties || [];
};

Game_Map.prototype._setupCollision = function () {
    this._setupCollisionFull();
    this._setupCollisionArrow();
};

Game_Map.prototype._setupCollisionFull = function () {
    let width = this.width();
    let height = this.height();
    let size = width * height;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    if (this.isHalfTile()) {
        size /= 4;
    }

    for (let layerData of this.tiledData.layers) {
        const properties = layerData.properties

        if (!properties || !getProperty(properties, 'collision')) {
            continue;
        }

        const collision = getProperty(properties, 'collision')

        if (collision !== "full"
            && collision !== "up-left"
            && collision !== "up-right"
            && collision !== "down-left"
            && collision !== "down-right"
            && collision !== "tile-base") {
            continue;
        }

        let level = parseInt(getProperty(properties, 'level')) || 0;
        this._initializeMapLevel(level);

        for (let x of Array(size).keys()) {
            let realX = x;
            let ids = [];
            if (this.isHalfTile()) {
                realX = Math.floor(x / halfWidth) * width * 2 + (x % halfWidth) * 2;
            }
            if (!!layerData.data[x]) {
                if (collision === "full") {
                    ids.push(realX);
                    if (this.isHalfTile()) {
                        ids.push(realX + 1, realX + width, realX + width + 1);
                    }
                }
                if (collision === "up-left") {
                    ids.push(realX);
                }
                if (collision === "up-right") {
                    ids.push(realX + 1);
                }
                if (collision === "down-left") {
                    ids.push(realX + width);
                }
                if (collision === "down-right") {
                    ids.push(realX + width + 1);
                }
                if (collision === "tile-base") {
                    let tileproperties = this._getTileProperties(layerData.data[x]);
                    if (getProperty(tileproperties, 'collision') === "full") {
                        ids.push(realX);
                        if (this.isHalfTile()) {
                            ids.push(realX + 1, realX + width, realX + width + 1);
                        }
                    }
                }
                for (let id of ids) {
                    this._collisionMap[level][id] = 1;
                }
            }
        }
    }
};

Game_Map.prototype._getArrowBit = function (impassable) {
    let bit = 0
    let arrows = impassable.split('&').map(i => i.trim().toLowerCase())

    for (let arrow of arrows) {
        if (arrow === 'left') bit ^= 1
        if (arrow === 'up') bit ^= 2
        if (arrow === 'right') bit ^= 4
        if (arrow === 'down') bit ^= 8
    }

    return bit
};

Game_Map.prototype._setupCollisionArrow = function () {
    let width = this.width();
    let height = this.height();
    let size = width * height;
    let bit = 0;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    if (this.isHalfTile()) {
        size /= 4;
    }

    for (let layerData of this.tiledData.layers) {
        const properties = layerData.properties
        const collision = getProperty(properties, 'collision')
        if (!properties || !collision) {
            continue;
        }

        if (collision !== "arrow"
            && collision !== "tile-base") {
            continue;
        }

        let level = parseInt(getProperty(properties, 'level')) || 0;
        this._initializeMapLevel(level);
        let arrowCollisionMap = this._arrowCollisionMap[level];
        for (let x of Array(size).keys()) {
            let realX = x;
            if (this.isHalfTile()) {
                realX = Math.floor(x / halfWidth) * width * 2 + (x % halfWidth) * 2;
            }

            if (collision === "tile-base") {
                let tileproperties = this._getTileProperties(layerData.data[x]);
                const tilearrowImpassable = getProperty(tileproperties, 'arrowImpassable')
                if (!!tilearrowImpassable) {
                    bit = this._getArrowBit(tilearrowImpassable);
                    arrowCollisionMap[realX] = arrowCollisionMap[realX] ^ bit;
                    if (this.isHalfTile()) {
                        arrowCollisionMap[realX + 1]
                            = arrowCollisionMap[realX + 1] ^ bit;
                        arrowCollisionMap[realX + width]
                            = arrowCollisionMap[realX + width] ^ bit;
                        arrowCollisionMap[realX + width + 1]
                            = arrowCollisionMap[realX + width + 1] ^ bit;
                    }
                }
            } else if (!!layerData.data[x]) {
                const arrowImpassable = getProperty(properties, 'arrowImpassable')
                if (!arrowImpassable) {
                    continue;
                }

                bit = this._getArrowBit(arrowImpassable)

                arrowCollisionMap[realX] = arrowCollisionMap[realX] ^ bit;
                if (this.isHalfTile()) {
                    arrowCollisionMap[realX + 1]
                        = arrowCollisionMap[realX + 1] ^ bit;
                    arrowCollisionMap[realX + width]
                        = arrowCollisionMap[realX + width] ^ bit;
                    arrowCollisionMap[realX + width + 1]
                        = arrowCollisionMap[realX + width + 1] ^ bit;
                }
            }
        }
    }
};

Game_Map.prototype._setupRegion = function () {
    let width = this.width();
    let height = this.height();
    let size = width * height;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    if (this.isHalfTile()) {
        size /= 4;
    }

    for (let layerData of this.tiledData.layers) {
        const properties = layerData.properties
        const regionId = getProperty(properties, 'regionId')
        if (!properties || !regionId) {
            continue;
        }

        let level = parseInt(getProperty(properties, 'level')) || 0;
        this._initializeMapLevel(level);
        let regionMap = this._regions[level];

        for (let x of Array(size).keys()) {
            let realX = x;
            if (this.isHalfTile()) {
                realX = Math.floor(x / halfWidth) * width * 2 + (x % halfWidth) * 2;
            }

            if (regionId === "tile-base") {
                let tileproperties = this._getTileProperties(layerData.data[x]);
                const tileregionId = getProperty(tileproperties, 'regionId')
                if (!!tileregionId) {
                    regionMap[realX] = parseInt(tileregionId);
                    if (this.isHalfTile()) {
                        regionMap[realX + 1] = parseInt(tileregionId);
                        regionMap[realX + width] = parseInt(tileregionId);
                        regionMap[realX + width + 1] = parseInt(tileregionId);
                    }
                }
            } else if (!!layerData.data[x]) {
                regionMap[realX] = parseInt(regionId);
                if (this.isHalfTile()) {
                    regionMap[realX + 1] = parseInt(regionId);
                    regionMap[realX + width] = parseInt(regionId);
                    regionMap[realX + width + 1] = parseInt(regionId);
                }
            }
        }
    }
};

Game_Map.prototype._setupMapLevelChange = function () {
    let width = this.width();
    let height = this.height();
    let size = width * height;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    if (this.isHalfTile()) {
        size /= 4;
    }

    for (let layerData of this.tiledData.layers) {
        const properties = layerData.properties
        const toLevel = parseInt(getProperty(properties, 'toLevel'))
        if (!properties || !toLevel) {
            continue;
        }

        let level = parseInt(getProperty(properties, 'level')) || 0;
        this._initializeMapLevel(level);
        let levelChangeMap = this._mapLevelChange[level];

        for (let x of Array(size).keys()) {
            let realX = x;
            if (this.isHalfTile()) {
                realX = Math.floor(x / halfWidth) * width * 2 + (x % halfWidth) * 2;
            }

            if (!!layerData.data[x]) {
                levelChangeMap[realX] = toLevel;
                if (this.isHalfTile()) {
                    levelChangeMap[realX + 1] = toLevel;
                    levelChangeMap[realX + width] = toLevel;
                    levelChangeMap[realX + width + 1] = toLevel;
                }
            }
        }
    }
};

Game_Map.prototype._setupReflection = function () {
    for (const layerData of this.tiledData.layers) {
        const properties = layerData.properties
        if (layerData.type !== "objectgroup") {
            continue;
        }

        if (!properties) {
            continue;
        }

        const reflectionCast = getProperty(properties, 'reflectionCast')
        const reflectionMask = getProperty(properties, 'reflectionMask')
        const reflectionOpacity = getProperty(properties, 'reflectionOpacity') || 255
        const reflectionOffset = getProperty(properties, 'reflectionOffset') || 0

        if (reflectionCast === null) {
            continue;
        }

        for (const obj of layerData.objects) {
            const rect = {
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
            };

            this._reflection.push({
                rect,
                reflectionCast,
                reflectionMask,
                reflectionOpacity,
                reflectionOffset,
            });
        }
    }
};

Game_Map.prototype.isOnReflection = function (character) {
    const mapX = character._realX * this.tileWidth();
    const mapY = character._realY * this.tileHeight();

    if (!this.isTiledMap()) {
        return false;
    }

    if (this._reflection.length === 0) {
        return false;
    }

    for (const reflection of this._reflection) {
        const rect = reflection.rect;
        const inX = mapX >= rect.x && mapX <= rect.x + rect.width;
        const inY = mapY >= rect.y && mapY <= rect.y + rect.height;

        if (inX && inY) {
            return true;
        }
    }

    return false;
};

Game_Map.prototype.getReflections = function (character) {
    const mapX = character._realX;
    const mapY = character._realY;

    const result = [];

    for (const reflection of this._reflection) {
        const rect = reflection.rect;
        const xBegin = rect.x / this.tileWidth();
        const yBegin = rect.y / this.tileHeight();
        const xEnd = (rect.x + rect.width) / this.tileWidth() - 1;
        const yEnd = (rect.y + rect.height) / this.tileHeight() - 1;
        const inX = mapX >= xBegin && mapX <= xEnd;
        const inY = mapY >= yBegin && mapY <= yEnd;

        if (inX && inY) {
            result.push(reflection);
        }
    }

    return result;
};

Game_Map.prototype._setupTiledEvents = function () {
    for (let layerData of this.tiledData.layers) {
        if (layerData.type !== "objectgroup") {
            continue;
        }

        for (let object of layerData.objects) {
            if (!object.properties) {
                continue;
            }

            const eventId = parseInt(getProperty(object.properties, 'eventId'))

            if (!eventId) {
                continue;
            }

            let event = this._events[eventId];
            if (!event) {
                continue;
            }
            let x = Math.floor(object.x / this.tileWidth());
            let y = Math.floor(object.y / this.tileHeight());
            if (this.isHalfTile()) {
                x += 1;
                y += 1;
            }

            event.locate(x, y);
            if (event.loadLocation) {
                event.loadLocation();
            }
        }
    }
};

Game_Map.prototype.isHalfTile = function () {
    let pluginParams = PluginManager.parameters("YED_Tiled");
    return pluginParams["Half-tile movement"].toLowerCase() === "true";
};

Game_Map.prototype.tileWidth = function () {
    let tileWidth = this.tiledData.tilewidth;
    if (this.isHalfTile()) {
        tileWidth /= 2;
    }
    return tileWidth;
};

Game_Map.prototype.tileHeight = function () {
    let tileHeight = this.tiledData.tileheight;
    if (this.isHalfTile()) {
        tileHeight /= 2;
    }
    return tileHeight;
};

Game_Map.prototype.width = function () {
    let width = this.tiledData.width;
    if (this.isHalfTile()) {
        width *= 2;
    }
    return width;
};

Game_Map.prototype.height = function () {
    let height = this.tiledData.height;
    if (this.isHalfTile()) {
        height *= 2;
    }
    return height;
};

let _regionId = Game_Map.prototype.regionId;
Game_Map.prototype.regionId = function (x, y) {
    if (!this.isTiledMap()) {
        return _regionId.call(this, x, y);
    }

    let index = x + this.width() * y;
    let regionMap = this._regions[this.currentMapLevel];

    return regionMap[index];
};

let _isPassable = Game_Map.prototype.isPassable;
Game_Map.prototype.isPassable = function (x, y, d) {
    if (!this.isTiledMap()) {
        return _isPassable.call(this, x, y, d);
    }

    let index = x + this.width() * y;
    let arrows = this._arrowCollisionMap[this.currentMapLevel];

    if (d === 4) {
        if (!(arrows[index] & 1)) {
            return false;
        }
    }

    if (d === 8) {
        if (!(arrows[index] & 2)) {
            return false;
        }
    }

    if (d === 6) {
        if (!(arrows[index] & 4)) {
            return false;
        }
    }

    if (d === 2) {
        if (!(arrows[index] & 8)) {
            return false;
        }
    }

    return this._collisionMap[this.currentMapLevel][index] === 0;
};

Game_Map.prototype.checkMapLevelChanging = function (x, y) {
    let mapLevelChange = this._mapLevelChange[this.currentMapLevel];
    let id = y * this.width() + x;
    if (mapLevelChange[id] < 0) {
        return false;
    }
    this.currentMapLevel = mapLevelChange[id];
    return true;
};