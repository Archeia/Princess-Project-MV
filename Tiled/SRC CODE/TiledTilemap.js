import { getProperty } from './helpers'

export class TiledTilemap extends ShaderTilemap {
    initialize(tiledData) {
        this._tiledData = {};
        this._layers = [];
        this._priorityTiles = [];
        this._priorityTilesCount = 0;
        this.tiledData = tiledData;
        super.initialize();
        this.setupTiled();
    }

    get tiledData() {
        return this._tiledData;
    }

    set tiledData(val) {
        this._tiledData = val;
        this.setupTiled();
    }

    setupTiled() {
        this._setupSize();
        this._setupAnim();
    }

    _setupSize() {
        let width = this._width;
        let height = this._height;
        let margin = this._margin;
        let tileCols = Math.ceil(width / this._tileWidth) + 1;
        let tileRows = Math.ceil(height / this._tileHeight) + 1;
        this._tileWidth = this.tiledData.tilewidth;
        this._tileHeight = this.tiledData.tileheight;
        this._layerWidth = tileCols * this._tileWidth;
        this._layerHeight = tileRows * this._tileHeight;
        this._mapWidth = this.tiledData.width;
        this._mapHeight = this.tiledData.height;
    }

    _setupAnim() {
        this._animFrame = {};
        this._animDuration = {};

        for (const tileset of this.tiledData.tilesets) {
            const tilesData = tileset.tiles;
            if (!tilesData) {
                continue;
            }
            for (const tile of tilesData) {
                const animation = tile.animation;
                if (!animation) continue;
                this._animFrame[tile.id] = 0;
                const duration = animation[0].duration / 1000 * 60;
                this._animDuration[tile.id] = duration;
            }
        }
    }

    _createLayers() {
        let id = 0;
        this._needsRepaint = true;

        let parameters = PluginManager.parameters('ShaderTilemap');
        let useSquareShader = Number(parameters.hasOwnProperty('squareShader') ? parameters['squareShader'] : 1);

        for (let layerData of this.tiledData.layers) {
            let zIndex = 0;
            const properties = layerData.properties
            if (layerData.type != "tilelayer") {
                id++;
                continue;
            }

            if (!!getProperty(properties, 'zIndex')) {
                zIndex = parseInt(getProperty(layerData.properties, zIndex));
            }

            if (!!getProperty(properties, 'collision')) {
                id++;
                continue;
            }

            if (!!getProperty(properties, 'toLevel')) {
                id++;
                continue;
            }

            if (!!getProperty(properties, 'regionId')) {
                id++;
                continue;
            }

            if (this._isReflectLayer(layerData)) {
                id++;
                continue;
            }

            let layer = new PIXI.tilemap.CompositeRectTileLayer(zIndex, [], useSquareShader);
            layer.layerId = id; // @dryami: hack layer index
            layer.spriteId = Sprite._counter++;
            this._layers.push(layer);
            this.addChild(layer);
            id++;
        }

        this._createPriorityTiles();
    }

    _createPriorityTiles() {
        let pluginParams = PluginManager.parameters("YED_Tiled");
        let size = parseInt(pluginParams["Priority Tiles Limit"]);
        let zIndex = parseInt(pluginParams["Z - Player"]);
        for (let x of Array(size).keys()) {
            let sprite = new Sprite_Base();
            sprite.z = sprite.zIndex = zIndex;
            sprite.layerId = -1;
            sprite.hide();
            this.addChild(sprite);
            this._priorityTiles.push(sprite);
        }
    }

    _isReflectLayer(layerData) {
        const properties = layerData.properties;
        return !!properties && (
            getProperty(properties, 'reflectionSurface')
            || getProperty(properties, 'reflectionCast')
        );
    }

    _hackRenderer(renderer) {
        return renderer;
    }

    refreshTileset() {
        var bitmaps = this.bitmaps.map(function (x) { return x._baseTexture ? new PIXI.Texture(x._baseTexture) : x; });
        for (let layer of this._layers) {
            layer.setBitmaps(bitmaps);
        }
    }

    update() {
        super.update();
        this._updateAnim();
    }

    _updateAnim() {
        let needRefresh = false;
        for (let key in this._animDuration) {
            this._animDuration[key] -= 1;
            if (this._animDuration[key] <= 0) {
                this._animFrame[key] += 1;
                needRefresh = true;
            }
        }

        if (needRefresh) {
            this._updateAnimFrames();
            this.refresh();
        }
    }

