/**
 * 建筑数据层 — BuildingModel
 *
 * 职责（纯数据，对齐 FarmModel）：
 * - 持有所有 IBuildingInstance 的运行时状态
 * - 实现 IBuildingModel 接口的全部原子操作
 * - 不派发任何事件（事件由 BuildingController 派发）
 * - 不依赖任何 Cocos 模块（可单元测试）
 *
 * 设计要点：
 * - 同一 buildingId 只能建造一栋（通过 _byBuildingId 快速判断）
 * - instanceId 用 _genId() 生成（简单递增，不用 UUID 库）
 * - Process 加工进度以「天」为单位，DayEnd 时由 Controller 调用 tickProcess()
 * - Livestock 每天 DayEnd：tickLivestock() → 已喂食动物写入 pendingProducts
 *                           resetDailyFlags() → fedToday 全部归 false
 */

import { getBuildingConfig, getRecipeConfig } from '../../config/BuildingConfig';
import { BuildingType } from '../../const/GameDefine';
import { BaseMVCModel } from '../../mvc/BaseMVCModel';
import {
    IAnimalInstance,
    IBuildingInstance,
    IBuildingInstanceSaveData,
    IBuildingModel,
    IBuildingSaveData,
    ProcessState,
} from './IBuilding';


// ─────────────────────────────────────────────────────────────────────────────
// BuildingModel
// ─────────────────────────────────────────────────────────────────────────────

export class BuildingModel extends BaseMVCModel implements IBuildingModel {

    // ── 内部状态 ─────────────────────────────────────────────────────────────

    /** 所有已建造的实例，保持插入顺序 */
    private _instances: IBuildingInstance[] = [];

    /** instanceId → 实例（O(1) 查询） */
    private _byInstanceId = new Map<string, IBuildingInstance>();

    /** buildingId → 实例（同种建筑唯一性保证） */
    private _byBuildingId = new Map<string, IBuildingInstance>();

    /** 实例 ID 自增计数 */
    private _idCounter = 0;

    // ── 查询 ─────────────────────────────────────────────────────────────────

    public getAll(): IBuildingInstance[] {
        return this._instances;
    }

    public getInstance(instanceId: string): IBuildingInstance | null {
        return this._byInstanceId.get(instanceId) ?? null;
    }

    public getByBuildingId(buildingId: string): IBuildingInstance | null {
        return this._byBuildingId.get(buildingId) ?? null;
    }

    public isBuilt(buildingId: string): boolean {
        return this._byBuildingId.has(buildingId);
    }

    // ── 建造 / 升级 / 拆除 ───────────────────────────────────────────────────

    public build(buildingId: string): IBuildingInstance | null {
        // 同种建筑只允许一栋
        if (this._byBuildingId.has(buildingId)) {
            console.warn(`[BuildingModel] 建筑 ${buildingId} 已存在，拒绝重复建造`);
            return null;
        }

        const cfg = getBuildingConfig(buildingId);
        if (!cfg) {
            console.warn(`[BuildingModel] 找不到建筑配置: ${buildingId}`);
            return null;
        }

        const inst: IBuildingInstance = {
            instanceId: this._genId(),
            buildingId,
            type:       cfg.type,
            level:      1,
        };

        // Process 初始状态
        if (cfg.type === BuildingType.Process) {
            inst.processState    = ProcessState.Idle;
            inst.pendingOutput   = null;
            inst.processedDays   = 0;
        }

        // Livestock 初始状态
        if (cfg.type === BuildingType.Livestock) {
            inst.animals         = [];
            inst.pendingProducts = null;
        }

        this._register(inst);
        return inst;
    }

    public upgrade(instanceId: string): boolean {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst) return false;

        const cfg = getBuildingConfig(inst.buildingId);
        if (!cfg) return false;

        if (inst.level >= cfg.maxLevel) {
            console.warn(`[BuildingModel] 建筑 ${inst.buildingId} 已达最高等级 ${cfg.maxLevel}`);
            return false;
        }

