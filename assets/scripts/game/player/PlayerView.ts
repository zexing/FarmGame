// scripts/game/player/PlayerView.ts
import { _decorator, Vec3 } from 'cc';
import { CameraFollow } from '../../common/component/camera/CameraFollow';
import { BaseMVCView } from '../../mvc/BaseMVCView';
import { JoystickView } from './JoystickView';
import { PlayerController } from './PlayerController';
import { PlayerModel } from './PlayerModel';

const { ccclass, property } = _decorator;

/**
 * 角色朝向枚举
 */
enum FaceDir {
    Up = 0,
    Down = 1,
    Left = 2,
    Right = 3
}

@ccclass('PlayerView')
export class PlayerView extends BaseMVCView<PlayerModel, PlayerController> {

    // ─── 属性绑定 (分组规范) ──────────────────────────────────────────────────

    @property({ tooltip: "主角移动速度 (像素/秒)" })
    public moveSpeed: number = 1000;

    //碰撞检测 脚底碰撞匣宽度
    @property({tooltip: "碰撞检测 脚底碰撞匣宽度"})
    public hitboxWidth: number = 40;

    //碰撞检测 脚底碰撞匣高度
    @property({tooltip: "碰撞检测 脚底碰撞匣高度"})
    public hitboxHeight: number = 20;

    @property({ type: JoystickView, tooltip: "虚拟摇杆组件引用" })
    public joystick: JoystickView = null!;

    @property(CameraFollow)
    public cameraFollow: CameraFollow = null!;

    // @property({ group: { name: "核心引用", id: "1" }, type: PlayerController, tooltip: "关联的主角控制器" })
    // public controller: PlayerController = null!;

    // @property({ group: { name: "渲染组件", id: "2" }, type: Sprite, tooltip: "用于显示角色的 Sprite 组件" })
    // public sprite: Sprite = null!;

    // @property({ group: { name: "待机贴图", id: "3" }, type: SpriteFrame, tooltip: "向下待机" })
    // public idleDown: SpriteFrame = null!;

    // @property({ group: { name: "待机贴图", id: "3" }, type: SpriteFrame, tooltip: "向上待机" })
    // public idleUp: SpriteFrame = null!;

    // @property({ group: { name: "待机贴图", id: "3" }, type: SpriteFrame, tooltip: "向左待机" })
    // public idleLeft: SpriteFrame = null!;

    // @property({ group: { name: "待机贴图", id: "3" }, type: SpriteFrame, tooltip: "向右待机" })
    // public idleRight: SpriteFrame = null!;

    // // 这里可以继续扩展 Walk 动画序列，为了演示简洁，我们先处理朝向切换

    // ─── 运行时变量 ──────────────────────────────────────────────────────────

    // private _currentDir: FaceDir = FaceDir.Down;
    // private _isWalking: boolean = false;


    protected createModel(): PlayerModel {
        return new PlayerModel();
    }
    protected createController(): PlayerController {
        return new PlayerController();
    }


    protected onMVCReady(): void {
        console.log('[PlayerView] MVC 就绪');
    }


    // ─── 生命周期 ────────────────────────────────────────────────────────────

    protected update(dt: number): void {

        this._updateZIndex();

        if (!this.joystick || !this.joystick.isActive) return;

        const dir = this.joystick.direction; // 取到摇杆的归一化向量

        // 计算理论上这一帧要移动的距离
        const deltaX = dir.x * this.moveSpeed * dt;
        const deltaY = dir.y * this.moveSpeed * dt;

        const currentPos = this.node.position;
        let finalX = currentPos.x;
        let finalY = currentPos.y;

        // 【滑墙算法核心】：X轴和Y轴分开预测和移动！

        // 1. 预测 X 轴移动
        if (deltaX !== 0) {
            if (!this.controller.checkCollision(currentPos.x + deltaX, currentPos.y)) {
                finalX += deltaX; // 没撞墙，X轴位移生效
            }
        }

        // 2. 预测 Y 轴移动
        if (deltaY !== 0) {
            if (!this.controller.checkCollision(finalX, currentPos.y + deltaY)) { // 注意：这里用的是刚刚算出的 finalX
                finalY += deltaY; // 没撞墙，Y轴位移生效
            }
        }

        // console.log("finalX: ", finalX, "----finalY: ", finalY);

        // 3. 应用最终坐标
        this.node.setPosition(finalX, finalY, currentPos.z);

        // 4. 实时更新当前所在的逻辑格子坐标 (用于工具交互)
        this.controller.updateCurrentGridPos(finalX, finalY);

        // TODO: 这里可以拓展深度排序逻辑 (this.node.setSiblingIndex) 让角色在树木前后正确遮挡

        if (deltaX !== 0 || deltaY !== 0) {
            this.controller.updateTargetGridPos(dir);
        }
    }

