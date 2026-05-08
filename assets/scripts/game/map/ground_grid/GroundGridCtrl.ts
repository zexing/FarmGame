import { _decorator, Node, Size, UITransform, view } from 'cc';
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
    private _lastZoomRatio: number = 1.0;
    private _isScreenSizeChange: boolean = false;


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
        this.updateViewport(this._viewCenterRow, this._viewCenterCol);
    }

    private _onScreenSizeChanged() {
        this._isScreenSizeChange = true;
        this.updateViewport(this._viewCenterRow, this._viewCenterCol);
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



    /**
     * 🌟 纯逻辑驱动的视口更新
     * @param centerRow 玩家/相机当前所在的逻辑行
     * @param centerCol 玩家/相机当前所在的逻辑列
     * @param zoomScale 当前的缩放比例
     */
    public updateViewport(centerRow: number, centerCol: number): void {
        // 性能判定：如果中心逻辑点没变，且缩放没变，则完全不需要刷新！
        if (this._viewCenterRow === centerRow &&
            this._viewCenterCol === centerCol &&
            this._lastZoomRatio === this._currentZoomRatio &&
            !this._isScreenSizeChange) {
            return;
        }

        this._viewCenterRow = centerRow;
        this._viewCenterCol = centerCol;
        this._lastZoomRatio = this._currentZoomRatio;
        this._isScreenSizeChange = false;

        // 🌟 1. 根据中心点获取当前可见的网格集合
        const newVisibleKeys = this._getVisibleKeysByRadius(centerRow, centerCol);

        let isNewNodeAdded = false;

        // 2. 移除旧格子
        for (const [key, node] of this._activeNodes.entries()) {
            if (!newVisibleKeys.has(key)) {
                PoolManager.getInstance().putNode(node);
                this._activeNodes.delete(key);
            }
        }

        // 3. 新增新格子
        for (const key of newVisibleKeys) {
            if (!this._activeNodes.has(key)) {
                const [rowStr, colStr] = key.split('_');
                const r = parseInt(rowStr);
                const c = parseInt(colStr);

                const node = PoolManager.getInstance().getNode(this._view.groundCellPrefab, this._view.gridContainer);
                node.name = `Cell_${r}_${c}`;
                node.setPosition(IsoUtils.isoToScreen(r, c));
                this._activeNodes.set(key, node);

                isNewNodeAdded = true;

                const cellData = this._model?.getCellData(r, c) ?? createDefaultCellData(r, c);
                const cellComp = node.getComponent(GroundGridCell);
                if (cellComp) cellComp.refresh(cellData);
            }
        }

        if (isNewNodeAdded) {
            this._sortVisibleCellsLayer();
        }
    }

    /**
         * 🌟 核心算法：基于逻辑中心的动态半径扩散 + 隐藏的矩形裁剪
         */
    private _getVisibleKeysByRadius(centerRow: number, centerCol: number): Set<string> {
        const newVisibleKeys = new Set<string>();
        // 1. 正确的物理世界视口大小
        const viewSize = new Size(view.getVisibleSize().width * this._currentZoomRatio, view.getVisibleSize().height * this._currentZoomRatio);

        // 🌟 2. 优化遍历半径计算
        // 没必要用勾股定理求对角线，把宽高分别除以格子的宽高尺寸，得出 x 和 y 方向的格子跨度，取最大值即可
        const spanX = (viewSize.width / 2) / MapConst.CELL_WIDTH;
        const spanY = (viewSize.height / 2) / MapConst.CELL_HEIGHT;
        // 半径 = 最大跨度 + 2层余量
        const view_cells_count = Math.ceil(spanX + spanY) + 2;

        // 3. 框出逻辑遍历范围
        let minR = Math.max(0, centerRow - view_cells_count);
        let maxR = Math.min(this._model.rows - 1, centerRow + view_cells_count);
        let minC = Math.max(0, centerCol - view_cells_count);
        let maxC = Math.min(this._model.cols - 1, centerCol + view_cells_count);

        // 4. AABB 裁剪中心点 (整数格子的中心)
        const centerWorldPos = IsoUtils.isoToScreen(centerRow, centerCol);

        // 🌟 5. 核心修复：加大 Padding 掩盖跳跃！
        // 因为 centerWorldPos 是离散跳跃的，当玩家走到格子最边缘时，距离中心点最多偏离一个 CELL_WIDTH/HEIGHT。
        // 所以这里的容错 Padding 必须加大到 1.5 ~ 2 个格子尺寸，才能保证边缘绝不闪烁！
        const halfW = viewSize.width / 2 + MapConst.CELL_WIDTH * 2;
        const halfH = viewSize.height / 2 + MapConst.CELL_HEIGHT * 2;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {

                // 剔除超出物理屏幕的菱形尖角（强力省 DrawCall！）
                const pos = IsoUtils.isoToScreen(r, c);
                if (Math.abs(pos.x - centerWorldPos.x) > halfW ||
                    Math.abs(pos.y - centerWorldPos.y) > halfH) {
                    continue;
                }

                newVisibleKeys.add(`${r}_${c}`);
            }
        }

        return newVisibleKeys;
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