/*:
 * Yami Engine Delta - Tilemap
 *
 * @plugindesc v1.2.0 Implementation for Tiled Map Editor.
 * @author Dr.Yami and Liquidize
 */

/**
 * @namespace Tilemap
 * @memberof YED
 */

var YED = YED || {};

// init Tilemap module
YED.Tilemap = {};

(function() {

    ImageManager.loadParserTileset = function(path, hue) {
        var paths = path.split("/"),
            filename = paths[paths.length - 1],
            realPath = "img/tilesets/" + filename;

        return this.loadNormalBitmap(realPath, hue);
    };

    ImageManager.loadParserParallax = function(path, hue) {
        var paths = path.split("/"),
            filename = paths[paths.length - 1],
            realPath = "img/parallaxes/" + filename;

        return this.loadNormalBitmap(realPath, hue);
    };

}());

/* globals YED: false */

(function() {
    /**
     * The Data object is created by {@link YED.Tilemap.Core} to load and
     * contain tilemap data from json file
     *
     * To make sure the scene is ready, loading method should be called
     * manually:
     *
     * ```js
     * var data = new YED.Tilemap.Data();
     * data.loadMapFile();
     * ```
     *
     * @class
     * @memberof YED.Tilemap
     */
    var Data = function(data) {
        this._loadListeners = [];
        this._isExist = false;
        this._collision = []; // collision matrix
        this._region = []; // region matrix
        this._arrows = []; // arrow matrix
        this.data = data;
    };

    Object.defineProperties(Data.prototype, {
        /**
         * Tilemap data, the Data object will load tilemap data into this member
         *
         * @member {Object}
         * @memberof YED.Tilemap.Data#
         */
        data: {
            get: function() {
                return this._data || null;
            },

            set: function(data) {
                this._data = data;
                this._setupData();
            }
        },

        /**
         * Tilemap height, will be number of vertical grids
         *
         * @member {number}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        height: {
            get: function() {
                return this.data.height;
            }
        },

        /**
         * Tilemap width, will be number of horizontal grids
         *
         * @member {number}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        width: {
            get: function() {
                return this.data.width;
            }
        },

        /**
         * Tile height, will be height of each tile
         *
         * @member {number}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        tileHeight: {
            get: function() {
                return this.data.tileheight;
            }
        },

        /**
         * Tile width, will be width of each tile
         *
         * @member {number}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        tileWidth: {
            get: function() {
                return this.data.tilewidth;
            }
        },

        /**
         * Tilemap custom properties
         *
         * @member {Object}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        properties: {
            get: function() {
                return this.data.properties;
            }
        },

        /**
         * Tilemap layers data
         *
         * @member {Object[]}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        layers: {
            get: function() {
                return this.data.layers;
            }
        },

        /**
         * Tilemap tilesets data
         *
         * @member {Object[]}
         * @memberof YED.Tilemap.Data#
         * @readonly
         */
        tilesets: {
            get: function() {
                return this.data.tilesets;
            }
        },

        collision: {
            get: function() {
                return this._collision;
            }
        },

        region: {
            get: function() {
                return this._region;
            }
        },

        arrows: {
            get: function() {
                return this._arrows;
            }
        }
    });

    /**
     * Setup things after loaded data
     *
     * @private
     */
    Data.prototype._setupData = function() {
        if (!!this.data) {
            this._setupCollision();
            this._setupArrows();
            this._setupRegions();
            this._loadTilesets();
        }
    };

    Data.prototype._setupCollision = function() {
        var collisionLayers = this._getCollisionLayers(),
            i,j,
            layer;

        for (i = 0; i < this.width * this.height; i++) {
            this.collision[i] = 0;
        }

        for (i = 0; i < collisionLayers.length; i++) {
            layer = collisionLayers[i];

            if (!layer.data) {
                continue;
            }

            for (j = 0; j < layer.data.length; j++) {
                if (layer.data[j] > 0) {
                    this.collision[j] = 1;
                }
            }
        }
    };

    Data.prototype._setupRegions = function() {
        var regionLayers = this._getRegionsLayers(),
            i,j,
            layer;

        for (i = 0; i < this.width * this.height; i++) {
            this.region[i] = 0;
        }

        for (i = 0; i < regionLayers.length; i++) {
            layer = regionLayers[i];

            if (!layer.data) {
                continue;
            }

            for (j = 0; j < layer.data.length; j++) {
                if (layer.data[j] > 0) {
                    this.region[j] = parseInt(layer.properties.regionId);
                }
            }
        }
    };

    Data.prototype._setupArrows = function() {
        var arrowLayers = this._getArrowLayers(),
            i,j,
            layer,
            bit;

        for (i = 0; i < this.width * this.height; i++) {
            this.arrows[i] = 1 | 2 | 4 | 8;
        }

        for (i = 0; i < arrowLayers.length; i++) {
            layer = arrowLayers[i];

            if (!layer.data) {
                continue;
            }

            if (layer.properties.arrowImpassable === "left") {
                bit = 1;
            }

            if (layer.properties.arrowImpassable === "up") {
                bit = 2;
            }

            if (layer.properties.arrowImpassable === "right") {
                bit = 4;
            }

            if (layer.properties.arrowImpassable === "down") {
                bit = 8;
            }

            for (j = 0; j < layer.data.length; j++) {
                if (layer.data[j] > 0) {
                    this.arrows[j] = this.arrows[j] ^ bit;
                }
            }
        }
    };

    Data.prototype._loadTilesets = function() {
        var tilesetsData = this.tilesets,
            i = 0,
            length = tilesetsData.length,
            data;

        for (; i < length; i++) {
            data = tilesetsData[i];
            ImageManager.loadParserTileset(data.image, 0);
        }
    };

    Data.prototype._getCollisionLayers = function() {
        return this.layers.filter(function(layer) {
            return !!layer.properties && !!layer.properties.collision;
        });
    };

    Data.prototype._getRegionsLayers = function() {
        return this.layers.filter(function(layer) {
            return !!layer.properties && !!layer.properties.regionId;
        });
    };

    Data.prototype._getArrowLayers = function() {
        return this.layers.filter(function(layer) {
            return !!layer.properties && !!layer.properties.arrowImpassable;
        });
    };

    Data.prototype.getImageLayers = function() {
        return this.layers.filter(function(layer) {
            return layer.type === "imagelayer";
        });
    };

    /**
     * Check if the data is finished loading
     *
     * @return {Boolean} Ready flag
     */
    Data.prototype.isReady = function() {
        return !!this.data; // hack boolean
    };

    /**
     * Check if map data exists
     *
     * @return {Boolean} Exist flag
     */
    Data.prototype.isExist = function() {
        return this._isExist;
    };

    YED.Tilemap.Data = Data;
}());

