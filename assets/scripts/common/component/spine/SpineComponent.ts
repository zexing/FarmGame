import { _decorator, Color, Component, sp } from 'cc';
import { GameDefine } from '../../../const/GameDefine';
import { MiscGameEvent } from '../../../events';
import { BundleManager } from '../../manager/BundleManager';
import { EventManager } from '../../manager/EventManager';
import { Res } from '../../manager/Res';
const { ccclass, property } = _decorator;

/**骨骼动画组件 */
@ccclass('SpineComponent')
export class SpineComponent extends Component {

    private _spine!: sp.Skeleton;
    public get spine(): sp.Skeleton {
        return this._spine;
    }
    public set spine(value: sp.Skeleton) {
        this._spine = value;
    }
    private _spineName: string = '';
    public get spineName(): string {
        return this._spineName;
    }
    public set spineName(value: string) {
        this._spineName = value;
    }
    private _loop: boolean;
    private _isRemove: boolean;
    private _isOnlyOne: boolean;
    private _spineSrc: string;
    private _isReverseLoop: boolean = false;  // 🔥 标记是否为倒播循环


    /**事件帧监听 */
    private _eventFrameCall: Map<string, Function> = new Map();

    onLoad() {
        this._spine = this.node.getComponent(sp.Skeleton)!;
    }

    /**更新spine组件 */
    private updateSpineComponent() {
        if (!this._spine) {
            this._spine = this.node.getComponent(sp.Skeleton)!;
        }
    }

    protected onEnable(): void {
        EventManager.instance.on(MiscGameEvent.UpdateSpeed, this.updateSpineSpeed, this);
        this.updateSpineSpeed();
    }

    protected onDisable(): void {
        EventManager.instance.off(MiscGameEvent.UpdateSpeed, this.updateSpineSpeed, this);
        this.clearSpineData();
    }

    public clearSpineData() {
        this._spineName = '';
        this._loop = false;
        this._isReverseLoop = false;  // 🔥 清除倒播循环标记
        if (this._spine) {
            this.spine.setCompleteListener(null);
            // 自动适配不同模式
            if (this.spine.isAnimationCached()) {
                // 缓存模式：暂停并还原
                this.spine.paused = true;
                this.spine.setToSetupPose();
            } else {
                // 实时模式：清除动画
                this.spine.clearAnimations();
            }
        }
        if (this._eventFrameCall && this._eventFrameCall.size > 0) {
            this._eventFrameCall.clear();
        }
    }


    // 🔥 循环倒播支持：在 update 中检测并重置到末尾
    protected update(dt: number): void {
        if (this._isReverseLoop && this._spine && this._spine.timeScale < 0) {
            const track = this._spine.getState().tracks[0];
            if (track) {
                // 提前一帧重置，避免显示第一帧造成闪烁
                // 使用 dt * timeScale 作为阈值更精确
                const threshold = Math.abs(dt * this._spine.timeScale);
                if (track.trackTime <= threshold) {
                    track.trackTime = track.animationEnd;
                }
            }
        }
    }

    /**
     * 添加事件帧监听
     */
    public addEventFrameCall(event: string, callBack: Function) {
        if (!this._eventFrameCall) this._eventFrameCall = new Map();
        this._eventFrameCall.set(event, callBack);
    }

    /**
     * 检查事件帧触发
     */
    private checkEventFrameCall() {
        if (this._eventFrameCall) {
            this._spine.setEventListener((t: sp.spine.TrackEntry, ev: any) => {
                // console.log('event: ', t, ev);
                if (ev.data?.name) {
                    this._eventFrameCall.get?.(ev.data.name)?.();
                }
            })
        }
    }

