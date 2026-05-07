import { _decorator, Node, Size, UITransform } from 'cc';
import { PoolManager } from 'db://assets/scripts/common/manager/PoolManager';
import { ECellState, MapConst } from 'db://assets/scripts/const/GameDefine';
import { createDefaultCellData, ICellData, IMapModel, IMapView } from 'db://assets/scripts/game/map/IMap';
import { EventManager } from '../../../common/manager/EventManager';
import { FarmEvent, PlayerEvent, SystemEvent, TimeEvent } from '../../../events';
import { BaseMVCSubCtrl } from '../../../mvc/BaseMVCSubCtrl';
import { IsoUtils } from '../IsoUtils';
import { GroundGridCell } from './GroundGridCell';

const { ccclass, property } = _decorator;

@ccclass('GroundGridCtrl')
export class GroundGridCtrl extends BaseMVCSubCtrl {

    protected _model: IMapModel;
    protected _view: IMapView;

    // ✅ 修复点 1：彻底废弃全量缓存 _cells 数组，全面使用动态 Map
    private _activeNodes: Map<string, Node> = new Map();

    private _viewCenterRow: number = -1;
    private _viewCenterCol: number = -1;
    private _currentZoomRatio: number = 1.0;


    public init(model: IMapModel, view: IMapView): void {
        super.init(model, view);
        this.initGridNodes();
        EventManager.getInstance().on(FarmEvent.CellStateChanged, this._onCellStateChanged, this);
        EventManager.getInstance().on(SystemEvent.CameraZoomChanged, this._onCameraZoomChanged, this);
        EventManager.getInstance().on(SystemEvent.ScreenSizeChanged, this._onScreenSizeChanged, this);
        // 🌟 规范修改：使用枚举监听
        EventManager.getInstance().on(PlayerEvent.TargetChanged, this._onTargetChanged, this);

        // 🌟 解除封印 3A：新的一天开始时，强制刷新视野内所有格子（变干涸、变大）
        EventManager.getInstance().on(TimeEvent.DayBegin, this.refreshAll, this);
    }

    public destroy(): void {
        EventManager.getInstance().off(FarmEvent.CellStateChanged, this._onCellStateChanged, this);
        EventManager.getInstance().off(SystemEvent.CameraZoomChanged, this._onCameraZoomChanged, this);
        EventManager.getInstance().off(SystemEvent.ScreenSizeChanged, this._onScreenSizeChanged, this);
        // 🌟 规范修改：使用枚举监听
        EventManager.getInstance().off(PlayerEvent.TargetChanged, this._onTargetChanged, this);

        EventManager.getInstance().off(TimeEvent.DayBegin, this.refreshAll, this);


        this._activeNodes.clear();
        this._viewCenterRow = -1;
        this._viewCenterCol = -1;
        super.destroy();
    }




    /***********************************事件监听***************************************************** */

    private _onCellStateChanged(payload: { row: number, col: number, newState: ECellState }): void {
        const { row, col, newState } = payload;
        const key = `${row},${col}`;

        const cellData = this._model.getCellData(row, col);
        if (cellData) {
            cellData.state = newState;
        }
        // ✅ 修复点 4：从活跃节点 Map 中获取对应的节点进行刷新
        const node = this._activeNodes.get(key);
        if (node) {
            const cellCtrl = node.getComponent(GroundGridCell);
            if (cellCtrl) {
                cellCtrl.refresh(cellData);
            }
        }

    }

    private _onCameraZoomChanged(payload: { zoomRatio: number }): void {
        this._currentZoomRatio = payload.zoomRatio;
        this._caculateVisibleRowCol();
    }

    private _onScreenSizeChanged() {
        this._caculateVisibleRowCol();
    }

    private _onTargetChanged(payload: { row: number, col: number }): void {
        if (!this._view.cursorNode) return;

        this._view.cursorNode.active = true;
        // 使用同样的神圣坐标转换，光标绝对能完美扣在那个格子上！
        this._view.cursorNode.setPosition(IsoUtils.isoToScreen(payload.row, payload.col));

    }













    public initGridNodes(): void {

        this._view.gridContainer.removeAllChildren();
        // 设置地图节点尺寸，支撑相机边界限制
        this._view.gridContainer.getComponent(UITransform).setContentSize(
            this._model.rows * MapConst.CELL_WIDTH,
            this._model.cols * MapConst.CELL_HEIGHT
        );
        this._activeNodes.clear();

    }

