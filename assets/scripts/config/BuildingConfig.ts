/**
 * 建筑配置表 — BuildingConfig
 *
 * 设计原则（对齐 CropConfig）：
 * - 纯数据，无运行时状态
 * - 模块加载时构建查找 Map，外部通过纯函数访问
 * - ID 命名规范：`bld_` 前缀 + 英文小写下划线（如 `bld_barn`）
 *
 * 建筑类型（BuildingType）：
 * - Storage   — 仓库：建成后永久提升背包上限
 * - Process   — 加工坊：投入原料 + 等待时间 → 产出成品；配方见 RECIPE_CONFIGS
 * - Livestock — 养殖舍（鸡舍等）：每天产出动物制品
 * - House     — 农舍：升级后解锁新功能或地块
 *
 * 加工配方（IRecipeConfig）：
 * - 与建筑分离，一栋加工坊可拥有多条配方
 * - 产出固定为 1 种物品（MVP），多产出留到后续扩展
 *
 * 使用方式：
 * ```ts
 * import { getBuildingConfig, getRecipeConfig } from '../config/BuildingConfig';
 *
 * const barn = getBuildingConfig('bld_barn');
 * const cost = barn.levels[0].buildCost;   // 第 1 级建造消耗
 *
 * const recipe = getRecipeConfig('recipe_flour');
 * ```
 */

import { BuildingType } from '../const/GameDefine';


// ─────────────────────────────────────────────────────────────────────────────
// 加工配方（Process 建筑专用）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 单条原料需求
 */
export interface IIngredient {
    /** 物品 ID，如 'crop_wheat' */
    itemId: string;
    /** 需要数量 */
    count:  number;
}

/**
 * 加工配方配置
 */
export interface IRecipeConfig {
    /** 配方 ID，如 'recipe_flour' */
    id:           string;
    /** 显示名称，如 "小麦→面粉" */
    name:         string;
    /** 所属建筑 ID（必须是 Process 类型） */
    buildingId:   string;
    /** 原料列表（MVP 阶段通常只有 1 种） */
    ingredients:  IIngredient[];
    /** 产出物品 ID，如 'product_flour' */
    outputItemId: string;
    /** 产出数量 */
    outputCount:  number;
    /** 加工耗时（游戏内天数，不足 1 天可用小数，如 0.5 = 半天） */
    durationDays: number;
    /** 解锁所需建筑等级（默认 1） */
    unlockLevel:  number;
}


// ─────────────────────────────────────────────────────────────────────────────
// 建筑等级配置
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 单级建造/升级消耗
 */
export interface IBuildCost {
    /** 金币消耗 */
    gold:       number;
    /** 特殊材料消耗（可选），key = materialId */
    materials?: Record<string, number>;
}

/**
 * 单级建筑数值
 */
export interface IBuildingLevel {
    /** 本级的建造/升级消耗（第 1 级为初次建造费用） */
    buildCost:    IBuildCost;
    /** 解锁本级所需的玩家等级 */
    unlockLevel:  number;
    /** Storage 专属：本级提供的额外背包格子数 */
    extraSlots?:  number;
    /** Livestock 专属：本级最大饲养动物数量 */
    maxAnimals?:  number;
    /** House 专属：本级解锁的农场格子扩展（新增行/列） */
    farmExpand?:  { addRows: number; addCols: number };
    /** 本级描述文字（升级面板展示） */
    desc:         string;
}


// ─────────────────────────────────────────────────────────────────────────────
// 建筑主配置
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 建筑配置（静态，对应一种建筑的全部等级）
 */
