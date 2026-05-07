/**
 * 作物静态配置表
 *
 * 设计原则：
 * - 所有数值均在此处集中管理，业务代码只读配置，不硬编码
 * - ID 规范：'crop_' 前缀 + 英文名（小写下划线），如 'crop_tomato'
 * - 种子 ID 规范：'seed_' 前缀，如 'seed_tomato'
 *
 * MVP 阶段包含 4 种作物（覆盖春/夏/秋三个季节）：
 *   萝卜（春）/ 小麦（春秋）/ 番茄（夏，多次收获）/ 南瓜（秋）
 *
 * 后期扩展：在 CROP_CONFIGS 中追加新条目即可，无需修改任何业务代码
 */

import { Season } from '../const/GameDefine';


// ─────────────────────────────────────────────────────────────────────────────
// 接口定义
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 单种作物的完整配置
 */
export interface ICropConfig {
    // ── 基础信息 ──────────────────────────────────────────────────────────────

    /** 作物唯一ID */
    readonly cropId: number;

    /** 对应种子ID*/
    readonly seedId: number;

    /** 显示名称（中文） */
    readonly name: string;

    /** 简短描述（商店/背包 tooltip 用） */
    readonly desc: string;

    // ── 种植规则 ──────────────────────────────────────────────────────────────

    /**
     * 可种植的季节列表
     * 跨季节作物（如小麦）可填多个季节
     * 在不在列表内的季节不允许种植
     */
    readonly seasons: Season[];

    /**
     * 生长所需总天数（游戏内天）
     * 每天天结束时，若今天已浇水则推进 1 天
     * 施肥可额外推进 1 天（见 EconomyConst.FERTILIZE_BONUS）
     */
    readonly growDays: number;

    /**
     * 生长阶段数（对应帧动画张数，不含枯萎帧）
     * 渲染层根据（已生长天数 / 总天数）映射到对应帧
     *
     * 例：growStages = 4 时，动画帧为 0/1/2/3（成熟）
     */
    readonly growStages: number;

    /**
     * 可收获次数
     * 1 = 一次性（收获后格子恢复为 Tilled）
     * >1 = 多次收获（收获后退回倒数第二个生长阶段，继续生长）
     *
     * 例：番茄可收 3 次，第 3 次收获后格子恢复 Tilled
     */
    readonly harvestCount: number;

    /**
     * 多次收获时，每次再生长所需天数
     * 仅在 harvestCount > 1 时有效
     * 默认与 growDays 不同（再生往往比首次短）
     */
    readonly reGrowDays?: number;

    // ── 经济数值 ──────────────────────────────────────────────────────────────

    /** 种子购买价（金币）—— 商人处购买 */
    readonly seedPrice: number;

    /**
     * 收获卖出价（金币/次）
     * 多次收获作物每次卖出价相同
     */
    readonly sellPrice: number;

    /** 每次收获给予的玩家经验值 */
    readonly expReward: number;

    // ── 解锁条件 ──────────────────────────────────────────────────────────────

    /** 解锁所需玩家等级（0 = 初始就可用） */
    readonly unlockLevel: number;

    // // ── 美术资源 ──────────────────────────────────────────────────────────────

    // /**
    //  * 精灵帧目录名（位于 GameDefine.CropSpritesUrl 下）
    //  * 例：'tomato' → 'textures/crops/tomato/0.png', '1.png', ...
    //  */
    // readonly spriteDir: string;
}


// // ─────────────────────────────────────────────────────────────────────────────
// // MVP 作物配置数据
// // ─────────────────────────────────────────────────────────────────────────────

// const CROP_CONFIGS: ICropConfig[] = [

//     // ── 萝卜（春季，短周期入门作物）────────────────────────────────────────────
//     {
//         id:           'crop_radish',
//         seedId:       'seed_radish',
//         name:         '萝卜',
//         desc:         '春季最常见的蔬菜，生长快，是新手的好帮手。',
//         seasons:      [Season.Spring],
//         growDays:     3,
//         growStages:   4,    // 种子 / 发芽 / 小苗 / 成熟
//         harvestCount: 1,
//         seedPrice:    10,
//         sellPrice:    35,
//         expReward:    8,
//         unlockLevel:  0,
//         spriteDir:    'radish',
//     },

