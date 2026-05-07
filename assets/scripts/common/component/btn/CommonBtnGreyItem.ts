import { _decorator, CCFloat, Component, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 通用按钮置灰组件
 * **/
@ccclass('CommonBtnGreyItem')
export class CommonBtnGreyItem extends Component {
    @property({ type: Sprite, tooltip: "按钮图标" })
    private icon: Sprite;

    //按钮模式
    @property({ type: CCFloat, readonly: true })
    private btnTypeNum: number = 0;
    @property({ type: CCFloat, tooltip: "按钮模式 => 0：置灰模式;1：多色模式" })
    public set btnType(value) {
        this.btnTypeNum = value;
        this.updateView();
    }
    public get btnType() {
        return this.btnTypeNum;
    }

    @property({ type: SpriteFrame, tooltip: "正常模式图片", visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 0; } })
    private normalSprite: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: "绿色按钮图片", visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    private greenSprite: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: "黄色按钮图片", visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    private yellowSprite: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: "红色按钮图片", visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    private redSprite: SpriteFrame;

    @property({ type: SpriteFrame, tooltip: "灰色按钮图片" })
    private greySprite: SpriteFrame;

    @property({ readonly: true })
    private iconState: string = "";
    //绿色模式
    @property({ visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    public set isGreen(value) {
        this.iconState = "green";
        this.updateView();
    }
    public get isGreen() {
        return this.iconState == "green";
    }
    //黄色模式
    @property({ visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    public set isYellow(value) {
        this.iconState = "yellow";
        this.updateView();
    }
    public get isYellow() {
        return this.iconState == "yellow";
    }
    //红色模式
    @property({ visible: function (this: CommonBtnGreyItem) { return this.btnTypeNum == 1; } })
    public set isRed(value) {
        this.iconState = "red";
        this.updateView();
    }
    public get isRed() {
        return this.iconState == "red";
    }
    //灰色模式
    @property
    public set isGrey(value) {
        if (value) {
            this.iconState = "grey";
        } else {
            if (this.btnTypeNum == 0) {
                this.iconState = "";
            } else if (this.btnTypeNum == 1) {
                this.iconState = "green";
            }
        }
        this.updateView();
    }
    public get isGrey() {
        return this.iconState == "grey";
    }

    protected onEnable(): void {
        this.updateView();
    }

    protected onDisable(): void {
    }

    private updateView() {
        if (this.icon) {
            if (this.iconState == "green") {
                this.icon.spriteFrame = this.greenSprite;
            } else if (this.iconState == "yellow") {
                this.icon.spriteFrame = this.yellowSprite;
            } else if (this.iconState == "red") {
                this.icon.spriteFrame = this.redSprite;
            } else if (this.iconState == "grey") {
                this.icon.spriteFrame = this.greySprite;
            } else {
                this.icon.spriteFrame = this.normalSprite;
            }
        }
    }
}