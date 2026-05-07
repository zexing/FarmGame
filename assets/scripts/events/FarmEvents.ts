/**
 * 种田游戏事件枚举
 *
 * 按功能模块分类，所有事件名遵循 "模块.动作" 命名规范，确保全局唯一。
 *
 * 使用示例：
 * ```typescript
 * import { FarmEvent, TimeEvent, PlayerEvent } from '../events';
 *
 * // 监听作物成熟
 * EventManager.instance.on(FarmEvent.CropHarvestable, (payload) => {
 *     console.log(`格子 (${payload.row}, ${payload.col}) 的作物已成熟`);
 * }, this);
 *
 * // 派发收获事件
 * EventManager.instance.dispatchEvent(FarmEvent.CropHarvested, {
 *     row: 1, col: 2, cropId: 'crop_tomato', count: 3
 * });
 * ```
 */


// ─────────────────────────────────────────────────────────────────────────────
// 农场操作事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 农场格子操作事件
 * 由玩家主动操作触发（开垦 / 播种 / 浇水 / 施肥 / 收获）
 */
export enum FarmEvent {
    /** 格子被开垦（空地 → 耕地） */
    CellTilled        = 'farm.cellTilled',
    /** 作物种下（耕地 → 已种植） */
    CropPlanted       = 'farm.cropPlanted',
    /** 浇水完成 */
    CropWatered       = 'farm.cropWatered',
    /** 施肥完成 */
    CropFertilized    = 'farm.cropFertilized',
    /** 作物生长阶段推进（每天天结束时触发） */
    CropGrown         = 'farm.cropGrown',
    /** 作物成熟，可以收获（状态变为 Harvestable） */
    CropHarvestable   = 'farm.cropHarvestable',
    /** 收获完成，物品已加入背包 */
    CropHarvested     = 'farm.cropHarvested',
    /** 作物枯萎（季节切换 / 特殊天气 / 超期未收） */
    CropWithered      = 'farm.cropWithered',
    /** 枯萎作物被清除（耕地恢复为 Tilled 状态） */
    WitheredCleared   = 'farm.witheredCleared',
    /** 玩家点击格子（请求显示操作菜单） */
    CellTapped        = 'farm.cellTapped',
    /** 格子解锁（Locked → Empty） */
    CellUnlocked      = 'farm.cellUnlocked',

    /** 地块状态发生改变时触发。载荷: { row: number, col: number, newState: CellState } */
    CellStateChanged = "FarmEvent.CellStateChanged"
}


// ─────────────────────────────────────────────────────────────────────────────
// 游戏内时间事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 游戏内时间流逝事件
 * 由 WorldTimeManager 在时间推进节点自动触发
 */
export enum TimeEvent {
    /**
     * 当天结束（每游戏天推进时触发）
     * 触发顺序：作物生长 → 建筑加工 → 养殖产出 → 探索刷新 → 行动点重置 → 新天气
     */
    DayEnd           = 'time.dayEnd',
    /** 新的一天开始（DayEnd 处理完毕后触发，用于 UI 刷新） */
    DayBegin         = 'time.dayBegin',
    /** 季节切换（当 day > DAYS_PER_SEASON 时触发） */
    SeasonChanged    = 'time.seasonChanged',
    /** 新年开始 */
    YearChanged      = 'time.yearChanged',
    /** 当日天气生成（每天开始时触发，用于 UI 天气图标刷新） */
    WeatherChanged   = 'time.weatherChanged',
    /** 行动点重置（每天开始时，探索行动点恢复满格） */
    ActionPointReset = 'time.apReset',
}



// ─────────────────────────────────────────────────────────────────────────────
// 建筑事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 建筑系统事件
 */
export enum BuildingEvent {
    /** 建筑建造完成 */
    Built              = 'building.built',
    /** 建筑被拆除 */
    Demolished         = 'building.demolished',
    /** 建筑升级完成 */
    Upgraded           = 'building.upgraded',
    /** 加工任务开始（投入原料） */
    ProcessStart       = 'building.processStart',
    /** 加工任务完成（产出物品可领取） */
    ProcessDone        = 'building.processDone',
    /** 领取加工产出 */
    ProcessCollected   = 'building.processCollected',
    /** 仓库容量变化（升级后触发） */
    StorageCapChanged  = 'building.storageCapChanged',
}


// ─────────────────────────────────────────────────────────────────────────────
// 养殖事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 养殖系统事件
 */
