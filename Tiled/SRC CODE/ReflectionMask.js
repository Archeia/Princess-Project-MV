export const newRectMask = (mapWidth, mapHeight, layerData) => {
    const maskRect = new PIXI.Graphics();
    const obj = layerData.objects[0];
    maskRect.beginFill(0xffffff);
    maskRect.drawRect(0, 0, obj.width, obj.height);
    maskRect.endFill();

    const maskTexture = PIXI.RenderTexture.create(mapWidth, mapHeight);
    const maskSprite = new PIXI.Sprite(maskTexture);
    maskRect.position.set(obj.x, obj.y);
    Graphics._renderer.render(maskRect, maskTexture, false, null, false);

    return maskSprite;
}