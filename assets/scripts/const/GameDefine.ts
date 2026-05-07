/**
 * 游戏配置和常量定义
 *
 * 包含：
 * - 资源路径常量（GameDefine namespace）
 * - 游戏核心枚举：季节 / 天气 / 格子状态 / 作物阶段 / 建筑类型 / 物品类型
 * - 游戏数值常量：时间 / 地图 / 经济
 *
 * 事件系统请从 events/ 目录导入：
 * import { FarmEvent, TimeEvent, PlayerEvent } from '../events';
 */


// ─────────────────────────────────────────────────────────────────────────────
// 资源路径
// ─────────────────────────────────────────────────────────────────────────────

export namespace GameDefine {
    /** UI 预制体路径 */
    export const UIPrefabUrl = 'prefabs/ui/';
    /** 音效路径 */
    export const SoundsUrl = 'audios/';
    /** 通用纹理路径 */
    export const TexturesUrl = 'textures/';
    /** Spine 动画路径 */
    export const SpinesUrl = 'spines/';
    /** 作物帧动画路径（按作物ID分子目录） */
    export const CropSpritesUrl = 'textures/crops/';
    /** 地图贴图路径（地块/地形） */
    export const MapTilesUrl = 'textures/map/';
    /** 建筑贴图路径 */
    export const BuildingUrl = 'textures/buildings/';
    /** 角色/NPC 贴图路径 */
    export const CharacterUrl = 'textures/characters/';
    /** 物品图标路径（背包/商店用） */
    export const ItemIconUrl = 'textures/items/';
}


// ─────────────────────────────────────────────────────────────────────────────
// 季节
// ─────────────────────────────────────────────────────────────────────────────

export enum Season {
    Spring = 'spring',  // 春 — 适合萝卜、小麦等
    Summer = 'summer',  // 夏 — 适合番茄、玉米等
    Autumn = 'autumn',  // 秋 — 适合小麦、南瓜等
    Winter = 'winter',  // 冬 — 大多数作物无法种植
}

/** 季节顺序数组（用于循环推进） */
export const SEASON_ORDER: Season[] = [
    Season.Spring,
    Season.Summer,
    Season.Autumn,
    Season.Winter,
];

/** 季节显示名称 */
export const SEASON_NAMES: Record<Season, string> = {
    [Season.Spring]: '春',
    [Season.Summer]: '夏',
    [Season.Autumn]: '秋',
    [Season.Winter]: '冬',
};


// ─────────────────────────────────────────────────────────────────────────────
// 天气
// ─────────────────────────────────────────────────────────────────────────────

export enum Weather {
    Sunny = 'sunny',   // 晴天 — 普通，需手动浇水
    Cloudy = 'cloudy',  // 阴天 — 普通，需手动浇水
    Rainy = 'rainy',   // 雨天 — 自动为所有作物浇水
    Snowy = 'snowy',   // 雪天 — 仅冬季，作物生长减缓
    Stormy = 'stormy',  // 暴雨 — 有概率损坏成熟未收割的作物
}

/**
 * 各季节的天气权重（权重越高越常见）
 * 用于每天随机生成天气
 */
export const WEATHER_WEIGHTS: Record<Season, Partial<Record<Weather, number>>> = {
    [Season.Spring]: { [Weather.Sunny]: 4, [Weather.Cloudy]: 3, [Weather.Rainy]: 3 },
    [Season.Summer]: { [Weather.Sunny]: 5, [Weather.Cloudy]: 2, [Weather.Rainy]: 2, [Weather.Stormy]: 1 },
    [Season.Autumn]: { [Weather.Sunny]: 4, [Weather.Cloudy]: 4, [Weather.Rainy]: 2 },
    [Season.Winter]: { [Weather.Cloudy]: 4, [Weather.Snowy]: 5, [Weather.Sunny]: 1 },
};


// ─────────────────────────────────────────────────────────────────────────────
// 格子状态
// ─────────────────────────────────────────────────────────────────────────────

/** 地块的状态机枚举 */
export enum ECellState {
    Locked = 0,      // 未解锁（如果你后期做扩建）
    Untilled = 1,    // 荒地（长满杂草，需要用锄头开垦）
    Tilled = 2,      // 已开垦（松软的泥土，可以播种了）
    Planted = 3,     // 已种植（有作物在上面）
    Harvestable = 4, // 可收获（作物成熟）
    Withered = 5     // 枯萎（跨季或忘记浇水导致死亡）
}


// ─────────────────────────────────────────────────────────────────────────────
// 作物生长阶段
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 作物生长阶段，与美术帧数一一对应
 *
 * 具体阶段数由 CropConfig.growStages 决定（不同作物可能不同）
 * 这里定义的是通用的语义阶段，渲染层根据（当前阶段 / 总阶段数）映射到对应帧
 */
export enum CropStage {
    Seed = 0,  // 种子（刚种下，第0帧）
    Sprout = 1,  // 发芽
    Seedling = 2,  // 小苗
    Mature = 3,  // 成熟（最后一帧，触发 Harvestable 状态）
    Withered = 4,  // 枯萎（独立枯萎帧）
}


// ─────────────────────────────────────────────────────────────────────────────
// 建筑类型
// ─────────────────────────────────────────────────────────────────────────────

export enum BuildingType {
    /** 加工建筑 — 磨坊 / 烤炉 / 压榨机 / 奶酪坊 */
    Process = 'process',
    /** 仓库 — 扩大物品存储上限 */
    Storage = 'storage',
    /** 养殖舍 — 鸡舍 / 牛棚 / 羊圈 */
    Livestock = 'livestock',
    /** 主角居所 — 支持装饰系统 */
    House = 'house',
}