        inst.level++;
        return true;
    }

    public demolish(instanceId: string): boolean {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst) return false;

        this._byInstanceId.delete(instanceId);
        this._byBuildingId.delete(inst.buildingId);
        const idx = this._instances.indexOf(inst);
        if (idx !== -1) this._instances.splice(idx, 1);

        return true;
    }

    // ── 加工（Process）───────────────────────────────────────────────────────

    public startProcess(instanceId: string, recipeId: string): boolean {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst || inst.type !== BuildingType.Process) return false;
        if (inst.processState !== ProcessState.Idle)     return false;

        const recipe = getRecipeConfig(recipeId);
        if (!recipe || recipe.buildingId !== inst.buildingId) {
            console.warn(`[BuildingModel] 配方 ${recipeId} 不属于建筑 ${inst.buildingId}`);
            return false;
        }

        // 配方需要建筑等级
        if (inst.level < recipe.unlockLevel) {
            console.warn(`[BuildingModel] 配方 ${recipeId} 需要建筑等级 ${recipe.unlockLevel}，当前 ${inst.level}`);
            return false;
        }

        inst.processState     = ProcessState.Running;
        inst.currentRecipeId  = recipeId;
        inst.processedDays    = 0;
        inst.pendingOutput    = null;

        return true;
    }

    public tickProcess(): IBuildingInstance[] {
        const done: IBuildingInstance[] = [];

        for (const inst of this._instances) {
            if (inst.type !== BuildingType.Process) continue;
            if (inst.processState !== ProcessState.Running) continue;

            const recipe = getRecipeConfig(inst.currentRecipeId!);
            if (!recipe) continue;

            inst.processedDays = (inst.processedDays ?? 0) + 1;

            if (inst.processedDays >= recipe.durationDays) {
                inst.processState  = ProcessState.Done;
                inst.pendingOutput = { itemId: recipe.outputItemId, count: recipe.outputCount };
                done.push(inst);
            }
        }

        return done;
    }

    public collectProcess(instanceId: string): { itemId: string; count: number } | null {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst || inst.processState !== ProcessState.Done) return null;

        const output = inst.pendingOutput ?? null;

        // 重置为 Idle
        inst.processState     = ProcessState.Idle;
        inst.currentRecipeId  = undefined;
        inst.processedDays    = 0;
        inst.pendingOutput    = null;

        return output;
    }

    // ── 养殖（Livestock）─────────────────────────────────────────────────────

    public addAnimal(instanceId: string): IAnimalInstance | null {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst || inst.type !== BuildingType.Livestock) return null;

        const cfg      = getBuildingConfig(inst.buildingId);
        const levelCfg = cfg?.levels[inst.level - 1];
        const maxAnim  = levelCfg?.maxAnimals ?? 0;

        if (!inst.animals) inst.animals = [];

        if (inst.animals.length >= maxAnim) {
            console.warn(`[BuildingModel] 建筑 ${inst.buildingId} 已达最大动物数量 ${maxAnim}`);
            return null;
        }

        const animal: IAnimalInstance = {
            animalId: `${cfg!.animalType}_${this._genId()}`,
            fedToday: false,
        };

        inst.animals.push(animal);
        return animal;
    }

    public feedAnimal(instanceId: string, animalId: string): boolean {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst || inst.type !== BuildingType.Livestock) return false;

        const animal = inst.animals?.find(a => a.animalId === animalId);
        if (!animal) return false;

        animal.fedToday = true;
        return true;
    }

    public tickLivestock(): IBuildingInstance[] {
        const produced: IBuildingInstance[] = [];

        for (const inst of this._instances) {
            if (inst.type !== BuildingType.Livestock) continue;
            if (!inst.animals || inst.animals.length === 0) continue;

            const cfg = getBuildingConfig(inst.buildingId);
            if (!cfg?.dailyOutputItemId) continue;

            // 计算已喂食动物数量
            const fedCount = inst.animals.filter(a => a.fedToday).length;
            if (fedCount === 0) continue;

            const totalCount = fedCount * (cfg.dailyOutputCount ?? 1);
            inst.pendingProducts = { itemId: cfg.dailyOutputItemId, count: totalCount };
            produced.push(inst);
        }

        return produced;
    }

    public collectLivestock(instanceId: string): { itemId: string; count: number } | null {
        const inst = this._byInstanceId.get(instanceId);
        if (!inst || inst.type !== BuildingType.Livestock) return null;

        const output = inst.pendingProducts ?? null;
        inst.pendingProducts = null;
        return output;
    }

    // ── 每日重置 ─────────────────────────────────────────────────────────────

    public resetDailyFlags(): void {
        for (const inst of this._instances) {
            if (inst.type !== BuildingType.Livestock) continue;
            inst.animals?.forEach(a => { a.fedToday = false; });
        }
    }

    // ── 初始化 / 存档 ─────────────────────────────────────────────────────────

    public initNew(): void {
        this._clear();

        // 新游戏初始已有一栋 1 级农舍
        this.build('bld_house');
    }

    public toSaveData(): IBuildingSaveData {
        const buildings: IBuildingInstanceSaveData[] = this._instances.map(inst => {
            const saved: IBuildingInstanceSaveData = {
                instanceId: inst.instanceId,
                buildingId: inst.buildingId,
                level:      inst.level,
            };

            // Process 字段（仅非 Idle 状态写入）
            if (inst.type === BuildingType.Process) {
                if (inst.processState !== ProcessState.Idle) {
                    saved.processState    = inst.processState;
                    saved.currentRecipeId = inst.currentRecipeId;
                    saved.processedDays   = inst.processedDays;
                    saved.pendingOutput   = inst.pendingOutput ?? null;
                }
            }

            // Livestock 字段
            if (inst.type === BuildingType.Livestock) {
                saved.animals = inst.animals?.map(a => ({
                    animalId: a.animalId,
                    fedToday: a.fedToday,
                })) ?? [];
                saved.pendingProducts = inst.pendingProducts ?? null;
            }

            return saved;
        });

        return { buildings };
    }

    public loadFromSave(data: IBuildingSaveData): void {
        this._clear();

        for (const saved of data.buildings) {
            const cfg = getBuildingConfig(saved.buildingId);
            if (!cfg) {
                console.warn(`[BuildingModel] 存档中发现未知建筑 ${saved.buildingId}，跳过`);
                continue;
            }

            const inst: IBuildingInstance = {
                instanceId: saved.instanceId,
                buildingId: saved.buildingId,
                type:       cfg.type,
                level:      saved.level,
            };

            // Process 恢复
            if (cfg.type === BuildingType.Process) {
                inst.processState    = saved.processState    ?? ProcessState.Idle;
                inst.currentRecipeId = saved.currentRecipeId;
                inst.processedDays   = saved.processedDays   ?? 0;
                inst.pendingOutput   = saved.pendingOutput   ?? null;
            }

            // Livestock 恢复
            if (cfg.type === BuildingType.Livestock) {
                inst.animals = (saved.animals ?? []).map(a => ({
                    animalId: a.animalId,
                    fedToday: a.fedToday,
                }));
                inst.pendingProducts = saved.pendingProducts ?? null;
            }

            this._register(inst);
        }
    }

    // ── 内部工具方法 ─────────────────────────────────────────────────────────

    /** 注册实例到所有索引 */
    private _register(inst: IBuildingInstance): void {
        this._instances.push(inst);
        this._byInstanceId.set(inst.instanceId, inst);
        this._byBuildingId.set(inst.buildingId, inst);
    }

    /** 清空所有数据 */
    private _clear(): void {
        this._instances.length = 0;
        this._byInstanceId.clear();
        this._byBuildingId.clear();
    }

    /** 生成简单唯一 ID（会话内递增，不跨会话持久化） */
    private _genId(): string {
        return `bld_${++this._idCounter}_${Date.now()}`;
    }
}
