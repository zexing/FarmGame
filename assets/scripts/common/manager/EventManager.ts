import { EventTarget } from 'cc';
import type { EventCallback, EventPayloadMap } from '../../events/EventPayloads';
import { SingletonManager } from '../base/SingletonManager';

const eventTarget = new EventTarget();

/**
 * 监听器信息接口
 */
interface IListenerInfo {
    eventName: string;
    callback: (...args: any[]) => void;
    target?: any;
}

/**
 * Target追踪管理
 * 使用WeakMap避免内存泄漏,当target被销毁时自动清理
 */
const targetListenersMap = new WeakMap<object, IListenerInfo[]>();

/**
 * 事件管理器
 * 
 * 特性:
 * - 统一的单例模式管理
 * - 类型安全的事件参数(基于EventPayloadMap)
 * - 自动参数类型推导
 * 
 * 使用注意:
 * 1. 优先使用已定义类型的事件(在EventPayloads.ts中)
 * 2. 发送事件时参数类型会自动检查
 * 3. 监听事件时回调参数类型会自动推导
 * 4. 未定义的事件将回退到any类型(保持向后兼容)
 * 
 * @example
 * ```typescript
 * // ✅ 类型安全的事件(已在EventPayloads中定义)
 * EventManager.instance.dispatchEvent(SystemEvents.Update, 0.016);
 * EventManager.instance.on(SystemEvent.Update, (dt) => {
 *     // dt 自动推导为 number 类型
 *     console.log(dt);
 * });
 * 
 * // ✅ 无参数事件
 * EventManager.instance.dispatchEvent(GameCoreEvent.Spin);
 * EventManager.instance.on(GameCoreEvent.Spin, () => {
 *     console.log('Spin started');
 * });
 * 
 * // ✅ 复杂参数类型
 * EventManager.instance.dispatchEvent(SystemEvents.ShakeCamera, {
 *     times: 3,
 *     strength: 10,
 *     duration: 0.03
 * });
 * 
 * // ⚠️ 未定义的事件(any类型,编译时不检查)
 * EventManager.instance.dispatchEvent('customEvent', anyData);
 * ```
 */
