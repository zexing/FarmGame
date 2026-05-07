/**
 * 事件系统统一导出
 *
 * 使用方式：
 * import { FarmEvent, TimeEvent, PlayerEvent, SystemEvent } from '../events';
 * EventManager.instance.on(FarmEvent.CropHarvested, this.onHarvested, this);
 */

// ── 种田游戏核心事件（FarmEvents.ts）──────────────────────────────────────────
export {
    BuildingEvent,
    ExploreEvent,
    FarmEvent,
    FarmUIEvent,
    LivestockEvent,
    NpcEvent,
    TimeEvent
} from './FarmEvents';

export {
    PlayerEvent
} from './PlayerEvents';

// ── 系统 & 网络事件（SystemEvents.ts）────────────────────────────────────────
export {
    NetworkEvent,
    SystemEvent
} from './SystemEvents';


// ── 类型定义（EventPayloads.ts）──────────────────────────────────────────────
export type {
    EventCallback,
    EventPayload,
    EventPayloadMap,
    ICellPos,
    IFloatTextPayload,
    IItemPayload,
    IResourceChangePayload,
    ITimeSnapshot
} from './EventPayloads';

