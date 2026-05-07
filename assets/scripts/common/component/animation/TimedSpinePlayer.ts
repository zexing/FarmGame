import { _decorator, Component } from 'cc';
import { GameTimerManager } from '../../manager/GameTimerManager';
import { SpineComponent } from '../spine/SpineComponent';

const { ccclass, property } = _decorator;

/**
 * 定时播放Spine动画组件
 * 功能：每隔指定的时间间隔自动播放指定的Spine动画
 */
@ccclass('TimedSpinePlayer')
export class TimedSpinePlayer extends Component {

    @property({ type: SpineComponent, tooltip: "要播放的Spine组件引用" })
    spineComponent: SpineComponent = null;

    @property({ tooltip: "要播放的动画名称" })
    animationName: string = "";

    @property({ tooltip: "播放间隔时间（毫秒），例如3000表示每3秒播放一次" })
    intervalTime: number = 3000;

    @property({ tooltip: "启用时自动开始播放" })
    autoStart: boolean = true;

    // @property({ type: Boolean, tooltip: "动画是否循环播放（单次动画内部）" })
    // isLoop: boolean = false;

    @property({ tooltip: "第一次是否立即播放（否则等待一个间隔后才开始）" })
    playImmediately: boolean = false;

    @property({ 
        tooltip: "前摇时间（毫秒），第一次播放前的延迟时间，0表示使用intervalTime",
        visible: function(this: TimedSpinePlayer) { return !this.playImmediately; }
    })
    startDelay: number = 0;

    private _isPlaying: boolean = false;

    protected onEnable(): void {
        if (this.autoStart) {
            this.startTimer();
        }
    }

    protected onDisable(): void {
        this.stopTimer();
    }

    /**
     * 启动定时器
     */
    public startTimer(): void {
        if (this._isPlaying) {
            // console.warn('[TimedSpinePlayer] 定时器已经在运行中');
            return;
        }

        if (!this.spineComponent) {
            // console.error('[TimedSpinePlayer] SpineComponent 引用为空，无法启动定时器');
            return;
        }

        if (!this.animationName || this.animationName.length === 0) {
            // console.error('[TimedSpinePlayer] 动画名称为空，无法启动定时器');
            return;
        }

        if (this.intervalTime <= 0) {
            // console.error('[TimedSpinePlayer] 间隔时间必须大于0');
            return;
        }

        this._isPlaying = true;

        // 计算首次播放的延迟时间
        let firstDelay = 0;
        if (this.playImmediately) {
            // 立即播放
            firstDelay = 0;
            this.playAnimation();
        } else if (this.startDelay > 0) {
            // 使用前摇时间
            firstDelay = this.startDelay;
        } else {
            // 使用间隔时间
            firstDelay = this.intervalTime;
        }

        // 如果需要延迟首次播放，先设置一个一次性定时器
        if (firstDelay > 0 && !this.playImmediately) {
            GameTimerManager.instance.doTimer(
                firstDelay,
                1, // 只执行一次
                () => {
                    this.playAnimation();
                },
                this
            );
        }

        // 启动循环定时器（使用 this 作为 target，onDisable 时会自动清理）
        GameTimerManager.instance.doTimer(
            this.intervalTime,
            0, // 0表示无限循环
            () => {
                this.playAnimation();
            },
            this
        );

        const delayInfo = this.playImmediately ? '立即播放' : `前摇: ${firstDelay}ms`;
        // console.log(`[TimedSpinePlayer] 定时器已启动，${delayInfo}，间隔: ${this.intervalTime}ms, 动画: ${this.animationName}`);
    }

    /**
     * 停止定时器
     */
    public stopTimer(): void {
        if (!this._isPlaying) {
            return;
        }

        // GameTimerManager 会自动清理 this 对象的所有定时器
        GameTimerManager.instance.removeAllByTarget(this);

        this._isPlaying = false;
        // console.log('[TimedSpinePlayer] 定时器已停止');
    }

    /**
     * 播放动画
     */
    private playAnimation(): void {
        if (!this.spineComponent) {
            // console.warn('[TimedSpinePlayer] SpineComponent 不可用，跳过本次播放');
            return;
        }

        // 使用 SpineComponent 的 playActionByTimes 方法播放指定次数
        this.spineComponent.playActionByTimes(
            this.animationName,
            1, // 播放1次
            null, // 完成回调
            true, // 强制播放
            1 // 播放速度
        );

        // console.log(`[TimedSpinePlayer] 播放动画: ${this.animationName}`);
    }

    /**
     * 重新设置参数并重启定时器
     * @param animationName 动画名称
     * @param intervalTime 间隔时间（毫秒）
     * @param playImmediately 是否立即播放第一次
     * @param startDelay 前摇时间（毫秒），可选
     */
    public resetAndStart(animationName: string, intervalTime: number, playImmediately: boolean = false, startDelay?: number): void {
        this.stopTimer();

        this.animationName = animationName;
        this.intervalTime = intervalTime;
        this.playImmediately = playImmediately;
        if (startDelay !== undefined) {
            this.startDelay = startDelay;
        }

        this.startTimer();
    }

    /**
     * 获取当前是否正在运行
     */
    public get isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * 暂停定时器
     */
    public pause(): void {
        if (!this._isPlaying) {
            // console.warn('[TimedSpinePlayer] 定时器未启动，无法暂停');
            return;
        }
        // 使用 GameTimerManager 的暂停功能
        GameTimerManager.instance.pauseByTarget(this);
        // console.log('[TimedSpinePlayer] 定时器已暂停');
    }

    /**
     * 恢复定时器
     */
    public resume(): void {
        if (!this._isPlaying) {
            // console.warn('[TimedSpinePlayer] 定时器未启动，无法恢复');
            return;
        }
        // 使用 GameTimerManager 的恢复功能
        GameTimerManager.instance.resumeByTarget(this);
        // console.log('[TimedSpinePlayer] 定时器已恢复');
    }
}
