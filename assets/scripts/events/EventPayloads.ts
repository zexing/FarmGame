/**
 * 事件参数类型映射表
 *
 * 用途：为事件系统提供类型安全的参数定义
 * - 编译时类型检查：防止传错参数类型
 * - IDE 自动补全：提供参数提示
 * - 重构安全：修改参数结构时编译器自动报错
 *
 * 使用规范：
 * 1. 所有新增事件必须在此定义参数类型
 * 2. 参数类型优先使用已有接口，避免 any
 * 3. 无参数事件使用 void 类型
 * 4. 多个参数请使用对象类型，而不是数组，提高可读性
 *
 * @example
 * ```typescript
 * // ✅ 正确用法
 * EventManager.instance.dispatchEvent(FarmEvent.CropHarvested, {
 *     row: 1, col: 2, cropId: 'crop_tomato', count: 3
 * });
 *
 * EventManager.instance.on(FarmEvent.CropHarvested, (payload) => {
 *     // payload 自动推导为正确类型
 *     console.log(payload.cropId, payload.count);
 * });
 * ```
 */

import { IShakeCameraParam } from '../common/common_utils/ShakeCamera';
import { Season, Weather } from '../const/GameDefine';
import {
    BuildingEvent,
    ExploreEvent,
    FarmEvent,
    FarmUIEvent,
    LivestockEvent,
    NpcEvent,
    TimeEvent,
} from './FarmEvents';
import { PlayerEvent } from './PlayerEvents';
import { NetworkEvent, SystemEvent } from './SystemEvents';


// ─────────────────────────────────────────────────────────────────────────────
// 事件载荷数据结构
// ─────────────────────────────────────────────────────────────────────────────

/** 农场格子坐标 */
export interface ICellPos {
    row: number;
    col: number;
}

/** 时间信息快照 */
export interface ITimeSnapshot {
    day:    number;
    season: Season;
    year:   number;
}

/** 物品信息 */
export interface IItemPayload {
    itemId: string;
    count:  number;
}

/** 玩家资源变化（金币 / 材料 / 经验） */
export interface IResourceChangePayload {
    /** 变化量（正数=增加，负数=减少） */
    delta:  number;
    /** 变化后的总量 */
    total:  number;
}

/** 飘字提示 */
export interface IFloatTextPayload {
    /** 显示文本，如 "+35 金币" */
    text:   string;
    /** 飘字出现的世界坐标 */
    worldX: number;
    worldY: number;
}


// ─────────────────────────────────────────────────────────────────────────────
// 事件参数类型映射接口
// ─────────────────────────────────────────────────────────────────────────────

export interface EventPayloadMap {

    // =========================================================================
    // 系统事件
    // =========================================================================

    [SystemEvent.Update]:       number;
    [SystemEvent.LaterUpdate]:  void;
    [SystemEvent.ShakeCamera]:  IShakeCameraParam;
    [SystemEvent.GameTip]:      string;
    [SystemEvent.ClickSpace]:   void;
    [SystemEvent.ExitGame]:     void;

    // =========================================================================
    // 网络事件
    // =========================================================================

    [NetworkEvent.Error]:            string;
    [NetworkEvent.UserLoginSuccess]: void;
    [NetworkEvent.UserLoginFail]:    void;

    // =========================================================================
    // 农场操作事件（FarmEvent）
    // =========================================================================

    /** 格子被开垦 */
    [FarmEvent.CellTilled]: ICellPos;

    /** 作物种下：格子坐标 + 作物ID + 种子来源 */
    [FarmEvent.CropPlanted]: ICellPos & { cropId: string };

    /** 浇水完成：格子坐标 */
    [FarmEvent.CropWatered]: ICellPos;

    /** 施肥完成：格子坐标 */
    [FarmEvent.CropFertilized]: ICellPos;

    /** 作物生长推进：格子坐标 + 新阶段 */
    [FarmEvent.CropGrown]: ICellPos & { newStage: number };

    /** 作物成熟可收获：格子坐标 + 作物ID */
    [FarmEvent.CropHarvestable]: ICellPos & { cropId: string };

    /** 收获完成：格子坐标 + 作物ID + 收获数量 + 是否还能继续收 */
    [FarmEvent.CropHarvested]: ICellPos & {
        cropId:      string;
        count:       number;
        canHarvest:  boolean;  // false = 最后一次收获，格子将恢复 Tilled
    };

    /** 作物枯萎：格子坐标 + 原因 */
    [FarmEvent.CropWithered]: ICellPos & {
        cropId: string;
        reason: 'season' | 'weather' | 'expired';
    };

    /** 枯萎清除 */
    [FarmEvent.WitheredCleared]: ICellPos;

    /** 格子被点击（请求弹出操作菜单） */
    [FarmEvent.CellTapped]: ICellPos;

    /** 格子解锁 */
    [FarmEvent.CellUnlocked]: ICellPos;

    // =========================================================================
    // 时间事件（TimeEvent）
    // =========================================================================

    /** 天结束 */
    [TimeEvent.DayEnd]:   ITimeSnapshot;

    /** 新的一天开始 */
    [TimeEvent.DayBegin]: ITimeSnapshot;