/* globals YED: false */

(function() {
    /**
     * The Tileset objects are created by {@link YED.Tilemap.Core Tilemap.Core} to load
     * tileset textures and return tile blocks when needed
     *
     * A Tileset object is created with a tileset data gets from {@link YED.Tilemap.Data#tilesets Tilemap.Data#tilesets},
     * for example:
     *
     * ```js
     * var tilesetData = data.tilesets[0];
     * var tileset = new YED.Tilemap.Tileset(tilesetData);
     * ```
     * @class
     * @memberof YED.Tilemap
     * @param {Object} data A Tileset data gets from {@link YED.Tilemap.Data#tilesets Tilemap.Data#tilesets}
     */
    var Tileset = function(data) {
        this.data = data;
    };

    Object.defineProperties(Tileset.prototype, {
        /**
         * Tileset data get from tilemap data
         *
         * @member {Object}
         * @memberof YED.Tilemap.Tileset#
         */
        data: {
            get: function() {
                return this._data || null;
            },

            set: function(data) {
                this._data = data;
                this._setupData();
            }
        },

        /**
         * ID of the first tile in tileset
         *
         * @member {number}
         * @memberof YED.Tilemap.Tileset#
         * @readonly
         */
        firstId: {
            get: function() {
                return this.data.firstgid;
            }
        },

        /**
         * Tileset bitmap, use Bitmap object of RMMV framework
         *
         * @member {Bitmap}
         * @memberof YED.Tilemap.Tileset#
         */
        bitmap: {
            get: function() {
                return this._bitmap || null;
            },

            set: function(bitmap) {
                this._bitmap = bitmap || null;
            }
        },

        /**
         * Tileset bitmap height
         *
         * @member {number}
         * @memberof YED.Tilemap.Tileset#
         * @readonly
         */
        imageHeight: {
            get: function() {
                return this.data.imageheight;
            }
        },

        /**
         * Tileset bitmap width
         *
         * @member {number}
         * @memberof YED.Tilemap.Tileset#
         * @readonly
         */
        imageWidth: {
            get: function() {
                return this.data.imagewidth;
            }
        },

        /**
         * @member {number}
         * @memberof YED.Tilemap.Tileset#
         * @readonly
         */
        tileHeight: {
            get: function() {
                return this.data.tileheight;
            }
        },

        /**
         * @member {number}
         * @memberof YED.Tilemap.Tileset#
         * @readonly
         */
        tileWidth: {
            get: function() {
                return this.data.tilewidth || 0;
            }
        },

        tiles: {
            get: function() {
                return this.data.tiles;
            }
        }
    });

    /**
     * Setup things after loaded data
     *
     * @private
     */
    Tileset.prototype._setupData = function() {
        if (!!this.data) {
            this.bitmap = ImageManager.loadParserTileset(this.data.image, 0);
        }
    };

    /**
     * Get number of tiles in each line of tileset
     *
     * @return {number} Tiles count
     * @private
     */
    Tileset.prototype._countTilesHorizontal = function() {
        return Math.floor(this.imageWidth / this.tileWidth);
    };

    /**
     * Get number of tiles in each column of tileset
     *
     * @return {number} Tiles count
     * @private
     */
    Tileset.prototype._countTilesVertical = function() {
        return Math.floor(this.imageHeight / this.tileHeight);
    };

    /**
     * Get total tiles in tileset
     *
     * @return {number} Tiles count
     */
    Tileset.prototype.getTotalTiles = function() {
        return this._countTilesHorizontal() * this._countTilesVertical();
    };

    /**
     * Get grid position of tile, take tile ID as param
     *
     * @param  {number} id Tile ID in layer data
     * @return {Object} Object contains {x,y}
     * @private
     */
    Tileset.prototype._getTilePosition = function(id) {
        var realId = id - this.firstId,
            result = {x: 0, y: 0},
            tileX  = realId % this._countTilesHorizontal(),
            tileY  = Math.floor(realId / this._countTilesHorizontal());

        result.x = tileX;
        result.y = tileY;

        return result;
    };

    /**
     * Get tile block rectangle, take tile ID as param
     *
     * @param  {number} id Tile ID in layer data
     * @return {Object} Object contains {x,y,width,height}
     * @private
     */
    Tileset.prototype._getTileBlock = function(id) {
        var pos = this._getTilePosition(id);
        var result = {x: 0, y: 0, width: 0, height: 0};

        result.x = pos.x * this.tileWidth;
        result.y = pos.y * this.tileHeight;
        result.width  = this.tileWidth;
        result.height = this.tileHeight;

        return result;
    };

    /**
     * Get parameters for bitmap block transfer function
     *
     * @param  {number} id Tile ID in layer data
     * @param  {number} x Destination X
     * @param  {number} y Destination Y
     * @return {number[]} Array parameters
     */
    Tileset.prototype.getBlockTransferParams = function(id, x, y) {
        var tileBlock = this._getTileBlock(id);
        var result = [];

        result.push(this.bitmap);
        result.push(tileBlock.x, tileBlock.y, tileBlock.width, tileBlock.height);
        result.push(x, y);

        return result;
    };

    /**
     * Check if tile ID is included in tileset
     *
     * @param  {number} id Tile ID in layer data
     * @return {Boolean} Is in tileset
     */
    Tileset.prototype.isInTileset = function(id) {
        var lastId = this.firstId + this.getTotalTiles();

        return id >= this.firstId && id < lastId;
    };

    /**
     * Check if the tileset bitmap is finished loading
     *
     * @return {Boolean} Ready Flag
     */
    Tileset.prototype.isReady = function() {
        return ImageManager.isReady();
    };

    YED.Tilemap.Tileset = Tileset;
}());

