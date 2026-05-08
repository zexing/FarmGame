/**
 * 背包管理器 — InventoryManager
 *
 * 职责：
 * - 管理玩家背包内所有物品的数量（itemId → count）
 * - 提供增删查的原子操作
 * - 派发 PlayerEvents.ItemAdded / ItemRemoved 事件，通知 UI 刷新
 * - 支持存档序列化 / 反序列化
 *
 * 设计原则：
 * - 单例，全局唯一，所有系统通过 InventoryManager.instance 访问
 * - 每种物品最大叠加 EconomyConst.MAX_STACK（999），超出部分丢弃并打警告
 * - 物品数量为 0 时从 Map 中删除（节省内存，存档时也更干净）
 * - 不感知物品类型（作物/种子/产品），类型由调用方或 ItemConfig 解析
 *
 * 接入示例：
 * ```typescript
 * // 收获时加入背包
 * InventoryManager.instance.add('crop_tomato', 1);
 *
 * // 种植时消耗种子
 * const ok = InventoryManager.instance.remove('seed_tomato', 1);
 * if (!ok) showToast('种子不足');
 *
 * // 检查是否有足够种子
 * const has = InventoryManager.instance.hasEnough('seed_tomato', 1);
 * ```
 */

import { IInventorySaveData } from 'db://assets/scripts/game/player/IPlayer';
import { SingletonManager } from '../../common/base/SingletonManager';
import { EventManager } from '../../common/manager/EventManager';
import { EconomyConst } from '../../const/GameDefine';
import { PlayerEvents } from '../../events/PlayerEvents';


export class InventoryManager extends SingletonManager {

    // ── 单例访问 ─────────────────────────────────────────────────────────────

    public static get instance(): InventoryManager {
        return InventoryManager.getInstance<InventoryManager>();
    }

    public static delInstance(): void {
        InventoryManager.destroyInstance();
    }

    // ── 核心数据 ─────────────────────────────────────────────────────────────

    /** itemId → 数量，数量为 0 时键从 Map 中删除 */
    private _items: Map<string, number> = new Map();

    // ── 增加物品 ──────────────────────────────────────────────────────────────

    /**
     * 增加物品数量
     *
     * - 超过 MAX_STACK 的部分会被截断（打 warn 日志）
     * - 成功增加后派发 PlayerEvents.ItemAdded
     *
     * @param itemId  物品 ID
     * @param count   增加数量（必须 > 0）
     * @returns 实际增加的数量（可能因封顶而小于 count）
     */
    public add(itemId: string, count: number): number {
        if (count <= 0) {
            console.warn(`[InventoryManager] add: count 必须 > 0，传入 ${count}`);
            return 0;
        }

        const current = this._items.get(itemId) ?? 0;
        const available = EconomyConst.MAX_STACK - current;

        if (available <= 0) {
            console.warn(`[InventoryManager] ${itemId} 已达上限 ${EconomyConst.MAX_STACK}，无法再增加`);
            return 0;
        }

        const actualAdd = Math.min(count, available);
        const newCount  = current + actualAdd;
        this._items.set(itemId, newCount);

        if (actualAdd < count) {
            console.warn(`[InventoryManager] ${itemId} 增加 ${count} → 实际加 ${actualAdd}（已封顶）`);
        }

        EventManager.instance.dispatchEvent(PlayerEvents.ItemAdded, {
            itemId,
            count: actualAdd,
        });

        return actualAdd;
    }

    // ── 移除物品 ──────────────────────────────────────────────────────────────

    /**
     * 消耗物品
     *
     * @param itemId  物品 ID
     * @param count   消耗数量（必须 > 0）
     * @returns true = 成功；false = 数量不足
     */
    public remove(itemId: string, count: number): boolean {
        if (count <= 0) {
            console.warn(`[InventoryManager] remove: count 必须 > 0，传入 ${count}`);
            return false;
        }

        const current = this._items.get(itemId) ?? 0;
        if (current < count) return false;

        const newCount = current - count;
        if (newCount === 0) {
            this._items.delete(itemId);
        } else {
            this._items.set(itemId, newCount);
        }

        EventManager.instance.dispatchEvent(PlayerEvents.ItemRemoved, {
            itemId,
            count,
        });

        return true;
    }

    // ── 查询 ──────────────────────────────────────────────────────────────────

    /**
     * 获取物品当前数量（不存在时返回 0）
     */
    public getCount(itemId: string): number {
        return this._items.get(itemId) ?? 0;
    }

    /**
     * 判断是否有足够数量
     */
    public hasEnough(itemId: string, count: number): boolean {
        return this.getCount(itemId) >= count;
    }

    /**
     * 获取背包内所有物品（只读副本）
     * 供背包 UI 遍历渲染用
     *
     * @returns [itemId, count][] 数组，按 itemId 字典序排序
     */
    public getAll(): [string, number][] {
        return Array.from(this._items.entries()).sort((a, b) =>
            a[0].localeCompare(b[0])
        );
    }

    /**
     * 判断背包是否为空
     */
    public isEmpty(): boolean {
        return this._items.size === 0;
    }

    /**
     * 获取背包内不同物品的种类数
     */
    public getSlotCount(): number {
        return this._items.size;
    }

    // ── 批量操作（商店买卖用）─────────────────────────────────────────────────

    /**
     * 批量检查：是否同时持有多种物品的足够数量
     * 用于建筑建造时同时检查多个材料
     *
     * @param requirements [itemId, count][] 需求列表
     * @returns true = 全部满足；false = 至少有一个不满足
     */
    public hasEnoughAll(requirements: [string, number][]): boolean {
        return requirements.every(([itemId, count]) => this.hasEnough(itemId, count));
    }

    /**
     * 批量消耗（原子性：全部满足才消耗，否则不做任何操作）
     *
     * @param requirements [itemId, count][] 消耗列表
     * @returns true = 全部成功；false = 有物品不足，未做任何修改
     */
    public removeAll(requirements: [string, number][]): boolean {
        // 先检查全部满足
        if (!this.hasEnoughAll(requirements)) return false;

        // 全部满足后再逐一扣除（不会中途失败）
        for (const [itemId, count] of requirements) {
            this.remove(itemId, count);
        }
        return true;
    }

    // ── 存档 ─────────────────────────────────────────────────────────────────

    /**
     * 序列化为存档数据
     * 只保存数量 > 0 的物品
     */
    public toSaveData(): IInventorySaveData {
        const items = Array.from(this._items.entries())
            .filter(([, count]) => count > 0)
            .map(([itemId, count]) => ({ itemId, count }));

        return { items };
    }

    /**
     * 从存档数据恢复
     */
    public loadFromSave(data: IInventorySaveData): void {
        this._items.clear();

        for (const { itemId, count } of data.items ?? []) {
            if (count > 0) {
                this._items.set(itemId, Math.min(count, EconomyConst.MAX_STACK));
            }
        }

        console.log(`[InventoryManager] 从存档恢复: ${this._items.size} 种物品`);
    }

    /**
     * 清空背包
     */
    public clear(): void {
        this._items.clear();
        console.log('[InventoryManager] 背包已清空');
    }

    // ── 生命周期 ─────────────────────────────────────────────────────────────

    protected onDestroy(): void {
        this._items.clear();
        console.log('[InventoryManager] 销毁');
    }
}
