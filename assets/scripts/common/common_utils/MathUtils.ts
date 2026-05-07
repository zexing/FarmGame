import { Rect, v2, Vec2, Vec3 } from "cc";

const tempR1 = new Vec2();
const tempR2 = new Vec2();
const tempR3 = new Vec2();
const tempR4 = new Vec2();

export class MathUtils {
    /**
     * 取出数字中的某一位,从0开始
     */
    public static getValueAtBit(num, bit): number {
        return (num >> bit) & 1;
    }
    /**
     * 
     * @param from 
     * @param to 
     * @param ratio 
     * @returns 
     */
    public static lerp(from: number, to: number, ratio: number) {
        return from + (to - from) * ratio;
    }
    /**
     * 获取两点间距离
     * @param p1X
     * @param p1Y
     * @param p2X
     * @param p2Y
     * @returns {number}
     */
    public static getDistance(p1X: number, p1Y: number, p2X: number, p2Y: number): number {
        let disX: number = p2X - p1X;
        let disY: number = p2Y - p1Y;
        let disQ: number = disX * disX + disY * disY;
        return Math.sqrt(disQ);
    }
    /**
   * 获取两点间的角度
   * @param p1x 
   * @param p1y 
   * @param p2x 
   * @param p2y 
   */
    public static getDegree(p1X: number, p1Y: number, p2X: number, p2Y: number) {
        let angle: number = Math.atan2((p1Y - p2Y), (p1X - p2X));
        angle = angle * (180 / Math.PI) + 90;
        if (angle < 0) {
            angle += 360;
        }
        return Math.round(angle);
    }
    /** 弧度值转换为角度值 */

