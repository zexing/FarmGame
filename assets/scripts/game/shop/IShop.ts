// /**
//  * 商店模块接口定义
//  *
//  * - IShopModel   —— 数据层契约（价格查询 / 商品列表生成）
//  * - IShopView    —— 视图层契约（列表刷新 / Tab 切换状态）
//  * - IShopBuyItem —— 购买列表单条数据（传给 ShopItemListView 渲染）
//  * - IShopSellItem—— 出售列表单条数据
//  */

// import { IMVCModel, IMVCView } from '../../mvc/IBaseMVC';


// // ─────────────────────────────────────────────────────────────────────────────
// // 商品数据结构（传给 View 层渲染，不含业务逻辑）
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * 购买列表中单个种子的展示数据
//  */
// export interface IShopBuyItem {
//     /** 种子 ID，如 'seed_radish' */
//     seedId:      string;
//     /** 对应作物 ID，如 'crop_radish' */
//     cropId:      string;
//     /** 作物显示名称（中文），如 "萝卜" */
//     cropName:    string;
//     /** 种子购买单价（金币） */
//     seedPrice:   number;
//     /** 玩家背包中已持有的种子数量（用于显示库存） */
//     ownedCount:  number;
//     /** 解锁所需等级（用于灰化未解锁商品） */
//     unlockLevel: number;
//     /** 作物精灵目录（用于加载图标） */
//     spriteDir:   string;
//     /** 季节限制描述，如 "春季" */
//     seasonDesc:  string;
// }

// /**
//  * 出售列表中单个作物的展示数据
//  */
// export interface IShopSellItem {
//     /** 作物 ID，如 'crop_tomato' */
//     cropId:     string;
//     /** 作物显示名称（中文） */
//     cropName:   string;
//     /** 每个出售单价（金币） */
//     sellPrice:  number;
//     /** 玩家背包中持有的数量（为 0 时不应出现在列表中） */
//     ownedCount: number;
//     /** 作物精灵目录（用于加载图标） */
//     spriteDir:  string;
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // Model 接口
// // ─────────────────────────────────────────────────────────────────────────────

// export interface IShopModel extends IMVCModel {

//     /**
//      * 获取所有可购买种子列表（按玩家等级过滤 + 按解锁等级排序）
//      *
//      * @param playerLevel 当前玩家等级（用于过滤未解锁商品）
//      * @param ownedCounts 背包当前种子数量 Map（seedId → count）
//      */
//     getBuyList(playerLevel: number, ownedCounts: Map<string, number>): IShopBuyItem[];

//     /**
//      * 获取当前可出售的作物列表（仅背包中数量 > 0 的作物）
//      *
//      * @param inventoryItems 背包所有物品 [itemId, count][]
//      */
//     getSellList(inventoryItems: [string, number][]): IShopSellItem[];

//     /**
//      * 查询种子的购买单价
//      * @returns 价格；未找到时返回 0
//      */
//     getSeedPrice(seedId: string): number;

//     /**
//      * 查询作物的出售单价
//      * @returns 价格；未找到时返回 0
//      */
//     getCropSellPrice(cropId: string): number;
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // CommonList 数据单元（传给 ShopItemCell.updateView() 的统一格式）
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * CommonList 传给每个 ShopItemCell 的数据包装体
//  *
//  * 用 mode 字段区分购买 / 出售两种模式，
//  * ShopItemCell.updateView() 内部据此渲染不同字段。
//  */
// export type IShopCellData =
//     | { mode: 'buy';  item: IShopBuyItem  }
//     | { mode: 'sell'; item: IShopSellItem };


// // ─────────────────────────────────────────────────────────────────────────────
// // View 接口
// // ─────────────────────────────────────────────────────────────────────────────

// export interface IShopView extends IMVCView {

//     /**
//      * 刷新购买列表（Tab 切换或购买成功后调用）
//      * @param items 购买列表数据
//      */
//     refreshBuyList(items: IShopBuyItem[]): void;

//     /**
//      * 刷新出售列表（Tab 切换或出售成功后调用）
//      * @param items 出售列表数据
//      */
//     refreshSellList(items: IShopSellItem[]): void;
// }
