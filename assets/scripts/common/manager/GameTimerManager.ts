import { game } from "cc";
import { SingletonManager } from "../base/SingletonManager";

/**
 * Timer组信息
 */
interface ITimerGroup {
    id: string;
    name: string;
    owner?: any;
    timers: Set<TimerHandler>;
    isPaused: boolean;
    createTime: number;
}

/**
 * Timer记录信息（用于调试）
 */
interface ITimerRecord {
    handler: TimerHandler;
    groupId?: string;
    createTime: number;
    executionCount: number;
    totalExecutionTime: number;
    callStack?: string;
}

/**
 * GameTimerManager (原 GameTimerManager) - 游戏业务层定时器
 * 
 * 【定位】业务层定时器管理器,用于游戏逻辑中的简单延时和定时任务
 * 
 * 【核心特性】
 * - 毫秒级精度的定时任务
 * - 直接 Function 回调,使用简单
 * - 批量清理:removeAll(target) 可清理指定对象的所有定时器
 * - 手动驱动:需要在 update(dt) 中手动调用更新
 * - 不返回 timer ID,通过 target 对象管理生命周期
 * 
 * 【适用场景】
 * - UI 动画延时(如弹窗延迟关闭)
 * - 游戏逻辑倒计时(如技能冷却)
 * - 简单的延迟执行(如特效播放后的回调)
 * - 生命周期绑定到某个组件的定时任务
 * 
 * 【与 TimerManager 的区别】
 * - TimerManager: 框架层,基于 Cocos schedule(),帧/秒精度,支持时间补偿
 * - GameTimerManager: 业务层,手动 update() 驱动,毫秒精度,生命周期管理简单
 * 
 * 【使用示例】
 * ```typescript
 * // 延迟 2 秒执行一次
 * GameTimerManager.instance.doTimer(2000, 1, () => {
 *     console.log('2秒后执行');
 * }, this);
 * 
 * // 每秒执行一次,共 5 次
 * GameTimerManager.instance.doTimer(1000, 5, () => {
 *     console.log('每秒执行');
 * }, this);
 * 
 * // 组件销毁时清理所有定时器
 * onDestroy() {
 *     GameTimerManager.instance.removeAll(this);
 * }
 * ```
 */
