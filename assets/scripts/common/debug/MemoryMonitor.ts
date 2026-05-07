import { GameTimerManager } from "../manager/GameTimerManager";
import { PoolManager } from "../manager/PoolManager";

/**
 * 🔥 内存监控工具
 * 用于定期打印内存统计信息，帮助发现内存泄漏
 */
export class MemoryMonitor {
    private static _instance: MemoryMonitor = null;
    private _isRunning: boolean = false;
    private _startTime: number = 0;
    private _spinCount: number = 0;

    public static get instance(): MemoryMonitor {
        if (!this._instance) {
            this._instance = new MemoryMonitor();
        }
        return this._instance;
    }

    /**
     * 启动内存监控
     */
    public start(): void {
        // if (this._isRunning) {
        //     console.warn('[MemoryMonitor] 已经在运行中');
        //     return;
        // }

        // if (!DebugSetting.isEnableMemoryMonitor()) {
        //     console.log('[MemoryMonitor] 内存监控未启用');
        //     return;
        // }

        // this._startTime = Date.now();
        // this._spinCount = 0;
        // this._isRunning = true;

        // const interval = DebugSetting.getMemoryMonitorInterval();
        // console.log(`[MemoryMonitor] 🔥 启动内存监控，间隔: ${interval}ms`);

        // // 🔥 修复：doTimer参数顺序为 (interval, repeat, method, methodObj)
        // // repeat = 0 表示无限循环
        // GameTimerManager.instance.doTimer(
        //     interval,
        //     0, // 0表示无限循环
        //     () => {
        //         this.printMemoryStats();
        //     },
        //     this
        // );
    }

    /**
     * 停止内存监控
     */
    public stop(): void {
        if (this._isRunning) {
            // 🔥 修复：removeAll会清除指定target的所有timer
            GameTimerManager.instance.removeAll(this);
            this._isRunning = false;
            // console.log('[MemoryMonitor] 内存监控已停止');
        }
    }

    /**
     * 记录一次Spin
     */
    public recordSpin(): void {
        this._spinCount++;
    }

    /**
     * 打印内存统计信息
     */
    private printMemoryStats(): void {
        const runtime = Math.floor((Date.now() - this._startTime) / 1000);
        const minutes = Math.floor(runtime / 60);
        const seconds = runtime % 60;

        console.log('========================================');
        console.log(`🔥 内存监控报告 [运行时间: ${minutes}分${seconds}秒]`);
        console.log(`🎰 总Spin次数: ${this._spinCount}`);
        console.log('========================================');

        // 打印PoolManager节点统计
        PoolManager.instance.printNodeStats();

        // 如果浏览器支持，打印JS堆内存信息
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            console.log('========== JS堆内存信息 ==========');
            console.log(`  已使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  总分配: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
            console.log('==================================');
        }

        console.log('========================================\n');
    }

    /**
     * 手动打印一次内存统计（用于调试）
     */
    public printNow(): void {
        this.printMemoryStats();
    }
}
