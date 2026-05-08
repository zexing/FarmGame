// /**
//  * 商店业务控制层 — ShopController
//  *
//  * 职责：
//  * - 执行买入（种子）/ 卖出（作物）的完整业务逻辑
//  * - 依赖注入：PlayerController（金币增减）、InventoryManager（背包增减）
//  * - 买卖完成后派发 ShopEvent，并驱动 ShopView 刷新列表
//  *
//  * 不负责：
//  * - UI 更新（GoldPanel 自动监听 PlayerEvents.GoldChanged）
//  * - 列表数据的渲染（由 ShopView → ShopItemListView 完成）
//  *
//  * 调用链示例（购买）：
//  *   ShopView._onBuyItem()
//  *     → this._controller.buy(seedId, count)
//  *       → playerCtrl.spendGold(totalCost)      // 自动派发 GoldChanged
//  *       → InventoryManager.add(seedId, count)  // 自动派发 ItemAdded
//  *       → dispatch ShopEvent.ItemBought
//  *     → ShopView.refreshCurrentTab()           // 刷新列表数量
//  */

// import { EventManager } from '../../common/manager/EventManager';
// import { UIManager } from '../../common/manager/UIManager';
// import { UIID } from '../../common/ui/base/UIConfig';
// import { ShopEvent } from '../../events/FarmEvents';
// import { BaseMVCController } from '../../mvc/BaseMVCController';
// import { InventoryManager } from '../inventory/InventoryManager';
// import { PlayerController } from '../player/PlayerController';
// import { IShopBuyItem, IShopModel, IShopSellItem, IShopView } from './IShop';


// export class ShopController extends BaseMVCController<IShopModel, IShopView> {

//     // ── 外部依赖（ShopView.onMVCReady 注入）─────────────────────────────────

//     private _playerCtrl: PlayerController | null = null;

//     // ── BaseController 生命周期 ───────────────────────────────────────────────

//     protected onInit(): void {
//         // PlayerController 通过 setPlayerController() 注入，此处无需操作
//         console.log('[ShopController] 初始化完成');
//     }

//     protected onDestroy(): void {
//         this._playerCtrl = null;
//         console.log('[ShopController] 已销毁');
//     }

//     // ── 依赖注入 ──────────────────────────────────────────────────────────────

//     /**
//      * 注入 PlayerController（ShopView.onMVCReady 中调用）
//      * 必须在首次 buy/sell 前完成注入，否则操作会失败
//      */
//     public setPlayerController(ctrl: PlayerController): void {
//         this._playerCtrl = ctrl;
//     }

//     // ── 公开接口：购买 ────────────────────────────────────────────────────────

//     /**
//      * 购买种子
//      *
//      * @param seedId 种子 ID，如 'seed_radish'
//      * @param count  购买数量（默认 1）
//      * @returns true = 购买成功；false = 金币不足或参数异常
//      */
//     public buy(seedId: string, count: number = 1): boolean {
//         if (!this._playerCtrl) {
//             console.error('[ShopController] PlayerController 未注入');
//             return false;
//         }

//         const unitPrice = this.model.getSeedPrice(seedId);
//         if (unitPrice <= 0) {
//             console.warn(`[ShopController] 找不到种子价格: ${seedId}`);
//             return false;
//         }

//         const totalCost = unitPrice * count;

//         // 扣除金币（内部自动检查余额并显示"金币不足" Toast）
//         if (!this._playerCtrl.spendGold(totalCost, `购买种子 ${seedId} ×${count}`)) {
//             return false;
//         }

//         // 加入背包
//         InventoryManager.instance.add(seedId, count);

//         // 派发业务事件
//         EventManager.instance.dispatchEvent(ShopEvent.ItemBought, {
//             seedId,
//             count,
//             totalCost,
//         });

//         UIManager.instance.openView(UIID.Toast, {
//             text: `购买成功 ×${count}（-${totalCost} 金币）`,
//         });

//         console.log(`[ShopController] 购买 ${seedId} ×${count}，花费 ${totalCost} 金币`);
//         return true;
//     }

//     // ── 公开接口：出售 ────────────────────────────────────────────────────────

//     /**
//      * 出售作物
//      *
//      * @param cropId 作物 ID，如 'crop_radish'
//      * @param count  出售数量（默认为全部）
//      * @returns true = 出售成功；false = 背包数量不足或参数异常
//      */
//     public sell(cropId: string, count: number): boolean {
//         if (!this._playerCtrl) {
//             console.error('[ShopController] PlayerController 未注入');
//             return false;
//         }

//         const unitPrice = this.model.getCropSellPrice(cropId);
//         if (unitPrice <= 0) {
//             console.warn(`[ShopController] 找不到作物售价: ${cropId}`);
//             return false;
//         }

//         // 从背包扣除（内部检查数量是否充足）
//         if (!InventoryManager.instance.remove(cropId, count)) {
//             UIManager.instance.openView(UIID.Toast, {
//                 text: '背包中数量不足',
//             });
//             return false;
//         }

//         // 增加金币
//         const totalEarned = unitPrice * count;
//         this._playerCtrl.addGold(totalEarned);

//         // 派发业务事件
//         EventManager.instance.dispatchEvent(ShopEvent.ItemSold, {
//             cropId,
//             count,
//             totalEarned,
//         });

//         UIManager.instance.openView(UIID.Toast, {
//             text: `出售成功 ×${count}（+${totalEarned} 金币）`,
//         });

//         console.log(`[ShopController] 出售 ${cropId} ×${count}，获得 ${totalEarned} 金币`);
//         return true;
//     }

//     // ── 数据查询（供 ShopView 构建列表）──────────────────────────────────────

//     /**
//      * 获取购买列表数据
//      * @param playerLevel 当前玩家等级
//      */
//     public getBuyList(playerLevel: number): IShopBuyItem[] {
//         // 将背包种子数量传给 Model，用于显示已持有数量
//         const ownedCounts = new Map<string, number>();
//         for (const [itemId, count] of InventoryManager.instance.getAll()) {
//             if (itemId.startsWith('seed_')) {
//                 ownedCounts.set(itemId, count);
//             }
//         }
//         return this.model.getBuyList(playerLevel, ownedCounts);
//     }

//     /**
//      * 获取出售列表数据
//      */
//     public getSellList(): IShopSellItem[] {
//         return this.model.getSellList(InventoryManager.instance.getAll());
//     }
// }
