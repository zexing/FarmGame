import { v3, Vec3 } from 'cc';
import { MapConst } from '../../const/GameDefine';
// ⚠️ 注意：这里引入你存放 CELL_WIDTH 和 CELL_HEIGHT 的常量文件

export class IsoUtils {
    
    /**
     * 🌟 逻辑网格坐标 -> 屏幕绝对坐标
     * 将你在 GroundGridCtrl 里的神圣转换公式剪切到这里
     */
    public static isoToScreen(row: number, col: number): Vec3 {
        const x = (col - row) * (MapConst.CELL_WIDTH / 2);
        const y = -(col + row) * (MapConst.CELL_HEIGHT / 2);
        return v3(x, y, 0);
    }

    /**
     * 🌟 屏幕绝对坐标 -> 逻辑网格坐标
     * 将你用来做“前瞻探测器”和鼠标点击的逆向公式剪切到这里
     */
    public static screenToIso(x: number, y: number): { row: number, col: number } {
        const col = Math.floor((x / (MapConst.CELL_WIDTH / 2) - y / (MapConst.CELL_HEIGHT / 2)) / 2);
        const row = Math.floor((-x / (MapConst.CELL_WIDTH / 2) - y / (MapConst.CELL_HEIGHT / 2)) / 2);
        return { row, col };
    }
}