const _initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function () {
    _initMembers.call(this);
    this.reflections = [];
};

Game_CharacterBase.prototype.screenZ = function () {
    let pluginParams = PluginManager.parameters("YED_Tiled");
    if (this._priorityType == 0) {
        return parseInt(pluginParams["Z - Below Player"]);
    }
    if (this._priorityType == 2) {
        return parseInt(pluginParams["Z - Above Player"]);
    }
    return parseInt(pluginParams["Z - Player"]);
};

let _distancePerFrame = Game_CharacterBase.prototype.distancePerFrame;
Game_CharacterBase.prototype.distancePerFrame = function () {
    let distance = _distancePerFrame.call(this);
    return distance * (48 / Math.min($gameMap.tileWidth(), $gameMap.tileHeight()));
};

let _update = Game_CharacterBase.prototype.update;
Game_CharacterBase.prototype.update = function() {
    _update.call(this);
    this.updateReflection();
};

Game_CharacterBase.prototype.updateReflection = function() {
    if (!$gameMap.isOnReflection(this)) {
        this.reflections = [];
        return;
    }
    this.reflections = $gameMap.getReflections(this);
};