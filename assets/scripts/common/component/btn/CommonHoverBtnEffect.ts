import { _decorator, Component, Node, Prefab, UIOpacity } from 'cc';
import { PoolManager } from '../../manager/PoolManager';
const { ccclass, property } = _decorator;


/**处理鼠标悬停在按钮上方的表现效果 */

@ccclass('CommonHoverBtnEffect')
export class CommonHoverBtnEffect extends Component {

    @property(Prefab)
    light_effect_prefab: Prefab = null;

    private ligth_node: Node;
    private _listenersAdded: boolean = false; // 跟踪监听器状态

    private _hoverCallback: Function = null;
    private _leaveCallback: Function = null;

    protected onEnable(): void {
        this.addListener();
    }

    public setHoverCallback(callback: Function) {
        this._hoverCallback = callback;
    }

    public setLeaveCallback(callback: Function) {
        this._leaveCallback = callback;
    }

    protected onDisable(): void {
        this.removeListener();
    }

    public addListener() {
        // 检查是否已经添加过监听器
        if (this._listenersAdded) {
            // console.log(`[HoverBtn-${this.node.name}] ⚠️ Listeners already added, skipping`);
            return;
        }

        // 确保清理之前的监听器（防御性编程）
        this.node.off(Node.EventType.MOUSE_ENTER, this.onHoverBtn, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onLeaveBtn, this);

        // 添加新的监听器
        this.node.on(Node.EventType.MOUSE_ENTER, this.onHoverBtn, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onLeaveBtn, this);
        this._listenersAdded = true;
        // console.log(`[HoverBtn-${this.node.name}] ✅ Listeners added successfully`);
    }

    public removeListener() {
        if (!this._listenersAdded) {
            // console.log(`[HoverBtn-${this.node.name}] ℹ️ No listeners to remove`);
            return;
        }

        this.onLeaveBtn();
        this.node.off(Node.EventType.MOUSE_ENTER, this.onHoverBtn, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onLeaveBtn, this);
        this._listenersAdded = false;
        // console.log(`[HoverBtn-${this.node.name}] 🗑️ Listeners removed successfully`);
    }

    /**
     * 检查是否已添加监听器
     */
    public hasListeners(): boolean {
        return this._listenersAdded;
    }

    private onHoverBtn() {
        this.ligth_node = this.node.getChildByName("HoverLightEffect");
        if (!this.ligth_node) {
            this.ligth_node = PoolManager.instance.getNode(this.light_effect_prefab);
            this.node.insertChild(this.ligth_node, 0);
        }

        let opacity = 50;
        const opacity_comp = this.node.getComponent(UIOpacity);
        if (opacity_comp && opacity_comp.opacity < 255) {
            opacity = 0;
        }
        this.ligth_node.getComponent(UIOpacity).opacity = opacity;
        this._hoverCallback?.();
    }

    private onLeaveBtn() {
        this._leaveCallback?.();
        if (!this.ligth_node) return;
        if (this.ligth_node) {
            this.scheduleOnce(() => {
                PoolManager.instance.putNode(this.ligth_node);
                this.ligth_node = null;
            });
        }
    }
}


