/*:
 * NOTE: This code is a direct conversion from the VXA ruby fix found here: https://pastebin.com/XDd0tVWJ
 *
 * @plugindesc Fixes Event Jitter / Display Rounding Error.
 * @author Dan "Liquidize" Deptula
 *
 * @help This plugin does not provide plugin commands.
 * When certain slow display panning speeds are used, events will improperly
 * round floating values to determine their position on screen. This causes
 * them to appear off from the tilemap by a single pixel. Though minor this is
 * noticable. This snippet fixes this behaviour.
 *
 * @param Tile Size
 * @desc The size of map tiles.
 * Default: 48
 * @default 48
 *
 */

var Liquidize = Liquidize || {};
Liquidize.JitterFix = {};
Liquidize.JitterFix.Parameters = PluginManager.parameters('JitterFix');
Liquidize.JitterFix.TileSize = Number(Liquidize.JitterFix.Parameters["Tile Size"]) || 48;

Game_Map.prototype.displayX = function() {
    return Math.floor(this._displayX * Liquidize.JitterFix.TileSize) / Liquidize.JitterFix.TileSize;
};

Game_Map.prototype.displayY = function() {
    return Math.floor(this._displayY * Liquidize.JitterFix.TileSize) / Liquidize.JitterFix.TileSize;
};

Game_Map.prototype.adjustX = function(x) {
    if (this.isLoopHorizontal() &&  x < (this.displayX() - (this.width() -  Liquidize.JitterFix.TileSize) / 2)) {
        x -= this.displayX() + this.width();
    } else {
        x -= this.displayX();
    }
    return x;
};

Game_Map.prototype.adjustY = function(y) {
    if (this.isLoopVertical() && y < (this.displayY() - (this.height() - Liquidize.JitterFix.TileSize) / 2)) {
        y -= this.displayY() + this.height();
    } else {
        y -= this.displayY();
    }
    return y;
};