export interface IBuildingConfig {
    /** 建筑 ID，如 'bld_barn' */
    id:           string;
    /** 显示名称 */
    name:         string;
    /** 简短描述（建筑列表展示） */
    desc:         string;
    /** 建筑类型 */
    type:         BuildingType;
    /** 图标资源路径（textures/buildings/{spriteDir}/spriteFrame） */
    spriteDir:    string;
    /** 最大等级（等于 levels.length） */
    maxLevel:     number;
    /** 各等级配置，索引 0 = 第 1 级（初次建造），索引 N-1 = 满级 */
    levels:       IBuildingLevel[];
    /**
     * Livestock 专属：饲养的动物类型 ID
     * 取值如 'chicken' / 'cow' / 'sheep'
     */
    animalType?:  string;
    /**
     * Livestock 专属：每天产出的物品 ID
     * 如 'product_egg'（只要动物被喂食当天即产出）
     */
    dailyOutputItemId?:  string;
    /** 每天每只动物产出的数量（配合 dailyOutputItemId） */
    dailyOutputCount?:   number;
}


// ─────────────────────────────────────────────────────────────────────────────
// 配置数据
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 建筑配置数组
 *
 * 命名规范：
 *   Storage   → bld_barn（仓库）
 *   Process   → bld_mill（磨坊）
 *   Livestock → bld_coop（鸡舍）
 *   House     → bld_house（农舍）
 */
const BUILDING_CONFIGS: IBuildingConfig[] = [

    // ── 仓库（Storage）────────────────────────────────────────────────────────
    {
        id:        'bld_barn',
        name:      '仓库',
        desc:      '建造后永久扩大背包容量，可多次升级。',
        type:      BuildingType.Storage,
        spriteDir: 'barn',
        maxLevel:  3,
        levels: [
            {
                buildCost:   { gold: 500 },
                unlockLevel: 1,
                extraSlots:  10,
                desc:        '初级仓库，背包容量 +10 格。',
            },
            {
                buildCost:   { gold: 1200, materials: { mat_wood: 5 } },
                unlockLevel: 3,
                extraSlots:  20,
                desc:        '中级仓库，背包容量再 +20 格。',
            },
            {
                buildCost:   { gold: 3000, materials: { mat_wood: 10, mat_stone: 5 } },
                unlockLevel: 5,
                extraSlots:  30,
                desc:        '高级仓库，背包容量再 +30 格，已达上限。',
            },
        ],
    },

    // ── 磨坊（Process）────────────────────────────────────────────────────────
    {
        id:        'bld_mill',
        name:      '磨坊',
        desc:      '将小麦等谷物加工成面粉，可进一步制作面包售卖。',
        type:      BuildingType.Process,
        spriteDir: 'mill',
        maxLevel:  2,
        levels: [
            {
                buildCost:   { gold: 800 },
                unlockLevel: 2,
                desc:        '初级磨坊，同时只能处理一批原料。',
            },
            {
                buildCost:   { gold: 2000, materials: { mat_stone: 8 } },
                unlockLevel: 4,
                desc:        '升级磨坊，加工速度提升 50%，解锁更多配方。',
            },
        ],
    },

    // ── 鸡舍（Livestock）─────────────────────────────────────────────────────
    {
        id:              'bld_coop',
        name:            '鸡舍',
        desc:            '饲养鸡，每天喂食后产出鸡蛋。',
        type:            BuildingType.Livestock,
        spriteDir:       'coop',
        maxLevel:        2,
        animalType:      'chicken',
        dailyOutputItemId: 'product_egg',
        dailyOutputCount:  1,
        levels: [
            {
                buildCost:   { gold: 600 },
                unlockLevel: 1,
                maxAnimals:  2,
                desc:        '初级鸡舍，最多饲养 2 只鸡。',
            },
            {
                buildCost:   { gold: 1500, materials: { mat_wood: 8 } },
                unlockLevel: 3,
                maxAnimals:  4,
                desc:        '升级鸡舍，最多饲养 4 只鸡，产量翻倍。',
            },
        ],
    },

    // ── 农舍（House）─────────────────────────────────────────────────────────
    {
        id:        'bld_house',
        name:      '农舍',
        desc:      '你的居所，升级后解锁更多农场格子与功能。',
        type:      BuildingType.House,
        spriteDir: 'house',
        maxLevel:  3,
        levels: [
            {
                buildCost:   { gold: 0 },    // 初始已存在，无需建造费用
                unlockLevel: 1,
                farmExpand:  { addRows: 0, addCols: 0 },
                desc:        '初始农舍，4×4 农场格子。',
            },
            {
                buildCost:   { gold: 1000, materials: { mat_wood: 5, mat_stone: 3 } },
                unlockLevel: 3,
                farmExpand:  { addRows: 2, addCols: 0 },
                desc:        '二级农舍，农场向南扩展 2 行（4×6）。',
            },
            {
                buildCost:   { gold: 2500, materials: { mat_wood: 10, mat_stone: 8, mat_gem: 1 } },
                unlockLevel: 5,
                farmExpand:  { addRows: 0, addCols: 2 },
                desc:        '三级农舍，农场向东扩展 2 列（6×6）。',
            },
        ],
    },
];


