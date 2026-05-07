import { _decorator, Component, Label, tween, v3 } from 'cc';

import { Tween } from 'cc';
import { ToolUtils } from '../../common_utils/ToolUtils';
const { ccclass, property } = _decorator;

@ccclass('ComScaleUpNumLabel')
export class ComScaleUpNumLabel extends Component {

    @property({ tooltip: '数字上涨时间' })
    duration: number = 5;

    @property({ tooltip: '缩放时长' })
    scale_duration: number = 0.5;

    private lab_count: Label;
    private _targetCount: number = 0;
    private _currentCount: number = 0;
    private _sub: number = 0;

    finishCall: Function = null;

    protected onLoad(): void {
        this.lab_count = this.node.getComponent(Label)
    }

    protected onDisable(): void {
        Tween.stopAllByTarget(this.node);
    }

    forceSetCount(count: number) {
        this._currentCount = count;
        this._targetCount = count;
        this.showCountLast();
    }

    setTargetCount(count: number) {
        this._targetCount = count;
        let temp_duration = this.duration;
        // if (GameData.instance.fastMode == 2) temp_duration = this.duration / 2;
        // else if (GameData.instance.fastMode == 3) temp_duration = this.duration / 3;
        this._sub = this._targetCount / (temp_duration * 60);
        this._sub = Math.max(Math.round(this._sub * 100) / 100, 0.01);
        this.showEffect();
    }

    showCountLast() {
        let show_count = this._currentCount.toFixed(2);
        this.lab_count.string = ToolUtils.converNumStrSYSFont(show_count);
    }

    showEffect() {
        tween(this.node)
            .to(this.scale_duration / 2, { scale: v3(1.25, 1.25, 1) })
            .start();
    }

    hideEffect() {
        if (this.node.scale.x == 1 && this.node.scale.y == 1) return;
        tween(this.node)
            .to(this.scale_duration / 2, { scale: v3(1, 1, 1) })
            .call(() => {
                this.finishCall && this.finishCall();
                this.finishCall = null;
            })
            .start();
    }

    update(deltaTime: number) {
        if (!this._targetCount && !this._currentCount) return;
        if (this._currentCount + this._sub >= this._targetCount) {
            if (this._currentCount != this._targetCount) {
                this._currentCount = this._targetCount;
                this.hideEffect();
            }
            this.showCountLast();
            return;
        }
        this._currentCount += this._sub;
        this.showCountLast();
    }
}


