import { _decorator, CCFloat, CCInteger, Component, easing, Enum, EventHandler, UIOpacity, Vec3 } from 'cc';
import { MathUtils } from '../../common_utils/MathUtils';
const { ccclass, property } = _decorator;

export enum SwitchingType {
    CutInOut = 1,//切入/切出
    ScaleInOut = 2,//缩放出现/缩放消失
    FadeInOut = 3,//淡入/淡出
}

export enum SwitchingDirection {
    LeftToRight = 0,//从左往右
    TopToBottom = 1,//从上往下
    RightToLeft = 2,//从右往左
    BottomToTop = 3,//从下往上
}

/**
 * 缓动效果类
 * **/
@ccclass('SwitchingEffectComponents')
export class SwitchingEffectComponents extends Component {
    @property({
        type: Enum(SwitchingType),
        tooltip: "切换效果类型，包括：\n1.CutInOut，切入/切出效果\n2.ScaleInOut，缩放出现/缩放消失效果",
    })
    public type: SwitchingType = SwitchingType.CutInOut;

    @property({
        type: CCFloat,
        tooltip: "切换效果时长",
        group: { id: "param", name: "param" }
    })
    public switchingTime: number = 0.15; // 改为0.15秒，速度更快

    @property({
        type: CCInteger,
        tooltip: "移动距离",
        group: { id: "param", name: "param" },
        visible: function (this: SwitchingEffectComponents) {
            return this.type == SwitchingType.CutInOut;
        }
    })
    public moveNum: number = 200;

    @property({
        type: Enum(SwitchingDirection),
        tooltip: "移动方向",
        group: { id: "param", name: "param" },
        visible: function (this: SwitchingEffectComponents) {
            return this.type == SwitchingType.CutInOut;
        }
    })
    public direction: number = SwitchingDirection.LeftToRight;


    @property({
        type: CCInteger,
        tooltip: "透明度变化值",
        group: { id: "param", name: "param" },
        visible: function (this: SwitchingEffectComponents) {
            return this.type == SwitchingType.FadeInOut;
        }
    })
    public opacity_range: number = 255;


    @property({
        type: [EventHandler],
        tooltip: "进入动画结束回调",
        group: { id: "event", name: "inCall" }
    })
    public eventHandlerIn: EventHandler[] = [];

    @property({
        type: [EventHandler],
        tooltip: "退出动画结束回调",
        group: { id: "event", name: "OutCall" }
    })
    public eventHandlerOut: EventHandler[] = [];

    private _isTween: boolean = false;//是否处于缓动中
    private _tweenState: number = 0;//缓动状态 0：进入动画;1：退出动画

    private _time: number = 0;

    private tweenVec: Vec3 = new Vec3();//缓动目标位置
    private tweenVec2: Vec3 = new Vec3();//缓动起始位置
    private nodeVec: Vec3 = new Vec3();//节点原始数据
    private tweenOpacity: number = 0;//节点原始透明度

    private opacityComp: UIOpacity = null;
    private _isPresetDone: boolean = false; // 标记是否已经预设置过初始状态

    protected onLoad(): void {
        if (this.type === SwitchingType.FadeInOut) {
            this.opacityComp = this.node.getComponent(UIOpacity);
            if (!this.opacityComp) this.opacityComp = this.node.addComponent(UIOpacity);
        }
        // 2025.11.1 修正：必须在onLoad中预设置，因为onLoad在节点添加到场景前执行
        // 如果在onEnable中预设置，会导致节点先在原始位置显示一帧
        this.presetInitialState();
        this._isPresetDone = true;
    }

    protected onEnable(): void {
        // onEnable时检查是否需要重新预设置（用于界面关闭后再打开的情况）
        if (!this._isPresetDone) {
            this.presetInitialState();
            this._isPresetDone = true;
        }
    }

    // 预设置初始状态
    private presetInitialState(): void {
        if (this.type === SwitchingType.CutInOut) {
            // 获取并保存原始位置
            this.nodeVec = this.node.getPosition(this.nodeVec);
            // 计算偏移位置
            let toX = 0;
            let toY = 0;
            if (this.direction == SwitchingDirection.LeftToRight) {
                toX = this.moveNum;
            } else if (this.direction == SwitchingDirection.TopToBottom) {
                toY = -this.moveNum;
            } else if (this.direction == SwitchingDirection.RightToLeft) {
                toX = -this.moveNum;
            } else if (this.direction == SwitchingDirection.BottomToTop) {
                toY = this.moveNum;
            }
            // 设置到偏移位置（动画起始位置）
            this.node.setPosition(this.nodeVec.x - toX, this.nodeVec.y - toY);
        } else if (this.type === SwitchingType.ScaleInOut) {
            // 保存原始缩放
            this.nodeVec = this.node.getScale(this.nodeVec);
            // 设置为0缩放（动画起始状态）
            this.node.setScale(0, 0);
        } else if (this.type === SwitchingType.FadeInOut) {
            // 设置为完全透明（动画起始状态）
            if (this.opacityComp) {
                this.opacityComp.opacity = 0;
            }
        }
    }