    public refreshAll(): void {
        // 全量刷新：只刷新当前活跃（可视）的节点
        this._activeNodes.forEach((node, key) => {
            const [rStr, cStr] = key.split(',');
            const r = parseInt(rStr);
            const c = parseInt(cStr);
            const cellData = this._model.getCellData(r, c);
            if (cellData) {
                this.refreshCell(r, c, cellData);
            }
        });

    }

    public refreshCell(row: number, col: number, cellData: ICellData): void {
        const key = `${row},${col}`;
        const node = this._activeNodes.get(key);
        if (node) {
            const cellComp = node.getComponent(GroundGridCell);
            if (cellComp) cellComp.refresh(cellData);
        }
    }

    public updateViewport(centerRow: number, centerCol: number): void {

        // 如果中心点没变，直接跳过，节省性能
        if (this._viewCenterRow === centerRow && this._viewCenterCol === centerCol) return;
        this._viewCenterRow = centerRow;
        this._viewCenterCol = centerCol;
        this._caculateVisibleRowCol();
    }

    private _caculateVisibleRowCol(): void {

        const view_size = new Size(window.visualViewport.width, window.visualViewport.height);
        // console.log("view_size: ", view_size);

        view_size.width *= this._currentZoomRatio;
        view_size.height *= this._currentZoomRatio;

        const view_port_rows = Math.ceil(view_size.width / MapConst.CELL_WIDTH) + MapConst.EXTRA_VIEWPORT_ROW;
        const view_port_cols = Math.ceil(view_size.height / MapConst.CELL_HEIGHT) + MapConst.EXTRA_VIEWPORT_COL;

        const halfR = Math.round(view_port_rows / 2);
        const halfC = Math.round(view_port_cols / 2);

        const minRow = Math.max(0, this._viewCenterRow - halfR);
        const maxRow = Math.min(this._model.rows - 1, this._viewCenterRow + halfR);
        const minCol = Math.max(0, this._viewCenterCol - halfC);
        const maxCol = Math.min(this._model.cols - 1, this._viewCenterCol + halfC);

        this._updateVisableCells(minRow, maxRow, minCol, maxCol);
    }

    private _updateVisableCells(minRow: number, maxRow: number, minCol: number, maxCol: number) {
        console.log(`_updateVisableCells: ${minRow}   ${maxRow}  ${minCol}  ${maxCol}`);
        const targetKeys = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                targetKeys.add(`${r},${c}`);
            }
        }

        // 1. 回收超出视口的节点
        const toRecycle: string[] = [];
        for (const key of this._activeNodes.keys()) {
            if (!targetKeys.has(key)) toRecycle.push(key);
        }

        for (const key of toRecycle) {
            const node = this._activeNodes.get(key);
            if (node && node.isValid) {
                PoolManager.getInstance().putNode(node);
            }
            this._activeNodes.delete(key);
        }

        let isNewNodeAdded = false;

        // 2. 创建/取出新进入视口的节点
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const key = `${r},${c}`;
                if (this._activeNodes.has(key)) continue;

                // 从对象池取节点并放入场景
                const node = PoolManager.getInstance().getNode(this._view.groundCellPrefab, this._view.gridContainer);
                node.name = `Cell_${r}_${c}`;
                node.setPosition(IsoUtils.isoToScreen(r, c));
                this._activeNodes.set(key, node);

                isNewNodeAdded = true;

                // 获取业务数据并刷新视觉组件
                const cellData = this._model?.getCellData(r, c) ?? createDefaultCellData(r, c);
                const cellComp = node.getComponent(GroundGridCell);
                if (cellComp) {
                    cellComp.refresh(cellData);
                }
            }
        }

        // ✅ 修复点 3：抛弃绝对索引计算，一旦有新节点加入，执行一次基于 Y 轴深度的排序！
        if (isNewNodeAdded) {
            this._sortVisibleCellsLayer();
        }
    }

    /**
     * 🌟 终极排序方案：Y-Sorting (解决动态加载时的遮挡问题)
     * 等轴测(Isometric)视角下，Y轴坐标越小（越靠下），应当越后渲染（盖在上方）
     */
    private _sortVisibleCellsLayer(): void {
        const children = this._view.gridContainer.children;

        // 按 y 坐标从大到小排序（y越大的在屏幕越上方，应该被压在最底下优先渲染）
        const sortedNodes = children.slice().sort((a, b) => b.position.y - a.position.y);

        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            if (node.getSiblingIndex() !== i) {
                node.setSiblingIndex(i);
            }
        }
    }


}