/* globals YED: false */

(function() {
    /**
     * The Layer object extends Sprite object in RMMV framework, is created
     * by {@link YED.Tilemap.Core} to render a layer in tilemap
     *
     * A Layer can be created and render by simply creating a new Layer object
     * and add into a {@link http://www.goodboydigital.com/pixijs/docs/classes/DisplayObjectContainer.html PIXI.DisplayObjectContainer} object:
     *
     * ```js
     * var layer = new YED.Tilemap.Layer(data, tilesets, tileWidth, tileHeight);
     * scene.addChild(layer);
     * ```
     *
     * @class
     * @extends Sprite
     * @memberof YED.Tilemap
     * @param {Object} data A Layer data gets from {@link YED.Tilemap.Data#layers Tilemap.Data#layers}
     * @param {YED.Tilemap.Tileset[]} tilesets An array of {@link YED.Tilemap.Tileset Tilemap.Tileset}
     * @param {number} tileWidth Width of each tile
     * @param {number} tileHeight Height of each tile
     */
    var Layer = function() {
        this.initialize.apply(this, arguments);
    };

    // extends Sprite
    Layer.prototype = Object.create(Sprite.prototype);
    Layer.prototype.constructor = Layer;

    // initialize, inherited from Sprite
    Layer.prototype.initialize = function(data, tilesets, tileWidth, tileHeight) {
        Sprite.prototype.initialize.call(this);
        this.data     = data;
        this.tilesets = tilesets;
        this.tileWidth  = tileWidth;
        this.tileHeight = tileHeight;
        this._lastTiles = [];
        this._tilingSprite = null;
        this._animationFrames = [];
        if (!this.data.visible) {
            this.visible = false;
        }
    };

    Object.defineProperties(Layer.prototype, {
        /**
         * Layer data get from tilemap data
         *
         * @member {Object}
         * @memberof YED.Tilemap.Layer#
         */
        data: {
            get: function() {
                return this._data || null;
            },

            set: function(data) {
                this._data = data;
                this._setupData();
            }
        },

        gridHorz: {
            get: function() {
                return this._gridHorz || 0;
            },

            set: function(grid) {
                this._gridHorz = grid;
            }
        },

        gridVert: {
            get: function() {
                return this._gridVert || 0;
            },

            set: function(grid) {
                this._gridVert = grid;
            }
        },

        /**
         * Height of each tile in layer
         *
         * @member {number}
         * @memberof YED.Tilemap.Layer#
         */
        tileHeight: {
            get: function() {
                return this._tileHeight || 0;
            },

            set: function(height) {
                this._tileHeight = height;
            }
        },

        /**
         * Width of each tile in layer
         *
         * @member {number}
         * @memberof YED.Tilemap.Layer#
         */
        tileWidth: {
            get: function() {
                return this._tileWidth || 0;
            },

            set: function(width) {
                this._tileWidth = width;
            }
        },

        /**
         * Tiles data, an one dimensional array contains tile IDs
         *
         * @member {number[]}
         * @memberof YED.Tilemap.Layer#
         * @readonly
         */
        tilesData: {
            get: function() {
                return this.data.data;
            }
        },

        /**
         * Objects data, an one dimensional array contains object data
         *
         * @member {Object[]}
         * @memberof YED.Tilemap.Layer#
         * @readonly
         */
        objectsData: {
            get: function() {
                return this.data.objects;
            }
        },

        /**
         * Tilesets used for layer
         *
         * @member {YED.Tilemap.Tileset[]}
         * @memberof YED.Tilemap.Layer#
         */
        tilesets: {
            get: function() {
                return this._tilesets || [];
            },

            set: function(tilesets) {
                this._tilesets = tilesets;
            }
        },

        /**
         * Layer custom properties
         *
         * @member {Object}
         * @memberof YED.Tilemap.Layer#
         * @readonly
         */
        properties: {
            get: function() {
                return this.data.properties || {};
            }
        }
    });

    /**
     * Setup things after loaded data
     *
     * @private
     */
    Layer.prototype._setupData = function() {
        if (!!this.data) {
            this.gridHorz = this.data.width;
            this.gridVert = this.data.height;

        }
    };

    /**
     * Check if layer is tile-based layer
     *
     * @return {Boolean}
     */
    Layer.prototype.isTileLayer = function() {
        return this.data.type === 'tilelayer';
    };

    /**
     * Check if layer is object-based layer or tile-based layer
     *
     * @return {Boolean}
     */
    Layer.prototype.isObjectLayer = function() {
        return this.data.type === 'objectgroup';
    };

    /**
     * Check if layer is image-based layer
     *
     * @return {Boolean}
     */
    Layer.prototype.isImageLayer = function() {
        return this.data.type === 'imagelayer';
    };

    /**
     * Check if layer is plane layer
     *
     * @return {Boolean}
     */
    Layer.prototype.isPlaneLayer = function() {
        return this.isImageLayer()
            && !!this.properties
            && !!this.properties.parallax;
    };

    Layer.prototype.isLoopHorizontal = function() {
        return $gameMap.isLoopHorizontal();
    };

    Layer.prototype.isLoopVertical = function() {
        return $gameMap.isLoopVertical();
    };

    Layer.prototype.isLoop = function() {
        return this.isLoopHorizontal() || this.isLoopVertical();
    };

    Layer.prototype.isCollisionLayer = function() {
        return !!this.properties && !!this.properties.collision;
    };

    Layer.prototype.isRegionLayer = function() {
        return !!this.properties && !!this.properties.regionId;
    };

    Layer.prototype.isUpperLayer = function() {
        if (!!this.properties.layer) {
            return this.properties.layer.toLowerCase() === 'upper';
        }

        return false;
    };

    Layer.prototype.isAnimationlayer = function() {
        if (!!this.properties.animated) {
            return this.properties.animated.toLowerCase() === 'true';
        }

        return false;
    };

    /**
     * Render layer with given data and tilesets
     */
    Layer.prototype.renderLayer = function() {
        this._layerBitmap = this._layerBitmap
            || new Bitmap(this.gridHorz * this.tileWidth,
                this.gridVert * this.tileHeight);


        // don't render invisible layers.
        // LIQUIDIZE NOTE: Not sure if it was intended to enable and disabled layers being
        // visible on the fly, but assuming it wasn't why still render them?
        if (!this.visible) return;

        // different methods for tile-based and object-based layer
        if (this.isObjectLayer()) {
            this._renderObjectLayer();
        }

        if (this.isTileLayer() && !this.isAnimationlayer()) {
            this._renderTileLayer();
        }

        if (this.isImageLayer() && !this.isPlaneLayer()) {
            this._renderImageLayer();
        }

        if (this.isPlaneLayer()) {
            this._renderPlaneLayer();
        }
    };

    /**
     * Render tile-based layer
     *
     * @private
     */
    Layer.prototype._renderTileLayer = function() {
        var i = 0,
            length = this.tilesData.length, // tiles data iterator, fuck js
            tileId,
            bitmapX,
            bitmapY;

        for (; i < length; i++) {
            tileId  = this.tilesData[i];

            bitmapX = i % this._gridHorz;
            bitmapX = bitmapX * this.tileWidth;

            bitmapY = Math.floor(i / this._gridHorz);
            bitmapY = bitmapY * this.tileHeight;

            // skip tileId zero (none tile)
            if (tileId === 0) {
                continue;
            }

            this._drawTile(tileId, bitmapX, bitmapY);
        }

        if (this.isLoop) {
            this._renderLoopLayer();
        } else {
            this.bitmap = this._layerBitmap;
        }
    };

    /**
     * Render object-based layer
     *
     * @private
     */
    Layer.prototype._renderObjectLayer = function() {
        var i = 0,
            length = this.objectsData.length,
            tileId,
            bitmapX,
            bitmapY,
            data;

        for (; i < length; i++) {
            data = this.objectsData[i];

            tileId = data.gid;

            bitmapX = Math.round(data.x);
            bitmapY = Math.round(data.y - data.height);

            if (tileId === 0) {
                continue;
            }

            this._drawTile(tileId, bitmapX, bitmapY);
        }

        if (this.isLoop) {
            this._renderLoopLayer();
        } else {
            this.bitmap = this._layerBitmap;
        }
    };

    Layer.prototype._renderLoopLayer = function() {
        var tilingWidth,
            tilingHeight;

        tilingWidth = this.isLoopHorizontal() ?
            Graphics.width : this._layerBitmap.width;

        tilingHeight = this.isLoopVertical() ?
            Graphics.height : this._layerBitmap.height;

        this._tilingSprite = new TilingSprite(this._layerBitmap);
        this._tilingSprite.move(0, 0,
            tilingWidth, tilingHeight);
        this.addChild(this._tilingSprite);
    };



    /**
     * Render object-based layer
     *
     * @private
     */
    Layer.prototype._renderImageLayer = function() {
        var dest = this._layerBitmap,
            img  = ImageManager.loadParserParallax(this.data.image, 0);

        dest.blt(img, 0, 0, img.width, img.height, this.data.x, this.data.y);
        this.bitmap = this._layerBitmap;
    };

    /**
     * Render object-based layer
     *
     * @private
     */
    Layer.prototype._renderPlaneLayer = function() {
        var img = ImageManager.loadParserParallax(this.data.image, 0);

        this._tilingSprite = new TilingSprite(img);
        this._tilingSprite.move(this.data.x, this.data.y,
            Graphics.width, Graphics.height);
        this.addChild(this._tilingSprite);
    };

    /**
     * Get tileset which contains the drawing tile
     *
     * @param  {number} tileId Tile ID in layer data
     * @return {YED.Tilemap.Tileset|null} Tileset contains tile ID
     * @private
     */
    Layer.prototype._getTileset = function(tileId) {
        var i = 0,
            length = this.tilesets.length,
            tileset; // for tilesets iterator

        for (; i < length; i++) {
            tileset = this.tilesets[i];

            // skip current tileset if tileId is not in this tileset
            if (tileset.isInTileset(tileId) === false) {
                continue;
            }

            return tileset;
        } // end tilesets loop



        return null;


    };

    /**
     * Draw a tile on specific coordination
     *
     * @param  {number} tileId Tile ID in layer data
     * @param  {number} x Real X on bitmap
     * @param  {number} y Real Y on bitmap
     */
    Layer.prototype._drawTile = function(tileId, x, y) {
        var tileset = this._getTileset(tileId);
        var params  = tileset.getBlockTransferParams(tileId, x, y);
        var dest = this._layerBitmap;

        dest.blt.apply(dest,params);
    };

    /**
     * Draw an animation tile, changing the frame if needed.
     *
     * @param  {number} tileId Tile ID in layer data
     * @param  {number} dx Real X on bitmap
     * @param  {number} dy Real Y on bitmap
     * @param {number} lx grid x
     * @param {number} ly grid y
     */
    Layer.prototype._drawAnimationTile = function(tileId, dx, dy,lx,ly) {
        var tileset = this._getTileset(tileId);
        var lastframe = this._animationFrames[ly][lx];
        var tiledata = tileset.tiles[(tileId - tileset.firstId).toString()];
        if (tiledata) {
            if (tiledata["animation"]) {
                var frames = tiledata["animation"];
                var nextFrame = frames[lastframe + 1];
                if (this._frameUpdated) {
                    if (nextFrame) {
                        tileId = tileset.firstId + nextFrame.tileid;
                        this._writeLastAnimationFrame(lx,ly,lastframe + 1);
                    } else {
                        tileId = tileset.firstId + frames[0].tileid;
                        this._writeLastAnimationFrame(lx,ly,0);
                    }
                }
            }
        }
        var params  = tileset.getBlockTransferParams(tileId, dx, dy);
        var dest = this._layerBitmap;
        dest.blt.apply(dest,params);
    };


    Layer.prototype.update = function() {
        this._updatePlane();
    };

    Layer.prototype._updatePlane = function() {
        var xSpeed = parseInt(this.properties.planeX),
            ySpeed = parseInt(this.properties.planeY),
            ox,
            oy,
            mOx,
            mOy;

        if (!this._tilingSprite) {
            return;
        }

        ox = this._tilingSprite.origin.x;
        oy = this._tilingSprite.origin.y;

        mOx = this._tilingSprite.bitmap.width;
        mOy = this._tilingSprite.bitmap.height;

        if (!!xSpeed) {
            this._tilingSprite.origin.x = (ox + xSpeed) % mOx;
        }

        if (!!ySpeed) {
            this._tilingSprite.origin.y = (oy + ySpeed) % mOy;
        }
    };

    Layer.prototype.moveLoopLayer = function(x, y) {
        if (!this._tilingSprite) {
            return;
        }

        this._tilingSprite.origin.x = x;
        this._tilingSprite.origin.y = y;
    };

    /**
     * Reads the tile id at the specified X and Y coordinates.
     *
     * @param  {number} x column
     * @param  {number} y row
     */
    Layer.prototype._readMapTilesData = function(x,y) {
        if (this.tilesData) {
            var width = this.gridHorz;
            var height = this.gridVert;
            if (this.isLoopHorizontal()) {
                x = x.mod(width);
            }
            if (this.isLoopVertical()) {
                y = y.mod(height);
            }

            if (x >= 0 && x < width && y >= 0 && y < height) {
                return this.tilesData[width * y + x] || 0;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    };

    /**
     * Gets the last drawn frame of an animation tile
     * at the specified coordinates.
     *
     * @param  {number} x column
     * @param  {number} y row
     */
    Layer.prototype._readLastAnimationFrame = function(x,y) {
        var array1 = this._animationFrames;
        if (array1) {
            var array2 = array1[y];
            if (array2) {
                var frame = array2[x];
                if (frame) {
                    return frame;
                }
            }
        } else {
            return 0;
        }
    };

    /**
     * Writes the last drawn frame of the tile at the
     * specified coordinates.
     *
     * @param  {number} x column
     * @param  {number} y row
     * @param  {number} frame id
     */
    Layer.prototype._writeLastAnimationFrame = function(x,y,frame) {
        var array1 = this._animationFrames;
        if (!array1) {
            array1 = this._animationFrames = [];
        }
        var array2 = array1[y];
        if (!array2) {
            array2 = array1[y] = [];
        }
        array2[x] = frame;
    };

    /**
     * Gets the last tile drawn at the given
     * coordinates.
     *
     * @param  {number} x column
     * @param  {number} y row
     */
    Layer.prototype._readLastTile = function(x,y) {
        var array1 = this._lastTiles;
        if (array1) {
            var array2 = array1[y];
            if (array2) {
                var tile = array2[x];
                if (tile) {
                    return tile;
                }
            }
        } else {
            return 0;
        }
    };

    /**
     * Writes the last drawn tile at the given coordinates.
     *
     * @param  {number} x column
     * @param  {number} y row
     * @param {number} tileId id of the tile
     */
    Layer.prototype._writeLastTile = function(x,y,tileId) {
        var array1 = this._lastTiles;
        if (!array1) {
            array1 = this._lastTiles = [];
        }
        var array2 = array1[y];
        if (!array2) {
            array2 = array1[y] = [];
        }
        array2[x] = tileId;
    };


    /**
     * Clears this layers bitmap at the given rect.
     *
     * @param  {number} x  real X on bitmap
     * @param  {number} y  real y on bitmap
     * @param {number} width the width to clear
     * @param {number} height the height to clear
     */
    Layer.prototype.clearRect = function(x,y,width,height) {
        this._layerBitmap.clearRect(x,y,width,height);
    };


    /**
     * Updates the bitmap of this layer.
     *
     */
    Layer.prototype.updateBitmaps = function() {
            this.bitmap = this._layerBitmap;
    };

    /**
     * Paints animation tiles at the given coordinates
     * using the given animationCount to specify the frame.
     *
     */
    Layer.prototype.paintTiles = function(startX,startY,x,y,animationCount) {

        // Dont render invisible layers
        if (!this.visible) return;

        var layerWidth = this._tileWidth * this.gridHorz;
        var layerHeight = this._tileHeight * this.gridVert;
        var mx = startX + x;
        var my = startY + y;
        var dx = (mx * this._tileWidth).mod(layerWidth);
        var dy = (my * this._tileHeight).mod(layerHeight);
        var lx = dx / this._tileWidth;
        var ly = dy / this._tileHeight;

        var tile = this._readMapTilesData(mx,my);

        if (tile <= 0) return;

        var lastTile = this._readLastTile(lx,ly);
        var count = 1000 + animationCount - my;
        if (tile != lastTile) { this._writeLastAnimationFrame(lx,ly,0); }

        var frameUpdated = (count % 30 === 0);
        this._animationFrame = Math.floor(count / 30);
        this._frameUpdated = frameUpdated;

        if (tile != lastTile || frameUpdated) {
            this._layerBitmap.clearRect(dx,dy,this._tileWidth,this._tileHeight);
            if (tile > 0) {
                this._drawAnimationTile(tile,dx,dy,lx,ly);
            }
            this._writeLastTile(lx,ly,tile);
        }
    };


    YED.Tilemap.Layer = Layer;
}());

/* globals YED: false */

(function() {
    // Shorten dependencies
    var Data = YED.Tilemap.Data,
        Tileset = YED.Tilemap.Tileset,
        Layer = YED.Tilemap.Layer;

    /**
     * The Core object is the bootstrap to load and render tilemap to the screen
     *
     * A tilemap can be created inside a scene with a single statement
     *
     * ```js
     * var tilemap = new YED.Tilemap.Core();
     * this.addChild(tilemap); // add tilemap to scene
     * ```
     *
     * @class
     * @extends PIXI.DisplayObjectContainer
     * @memberof YED.Tilemap
     */
    var Core = function() {
        PIXI.DisplayObjectContainer.call(this);

        this.setup();
    };

    Core.dataMap = null;
    Core.noMap = false;
    Core.singleton = null;

    Core.loadMapFile = function() {
        var filePath = Core.getFilePath();
        Core.loadFile(filePath);
    };

    Core.unloadMap = function() {
        Core.dataMap = null;
        Core.noMap = false;
    };

    Core.loadFile = function(filePath) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath);
        xhr.overrideMimeType('application/json');

        // on success callback
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.responseText !== "") {
                    Core.dataMap = JSON.parse(xhr.responseText);
                } else {
                    // Core.noMap = true;
                    throw new Error('[YED#Tilemap] Loading error');
                }
            }
        };

        // set data to null and send request
        Core.unloadMap();
        xhr.send();
    };

    /**
     * Get file path with filename to the json file for automatically loading
     *
     * @return {string} The path and filename to json file
     * @private
     */
    Core.getFilePath = function() {
        return Core.getPath() + Core.getFilename();
    };

    /**
     * Get path to json file
     *
     * @return {string} The path to json file
     * @private
     */
    Core.getPath = function() {
        return './maps/';
    };

    /**
     * Get json filename
     *
     * @return {string} Filename
     * @private
     */
    Core.getFilename = function() {
        var id = Core.getMapId();
        return 'Map' + id + '.json';
    };

    /**
     * Get map ID from RMMV framework for search json file
     *
     * @return {number} Map ID
     * @private
     */
    Core.getMapId = function() {
        var isTransferring = $gamePlayer.isTransferring();
        return isTransferring ? $gamePlayer.newMapId() : $gameMap.mapId();
    };

    Core.isMapLoaded = function() {
        return !!Core.dataMap || !!Core.noMap;
    };

    Core.isDefaultMap = function() {
        return !Core.dataMap && !!Core.noMap;
    };

    Core.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    Core.prototype.constructor = Core;

    Object.defineProperties(Core.prototype, {
        data: {
            get: function() {
                return this._data || null;
            },

            set: function(data) {
                this._data = data;
            }
        },

        tilesets: {
            get: function() {
                return this._tilesets || [];
            },

            set: function(tilesets) {
                this._tilesets = tilesets;
            }
        },

        layers: {
            get: function() {
                return this.lowerLayers.concat(this.upperLayers);
            }
        },

        upperLayers: {
            get: function() {
                return this._upperLayers;
            }
        },

        lowerLayers: {
            get: function() {
                return this._lowerLayers;
            }
        },

        animationLayer: {
            get: function() {
                return this._animationLayer;
            }
        }

    });

    Core.prototype.setup = function() {
        this._clearData();
        this._setupData();
        this._setupLayers();
        this._setupTilesets();
        this._setupParallaxes();
    };

    Core.prototype._clearData = function() {
        this._data = null;
        this._tilesets = [];
        this._needRefresh = false;
        this._upperLayers = [];
        this._lowerLayers = [];
        this._animationLayer = null;
        this.z = -1;
    };

    Core.prototype._setupData = function() {
        this.data = new Data(Core.dataMap);
    };

    Core.prototype._setupTilesets = function() {
        var tilesetsData = this.data.tilesets,
            i = 0,
            length = tilesetsData.length,
            data;

        for (; i < length; i++) {
            data = tilesetsData[i];
            this.tilesets.push(new Tileset(data));
        }
    };

    Core.prototype._setupParallaxes = function() {
        var imageData = this.data.getImageLayers(),
            i = 0,
            length = imageData.length;

        for (; i < length; i++) {
            ImageManager.loadParserParallax(imageData[i].image, 0);
        }
    };

    Core.prototype._setupLayers = function() {
        var layersData = this.data.layers,
            i = 0,
            length = layersData.length,
            data,
            layer;

        for (; i < length; i++) {
            data = layersData[i];
            layer = new Layer(data, this.tilesets,
                            this.data.tileWidth, this.data.tileHeight);

            if (layer.isUpperLayer()) {
                this.upperLayers.push(layer);
            } else {
                this.lowerLayers.push(layer);
            }

            if (layer.isAnimationlayer() && this._animationLayer == null) {
                this._animationLayer = layer;
            }

            // this.addChild(layer);
            // this.layers.push(layer);
        }
    };

    Core.prototype.update = function() {
        this._updateRender();
    };

    Core.prototype._updateRender = function() {
        if (this._needRefresh && ImageManager.isReady()) {
            this.render();
            this._needRefresh = false;
        }
    };

    Core.prototype.render = function() {
        var layers = this.layers,
            i = 0,
            length = layers.length,
            layer;

        for (; i < length; i++) {
            layer = layers[i];
            layer.renderLayer();
        }
    };

    Core.prototype.refresh = function() {
        this._needRefresh = true;
    };

    /**
     * Check if map data exists
     *
     * @return {Boolean} Exist flag
     */
    Core.prototype.isExist = function() {
        return this.data.isExist();
    };



    YED.Tilemap.Core = Core;
}());

