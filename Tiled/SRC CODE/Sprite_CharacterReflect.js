export class Sprite_CharacterReflect extends Sprite_Character {
    initMembers() {
        super.initMembers();
        this.visible = false;
        this.reflectMaskList = [];
    }

    update() {
        super.update();
        this.updateReflect();
    }

    updateReflect() {
        this.visible = this._character.reflections.length > 0;
        const reflection = this._character.reflections[0];
        if (!reflection) {
            return;
        }
        this.scale.y = reflection.reflectionCast > 0 ? -1 : 1;
        this.opacity = reflection.reflectionOpacity || 255;

        if (!reflection.reflectionMask) {
            return;
        }
        const mask = this.reflectMaskList.find(mask => mask.maskId === reflection.reflectionMask);
        if (mask) {
            this.mask = mask;
        }
    }

    updatePosition() {
        const reflection = this._character.reflections[0];
        this.x = this._character.screenX();
        this.y = this._character.screenY();
        this.z = this._character.screenZ();
        if (!reflection) {
            return;
        }
        this.y += $gameMap.tileHeight() * reflection.reflectionCast;
        if (reflection.reflectionCast > 0) {
            this.y -= $gameMap.tileHeight();
        }
        this.y += reflection.reflectionOffset;
    }
}