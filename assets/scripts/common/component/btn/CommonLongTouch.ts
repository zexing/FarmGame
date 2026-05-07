import { _decorator, CCFloat, Component, EventTouch, NodeEventType } from 'cc';
import { ToolUtils } from '../../common_utils/ToolUtils';
const { ccclass, property } = _decorator;

@ccclass('CommonLongTouch')
export class CommonLongTouch extends Component {

    @property({ type: CCFloat, tooltip: "延迟时长", })
    private delayTime: number = 0.3;//延迟时长

    private _time: number = 0;
    private clickCallBack: Function = null;//点击回调
    private longTouchStartCallBack: Function = null;//长按开始回调
    private longTouchCallBack: Function = null;//长按回调
    private longTouchEndCallBack: Function = null;//长按结束回调

    private longTouchCallBackFinish: boolean = true;//长按回调完成标志


    private _isTouch: boolean = true;
    public set isTouch(value: boolean) {
        this._isTouch = value;
        if (!value) this._time = 0;
    }
    public get isTouch() {
        return this._isTouch;
    }

    protected onEnable(): void {
        ToolUtils.addEvents(this, this.addEvents);
    }

    protected onDisable(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
    }

    private addEvents() {
        this.node.on(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this._onTouchEnded, this);
    }

    private removeEvents() {
        this.node.off(NodeEventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(NodeEventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(NodeEventType.TOUCH_CANCEL, this._onTouchEnded, this);
    }

    update(deltaTime: number) {
        if (!this.isTouch) return;
        this._time++;
        if (this._time % (this.delayTime * 60) == 0 && !this.longTouchCallBackFinish) {
            if (this._time == (this.delayTime * 60)) {
                this.onLongTouchStartCall();
            }
            this.onLongTouchCall();
        }
    }

    /**设置单次点击回调 */
    public setClickCallBack(callBackFun: Function) {
        this.clickCallBack = callBackFun;
    }

    public setLongTouchStartCallBack(callBackFun: Function) {
        this.longTouchStartCallBack = callBackFun;
    }

    /**设置长按回调 */
    public setLongTouchCallBack(callBackFun: Function) {
        this.longTouchCallBack = callBackFun;
    }

    /**设置长按结束回调 */
    public setLongTouchEndCallBack(callBackFun: Function) {
        this.longTouchEndCallBack = callBackFun;
    }

    protected _onTouchBegan(event?: EventTouch) {
        this._time = 0;
        this.longTouchCallBackFinish = false;
    }

    protected _onTouchEnded(event?: EventTouch) {
        this.stopClick();
        this.onLongTouchEndCall();
        this.longTouchCallBackFinish = true;
    }

    //回调点击函数
    private onClickCall() {
        if (this.clickCallBack) {
            this.clickCallBack(this);
        }
    }

    private onLongTouchStartCall() {
        console.log("onLongTouchStartCall");
        if (this.longTouchStartCallBack) {
            this.longTouchStartCallBack(this);
        }
    }

    private onLongTouchCall() {
        console.log("onLongTouchCall");
        if (this.longTouchCallBack) {
            this.longTouchCallBack(this);
        }
    }

    private onLongTouchEndCall() {
        console.log("onLongTouchEndCall");
        if (this.longTouchEndCallBack) {
            this.longTouchEndCallBack();
        }
    }

    private stopClick() {
        if (!this.isTouch) return;
        if (this._time < (this.delayTime * 60)) {
            this.onClickCall();
        }
    }
}