export class EventManager extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): EventManager {
        return EventManager.getInstance<EventManager>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        EventManager.destroyInstance();
    }

    /**
     * 注册事件监听器(类型安全版本)
     * 
     * @template K - 事件名,限定为EventPayloadMap中定义的事件
     * @param eventName - 事件名称
     * @param callback - 回调函数,参数类型自动推导
     * @param target - 可选,回调的this指向
     * 
     * @example
     * ```typescript
     * // 单参数事件
     * EventManager.instance.on(SystemEvent.Update, (dt) => {
     *     console.log('Delta time:', dt); // dt 自动推导为 number
     * });
     * 
     * // 无参数事件
     * EventManager.instance.on(GameCoreEvent.Spin, () => {
     *     console.log('Spin started');
     * });
     * 
     * // 复杂对象参数
     * EventManager.instance.on(SystemEvent.ShakeCamera, (params) => {
     *     console.log(params.times, params.strength); // params 自动推导为 IShakeCameraParam
     * }, this);
     * ```
     */
    on<K extends keyof EventPayloadMap>(
        eventName: K,
        callback: EventCallback<K>,
        target?: any
    ): void;
    /**
     * 注册事件监听器(兼容版本 - 未定义类型的事件)
     * 
     * @param eventName - 事件名称(字符串)
     * @param callback - 回调函数
     * @param target - 可选,回调的this指向
     */
    on(eventName: string, callback: (...args: any[]) => void, target?: any): void;
    on(eventName: string, callback: any, target?: any): void {
        eventTarget.on(eventName, callback, target);

        // 记录target的监听器信息
        if (target && typeof target === 'object') {
            this.trackListener(target, eventName, callback);
        }
    }

    /**
     * 移除事件监听器(类型安全版本)
     * 
     * @template K - 事件名,限定为EventPayloadMap中定义的事件
     * @param eventName - 事件名称
     * @param callback - 要移除的回调函数
     * @param target - 可选,回调的this指向
     */
    off<K extends keyof EventPayloadMap>(
        eventName: K,
        callback: EventCallback<K>,
        target?: any
    ): void;
    /**
     * 移除事件监听器(兼容版本 - 未定义类型的事件)
     */
    off(eventName: string, callback: (...args: any[]) => void, target?: any): void;
    off(eventName: string, callback: any, target?: any): void {
        eventTarget.off(eventName, callback, target);

        // 移除target的监听器记录
        if (target && typeof target === 'object') {
            this.untrackListener(target, eventName, callback);
        }
    }

    /**
     * 移除某个事件的所有监听器
     * 
     * @param eventName - 事件名称
     */
    offAll(eventName: string): void {
        eventTarget.off(eventName);
    }

    /**
     * 派发事件(类型安全版本 - 有参数)
     * 
     * @template K - 事件名,限定为EventPayloadMap中定义的事件
     * @param eventName - 事件名称
     * @param payload - 事件参数,类型自动检查
     * 
     * @example
     * ```typescript
     * // ✅ 类型匹配
     * EventManager.instance.dispatchEvent(SystemEvents.Update, 0.016);
     * EventManager.instance.dispatchEvent(SystemEvents.ShakeCamera, {
     *     times: 3,
     *     strength: 10
     * });
     * 
     * // ❌ 类型不匹配(编译错误)
     * EventManager.instance.dispatchEvent(SystemEvents.Update, "invalid");
     * EventManager.instance.dispatchEvent(SystemEvents.ShakeCamera, 123);
     * ```
     */
    dispatchEvent<K extends keyof EventPayloadMap>(
        eventName: K,
        ...payload: EventPayloadMap[K] extends void ? [] : [EventPayloadMap[K]]
    ): void;
    /**
     * 派发事件(兼容版本 - 未定义类型的事件)
     */
    dispatchEvent(eventName: string, ...args: any[]): void;
    dispatchEvent(eventName: string, ...args: any[]): void {
        eventTarget.emit(eventName, ...args);
    }


    /**
     * 等待一次事件触发(Promise 形式)
     * @param eventName 事件名
     * @param target 可选,事件监听目标
     * @param timeout 超时时间(毫秒),默认30秒,超时后自动清理监听器
     */
    waitForEventOnce<T = any>(eventName: string, target?: any, timeout: number = 30000): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let isResolved = false;
            let timeoutId: any = null;

            const handler = (...args: any[]) => {
                if (isResolved) return;
                isResolved = true;

                // 清理超时定时器
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // 移除事件监听器
                eventTarget.off(eventName, handler, target);
                resolve(args.length > 1 ? (args as unknown as T) : (args[0] as T));
            };

            // 设置超时处理
            timeoutId = setTimeout(() => {
                if (isResolved) return;
                isResolved = true;

                // 移除事件监听器
                eventTarget.off(eventName, handler, target);
                // console.warn(`⚠️ waitForEventOnce timeout: "${eventName}" (${timeout}ms)`);
                // 超时不reject,而是resolve undefined,避免未捕获的Promise错误
                resolve(undefined as unknown as T);
            }, timeout);

            eventTarget.on(eventName, handler, target);
        });
    }

    /**
     * 移除某个target的所有监听器
     * 
     * @param target - 要清理的目标对象
     * 
     * @example
     * ```typescript
     * // 在组件销毁时调用
     * onDestroy() {
     *     EventManager.instance.offAllByTarget(this);
     * }
     * ```
     */
    offAllByTarget(target: any): void {
        if (!target || typeof target !== 'object') {
            // console.warn('[EventManager] offAllByTarget: invalid target', target);
            return;
        }

        const listeners = targetListenersMap.get(target);
        if (!listeners || listeners.length === 0) {
            return;
        }

        // 移除所有监听器
        let removedCount = 0;
        for (const listener of listeners) {
            eventTarget.off(listener.eventName, listener.callback, listener.target);
            removedCount++;
        }

        // 清空记录
        targetListenersMap.delete(target);

        if (removedCount > 0) {
            // console.log(`[EventManager] Removed ${removedCount} listeners for target:`, target.constructor?.name || 'Unknown');
        }
    }

    /**
     * 记录target的监听器信息
     * @private
     */
    private trackListener(target: object, eventName: string, callback: (...args: any[]) => void): void {
        let listeners = targetListenersMap.get(target);
        if (!listeners) {
            listeners = [];
            targetListenersMap.set(target, listeners);
        }

        // 检查是否已存在相同的监听器
        const exists = listeners.some(
            l => l.eventName === eventName && l.callback === callback
        );

        if (!exists) {
            listeners.push({ eventName, callback, target });
        }
    }

    /**
     * 移除target的监听器记录
     * @private
     */
    private untrackListener(target: object, eventName: string, callback: (...args: any[]) => void): void {
        const listeners = targetListenersMap.get(target);
        if (!listeners) return;

        const index = listeners.findIndex(
            l => l.eventName === eventName && l.callback === callback
        );

        if (index !== -1) {
            listeners.splice(index, 1);

            // 如果该target没有监听器了,清空记录
            if (listeners.length === 0) {
                targetListenersMap.delete(target);
            }
        }
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        // 清理所有事件监听
        eventTarget.targetOff(eventTarget);
        // console.log('[EventManager] All event listeners cleared');
    }
}


