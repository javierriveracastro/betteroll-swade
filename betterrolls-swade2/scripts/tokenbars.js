/**
/ Created by @rwanoux and the incredible Torg system team.
 **/
/* global canvas, Token, PIXI */

export function modifyTokenBars() {

    Token.prototype._drawBar = function (number, bar, data) {
        const val = Number(data.value);
        // noinspection JSUnresolvedFunction
        const pct = Math.clamped(val, 0, data.max) / data.max;
        let h = Math.max((canvas.dimensions.size / 12), 8);
        if (this.data.height >= 2) {
            h *= 1.6  // Enlarge the bar for large tokens
        }
        // Draw the bar
        let color = [pct, 0.8 * (1 - pct), 0]
        bar.clear()
            .beginFill(0x005500, 0)
            .lineStyle(3, 0x000000, 1);
        // each max draw a green rectangle in background
        for (let index = 0; index < data.max; index++) {
            bar.drawRect(index * (this.w / data.max), 0, (this.w / data.max), h);
        }
        // each actual value draw a rectangle from dark green to red
        bar.beginFill(PIXI.utils.rgb2hex(color), 0.8)
            .lineStyle(1, 0x000000, 1)
        for (let index = 0; index < Math.clamped(val, 0, data.max); index++) {
            bar.drawRect(index * (this.w / data.max), 0, (this.w / data.max), h);
        }
        // Set position
        let posY = number === 0 ? this.h - h : 0;
        bar.position.set(0, posY);
    }
}