    _updateAnimFrames() {
        for (const tileset of this.tiledData.tilesets) {
            const tilesData = tileset.tiles;
            if (!tilesData) {
                continue;
            }
            for (const tile of tilesData) {
                const tileId = tile.id;
                const animation = tile.animation;
                if (!animation) continue;
                let frame = this._animFrame[tileId];
                this._animFrame[tileId] = !!animation[frame] ? frame : 0;
                frame = this._animFrame[tileId];
                const duration = animation[frame].duration / 1000 * 60;
                if (this._animDuration[tileId] <= 0) {
                    this._animDuration[tileId] = duration;
                }
            }
        }
    }

    _updateLayerPositions(startX, startY) {
        let ox = 0;
        let oy = 0;
        if (this.roundPixels) {
            ox = Math.floor(this.origin.x);
            oy = Math.floor(this.origin.y);
        } else {
            ox = this.origin.x;
            oy = this.origin.y;
        }

        for (let layer of this._layers) {
            let layerData = this.tiledData.layers[layer.layerId];
            let offsetX = layerData.offsetx || 0;
            let offsetY = layerData.offsety || 0;
            layer.position.x = startX * this._tileWidth - ox + offsetX;
            layer.position.y = startY * this._tileHeight - oy + offsetY;
        }

        for (let sprite of this._priorityTiles) {
            let layerData = this.tiledData.layers[sprite.layerId];
            let offsetX = layerData ? layerData.offsetx || 0 : 0;
            let offsetY = layerData ? layerData.offsety || 0 : 0;
            sprite.x = sprite.origX + startX * this._tileWidth - ox + offsetX + sprite.width / 2;
            sprite.y = sprite.origY + startY * this._tileHeight - oy + offsetY + sprite.height;
        }
    }

    _paintAllTiles(startX, startY) {
        this._priorityTilesCount = 0;
        for (let layer of this._layers) {
            layer.clear();
            this._paintTiles(layer, startX, startY);
        }
        let id = 0;
        for (let layerData of this.tiledData.layers) {
            if (layerData.type != "objectgroup") {
                id++;
                continue;
            }
            this._paintObjectLayers(id, startX, startY);
            id++;
        }
        while (this._priorityTilesCount < this._priorityTiles.length) {
            let sprite = this._priorityTiles[this._priorityTilesCount];
            sprite.hide();
            sprite.layerId = -1;
            this._priorityTilesCount++;
        }
    }

    _paintTiles(layer, startX, startY) {
        let layerData = this.tiledData.layers[layer.layerId];

        if (!layerData.visible) {
            return;
        }

        if (layerData.type == "tilelayer") {
            this._paintTilesLayer(layer, startX, startY);
        }
    }

    _paintObjectLayers(layerId, startX, startY) {
        let layerData = this.tiledData.layers[layerId];
        let objects = layerData.objects || [];

        for (let obj of objects) {
            if (!obj.gid) {
                continue;
            }
            if (!obj.visible) {
                continue;
            }
            let tileId = obj.gid;
            let textureId = this._getTextureId(tileId);
            let dx = obj.x - startX * this._tileWidth;
            let dy = obj.y - startY * this._tileHeight - obj.height;
            this._paintPriorityTile(layerId, textureId, tileId, startX, startY, dx, dy);
        }
    }

    _paintTilesLayer(layer, startX, startY) {
        let tileCols = Math.ceil(this._width / this._tileWidth) + 1;
        let tileRows = Math.ceil(this._height / this._tileHeight) + 1;

        for (let y of Array(tileRows).keys()) {
            for (let x of Array(tileCols).keys()) {
                this._paintTile(layer, startX, startY, x, y);
            }
        }
    }

    _paintTile(layer, startX, startY, x, y) {
        let mx = x + startX;
        let my = y + startY;
        if (this.horizontalWrap) {
            mx = mx.mod(this._mapWidth);
        }
        if (this.verticalWrap) {
            my = my.mod(this._mapHeight);
        }
        let tilePosition = mx + my * this._mapWidth;
        let tileId = this.tiledData.layers[layer.layerId].data[tilePosition];
        let rectLayer = layer.children[0];
        let textureId = 0;

        if (!tileId) {
            return;
        }

        // TODO: Problem with offsets
        if (mx < 0 || mx >= this._mapWidth || my < 0 || my >= this._mapHeight) {
            return;
        }

        textureId = this._getTextureId(tileId);

        let tileset = this.tiledData.tilesets[textureId];
        let dx = x * this._tileWidth;
        let dy = y * this._tileHeight;
        let w = tileset.tilewidth;
        let h = tileset.tileheight;
        let tileCols = tileset.columns;
        let rId = this._getAnimTileId(textureId, tileId - tileset.firstgid);
        let ux = (rId % tileCols) * w;
        let uy = Math.floor(rId / tileCols) * h;

        if (this._isPriorityTile(layer.layerId)) {
            this._paintPriorityTile(layer.layerId, textureId, tileId, startX, startY, dx, dy);
            return;
        }

        rectLayer.addRect(textureId, ux, uy, dx, dy, w, h);
    }

