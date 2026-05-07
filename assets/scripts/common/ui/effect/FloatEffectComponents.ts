import { _decorator, CCFloat, CCInteger, Component, Enum, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

export enum FloatType {
    OneWay = 1,//单向飘动
    BackAndForth = 2,//来回循环飘动
}

export enum FloatDirection {
    LeftToRight = 0,//从左往右
    TopToBottom = 1,//从上往下
    RightToLeft = 2,//从右往左
    BottomToTop = 3,//从下往上
}

/**
 * 漂动效果类
 * **/
@ccclass('FloatEffectComponents')
export class FloatEffectComponents extends Component {
    @property({ type: Enum(FloatType), tooltip: "飘动效果类型" })
    public floatType: FloatType = FloatType.OneWay;

    @property({ type: Enum(FloatDirection), tooltip: "飘动方向类型" })
    public floatDirection: FloatDirection = FloatDirection.LeftToRight;

    @property({ type: CCFloat, tooltip: "飘动速度" })
    public speed: number = 0.2;

    @property({ type: CCInteger, tooltip: "坐标最小值", })
    public posMin: number = 0;

    @property({ type: CCInteger, tooltip: "坐标最大值", })
    public posMax: number = 0;

    private _currDirection: number = 1;

    private nodeVec: Vec3 = new Vec3();

    protected onLoad(): void {
        if (this.floatDirection == FloatDirection.LeftToRight) {
            this._currDirection = 1;
        } else if (this.floatDirection == FloatDirection.TopToBottom) {
            this._currDirection = -1;
        } else if (this.floatDirection == FloatDirection.RightToLeft) {
            this._currDirection = -1;
        } else if (this.floatDirection == FloatDirection.BottomToTop) {
            this._currDirection = 1;
        }
        this.node.getPosition(this.nodeVec);
    }

    protected update(dt: number): void {
        if (this.floatDirection == FloatDirection.LeftToRight || this.floatDirection == FloatDirection.RightToLeft) {
            this.nodeVec.x += this.speed * this._currDirection * dt;
            if (this.floatType == FloatType.OneWay) {
                if (this.nodeVec.x < this.posMin && this.floatDirection == FloatDirection.RightToLeft) {
                    this.nodeVec.x = this.posMax;
                }
                if (this.nodeVec.x > this.posMax && this.floatDirection == FloatDirection.LeftToRight) {
                    this.nodeVec.x = this.posMin;
                }
            } else if (this.floatType == FloatType.BackAndForth) {
                if (this.nodeVec.x < this.posMin) {
                    this._currDirection = 1;
                }
                if (this.nodeVec.x > this.posMax) {
                    this._currDirection = -1;
                }
            }
        } else {
            this.nodeVec.y += this.speed * this._currDirection * dt;
            if (this.floatType == FloatType.OneWay) {
                if (this.nodeVec.y < this.posMin && this.floatDirection == FloatDirection.TopToBottom) {
                    this.nodeVec.y = this.posMax;
                }
                if (this.nodeVec.y > this.posMax && this.floatDirection == FloatDirection.BottomToTop) {
                    this.nodeVec.y = this.posMin;
                }
            } else if (this.floatType == FloatType.BackAndForth) {
                if (this.nodeVec.y < this.posMin) {
                    this._currDirection = 1;
                }
                if (this.nodeVec.y > this.posMax) {
                    this._currDirection = -1;
                }
            }
        }

        this.node.setPosition(this.nodeVec);
    }
}


