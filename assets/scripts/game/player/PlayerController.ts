// scripts/game/player/PlayerController.ts
import { math, resources, SpriteFrame, v2, Vec2 } from 'cc';
import { EventManager } from '../../common/manager/EventManager';
import { ServiceLocator } from '../../common/manager/ServiceLocator';
import { ECellState } from '../../const/GameDefine';
import { ServiceKey } from '../../const/ServiceDefine';
import { InputEvents } from '../../events/InputEvents';
import { PlayerEvents } from '../../events/PlayerEvents';
import { SystemEvents } from '../../events/SystemEvents';
import { BaseMVCController } from '../../mvc/BaseMVCController';
import { IMapController } from '../map/IMap';
import { IsoUtils } from '../map/IsoUtils';
import { DegreeUtils } from '../role/DegreeUtils';
import { ERoleDir, ERoleState } from '../role/IRole';
import { RoleAnimation } from '../role/RoleAnimation';
import { RoleStateMachine } from '../role/RoleStateMachine';
import { IToolContext } from '../tool/ITool';
import { ToolManager } from '../tool/ToolManager';
import { IPlayercontroller } from './IPlayer';
import { PlayerModel } from './PlayerModel';
import { PlayerView } from './PlayerView';


// 1. 在顶部定义朝向枚举 (从 PlayerView 里移过来，因为逻辑层也需要用到)
export enum FaceDir {
    Up = 0,    // 对应屏幕：右上
    Down = 1,  // 对应屏幕：左下
    Left = 2,  // 对应屏幕：左上
    Right = 3  // 对应屏幕：右下
}


