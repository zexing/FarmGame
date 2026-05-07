/**
 * MVC 公共框架 — View 基类（Cocos Creator Component）
 *
 * 提炼自 GameBoardView 中与业务无关的通用能力：
 * - 标准化 MVC 三件套组装（Model + Controller + View）
 * - update 每帧派发代理
 * - Controller 公共访问器
 * - onDestroy 自动销毁 Controller
 *
 * 依赖说明：
 * - 继承 BaseComponent（来自 common/base），享有事件/定时器自动清理
 * - 泛型 M / C 由子类具体化，保持类型安全
 *
 * 使用方式（业务层）：
 * ```typescript
 * @ccclass('GameBoardView')
 * export class GameBoardView
 *     extends BaseMVCView<IGameBoardModel, IGameBoardController>
 *     implements IGameBoardView {
 *
 *     // 在 createModel / createController 中实例化具体类
 *     protected createModel(): IGameBoardModel {
 *         return new GameBoardModel();
 *     }
 *
 *     protected createController(): IGameBoardController {
 *         return new GameBoardController();
 *     }
 *
 *     // MVC 初始化完成后的业务逻辑（替代直接在 onLoad 里写）
 *     protected onMVCReady(): void {
 *         this.initAllColumns();
 *         this.lockSlotBoard.initModel(this._model);
 *     }
 *
 *     // 实现 IGameBoardView 的各 Getter
 *     public getWildRenderer(): WildRenderer { return this.wildRenderer; }
 * }
 * ```
 *
 * 通信方向说明：
 * - View → Controller：通过 this._controller.xxx() 直接调用（View 持有 Controller 引用）
 * - Controller → View：通过 IView 接口 Getter 访问节点/组件（Controller 持有 View 接口）
 * - View / Controller → 上层：通过 EventManager 派发事件（禁止反向持有上层引用）
 */

import { _decorator } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { IMVCController, IMVCModel, IMVCView } from './IBaseMVC';

const { ccclass } = _decorator;

@ccclass('BaseMVCView')
export abstract class BaseMVCView<
    M extends IMVCModel,
    C extends IMVCController<M, any>
> extends BaseComponent implements IMVCView {

    // ─── MVC 三件套 ──────────────────────────────
    protected _model: M = null!;
    protected _controller: C = null!;

    // ─── 生命周期 ────────────────────────────────

    /**
     * Cocos Creator 生命周期 — 组件加载
     *
     * 自动完成三步：
     * 1. createModel()     → 实例化 Model
     * 2. createController() → 实例化 Controller
     * 3. controller.init() → 注入 Model + View，触发子控制器初始化
     * 4. onMVCReady()      → Start生命周期方法通知子类 MVC 就绪，子类在此做业务初始化
     *
     * 子类通常不需要重写 onLoad，改为重写 onMVCReady()
     */
    protected onLoad(): void {
        this._model = this.createModel();
        this._controller = this.createController();
        this._controller.init(this._model, this);
        this.onMVCReady();
    }

    /**
     * Cocos Creator 生命周期 — 每帧更新
     *
     * 自动将 update 转发给 Controller，Controller 再分发给需要每帧驱动的子控制器
     * 子类如需额外的帧逻辑，重写时调用 super.update(dt)
     */
    protected update(dt: number): void {
        this._controller?.onUpdate?.(dt);
    }

    /**
     * Cocos Creator 生命周期 — 组件销毁
     *
     * 自动销毁 Controller（Controller 会级联销毁所有子控制器）
     * BaseComponent.onDestroy 会自动清理 EventManager 监听和 Timer
     */
    protected onDestroy(): void {
        super.onDestroy();
        if (this._controller) {
            this._controller.destroy();
            this._controller = null!;
        }
        this._model = null!;
    }

    // ─── 抽象方法（子类必须实现）─────────────────────

    /**
     * 创建业务 Model 实例
     * @returns 业务 Model 实例（实现了 IModel 及业务接口）
     *
     * @example
     * protected createModel(): IGameBoardModel { return new GameBoardModel(); }
     */
    protected abstract createModel(): M;

    /**
     * 创建业务 Controller 实例（此时 Model 和 View 尚未注入，仅 new）
     * @returns 业务 Controller 实例（实现了 IController 及业务接口）
     *
     * @example
     * protected createController(): IGameBoardController { return new GameBoardController(); }
     */
    protected abstract createController(): C;

    // ─── 可选 Hook（子类按需重写）────────────────────

    /**
     * MVC 三件套初始化完成后的回调
     * 在此处做业务初始化（创建列、绑定模型等），替代直接在 onLoad 里写
     *
     * @example
     * protected onMVCReady(): void {
     *     this.initAllColumns();
     *     this.lockSlotBoard.initModel(this._model);
     * }
     */
    protected onMVCReady(): void {
        // 子类按需重写
    }

    // ─── 公共访问器 ──────────────────────────────────

    /**
     * 暴露 Controller 供外部访问
     * 外部（如 GameController）通过此 Getter 获取 Controller 引用，
     * 而不是直接操作 View 的内部逻辑
     */
    public get controller(): C {
        return this._controller;
    }
}
