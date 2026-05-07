/**
 * 玩家等级配置表
 *
 * 设计原则：
 * - expToNext：从当前等级升到下一级所需的「本级经验」（不是累计值）
 * - unlocks：该等级解锁的内容（描述字符串，供 UI 展示和 Controller 判断）
 * - MVP 阶段：10 级上限，等级曲线平缓，约 2~3 周在线即可满级
 *
 * 经验来源（参考值）：
 *   收获萝卜   +8 exp
 *   收获小麦   +15 exp
 *   收获番茄   +20 exp（每次收获）
 *   收获南瓜   +30 exp
 *
 * 解锁规划（MVP）：
 *   Lv.1  初始 4×4（左上角 2×2 已耕地）
 *   Lv.2  解锁农场右侧 2 列 → 4×6
 *   Lv.3  解锁磨坊建筑蓝图
 *   Lv.4  解锁农场下方 2 行 → 6×6
 *   Lv.5  解锁鸡舍蓝图
 *   Lv.6  解锁探索区北部（更多资源节点）
 *   Lv.7  解锁奶牛舍蓝图
 *   Lv.8  解锁高级作物（需要商店购买）
 *   Lv.9  解锁农场进一步扩展 → 8×8
 *   Lv.10 满级，解锁全部内容
 */


// ─────────────────────────────────────────────────────────────────────────────
// 接口定义
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 单级配置
 */
export interface ILevelConfig {
    /** 等级（1 起） */
    readonly level: number;

    /**
     * 升到下一级所需的本级经验量
     * 满级（LEVEL_CONFIGS 最后一条）此字段为 0，代表无法继续升级
     */
    readonly expToNext: number;

    /**
     * 达到本等级时解锁的内容 ID 列表
     * 内容 ID 由各系统自行解析（如 'farm.expand.6x6'、'building.mill' 等）
     * 空数组表示该等级无特殊解锁
     */
    readonly unlocks: string[];
}

/**
 * 等级存档数据（最小化，只存 level 和 currentExp）
 */
export interface ILevelSaveData {
    level:      number;
    currentExp: number;  // 当前等级内已积累的经验（不是总经验）
}


// ─────────────────────────────────────────────────────────────────────────────
// 配置表
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MVP 10 级经验配置
 *
 * 经验曲线设计：
 *   前期（1~3级）：门槛低，新手很快感受到成长；
 *   中期（4~7级）：中速攀升，持续提供目标感；
 *   后期（8~10级）：放缓，大量种植才能满级，延长游戏寿命。
 */
const LEVEL_CONFIGS: ILevelConfig[] = [
    { level: 1,  expToNext: 100,  unlocks: [] },
    { level: 2,  expToNext: 200,  unlocks: ['farm.expand.cols', 'shop.wheat'] },
    { level: 3,  expToNext: 350,  unlocks: ['building.mill'] },
    { level: 4,  expToNext: 550,  unlocks: ['farm.expand.rows'] },
    { level: 5,  expToNext: 900,  unlocks: ['building.chicken_coop'] },
    { level: 6,  expToNext: 1400, unlocks: ['explore.north'] },
    { level: 7,  expToNext: 2200, unlocks: ['building.cow_shed'] },
    { level: 8,  expToNext: 3500, unlocks: ['shop.advanced_crops'] },
    { level: 9,  expToNext: 5500, unlocks: ['farm.expand.large'] },
    { level: 10, expToNext: 0,    unlocks: ['all'] },  // 满级
];

/** 最大等级 */
export const MAX_LEVEL = LEVEL_CONFIGS.length;

// ── 内部索引 ─────────────────────────────────────────────────────────────────

/** level → ILevelConfig，快速查找 */
const _configByLevel = new Map<number, ILevelConfig>();

(function buildIndex() {
    for (const cfg of LEVEL_CONFIGS) {
        _configByLevel.set(cfg.level, cfg);
    }
})();


// ─────────────────────────────────────────────────────────────────────────────
// 查询函数
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取指定等级的配置
 * @param level 等级（1 ~ MAX_LEVEL）
 * @returns 配置，不存在时返回 null
 */
export function getLevelConfig(level: number): ILevelConfig | null {
    return _configByLevel.get(level) ?? null;
}

/**
 * 获取从当前等级升到下一级所需的经验量
 * @param currentLevel 当前等级
 * @returns 所需经验；已满级时返回 0
 */
export function getExpToNextLevel(currentLevel: number): number {
    const cfg = getLevelConfig(currentLevel);
    return cfg ? cfg.expToNext : 0;
}

/**
 * 判断是否已达到最高等级
 */
export function isMaxLevel(level: number): boolean {
    return level >= MAX_LEVEL;
}

/**
 * 获取指定等级的所有解锁内容 ID
 */
export function getUnlocks(level: number): string[] {
    return getLevelConfig(level)?.unlocks ?? [];
}

/**
 * 获取全部配置（用于 UI 展示等级路线图）
 */
export function getAllLevelConfigs(): readonly ILevelConfig[] {
    return LEVEL_CONFIGS;
}
