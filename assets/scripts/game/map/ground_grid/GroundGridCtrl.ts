import { _decorator, Node, UITransform, view } from 'cc';
import { PoolManager } from 'db://assets/scripts/common/manager/PoolManager';
import { ECellState, MapConst } from 'db://assets/scripts/const/GameDefine';
import { createDefaultCellData, ICellData, IMapModel, IMapView } from 'db://assets/scripts/game/map/IMap';
import { EventManager } from '../../../common/manager/EventManager';
import { FarmEvents, SystemEvents, TimeEvents } from '../../../events';
import { PlayerEvents } from '../../../events/PlayerEvents';
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
        EventManager.getInstance().on(FarmEvents.CellStateChanged, this._onCellStateChanged, this);
        EventManager.getInstance().on(SystemEvents.CameraZoomChanged, this._onCameraZoomChanged, this);
        EventManager.getInstance().on(SystemEvents.ScreenSizeChanged, this._onScreenSizeChanged, this);
        // 🌟 规范修改：使用枚举监听
        EventManager.getInstance().on(PlayerEvents.TargetChanged, this._onTargetChanged, this);

        // 🌟 解除封印 3A：新的一天开始时，强制刷新视野内所有格子（变干涸、变大）
        EventManager.getInstance().on(TimeEvents.DayBegin, this.refreshAll, this);
    }

    public destroy(): void {
        EventManager.getInstance().off(FarmEvents.CellStateChanged, this._onCellStateChanged, this);
        EventManager.getInstance().off(SystemEvents.CameraZoomChanged, this._onCameraZoomChanged, this);
        EventManager.getInstance().off(SystemEvents.ScreenSizeChanged, this._onScreenSizeChanged, this);
        // 🌟 规范修改：使用枚举监听
        EventManager.getInstance().off(PlayerEvents.TargetChanged, this._onTargetChanged, this);

        EventManager.getInstance().off(TimeEvents.DayBegin, this.refreshAll, this);


        this._activeNodes.clear();
        this._viewCenterRow = -1;
        this._viewCenterCol = -1;
        super.destroy();
    }




    /***********************************事件监听***************************************************** */

    private _onCellStateChanged(payload: { row: number, col: number, newState: ECellState }): void {
        const { row, col, newState } = payload;
        const key = `${row}_${col}`;

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
        const key = `${row}_${col}`;
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
     * 🌟 终极算法：纯逻辑驱动的虚拟四角包裹法 (硬核日志诊断版)
     */
    private _getVisibleKeysByRadius(centerRow: number, centerCol: number): Set<string> {
        const newVisibleKeys = new Set<string>();
        const visibleSize = view.getVisibleSize();

        // 1. 计算世界视口真实尺寸
        const worldViewW = visibleSize.width * this._currentZoomRatio;
        const worldViewH = visibleSize.height * this._currentZoomRatio;

        // 2. 虚拟物理中心点
        const centerWorldPos = IsoUtils.isoToScreen(centerRow, centerCol);

        // 3. 计算加上安全边距后的虚拟屏幕边界
        const paddingX = MapConst.CELL_WIDTH * 2;
        const paddingY = MapConst.CELL_HEIGHT * 2;

        const left = centerWorldPos.x - worldViewW / 2 - paddingX;
        const right = centerWorldPos.x + worldViewW / 2 + paddingX;
        const top = centerWorldPos.y + worldViewH / 2 + paddingY;
        const bottom = centerWorldPos.y - worldViewH / 2 - paddingY;

        // 4. 降维打击：利用虚拟屏幕的 4 个角，逆推绝对精准的逻辑网格极限！
        const tl = IsoUtils.screenToIso(left, top);
        const tr = IsoUtils.screenToIso(right, top);
        const bl = IsoUtils.screenToIso(left, bottom);
        const br = IsoUtils.screenToIso(right, bottom);

        // 5. 获得绝对精确的逻辑包围盒
        let minR = Math.min(tl.row, tr.row, bl.row, br.row);
        let maxR = Math.max(tl.row, tr.row, bl.row, br.row);
        let minC = Math.min(tl.col, tr.col, bl.col, br.col);
        let maxC = Math.max(tl.col, tr.col, bl.col, br.col);

        // 限制在地图边界内
        minR = Math.max(0, minR);
        maxR = Math.min(this._model.rows - 1, maxR);
        minC = Math.max(0, minC);
        maxC = Math.min(this._model.cols - 1, maxC);

        // 6. 精确遍历与 AABB 尖角裁切
        const halfW = worldViewW / 2 + paddingX;
        const halfH = worldViewH / 2 + paddingY;

        let totalLooped = 0; // 用于统计性能

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                totalLooped++;
                const pos = IsoUtils.isoToScreen(r, c);
                if (Math.abs(pos.x - centerWorldPos.x) > halfW ||
                    Math.abs(pos.y - centerWorldPos.y) > halfH) {
                    continue;
                }

                newVisibleKeys.add(`${r}_${c}`);
            }
        }

        // // ==========================================
        // // 🔴 核心诊断日志 (Diagnostic Logs) 🔴
        // // ==========================================
        // console.group(`[GroundGridCtrl] 视口刷新诊断 @ Zoom: ${this._currentZoomRatio.toFixed(2)}`);
        // console.log(`1. 输入参数 -> 逻辑中心: [${centerRow}, ${centerCol}], 缩放值(Zoom): ${this._currentZoomRatio}`);
        // console.log(`2. 屏幕尺寸 -> VisibleSize: [${visibleSize.width} x ${visibleSize.height}]`);
        // console.log(`3. 世界视窗 -> WorldView: [${worldViewW.toFixed(1)} x ${worldViewH.toFixed(1)}] (按乘法计算)`);
        // console.log(`4. 物理边界 -> L:${left.toFixed(0)}, R:${right.toFixed(0)}, T:${top.toFixed(0)}, B:${bottom.toFixed(0)}`);
        // console.log(`5. 逆推四角 -> TL:[${tl.row},${tl.col}], TR:[${tr.row},${tr.col}], BL:[${bl.row},${bl.col}], BR:[${br.row},${br.col}]`);
        // console.log(`6. 逻辑盒子 -> Row范围: ${minR} 到 ${maxR}, Col范围: ${minC} 到 ${maxC}`);
        // console.log(`7. 遍历统计 -> 双层循环次数: ${totalLooped}, 实际保留格子(DrawCall): ${newVisibleKeys.size}`);
        // console.groupEnd();

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