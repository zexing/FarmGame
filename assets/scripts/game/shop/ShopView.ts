// /**
//  * 商店视图层 — ShopView
//  *
//  * 职责（大控制器，只做"连线"）：
//  * - 继承 BaseUI，通过 UIManager 动态加载（prefab: UIShopView）
//  * - 在 showView(params) 中完成 ShopModel + ShopController 的 MVC 三件套组装
//  * - 实现 IShopView 接口，调用 CommonList.updateData() 驱动列表渲染
//  * - 管理 Tab 切换（购买 / 出售），切换时将包装后的 IShopCellData[] 传入 CommonList
//  * - 订阅 ShopUIEvent.BuyItem / SellItem，驱动 ShopController 执行买卖
//  * - 订阅 ShopEvent.ItemBought / ItemSold，买卖成功后刷新当前列表
//  * - 关闭时调用 UIManager.instance.closeView(UIID.Shop)
//  *
//  * 不负责：
//  * - 具体格子的渲染（CommonList + ShopItemCell 负责）
//  * - 节点回收与对象池（CommonList 内部使用 PoolManager 处理）
//  * - 金币 UI 更新（GoldPanel 自动监听 PlayerEvents.GoldChanged）
//  * - 实际买卖逻辑（ShopController）
//  *
//  * 打开方式（从任意脚本调用）：
//  * ```ts
//  * UIManager.instance.openView(UIID.Shop, { playerCtrl: this.playerView.controller });
//  * ```
//  *
//  * 节点结构（保存为 UIShopView 预制体，放入 prefabs/ui/）：
//  * ```
//  * UIShopView (挂本组件)
//  *   ├── BtnClose            ← 关闭按钮
//  *   ├── TabBar
//  *   │     ├── BtnTabBuy     ← 购买 Tab 按钮
//  *   │     └── BtnTabSell    ← 出售 Tab 按钮
//  *   ├── TabIndicatorBuy     ← 购买 Tab 选中指示器（active 控制）
//  *   ├── TabIndicatorSell    ← 出售 Tab 选中指示器
//  *   └── ItemList            (挂 CommonList 组件，ListType=PrefabItem，TaberType=NoneChoice)
//  *                            prefabNode = ShopItemCellPrefab（isPoolPrefab 勾选 true）
//  * ```
//  */

// import { _decorator, EventTouch, Node } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { CommonList } from '../../common/component/list/CommonList';
// import { EventManager } from '../../common/manager/EventManager';
// import { UIManager } from '../../common/manager/UIManager';
// import { UIID } from '../../common/ui/base/UIConfig';
// import { ShopEvent, ShopUIEvent } from '../../events/FarmEvents';
// import { PlayerController } from '../player/PlayerController';
// import { IShopBuyItem, IShopCellData, IShopModel, IShopSellItem, IShopView } from './IShop';
// import { ShopController } from './ShopController';
// import { ShopModel } from './ShopModel';


// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // 当前 Tab 类型
// // ─────────────────────────────────────────────────────────────────────────────

// export type ShopTab = 'buy' | 'sell';


// // ─────────────────────────────────────────────────────────────────────────────
// // ShopView
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('ShopView')
// export class ShopView extends BaseComponent implements IShopView {

//     // ── Editor 属性 ──────────────────────────────────────────────────────────

//     /**
//      * 商品列表组件（CommonList）
//      * Inspector 设置：ListType = PrefabItem，TaberType = NoneChoice
//      * prefabNode 拖入 ShopItemCellPrefab（其 CommonListItem.isPoolPrefab 已勾选）
//      */
//     @property({ type: CommonList, tooltip: '商品列表，CommonList 组件，ListType=PrefabItem，TaberType=NoneChoice' })
//     itemList: CommonList = null!;

//     /** 关闭按钮 */
//     @property({ type: Node, tooltip: '关闭按钮，点击后调用 UIManager.closeView(UIID.Shop)' })
//     btnClose: Node = null!;

//     /** 购买 Tab 按钮 */
//     @property({ type: Node, tooltip: '购买 Tab 按钮，点击后切换到购买列表' })
//     btnTabBuy: Node = null!;

//     /** 出售 Tab 按钮 */
//     @property({ type: Node, tooltip: '出售 Tab 按钮，点击后切换到出售列表' })
//     btnTabSell: Node = null!;

//     // ── 运行时 ────────────────────────────────────────────────────────────────

//     private _model: IShopModel | null = null;
//     private _controller: ShopController | null = null;
//     private _currentTab: ShopTab = 'buy';

//     /**
//      * 透传参数
//      */
//     public params: any;

//     // ── BaseUI 生命周期 ───────────────────────────────────────────────────────

//     /**
//      * showView 在两种情况下被调用：
//      *   1. 首次打开（start → showView）
//      *   2. 重复打开（onAdded → showView）
//      *
//      * params 结构：
//      * ```ts
//      * {
//      *   playerCtrl: PlayerController;   // 必须，用于扣/增金币
//      *   defaultTab?: ShopTab;           // 可选，默认 'buy'
//      * }
//      * ```
//      */
//     public showView(params: {
//         playerCtrl: PlayerController;
//         defaultTab?: ShopTab;
//     }): void {

//         // ── 首次打开时才创建 MVC 三件套 ────────────────────────────────────
//         if (!this._model) {
//             this._model = new ShopModel();
//             this._controller = new ShopController();
//             this._controller.init(this._model, this);
//         }

