import { Vec2, Vec3 } from 'cc';
import { ERoleDir } from './IRole';


export class DegreeUtils {
    /**
     * 🌟 将二维移动向量转换为 8 方向枚举
     * @param dirVec 标准化后的移动向量 (比如 joystick 的输出)
     */
    public static vecTo8Dir(dirVec: Vec3 | Vec2): ERoleDir {
        // 算出角度 (-PI 到 PI)
        let angle = Math.atan2(dirVec.y, dirVec.x);
        // 转成角度 (0 到 360)
        let degrees = angle * (180 / Math.PI);
        if (degrees < 0) degrees += 360;

        // 将 360 度切分成 8 份，每份 45 度 (偏移 22.5 度以完美对齐扇区)
        // 这里的映射需要跟你 ERoleDir 的定义顺序匹配
        if (degrees >= 337.5 || degrees < 22.5) return ERoleDir.RIGHT;
        if (degrees >= 22.5 && degrees < 67.5) return ERoleDir.RIGHT_UP;
        if (degrees >= 67.5 && degrees < 112.5) return ERoleDir.UP;
        if (degrees >= 112.5 && degrees < 157.5) return ERoleDir.LEFT_UP;
        if (degrees >= 157.5 && degrees < 202.5) return ERoleDir.LEFT;
        if (degrees >= 202.5 && degrees < 247.5) return ERoleDir.LEFT_DOWN;
        if (degrees >= 247.5 && degrees < 292.5) return ERoleDir.DOWN;
        if (degrees >= 292.5 && degrees < 337.5) return ERoleDir.RIGHT_DOWN;

        return ERoleDir.DOWN; // 兜底
    }
}