// ─────────────────────────────────────────────────────────────────────────────
// 加工配方数据
// ─────────────────────────────────────────────────────────────────────────────

const RECIPE_CONFIGS: IRecipeConfig[] = [

    // ── 磨坊配方 ──────────────────────────────────────────────────────────────
    {
        id:           'recipe_flour',
        name:         '小麦→面粉',
        buildingId:   'bld_mill',
        ingredients:  [{ itemId: 'crop_wheat', count: 3 }],
        outputItemId: 'product_flour',
        outputCount:  1,
        durationDays: 1,
        unlockLevel:  1,
    },
    {
        id:           'recipe_bread',
        name:         '面粉→面包',
        buildingId:   'bld_mill',
        ingredients:  [{ itemId: 'product_flour', count: 2 }],
        outputItemId: 'product_bread',
        outputCount:  1,
        durationDays: 0.5,
        unlockLevel:  2,   // 磨坊升至 2 级后解锁
    },
];


// ─────────────────────────────────────────────────────────────────────────────
// 查找 Map（模块加载时构建）
// ─────────────────────────────────────────────────────────────────────────────

const _buildingById = new Map<string, IBuildingConfig>();
const _recipeById   = new Map<string, IRecipeConfig>();
const _recipesByBuildingId = new Map<string, IRecipeConfig[]>();

(function _init() {
    for (const cfg of BUILDING_CONFIGS) {
        _buildingById.set(cfg.id, cfg);
    }
    for (const recipe of RECIPE_CONFIGS) {
        _recipeById.set(recipe.id, recipe);

        if (!_recipesByBuildingId.has(recipe.buildingId)) {
            _recipesByBuildingId.set(recipe.buildingId, []);
        }
        _recipesByBuildingId.get(recipe.buildingId)!.push(recipe);
    }
})();


// ─────────────────────────────────────────────────────────────────────────────
// 公开访问函数
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取建筑配置
 * @param buildingId  如 'bld_barn'
 */
export function getBuildingConfig(buildingId: string): IBuildingConfig | undefined {
    return _buildingById.get(buildingId);
}

/**
 * 获取所有建筑配置
 */
export function getAllBuildingConfigs(): readonly IBuildingConfig[] {
    return BUILDING_CONFIGS;
}

/**
 * 按类型过滤建筑配置
 */
export function getBuildingsByType(type: BuildingType): IBuildingConfig[] {
    return BUILDING_CONFIGS.filter(cfg => cfg.type === type);
}

/**
 * 获取某建筑指定等级的配置（level 从 1 开始）
 * @returns 等级配置，或 undefined（超出 maxLevel）
 */
export function getBuildingLevel(buildingId: string, level: number): IBuildingLevel | undefined {
    const cfg = _buildingById.get(buildingId);
    if (!cfg) return undefined;
    return cfg.levels[level - 1];
}

/**
 * 获取加工配方
 */
export function getRecipeConfig(recipeId: string): IRecipeConfig | undefined {
    return _recipeById.get(recipeId);
}

/**
 * 获取某建筑的所有配方（Process 建筑专用）
 */
export function getRecipesByBuilding(buildingId: string): IRecipeConfig[] {
    return _recipesByBuildingId.get(buildingId) ?? [];
}

/**
 * 获取所有加工配方
 */
export function getAllRecipeConfigs(): readonly IRecipeConfig[] {
    return RECIPE_CONFIGS;
}