//         // ── 每次打开都重新注入 PlayerController（防止引用变化）─────────────
//         if (params?.playerCtrl) {
//             this._controller!.setPlayerController(params.playerCtrl);
//         } else {
//             console.warn('[ShopView] params.playerCtrl 未传入，买卖操作将无法扣/增金币');
//         }

//         // ── 绑定按钮（幂等：先 off 再 on，避免重复绑定）────────────────────
//         this._bindButtons();

//         // ── 订阅买卖 UI 事件 ────────────────────────────────────────────────
//         const em = EventManager.instance;
//         em.on(ShopUIEvent.BuyItem, this._onBuyItem, this);
//         em.on(ShopUIEvent.SellItem, this._onSellItem, this);
//         em.on(ShopEvent.ItemBought, this._onItemBought, this);
//         em.on(ShopEvent.ItemSold, this._onItemSold, this);

//         // ── 切换到指定 Tab ──────────────────────────────────────────────────
//         this._switchTab(params?.defaultTab ?? 'buy');

//         console.log('[ShopView] 已打开');
//     }

//     /**
//      * closeView 由框架在 UIManager.closeView(UIID.Shop) 时调用（onRemoving → closeView）
//      * 解绑事件；CommonList 的节点回收由框架销毁节点时自动触发
//      */
//     protected closeView(): void {
//         const em = EventManager.instance;
//         em.off(ShopUIEvent.BuyItem, this._onBuyItem, this);
//         em.off(ShopUIEvent.SellItem, this._onSellItem, this);
//         em.off(ShopEvent.ItemBought, this._onItemBought, this);
//         em.off(ShopEvent.ItemSold, this._onItemSold, this);

//         console.log('[ShopView] 已关闭');
//     }

//     // ── IShopView 接口实现 ────────────────────────────────────────────────────

//     /**
//      * 将购买列表包装为 IShopCellData[]，通过 CommonList.updateData() 驱动渲染
//      */
//     public refreshBuyList(items: IShopBuyItem[]): void {
//         const data: IShopCellData[] = items.map(item => ({ mode: 'buy', item }));
//         this.itemList?.updateData(data);
//     }

//     /**
//      * 将出售列表包装为 IShopCellData[]，通过 CommonList.updateData() 驱动渲染
//      */
//     public refreshSellList(items: IShopSellItem[]): void {
//         const data: IShopCellData[] = items.map(item => ({ mode: 'sell', item }));
//         this.itemList?.updateData(data);
//     }

//     // ── Tab 切换 ──────────────────────────────────────────────────────────────

//     private _onTabBuy(e: EventTouch): void {
//         e.propagationStopped = true;
//         this._switchTab('buy');
//     }

//     private _onTabSell(e: EventTouch): void {
//         e.propagationStopped = true;
//         this._switchTab('sell');
//     }

//     private _switchTab(tab: ShopTab): void {
//         this._currentTab = tab;

//         // // 更新指示器
//         // if (this.tabIndicatorBuy)  this.tabIndicatorBuy.active  = tab === 'buy';
//         // if (this.tabIndicatorSell) this.tabIndicatorSell.active = tab === 'sell';

//         // 刷新列表
//         this._refreshCurrentTab();
//     }

//     // ── 买卖事件处理 ──────────────────────────────────────────────────────────

//     private _onBuyItem(payload: { seedId: string; count: number }): void {
//         this._controller?.buy(payload.seedId, payload.count);
//     }

//     private _onSellItem(payload: { cropId: string; count: number }): void {
//         this._controller?.sell(payload.cropId, payload.count);
//     }

//     private _onItemBought(): void {
//         if (this._currentTab === 'buy') {
//             this._refreshCurrentTab();
//         }
//     }

//     private _onItemSold(): void {
//         if (this._currentTab === 'sell') {
//             this._refreshCurrentTab();
//         }
//     }

//     // ── 内部：关闭按钮 ────────────────────────────────────────────────────────

//     private _onBtnClose(e: EventTouch): void {
//         e.propagationStopped = true;
//         UIManager.instance.closeView(UIID.Shop);
//     }

//     // ── 内部：按钮绑定（幂等）────────────────────────────────────────────────

//     private _bindButtons(): void {
//         this.btnClose?.off(Node.EventType.TOUCH_END, this._onBtnClose, this);
//         this.btnTabBuy?.off(Node.EventType.TOUCH_END, this._onTabBuy, this);
//         this.btnTabSell?.off(Node.EventType.TOUCH_END, this._onTabSell, this);

//         this.btnClose?.on(Node.EventType.TOUCH_END, this._onBtnClose, this);
//         this.btnTabBuy?.on(Node.EventType.TOUCH_END, this._onTabBuy, this);
//         this.btnTabSell?.on(Node.EventType.TOUCH_END, this._onTabSell, this);
//     }

//     // ── 内部：刷新当前 Tab ────────────────────────────────────────────────────

//     private _refreshCurrentTab(): void {
//         if (!this._controller) return;

//         if (this._currentTab === 'buy') {
//             const playerLevel: number = (this.params?.playerCtrl as PlayerController)?.level ?? 1;
//             this.refreshBuyList(this._controller.getBuyList(playerLevel));
//         } else {
//             this.refreshSellList(this._controller.getSellList());
//         }
//     }
// }
