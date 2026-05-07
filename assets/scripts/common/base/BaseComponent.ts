import { _decorator, Component } from 'cc';
import { EventManager } from '../manager/EventManager';
import { GameTimerManager } from '../manager/GameTimerManager';

const { ccclass } = _decorator;

/**
 * 基础组件类
 * 
 * 所有游戏组件应继承此类,享受以下功能:
 * - 自动清理EventManager监听器(避免内存泄漏)
 * - 自动清理GameTimerManager定时器(避免内存泄漏)
 * - 统一的生命周期管理
 * - 支持在禁用时清理资源(可配置)
 * 
 * @example
 * ```typescript
 * @ccclass('MyView')
 * export class MyView extends BaseComponent {
 *     protected onEnable(): void {
 *         // BaseComponent没有定义onEnable,子类无需调用super.onEnable()
 *         
 *         // 注册事件监听,传入this作为target
 *         EventManager.instance.on(SystemEvent.Update, this.onUpdate, this);
 *         EventManager.instance.on(GameCoreEvent.Spin, this.onSpin, this);
 *         
 *         // 创建定时器,传入this作为methodObj
 *         GameTimerManager.instance.doTimer(1000, 5, this.onTimer, this);
 *         
 *         // 或使用分组管理
 *         const groupId = GameTimerManager.instance.createGroup('MyViewTimers', this);
 *         GameTimerManager.instance.doTimer(2000, 0, this.onLoop, this, false, null, null, groupId);
 *     }
 *     
 *     protected onDisable(): void {
 *         super.onDisable(); // 必须调用!基类会自动清理事件和定时器
 *         
 *         // 事件和Timer会自动清理
 *         // 你只需要处理其他清理逻辑(如停止Tween动画)
 *     }
 *     
 *     // 不需要手动off/removeTimer,BaseComponent会自动清理
 *     
 *     private onUpdate(dt: number) {
 *         // ...
 *     }
 *     
 *     private onSpin() {
 *         // ...
 *     }
 *     
 *     private onTimer() {
 *         // ...
 *     }
 *     
 *     private onLoop() {
 *         // ...
 *     }
 * }
 * 
 * // 对于需要优化性能的组件,可以禁用onDisable清理
 * export class HighFrequencyComponent extends BaseComponent {
 *     protected cleanOnDisable = false; // 禁用onDisable清理,只在onDestroy清理
 *     
 *     // 这样频繁启用/禁用时不会重复注册/清理事件
 * }
 * ```
 */
@ccclass('BaseComponent')
export class BaseComponent extends Component {
    /**
     * 是否在禁用(onDisable)时清理事件监听器和定时器
     * 
     * 默认值: true (安全优先)
     * - true: 组件禁用时立即清理,确保不会响应事件和执行定时器
     * - false: 组件禁用时不清理,只在销毁时清理(性能优化,适合频繁启用/禁用的组件)
     * 
     * 注意: 设置为false时,禁用的组件依然会响应事件和执行定时器回调,
     * 需要在回调中添加 if (!this.node.active) return; 进行安全检查
     */
    protected cleanOnDisable: boolean = true;

    /**
     * 组件禁用时的清理
     * 
     * 如果 cleanOnDisable 为 true,会自动清理事件监听器和定时器
     * 子类重写时必须调用 super.onDisable()
     * 
     * @example
     * ```typescript
     * protected onDisable(): void {
     *     super.onDisable(); // 必须调用!
     *     
     *     // 你的清理逻辑(如停止动画)
     *     Tween.stopAllByTarget(this.node);
     * }
     * ```
     */
    protected onDisable(): void {
        this.clearAll();
    }


    /**
     * 组件销毁时自动清理所有事件监听器和定时器
     * 
     * 无论 cleanOnDisable 设置如何,销毁时总是会清理(防御性编程)
     * 子类重写时必须调用 super.onDestroy()
     * 
     * @example
     * ```typescript
     * protected onDestroy(): void {
     *     super.onDestroy(); // 必须调用!
     *     
     *     // 你的清理逻辑
     *     this.cleanup();
     * }
     * ```
     */
    protected onDestroy(): void {
        this.clearAll();
    }

    private clearAll() {
        if (this.cleanOnDisable) {
            // 清理该组件注册的所有EventManager监听器
            EventManager.instance.offAllByTarget(this);

            // 清理该组件创建的所有GameTimerManager定时器
            GameTimerManager.instance.removeAllByTarget(this);

            this.unscheduleAllCallbacks();
        }
    }
}