    protected onDisable(): void {
        if (this._isTween) {
            // 强制结束动画，恢复到目标状态
            if (this._tweenState == 0) {
                // 进入动画：恢复到原始位置
                this.setNodeVec();
            }
            // 退出动画不需要恢复，让节点保持在退出状态
            this._isTween = false;
            this._time = 0;
            this.node.resumeSystemEvents(true);
        }
        // 重置预设置标记，下次enable时重新预设置
        this._isPresetDone = false;
    }

    protected update(dt: number): void {
        if (this._isTween) {
            if (this.type == SwitchingType.CutInOut) {
                this.updateCutTween(dt);
            } else if (this.type == SwitchingType.ScaleInOut) {
                this.updateScaleTween(dt);
            } else if (this.type == SwitchingType.FadeInOut) {
                this.updateFadeTween(dt);
            }
        }
    }

    //获取节点初始化状态
    private getNodeVec() {
        if (this.type == SwitchingType.CutInOut) {
            this.nodeVec = this.node.getPosition(this.nodeVec);
        } else if (this.type == SwitchingType.ScaleInOut) {
            this.nodeVec = this.node.getScale(this.nodeVec);
        } else if (this.type == SwitchingType.FadeInOut) {
            this.tweenOpacity = this.opacityComp.opacity;
        }
    }

    //重置节点初始化状态
    private setNodeVec() {
        if (this.type == SwitchingType.CutInOut) {
            this.node.setPosition(this.nodeVec);
        } else if (this.type == SwitchingType.ScaleInOut) {
            this.node.setScale(this.nodeVec);
        } else if (this.type == SwitchingType.FadeInOut) {
            this.opacityComp.opacity = this.tweenOpacity;
        }
    }

    //播放进入动画效果
    public onPlaySwitchingIn(e: any = null) {
        if (this._isTween) {
            return;
        }
        if (!this.node.activeInHierarchy) {
            return;
        }
        this.node.pauseSystemEvents(true);
        // 预设置后的第一次播放不需要重新获取原始位置
        // 后续播放时才需要获取当前位置作为原始位置
        if (this._isPresetDone) {
            // 第一次播放，使用预设置时保存的原始位置
            this._isPresetDone = false; // 标记已使用，下次需要重新获取
        } else {
            // 后续播放，获取当前位置
            this.getNodeVec();
        }
        this._tweenState = 0;
        this._time = 0;
        this._isTween = true;
        if (this.type == SwitchingType.CutInOut) {
            this.onCutIn(e);
        } else if (this.type == SwitchingType.ScaleInOut) {
            this.onScaleIn(e);
        } else if (this.type == SwitchingType.FadeInOut) {
            this.onFadeIn(e);
        } else {
            this._isTween = false;
        }
    }

    //播放退出动画效果
    public onPlaySwitchingOut(e: any = null) {
        if (this._isTween) {
            return;
        }
        if (!this.node.activeInHierarchy) {
            return;
        }
        this.node.pauseSystemEvents(true);
        this.getNodeVec();
        this._tweenState = 1;
        this._time = 0;
        this._isTween = true;
        if (this.type == SwitchingType.CutInOut) {
            this.onCutOut(e);
        } else if (this.type == SwitchingType.ScaleInOut) {
            this.onScaleOut(e);
        } else if (this.type == SwitchingType.FadeInOut) {
            this.onFadeOut(e);
        } else {
            this._isTween = false;
        }
    }

    //播放进入结束
    private onTweenInEnd(e: any) {
        this.setNodeVec();
        this._isTween = false;
        this._time = 0;
        this.node.resumeSystemEvents(true);
        EventHandler.emitEvents(this.eventHandlerIn, e);
    }

    //播放退出结束
    private onTweenOutEnd(e: any) {
        this.setNodeVec();
        this._isTween = false;
        this._time = 0;
        this.node.resumeSystemEvents(true);
        EventHandler.emitEvents(this.eventHandlerOut, e);
    }

    //切入效果
    private onCutIn(e: any) {
        let toX = 0;
        let toY = 0;
        if (this.direction == SwitchingDirection.LeftToRight) {
            toX = this.moveNum;
        } else if (this.direction == SwitchingDirection.TopToBottom) {
            toY = -this.moveNum;
        } else if (this.direction == SwitchingDirection.RightToLeft) {
            toX = -this.moveNum;
        } else if (this.direction == SwitchingDirection.BottomToTop) {
            toY = this.moveNum;
        }
        // tweenVec 存储目标位置（原始位置）
        this.tweenVec.set(this.nodeVec);
        // tweenVec2 存储起始位置（偏移位置）
        this.tweenVec2.set(this.nodeVec);
        this.tweenVec2.x -= toX;
        this.tweenVec2.y -= toY;
        // 设置节点到起始位置（如果是预设置后的第一次播放，节点已经在此位置）
        this.node.setPosition(this.tweenVec2);
    }

