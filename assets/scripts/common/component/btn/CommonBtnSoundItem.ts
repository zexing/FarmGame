import { _decorator, Component, Enum } from "cc";
import { AudioManager } from "../../manager/AudioManager";

const { ccclass, property, disallowMultiple } = _decorator;

//按钮点击音效枚举
export enum BtnSoundEnum {
    ClickButton,//点击准备阶段play按钮
    ClickSpin, //点击转盘
}

const BtnSoundNames = [
    'click_button',
    'click_spin',
]

/**
 * 通用按钮点击播放音效组件
 * **/
@ccclass('CommonBtnSoundItem')
@disallowMultiple
export class CommonBtnSoundItem extends Component {
    @property({ type: Enum(BtnSoundEnum), tooltip: "播放音效类型" })
    private soundType: BtnSoundEnum = BtnSoundEnum.ClickButton;

    // private _soundId: number = 0;

    protected onEnable(): void {
        // this._soundId = this.getSoundId();

        // this.node.on(NodeEventType.TOUCH_END, this.onTouch, this);
    }

    protected onDisable(): void {
        // this.node.off(NodeEventType.TOUCH_END, this.onTouch, this);
    }

    private onTouch() {

    }

    playSound() {
        AudioManager.instance.playEffect(BtnSoundNames[this.soundType]);
    }
}