export class GameTimerManager extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): GameTimerManager {
        return GameTimerManager.getInstance<GameTimerManager>();
    }

    private _messageMap: Map<string, any>;
    private _handlers: Array<TimerHandler>;//延迟执行的回调集合
    private currHandler: TimerHandler = null;
    private nexthandles: Array<TimerHandler>;//下一帧执行的回调集合
    private _currTime: number;

    // ========== 新增：增强功能 ==========

    /**
     * Target追踪映射（自动清理用）
     */
    private targetTimersMap = new WeakMap<object, Set<TimerHandler>>();

    /**
     * Timer组管理
     */
    private groups = new Map<string, ITimerGroup>();

    /**
     * 组ID计数器
     */
    private groupIdCounter = 0;

    /**
     * 全局暂停标志
     */
    private globalPaused = false;

    /**
     * 调试模式
     */
    private debugMode = false;

    /**
     * 性能分析开关
     */
    private profilingEnabled = false;

    /**
     * Timer记录（用于调试）
     */
    private timerRecords = new Map<TimerHandler, ITimerRecord>();

    /**
     * 构造函数
     */
    public constructor() {
        super(); // 调用父类构造函数

        this._messageMap = new Map();
        this._handlers = [];
        this.nexthandles = null;
        this._currTime = game.totalTime;
    }

    /**
     * 延迟
     */
    public static delay(milliSeconds: number, targte: any): Promise<void> {
        return new Promise<void>((resolve) => {
            GameTimerManager.instance.doTimer(milliSeconds, 1, () => {
                resolve();
            }, targte);
        });
    }


    //删除定时器
    public deleteTimerMsg(param: number) {
        let deleteArr = [];
        this._messageMap.forEach((value, key) => {
            let info = key.split('_');
            if (info && +info[1] && +info[1] == param) {
                deleteArr.push(key);
            }
        });
        for (let i = 0; i < deleteArr.length; i++) {
            this._messageMap.delete(deleteArr[i]);
        }
    }

    // 下一帧执行，且只执行一次
    public doNext(method: Function, methodObj: any) {
        let handler: TimerHandler = new TimerHandler();
        handler.method = method;
        handler.methodObj = methodObj;

        if (!this.nexthandles)
            this.nexthandles = [];
        this.nexthandles.push(handler);
    }

    /**
     *
     * 定时执行
     * @param interval 执行间隔:毫秒
     * @param repeat 执行次数, 0为无限次
     * @param method 执行函数
     * @param methodObj 执行函数所属对象
     * @param isExcute 是否立即执行
     * @param onFinish 完成执行函数
     * @param fobj 完成执行函数所属对象
     * @param groupId 所属组ID（新增）
     *
     */
    public doTimer(interval: number, repeat: number, method: Function, methodObj: any
        , isExcute: boolean = false, onFinish: Function = null, fobj: any = null, groupId?: string): void {
        if (this.isExists(method, methodObj)) {
            console.warn('[GameTimerManager] 重复注册计时器');
        } else {
            let startTime = isExcute ? 0 : interval;
            this.create(startTime, interval, repeat, method, methodObj, onFinish, fobj, groupId);
        }
    }

    private create(startTime: number, delay: number, repeat: number, method: Function, methodObj: any,
        onFinish: Function, fobj: any, groupId?: string): void {
        if (delay < 0 || repeat < 0 || method == null) {
            return;
        }

        let handler: TimerHandler = new TimerHandler();
        handler.forever = repeat == 0;
        handler.repeatCount = repeat;
        handler.delay = delay;
        handler.method = method;
        handler.methodObj = methodObj;
        handler.onFinish = onFinish;
        handler.finishObj = fobj;
        handler.exeTime = startTime + this._currTime;

        let index = GameTimerManager.binSearch(this._handlers, handler, GameTimerManager.binFunc);
        this._handlers.splice(index, 0, handler);

        // ========== 新增：追踪和记录 ==========

        // 追踪target
        if (methodObj && typeof methodObj === 'object') {
            this.trackTimer(methodObj, handler);
        }

        // 追踪组
        if (groupId) {
            const group = this.groups.get(groupId);
            if (group) {
                group.timers.add(handler);
                handler.groupId = groupId;
            }
        }

        // 调试模式：记录Timer信息
        if (this.debugMode) {
            const record: ITimerRecord = {
                handler,
                groupId,
                createTime: Date.now(),
                executionCount: 0,
                totalExecutionTime: 0,
                callStack: this.debugMode ? new Error().stack : undefined
            };
            this.timerRecords.set(handler, record);
        }
    }

    // ========== 新增功能方法 ==========

    /**
     * 追踪Timer到target
     */
    private trackTimer(target: object, handler: TimerHandler): void {
        let timers = this.targetTimersMap.get(target);
        if (!timers) {
            timers = new Set();
            this.targetTimersMap.set(target, timers);
        }
        timers.add(handler);
    }

    /**
     * 取消追踪Timer
     */
    private untrackTimer(target: object, handler: TimerHandler): void {
        const timers = this.targetTimersMap.get(target);
        if (timers) {
            timers.delete(handler);
            if (timers.size === 0) {
                this.targetTimersMap.delete(target);
            }
        }
    }

    /**
     * 创建Timer组
     * @param name 组名
     * @param owner 所属对象（用于自动绑定生命周期）
     * @returns 组ID
     */
    public createGroup(name: string, owner?: any): string {
        const groupId = `timer_group_${++this.groupIdCounter}_${name}`;

        const group: ITimerGroup = {
            id: groupId,
            name,
            owner,
            timers: new Set(),
            isPaused: false,
            createTime: Date.now()
        };

        this.groups.set(groupId, group);

        // 如果有owner，绑定生命周期
        if (owner && typeof owner === 'object') {
            this.bindOwnerLifecycle(owner, groupId);
        }

        console.log(`[GameTimerManager] Created group: ${groupId}`);
        return groupId;
    }

    /**
     * 绑定owner的生命周期
     */
    private bindOwnerLifecycle(owner: any, groupId: string): void {
        if (typeof owner.onDestroy === 'function') {
            const originalOnDestroy = owner.onDestroy.bind(owner);

            owner.onDestroy = () => {
                this.removeGroup(groupId);
                originalOnDestroy();
            };
        }
    }

    /**
     * 移除指定target的所有Timer（与EventManager命名一致）
     * @param target 目标对象
     */
    public removeAllByTarget(target: any): void {
        if (!target || typeof target !== 'object') {
            console.warn('[GameTimerManager] removeAllByTarget: invalid target', target);
            return;
        }

        const timers = this.targetTimersMap.get(target);
        if (!timers || timers.size === 0) {
            return;
        }

        let removedCount = 0;
        for (const handler of timers) {
            this.removeTimerHandler(handler);
            removedCount++;
        }

        timers.clear();
        this.targetTimersMap.delete(target);

        if (removedCount > 0) {
            console.log(`[GameTimerManager] Removed ${removedCount} timers for target:`, target.constructor?.name || 'Unknown');
        }
    }

    /**
     * 移除整个组的Timer
     * @param groupId 组ID
     */
    public removeGroup(groupId: string): void {
        const group = this.groups.get(groupId);
        if (!group) {
            console.warn(`[GameTimerManager] Group not found: ${groupId}`);
            return;
        }

        console.log(`[GameTimerManager] Removing group: ${groupId} (${group.timers.size} timers)`);

        for (const handler of group.timers) {
            this.removeTimerHandler(handler);
        }

        group.timers.clear();
        this.groups.delete(groupId);
    }

    /**
     * 暂停组
     * @param groupId 组ID
     */
    public pauseGroup(groupId: string): void {
        const group = this.groups.get(groupId);
        if (!group) {
            console.warn(`[GameTimerManager] Group not found: ${groupId}`);
            return;
        }

        group.isPaused = true;
        for (const handler of group.timers) {
            handler.isPaused = true;
        }

        console.log(`[GameTimerManager] Paused group: ${groupId}`);
    }

    /**
     * 恢复组
     * @param groupId 组ID
     */
    public resumeGroup(groupId: string): void {
        const group = this.groups.get(groupId);
        if (!group) {
            console.warn(`[GameTimerManager] Group not found: ${groupId}`);
            return;
        }

        group.isPaused = false;
        for (const handler of group.timers) {
            handler.isPaused = false;
        }

        console.log(`[GameTimerManager] Resumed group: ${groupId}`);
    }

    /**
     * 暂停所有Timer
     */
    public pauseAll(): void {
        this.globalPaused = true;
        console.log('[GameTimerManager] All timers paused');
    }

    /**
     * 恢复所有Timer
     */
    public resumeAll(): void {
        this.globalPaused = false;
        console.log('[GameTimerManager] All timers resumed');
    }

    /**
     * 暂停指定target的Timer
     * @param target 目标对象
     */
    public pauseByTarget(target: any): void {
        const timers = this.targetTimersMap.get(target);
        if (timers) {
            for (const handler of timers) {
                handler.isPaused = true;
            }
        }
    }

    /**
     * 恢复指定target的Timer
     * @param target 目标对象
     */
    public resumeByTarget(target: any): void {
        const timers = this.targetTimersMap.get(target);
        if (timers) {
            for (const handler of timers) {
                handler.isPaused = false;
            }
        }
    }

    /**
     * 移除单个Timer Handler
     */
    private removeTimerHandler(handler: TimerHandler): void {
        // 从主列表中移除
        const index = this._handlers.indexOf(handler);
        if (index !== -1) {
            this._handlers.splice(index, 1);
        }

        // 从target追踪中移除
        if (handler.methodObj) {
            this.untrackTimer(handler.methodObj, handler);
        }

        // 从组中移除
        if (handler.groupId) {
            const group = this.groups.get(handler.groupId);
            if (group) {
                group.timers.delete(handler);
            }
        }

        // 从调试记录中移除
        if (this.debugMode) {
            this.timerRecords.delete(handler);
        }

        this.DeleteHandle(handler);
    }

    /**
     * 开启调试模式
     * @param enabled 是否开启
     */
    public enableDebug(enabled: boolean): void {
        this.debugMode = enabled;
        console.log(`[GameTimerManager] Debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * 开启性能分析
     * @param enabled 是否开启
     */
    public enableProfiling(enabled: boolean): void {
        this.profilingEnabled = enabled;
        console.log(`[GameTimerManager] Profiling: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * 获取Timer统计信息
     */
    public getTimerStats() {
        return {
            activeTimers: this._handlers.length,
            activeGroups: this.groups.size,
            nextFrameTimers: this.nexthandles ? this.nexthandles.length : 0,
            globalPaused: this.globalPaused,
            groups: Array.from(this.groups.values()).map(g => ({
                id: g.id,
                name: g.name,
                timerCount: g.timers.size,
                isPaused: g.isPaused
            }))
        };
    }

    /**
     * 打印Timer报告
     */
    public printReport(): void {
        const stats = this.getTimerStats();

        console.log('========================================');
        console.log('    GameTimerManager Report');
        console.log('========================================');
        console.log(`Active Timers: ${stats.activeTimers}`);
        console.log(`Active Groups: ${stats.activeGroups}`);
        console.log(`Next Frame Timers: ${stats.nextFrameTimers}`);
        console.log(`Global Paused: ${stats.globalPaused}`);
        console.log('========================================');

        if (stats.groups.length > 0) {
            console.log('Group Statistics:');
            stats.groups.forEach(g => {
                console.log(`  ${g.name} (${g.id}): ${g.timerCount} timers${g.isPaused ? ' [PAUSED]' : ''}`);
            });
            console.log('========================================');
        }
    }

    public update(dt: number) {
        // 全局暂停检查
        if (this.globalPaused) {
            return;
        }

        this._currTime = game.totalTime;
        let currTime: number = 0;
        let nexthandles = this.nexthandles;

        //下一帧执行的回调逻辑
        this.nexthandles = null;
        if (nexthandles && nexthandles.length > 0) {
            for (let handler of nexthandles) {
                // 检查暂停状态
                if (!handler.isPaused) {
                    this.executeTimerCallback(handler);
                }
                this.DeleteHandle(handler);
            }

            nexthandles = null;
        }

        //延迟执行的回调逻辑
        if (this._handlers.length <= 0) return false;
        let handler = this._handlers[this._handlers.length - 1];
        while (handler.exeTime <= this._currTime) {
            this.currHandler = handler = this._handlers.pop();

            // 检查暂停状态
            if (!handler.isPaused) {
                this.executeTimerCallback(handler);
            }

            currTime = game.totalTime;
            handler.exeTime = currTime + handler.delay;

            let repeat: boolean = handler.forever;
            if (!repeat) {
                if (handler.repeatCount > 1) {
                    handler.repeatCount--;
                    repeat = true;
                } else {
                    if (handler.onFinish && !handler.isPaused) {
                        handler.onFinish.apply(handler.finishObj);
                    }
                }
            }

            if (repeat && !handler.isPaused) {
                let index = GameTimerManager.binSearch(this._handlers, handler, GameTimerManager.binFunc);
                this._handlers.splice(index, 0, handler);
            }
            else {
                this.removeTimerHandler(handler);
            }

            if (currTime - this._currTime > 5) break;

            if (this._handlers.length <= 0) break;
            else handler = this._handlers[this._handlers.length - 1];
        }
        this.currHandler = null;
    }

    /**
     * 执行Timer回调（带性能监控）
     */
    private executeTimerCallback(handler: TimerHandler): void {
        if (this.profilingEnabled || this.debugMode) {
            const startTime = performance.now();

            // 执行回调
            handler.method.call(handler.methodObj);

            const executionTime = performance.now() - startTime;

            // 更新记录
            if (this.debugMode) {
                const record = this.timerRecords.get(handler);
                if (record) {
                    record.executionCount++;
                    record.totalExecutionTime += executionTime;
                }
            }

            // 性能警告
            if (this.profilingEnabled && executionTime > 16) {
                console.warn(`
⚠️ [GameTimerManager] Slow Timer Callback!
   Execution Time: ${executionTime.toFixed(2)}ms
   Interval: ${handler.delay}ms
   Group: ${handler.groupId || 'none'}
   Suggestion: Optimize callback or use async processing
                `);
            }
        } else {
            // 生产环境直接执行
            handler.method.call(handler.methodObj);
        }
    }

    /**
     * 启动泄漏检测（定期扫描长时间存活的Timer）
     * @param checkIntervalMs 检测间隔（毫秒），默认60秒
     * @param thresholdMs Timer存活阈值（毫秒），默认10分钟
     */
    public startLeakDetection(checkIntervalMs: number = 60000, thresholdMs: number = 600000): void {
        if (!this.debugMode) {
            console.warn('[GameTimerManager] Leak detection requires debug mode. Call enableDebug(true) first.');
            return;
        }

        this.doTimer(checkIntervalMs, 0, () => {
            const now = Date.now();
            const leaks: Array<{
                age: number;
                groupId?: string;
                executionCount: number;
                avgExecutionTime: number;
                callStack?: string;
            }> = [];

            this.timerRecords.forEach((record, handler) => {
                const age = now - record.createTime;
                if (age > thresholdMs) {
                    leaks.push({
                        age: Math.round(age / 1000), // 转换为秒
                        groupId: record.groupId,
                        executionCount: record.executionCount,
                        avgExecutionTime: record.executionCount > 0
                            ? record.totalExecutionTime / record.executionCount
                            : 0,
                        callStack: record.callStack
                    });
                }
            });

            if (leaks.length > 0) {
                console.warn(`
🔍 [GameTimerManager] Potential Memory Leaks Detected!
   Found ${leaks.length} timer(s) alive for more than ${thresholdMs / 1000}s
                `);

                leaks.forEach((leak, index) => {
                    console.warn(`
   Leak #${index + 1}:
     Age: ${leak.age}s
     Group: ${leak.groupId || 'none'}
     Executions: ${leak.executionCount}
     Avg Execution Time: ${leak.avgExecutionTime.toFixed(2)}ms
     ${leak.callStack ? `Call Stack:\n${leak.callStack}` : ''}
                    `);
                });
            }
        }, this, false);

        console.log(`[GameTimerManager] Leak detection started (check every ${checkIntervalMs / 1000}s, threshold ${thresholdMs / 1000}s)`);
    }

    private DeleteHandle(handler: TimerHandler) {
        handler.clear();
        handler = null;
    }


    // 从大到小排序
    public static binFunc(b1: TimerHandler, b2: TimerHandler): number {
        if (b1.exeTime > b2.exeTime) return -1;
        else if (b1.exeTime < b2.exeTime) return 1;
        else return 0;
    }

    //二分查找
    //tab 要检索的表
    // item 要搜索的玩意儿
    // binFunc 用于比较的函数，当纯数字tab时该参数可以为空，默认检索到的位置是最后的插入位置
    public static binSearch(tab: any[], item: any, binFunc: Function = null): number {
        if (!tab || tab.length == 0) return 0;

        if (!binFunc)
            binFunc = GameTimerManager.sortAsc;
        let low = 0;
        let high = tab.length - 1;

        while (low <= high) {
            let mid = (high + low) >> 1;
            let val: any = tab[mid];
            if (binFunc(val, item) <= 0) {
                low = mid + 1;
            }
            else {
                high = mid - 1;
            }
        }
        return low;
    }
    public static sortAsc(b1, b2): number {
        if (b1 < b2) return -1;
        else if (b1 > b2) return 1;
        else return 0;
    }
    /**
     * 清理当前对象所有延迟函数
     * @param method 要移除的函数
     * @param methodObj 要移除的函数对应的对象
     */
    public removeAll(methodObj: any) {
        let currHandler = this.currHandler;
        if (currHandler && currHandler.methodObj == methodObj) {
            currHandler.forever = false;
            currHandler.repeatCount = 0;
        }

        for (let i = this._handlers.length - 1; i >= 0; i--) {
            let handler = this._handlers[i];
            if (handler.methodObj == methodObj) {
                this._handlers.splice(i, 1);
                this.DeleteHandle(handler);
            }
        }
    }
    /**
     * 取消所有计时器
     */
    public removeAllCallbacks() {
        while (this._handlers.length > 0) {
            this.DeleteHandle(this._handlers.shift());
        }
        let nexthandles = this.nexthandles;
        this.nexthandles = null;
        if (nexthandles && nexthandles.length > 0) {
            for (let handler of nexthandles) {
                this.DeleteHandle(handler);
            }
            nexthandles = null;
        }
    }

    //移除定时器
    public removeTimer(method: Function, methodObj: any) {
        let currHandler = this.currHandler;
        if (currHandler && currHandler.method == method &&
            currHandler.methodObj == methodObj) {
            currHandler.forever = false;
            currHandler.repeatCount = 0;
        }

        for (let i = this._handlers.length - 1; i >= 0; i--) {
            let handler = this._handlers[i];
            if (handler.method == method && handler.methodObj == methodObj) {
                this._handlers.splice(i, 1);
                this.DeleteHandle(handler);
            }
        }

    }

    /**
    * 检测是否已经存在
    * @param method
    * @param methodObj
    */
    public isExists(method: Function, methodObj: any): boolean {
        for (let handler of this._handlers) {
            if (handler.method == method && handler.methodObj == methodObj) {
                return true;
            }
        }
        return false;
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this._handlers = [];
        this.nexthandles = null;
        this._messageMap.clear();
        console.log('[GameTimerManager] All timers cleared');
    }
}

export class TimerHandler {
    /**执行间隔*/
    public delay: number = 0;
    /**是否重复执行*/
    public forever: boolean = false;
    /**重复执行次数*/
    public repeatCount: number = 0;
    /**执行时间*/
    public exeTime: number = 0;
    /**处理函数*/
    public method: Function;
    /**处理函数所属对象*/
    public methodObj: any;
    /**完成处理函数*/
    public onFinish: Function;
    /**完成处理函数所属对象*/
    public finishObj: any;
    /**所属组ID（新增）*/
    public groupId?: string;
    /**是否暂停（新增）*/
    public isPaused: boolean = false;

    /**清理*/
    public clear(): void {
        this.method = null;
        this.methodObj = null;
        this.onFinish = null;
        this.finishObj = null;
        this.forever = false;
        this.groupId = undefined;
        this.isPaused = false;
    }
}

// 在 GameTimerManager 类的末尾添加 onDestroy 方法
// 需要找到类定义的结束位置