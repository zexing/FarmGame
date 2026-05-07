/**
 * 农场视图层 — MapView
 */

import {
    _decorator,
    Node,
    Prefab
} from 'cc';
import { BaseMVCView } from '../../mvc/BaseMVCView';
import { IMapModel, IMapView } from './IMap';
import { MapController } from './MapController';
import { MapModel } from './MapModel';

const { ccclass, property } = _decorator;

@ccclass('MapView')
export class MapView
    extends BaseMVCView<IMapModel, MapController>
    implements IMapView {

    @property({ type: Prefab, tooltip: '地表格子预制体 (需挂载 GroundCell 脚本)' })
    public groundCellPrefab: Prefab = null!;

    @property({ type: Prefab, tooltip: '作物实体预制体' })
    public cropPrefab: Prefab = null!;


    @property({ type: Node, tooltip: 'Tiled地图父容器' })
    public tiledMapContainer: Node = null!;

    @property({ type: Node, tooltip: '地图格子父容器(地表层)' })
    public gridContainer: Node = null!;

    @property({ type: Node, tooltip: '玩家目标光标格子' })
    public cursorNode: Node = null;

    @property({ type: Node, tooltip: '实体父容器(用于Y-Sort深度排序)' })
    public entityContainer: Node = null!;

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


    protected onDestroy(): void {
        super.onDestroy();

    }

    // public refreshCell(row: number, col: number, cell: ICellData): void {

    // }

    // public refreshAllCells(): void {

    // }

}