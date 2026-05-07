// /**
//  * 格子操作菜单视图 — ActionMenuView
//  *
//  * 职责：
//  * - 管理 6 个操作按钮（开垦 / 播种 / 浇水 / 施肥 / 收获 / 清除）的显示与点击
//  * - 由 FarmView 调用 show() / hide() 控制菜单出现；内部按钮点击通过
//  *   EventManager 广播 FarmUIEvent 事件，FarmView（或其持有的 Controller）订阅并执行
//  * - 管理全屏遮罩（MenuCloseArea），点击空白处自动关闭菜单
//  *
//  * 节点结构（在 Cocos Editor 中搭建）：
//  * ```
//  * ActionMenuView (挂本组件，挂在 FarmView 下)
//  *   ├── MenuCloseArea     ← 全屏透明遮罩（zIndex 低于按钮容器）
//  *   └── ActionMenu        ← 按钮容器（弹入动画的根节点）
//  *         ├── BtnTill     ← 开垦
//  *         ├── BtnPlant    ← 播种
//  *         ├── BtnWater    ← 浇水
//  *         ├── BtnFertilize← 施肥
//  *         ├── BtnHarvest  ← 收获
//  *         └── BtnClear    ← 清除枯萎
//  * ```
//  *
//  * 事件派发（通知 FarmController 执行逻辑）：
//  *   FarmUIEvent.BtnTillTapped       → FarmController.tillCell()
//  *   FarmUIEvent.BtnPlantTapped      → FarmController（含当前格子坐标）
//  *   FarmUIEvent.BtnWaterTapped      → FarmController.waterCell()
//  *   FarmUIEvent.BtnFertilizeTapped  → FarmController.fertilizeCell()
//  *   FarmUIEvent.BtnHarvestTapped    → FarmController.harvestCell()
//  *   FarmUIEvent.BtnClearTapped      → FarmController.clearWitheredCell()
//  */

// import { _decorator, EventTouch, Node, tween, v3 } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { EventManager } from '../../common/manager/EventManager';
// import { CellState, MapConst } from '../../const/GameDefine';
// import { FarmUIEvent } from '../../events/FarmEvents';
// import { ICellData } from '../farm/IFarm';

// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // ActionMenuView
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('ActionMenuView')
// export class ActionMenuView extends BaseComponent {

//     // ── Editor 属性 ──────────────────────────────────────────────────────────

//     /** 操作菜单按钮容器根节点（弹入动画对象） */
//     @property({ type: Node, tooltip: '操作菜单的按钮容器根节点，show() 时执行弹入动画' })
//     actionMenu: Node = null!;

//     /** 全屏透明遮罩（菜单打开时激活，点击任意空白处关闭菜单，zIndex 低于 actionMenu） */
//     @property({ type: Node, tooltip: '全屏透明遮罩层，菜单打开时激活，点击空白处关闭菜单（zIndex 低于 actionMenu）' })
//     menuCloseArea: Node = null!;

//     /** 开垦按钮（格子为 Empty 时显示） */
//     @property({ type: Node, tooltip: '开垦按钮，格子为 Empty 状态时显示' })
//     btnTill: Node = null!;

//     /** 播种按钮（格子为 Tilled 时显示） */
//     @property({ type: Node, tooltip: '播种按钮，格子为 Tilled 状态时显示' })
//     btnPlant: Node = null!;

//     /** 浇水按钮（格子为 Planted 且今日未浇水时显示） */
//     @property({ type: Node, tooltip: '浇水按钮，格子为 Planted 且今日未浇水时显示' })
//     btnWater: Node = null!;

//     /** 施肥按钮（格子为 Planted 且今日未施肥时显示） */
//     @property({ type: Node, tooltip: '施肥按钮，格子为 Planted 且今日未施肥时显示' })
//     btnFertilize: Node = null!;

//     /** 收获按钮（格子为 Harvestable 时显示） */
//     @property({ type: Node, tooltip: '收获按钮，格子为 Harvestable 状态时显示' })
//     btnHarvest: Node = null!;

//     /** 清除枯萎按钮（格子为 Withered 时显示） */
//     @property({ type: Node, tooltip: '清除枯萎按钮，格子为 Withered 状态时显示' })
//     btnClear: Node = null!;

//     // ── 运行时状态 ────────────────────────────────────────────────────────────

//     /** 当前菜单对应的格子坐标（未激活时为 -1） */
//     private _targetRow: number = -1;
//     private _targetCol: number = -1;

//     // ── Cocos 生命周期 ────────────────────────────────────────────────────────

//     protected onLoad(): void {
//         // 初始隐藏菜单和遮罩
//         this._setMenuVisible(false);

