/**
 * 农场视图层 — MapView
 */

import {
    _decorator,
    Node,
    Prefab
} from 'cc';
import { BaseMVCView } from '../../mvc/BaseMVCView';
import { ICellData, IMapModel, IMapView } from './IMap';
import { MapController } from './MapController';
import { MapModel } from './MapModel';

const { ccclass, property } = _decorator;

@ccclass('MapView')
export class MapView
    extends BaseMVCView<IMapModel, MapController>
    implements IMapView {

    @property({ type: Prefab, tooltip: '单个格子预制体 (需挂载 GroundCell 脚本)' })
    public groundCellPrefab: Prefab = null!;

    @property({ type: Node, tooltip: '地图格子父容器' })
    public gridContainer: Node = null!;

    @property({ type: Node, tooltip: 'Tiled地图父容器' })
    public tiledMapContainer: Node = null!;

    @property({ type: Node, tooltip: '玩家目标光标格子' })
    public cursorNode: Node = null;

    // @property(Node)
    // public tiledMapNode: Node = null!;

    protected createModel(): IMapModel {
        return new MapModel();
    }

    protected createController(): MapController {
        return new MapController();
    }

    protected onMVCReady(): void {
        // this.cellGridView?.setModel(this._model);
        // this._bindActionMenuEvents();
        console.log('[MapView] MVC 就绪');
    }

    /****************************地图对齐相关逻辑***************************************** */

    // // 与 TiledMap (0,0) 格子对齐的 X 轴偏移量
    // private _mapOffsetX: number = 0;

    // // 与 TiledMap (0,0) 格子对齐的 Y 轴偏移量
    // private _mapOffsetY: number = 0;

    // public applyMapAlignment(): void {
    //     // 1. 调用我们刚才写好的推导公式
    //     this.calculateMapOffset(27);

    //     // 2. 真正实装：让底图产生物理位移，与透明的 GridView 完美重合！
    //     if (this.tiledMapNode) {
    //         // 注意：由于 Z 轴不需要偏移，保持原来的 z 即可
    //         this.tiledMapNode.setPosition(this._mapOffsetX, this._mapOffsetY, this.tiledMapNode.position.z);
    //         console.log(`[地图对齐] TiledMap 节点已移动至: (${this._mapOffsetX}, ${this._mapOffsetY})`);
    //     }
    // }

    // /**
    //  * 自动推导 TiledMap 的偏移量
    //  * @param tileThickness 泥土地块的侧面厚度（根据你的测量是 27）
    //  */
    // public calculateMapOffset(tileThickness: number = 27) {

    //     // 1. 【修正高度公式】纯正等距地图的总物理高度
    //     // 等距视角下，每增加一行或一列，地图会在 Y 轴上延伸半个格子的高度
    //     const totalMapHeight = (this._model.rows + this._model.cols) * (MapConst.CELL_HEIGHT / 2);

    //     // 2. 假设 TiledMap 节点的锚点 (Anchor) 是 (0.5, 0.5)
    //     // 那么 TiledMap 包围盒的最高点（上边缘）坐标就是 totalMapHeight / 2
    //     const topEdgeY = totalMapHeight / 2;

    //     // 3. 计算 TiledMap 中 (0,0) 格子的【逻辑中心点 Y 坐标】
    //     // 最高点往下走半个格子的高度，正好就是第一个菱形的中心！
    //     const tiledZeroCenterY = topEdgeY - (MapConst.CELL_HEIGHT / 2);

    //     // 4. 强制对齐：把 TiledMap 的 (0,0) 拉到 GroundGridView 的 (0,0)
    //     // 偏移量 = 目标位置(0) - 当前位置(tiledZeroCenterY)
    //     this._mapOffsetX = 0;
    //     this._mapOffsetY = 0 - tiledZeroCenterY;

    //     // 5. 【处理侧面厚度 (Thickness)】
    //     // 如果你的地块有 27px 的侧边厚度，在 Tiled 中这部分通常是往下延伸的。
    //     // 这会导致视觉中心点上移。你需要根据实际视觉效果加上或减去这个厚度的一半或全部。
    //     // （你可以先注释掉这一行看纯逻辑格子的对齐效果，如果有像素级偏差再打开微调）
    //     this._mapOffsetY -= (tileThickness / 2);

    //     console.log(`[地图对齐] 物理总高=${totalMapHeight}`);
    //     console.log(`[地图对齐] 修正偏移量: X=${this._mapOffsetX}, Y=${this._mapOffsetY}`);
    // }

    protected onDestroy(): void {
        super.onDestroy();

    }

    public refreshCell(row: number, col: number, cell: ICellData): void {
        
    }

    public refreshAllCells(): void {
        
    }

}