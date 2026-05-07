import { Node } from 'cc';
import { EventManager } from '../../../common/manager/EventManager';
import { PoolManager } from '../../../common/manager/PoolManager';
import { ECellState } from '../../../const/GameDefine';
import { FarmEvent, TimeEvent } from '../../../events';
import { BaseMVCSubCtrl } from '../../../mvc/BaseMVCSubCtrl';
import { ICellData, IMapModel, IMapView } from '../IMap';
import { IsoUtils } from '../IsoUtils';
import { CropEntity } from './CropEntity'; // 引入刚才写的组件

export class CropEntityCtrl extends BaseMVCSubCtrl {

    protected _model: IMapModel;
    protected _view: IMapView;

    // 专属的活跃作物字典
    private _activeCrops: Map<string, Node> = new Map();

    public init(model: IMapModel, view: IMapView): void {
        super.init(model, view);
        // 🌟 它独立监听事件，和 GroundGridCtrl 互不干扰！
        EventManager.instance.on(FarmEvent.CellStateChanged, this._onCellStateChanged, this);
        EventManager.instance.on(TimeEvent.DayBegin, this.refreshAll, this);
    }

    public destroy(): void {
        EventManager.instance.off(FarmEvent.CellStateChanged, this._onCellStateChanged, this);
        EventManager.instance.off(TimeEvent.DayBegin, this.refreshAll, this);
        this._clearAllCrops();
        super.destroy();
    }

    private _onCellStateChanged(payload: { row: number, col: number, newState: ECellState }): void {
        const cellData = this._model.getCellData(payload.row, payload.col);
        if (cellData) {
            this._syncCropEntity(payload.row, payload.col, cellData);
        }
    }

    public refreshAll(): void {
        this._model.forEachCellData((cell, r, c) => {
            this._syncCropEntity(r, c, cell);
        });
    }

    /**
     * 🌟 作物实体的生成与回收逻辑 (完全使用 PoolManager)
     */
    private _syncCropEntity(row: number, col: number, cell: ICellData): void {
        const key = `${row}_${col}`;
        const hasCrop = (cell.state === ECellState.Planted || cell.state === ECellState.Harvestable || cell.state === ECellState.Withered);

        if (hasCrop) {
            let cropNode = this._activeCrops.get(key);
            if (!cropNode) {
                // 向全局对象池索要
                cropNode = PoolManager.instance.getNode(this._view.cropPrefab, this._view.entityContainer);
                // 设置绝对坐标
                cropNode.setPosition(IsoUtils.isoToScreen(row, col));
                this._activeCrops.set(key, cropNode);

                // 进行一次实体层 Y-Sort
                this._sortEntityContainer();
            }
            // 刷新贴图
            cropNode.getComponent(CropEntity)?.refresh(cell);
        } else {
            // 收割/铲除时回收
            let cropNode = this._activeCrops.get(key);
            if (cropNode) {
                PoolManager.instance.putNode(cropNode);
                this._activeCrops.delete(key);
            }
        }
    }

    /**
     * 🌟 对实体层进行纯粹的静态排序
     */
    private _sortEntityContainer(): void {
        if (!this._view.entityContainer) return;
        const entities = this._view.entityContainer.children.slice();
        entities.sort((a, b) => b.position.y - a.position.y);

        entities.forEach((child, index) => {
            if (child.name === 'Player') return;
            if (child.getSiblingIndex() !== index) {
                child.setSiblingIndex(index);
            }
        });
    }

    private _clearAllCrops(): void {
        this._activeCrops.forEach(node => {
            PoolManager.instance.putNode(node);
        });
        this._activeCrops.clear();
    }
}