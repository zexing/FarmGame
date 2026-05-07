/**
 * 背包模块接口定义
 *
 * - IInventoryItem —— 单格展示数据（InventoryManager + CropConfig 拼装而来）
 * - IInventoryView —— 视图层契约（供将来扩展）
 */

import { IMVCView } from '../../mvc/IBaseMVC';


// ─────────────────────────────────────────────────────────────────────────────
// 物品类型
// ─────────────────────────────────────────────────────────────────────────────

export type InventoryItemType = 'seed' | 'crop' | 'other';

/** Tab 类型 */
export type InventoryTab = 'all' | 'seed' | 'crop';


// ─────────────────────────────────────────────────────────────────────────────
// 单格数据结构（CommonList 的数据单元）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CommonList 传给每个 InventoryItemCell.updateData() 的数据体
 */
export interface IInventoryItem {
    /** 物品 ID，如 'seed_radish' / 'crop_tomato' */
    itemId:    string;
    /** 持有数量 */
    count:     number;
    /** 显示名称，如 "萝卜种子" / "萝卜" */
    name:      string;
    /** 简短描述（详情面板展示） */
    desc:      string;
    /**
     * 图标资源路径（用于 resources.load）
     * 种子：textures/crops/{spriteDir}/stage_0/spriteFrame
     * 作物：textures/crops/{spriteDir}/stage_{last}/spriteFrame
     * 其他：textures/items/{itemId}/spriteFrame
     */
    iconPath:  string;
    /** 物品类型，用于 Tab 过滤 */
    itemType:  InventoryItemType;
}


// ─────────────────────────────────────────────────────────────────────────────
// View 接口（预留，当前背包无独立 Controller）
// ─────────────────────────────────────────────────────────────────────────────

export interface IInventoryView extends IMVCView {
    /** 刷新列表（背包变化时调用） */
    refreshList(): void;
}