    _paintPriorityTile(layerId, textureId, tileId, startX, startY, dx, dy) {
        let tileset = this.tiledData.tilesets[textureId];
        let w = tileset.tilewidth;
        let h = tileset.tileheight;
        let tileCols = tileset.columns;
        let rId = this._getAnimTileId(textureId, tileId - tileset.firstgid);
        let ux = (rId % tileCols) * w;
        let uy = Math.floor(rId / tileCols) * h;
        let sprite = this._priorityTiles[this._priorityTilesCount];
        let layerData = this.tiledData.layers[layerId];
        let offsetX = layerData ? layerData.offsetx || 0 : 0;
        let offsetY = layerData ? layerData.offsety || 0 : 0;
        let ox = 0;
        let oy = 0;
        if (this.roundPixels) {
            ox = Math.floor(this.origin.x);
            oy = Math.floor(this.origin.y);
        } else {
            ox = this.origin.x;
            oy = this.origin.y;
        }

        if (this._priorityTilesCount >= this._priorityTiles.length) {
            return;
        }

        sprite.layerId = layerId;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 1.0;
        sprite.origX = dx;
        sprite.origY = dy;
        sprite.x = sprite.origX + startX * this._tileWidth - ox + offsetX + w / 2;
        sprite.y = sprite.origY + startY * this._tileHeight - oy + offsetY + h;
        sprite.bitmap = this.bitmaps[textureId];
        sprite.setFrame(ux, uy, w, h);
        sprite.priority = this._getPriority(layerId);
        sprite.z = sprite.zIndex = this._getZIndex(layerId);
        sprite.show();

        this._priorityTilesCount += 1;
    }

    _getTextureId(tileId) {
        let textureId = 0;
        for (let tileset of this.tiledData.tilesets) {
            if (tileId < tileset.firstgid
                || tileId >= tileset.firstgid + tileset.tilecount) {
                textureId++;
                continue;
            }
            break;
        }
        return textureId;
    }

    _getAnimTileId(textureId, tileId) {
        const tilesData = this.tiledData.tilesets[textureId].tiles;
        if (!tilesData) {
            return tileId;
        }
        const tile = this._getTileData(tilesData, tileId)
        if (!tile) {
            return tileId;
        }
        if (!tile.animation) {
            return tileId;
        }
        const animation = tile.animation;
        const frame = this._animFrame[tileId];
        if (!frame) {
            return tileId;
        }
        return animation[frame].tileid;
    }

    _getTileData(tilesData, tileId) {
        for (const tile of tilesData) {
            if (tile.id === tileId) {
                return tile
            }
        }
        return null
    }

    _getPriority(layerId) {
        let layerData = this.tiledData.layers[layerId];
        if (!layerData.properties) {
            return 0;
        }
        if (!getProperty(layerData.properties, 'priority')) {
            return 0;
        }
        return parseInt(getProperty(layerData.properties, 'priority'))
    }

    _isPriorityTile(layerId) {
        let pluginParams = PluginManager.parameters("YED_Tiled");
        let playerZIndex = parseInt(pluginParams["Z - Player"]);
        let zIndex = this._getZIndex(layerId);
        return this._getPriority(layerId) > 0
            && zIndex === playerZIndex;
    }

    _getZIndex(layerId) {
        let layerData = this.tiledData.layers[layerId];
        if (!layerData) {
            return 0;
        }
        if (!layerData.properties || !getProperty(layerData.properties, 'zIndex')) {
            return 0;
        }
        return parseInt(getProperty(layerData.properties, 'zIndex'));
    }

    hideOnLevel(level) {
        let layerIds = [];
        for (let layer of this._layers) {
            let layerData = this.tiledData.layers[layer.layerId];
            if (layerData.properties && getProperty(layerData.properties, 'hideOnLevel') !== null) {
                if (parseInt(getProperty(layerData.properties, 'hideOnLevel')) !== level) {
                    this.addChild(layer);
                    continue;
                }
                layerIds.push(layer.layerId);
                this.removeChild(layer);
            }
        }
        for (let sprite of this._priorityTiles) {
            if (layerIds.indexOf(sprite.layerId) === -1) {
                continue;
            }
            sprite.visible = false;
        }
    }

    _compareChildOrder(a, b) {
        if ((a.z || 0) !== (b.z || 0)) {
            return (a.z || 0) - (b.z || 0);
        } else if ((a.y || 0) !== (b.y || 0)) {
            return (a.y || 0) - (b.y || 0);
        } else if ((a.priority || 0) !== (b.priority || 0)) {
            return (a.priority || 0) - (b.priority || 0);
        } else {
            return a.spriteId - b.spriteId;
        }
    }
}