export class PlayerController extends BaseMVCController<PlayerModel, PlayerView>
    implements IPlayercontroller {


    // 🌟 核心：角色状态机实例
    private _stateMachine: RoleStateMachine = null!;

    protected onInit(): void {
        console.log("PlayerController onInit!!!!");
        // 1. 实例化状态机大脑
        this._stateMachine = new RoleStateMachine();

        // 2. 获取视图上的动画组件并绑定
        // 假设你在 PlayerView 预制体的根节点挂载了 RoleAnimation
        let roleAnim = this.view.roleAnimation;
        if (roleAnim) {
            roleAnim.bindStateMachine(this._stateMachine);
            // 💡 TODO: 在这里调用 roleAnim.registerAnim 把你的 64 张切图塞进去
            // this._registerAllAnimations(roleAnim);
            this._loadAndRegisterAnimations(roleAnim);
        }

        // 【重构后】：只监听纯粹的业务语义事件！
        EventManager.getInstance().on(InputEvents.ACTION_USE_TOOL, this._onActionUseTool, this);
        // 4. 监听摇杆事件 (名称请对齐你工程里的实际事件名)
        EventManager.instance.on(InputEvents.JOYSTICK_MOVE, this._onJoystickMove, this);
        EventManager.instance.on(InputEvents.JOYSTICK_END, this._onJoystickEnd, this);
    }

    protected onDestroy(): void {
        // 务必注销，防止内存泄漏
        EventManager.getInstance().off(InputEvents.ACTION_USE_TOOL, this._onActionUseTool, this);
        EventManager.instance.off(InputEvents.JOYSTICK_MOVE, this._onJoystickMove, this);
        EventManager.instance.off(InputEvents.JOYSTICK_END, this._onJoystickEnd, this);
        super.onDestroy();
    }

    // 当前玩家所在的逻辑格子坐标（用于种地、挥锄头等交互）
    private _currentRow: number = 0;
    // public get currentRow(): number {
    //     return this._currentRow;
    // }
    // public set currentRow(value: number) {
    //     this._currentRow = value;
    // }
    private _currentCol: number = 0;
    // public get currentCol(): number {
    //     return this._currentCol;
    // }
    // public set currentCol(value: number) {
    //     this._currentCol = value;
    // }


    public getCurrentRowCol(): { row: number, col: number } {
        return { row: this._currentRow, col: this._currentCol };
    }


    // // 当前朝向
    // private _faceDir: FaceDir = FaceDir.Right;

    // 当前瞄准的目标格子坐标 (准星位置)
    private _targetRow: number = -1;
    private _targetCol: number = -1;

    // // 暴露给外部读取
    // public get faceDir(): FaceDir { return this._faceDir; }
    // public get targetRow(): number { return this._targetRow; }
    // public get targetCol(): number { return this._targetCol; }

    /**
     * 放置主角到指定网格，并强制更新一次摄像机和视口
     */
    public spawnPlayer(): void {

        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        if (!mapCtrl) return;
        const startRow = Math.round(mapCtrl.getRows() / 2);
        const startCol = Math.round(mapCtrl.getCols() / 2);
        this._currentRow = startRow;
        this._currentCol = startCol;
        // this._targetRow = startRow;
        // this._targetCol = startCol;


        // 获取出生点的屏幕坐标
        const spawnPos = IsoUtils.isoToScreen(startRow, startCol);

        // 界面更新坐标
        this.view.updatePlayerPos(spawnPos)

        // 更新目标格子
        this.updateTargetGridPos(v2(1, 0));
    }

    /**
     * 检测目标位置的脚部碰撞匣是否会碰到障碍物
     * 假设玩家节点的锚点 (Anchor) 在脚底正中心 (0.5, 0)
     */
    public checkCollision(targetX: number, targetY: number): boolean {

        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        if (!mapCtrl) return true;

        // 计算碰撞匣的 4 个顶点坐标
        const left = targetX - this.view.hitboxWidth / 2;
        const right = targetX + this.view.hitboxWidth / 2;
        const bottom = targetY;
        const top = targetY + this.view.hitboxHeight;

        // 组装 4 个角
        const corners = [
            { x: left, y: top },    // 左上角
            { x: right, y: top },   // 右上角
            { x: left, y: bottom }, // 左下角
            { x: right, y: bottom } // 右下角
        ];

        for (const corner of corners) {
            // 利用优先级 1 写好的公式，将屏幕坐标转为网格坐标
            const gridPos = IsoUtils.screenToIso(corner.x, corner.y);

            // 如果这个角碰到了障碍物，立刻返回 true (发生碰撞)
            if (this.isCellBlocked(gridPos.row, gridPos.col)) {
                return true;
            }
        }

        return false; // 四个角都没撞墙，安全！
    }

    public isCellBlocked(row: number, col: number): boolean {
        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        // 安全保护：如果没有绑定数据源，默认不准动
        if (!mapCtrl) return true;

        // 向核心数据层查询这块地的真实数据
        const cell = mapCtrl.getCellData(row, col);

        // 1. 如果 cell 为 null，说明走到了绝对数学边界之外（物理越界）
        if (!cell) {
            return true;
        }

        // 2. 如果 cell 的状态是 Locked（说明这里是你在 Tiled 里画的红块风景区！）
        if (cell.state === ECellState.Locked) {
            return true;
        }

        // 其他情况（荒地、耕地、作物），全部可以自由行走
        return false;
    }

    public updateTargetGridPos(dir: Vec2): void {
        // // 1. 面朝向动画逻辑保持不变...
        // const angle = math.toDegree(Math.atan2(dir.y, dir.x));
        // if (angle > 45 && angle <= 135) this._faceDir = FaceDir.Up;
        // else if (angle > -135 && angle <= -45) this._faceDir = FaceDir.Down;
        // else if (angle > 135 || angle <= -135) this._faceDir = FaceDir.Left;
        // else if (angle > -45 && angle <= 45) this._faceDir = FaceDir.Right;

        // 🌟 2. 神级改造：使用“前瞻探测器”进行精准等轴测锁定！
        // 假设主角往前看半个格子的距离（60像素）
        const lookAheadDist = 60;
        const targetScreenX = this.view.node.position.x + dir.x * lookAheadDist;
        const targetScreenY = this.view.node.position.y + dir.y * lookAheadDist;

        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        if (!mapCtrl) return;

        // 直接用底层神圣公式，算出主角看向的真实逻辑格子！
        const gridPos = IsoUtils.screenToIso(targetScreenX, targetScreenY);

        const maxRow = mapCtrl.getRows();
        const maxCol = mapCtrl.getCols();
        const tr = math.clamp(gridPos.row, 0, maxRow - 1);
        const tc = math.clamp(gridPos.col, 0, maxCol - 1);

        if (this._targetRow !== tr || this._targetCol !== tc) {
            this._targetRow = tr;
            this._targetCol = tc;

            // 🌟 派发全局事件：玩家看准了新的一块地！
            EventManager.getInstance().dispatchEvent(PlayerEvents.TargetChanged, { row: tr, col: tc });
        }
    }

    public updateCurrentGridPos(x: number, y: number): void {

        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        if (!mapCtrl) return;

        const gridPos = IsoUtils.screenToIso(x, y);

        // 动态获取真实地图边界
        const maxRow = mapCtrl.getRows();
        const maxCol = mapCtrl.getCols();

        const newRow = math.clamp(gridPos.row, 0, maxRow - 1);
        const newCol = math.clamp(gridPos.col, 0, maxCol - 1);

        if (newRow !== this._currentRow || newCol !== this._currentCol) {
            this._currentRow = newRow;
            this._currentCol = newCol;
            mapCtrl.updateViewport(this._currentRow, this._currentCol);
        }
    }


    /**
      * 当收到“使用工具”指令时的处理逻辑
      */
    private _onActionUseTool(): void {
        if (this._targetRow === -1 || this._targetCol === -1) return;

        const mapCtrl = ServiceLocator.get<IMapController>(ServiceKey.IMapController);
        if (!mapCtrl) return;

        const targetCell = mapCtrl.getCellData(this._targetRow, this._targetCol);
        const context: IToolContext = { farmCtrl: mapCtrl as any };

        // ✅ 【终极解耦】：找大管家拿当前装备的工具！
        const currentTool = ToolManager.getInstance().getCurrentTool();

        if (!currentTool) {
            // console.log("❌ [交互提示] 手里空空如也，没拿工具！");
            EventManager.instance.dispatchEvent(SystemEvents.GameTip, {
                msg: "手里空空如也，没拿工具！",
            })
            return;
        }

        // 完美的契约执行
        if (currentTool.canUse(targetCell)) {
            const isSuccess = currentTool.use(this._targetRow, this._targetCol, targetCell, context);
            if (isSuccess) {
                // TODO: 播放挥舞动画 this.view.playActionAnim('use');
            }
        } else {
            // console.log(`❌ [交互提示] 这里无法使用 ${currentTool.name}`);
            EventManager.instance.dispatchEvent(SystemEvents.GameTip, {
                msg: `这里无法使用 ${currentTool.name}`,
            })
        }
    }

    // ==========================================
    // 🚀 核心：解析 64 张图片并分配给 8 个方向
    // ==========================================
    private _loadAndRegisterAnimations(roleAnim: RoleAnimation): void {
        // ⚠️ 引擎铁律：loadDir 必须加载 assets/resources/ 下的目录
        resources.loadDir('textures/role/0', SpriteFrame, (err, assets) => {
            if (err) {
                console.error("[PlayerController] 角色动画加载失败:", err);
                return;
            }

            // 🚨 致命防坑：loadDir 加载出来的数组顺序可能是乱的！必须严格按名字里的数字重排！
            assets.sort((a, b) => {
                // 把 role0_01 里的非数字剔除，只留数字进行比对
                const numA = parseInt(a.name.replace(/[^0-9]/ig, ''));
                const numB = parseInt(b.name.replace(/[^0-9]/ig, ''));
                return numA - numB;
            });

            // 🌟 定义美术作图时的方向顺序 (以 8 张图为一组)
            // 假设你的 64 张图顺序是：下(1-8), 左下(9-16), 左(17-24), 左上(25-32), 上(33-40), 右上(41-48), 右(49-56), 右下(57-64)
            // ⚠️ 请务必根据你图片的实际朝向，调整这个数组的顺序！
            const artDirOrder = [
                ERoleDir.DOWN,
                ERoleDir.LEFT,
                ERoleDir.RIGHT,
                ERoleDir.UP,
                ERoleDir.LEFT_DOWN,
                ERoleDir.RIGHT_DOWN,
                ERoleDir.LEFT_UP,
                ERoleDir.RIGHT_UP,
            ];

            const framesPerDir = 8; // 每个方向 8 张图

            for (let i = 0; i < artDirOrder.length; i++) {
                const dir = artDirOrder[i];
                const startIndex = i * framesPerDir;
                const dirFrames = assets.slice(startIndex, startIndex + framesPerDir);

                // 1. 注册跑动状态 (MOVING)：8张图，帧率设置为 10，开启循环
                roleAnim.registerAnim(ERoleState.MOVING, dir, dirFrames, 10, true);

                // 2. 注册待机状态 (IDLE)：没有待机图的话，直接拿跑动的第一张图作为站立姿势，不循环
                roleAnim.registerAnim(ERoleState.IDLE, dir, [dirFrames[0]], 1, false);
            }

            // 全部加载并注册完毕后，赋予角色初始状态：向下发呆
            this._stateMachine.setStateAndDir(ERoleState.IDLE, ERoleDir.DOWN);
        });
    }

    // ==========================================
    // 🎮 摇杆驱动大脑
    // ==========================================
    private _onJoystickMove(dirVec: Vec2): void {
        if (dirVec.lengthSqr() > 0.01) {
            // 转换摇杆向量为 8 方向枚举
            const targetDir = DegreeUtils.vecTo8Dir(dirVec);

            // 告诉状态机切换动作，状态机内部会去重，不会引发无限重播
            this._stateMachine.setStateAndDir(ERoleState.MOVING, targetDir);

            // // 更新 Model 里的速度，供 PlayerView 在 Update 中执行真实位移
            // if (this.model) {
            //     this.model.velocity = dirVec;
            // }
        }
    }

    private _onJoystickEnd(): void {
        // 松开摇杆，进入发呆状态，并且保持最后面向的方向
        this._stateMachine.setStateAndDir(ERoleState.IDLE, this._stateMachine.dir);

        // if (this.model) {
        //     this.model.velocity = Vec3.ZERO;
        // }
    }

}