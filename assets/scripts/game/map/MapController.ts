// assets/scripts/game/farm/FarmController.ts
import { Rect, Vec3 } from 'cc';
import { EventManager } from '../../common/manager/EventManager';
import { ECellState, MapConst } from '../../const/GameDefine';
import { SystemEvent, TimeEvent } from '../../events';
import { BaseMVCController } from '../../mvc/BaseMVCController';
import { GroundGridCtrl } from './ground_grid/GroundGridCtrl';
import { ICellData, IMapController } from './IMap';
import { MapModel } from './MapModel';
import { MapView } from './MapView';
import { MapChunkCtrl } from './tiled_map/MapChunkCtrl';

export class MapController extends BaseMVCController<MapModel, MapView>
    implements IMapController {

    private _groundGridCtrl: GroundGridCtrl;
    private _mapChunkCtrl: MapChunkCtrl;

    protected onInit(): void {
        console.log("MapController onInit!!!!");

        // // 🌟 核心修复：在启动所有 SubCtrl 之前，先给 MapModel 扩容！
        // // 按照我们在 MapConst 里定义的宏大世界边界，一次性分配好二维数组
        // const totalRows = this.getRows();
        // const totalCols = this.getCols();
        // this.model.initMapCellDatas(totalRows, totalCols);
        // console.log(`🧠 [MapController] 大世界记忆中枢分配完毕: ${totalRows} 行 x ${totalCols} 列`);

        this._alignTiledMap();

        this._groundGridCtrl = this.registerSubCtrl(new GroundGridCtrl());
        this._mapChunkCtrl = this.registerSubCtrl(new MapChunkCtrl());

        // 🌟 3. 算出整个大世界的边界并下发给摄像机！
        this._broadcastWorldBounds();

        // // 监听世界时间管理器的跨天事件
        EventManager.getInstance().on(TimeEvent.DayEnd, this._onDayEndSettlement, this);
    }

    protected onDestroy(): void {
        console.log("[MapController] 业务逻辑销毁清理");

        // // 务必注销监听，防止内存泄漏
        EventManager.getInstance().off(TimeEvent.DayEnd, this._onDayEndSettlement, this);
    }

    /**
     * 将 TiledMap 与纯代码生成的等距网格进行精准重合
     */
    private _alignTiledMap(): void {

        const totalMapHeight = (MapConst.CHUNK_SIZE + MapConst.CHUNK_SIZE) * (MapConst.CELL_HEIGHT / 2);

        const topEdgeY = totalMapHeight / 2;
        const tiledZeroCenterY = topEdgeY - (MapConst.CELL_HEIGHT / 2);

        const offsetX = 0;
        let offsetY = 0 - tiledZeroCenterY;

        this.view.tiledMapContainer.setPosition(offsetX, offsetY, this.view.tiledMapContainer.z);
    }

    /**
     * 计算并广播无缝大世界的物理边界
     */
    private _broadcastWorldBounds(): void {
        // 假设你目前规划了 2x2 个区块（比如 0,0 到 1,1 这个田字形世界）
        // 以后你画了更多的地图，只需要把这里改大即可
        const MAX_CHUNKS_X = 2; // 列方向最大区块数
        const MAX_CHUNKS_Y = 2; // 行方向最大区块数
        const CHUNK_SIZE = 32;

        const totalCols = MAX_CHUNKS_X * CHUNK_SIZE;
        const totalRows = MAX_CHUNKS_Y * CHUNK_SIZE;

        this.model.rows = totalRows;
        this.model.cols = totalCols;

        const halfWidth = MapConst.CELL_WIDTH / 2;
        const halfHeight = MapConst.CELL_HEIGHT / 2;

        // 🌟 等轴测菱形 -> 正交 AABB 矩形的极限点推导：
        // 最左边的点：行数最大，列数为 0 时的 X 坐标
        const minX = -totalRows * halfWidth;
        // 最右边的点：列数最大，行数为 0 时的 X 坐标
        const maxX = totalCols * halfWidth;
        // 最下面的点：行和列都达到最大时的 Y 坐标
        const minY = -(totalRows + totalCols) * halfHeight;
        // 最上面的点：原点 (0,0) 的 Y 坐标
        const maxY = 0;

        // 构建 Rect (x, y, width, height)
        const boundsRect = new Rect(minX, minY, maxX - minX, maxY - minY);

        // 通过事件总线，通知给正在嗷嗷待哺的 CameraFollow
        EventManager.getInstance().dispatchEvent(SystemEvent.MapBoundsChanged, {
            bounds: boundsRect
        });

        console.log(`🗺️ [MapController] 世界法则已确立，边界尺寸: `, boundsRect);
    }

    /**
     * 🌙 当天结束结算逻辑（完美适配高阶作物配置）
     */
    private _onDayEndSettlement(): void {
        let growCount = 0;
        const maxRows = this.model.rows;
        const maxCols = this.model.cols;

        // 🌟 解除封印 2B：恢复遍历结算
        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxCols; col++) {
                let cell = this.getCellData(row, col);
                if (!cell) continue;

                // 规则 1：所有开垦过和播种过的地，都会消耗水分
                if (cell.state === ECellState.Tilled || cell.state === ECellState.Planted) {
                    const wasWatered = cell.isWatered;
                    cell.isWatered = false; // 每天退水干涸

                    // 规则 2：只有浇过水的植物，才会生长！
                    if (cell.state === ECellState.Planted && cell.cropId > 0 && wasWatered) {
                        cell.plantDay++;
                        cell.growStage++; // 推进一个生长阶段
                        growCount++;

                        // 这里暂定阶段到达 3 即为成熟 (你可以根据 ConfigManager 里的 growStages-1 来定)
                        if (cell.growStage >= 3) {
                            cell.state = ECellState.Harvestable;
                            console.log(`🌟 [过夜结算] (${row}, ${col}) 的作物彻底成熟了！`);
                        } else {
                            console.log(`🌱 [过夜结算] (${row}, ${col}) 作物生长。阶段变为:${cell.growStage}`);
                        }
                    }
                }
            }
        }
        console.log(`📊 [结算报告] 昨夜共 ${growCount} 颗作物成长。所有土地已干涸。`);
    }



    /**********************************实现IMapController接口方法 ****************************** */

    /**
     * 获取大世界逻辑上的最大行数 (向下兼容老接口)
     */
    getRows(): number {
        // 返回：区块纵向数量 * 每个区块的格子数
        return MapConst.WORLD_CHUNKS_ROW * MapConst.CHUNK_SIZE;
    }

    /**
     * 获取大世界逻辑上的最大列数 (向下兼容老接口)
     */
    getCols(): number {
        // 返回：区块横向数量 * 每个区块的格子数
        return MapConst.WORLD_CHUNKS_COL * MapConst.CHUNK_SIZE;
    }

    public isoToScreen(row: number, col: number): Vec3 {
        return this._groundGridCtrl.isoToScreen(row, col);;
    }

    public screenToIso(x: number, y: number): { row: number, col: number } {
        return this._groundGridCtrl.screenToIso(x, y);
    }

    public async initViewPort(): Promise<void> {
        const startRow = Math.round(this.getRows() / 2);
        const startCol = Math.round(this.getCols() / 2);
        await this.updateViewport(startRow, startCol);
    }

    /**
     * 收到视口更新指令 (现在是异步的了)
     */
    public async updateViewport(centerRow: number, centerCol: number): Promise<void> {
        // 🌟 先等待大地图的物理地表完全加载并解析完毕
        await this._mapChunkCtrl.updateChunks(centerRow, centerCol);

        // 然后再驱动交互网格 (因为网格依赖地图的解析数据)
        this._groundGridCtrl.updateViewport(centerRow, centerCol);
    }


    /**
     * 获取指定格子的数据 (供 ToolManager 状态判定使用)
     * @param row 
     * @param col 
     */
    public getCellData(row: number, col: number): ICellData | null {
        // 假设你的 FarmController 内部持有 model 的引用（可能是 this.model 或 this._model）
        if (!this.model) return null;
        return this.model.getCellData(row, col);
    }
}