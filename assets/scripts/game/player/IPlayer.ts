/**
 * 玩家系统接口定义
 *
 * 设计原则：
 * - IPlayerModel  —— 玩家数据契约（金币 / 经验 / 等级），仅数据操作
 * - IPlayerView   —— 玩家视图契约（头像动画 / HUD 更新），MVP 可为空壳
 * - IPlayerSaveData —— 存档最小化数据
 * - IInventoryItem / IInventorySaveData —— 背包数据结构
 *
 * 货币设计（双货币）：
 *   - gold：日常金币，收割→卖出→获得，用于购买种子/道具
 *   - specialMaterial：稀有材料，探索区获得，用于解锁高级建筑/内容
 *     （本文件只定义接口，数量由 PlayerModel 持有，逻辑由 PlayerController 处理）
 */

import { IMVCController, IMVCModel, IMVCView } from '../../mvc/IBaseMVC';


// ─────────────────────────────────────────────────────────────────────────────
// 存档数据结构
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 玩家数据存档（最小化）
 */
export interface IPlayerSaveData {
    /** 当前金币 */
    gold: number;
    /** 当前等级 */
    level: number;
    /** 当前等级内已积累的经验（不是总经验） */
    currentExp: number;
    /** 特殊材料数量（Map 序列化为对象） */
    materials: Record<string, number>;
}

/**
 * 背包单条物品存档
 */
export interface IInventoryItemSaveData {
    itemId: string;
    count: number;
}

/**
 * 背包完整存档
 */
export interface IInventorySaveData {
    items: IInventoryItemSaveData[];
}


// ─────────────────────────────────────────────────────────────────────────────
// Model 接口
// ─────────────────────────────────────────────────────────────────────────────

export interface IPlayerModel extends IMVCModel {

    // ── 只读访问器 ────────────────────────────────────────────────────────────

    /** 当前金币 */
    readonly gold: number;
    /** 当前等级（1 ~ MAX_LEVEL） */
    readonly level: number;
    /** 当前等级内已积累的经验 */
    readonly currentExp: number;

    /**
     * 获取特殊材料数量
     * @param materialId 材料 ID，如 'mat_gem'
     */
    getMaterialCount(materialId: string): number;

    // ── 金币操作 ──────────────────────────────────────────────────────────────

    /**
     * 增加金币（正数）
     * @returns 变化后的总量
     */
    addGold(delta: number): number;

    /**
     * 消耗金币
     * @returns true = 成功；false = 金币不足
     */
    spendGold(amount: number): boolean;

    /** 金币是否充足 */
    hasGold(amount: number): boolean;

    // ── 经验 / 等级操作 ───────────────────────────────────────────────────────

    /**
     * 增加当前等级内的经验
     * @returns 增加后的 currentExp（仅本级已积累量，Controller 负责判断升级）
     */
    addExp(delta: number): number;

    /**
     * 升级：currentExp -= expToNext, level++
     * 由 PlayerController._checkLevelUp() 调用
     * @param expConsumed 升级消耗的经验（等于当前等级的 expToNext）
     * @returns 升级后的新等级
     */
    levelUp(expConsumed: number): number;

    // ── 特殊材料操作 ──────────────────────────────────────────────────────────

    /**
     * 增加特殊材料
     * @returns 变化后的总量
     */
    addMaterial(materialId: string, delta: number): number;

    /**
     * 消耗特殊材料
     * @returns true = 成功；false = 数量不足
     */
    spendMaterial(materialId: string, amount: number): boolean;

    // ── 初始化 / 存档 ─────────────────────────────────────────────────────────

    /** 新游戏初始化 */
    initNew(): void;

    /** 序列化为存档 */
    toSaveData(): IPlayerSaveData;

    /** 从存档恢复 */
    loadFromSave(data: IPlayerSaveData): void;
}


// ─────────────────────────────────────────────────────────────────────────────
// View 接口（MVP 最小化）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 玩家 View 契约
 *
 * MVP 阶段：主角只是一个 Sprite，动画很简单
 * 大部分"玩家信息展示"在 HUD 中（属于 UI 层，不属于 PlayerView）
 */
export interface IPlayerView extends IMVCView {

    // /**
    //  * 传送主角到目标格子旁（含位移 Tween）
    //  * @returns Promise，动画结束后 resolve
    //  */
    // teleportToCell(row: number, col: number): Promise<void>;

    // /**
    //  * 播放升级特效（金光爆发 / 升级提示）
    //  * @param newLevel 升级后的新等级
    //  */
    // playLevelUpEffect(newLevel: number): void;
}

export interface IPlayercontroller extends IMVCController {

    // /**绑定地图控制器引用 */
    // bindMapController(map: IMapController)

    /** 生成玩家 */
    spawnPlayer(): void;

    /** 获取玩家当前位置 */
    getCurrentRowCol(): { row: number, col: number };
}
