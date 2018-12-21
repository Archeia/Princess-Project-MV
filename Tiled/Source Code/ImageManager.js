ImageManager.loadParserTileset = function (path, hue) {
    if (!path) {
        return this.loadEmptyBitmap();
    }
    let paths = path.split("/");
    let filename = paths[paths.length - 1];
    let realPath = "img/tilesets/" + filename;

    return this.loadNormalBitmap(realPath, hue);
};

ImageManager.loadParserParallax = function (path, hue) {
    if (!path) {
        return this.loadEmptyBitmap();
    }
    let paths = path.split("/");
    let filename = paths[paths.length - 1];
    let realPath = "img/parallaxes/" + filename;

    return this.loadNormalBitmap(realPath, hue);
};