//     // ── 小麦（春秋两季，中期稳定货源）──────────────────────────────────────────
//     {
//         id:           'crop_wheat',
//         seedId:       'seed_wheat',
//         name:         '小麦',
//         desc:         '春秋两季均可种植，是面粉等加工品的重要原料。',
//         seasons:      [Season.Spring, Season.Autumn],
//         growDays:     7,
//         growStages:   4,    // 种子 / 麦苗 / 抽穗 / 成熟
//         harvestCount: 1,
//         seedPrice:    20,
//         sellPrice:    80,
//         expReward:    15,
//         unlockLevel:  0,
//         spriteDir:    'wheat',
//     },

//     // ── 番茄（夏季，可多次收获的中高价值作物）──────────────────────────────────
//     {
//         id:           'crop_tomato',
//         seedId:       'seed_tomato',
//         name:         '番茄',
//         desc:         '夏季特有的多汁果实，成熟后可连续采摘多次。',
//         seasons:      [Season.Summer],
//         growDays:     14,   // 首次成熟所需天数
//         growStages:   5,    // 种子 / 发芽 / 小苗 / 开花 / 成熟
//         harvestCount: 3,    // 可收获 3 次
//         reGrowDays:   5,    // 每次再生长 5 天
//         seedPrice:    50,
//         sellPrice:    60,   // 每次收获卖 60 金，3 次共 180 金
//         expReward:    20,
//         unlockLevel:  0,
//         spriteDir:    'tomato',
//     },

//     // ── 南瓜（秋季，高价值单次收获作物）────────────────────────────────────────
//     {
//         id:           'crop_pumpkin',
//         seedId:       'seed_pumpkin',
//         name:         '南瓜',
//         desc:         '秋季丰收的象征，个头圆润饱满，价格不菲。',
//         seasons:      [Season.Autumn],
//         growDays:     10,
//         growStages:   4,    // 种子 / 小苗 / 藤蔓 / 成熟
//         harvestCount: 1,
//         seedPrice:    40,
//         sellPrice:    150,
//         expReward:    30,
//         unlockLevel:  0,
//         spriteDir:    'pumpkin',
//     },

// ];


// // ─────────────────────────────────────────────────────────────────────────────
// // 索引与访问接口
// // ─────────────────────────────────────────────────────────────────────────────

// /** 以 cropId 为 key 的快速查找 Map（模块初始化时构建一次） */
// const _cropById = new Map<string, ICropConfig>(
//     CROP_CONFIGS.map(c => [c.id, c])
// );

// /** 以 seedId 为 key 的快速查找 Map */
// const _cropBySeedId = new Map<string, ICropConfig>(
//     CROP_CONFIGS.map(c => [c.seedId, c])
// );

// /**
//  * 根据作物 ID 获取配置
//  * @param cropId 作物ID，如 'crop_tomato'
//  * @returns 配置对象，不存在时返回 undefined 并打印警告
//  */
// export function getCropConfig(cropId: string): ICropConfig | undefined {
//     const cfg = _cropById.get(cropId);
//     if (!cfg) {
//         console.warn(`[CropConfig] 未找到作物配置: ${cropId}`);
//     }
//     return cfg;
// }

// /**
//  * 根据种子 ID 获取对应作物配置
//  * @param seedId 种子ID，如 'seed_tomato'
//  */
// export function getCropConfigBySeed(seedId: string): ICropConfig | undefined {
//     const cfg = _cropBySeedId.get(seedId);
//     if (!cfg) {
//         console.warn(`[CropConfig] 未找到种子对应的作物配置: ${seedId}`);
//     }
//     return cfg;
// }

// /**
//  * 获取指定季节内所有可种植的作物配置列表
//  * @param season 当前季节
//  */
// export function getCropsBySeaon(season: Season): ICropConfig[] {
//     return CROP_CONFIGS.filter(c => c.seasons.includes(season));
// }

// /**
//  * 获取所有作物配置（只读）
//  * 用于商店展示全部作物列表
//  */
// export function getAllCropConfigs(): readonly ICropConfig[] {
//     return CROP_CONFIGS;
// }

// /**
//  * 检查某种作物是否可在指定季节种植
//  * @param cropId 作物ID
//  * @param season 当前季节
//  */
// export function canPlantInSeason(cropId: string, season: Season): boolean {
//     const cfg = _cropById.get(cropId);
//     return cfg ? cfg.seasons.includes(season) : false;
// }
