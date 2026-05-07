/***
 * 
 * 此类已经弃用，TiledMap相关逻辑移动到了MapChunkCtrl
 */



import { _decorator, Rect, TiledLayer, TiledMap } from 'cc';
import { ECellState, MapConst, MapLayerName } from 'db://assets/scripts/const/GameDefine';
import { BaseMVCSubCtrl } from '../../../mvc/BaseMVCSubCtrl';
import { createDefaultCellData, IMapModel, IMapView } from '../IMap';

const { ccclass, property } = _decorator;

export class TiledMapCtrl extends BaseMVCSubCtrl {

    protected _model: IMapModel;
    protected _view: IMapView;

    init(model: IMapModel, view: IMapView): void {
        this._model = model;
        this._view = view;
        this.initMapInfo();
    }

    destroy() {
        super.destroy();
        this._mapRows = 0;
        this._mapCols = 0;
        this._tiledMap = undefined;
    }


    // tiledMap组件
    private _tiledMap: TiledMap = null!;

    // 缓存数据
    private _mapRows: number = 0;
    private _mapCols: number = 0;

    public get rows(): number { return this._mapRows; }
    public get cols(): number { return this._mapCols; }

    /**
     * 初始化解析地图尺寸
     */
    public initMapInfo(): void {
        // this._tiledMap = this._view.tiledMapNode.getComponent(TiledMap);
        // if (!this._tiledMap) return;
        // const size = this._tiledMap.getMapSize();
        // this._mapRows = size.height;
        // this._mapCols = size.width;
        // console.log(`[TiledMapManager] 解析地图物理尺寸: ${this._mapRows}行 x ${this._mapCols}列`);
        // this.initMapDataFromTiled();
        // this._alignTiledMap();
    }

    /**
     * 根据 TiledMap 的逻辑层直接解析地图数据
     * @param rows 总行数 (高度)
     * @param cols 总列数 (宽度)
     * @param logicLayer TiledMap 的逻辑图层对象
     */
    public initMapDataFromTiled(): void {

        const logicLayer = this._tiledMap.getLayer(MapLayerName.Logic);
        if (!logicLayer) {
            console.error(`未找到TiledMap中的逻辑图层`);
            return;
        }

        // 先初始化地图格子数据
        this._model.initMapCellDatas(this._mapRows, this._mapCols);

        for (let r = 0; r < this._mapRows; r++) {
            // const rowArray: ICellData[] = [];
            for (let c = 0; c < this._mapCols; c++) {

                // 【核心 API】：获取 (列, 行) 处的图块 GID (Global ID)
                // 注意：Tiled API 中，x代表列(col)，y代表行(row)
                const gid = logicLayer.getTileGIDAt(c, r);
                let state = ECellState.Untilled; // 默认所有地方都是死路

                if (gid !== 0) {
                    // 【魔法核心】：直接向引擎要这个 GID 绑定的自定义属性！
                    const props = this._tiledMap.getPropertiesForGID(gid);

                    // 判断我们自己填的 logicType 标签
                    if (props && props.logicType) {
                        if (props.logicType === ECellState[ECellState.Untilled]) state = ECellState.Untilled;
                        else if (props.logicType === ECellState[ECellState.Locked]) state = ECellState.Locked;
                    }
                }

                this._model.updateCellData(createDefaultCellData(r, c))
            }
        }

        console.log(`[TiledMapCtrl] 成功从 TiledMap 解析了 ${this._mapRows}x${this._mapCols} 的地图大脑！`);
    }

    /**
     * 将 TiledMap 与纯代码生成的等距网格进行精准重合
     */
    private _alignTiledMap(): void {
        if (!this._tiledMap) return;

        const totalMapHeight = (this._mapRows + this._mapCols) * (MapConst.CELL_HEIGHT / 2);

        const topEdgeY = totalMapHeight / 2;
        const tiledZeroCenterY = topEdgeY - (MapConst.CELL_HEIGHT / 2);

        const offsetX = 0;
        let offsetY = 0 - tiledZeroCenterY;

        this._tiledMap.node.setPosition(offsetX, offsetY, this._tiledMap.node.position.z);

        this.extractAndHideLogicLayer();
    }

    /**
     * 获取逻辑图层并执行“卸磨杀驴”（隐藏图层）
     * @returns 返回逻辑图层对象，如果不存在则返回 null
     */
    public extractAndHideLogicLayer(): TiledLayer | null {
        if (!this._tiledMap) return null;

        // 使用强类型枚举，告别魔法字符串！
        const logicLayer = this._tiledMap.getLayer(MapLayerName.Logic);
        if (logicLayer) {
            logicLayer.node.active = false; // 隐藏视觉
            return logicLayer;
        }

        console.error(`❌ [TiledMapManager] 找不到关键图层: ${MapLayerName.Logic}`);
        return null;
    }

    /**
     * 计算并返回 TiledMap 为了与底层网格对齐所需的物理偏移量
     * @param tileThickness 泥土块侧面厚度
     */
    public calculateAlignmentOffset(tileThickness: number = 27): { x: number, y: number } {
        const totalMapHeight = (this._mapRows + this._mapCols) * (MapConst.CELL_HEIGHT / 2);
        const topEdgeY = totalMapHeight / 2;
        const tiledZeroCenterY = topEdgeY - (MapConst.CELL_HEIGHT / 2);

        return {
            x: 0,
            y: -tiledZeroCenterY - (tileThickness / 2)
        };
    }

    /**
     * 计算并返回摄像机的极限包围盒
     */
    public calculateCameraBounds(): Rect {
        const wHalf = MapConst.CELL_WIDTH / 2;
        const hHalf = MapConst.CELL_HEIGHT / 2;

        const maxW = (this._mapRows + this._mapCols) * wHalf;
        const maxH = (this._mapRows + this._mapCols) * hHalf;

        const minX = -this._mapRows * wHalf;
        const minY = -(this._mapRows + this._mapCols) * hHalf;

        return new Rect(minX, minY, maxW, maxH);
    }
}