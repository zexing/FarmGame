/*******************************************************************************
 * 创建: 2025年09月28日
 * 作者: 水煮肉片饭(27185709@qq.com)
 * 描述: 贝塞尔曲线，支持N阶，例如：
 * new Tween(ratNode).bezierTo(2, new Vec2(130, 250), new Vec2(-90, -200), new Vec2(300, 0)).start();
*******************************************************************************/
import { Node, Tween, Vec2, lerp } from 'cc';
Reflect.defineProperty(Tween.prototype, 'bezierTo', {
    value: function (duration: number, ...points: Vec2[]): Tween<Node> {
        points.unshift(new Vec2(this._target._lpos.x, this._target._lpos.y));
        return this.to(duration, {}, {
            onUpdate: function (target: Node, ratio: number): void {
                for (var len = points.length, p = new Array(len), i = 0; i < len; p[i] = new Vec2(points[i++]));
                while (len-- > 1) { for (i = 0; i < len; p[i].set(lerp(p[i].x, p[i + 1].x, ratio), lerp(p[i].y, p[i++ + 1].y, ratio))); }
                target.setPosition(p[0].x, p[0].y);
            }
        });
    },
});
Reflect.defineProperty(Tween.prototype, 'bezierBy', {
    value: function (duration: number, ...points: Vec2[]): Tween<Node> {
        let pos = new Vec2(this._target._lpos);
        for (let len = points.length, i = 0; i < len; Vec2.add(points[i], points[i++], pos));
        return this.bezierTo(duration, ...points);
    },
});
declare module 'cc' {
    interface Tween<T> {
        /** 贝塞尔曲线移动，duration：持续时间，points：贝塞尔锚点数组 */
        bezierTo(duration: number, ...points: Vec2[]): Tween<Node>;
        /** 同上，唯一的区别：points是相对于初始位置的坐标 */
        bezierBy(duration: number, ...points: Vec2[]): Tween<Node>;
    }
}