    // ─── 核心表现逻辑 ────────────────────────────────────────────────────────

    /** 更新玩家位置 */
    public updatePlayerPos(spawnPos: Vec3) {
        // 将主角放置在该坐标 (锚点在脚底的话，直接赋值即可)
        this.node.setPosition(spawnPos.x, spawnPos.y, 0);

        // 绑定摄像机跟随目标，并瞬移到主角位置避免开局拉扯
        if (this.cameraFollow) {
            this.cameraFollow.target = this.node;
            const worldPos = this.node.worldPosition;
            this.cameraFollow.node.setWorldPosition(
                worldPos.x + this.cameraFollow.offset.x,
                worldPos.y + this.cameraFollow.offset.y,
                this.cameraFollow.offset.z
            );
        }
    }

    /**
     * 自动计算地图的最大物理包围盒，并限制摄像机移动
     */
    public setupCameraBounds(rows: number, cols: number): void {
        // if (!this.cameraFollow) return;

        // const wHalf = MapConst.CELL_WIDTH / 2;
        // const hHalf = MapConst.CELL_HEIGHT / 2;

        // const maxW = (rows + cols) * wHalf;
        // const maxH = (rows + cols) * hHalf;

        // const minX = -rows * wHalf;
        // const minY = -(rows + cols) * hHalf;

        // const dynamicBounds = new math.Rect(minX, minY, maxW, maxH);

        // this.cameraFollow.mapBounds = dynamicBounds;
        // this.cameraFollow.enableBounds = true;

        // console.log(`[摄像机限制] 动态地图边界已修正为真实尺寸: ${dynamicBounds.toString()}`);
    }

    // /**
    //  * 更新动画与贴图状态
    //  */
    // private _updateAnimation(): void {
    //     const joystick = this.controller.joystick;
    //     if (!joystick) return;

    //     const dir = joystick.direction;
    //     const speed = dir.length();

    //     // 1. 判断是否在走动 (超过死区)
    //     this._isWalking = speed > 0.1;

    //     if (this._isWalking) {
    //         // 2. 根据向量角度判断朝向
    //         // 弧度转角度: 0度向右, 90度向上, 180/-180向左, -90向下
    //         const angle = math.toDegree(Math.atan2(dir.y, dir.x));

    //         let newDir = this._currentDir;
    //         if (angle > 45 && angle <= 135) newDir = FaceDir.Up;
    //         else if (angle > -135 && angle <= -45) newDir = FaceDir.Down;
    //         else if (angle > 135 || angle <= -135) newDir = FaceDir.Left;
    //         else if (angle > -45 && angle <= 45) newDir = FaceDir.Right;

    //         if (this._currentDir !== newDir) {
    //             this._currentDir = newDir;
    //             this._syncSpriteFrame();
    //         }
    //     } else {
    //         // 停下时切换回对应的待机贴图
    //         this._syncSpriteFrame();
    //     }
    // }

    // /**
    //  * 根据当前状态切换 SpriteFrame
    //  */
    // private _syncSpriteFrame(): void {
    //     switch (this._currentDir) {
    //         case FaceDir.Up: this.sprite.spriteFrame = this.idleUp; break;
    //         case FaceDir.Down: this.sprite.spriteFrame = this.idleDown; break;
    //         case FaceDir.Left: this.sprite.spriteFrame = this.idleLeft; break;
    //         case FaceDir.Right: this.sprite.spriteFrame = this.idleRight; break;
    //     }
    // }

    /**
     * 深度排序 (Z-Index 优化)
     * 在 2D Isometric 中，Y 坐标越低，节点越靠前
     */
    private _updateZIndex(): void {
        // 技巧：利用节点在父节点下的 SiblingIndex 来模拟深度
        // 我们假设地图上的所有物体（主角、树、建筑）都在同一个 Parent 下
        // 逻辑：Y 越小，SiblingIndex 越大

        const parent = this.node.parent;
        if (!parent) return;

        // 注意：在大规模地图中，每一帧排序所有节点很吃性能
        // 正式项目建议使用 `UITransform` 的优先级或定时器触发排序
        // 这里提供一个简单的逻辑思路：
        // this.node.setSiblingIndex(1000 - Math.floor(this.node.y));
    }
}