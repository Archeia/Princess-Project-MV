/*=============================================================================
 * Anima - Tile Map Extensions
 * By Liquidize - htp://anima.mintkit.lol
 * Anima_Tilemap_Ext.js
 * Version: 1.00
 *
 *=============================================================================*/
/*:
 * @plugindesc Plugin Description <Anima_Tilemap_Ext>
 * @author Liquidize
 *
 * @help
 * This is a plugin extension that extends upon YED_Tilemap to add additional
 * features.
 *
 * Currently it supports allowing the user to draw their regions in TileD like
 * you would in the MV Editor. More features if requested will be added at
 * a later date.
 *
 * Drawing the region in TileD is simple. First create a layer called Regions
 * then you can either use a pre-existing tileset, or create your own, either way
 * the tileset must be called "Regions". After that, just draw. The region ID will
 * be the Tile ID of that tileset.
 *
 *
 * ============================================================================
 * Change Log
 * ============================================================================
 *
 * Version 1.0:
 *            - Finished Script!
 *
 *=============================================================================*/
var Imported = Imported || {};
var Anima = Anima || {};
Anima.TilemapExt = Anima.TilemapExt || {};
Anima.Utils = Anima.Utils || {};
(function ($) {
    "use strict";

    var parameters = $plugins.filter(function (plugin) {
        return plugin.description.contains('<Anima_Tilemap_Ext>');
    });
    if (parameters.length === 0) {
        throw new Error("Couldn't find the parameters of Anima_Tilemap_Ext.");
    }

    $.Parameters = parameters[0].parameters;
    $.Param = {};

    //============================================================================
    // Game_Map
    //============================================================================

    Game_Map.prototype.getRegionInfo = function(x,y) {
        var index = this.width() * y + x;
        var layer = this.getRegionLayer();
        var tileid = layer.data[index];
        if (tileid === 0) return 0;

        var tilesets = this._yedTilemapData().tilesets;
        var tilesetindex = 0;
        var tilesetcount = 0;
        for (var i = 0; i < tilesets.length; i++) {
            if (tilesets[i].name === "Regions") {
                tilesetindex = i;
                break;
            } else {
                tilesetcount += tilesets[i].tilecount;
            }
        }
        return tileid - (tilesetcount + 1);

    };

    Game_Map.prototype.getRegionLayer = function() {
      var tiledata = this._yedTilemapData().data;
      var layers = tiledata.layers;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].name === "Regions") {
                return layers[i];
            }
        }
        return null;
    };

    Game_Map.prototype.regionId = function(x,y) {
        return this.getRegionInfo(x,y);
    };

    //============================================================================
    // Game_Interpreter
    //============================================================================


    // Plugin Commands for testing...
    var Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        var cmd = command.toLowerCase();
        if (cmd === "liquid_regionid") {
            console.warn($gameMap.regionId(parseInt(args[0]),parseInt(args[1])));
        } else {
            Game_Interpreter_pluginCommand.call(this,command,args);
        }
    };

    //================================================================================
    // UTILS
    //================================================================================

    // Special formatting, to add string formatting similar to C#'s.
    Anima.Utils.sformat = function () {
        var theString = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
            theString = theString.replace(regEx, arguments[i]);
        }

        return theString;
    };


})(Anima.TilemapExt);

TilemapExt = Anima.TilemapExt;
Imported["Anima_TilemapExt"] = 1.00;