/**
 * MVC 公共框架 — 接口定义
 *
 * 设计原则：
 * - 所有接口均使用泛型，不依赖任何业务类型
 * - IModel / IView 作为约束边界，业务层继承后自行扩展
 * - ICtrlBase 统一 init / destroy 生命周期契约
 * - IController 作为顶层控制器入口，聚合子控制器访问
 *
 * 使用方式（业务层）：
 * ```typescript
 * // 1. 定义业务 Model / View 接口，继承框架接口
 * interface IMyModel extends IModel { ... }
 * interface IMyView extends IView { ... }
 *
 * // 2. 定义子控制器接口，继承 ISubCtrl
 * interface IMyRollCtrl extends ISubCtrl<IMyModel, IMyView> { startRoll(): void; }
 *
 * // 3. 定义顶层控制器接口，继承 IController
 * interface IMyController extends IController<IMyModel, IMyView> {
 *     getRollCtrl(): IMyRollCtrl;
 * }
 * ```
 */


// ─────────────────────────────────────────────
// Model 边界接口
// ─────────────────────────────────────────────

/**
 * 所有 Model 的基础约束接口
 * 业务 Model 接口应继承此接口
 */
export interface IMVCModel {

    /** 重置所有数据（通常在游戏重置或关卡切换时调用） */
    clear(): void;
}


// ─────────────────────────────────────────────
// View 边界接口
// ─────────────────────────────────────────────

/**
 * 所有 View 的基础约束接口
 * 业务 View 接口应继承此接口，并暴露子控制器所需的节点/组件 Getter
 */
export interface IMVCView {
    // 标记接口，业务 View 自行扩展 Getter 方法
    // 例：getWildRenderer(): WildRenderer;
}

// ─────────────────────────────────────────────
// 顶层控制器接口
// ─────────────────────────────────────────────

/**
 * 顶层控制器基础接口（Board-level Controller）
 *
 * 职责：
 * - 协调所有子控制器
 * - 作为外部（上层 GameController）访问 Board 内部能力的唯一入口
 * - 暴露子控制器访问器（由业务层扩展，如 getRollCtrl()）
 *
 * 业务层扩展示例：
 * ```typescript
 * export interface IGameBoardController extends IController<IGameBoardModel, IGameBoardView> {
 *     getRollCtrl(): IGameBoardRollCtrl;
 *     getWildCtrl(): IGameBoardWildCtrl;
 *     forceStop(): Promise<void>;
 * }
 * ```
 */
export interface IMVCController<M extends IMVCModel = IMVCModel, V extends IMVCView = IMVCView>
    extends IMVCSubCtrl<M, V> {

        onUpdate?(dt: number): void;
}



// ─────────────────────────────────────────────
// 子控制器接口
// ─────────────────────────────────────────────

/**
 * 子控制器基础接口（Sub-Controller / Sub-Manager）
 *
 * 所有子控制器均应实现此接口
 * 泛型 M / V 由业务层具体化，使子控制器可访问完整 Model 和 View 信息
 *
 * 通信方向：
 * - 上→下：上层 Controller 持有子 Ctrl 引用，直接调用接口方法
 * - 下→上：子 Ctrl 通过 EventManager 派发事件，不持有上层引用
 */
export interface IMVCSubCtrl<M extends IMVCModel = IMVCModel, V extends IMVCView = IMVCView> {

    /** 初始化，注入 Model 和 View 依赖 */
    init(model: M, view: V): void;

    /** 销毁，清理事件监听、引用等资源 */
    destroy(): void;
}