/* globals YED: false */

(function() {

    var _DataManager_loadMapData = DataManager.loadMapData;
    var _DataManager_isMapLoaded = DataManager.isMapLoaded;
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    var _Game_Map_setup = Game_Map.prototype.setup;
    var _Game_Map_tileWidth = Game_Map.prototype.tileWidth;
    var _Game_Map_tileHeight = Game_Map.prototype.tileHeight;
    var _Game_Map_width = Game_Map.prototype.width;
    var _Game_Map_height = Game_Map.prototype.height;
    var _Game_Event_setupPage = Game_Event.prototype.setupPage;
    var _Game_CharacterBase_distancePerFrame
        = Game_CharacterBase.prototype.distancePerFrame;
    var _Spriteset_Map_createTilemap
        = Spriteset_Map.prototype.createTilemap;

    DataManager.loadMapData = function(mapId) {
        _DataManager_loadMapData.call(this, mapId);

        this.loadYEDMapData(mapId);
    };

    DataManager.loadYEDMapData = function(mapId) {
        if (mapId > 0) {
            YED.Tilemap.Core.loadMapFile();
        } else {
            YED.Tilemap.Core.unloadMap();
        }
    };

    DataManager.isMapLoaded = function() {
        var defaultLoaded = _DataManager_isMapLoaded.call(this);
        var yedTilemapLoaded = YED.Tilemap.Core.isMapLoaded();

        return defaultLoaded && yedTilemapLoaded;
    };

    Scene_Map.prototype.onMapLoaded = function() {
        $gameMap.setupYEDTilemap();

        _Scene_Map_onMapLoaded.call(this);
    };

    Game_Map.prototype.setup = function(mapId) {
        this.setupYEDTilemap();

        _Game_Map_setup.call(this, mapId);
    };

    Game_Map.prototype.setupYEDTilemap = function() {
        // this._yed_tilemap = new YED.Tilemap.Core();
        YED.Tilemap.Core.singleton
            = YED.Tilemap.Core.singleton || new YED.Tilemap.Core();

        YED.Tilemap.Core.singleton.setup();

        // overwrite dataMap width/height
        $dataMap.width = this._yedTilemapData().width;
        $dataMap.height = this._yedTilemapData().height;
    };

    Game_Map.prototype._yedTilemapData = function() {
        return YED.Tilemap.Core.singleton.data;
    };

    Game_Map.prototype.oldTileWidth = function() {
        return _Game_Map_tileWidth.call(this);
    };

    Game_Map.prototype.oldTileHeight = function() {
        return _Game_Map_tileHeight.call(this);
    };

    Game_Map.prototype.oldWidth = function() {
        return _Game_Map_width.call(this);
    };

    Game_Map.prototype.oldHeight = function() {
        return _Game_Map_height.call(this);
    };

    Game_Map.prototype.tileWidth = function() {
        return this._yedTilemapData().tileWidth;
    };

    Game_Map.prototype.tileHeight = function() {
        return this._yedTilemapData().tileHeight;
    };

    Game_Map.prototype.width = function() {
        return this._yedTilemapData().width;
    };

    Game_Map.prototype.height = function() {
        return this._yedTilemapData().height;
    };

    Game_Map.prototype.defaultMapX = function() {
        return this._yedTilemapData().properties.defaultMapX || 0;
    };

    Game_Map.prototype.defaultMapY = function() {
        return this._yedTilemapData().properties.defaultMapY || 0;
    };

    Game_Map.prototype.tilemapUpperLayers = function() {
        return YED.Tilemap.Core.singleton.upperLayers;
    };

    Game_Map.prototype.tilemapLowerLayers = function() {
        return YED.Tilemap.Core.singleton.lowerLayers;
    };

    Game_Map.prototype.tilemapRefresh = function() {
        YED.Tilemap.Core.singleton.refresh();
    };

    Game_Map.prototype.isPassable = function(x, y, d) {
        var collision = this._yedTilemapData().collision,
            arrows = this._yedTilemapData().arrows,
            index = this.width() * y + x;

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

        return collision[index] === 0;
    };

    Game_Map.prototype.regionId = function(x, y) {
        var regions = this._yedTilemapData().region,
            index = this.width() * y + x;

        return regions[index];
    };

    Game_CharacterBase.prototype.distancePerFrame = function() {
        var distance = _Game_CharacterBase_distancePerFrame.call(this);
        return distance * (48 / $gameMap.tileWidth());
    };

    Game_Event.prototype.setupPage = function() {
        this.setupInitPosition();

        _Game_Event_setupPage.call(this);
    };

    Game_Event.prototype.setupInitPosition = function() {
        var list,
            tag  = /<position:[ ]*(\d+),[ ]*(\d+)>/i,
            command,
            comment,
            matches,
            x,y;

        if (!this.page()) {
            return;
        }

        list = this.list();

        for (var i = 0; i < list.length; i++) {
            command = list[i];

            if (command.code !== 108) {
                continue;
            }

            comment = command.parameters[0];
            matches = comment.match(tag);
            if (matches) {
                x = parseInt(matches[1]);
                y = parseInt(matches[2]);
                this.setPosition(x, y);
            }
        }
    };

    Spriteset_Map.prototype.createTilemap = function() {
        _Spriteset_Map_createTilemap.call(this);
      //  this._tilemap.tileWidth = $gameMap.oldTileWidth();
       // this._tilemap.tileHeight = $gameMap.oldTileHeight();
        this._tilemap.setData($gameMap.oldWidth(), $gameMap.oldHeight(), $gameMap.data());
    };

    Tilemap.prototype.refresh = function() {
        this._needsRepaint = true; // no need to draw default tiles
        this._lastTiles.length = 0;
        $gameMap.tilemapRefresh();
    };

    Tilemap.prototype._createLayers = function() {
        var margin = this._margin,
            upperLayers = $gameMap.tilemapUpperLayers(),
            lowerLayers = $gameMap.tilemapLowerLayers(),
            tileCols = Math.ceil(this._width / this._tileWidth) + 1,
            tileRows = Math.ceil(this._height / this._tileHeight) + 1,
            layerWidth = tileCols * this._tileWidth,
            layerHeight = tileRows * this._tileHeight,
            i;

        this._lowerBitmap = new Bitmap(layerWidth, layerHeight);
        this._upperBitmap = new Bitmap(layerWidth, layerHeight);

        this._layerWidth = layerWidth;
        this._layerHeight = layerHeight;

        /*
         * Z coordinate:
         *
         * 0 : Lower tiles
         * 1 : Lower characters
         * 3 : Normal characters
         * 4 : Upper tiles
         * 5 : Upper characters
         * 6 : Airship shadow
         * 7 : Balloon
         * 8 : Animation
         * 9 : Destination
         */

        this._lowerLayer = new Sprite();
        this._lowerLayer.move(-margin, -margin, this._width, this._height);
        this._lowerLayer.z = 0;

        this._upperLayer = new Sprite();
        this._upperLayer.move(-margin, -margin, this._width, this._height);
        this._upperLayer.z = 4;

        for (i = 0; i < lowerLayers.length; i++) {
            this._lowerLayer.addChild(lowerLayers[i]);
        }

        for (i = 0; i < upperLayers.length; i++) {
            this._upperLayer.addChild(upperLayers[i]);
        }

        this.addChild(this._lowerLayer);
        this.addChild(this._upperLayer);
        this.addChild(YED.Tilemap.Core.singleton);
    };

    Tilemap.prototype._updateLayerPositions = function(startX, startY) {
        /* jshint unused:vars */
        var m = this._margin,
            ox = Math.floor(this.origin.x),
            oy = Math.floor(this.origin.y),
            x2 = -(ox - m),
            y2 = -(oy - m);

        // TODO: Loop map!!!

        var moveFunc = function(layer) {
            if (!layer.isPlaneLayer()
                && !layer.isLoopVertical()
                && !layer.isLoopHorizontal()) {
                layer.move(x2, y2);
            }

            if (!layer.isPlaneLayer()
                && layer.isLoopVertical()
                && layer.isLoopHorizontal()) {
                layer.move(m, m);
                layer.moveLoopLayer(ox, oy);
                return;
            }

            if (!layer.isPlaneLayer()
                && layer.isLoopHorizontal()) {
                layer.move(m, y2);
                layer.moveLoopLayer(ox, 0);
                return;
            }

            if (!layer.isPlaneLayer()
                && layer.isLoopVertical()) {
                layer.move(x2, m);
                layer.moveLoopLayer(0, oy);
                return;
            }

            if (layer.isPlaneLayer()) {
                layer.move(m, m);
            }
        };

        for (var i = 0; i < 2; i++) {
            var children;

            if (i === 0) {
                children = this._lowerLayer.children;
            } else {
                children = this._upperLayer.children;
            }

            children.forEach(moveFunc);
        }

        // this._updateDefaultLayerPositions(startX, startY);
    };


    /**
     * @method updateTransform
     * @private
     */
    Tilemap.prototype.updateTransform = function() {
        var ox = Math.floor(this.origin.x);
        var oy = Math.floor(this.origin.y);
        var startX = Math.floor((ox - this._margin) / this._tileWidth);
        var startY = Math.floor((oy - this._margin) / this._tileHeight);
        this._updateLayerPositions(startX, startY);
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._paintAllTiles(startX, startY);
        this._needsRepaint = false;
        this._sortChildren();
        PIXI.DisplayObjectContainer.prototype.updateTransform.call(this);
    };

    /**
     * @method _paintAllTiles
     * @param {Number} startX
     * @param {Number} startY
     * @private
     */
    Tilemap.prototype._paintAllTiles = function(startX, startY) {
        if (!YED.Tilemap.Core.singleton.animationLayer) return;
        var tileCols = Math.ceil(this._width / this._tileWidth) + 1;
        var tileRows = Math.ceil(this._height / this._tileHeight) + 1;
        for (var y = 0; y < tileRows; y++) {
            for (var x = 0; x < tileCols; x++) {
                YED.Tilemap.Core.singleton.animationLayer.paintTiles(startX,startY,x,y,this.animationCount);
            }
        }
        YED.Tilemap.Core.singleton.animationLayer.updateBitmaps();
    };

}());
