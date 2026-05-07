/**
 * 玩家数据层 — PlayerModel
 *
 * 职责：
 * - 持有玩家所有运行时数值数据（金币 / 等级 / 经验 / 特殊材料）
 * - 提供原子操作（加/减/升级），不派发任何事件
 * - 支持存档序列化 / 反序列化
 *
 * 设计原则：
 * - 只管数据，所有业务判断（是否够钱、是否满级）由 PlayerController 负责
 * - 经验以「本级已积累量」存储，而非总经验，方便存档和展示进度条
 * - 特殊材料用 Map 存储，支持任意 materialId 扩展
 *
 * 初始状态：
 *   金币: EconomyConst.INIT_GOLD（500）
 *   等级: 1
 *   经验: 0
 *   材料: 无
 */

import { EconomyConst } from '../../const/GameDefine';
import { BaseMVCModel } from '../../mvc/BaseMVCModel';
import { IPlayerModel, IPlayerSaveData } from './IPlayer';


export class PlayerModel extends BaseMVCModel implements IPlayerModel {

    // ── 核心数据 ─────────────────────────────────────────────────────────────

    private _gold:       number = 0;
    private _level:      number = 1;
    private _currentExp: number = 0;

    /** 特殊材料（materialId → 数量） */
    private _materials: Map<string, number> = new Map();

    // ── 只读访问器 ────────────────────────────────────────────────────────────

    public get gold():       number { return this._gold; }
    public get level():      number { return this._level; }
    public get currentExp(): number { return this._currentExp; }

    // ── 初始化 ───────────────────────────────────────────────────────────────

    /**
     * 新游戏初始化
     */
    public initNew(): void {
        this._gold       = EconomyConst.INIT_GOLD;
        this._level      = 1;
        this._currentExp = 0;
        this._materials.clear();
        console.log(`[PlayerModel] 新游戏初始化: 金币=${this._gold} 等级=${this._level}`);
    }

    // ── 金币操作 ──────────────────────────────────────────────────────────────

    /**
     * 增加金币
     * @param delta 增加量（必须为正数）
     * @returns 变化后的总量
     */
    public addGold(delta: number): number {
        if (delta <= 0) {
            console.warn(`[PlayerModel] addGold: delta 必须为正数，传入 ${delta}`);
            return this._gold;
        }
        this._gold += delta;
        return this._gold;
    }

    /**
     * 消耗金币
     * @param amount 消耗量（必须为正数）
     * @returns true = 成功；false = 金币不足
     */
    public spendGold(amount: number): boolean {
        if (!this.hasGold(amount)) return false;
        this._gold -= amount;
        return true;
    }

    /**
     * 检查金币是否充足
     */
    public hasGold(amount: number): boolean {
        return this._gold >= amount;
    }

    // ── 经验 / 等级操作 ───────────────────────────────────────────────────────

    /**
     * 增加本级已积累的经验
     * @param delta 增加量
     * @returns 增加后的 currentExp（可能超过 expToNext，由 Controller 决定是否升级）
     */
    public addExp(delta: number): number {
        if (delta <= 0) return this._currentExp;
        this._currentExp += delta;
        return this._currentExp;
    }

    /**
     * 执行升级：扣除本级经验阈值，level++
     *
     * 由 PlayerController._checkLevelUp() 在确认满足升级条件后调用
     * 不做满级检查（由 Controller 保证不越界）
     *
     * @param expConsumed 升级消耗的经验（等于当前等级的 expToNext）
     * @returns 升级后的新等级
     */
    public levelUp(expConsumed: number): number {
        this._currentExp = Math.max(0, this._currentExp - expConsumed);
        this._level += 1;
        console.log(`[PlayerModel] 升级 → Lv.${this._level}（剩余经验 ${this._currentExp}）`);
        return this._level;
    }

    // ── 特殊材料操作 ──────────────────────────────────────────────────────────

    /**
     * 获取特殊材料数量
     */
    public getMaterialCount(materialId: string): number {
        return this._materials.get(materialId) ?? 0;
    }

    /**
     * 增加特殊材料
     * @returns 变化后的总量
     */
    public addMaterial(materialId: string, delta: number): number {
        if (delta <= 0) return this.getMaterialCount(materialId);
        const newCount = (this._materials.get(materialId) ?? 0) + delta;
        this._materials.set(materialId, newCount);
        return newCount;
    }

    /**
     * 消耗特殊材料
     * @returns true = 成功；false = 数量不足
     */
    public spendMaterial(materialId: string, amount: number): boolean {
        const current = this.getMaterialCount(materialId);
        if (current < amount) return false;
        this._materials.set(materialId, current - amount);
        return true;
    }

    // ── 存档 ─────────────────────────────────────────────────────────────────

    /**
     * 序列化为存档数据
     */
    public toSaveData(): IPlayerSaveData {
        const materials: Record<string, number> = {};
        this._materials.forEach((count, id) => {
            if (count > 0) materials[id] = count;
        });

        return {
            gold:       this._gold,
            level:      this._level,
            currentExp: this._currentExp,
            materials,
        };
    }

    /**
     * 从存档数据恢复
     */
    public loadFromSave(data: IPlayerSaveData): void {
        this._gold       = data.gold;
        this._level      = data.level;
        this._currentExp = data.currentExp;

        this._materials.clear();
        for (const [id, count] of Object.entries(data.materials ?? {})) {
            if (count > 0) this._materials.set(id, count);
        }

        console.log(`[PlayerModel] 从存档恢复: 金币=${this._gold} 等级=${this._level} 经验=${this._currentExp}`);
    }

    // ── BaseModel 生命周期 ────────────────────────────────────────────────────

    protected onClear(): void {
        this._gold       = 0;
        this._level      = 1;
        this._currentExp = 0;
        this._materials.clear();
        console.log('[PlayerModel] 数据已清空');
    }
}
