import { _decorator, CCFloat, Component, EventHandler, EventTouch, Node, NodeEventType } from 'cc';
import { MathUtils } from '../../common_utils/MathUtils';
const { ccclass, property } = _decorator;

@ccclass('CommonScaleBtn')
export class CommonScaleBtn extends Component {
    @property({ type: CCFloat })
    private originalScale: number = 0.9;

    @property({ type: [EventHandler] })
    public eventHandler: EventHandler[] = [];

    @property({ type: [Node], tooltip: "跟随同时缩放节点" })
    private nodeList: Node[] = [];

    @property({ tooltip: "是否禁止传递后续事件" })
    private isProStopped: boolean = true;

    private _time: number = 0;
    private _currScale: number = 1;
    private duration = 0.1;
    private _transitionFinished;

    protected onEnable(): void {
        this.node.on(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    protected onDisable(): void {
        this.node.off(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(NodeEventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    update(deltaTime: number) {
        if (!this._transitionFinished) {
            return;
        }
        this._time += deltaTime;
        let ratio = 1.0;
        if (this.duration > 0) {
            ratio = this._time / this.duration;
        }

        if (ratio >= 1) {
            ratio = 1;
        }
        let lerpScale = MathUtils.lerp(this.node.scale.x, this._currScale, ratio);
        this.node.setScale(lerpScale, lerpScale);
        for (let i = 0; i < this.nodeList.length; i++) {
            this.nodeList[i].setScale(lerpScale, lerpScale);
        }
        if (ratio === 1) {
            this._transitionFinished = false;
            this._time = 0;
        }
    }

    protected _onTouchBegan(event?: EventTouch) {
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        this._currScale = this.originalScale;
        this._transitionFinished = true;
        this._time = 0;

    }
    protected _onTouchEnded(event?: EventTouch) {
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        this.stopTouche();
        //点击事件
        EventHandler.emitEvents(this.eventHandler, event);
    }

    protected _onTouchCancel(event?: EventTouch) {
        if (this.isProStopped && event) {
            event.propagationStopped = true;
        }
        this.stopTouche();
    }

    private stopTouche() {
        this._currScale = 1;
        this._transitionFinished = true;
        this._time = 0;
    }
}