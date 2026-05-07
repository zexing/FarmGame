/**
 * 建筑系统接口定义 — IBuilding
 *
 * 对齐 IFarm.ts 的设计风格：
 * - IBuildingInstance —— 单栋建筑运行时状态
 * - IBuildingModel    —— 数据层契约（BuildingModel 实现）
 * - IBuildingView     —— 视图层契约（预留，MVP 阶段可为空）
 * - IBuildingSaveData —— 存档结构（最小化，仅持久化必要字段）
 *
 * 加工流程（Process 建筑）：
 *   投入原料 → processStart → 每天 tick(dt) 推进 → processedDays 达到阈值
 *     → state = ProcessDone → 玩家收取 → state = Idle
 *
 * 养殖流程（Livestock 建筑）：
 *   购买动物 → 每天 DayEnd 时若已喂食 → 动物产出进入 pendingProducts
 *     → 玩家收取 → 清空 pendingProducts
 */

import { BuildingType } from '../../const/GameDefine';
import { IMVCModel, IMVCView } from '../../mvc/IBaseMVC';


// ─────────────────────────────────────────────────────────────────────────────
// 加工状态
// ─────────────────────────────────────────────────────────────────────────────

export enum ProcessState {
    /** 空闲，可接受新任务 */
    Idle      = 'idle',
    /** 加工中 */
    Running   = 'running',
    /** 加工完成，等待玩家领取 */
    Done      = 'done',
}


// ─────────────────────────────────────────────────────────────────────────────
// 运行时实例（单栋建筑的完整状态）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 动物实例（Livestock 建筑内部）
 */
export interface IAnimalInstance {
    /** 唯一 ID（UUID，或 `${animalType}_${index}`） */
    animalId:    string;
    /** 今天是否已被喂食 */
    fedToday:    boolean;
}

/**
 * 单栋建筑的运行时状态
 */
export interface IBuildingInstance {
    /** 建筑实例唯一 ID（UUID） */
    instanceId:      string;
    /** 建筑配置 ID，如 'bld_barn' */
    buildingId:      string;
    /** 建筑类型（冗余，方便查询） */
    type:            BuildingType;
    /** 当前等级（1 ~ maxLevel） */
    level:           number;

    // ── Process 专属字段 ──────────────────────────────────────────────────────

    /** 当前加工状态（仅 Process 类型有效） */
    processState?:   ProcessState;
    /** 当前正在加工的配方 ID */
    currentRecipeId?: string;
    /** 已累计加工天数（每天 DayEnd 推进） */
    processedDays?:  number;
    /** 加工完成后待领取的产出 { itemId, count } */
    pendingOutput?:  { itemId: string; count: number } | null;

    // ── Livestock 专属字段 ────────────────────────────────────────────────────

    /** 当前饲养的动物列表 */
    animals?:        IAnimalInstance[];
    /** 今日待领取的产出（每天 DayEnd 后写入，玩家收取时清空） */
    pendingProducts?: { itemId: string; count: number } | null;
}


// ─────────────────────────────────────────────────────────────────────────────
// 存档结构（最小化）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 动物存档
 */
export interface IAnimalSaveData {
    animalId: string;
    fedToday: boolean;
}

/**
 * 单栋建筑存档
 * - 仅持久化必要字段；配置数据（name/desc/levels）不存档，运行时从 BuildingConfig 读取
 */
export interface IBuildingInstanceSaveData {
    instanceId:       string;
    buildingId:       string;
    level:            number;

    // Process 字段（Idle 时全部为 undefined，不写入）
    processState?:    ProcessState;
    currentRecipeId?: string;
    processedDays?:   number;
    pendingOutput?:   { itemId: string; count: number } | null;

    // Livestock 字段
    animals?:         IAnimalSaveData[];
    pendingProducts?: { itemId: string; count: number } | null;
}

/**
 * 建筑系统完整存档（顶层）
 */
export interface IBuildingSaveData {
    /** 所有已建造的建筑实例 */
    buildings: IBuildingInstanceSaveData[];
}


// ─────────────────────────────────────────────────────────────────────────────
// Model 接口
// ─────────────────────────────────────────────────────────────────────────────

export interface IBuildingModel extends IMVCModel {

    // ── 查询 ──────────────────────────────────────────────────────────────────

    /** 获取全部建筑实例 */
    getAll(): IBuildingInstance[];

    /** 按实例 ID 获取建筑 */
    getInstance(instanceId: string): IBuildingInstance | null;

    /** 按建筑配置 ID 获取已建造的实例（同种建筑只允许一栋）*/
    getByBuildingId(buildingId: string): IBuildingInstance | null;

    /** 是否已建造指定 buildingId */
    isBuilt(buildingId: string): boolean;

    // ── 建造 / 升级 / 拆除 ───────────────────────────────────────────────────

    /**
     * 建造新建筑
     * @returns 新实例，或 null（已存在同 buildingId 时拒绝）
     */
    build(buildingId: string): IBuildingInstance | null;

    /**
     * 升级建筑
     * @returns true = 成功，false = 已达最高等级
     */
    upgrade(instanceId: string): boolean;

    /**
     * 拆除建筑（从列表中移除）
     * @returns true = 成功
     */
    demolish(instanceId: string): boolean;

    // ── 加工（Process 专属）──────────────────────────────────────────────────

    /**
     * 开始加工
     * @returns true = 成功，false = 状态不对或配方不属于该建筑
     */
    startProcess(instanceId: string, recipeId: string): boolean;

    /**
     * 推进加工进度（DayEnd 时调用）
     * 对所有 Running 状态的建筑 processedDays++，
     * 达到 durationDays 时切换为 Done 并写入 pendingOutput
     * @returns 本次推进后变为 Done 的实例列表
     */
    tickProcess(): IBuildingInstance[];

    /**
     * 领取加工产出
     * @returns 产出物品，或 null（非 Done 状态）
     */
    collectProcess(instanceId: string): { itemId: string; count: number } | null;

    // ── 养殖（Livestock 专属）────────────────────────────────────────────────

    /**
     * 添加动物
     * @returns 新动物实例，或 null（已达最大数量）
     */
    addAnimal(instanceId: string): IAnimalInstance | null;

    /**
     * 喂食动物（设置 fedToday = true）
     * @returns true = 成功
     */
    feedAnimal(instanceId: string, animalId: string): boolean;

    /**
     * 日结算（DayEnd）：已喂食的动物产出，写入 pendingProducts；重置 fedToday
     * @returns 本次产出有产品的建筑实例列表
     */
    tickLivestock(): IBuildingInstance[];

    /**
     * 领取养殖产出
     * @returns 产出物品，或 null（无待领取产出）
     */
    collectLivestock(instanceId: string): { itemId: string; count: number } | null;

    // ── 每日重置 ──────────────────────────────────────────────────────────────

    /** DayEnd 调用：重置所有动物的 fedToday */
    resetDailyFlags(): void;

    // ── 初始化 / 存档 ─────────────────────────────────────────────────────────

    /** 新游戏初始化（建造初始农舍，等级 1） */
    initNew(): void;

    /** 序列化为存档 */
    toSaveData(): IBuildingSaveData;

    /** 从存档恢复 */
    loadFromSave(data: IBuildingSaveData): void;
}


// ─────────────────────────────────────────────────────────────────────────────
// View 接口（预留，MVP 阶段可不实现）
// ─────────────────────────────────────────────────────────────────────────────

export interface IBuildingView extends IMVCView {
    /** 刷新建筑列表（建造/升级/拆除后调用） */
    refreshBuildingList(): void;
}
