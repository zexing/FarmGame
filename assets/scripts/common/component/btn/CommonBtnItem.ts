import { _decorator, Button, CCFloat, Color, Component, Enum, EventTouch, Label, macro, Node, NodeEventType, Sprite, Vec3 } from 'cc';
import { MathUtils } from '../../common_utils/MathUtils';
import { ToolUtils } from '../../common_utils/ToolUtils';
import { CommonBtnGreyItem } from './CommonBtnGreyItem';
import { CommonBtnSoundItem } from './CommonBtnSoundItem';
import { CommonScaleBtn } from './CommonScaleBtn';
const { ccclass, property, disallowMultiple } = _decorator;

//按钮点击缩放模式枚举
export enum BtnScaleEnum {
    /**没有效果**/
    None,
    /**收缩**/
    Shrink,
    /**收缩（多节点）**/
    Shrinks
}

//按钮点击音效枚举
export enum BtnSoundEnum {
    /**没有音效**/
    None,
    /**常用点击音效**/
    ClickSound,
    /**关闭或取消点击音效**/
    CloseSound
}

//按钮点击多次触发枚举
export enum BtnSustainEnum {
    /**没有效果**/
    None,
    /**持续生效**/
    Sustain,
}

/**
 * 通用按钮组件，支持多种缩放模式，点击音效，多次触发
 * **/
@ccclass('CommonBtnItem')
@disallowMultiple
export class CommonBtnItem extends Component {
    @property({ type: Sprite, tooltip: "按钮图标" })
    private btnIcon: Sprite;

    @property({ type: Label, tooltip: "按钮文本" })
    private btnLab: Label;

    @property({ type: Enum(BtnScaleEnum), tooltip: "按钮点击缩放模式" })
    private scaleType: number = BtnScaleEnum.Shrink;

    // @property({ type: Enum(BtnSoundEnum), tooltip: "按钮点击音效" })
    // private soundType: number = BtnSoundEnum.ClickSound;

    @property({ type: Enum(BtnSustainEnum), tooltip: "按钮点击多次触发" })
    private sustainType: number = BtnSustainEnum.None;

    @property({ tooltip: "是否禁止传递后续事件" })
    private isProStopped: boolean = false;

    @property({
        type: CCFloat,
        group: { id: "scale", name: "scale" },
        visible: function (this: CommonBtnItem) {
            return this.scaleType != BtnScaleEnum.None;
        }
    })
    private originalScale: number = 0.9;

    @property({
        type: [Node], tooltip: "跟随同时缩放节点",
        group: { id: "scale", name: "scale" },
        visible: function (this: CommonBtnItem) {
            return this.scaleType == BtnScaleEnum.Shrinks;
        }
    })
    private nodeList: Node[] = [];

    @property({
        type: CCFloat, tooltip: "间隔时长",
        group: { id: "sustain", name: "sustain" },
        visible: function (this: CommonBtnItem) {
            return this.sustainType == BtnSustainEnum.Sustain;
        }
    })
    private intervalTime: number = 0.3;//间隔时长

    @property({
        type: CCFloat, tooltip: "延迟时长",
        group: { id: "sustain", name: "sustain" },
        visible: function (this: CommonBtnItem) {
            return this.sustainType == BtnSustainEnum.Sustain;
        }
    })
    private delayTime: number = 0.5;//延迟时长

    private _time: number = 0;
    private _currScale: number = 1;
    private duration = 0.1;
    private _transitionFinished: boolean = false;;
    // private _soundId: number = 0;
    private clickCallBack: Function = null;
    private scaleVec: Vec3;//按钮初始缩放值

    private _canTouch: boolean = true;
    public set canTouch(value: boolean) {
        this._canTouch = value;
    }
    public get canTouch() {
        return this._canTouch;
    }

    private _isRemove: boolean = true;
    @property({ tooltip: "移除非整合按钮组件" })
    public set isRemove(value) {
        this._isRemove = value;
        this.node.getComponent(CommonBtnSoundItem)?.destroy();
        this.node.getComponent(CommonScaleBtn)?.destroy();
        this.node.getComponent(Button)?.destroy();
    }

    public get isRemove() {
        return this._isRemove;
    }

    protected onLoad(): void {
        this.scaleVec = this.node.getScale(this.scaleVec);
    }

    protected onEnable(): void {
        this._canTouch = true;
        // this._soundId = this.getSoundId();
        if (this.scaleType != BtnScaleEnum.None) {
            this.stopTouche();
        }

        ToolUtils.addEvents(this, this.addEvents);
    }

    protected onDisable(): void {
        this.node.setScale(this.scaleVec);
        ToolUtils.removeEvents(this, this.removeEvents);
    }