    /** 季节切换：新旧季节 */
    [TimeEvent.SeasonChanged]: { oldSeason: Season; newSeason: Season; year: number };

    /** 新年 */
    [TimeEvent.YearChanged]: { year: number };

    /** 天气变化：新天气 + 当前时间 */
    [TimeEvent.WeatherChanged]: { weather: Weather } & ITimeSnapshot;

    /** 行动点重置 */
    [TimeEvent.ActionPointReset]: { max: number };

    // =========================================================================
    // 玩家事件（PlayerEvent）
    // =========================================================================

    /** 金币变化 */
    [PlayerEvent.GoldChanged]:        IResourceChangePayload;

    /** 特殊材料变化：材料ID + 变化量 + 总量 */
    [PlayerEvent.MaterialChanged]:    IResourceChangePayload & { materialId: string };

    /** 经验变化 */
    [PlayerEvent.ExpChanged]:         IResourceChangePayload;

    /** 升级：新等级 */
    [PlayerEvent.LevelUp]:            { newLevel: number; oldLevel: number };

    /** 物品加入背包 */
    [PlayerEvent.ItemAdded]:          IItemPayload;

    /** 物品从背包移除 */
    [PlayerEvent.ItemRemoved]:        IItemPayload;

    /** 行动点变化 */
    [PlayerEvent.ActionPointChanged]: IResourceChangePayload;

    /** 主角传送 */
    [PlayerEvent.PlayerTeleported]:   ICellPos;

    // =========================================================================
    // 建筑事件（BuildingEvent）
    // =========================================================================

    /** 建筑建成 */
    [BuildingEvent.Built]:             { buildingId: string; instanceId: string };

    /** 建筑拆除 */
    [BuildingEvent.Demolished]:        { instanceId: string };

    /** 建筑升级 */
    [BuildingEvent.Upgraded]:          { instanceId: string; newLevel: number };

    /** 加工开始 */
    [BuildingEvent.ProcessStart]:      { instanceId: string; recipeId: string };

    /** 加工完成 */
    [BuildingEvent.ProcessDone]:       { instanceId: string; recipeId: string; output: IItemPayload };

    /** 领取加工产出 */
    [BuildingEvent.ProcessCollected]:  { instanceId: string; output: IItemPayload };

    /** 仓库容量变化 */
    [BuildingEvent.StorageCapChanged]: { newCap: number };

    // =========================================================================
    // 养殖事件（LivestockEvent）
    // =========================================================================

    [LivestockEvent.AnimalAdded]:      { animalId: string; animalType: string };
    [LivestockEvent.AnimalFed]:        { animalId: string };
    [LivestockEvent.ProductReady]:     { animalId: string; output: IItemPayload };
    [LivestockEvent.ProductCollected]: { animalId: string; output: IItemPayload };
    [LivestockEvent.AnimalHungry]:     { animalId: string };

    // =========================================================================
    // 探索事件（ExploreEvent）
    // =========================================================================

    [ExploreEvent.AreaEntered]:       void;
    [ExploreEvent.AreaExited]:        void;
    [ExploreEvent.ResourceCollected]: IItemPayload & { nodeId: string };
    [ExploreEvent.ActionPointUsed]:   { cost: number; remaining: number };
    [ExploreEvent.ActionPointEmpty]:  void;
    [ExploreEvent.NodeRefreshed]:     void;

    // =========================================================================
    // NPC 事件（NpcEvent）
    // =========================================================================

    [NpcEvent.Interacted]:    { npcId: string };
    [NpcEvent.DialogueDone]:  { npcId: string };
    [NpcEvent.QuestAccepted]: { npcId: string; questId: string };
    [NpcEvent.QuestCompleted]:{ npcId: string; questId: string };
    [NpcEvent.FavorityUp]:    { npcId: string; delta: number; total: number };

    // =========================================================================
    // 种田 UI 事件（FarmUIEvent）
    // =========================================================================

    [FarmUIEvent.ShowCellMenu]:   ICellPos;
    [FarmUIEvent.HideCellMenu]:   void;
    [FarmUIEvent.OpenInventory]:  void;
    [FarmUIEvent.CloseInventory]: void;
    [FarmUIEvent.OpenShop]:       void;
    [FarmUIEvent.CloseShop]:      void;
    [FarmUIEvent.OpenBuilding]:   void;
    [FarmUIEvent.CloseBuilding]:  void;
    [FarmUIEvent.HudRefresh]:     void;
    [FarmUIEvent.ShowFloatText]:  IFloatTextPayload;
    [FarmUIEvent.ShowToast]:      { text: string; duration?: number };

}


// ─────────────────────────────────────────────────────────────────────────────
// 辅助类型（保持与原框架兼容）
// ─────────────────────────────────────────────────────────────────────────────

/** 从事件名提取参数类型 */
export type EventPayload<K extends keyof EventPayloadMap> = EventPayloadMap[K];

/** 事件回调函数类型（根据事件名自动推导参数类型） */
export type EventCallback<K extends keyof EventPayloadMap> =
    EventPayloadMap[K] extends void
    ? () => void
    : (payload: EventPayloadMap[K]) => void;
