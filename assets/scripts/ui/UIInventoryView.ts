/**
 * 背包 UI 壳子 — UIInventoryView
 *
 * 职责（薄壳子，只做 UIManager 接入）：
 * - 继承 BaseUI，让 UIManager 能通过 prefab 动态加载并调用 showView / closeView
 * - 持有 @property InventoryView，将 showView / closeView 委托给它
 * - 持有 BaseUIVew（可选），用于通用关闭按钮、遮罩点击关闭、入场动画等
 * - 本身不含任何业务逻辑
 *
 * 打开方式：
 * ```ts
 * UIManager.instance.openView(UIID.Inventory);
 * ```
 *
 * 预制体结构（保存为 UIInventoryView，放入 prefabs/ui/）：
 * ```
 * UIInventoryView (挂本组件 UIInventoryView + BaseUIVew)
 *   └── InventoryView (挂 InventoryView 组件)
 *         ├── BtnTabAll / BtnTabSeed / BtnTabCrop
 *         ├── TabIndicatorAll / TabIndicatorSeed / TabIndicatorCrop
 *         ├── ItemList            ← CommonList
 *         └── DetailPanel         ← 详情面板
 * ```
 * BaseUIVew 的 btnClose / maskClose 挂在 UIInventoryView 根节点层，
 * 点击后调用 BaseUIVew.closeUIView() → UIManager.closeView(UIID.Inventory)。
 */

import { _decorator } from 'cc';
import { BaseUI } from '../common/ui/base/BaseUI';

const { ccclass, property } = _decorator;


// ─────────────────────────────────────────────────────────────────────────────
// UIInventoryView
// ─────────────────────────────────────────────────────────────────────────────

@ccclass('UIInventoryView')
export class UIInventoryView extends BaseUI {

    // /** 背包功能主体，挂在子节点上 */
    // @property({ type: InventoryView, tooltip: '背包功能组件（InventoryView），挂在子节点上' })
    // inventoryView: InventoryView = null!;

    // /** 通用界面组件：关闭按钮、遮罩、入场动画（可选） */
    // private _baseUIView: BaseUIVew;

    // // ── Cocos 生命周期 ────────────────────────────────────────────────────────

    // protected onLoad(): void {
    //     this._baseUIView = this.node.getComponentInChildren(BaseUIVew);
    // }

    // // ── BaseUI 生命周期 ───────────────────────────────────────────────────────

    // /**
    //  * showView：UIManager 打开背包时调用
    //  * 无需 params（数据来自 InventoryManager 单例）
    //  */
    // protected showView(_params: any): void {
    //     super.showView(_params);
    //     this._baseUIView?.showView();
    //     this.inventoryView?.showView();
    // }

    // /**
    //  * closeView：UIManager 关闭背包时调用
    //  */
    // protected closeView(): void {
    //     this.inventoryView?.closeView();
    // }
}