//         // 绑定按钮点击
//         this.btnTill?.on(Node.EventType.TOUCH_END,      this._onBtnTill,      this);
//         this.btnPlant?.on(Node.EventType.TOUCH_END,     this._onBtnPlant,     this);
//         this.btnWater?.on(Node.EventType.TOUCH_END,     this._onBtnWater,     this);
//         this.btnFertilize?.on(Node.EventType.TOUCH_END, this._onBtnFertilize, this);
//         this.btnHarvest?.on(Node.EventType.TOUCH_END,   this._onBtnHarvest,   this);
//         this.btnClear?.on(Node.EventType.TOUCH_END,     this._onBtnClear,     this);

//         // 遮罩点击 → 关闭菜单
//         this.menuCloseArea?.on(Node.EventType.TOUCH_END, this._onCloseAreaTouched, this);
//     }

//     protected onDestroy(): void {
//         this.btnTill?.off(Node.EventType.TOUCH_END,      this._onBtnTill,      this);
//         this.btnPlant?.off(Node.EventType.TOUCH_END,     this._onBtnPlant,     this);
//         this.btnWater?.off(Node.EventType.TOUCH_END,     this._onBtnWater,     this);
//         this.btnFertilize?.off(Node.EventType.TOUCH_END, this._onBtnFertilize, this);
//         this.btnHarvest?.off(Node.EventType.TOUCH_END,   this._onBtnHarvest,   this);
//         this.btnClear?.off(Node.EventType.TOUCH_END,     this._onBtnClear,     this);
//         this.menuCloseArea?.off(Node.EventType.TOUCH_END, this._onCloseAreaTouched, this);
//     }

//     // ── 公开接口（由 FarmView 调用）──────────────────────────────────────────

//     /**
//      * 显示操作菜单
//      *
//      * @param row      格子行坐标
//      * @param col      格子列坐标
//      * @param cell     格子运行时数据（决定哪些按钮可见）
//      * @param screenPos 菜单显示的屏幕本地坐标（由 FarmView 计算传入）
//      */
//     public show(row: number, col: number, cell: ICellData, screenPos: { x: number; y: number }): void {
//         if (cell.state === CellState.Locked) return;

//         this._targetRow = row;
//         this._targetCol = col;

//         // 更新按钮可见性
//         this._updateButtonVisibility(cell);

//         // 定位到格子上方
//         if (this.actionMenu) {
//             this.actionMenu.setPosition(v3(screenPos.x, screenPos.y + MapConst.CELL_HEIGHT * 2, 0));
//         }

//         // 激活遮罩（先于菜单，确保层级正确）
//         this._setMenuVisible(true);

//         // 弹入动画
//         if (this.actionMenu) {
//             this.actionMenu.setScale(0.1, 0.1, 1);
//             tween(this.actionMenu)
//                 .to(0.12, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
//                 .start();
//         }
//     }

//     /**
//      * 隐藏操作菜单
//      */
//     public hide(): void {
//         this._setMenuVisible(false);
//         this._targetRow = -1;
//         this._targetCol = -1;
//     }

//     /** 当前是否有菜单处于激活状态 */
//     public get isVisible(): boolean {
//         return this._targetRow >= 0;
//     }

//     // ── 私有：按钮可见性 ──────────────────────────────────────────────────────

//     private _updateButtonVisibility(cell: ICellData): void {
//         const s = cell.state;
//         this._setVisible(this.btnTill,      s === CellState.Untilled);
//         this._setVisible(this.btnPlant,     s === CellState.Tilled);
//         this._setVisible(this.btnWater,     s === CellState.Planted && !cell.wateredToday);
//         this._setVisible(this.btnFertilize, s === CellState.Planted && !cell.fertilizedToday);
//         this._setVisible(this.btnHarvest,   s === CellState.Harvestable);
//         this._setVisible(this.btnClear,     s === CellState.Withered);
//     }

//     private _setVisible(node: Node, visible: boolean): void {
//         if (node) node.active = visible;
//     }

//     private _setMenuVisible(visible: boolean): void {
//         if (this.actionMenu)    this.actionMenu.active    = visible;
//         if (this.menuCloseArea) this.menuCloseArea.active = visible;
//     }

//     // ── 按钮事件处理（派发事件，由 FarmView 订阅执行）────────────────────────

//     private _onBtnTill(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnTillTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onBtnPlant(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnPlantTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onBtnWater(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnWaterTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onBtnFertilize(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnFertilizeTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onBtnHarvest(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnHarvestTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onBtnClear(e: EventTouch): void {
//         e.propagationStopped = true;
//         if (this._targetRow < 0) return;
//         EventManager.instance.dispatchEvent(FarmUIEvent.BtnClearTapped, {
//             row: this._targetRow, col: this._targetCol,
//         });
//         this.hide();
//     }

//     private _onCloseAreaTouched(e: EventTouch): void {
//         e.propagationStopped = true;
//         this.hide();
//     }
// }
