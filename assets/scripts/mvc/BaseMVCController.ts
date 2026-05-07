/**
 * MVC 公共框架 — 顶层控制器基类
 *
 * 提炼自 GameBoardController 中与业务无关的通用能力：
 * - 子控制器统一注册 / 批量销毁
 * - Model 和 View 依赖注入
 * - init / destroy 生命周期标准化
 *
 * 子控制器通信规范（从本项目实践中总结）：
 * - 上→下：顶层 Controller 直接调用子 Ctrl 接口方法（持有引用，直接调用）
 * - 下→上：子 Ctrl 通过 EventManager 派发事件，禁止反向持有父控制器引用
 */

import { IMVCController, IMVCModel, IMVCSubCtrl, IMVCView } from './IBaseMVC';

export abstract class BaseMVCController<M extends IMVCModel, V extends IMVCView>
    implements IMVCController<M, V> {

    // ─── 依赖引用 ────────────────────────────────
    protected model: M = null!;
    protected view: V = null!;

    // ─── 子控制器注册表 ───────────────────────────
    /** 所有通过 registerSubCtrl 注册的子控制器，destroy 时统一清理 */
    private readonly _subCtrls: IMVCSubCtrl[] = [];

    // ─── 生命周期 ────────────────────────────────

    /**
     * 初始化：注入 Model 和 View，随后调用子类 onInit()
     * View 的 onLoad 中调用：controller.init(model, this)
     */
    public init(model: M, view: V): void {
        this.model = model;
        this.view = view;
        this.onInit();
    }

    /**
     * 子类在此注册所有子控制器
     * 使用 registerSubCtrl() 注册，无需手动管理 destroy
     */
    protected abstract onInit(): void;

    /**
     * 销毁：批量销毁所有子控制器，随后调用子类 onDestroy()
     */
    public destroy(): void {
        for (const ctrl of this._subCtrls) {
            ctrl.destroy();
        }
        this._subCtrls.length = 0;
        this.onDestroy();

        this.model = null!;
        this.view = null!;
    }

    /**
     * 子类额外销毁逻辑（可选重写）
     * 此时子控制器已全部销毁完毕
     */
    protected onDestroy(): void {
        // 子类按需重写
    }

    // // ─── 子控制器管理 ─────────────────────────────

    /**
     * 注册子控制器
     *
     * 自动调用 ctrl.init(model, view)，并加入统一销毁列表
     * 支持链式返回，保留具体类型信息：
     * @param ctrl 子控制器实例
     * @returns 同一个 ctrl 实例（保持具体类型）
     */
    protected registerSubCtrl<T extends IMVCSubCtrl<M, V>>(ctrl: T): T {
        ctrl.init(this.model, this.view);
        this._subCtrls.push(ctrl);
        return ctrl;
    }

    /**
     * 手动销毁并移除指定子控制器（适用于动态创建/销毁的场景）
     * 通常不需要调用，destroy() 会批量处理所有已注册的子控制器
     *
     * @param ctrl 要销毁的子控制器实例
     */
    protected unregisterSubCtrl(ctrl: IMVCSubCtrl): void {
        const index = this._subCtrls.indexOf(ctrl);
        if (index !== -1) {
            ctrl.destroy();
            this._subCtrls.splice(index, 1);
        }
    }
}
