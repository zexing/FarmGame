import { _decorator, Component } from 'cc';
import { CurrencyFormatter } from '../../common_utils/CurrencyFormatter';
import { ToolUtils } from '../../common_utils/ToolUtils';
import { ComImageLabel } from './ComImageLabel';
const { ccclass, property } = _decorator;

@ccclass('ComUpNumImageLabel')
export class ComUpNumImageLabel extends Component {
    // @property({ tooltip: '0:普通系统数字 1:特殊数字(用图片拼的艺术字)' })
    // showtype: number = 0;

    @property({ tooltip: '数字上涨时间（秒）' })
    duration: number = 5;

    // @property({ tooltip: '缓动类型: 0-线性 1-缓入 2-缓出 3-缓入缓出' })
    // easingType: number = 0;

    // private lab_count: Label;
    private _targetCount: number = 0;
    private _currentCount: number = 0;
    private _startCount: number = 0;
    private _elapsedTime: number = 0;
    private _isAnimating: boolean = false;

    private _imageLabel: ComImageLabel = null;

    private _finishCall: Function = null;

    protected onLoad(): void {
        // this.lab_count = this.node.getComponent(Label)
        this._imageLabel = this.node.getComponent(ComImageLabel);
    }

    public setFinishCall(callback: Function) {
        console.log("ComUpNumImageLabel setFinishCall: ", callback);
        this._finishCall = callback;
    }

    public forceSetCount(count: number) {
        this._currentCount = count;
        this._targetCount = count;
        this.showCount();
    }

    public getTargetCount(): number {
        return this._targetCount;
    }

    public getCurrentCount(): number {
        return this._currentCount;
    }

    /**强制设置数字 */
    public forceSetTargetCount(value?: number) {
        if (value !== undefined) {
            this._targetCount = value;
        }
        this._currentCount = this._targetCount;
        this._isAnimating = false;
        this._elapsedTime = 0;
        this.showCount();
        this._finishCall?.();
        this.setFinishCall(null);
    }

    public setTargetCount(count: number, start_count?: number) {
        if (start_count !== undefined) {
            this._currentCount = start_count;
        }
        this._startCount = this._currentCount;
        this._targetCount = count;
        this._elapsedTime = 0;
        this._isAnimating = true;
        // console.log("ComUpNumLabel 开始动画: ", this._startCount, " -> ", this._targetCount, " 时长:", this.duration);
    }

    private showCount() {
        if (!this._imageLabel) return;
        const displayValue = CurrencyFormatter.toDisplayValue(this._currentCount);
        let show_count = displayValue.toFixed(2);
        const str = ToolUtils.converNumStrSYSFont(show_count);
        this._imageLabel.setStr(str);
        // if (this.showtype === 0) this.lab_count.string = ToolUtils.converNumStrSYSFont(show_count);
        // else this.lab_count.string = ToolUtils.converNumStrBMFont(show_count);
    }

    public clearCount() {
        this._targetCount = 0;
        this._currentCount = 0;
        this._startCount = 0;
        this._elapsedTime = 0;
        this._isAnimating = false;
        // this.lab_count.string = '';
    }

    protected onDisable(): void {
        this.clearCount();
    }

    update(deltaTime: number) {
        if (!this._isAnimating) return;
        // if (this._currentCount === this._targetCount) return;

        // 如果时间超过设定的持续时间，直接设置为目标值
        if (this._elapsedTime >= this.duration) {
            console.log("ComUpNumImageLabel 到达最终值");
            this._isAnimating = false;
            this._elapsedTime = 0;
            this._currentCount = this._targetCount;
            this.showCount();
            this._finishCall?.();
            return;
        }

        // 累计时间
        this._elapsedTime += deltaTime;

        // 基于时间进度计算当前值
        let progress = this._elapsedTime / this.duration;

        // 应用缓动效果（暂时注释，使用线性）
        // progress = this.applyEasing(progress);

        this._currentCount = this._startCount + (this._targetCount - this._startCount) * progress;

        this.showCount();
    }
}


