import { _decorator, Label, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { BaseComponent } from '../../common/base/BaseComponent';
const { ccclass, property } = _decorator;

@ccclass('ToastPop')
export class ToastPop extends BaseComponent {

    @property({ type: Label, tooltip: "用于显示提示文字的 Label" })
    public msgLabel: Label = null!;

    protected onDisable(): void {
        super.onDisable();

        let uiOpacity = this.node.getComponent(UIOpacity);
        if (uiOpacity) Tween.stopAllByTarget(uiOpacity);

    }

    /**
     * 独立显示的通用方法（任何脚本拿到此组件都可以调用）
     * @param msg 提示文本
     * @param onComplete 动画播放完毕后的回调函数
     */
    public show(msg: string, onComplete?: Function): void {
        if (this.msgLabel) {
            this.msgLabel.string = msg;
        }

        this._playFloatAnim(onComplete);
    }

    /**
     * 核心表现动画
     */
    private _playFloatAnim(onComplete?: Function): void {
        let uiOpacity = this.node.getComponent(UIOpacity);
        if (!uiOpacity) uiOpacity = this.node.addComponent(UIOpacity);

        // 重置初始状态 (方便节点池复用)
        uiOpacity.opacity = 255;
        this.node.setPosition(0, 150, 0);

        Tween.stopAllByTarget(this.node);
        // 🚀 丝滑上浮
        tween(this.node)
            .to(1.5, { position: new Vec3(0, 250, 0) }, { easing: 'quadOut' })
            .start();

        Tween.stopAllByTarget(uiOpacity);
        // 渐隐动画
        tween(uiOpacity)
            .delay(0.8)
            .to(0.7, { opacity: 0 })
            .call(() => {
                // 动画结束，触发回调，把生命周期控制权交还给调用者
                onComplete?.();
            })
            .start();
    }
}