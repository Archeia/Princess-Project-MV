/*:
 * @plugindesc v1.00 Plugin to support a separate Tiled layer to be used for tile flags
 * such as counter, bush, ladder, etc.
 * 
 * @author Kentou
 *
 * @param Tileset Name
 * @desc The name of the tileset to be used as flags tileset.
 * Default: Tile_Flags_32x32
 * @default Tile_Flags_32x32
 * 
 * @help
 * Plugin to support a separate Tiled layer to be used for tile flags
 * such as counter, bush, ladder, etc. The Tiled layer needs to have a 
 * custom property "flags" set to true. On the flags tileset, each tile 
 * needs to have a custom property:
 * 
 * bush - Tile sets bush flag
 * ladder - Tile sets ladder flag
 * damage - Tile sets damage flag
 * counter - Tile sets counter flag
 */

//=============================================================================
// * Get Tiled Flags-Tileset (for Bush, Ladder, etc.)
//=============================================================================
Game_Map.prototype.flagsTileset = function() {
	if (Imported.YED_Tiled) {
		if (!this._flagsTileset) {
			var params = PluginManager.parameters('KEN_TiledFlagsLayer');
			for (var i = 0; i < this.tiledData.tilesets.length; i++) {
				if (this.tiledData.tilesets[i].name == (params["Tileset Name"] || "Tile_Flags_32x32")) {
					this._flagsTileset = this.tiledData.tilesets[i]; break;
				}				
			}
		}
		return this._flagsTileset;
	}
	else
		return null;
}

//=============================================================================
// * Gets configued FLags-Layer in Tiled. (Layer with flags property).
//=============================================================================
Game_Map.prototype.flagsLayer = function() {
    if (!this._flagsLayer) {        
        var layers = this.tiledData.layers;
        
        for(var i = 0; i < layers.length; i++) {
            if (layers[i].properties && layers[i].properties.flags) {
                this._flagsLayer = layers[i]; break;
            }
        }
    }

	return this._flagsLayer;
}

//=============================================================================
// * Check if a specific flag is set for a tile.
//=============================================================================
Game_Map.prototype.checkTileFlag = function(x, y, flag) {	
	var flags = this.flagsLayer();
	if (!flags) return false;
	var tileId = flags.data[y * $dataMap.width + x];
    var tileset = this.flagsTileset();
	var props = tileset.tileproperties[tileId - tileset.firstgid];
	
	if (props) {
		switch (flag) {
			case 0: return tileset.tileproperties[tileId - tileset.firstgid] && tileset.tileproperties[tileId - tileset.firstgid].counter;
			case 1: return tileset.tileproperties[tileId - tileset.firstgid] && tileset.tileproperties[tileId - tileset.firstgid].bush;
			case 2: return tileset.tileproperties[tileId - tileset.firstgid] && tileset.tileproperties[tileId - tileset.firstgid].ladder;
			case 3: return tileset.tileproperties[tileId - tileset.firstgid] && tileset.tileproperties[tileId - tileset.firstgid].damage;
		}	
	}
	else
	{
		return false;
	}
}

//=============================================================================
// * Determine if Counter
//=============================================================================
Game_Map.prototype.isCounter = function(x, y) {
    var flags = (this.checkLayeredTilesFlags(x, y, 0x80) || this.regionId(x, y) === AEL.TilesetPropertyRegions.counterRegion);
	if (Imported.YED_Tiled)
		return  this.isValid(x, y) && (this.checkTileFlag(x, y, 0) || flags);
	else 
		return this.isValid(x, y) && (flags);
};

//=============================================================================
// * Determine if Damage floor
//=============================================================================
Game_Map.prototype.isDamageFloor = function(x, y) {    
    var flags = (this.checkLayeredTilesFlags(x, y, 0x100) || this.regionId(x, y) === AEL.TilesetPropertyRegions.damageFloorRegion);
	if (Imported.YED_Tiled)
		return  this.isValid(x, y) && (this.checkTileFlag(x, y, 3) || flags);
	else 
		return this.isValid(x, y) && (flags);
};

//=============================================================================
// ** Game_Map
//-----------------------------------------------------------------------------
// The game object class for a map. It contains scrolling and passage
// determination functions.
//=============================================================================
// * Determine if Ladder
//=============================================================================
Game_Map.prototype.isLadder = function(x, y) {
    var flags = (this.checkLayeredTilesFlags(x, y, 0x20) || this.regionId(x, y) === AEL.TilesetPropertyRegions.ladderRegion);
    if (Imported.YED_Tiled)
		return  this.isValid(x, y) && (this.checkTileFlag(x, y, 2) || flags);
	else 
		return this.isValid(x, y) && (flags);
};

//=============================================================================
// * Determine if Bush
//=============================================================================
Game_Map.prototype.isBush = function(x, y) {
	if(Imported.YED_Tiled){ // Add Compatibility with Tiled
	  // Check if on Region
	  var onRegion = this._regions !== undefined && this.regionId(x, y) === AEL.TilesetPropertyRegions.bushRegion;
	  return this.isValid(x, y) && (this.checkTileFlag(x, y, 1) || this.checkLayeredTilesFlags(x, y, 0x40) || onRegion)
	} else {
		return this.isValid(x, y) && (this.checkLayeredTilesFlags(x, y, 0x40) || this.regionId(x, y) === AEL.TilesetPropertyRegions.bushRegion);
	}
};