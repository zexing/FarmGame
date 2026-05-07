import { Node } from "cc";

/** 界面唯一标识（方便服务器通过编号数据触发界面打开） */
export enum UIID {
    NONE,
    /**系统提示 */
    SystemBox = 1,
    /**游戏提示 */
    GameTip = 2,
    /**商店界面 */
    Shop = 3,
    /**Toast 提示界面 */
    Toast = 4,
    /**背包界面 */
    Inventory = 5,
    /** 工具快捷栏 */
    ToolBar = 6,
}
export enum LayerType {
    /** 游戏层 */
    Game = "Game",
    /** UI层 */
    UI = "UI",
    /**弹窗层 */
    PopupUI = "PopupUI",
    /**跑马灯层 */
    MarqueeUI = "MarqueeUI",
}
export interface UIInfo {
    /** 窗口层级 */
    layer: LayerType;
    /** 预制资源相对路径 */
    prefab: string;
    /** 界面ID */
    viewId?: number;
    /** 是否唯一弹窗 **/
    onlyPop?: boolean;
    /** 是否不阻挡唯一弹窗效果（不影响onlyPop生效） **/
    onlyUnPop?: boolean;
    /**功能表ID，用来判断能否打开界面 */
    functionId?: number;

}
/** 打开界面方式的配置数据 */
export var UIConfigData: { [key: number]: UIInfo } = {
    /****UI界面****/
    [UIID.GameTip]: { layer: LayerType.PopupUI, prefab: "UIGameTipView" },
    [UIID.Shop]: { layer: LayerType.PopupUI, prefab: "UIShopView", onlyPop: true },
    [UIID.Toast]: { layer: LayerType.MarqueeUI, prefab: "UIToastPop" },
    [UIID.Inventory]: { layer: LayerType.PopupUI, prefab: "UIInventoryView", onlyPop: true },
    // 注意：工具栏属于常驻游戏主界面的 UI，所以层级设为 LayerType.UI
    [UIID.ToolBar]: { layer: LayerType.UI, prefab: "UIToolBarView" },
}

/** 本类型仅供gui模块内部使用，请勿在功能逻辑中使用 */
export class ViewParams {
    /** 界面唯一标识 */
    uuid!: string;
    /** 预制路径 */
    prefabPath!: string;
    /** 传递给打开界面的参数 */
    params: any | null;
    /** 窗口事件 */
    callbacks!: Function | null;
    /** 是否在使用状态 */
    valid: boolean = false;
    /** 是否在正在打开 */
    opening: boolean = false;
    /** 界面根节点 */
    node: Node | null = null;
    /** 界面层级 */
    layer: LayerType | null = null;
    /** 界面ID */
    viewId: number;
    /** 是否不阻挡唯一弹窗效果（不影响onlyPop生效） **/
    onlyUnPop?: boolean;

}