export enum LivestockEvent {
    /** 购入新动物 */
    AnimalAdded        = 'livestock.animalAdded',
    /** 喂养动物 */
    AnimalFed          = 'livestock.animalFed',
    /** 动物产出就绪（可以收取） */
    ProductReady       = 'livestock.productReady',
    /** 收取动物产出 */
    ProductCollected   = 'livestock.productCollected',
    /** 动物未被喂养（今日漏喂，产出暂停） */
    AnimalHungry       = 'livestock.animalHungry',
}


// ─────────────────────────────────────────────────────────────────────────────
// 探索事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 探索区系统事件
 */
export enum ExploreEvent {
    /** 进入探索区 */
    AreaEntered        = 'explore.areaEntered',
    /** 离开探索区 */
    AreaExited         = 'explore.areaExited',
    /** 采集资源成功（矿石 / 野菜 / 钓鱼） */
    ResourceCollected  = 'explore.resourceCollected',
    /** 消耗行动点 */
    ActionPointUsed    = 'explore.apUsed',
    /** 行动点耗尽，无法继续探索 */
    ActionPointEmpty   = 'explore.apEmpty',
    /** 探索区资源节点刷新（每游戏日天结束时） */
    NodeRefreshed      = 'explore.nodeRefresh',
}


// ─────────────────────────────────────────────────────────────────────────────
// 商店事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 商店业务事件（ShopController 派发，供其他系统监听）
 */
export enum ShopEvent {
    /** 购买成功（种子已加入背包，金币已扣除） */
    ItemBought = 'shop.bought',
    /** 出售成功（作物已移出背包，金币已增加） */
    ItemSold   = 'shop.sold',
}

/**
 * 商店 UI 交互事件（ShopItemCell 派发，ShopView 订阅执行）
 */
export enum ShopUIEvent {
    /** 玩家点击购买按钮 */
    BuyItem  = 'shopUI.buyItem',
    /** 玩家点击出售按钮 */
    SellItem = 'shopUI.sellItem',
}


// ─────────────────────────────────────────────────────────────────────────────
// NPC 与任务事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NPC 交互与任务系统事件
 */
export enum NpcEvent {
    /** 玩家与 NPC 交互（点击对话） */
    Interacted         = 'npc.interacted',
    /** 对话结束 */
    DialogueDone       = 'npc.dialogueDone',
    /** 任务接受 */
    QuestAccepted      = 'npc.questAccepted',
    /** 任务完成 */
    QuestCompleted     = 'npc.questCompleted',
    /** 好感度提升（预留，后续版本启用） */
    FavorityUp         = 'npc.favorityUp',
}


// ─────────────────────────────────────────────────────────────────────────────
// UI 事件（种田游戏专属）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 种田游戏 UI 事件
 * 通用 UI 事件（UIManager 相关）继续使用 UIEvents.ts 中的定义
 */
export enum FarmUIEvent {
    /** 显示格子操作菜单（开垦 / 播种 / 浇水 / 收获） */
    ShowCellMenu       = 'farmUI.showCellMenu',
    /** 关闭格子操作菜单 */
    HideCellMenu       = 'farmUI.hideCellMenu',
    /** 打开背包面板 */
    OpenInventory      = 'farmUI.openInventory',
    /** 关闭背包面板 */
    CloseInventory     = 'farmUI.closeInventory',
    /** 打开商店面板 */
    OpenShop           = 'farmUI.openShop',
    /** 关闭商店面板 */
    CloseShop          = 'farmUI.closeShop',
    /** 打开建筑面板 */
    OpenBuilding       = 'farmUI.openBuilding',
    /** 关闭建筑面板 */
    CloseBuilding      = 'farmUI.closeBuilding',
    /** HUD 刷新（金币 / 等级 / 日期 / 行动点变化后触发） */
    HudRefresh         = 'farmUI.hudRefresh',
    /** 显示飘字提示（如 "+35 金币"） */
    ShowFloatText      = 'farmUI.showFloatText',
    /** 显示 Toast 消息 */
    ShowToast          = 'farmUI.showToast',

    // ── ActionMenuView 按钮事件（ActionMenuView 派发，FarmView 订阅执行）────
    /** 点击"开垦"按钮 */
    BtnTillTapped      = 'farmUI.btn.till',
    /** 点击"播种"按钮 */
    BtnPlantTapped     = 'farmUI.btn.plant',
    /** 点击"浇水"按钮 */
    BtnWaterTapped     = 'farmUI.btn.water',
    /** 点击"施肥"按钮 */
    BtnFertilizeTapped = 'farmUI.btn.fertilize',
    /** 点击"收获"按钮 */
    BtnHarvestTapped   = 'farmUI.btn.harvest',
    /** 点击"清除枯萎"按钮 */
    BtnClearTapped     = 'farmUI.btn.clear',
}
