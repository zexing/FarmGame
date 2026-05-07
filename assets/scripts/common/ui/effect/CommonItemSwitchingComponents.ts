import { _decorator, Component, tween, Tween, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 通用item切换效果组件
 * **/
@ccclass('CommonItemSwitchingComponents')
export class CommonItemSwitchingComponents extends Component {
    private nodeVec: Vec3 = new Vec3();
    private nodeTween: Tween<any>;

    private posX0: number = 0;  //起始x坐标
    private posX1: number = 0;  //左侧x坐标
    private posX2: number = 0;  //右侧x坐标

    protected onLoad(): void {
        this.nodeVec = this.node.getPosition(this.nodeVec);
        this.posX1 = -this.node.getComponent(UITransform).width;
        this.posX2 = -this.posX1;
    }

    protected onDisable(): void {
        if (this.nodeTween) {
            this.nodeTween.stop();
        }
        this.node.setPosition(0, this.nodeVec.y);
    }

    //播放内容节点切出效果
    public playInfoOut(call: Function, time: number = 0.7) {
        if (this.nodeTween) {
            this.nodeTween.stop();
        }
        this.node.setPosition(0, this.nodeVec.y);
        this.nodeVec.x = this.posX1;
        this.nodeTween = tween(this.node)
            .to(time, { position: this.nodeVec }, { easing: "smooth" })
            .call(() => { if (call) { call() } })
            .start();
    }

    //播放内容节点切入效果
    public playInfoIn(call: Function, time: number = 0.7) {
        if (this.nodeTween) {
            this.nodeTween.stop();
        }
        this.node.setPosition(this.posX2, this.nodeVec.y);
        this.nodeVec.x = 0;
        this.nodeTween = tween(this.node)
            .to(time, { position: this.nodeVec }, { easing: "smooth" })
            .call(() => { if (call) { call() } })
            .start();
    }

    protected onDestroy(): void {
        if (this.nodeTween) {
            this.nodeTween.stop();
            this.nodeTween = null;
        }
        this.nodeVec = null;
        this.posX1 = 0;
        this.posX2 = 0;
    }
}