    public static get Rad2Deg(): number {
        return 360 / (Math.PI * 2);

    }
    /**
  * 获取两点间的角度
  * @param p1x 
  * @param p1y 
  * @param p2x 
  * @param p2y 
  */
    public static getAngle(p1X: number, p1Y: number, p2X: number, p2Y: number) {
        return Math.atan2(p2X - p1X, p2Y - p1Y) * (180 / Math.PI)
    }
    /**
     * 旋转V3
     * @param v3 
     * @param theta 
     */
    public static Vec3Rotate(v3: Vec3, theta: number): Vec3 {
        theta = theta * (Math.PI / 180);
        let newV3 = new Vec3();
        newV3.x = (v3.x) * Math.cos(theta) - (v3.y) * Math.sin(theta);
        newV3.y = (v3.x) * Math.sin(theta) + (v3.y) * Math.cos(theta);
        return newV3;
    }
    /**
     * 获取一个区间的随机数
     * @param $from 最小值
     * @param $end 最大值
     * @returns {number}
     */
    public static limit($from: number, $end: number): number {
        $from = Math.min($from, $end);
        $end = Math.max($from, $end);
        let range: number = $end - $from;
        return $from + Math.random() * range;
    }
    /**
     * 获取一个区间的随机整数
     * @param $from 最小值
     * @param $end 最大值
     * @returns {number}
     */
    public static limitCeil($from: number, $end: number): number {
        $from = Math.min($from, $end);
        $end = Math.max($from, $end);
        let range: number = $end - $from;
        return Math.round($from + Math.random() * range);
    }
    public static isTooClose(point, existingPoints, minDistance) {
        for (let p of existingPoints) {
            let dx = point.x - p.x;
            let dy = point.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                return true;
            }
        }
        return false;
    }
    public static generateNonOverlappingCircles(maxX, maxY, radius, numCircles) {
        // 创建一个数组来保存圆的中心位置  
        const circles = [];
        let start = true;

        // 确保有足够的空间来放置圆  
        if (numCircles * (radius * 2) > (maxX - 0) || numCircles * (radius * 2) > (maxY - 0)) {
            return [];
        }

        // 尝试放置指定数量的圆  
        while (circles.length < numCircles) {
            // 随机生成圆心的 x 和 y 坐标  
            let centerX = Math.random() * (maxX - 0 - radius * 2) + 0 + radius;
            let centerY = Math.random() * (maxY - 0 - radius * 2) + 0 + radius;

            // 检查新圆是否与已存在的圆重叠  
            let overlap = false;
            for (let i = 0; i < circles.length; i++) {
                const [existingCenterX, existingCenterY] = circles[i];
                // 使用距离公式检查两个圆心之间的距离是否小于两圆半径之和  
                if (Math.sqrt(Math.pow(centerX - existingCenterX, 2) + Math.pow(centerY - existingCenterY, 2)) < 2 * radius) {
                    overlap = true;
                    break;
                }
            }

            // 如果没有重叠，则添加新圆到数组中  
            if (!overlap) {
                circles.push([centerX, centerY]);
            }
        }

        // 返回包含圆心的数组  
        return circles;
    }

    /**
     * 在圆形内随机一个点
     * @param r 
     * @returns 
     */
    public static getRandomPointInCircle(r: number): Vec2 {
        var x = Math.random() * r * 2 - r;
        var y = Math.random() * r * 2 - r;
        let i = 0;
        while (i < 100) {
            i++;
            if (Math.sqrt(x * x + y * y) < r) {
                new Vec2(x, y);
            }
        }
        return new Vec2(x, y);
    }
    /**
     * 在圆形外随机一个点
     * @param r 
     * @returns 
     */
    public static getRandomPointInCircle2(r: number): Vec2 {
        var x = Math.random() * r * 2 - r;
        var y = Math.random() * r * 2 - r;
        let i = 0;
        while (i < 1000000) {
            i++;
            if (Math.sqrt(x * x + y * y) > r) {
                new Vec2(x, y);
            }
        }
        return new Vec2(x, y);
    }

    public static getRandomEntry<T>(obj: { [key: string]: T }): [string, T] | undefined {
        var keys = Object.keys(obj);
        if (keys.length === 0) {
            return undefined;
        }
        var randomKey = keys[Math.floor(Math.random() * keys.length)];
        return [randomKey, obj[randomKey]];
    }
    /**
     * 判断两个圆是否重叠
     * @param x1 
     * @param y1 
     * @param r1 
     * @param x2 
     * @param y2 
     * @param r2 
     */
    public static doCirclesOverlap(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
        // 计算两个圆心的距离  
        var distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

        // 如果两个圆心的距离小于两个半径的和，那么圆就重叠  
        return distance < r1 + r2;
    }
    /**
     * 判断一个点是否在圆内
     * @param x1 
     * @param y1 
     * @param r 
     * @param x2 
     * @param y2 
     * @returns 
     */
    public static isPointInCircle(x1: number, y1: number, r: number, x2: number, y2: number): boolean {
        // 计算距离  
        var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        // 判断是否在圆内  
        return d <= r;
    }
    /**
     * 判断一个点是否在一个多边形内
     * @param point 位置
     * @param polygon 多边形
     * @returns 
     */
    public static pointInPolygon(pointX: number, pointY: number, polygon: Array<Vec2>): boolean {
        let cross = 0;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].y > pointY) != (polygon[j].y > pointY)) &&
                (pointX < (polygon[j].x - polygon[i].x) * (pointY - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
                cross++;
            }
        }
        return cross % 2 === 1;
    }
    /**
     * 获取旋转偏移后的顶点位置
     * @param centerX 矩形中心点X
     * @param centerY 矩形中心点Y
     * @param rotation 旋转角度
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param offsetX 偏移X
     * @param offsetY 偏移Y
     * @param offsetAngle 偏移角度
     * @returns 
     */
    public static getPointInRotatedRect(centerX: number, centerY: number,
        rotation: number, width: number, height: number, offsetX: number, offsetY: number, offsetAngle: number = 0): Array<Vec2> {
        // 根据旋转角度，计算四个顶点的坐标  
        rotation = rotation * (Math.PI / 180);
        //左上角
        let topLeft = v2(
            centerX - width / 2 * Math.cos(rotation) - height / 2 * Math.sin(rotation),
            centerY - width / 2 * Math.sin(rotation) + height / 2 * Math.cos(rotation))
        //右上角
        let topRight = v2(
            centerX + width / 2 * Math.cos(rotation) - height / 2 * Math.sin(rotation),
            centerY + width / 2 * Math.sin(rotation) + height / 2 * Math.cos(rotation))
        let bottomLeft = v2(
            centerX - width / 2 * Math.cos(rotation) + height / 2 * Math.sin(rotation),
            centerY - width / 2 * Math.sin(rotation) - height / 2 * Math.cos(rotation))
        let bottomRight = v2(
            centerX + width / 2 * Math.cos(rotation) + height / 2 * Math.sin(rotation),
            centerY + width / 2 * Math.sin(rotation) - height / 2 * Math.cos(rotation))

        topLeft.x += offsetX;
        topLeft.y += offsetY;
        topRight.x += offsetX;
        topRight.y += offsetY;
        bottomLeft.x += offsetX;
        bottomLeft.y += offsetY;
        bottomRight.x += offsetX;
        bottomRight.y += offsetY;

        if (offsetAngle != 0) {
            let angle = offsetAngle * (Math.PI / 180);
            let rotateCenterX = (bottomRight.x + bottomLeft.x) / 2;
            let rotateCenterY = (bottomRight.y + bottomLeft.y) / 2;//取值都是bottom 所以是底部中心点
            let bottomCenter = v2(rotateCenterX, rotateCenterY);

            bottomLeft = MathUtils.rotatePoint(bottomLeft, bottomCenter, angle);
            bottomRight = MathUtils.rotatePoint(bottomRight, bottomCenter, angle);
            topLeft = MathUtils.rotatePoint(topLeft, bottomCenter, angle);
            topRight = MathUtils.rotatePoint(topRight, bottomCenter, angle);

        }

        return [topLeft, topRight, bottomRight, bottomLeft];

    }



    public static rotatePoint(point: Vec2, center: Vec2, angle: number): Vec2 {
        let dx = point.x - center.x;
        let dy = point.y - center.y;
        let newX = center.x + dx * Math.cos(angle) - dy * Math.sin(angle);
        let newY = center.y + dx * Math.sin(angle) + dy * Math.cos(angle);
        return v2(newX, newY);
    }




    /**
     * 判断一个点是否在扇形内
     * @param targetX 点
     * @param targetX 点
     * @param centerX 扇形中心点
     * @param centerY 扇形中心点
     * @param radius 半径
     * @param startAngle 扇形开始角度
     * @param endAngle 扇形结束角度
     */
    public static isPointInFan(targetX: number, targetY: number, centerX: number, centerY: number
        , radius: number, startAngle: number, endAngle: number) {
        // 计算点到中心的距离
        var dx = targetX - centerX;
        var dy = targetY - centerY;
        var distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离大于半径，则点不在扇形内
        if (distance > radius) return false;

        // 计算点的角度
        var angle = Math.atan2(dy, dx) * (180 / Math.PI); // 将弧度转换为度数
        // 角度归一化到0-360度
        if (angle < 0) angle += 360;
        if (startAngle < 0) startAngle += 360;
        if (endAngle < 0) endAngle += 360;

        // 检查角度是否在扇形的角度范围内
        if (startAngle <= endAngle) {
            // 扇形角度连续的情况
            return angle >= startAngle && angle <= endAngle;
        } else {
            // 扇形角度跨越360度的情况
            return angle >= startAngle || angle <= endAngle;
        }
        // // 转换角度为弧度  
        // const startRad = startAngle * (Math.PI / 180);
        // const endRad = endAngle * (Math.PI / 180);

        // // 计算点相对于扇形中心的向量  
        // let dx = targetX - centerX;
        // let dy = targetY - centerY;
        // // 计算点与中心点的距离  
        // const distance = Math.sqrt(dx * dx + dy * dy);
        // // 如果距离大于半径，点不在扇形内  
        // if (distance > radius) {
        //     // console.log("不在扇形内");
        //     return false;
        // } else {
        //     // return false;
        // }
        // // const vec = new Vec2(dx,dy); //v2Subtract(point, center);

        // let angleRad = -Math.atan2(dx, dy) * (180 / Math.PI);
        // // if (angleRad < 0){
        // //     angleRad=-angleRad;
        // // }



        // // 计算向量的角度  
        // // let  angleRad = -Math.atan2(vec.y, vec.x)///* (180 / Math.PI);
        // angleRad = angleRad * (Math.PI / 180);
        // // Math.atan2(p2X - p1X, p2Y - p1Y) * (180 / Math.PI)

        // // 判断角度是否在扇形范围内  
        // if (angleRad < startRad || angleRad > endRad) {
        //     // console.log("不在扇形内");
        //     return false;
        // }


        // // console.log("在扇形内");
        // return true;
        // 转换角度为弧度  
        // const startRad = startAngle * (Math.PI / 180);
        // const endRad = endAngle * (Math.PI / 180);

        // // 计算点相对于扇形中心的向量  
        // let dx = targetX ;
        // let dy = targetY - centerY;
        // const vec = new Vec2(dx,dy); //v2Subtract(point, center);

        // // 计算向量的角度  
        // const angleRad = Math.atan2(vec.y, vec.x);

        // // 判断角度是否在扇形范围内  
        // if (angleRad < startRad || angleRad > endRad) {
        //     console.log("不在扇形内");
        //     return false;
        // }

        // // 计算点与中心点的距离  
        // const distance = Math.sqrt(dx * dx + dy * dy);
        // // 如果距离大于半径，点不在扇形内  
        // if (distance > radius) {
        //     console.log("不在扇形内");
        //     return false;
        // } else {
        //     // return false;
        // }
        // console.log("在扇形内");
        // return true;
        // if (targetX == centerX && targetY == centerY) {
        //     // console.log("在扇形内");
        //     return true;
        // }

        // let dx = targetX ;
        // let dy = targetY - centerY;

        // if (startAngle < 0) {
        //     startAngle += 360;
        // }

        // if (endAngle < 0) {
        //     endAngle += 360;
        // }
        // let angle = -((Math.atan2(dx, dy) * (180 / Math.PI))) + 90;
        // // endAngle =endAngle-startAngle;
        // // angle = angle-startAngle;
        // // startAngle =0;

        // if (angle < 0) {
        //     angle += 360;
        // }

        // // 计算点与中心点的距离  
        // const distance = Math.sqrt(dx * dx + dy * dy);
        // // 如果距离大于半径，点不在扇形内  
        // if (distance > radius) {
        //     return false;
        // } else {
        //     // return false;
        // }
        // if (startAngle > endAngle) {
        //     // startAngle = 360-startAngle;
        //     endAngle = endAngle+startAngle;
        //     angle = angle+startAngle;
        //     if(angle>360){
        //         angle = angle-360;
        //     }
        //     startAngle = 0;
        // }
        // if (angle >= startAngle && angle <= endAngle) {
        //     return true;
        // } else {
        //     return false;
        // }
    }
    /**
  * @en Test line and rect
  * @zh 测试线段与矩形是否相交
  */
    public static lineRect(a1: Vec2, a2: Vec2, b: Rect): boolean {
        const r0 = tempR1.set(b.x, b.y);
        const r1 = tempR2.set(b.x, b.yMax);
        const r2 = tempR3.set(b.xMax, b.yMax);
        const r3 = tempR4.set(b.xMax, b.y);

        if (MathUtils.lineLine(a1, a2, r0, r1)) return true;

        if (MathUtils.lineLine(a1, a2, r1, r2)) return true;

        if (MathUtils.lineLine(a1, a2, r2, r3)) return true;

        if (MathUtils.lineLine(a1, a2, r3, r0)) return true;

        return false;
    }
    /**
     * @en Test line and line
     * @zh 测试线段与线段是否相交
     */
    public static lineLine(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
        // jshint camelcase:false

        const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
        const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
        const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

        if (u_b !== 0) {
            const ua = ua_t / u_b;
            const ub = ub_t / u_b;

            if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
                return true;
            }
        }

        return false;
    }

    public static calculateAngleBetweenPoints(startX, startY, endX, endY) {
        // 计算向量的差分
        const dx = endX - startX;
        const dy = endY - startY;

        // 使用反正切函数（atan2）来直接得到与水平轴的逆时针角度（弧度）
        const radians = Math.atan2(dy, dx);

        // 将弧度转换为角度（范围在-180到180度之间）
        const degrees = radians * 180 / Math.PI;

        // 通常我们希望角度范围在0到360度之间，所以可以进行适当调整
        let normalizedDegrees = ((degrees + 360) % 360) - 90;
        if (normalizedDegrees < 0) {
            normalizedDegrees += 360;
        }

        return normalizedDegrees;
    }

    public static calculateComponents(A: Vec2, B: Vec2, D: Vec2): Vec2 {
        // A, B, 和 D 都是包含两个元素的数组，分别表示x和y坐标  
        // 计算向量B-A  
        const deltaX = B.x - A.x;
        const deltaY = B.y - A.y;

        // 计算点积，这给出了B-A在D方向上的总“大小”  
        const dotProduct = deltaX * D.x + deltaY * D.y;

        // 计算B-A在D方向上的单位向量  
        const unitVector = [
            (deltaX * D.x + deltaY * D.y) / dotProduct,
            (deltaY * D.x - deltaX * D.y) / dotProduct
        ];

        // 返回在x和y方向上的分量  
        return new Vec2(unitVector[0] * dotProduct,
            unitVector[1] * dotProduct)
    }

    // public facingAngle(v3:Vec3):number{

    // }

    // public static subtractPoints(v1,v2){

    // }

    public static isXWithinPossibleCircleRange(x, h, r) {
        return h - r <= x && x <= h + r;
    }
}