// ─────────────────────────────────────────────────────────────────────────────
// 养殖动物类型
// ─────────────────────────────────────────────────────────────────────────────

export enum AnimalType {
    Chicken = 'chicken',  // 鸡 → 产出鸡蛋
    Cow = 'cow',      // 牛 → 产出牛奶
    Sheep = 'sheep',    // 羊 → 产出羊毛
}


// ─────────────────────────────────────────────────────────────────────────────
// 物品类型
// ─────────────────────────────────────────────────────────────────────────────

export enum ItemType {
    /** 作物（收获所得原材料） */
    Crop = 'crop',
    /** 种子（购买后种植） */
    Seed = 'seed',
    /** 加工品（建筑加工后产出） */
    Product = 'product',
    /** 养殖产出（鸡蛋 / 牛奶 / 羊毛） */
    AnimalProd = 'animalProd',
    /** 特殊材料（探索区专属产出，用于解锁高级内容） */
    Material = 'material',
    /** 工具（铁锹 / 水壶 / 施肥桶） */
    Tool = 'tool',
    /** 装饰品（居所装饰用） */
    Decoration = 'decoration',
}


// ─────────────────────────────────────────────────────────────────────────────
// 时间常量
// ─────────────────────────────────────────────────────────────────────────────

export namespace TimeConst {
    /**
     * 游戏内 1 天对应的现实秒数
     * ⚠️ 调试期间改为 5，测试完记得改回 600
     */
    export const SECONDS_PER_DAY = 5;   // TODO: 上线前改回 600

    /** 一个季节的天数 */
    export const DAYS_PER_SEASON = 30;

    /** 一年的天数（4 个季节） */
    export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4;

    /** 探索区每日行动点上限 */
    export const MAX_ACTION_POINTS = 10;

    /** 雨天自动浇水：是否自动浇所有格子 */
    export const RAIN_AUTO_WATER = true;
}


// ─────────────────────────────────────────────────────────────────────────────
// 地图常量
// ─────────────────────────────────────────────────────────────────────────────


export namespace MapConst {

    // ─────────────────────────────────────────────────────────────────────────────
    // 世界地图常量
    // ─────────────────────────────────────────────────────────────────────────────

    /** 世界地图总行数（超大地图） */
    export const WORLD_ROWS = 32;

    /** 世界地图总列数 */
    export const WORLD_COLS = 32;

    // /** MVP 初始农场行数 */
    // export const INIT_ROWS = 4;
    // /** MVP 初始农场列数 */
    // export const INIT_COLS = 4;
    /**
    //  * 初始已耕地格子数量
    //  * 默认左上角 2×2 = 4 格已耕地，其余 12 格为空地
    //  */
    // export const INIT_TILLED = 4;

    /**
     * 格子像素宽度（2.5D 等距视角下的菱形格宽）
     * 实际渲染时：格子中心 x 偏移 = CELL_WIDTH / 2 * (col - row)
     */
    export const CELL_WIDTH = 128;
    /**
     * 格子像素高度（2.5D 等距视角下的菱形格高）
     * 实际渲染时：格子中心 y 偏移 = CELL_HEIGHT / 2 * (col + row)
     */
    export const CELL_HEIGHT = 96;

    /** 地图可见区域宽（设计分辨率） */
    export const VIEW_WIDTH = 1080;
    /** 地图可见区域高（设计分辨率） */
    export const VIEW_HEIGHT = 1920;


    // 🌟 新增：大世界区块配置
    export const CHUNK_SIZE = 32;      // 每个区块的标准格子数 (32x32)
    export const WORLD_CHUNKS_ROW = 2;  // 大世界纵向有多少个区块 (行)
    export const WORLD_CHUNKS_COL = 2;   // 大世界横向有多少个区块 (列);

    export const EXTRA_VIEWPORT_ROW = 2;    //额外多展示的视口横向格子数（防止穿帮）
    export const EXTRA_VIEWPORT_COL = 2;    //额外多展示的视口纵向格子数（防止穿帮）
}


// ─── TiledMap 相关枚举 ──────────────────────────────────────────────────

/**
 * TiledMap 图层名称强类型定义
 * 美术和策划在 Tiled 软件中建图层时，必须严格遵守这里的命名！
 */
export enum MapLayerName {
    Logic = 'Logic',       // 逻辑层 (半透明红绿菱形)
    Ground = 'Ground',     // 基础地表层 (草地、泥土)
    Obstacle = 'Obstacle', // 静态障碍物层 (树木、石头)
    Building = 'Building', // 建筑层 (房屋)
}

/**
 * TiledMap 逻辑色块的 GID 映射
 * 根据你在 logic_tiles.png 中画的顺序定义
 */
export enum LogicTileGID {
    Empty = 0,             // 透明/未涂色
    Untilled = 1,          // 绿块：可开垦的荒地
    Locked = 2,            // 红块：不可通行的锁定区域
}

// ─────────────────────────────────────────────────────────────────────────────
// 经济常量
// ─────────────────────────────────────────────────────────────────────────────

export namespace EconomyConst {
    /** 新玩家初始金币 */
    export const INIT_GOLD = 500;
    /** 背包单格最大叠加数量 */
    export const MAX_STACK = 999;
    /** 开垦一块空地的体力消耗（暂定，后续调整） */
    export const TILL_COST = 0;
    /** 单次施肥加速生长天数 */
    export const FERTILIZE_BONUS = 1;
}

