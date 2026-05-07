// /**
//  * 商店数据层 — ShopModel
//  *
//  * 职责：
//  * - 纯数据查询，不持有运行时状态（价格全部来自 CropConfig，无需存档）
//  * - 提供购买列表 / 出售列表的数据组装（过滤、排序、填充背包数量）
//  * - 不直接操作 InventoryManager / PlayerModel，数据由 Controller 传入
//  *
//  * MVP 阶段商店无存货限制（可无限购买种子）。
//  */

// import { SEASON_NAMES } from '../../const/GameDefine';
// import { BaseMVCModel } from '../../mvc/BaseMVCModel';
// import { IShopBuyItem, IShopModel, IShopSellItem } from './IShop';


// export class ShopModel extends BaseMVCModel implements IShopModel {

//     // ── IShopModel 实现 ───────────────────────────────────────────────────────

//     /**
//      * 组装购买列表
//      *
//      * 过滤规则：unlockLevel <= playerLevel
//      * 排序规则：按 unlockLevel 升序（低等级商品排前面）
//      */
//     public getBuyList(
//         playerLevel:  number,
//         ownedCounts:  Map<string, number>,
//     ): IShopBuyItem[] {
//         return getAllCropConfigs()
//             .filter(cfg => cfg.unlockLevel <= playerLevel)
//             .sort((a, b) => a.unlockLevel - b.unlockLevel)
//             .map(cfg => ({
//                 seedId:      cfg.seedId,
//                 cropId:      cfg.id,
//                 cropName:    cfg.name,
//                 seedPrice:   cfg.seedPrice,
//                 ownedCount:  ownedCounts.get(cfg.seedId) ?? 0,
//                 unlockLevel: cfg.unlockLevel,
//                 spriteDir:   cfg.spriteDir,
//                 seasonDesc:  cfg.seasons
//                     .map(s => (SEASON_NAMES as Record<string, string>)[s] ?? s)
//                     .join(' / '),
//             }));
//     }

//     /**
//      * 组装出售列表
//      *
//      * 只展示背包中 crop_ 前缀且数量 > 0 的物品，
//      * 对应作物没有 sellPrice 配置的跳过（防御性处理）
//      */
//     public getSellList(inventoryItems: [string, number][]): IShopSellItem[] {
//         const result: IShopSellItem[] = [];

//         for (const [itemId, count] of inventoryItems) {
//             if (!itemId.startsWith('crop_')) continue;
//             if (count <= 0) continue;

//             // const cfg = getCropConfig(itemId);
//             // if (!cfg || cfg.sellPrice <= 0) continue;

//             // result.push({
//             //     cropId:    cfg.id,
//             //     cropName:  cfg.name,
//             //     sellPrice: cfg.sellPrice,
//             //     ownedCount: count,
//             //     spriteDir: cfg.spriteDir,
//             // });
//         }

//         return result;
//     }

//     public getSeedPrice(seedId: string): number {
//         return getCropConfigBySeed(seedId)?.seedPrice ?? 0;
//     }

//     public getCropSellPrice(cropId: string): number {
//         return getCropConfig(cropId)?.sellPrice ?? 0;
//     }

//     // ── BaseModel 实现 ────────────────────────────────────────────────────────

//     protected onClear(): void {
//         // 无运行时状态，无需清理
//     }
// }