    //切出效果
    private onCutOut(e: any) {
        let toX = 0;
        let toY = 0;
        if (this.direction == SwitchingDirection.LeftToRight) {
            toX = - this.moveNum;
        } else if (this.direction == SwitchingDirection.TopToBottom) {
            toY = this.moveNum;
        } else if (this.direction == SwitchingDirection.RightToLeft) {
            toX = this.moveNum;
        } else if (this.direction == SwitchingDirection.BottomToTop) {
            toY = - this.moveNum;
        }
        // tweenVec2 存储起始位置（原始位置）
        this.tweenVec2.set(this.nodeVec);
        // tweenVec 存储目标位置（偏移位置）
        this.tweenVec.set(this.nodeVec);
        this.tweenVec.x += toX;
        this.tweenVec.y += toY;
        // 设置节点到起始位置
        this.node.setPosition(this.tweenVec2);
    }

    //位移效果
    private updateCutTween(dt: number) {
        this._time += dt;
        let ratio = 1.0;
        if (this.switchingTime > 0) {
            ratio = this._time / this.switchingTime;
        }

        if (ratio >= 1) {
            ratio = 1;
        }
        // 使用缓动函数计算插值比例
        let ratioNum = easing.smooth(ratio);
        // 从起始位置（tweenVec2）插值到目标位置（tweenVec）
        let lerpX = MathUtils.lerp(this.tweenVec2.x, this.tweenVec.x, ratioNum);
        let lerpY = MathUtils.lerp(this.tweenVec2.y, this.tweenVec.y, ratioNum);
        this.node.setPosition(lerpX, lerpY);
        if (ratio === 1) {
            if (this._tweenState == 0) {
                this.onTweenInEnd(null);
            } else {
                this.onTweenOutEnd(null);
            }
        }
    }

    //缩放出现效果
    private onScaleIn(e: any) {
        // tweenVec 存储目标缩放（原始缩放）
        this.tweenVec.set(this.nodeVec);
        // tweenVec2 存储起始缩放（0）
        this.tweenVec2.set(0, 0);
        // 设置节点到起始缩放（如果是预设置后的第一次播放，节点已经在此状态）
        this.node.setScale(0, 0);
    }

    //缩放消失效果
    private onScaleOut(e: any) {
        // tweenVec2 存储起始缩放（原始缩放）
        this.tweenVec2.set(this.nodeVec);
        // tweenVec 存储目标缩放（0）
        this.tweenVec.set(0, 0);
        this.node.setScale(this.nodeVec);
    }

    //缩放效果
    private updateScaleTween(dt: number) {
        this._time += dt;
        let ratio = 1.0;
        if (this.switchingTime > 0) {
            ratio = this._time / this.switchingTime;
        }

        if (ratio >= 1) {
            ratio = 1;
        }
        // 使用缓动函数计算插值比例
        let ratioNum = easing.smooth(ratio);
        // 从起始缩放（tweenVec2）插值到目标缩放（tweenVec）
        let lerpX = MathUtils.lerp(this.tweenVec2.x, this.tweenVec.x, ratioNum);
        let lerpY = MathUtils.lerp(this.tweenVec2.y, this.tweenVec.y, ratioNum);
        this.node.setScale(lerpX, lerpY);
        if (ratio === 1) {
            if (this._tweenState == 0) {
                this.onTweenInEnd(null);
            } else {
                this.onTweenOutEnd(null);
            }
        }
    }

    /**淡入效果 */
    private onFadeIn(e: any) {
        this.tweenOpacity = this.opacity_range;
        // 设置节点到起始透明度（如果是预设置后的第一次播放，节点已经在此状态）
        this.opacityComp.opacity = 0;
    }

    /**淡出效果 */
    private onFadeOut(e: any) {
        this.tweenOpacity = 0;
        this.opacityComp.opacity = this.opacity_range;
    }

    //淡入淡出效果
    private updateFadeTween(dt: number) {
        this._time += dt;
        let ratio = 1.0;
        if (this.switchingTime > 0) {
            ratio = this._time / this.switchingTime;
        }

        if (ratio >= 1) {
            ratio = 1;
        }
        // console.log("SwitchingEffectComponents updateFadeTween ratio=" + ratio);
        // let ratioNum = easing.smooth(ratio);
        // let lerp = MathUtils.lerp(this.opacityComp.opacity, this.tweenOpacity, ratioNum);
        let lerp;
        if (this._tweenState == 0) lerp = ratio * this.opacity_range;
        else lerp = (1 - ratio) * this.opacity_range;
        this.opacityComp.opacity = lerp;
        // console.log("SwitchingEffectComponents updateFadeTween opacity=" + lerp);
        if (ratio === 1) {
            if (this._tweenState == 0) {
                this.onTweenInEnd(null);
            } else {
                this.onTweenOutEnd(null);
            }
        }
    }

    /**获取当前是否处于播放状态**/
    public get isTween() {
        return this._isTween;
    }
}