    public setSpineData(sd: sp.SkeletonData) {
        this._spine = this.node.getComponent(sp.Skeleton)!;
        if (!this._spine) {
            this.spine = this.node.addComponent(sp.Skeleton);
        }
        this._spine.skeletonData = sd;
    }
    /**
     * 创建动画
     * @param spineSrc 动画地址
     */
    public createSpine(spineSrc: string, call?: Function) {
        this._spineSrc = spineSrc;
        this._spineName = '';
        this._loop = false;

        Res.load(BundleManager.bundleName, GameDefine.SpinesUrl + spineSrc)
            .then((sd: sp.SkeletonData) => {
                if (!this.isValid) {
                    return;
                }

                if (this._spine) {
                    this._spine.skeletonData = sd;
                    if (this._spineName != '') {
                        this.playAction(this._spineName, this._loop, this._isRemove, this._isOnlyOne);
                    }
                    call && call();
                }
            })
            .catch(err => {
                console.error(`加载【${this._spineSrc}】的 SPINE 资源不存在`);
                if (!this._loop && this._isRemove) {
                    // this.playEnded();
                    this.node.active = false;
                }
            })

    }
    /**
     * 修改图片颜色
     * @param color 
     */
    public setColor(color: Color) {
        if (color && this._spine) {
            if (color.toCSS() != this._spine.color.toCSS()) {
                this._spine.color = Object.freeze(color);
            }
        }

    }
    /**
     * 播放动画
     * @param name 动画名称
     * @param loop 是否循环播放
     * @param isRemove 播放完毕是否移除
     * @param isOnlyOne 是否只播放一次
     */
    public playAction(name: string, loop: boolean = false, isRemove = false, isOnlyOne: boolean = false, call?: Function, force_speed: number = 1) {
        this._spineName = name;
        this._loop = loop;
        this._isRemove = isRemove;
        this._isOnlyOne = isOnlyOne;

        this.node.active = true;
        if (!this._spine || !this._spine.skeletonData) {
            this.node.active = false;
            return;
        }

        // 检查动画是否存在
        const animationState = this._spine.findAnimation(name);
        if (!animationState) {
            this.node.active = false;
            console.warn(`SpineComponent: 动画 ${name} 不存在`);
            call && call();
            return;
        }

        this._spine.paused = false;
        if (!loop && isOnlyOne || isRemove) {
            this._spine.setCompleteListener(() => {
                this.node.active = false;
                call && call();
            });
        }
        this.checkEventFrameCall();

        this._spine.setAnimation(0, name, loop);
        this.updateSpineSpeed(force_speed);

        // 🔥 循环倒播支持：设置标记并初始化播放位置
        this._isReverseLoop = (force_speed && force_speed < 0 && loop);

        if (force_speed && force_speed < 0) {
            let track = this._spine.getState().tracks[0];
            if (track) {
                // 倒播从末尾开始
                track.trackTime = track.animationEnd;
            }
        }
    }

    /**
     * 播放指定次数的动画
     * @param name 动画名
     * @param times 播放次数 -1为无限循环 默认为1
     * @param call 完成回调
     * @param isHide 播放完成是否隐藏
     */
    public playActionByTimes(name: string, times: number = 1, call?: Function, isHide: boolean = false, force_speed?: number) {
        this._spineName = name;
        this.node.active = true;
        if (!this._spine || !this._spine.skeletonData) {
            // console.warn(`SpineComponent: 无法播放动画 ${name}，spine组件或数据缺失`);
            this.node.active = false;
            call && call();
            return;
        }

        // 检查动画是否存在
        const animationState = this._spine.findAnimation(name);
        if (!animationState) {
            this.node.active = false;
            console.warn(`SpineComponent: 动画 ${name} 不存在`);
            call && call();
            return;
        }

        this._spine.paused = false;
        if (times > 0) {
            let finishTime = 0;
            this._spine.setCompleteListener(() => {
                finishTime++;
                if (finishTime >= times) {
                    this._spine.setCompleteListener(null);
                    call && call();
                    this.node.active = !isHide;
                }
            });
        }
        this.checkEventFrameCall();
        this._spine.setAnimation(0, name, (times > 1 || times == -1) ? true : false);
        this.updateSpineSpeed(force_speed);
    }

    /**
     * 播放指定次数的动画(async版本)
     * @param name 动画名
     * @param times 播放次数 -1为无限循环 默认为1
     * @param isHide 播放完成是否隐藏
     * @param force_speed 强制速度
     */
    public playActionByTimesAsync(name: string, times: number = 1, isHide: boolean = false, force_speed?: number) {
        return new Promise<void>((resolve) => {
            this._spineName = name;
            this.node.active = true;
            if (!this._spine || !this._spine.skeletonData) {
                // console.warn(`SpineComponent: 无法播放动画 ${name}，spine组件或数据缺失`);
                this.node.active = false;
                resolve();
                return;
            }

            // 检查动画是否存在
            const animationState = this._spine.findAnimation(name);
            if (!animationState) {
                console.warn(`SpineComponent: 动画 ${name} 不存在`);
                this.node.active = false;
                resolve();
                return;
            }

            this._spine.paused = false;
            if (times > 0) {
                let finishTime = 0;
                this._spine.setCompleteListener(() => {
                    finishTime++;
                    if (finishTime == times) {
                        this._spine.setCompleteListener(null);
                        resolve();
                        this.node.active = !isHide;
                    }
                });
            }
            this.checkEventFrameCall();
            this._spine.setAnimation(0, name, (times > 1 || times == -1) ? true : false);
            this.updateSpineSpeed(force_speed);
        })
    }

    public getIsActive() {
        return this._spine && this._spine.skeletonData;
    }

    /** 检查是否存在指定动画 */
    public hasAnimation(name: string): boolean {
        this.updateSpineComponent();
        if (!this._spine || !this._spine.skeletonData) {
            return false;
        }
        return this._spine.findAnimation(name) !== null;
    }


    /**当前是否正在播放指定动画 */
    public isPlayingAnimation(animation: string): boolean {
        if (!this.node || !this._spine) return false;
        return this._spineName == animation;
    }

    /**改变spine动画播放速度 */
    public updateSpineSpeed(force_speed?: number) {
        let speed = 1;
        if (force_speed) speed = force_speed;
        this._spine.timeScale = speed;
    }

    /**隐藏动画节点 */
    public hideSpine() {
        this.node.active = false;
    }
}


