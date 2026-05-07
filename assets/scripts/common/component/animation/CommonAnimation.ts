import { _decorator, Animation, Component } from 'cc';
import { MiscGameEvent } from '../../../events';
import { EventManager } from '../../manager/EventManager';
const { ccclass, property } = _decorator;

@ccclass('CommonAnimation')
export class CommonAnimation extends Component {

    @property
    needChangeSpeed: boolean = true;

    private _animation: Animation = null;
    private _curAniimationName: string = null;
    public get curAniimationName(): string {
        return this._curAniimationName;
    }
    public set curAniimationName(value: string) {
        this._curAniimationName = value;
    }

    onLoad() {
        this._animation = this.node.getComponent(Animation);
    }

    protected onEnable(): void {
        EventManager.instance.on(MiscGameEvent.UpdateSpeed, this.updateAnimationSpeed, this);
        this.updateAnimationSpeed();
    }

    protected onDisable(): void {
        EventManager.instance.off(MiscGameEvent.UpdateSpeed, this.updateAnimationSpeed, this);
        this.stop();
    }

    public async playByIndex(index: number = 0, speed: number = 1): Promise<void> {
        if (!this._animation) return Promise.resolve();
        const clip = this._animation.clips[index];
        if (!clip) return Promise.resolve();
        return this.play(clip.name);
    }

    public async play(name?: string, speed: number = 1): Promise<void> {
        this.node.active = true;
        if (!this._animation) return;
        if (name) {
            this._curAniimationName = name;
        } else {
            this._curAniimationName = this._animation.defaultClip.name;
        }

        this._animation.play(this._curAniimationName);
        this.updateAnimationSpeed(speed);
        this._animation.off(Animation.EventType.FINISHED);
        return new Promise<void>((resolve) => {
            this._animation.once(Animation.EventType.FINISHED, () => {
                this._curAniimationName = null;
                resolve();
            }, this);
        });
    }

    public stop() {
        if (!this._animation) return;
        this._animation.stop();
        this._animation.off(Animation.EventType.FINISHED);
        this._curAniimationName = null;
    }

    public resume() {
        if (!this._animation) return;
        this._animation.resume();
    }

    public pause() {
        if (!this._animation) return;
        this._animation.pause();
    }

    public getState(name: string) {
        if (!this._animation) return null;
        return this._animation.getState(name);
    }

    public isClipPlaying(name: string) {
        if (!this._animation) return false;
        return this._animation.getState(name).isPlaying;
    }

    private updateAnimationSpeed(speed: number = 1) {
        if (!this.needChangeSpeed) return;
        if (!this._animation) return;
        if (!this._curAniimationName) return;
        const state = this._animation.getState(this._curAniimationName);
        if (!state) return;
        state.speed = speed;
    }

    /**监听动画帧事件并广播 */
    private onAnimationFrameEvent(event: string) {
        console.log("触发动画帧事件:", event);
        EventManager.instance.dispatchEvent(event);
    }


}


