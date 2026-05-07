import { _decorator, Component, Node, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

enum EClickBtnEffectType {
    /**淡出 */
    FadeOut = 0,
    Scale = 1,
}


/**处理鼠标点击按钮表现效果 */

@ccclass('CommonClickBtnEffect')
export class CommonClickBtnEffect extends Component {

    // @property({ type: Enum(EClickBtnEffectType), tooltip: "点击效果类型" })
    // effect_type: EClickBtnEffectType = EClickBtnEffectType.FadeOut;


    // @property({ type: CCFloat, tooltip: '缩放大小', visible: function () { return true; } })
    // scale_size: number = 0.8;

    // @property({type: CCFloat, tooltip: '缩放时间', visible: function () { return true; }})
    // scale_time: number = 0.2;

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        // this.node.on(Node.EventType.MOUSE_LEAVE, this.onTouchEnd, this, true);
    }


    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        // this.node.on(Node.EventType.MOUSE_LEAVE, this.onTouchEnd, this, true);
    }

    private onTouchStart() {
        const opacity_comp = this.node.getComponent(UIOpacity);
        if (opacity_comp && opacity_comp.opacity == 255) opacity_comp.opacity = 150;
    }


    private onTouchEnd() {
        const opacity_comp = this.node.getComponent(UIOpacity);
        if (opacity_comp && opacity_comp.opacity == 150) opacity_comp.opacity = 255;
        return true;
    }

}


