// scripts/game/player/PlayerController.ts
import { math, v2, Vec2 } from 'cc';
import { EventManager } from '../../common/manager/EventManager';
import { ServiceLocator } from '../../common/manager/ServiceLocator';
import { ECellState } from '../../const/GameDefine';
import { ServiceKey } from '../../const/ServiceDefine';
import { PlayerEvent, SystemEvent } from '../../events';
import { InputEvent } from '../../events/InputEvents';
import { BaseMVCController } from '../../mvc/BaseMVCController';
import { IMapController } from '../map/IMap';
import { IsoUtils } from '../map/IsoUtils';
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

    protected onInit(): void {
        console.log("PlayerController onInit!!!!");
        // 【重构后】：只监听纯粹的业务语义事件！
        EventManager.getInstance().on(InputEvent.ACTION_USE_TOOL, this._onActionUseTool, this);
    }

    protected onDestroy(): void {
        // 务必注销，防止内存泄漏
        EventManager.getInstance().off(InputEvent.ACTION_USE_TOOL, this._onActionUseTool, this);
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


    // 当前朝向
    private _faceDir: FaceDir = FaceDir.Right;

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
        // 1. 面朝向动画逻辑保持不变...
        const angle = math.toDegree(Math.atan2(dir.y, dir.x));
        if (angle > 45 && angle <= 135) this._faceDir = FaceDir.Up;
        else if (angle > -135 && angle <= -45) this._faceDir = FaceDir.Down;
        else if (angle > 135 || angle <= -135) this._faceDir = FaceDir.Left;
        else if (angle > -45 && angle <= 45) this._faceDir = FaceDir.Right;

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
            EventManager.getInstance().dispatchEvent(PlayerEvent.TargetChanged, { row: tr, col: tc });
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
            EventManager.instance.dispatchEvent(SystemEvent.GameTip, {
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
            EventManager.instance.dispatchEvent(SystemEvent.GameTip, {
                msg: `这里无法使用 ${currentTool.name}`,
            })
        }
    }


    // /**
    //  * 自动推导摄像机的终极包围盒边界
    //  */
    // public applyCameraBounds(): void {
    //     if (!this.cameraFollow) return;

    //     // 等距视角的菱形包围盒极值计算公式：
    //     // 宽度跨度 = (行数 + 列数) * (格子宽度 / 2)
    //     // 高度跨度 = (行数 + 列数) * (格子高度 / 2)
    //     const wHalf = MapConst.CELL_WIDTH / 2;
    //     const hHalf = MapConst.CELL_HEIGHT / 2;

    //     const maxW = (this._model.rows + this._model.cols) * wHalf;
    //     const maxH = (this._model.rows + this._model.cols) * hHalf;

    //     // 根据 isoToScreen 公式推导极值坐标点：
    //     // 最左点 X = -rows * wHalf
    //     // 最下点 Y = -(rows + cols) * hHalf
    //     const minX = -this._model.rows * wHalf;
    //     const minY = -(this._model.rows + this._model.cols) * hHalf;

    //     // 组装成 Rect (x, y, width, height)
    //     const dynamicBounds = new math.Rect(minX, minY, maxW, maxH);

    //     // 【核心实装】：把算好的边界动态赋值给摄像机
    //     this.cameraFollow.mapBounds = dynamicBounds;
    //     this.cameraFollow.enableBounds = true;

    //     console.log(`[摄像机限制] 动态地图边界已生效: ${dynamicBounds.toString()}`);
    // }


}