    private addEvents() {
        this.node.on(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    private removeEvents() {
        this.node.off(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(NodeEventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.unschedule(this.onClickCall);
    }

    update(deltaTime: number) {
        if (this.scaleType != BtnScaleEnum.None) {
            if (this._transitionFinished) {
                this._time += deltaTime;
                let ratio = 1.0;
                if (this.duration > 0) {
                    ratio = this._time / this.duration;
                }

                if (ratio >= 1) {
                    ratio = 1;
                }
                let lerpScaleX = MathUtils.lerp(this.node.scale.x, this.scaleVec.x * this._currScale, ratio);
                let lerpScaleY = MathUtils.lerp(this.node.scale.y, this.scaleVec.y * this._currScale, ratio);
                this.node.setScale(lerpScaleX, lerpScaleY);
                for (let i = 0; i < this.nodeList.length; i++) {
                    this.nodeList[i].setScale(lerpScaleX, lerpScaleY);
                }
                if (ratio === 1) {
                    this._transitionFinished = false;
                    this._time = 0;
                }
            }
        }
    }

    public setClickCallBack(callBackFun: Function) {
        this.clickCallBack = callBackFun;
    }

    public clearClickCallBack() {
        this.clickCallBack = null;
    }

    protected _onTouchBegan(event?: EventTouch) {
        if (!this.canTouch) {
            return;
        }
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        if (this.scaleType != BtnScaleEnum.None) {
            this._transitionFinished = true;
            this._currScale = this.originalScale;
            this._time = 0;
        }
        if (this.sustainType == BtnSustainEnum.Sustain) {
            this.unschedule(this.onClickCall);
            this.schedule(this.onClickCall, this.intervalTime, macro.REPEAT_FOREVER, this.delayTime);
        }
    }

    protected _onTouchEnded(event?: EventTouch) {
        if (!this.canTouch) {
            return;
        }
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        //点击事件
        if (this.scaleType != BtnScaleEnum.None) {
            this.stopTouche();
        }
        if (this.sustainType == BtnSustainEnum.Sustain) {
            this.unschedule(this.onClickCall);
        }
        this.onClickCall();
    }

    protected _onTouchCancel(event?: EventTouch) {
        if (!this.canTouch) {
            return;
        }
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        if (this.scaleType != BtnScaleEnum.None) {
            this.stopTouche();
        }
        if (this.sustainType == BtnSustainEnum.Sustain) {
            this.unschedule(this.onClickCall);
        }
    }

    //回调点击函数
    private onClickCall() {
        if (this.clickCallBack) {
            this.clickCallBack(this.node.name);
        }
        let sound_btn = this.node.getComponent(CommonBtnSoundItem);
        if (sound_btn) {
            sound_btn.playSound();
        }
    }

    private stopTouche() {
        this._transitionFinished = true;
        this._currScale = 1;
        this._time = 0;
    }

    //获取音效名称
    // private getSoundId() {
    //     let soundId: number = 0;
    //     switch (this.soundType) {
    //         case BtnSoundEnum.ClickSound:
    //             soundId = 2001;
    //             break;
    //         case BtnSoundEnum.CloseSound:
    //             soundId = 2002;
    //             break;
    //     }
    //     return soundId;
    // }

    /**设置按钮图标资源**/
    public set icon(str: string) {
        if (this.btnIcon) {
            this.btnIcon.spriteFrame = this.btnIcon.spriteAtlas.getSpriteFrame(str);
        }
    }

    /**设置按钮图标是否显示**/
    public set iconVisible(isShow: boolean) {
        if (this.btnIcon) {
            this.btnIcon.node.active = isShow;
        }
    }

    /**设置按钮文本描述**/
    public set label(str: string) {
        if (this.btnLab) {
            this.btnLab.string = str;
        }
    }

    /**设置按钮文本颜色**/
    public set labelColor(labColor: Color) {
        if (this.btnLab) {
            this.btnLab.color = labColor;
        }
    }

    /**设置按钮置灰**/
    public set btnGrey(value: boolean) {
        this.node.getComponent(CommonBtnGreyItem)!.isGrey = value;
    }

    /**设置按钮置灰**/
    public get btnGrey() {
        return this.node.getComponent(CommonBtnGreyItem)!.isGrey;
    }

    /**设置按钮绿色模式**/
    public isGreenBtn() {
        this.node.getComponent(CommonBtnGreyItem)!.isGreen = true;
    }

    /**设置按钮黄色模式**/
    public isYellowBtn() {
        this.node.getComponent(CommonBtnGreyItem)!.isYellow = true;
    }

    /**设置按钮红色模式**/
    public isRedBtn() {
        this.node.getComponent(CommonBtnGreyItem)!.isRed = true;
    }

    /**设置按钮灰色模式**/
    public isGreyBtn() {
        this.node.getComponent(CommonBtnGreyItem)!.isGrey = true;
    }

    protected onDestroy(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        this.clickCallBack = null;
        this.scaleVec = null;
    }
}

