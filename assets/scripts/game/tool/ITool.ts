/**
 * 工具系统接口 — ITool
 *
 * 所有玩家装备工具的公共契约：
 *   - id       : 工具唯一标识（对应 ItemType.Tool 的 itemId，如 'tool_hoe'）
 *   - name     : 显示名称（中文，用于 Toast / Tooltip）
 *   - iconPath : 工具图标资源路径（用于 ToolBarView 渲染）
 *   - canUse   : 判断当前格子是否可以使用此工具（根据格子状态）
 *   - use      : 对格子执行操作（由 ToolManager 在 canUse=true 时调用）
 *
 * 设计原则：
 *   - 工具本身不持有 FarmController 引用，由 ToolManager 在初始化时注入
 *   - 工具不直接操作数据，通过 FarmController 的公开方法完成
 *   - 工具不直接操作背包，通过 InventoryManager 单例访问
 */

import { ICellData } from '../map/IMap';
import type { MapController } from '../map/MapController';


// ─────────────────────────────────────────────────────────────────────────────
// 工具上下文（工具执行时的环境信息）
// ─────────────────────────────────────────────────────────────────────────────

// 1. 给代码逻辑用的枚举（只写英文，用于判断和传参）
export enum ToolId {
    None = 0,
    Hoe = 1,
    WateringCan = 2,
    Seed = 3,
    Sickle = 4,
    Clear = 5,
}

// 2. 给 UI 界面用的显示字典
export const ToolNameMap: Record<ToolId, string> = {
    [ToolId.None]: "",
    [ToolId.Hoe]: "锄头",
    [ToolId.WateringCan]: "水壶",
    [ToolId.Seed]: "种子袋",
    [ToolId.Sickle]: "镰刀",
    [ToolId.Clear]: "十字镐",
};

/**
 * 工具执行上下文
 * 由 ToolManager 在调用 use() 时构造并传入
 */
export interface IToolContext {
    /** 农场控制器（执行格子操作） */
    farmCtrl: MapController;
}


// ─────────────────────────────────────────────────────────────────────────────
// ITool 接口
// ─────────────────────────────────────────────────────────────────────────────

export interface ITool {

    /** 工具唯一 ID（如 'tool_hoe', 'tool_can', 'tool_seeds' 等） */
    readonly id: string;

    /** 显示名称（中文，用于 UI 显示） */
    readonly name: string;

    /** 工具图标资源路径（用于 ToolBarView 渲染图标） */
    readonly iconPath: string;

    /**
     * 判断此工具能否作用于给定格子
     *
     * @param cell  目标格子数据（可为 null，表示 Locked 或越界格子）
     * @returns     true = 可以使用（按钮高亮）；false = 不可使用（按钮置灰）
     */
    canUse(cell: ICellData | null): boolean;

    /**
     * 对指定格子执行工具操作
     * 只在 canUse() 返回 true 时被调用
     *
     * @param row   目标格子行
     * @param col   目标格子列
     * @param cell  目标格子数据
     * @param ctx   工具执行上下文
     * @returns     是否操作成功（用于 ToolManager 决定是否播放反馈动画）
     */
    use(row: number, col: number, cell: ICellData, ctx: IToolContext): boolean;
}
