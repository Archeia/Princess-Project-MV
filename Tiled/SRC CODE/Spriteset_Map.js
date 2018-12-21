import { TiledTilemap } from "./TiledTilemap";
import { newRectMask } from "./ReflectionMask";
import { Sprite_CharacterReflect } from './Sprite_CharacterReflect';

let _createTilemap = Spriteset_Map.prototype.createTilemap;
Spriteset_Map.prototype.createTilemap = function () {
    if (!$gameMap.isTiledMap()) {
        _createTilemap.call(this);
        return;
    }
    this._tilemap = new TiledTilemap($gameMap.tiledData);
    this._tilemap.horizontalWrap = $gameMap.isLoopHorizontal();
    this._tilemap.verticalWrap = $gameMap.isLoopVertical();
    this.loadTileset();
    this._baseSprite.addChild(this._tilemap);
    this._reflectSurfaceSprite = new Sprite();
    this.addChild(this._reflectSurfaceSprite);
    this.createReflectionMask();
};

let _loadTileset = Spriteset_Map.prototype.loadTileset;
Spriteset_Map.prototype.loadTileset = function () {
    if (!$gameMap.isTiledMap()) {
        _loadTileset.call(this);
        return;
    }

    let i = 0;
    for (let tileset of $gameMap.tiledData.tilesets) {
        this._tilemap.bitmaps[i] = ImageManager.loadParserTileset(tileset.image, 0);
        i++;
    }
    this._tilemap.refreshTileset();
    this._tileset = $gameMap.tiledData.tilesets;
};

let _update = Spriteset_Map.prototype.update;
Spriteset_Map.prototype.update = function () {
    _update.call(this);
    this._updateHideOnLevel();
    this._updateReflectSurface();
};

Spriteset_Map.prototype.updateTileset = function () {
    if (this._tileset !== $gameMap.tiledData.tilesets) {
        this.loadTileset();
    }
};

Spriteset_Map.prototype._updateHideOnLevel = function () {
    this._tilemap.hideOnLevel($gameMap.currentMapLevel);
};

const _isReflectSurface = (layerData) => {
    const properties = layerData.properties;
    return !!properties && properties.reflectionSurface;
};

Spriteset_Map.prototype.createReflectionMask = function () {
    const tiledData = $gameMap.tiledData;
    for (const layerData of tiledData.layers) {
        if (!_isReflectSurface(layerData)) {
            continue;
        }

        const mask = newRectMask(
            $gameMap.width() * $gameMap.tileWidth(),
            $gameMap.height() * $gameMap.tileHeight(),
            layerData,
        )

        // hax mask id
        mask.maskId = layerData.properties.reflectionSurface;

        this._reflectSurfaceSprite.addChild(mask);
    }
};

const _createCharacters = Spriteset_Map.prototype.createCharacters;
Spriteset_Map.prototype.createCharacters = function() {
    _createCharacters.call(this);

    $gameMap.events().forEach(function(event) {
        const sprite = new Sprite_CharacterReflect(event);
        this._characterSprites.push(sprite);
        this._tilemap.addChild(sprite);
    }, this);
    $gameMap.vehicles().forEach(function(vehicle) {
        const sprite = new Sprite_CharacterReflect(vehicle);
        this._characterSprites.push(sprite);
        this._tilemap.addChild(sprite);
    }, this);
    $gamePlayer.followers().reverseEach(function(follower) {
        const sprite = new Sprite_CharacterReflect(follower);
        this._characterSprites.push(sprite);
        this._tilemap.addChild(sprite);
    }, this);
    const sprite = new Sprite_CharacterReflect($gamePlayer);
    this._characterSprites.push(sprite);
    this._tilemap.addChild(sprite);

    for (const sprite of this._characterSprites) {
        sprite.reflectMaskList = this._reflectSurfaceSprite.children;
    }
};

Spriteset_Map.prototype._updateReflectSurface = function() {
    if (!this._reflectSurfaceSprite) {
        return;
    }
    this._reflectSurfaceSprite.x = -$gameMap.displayX() * $gameMap.tileWidth();
    this._reflectSurfaceSprite.y = -$gameMap.displayY() * $gameMap.tileHeight();
};