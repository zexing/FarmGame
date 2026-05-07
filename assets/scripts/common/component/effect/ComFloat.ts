import { _decorator, Component, EventTouch, Node, Tween, tween, UITransform, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComFloat')
export class ComFloat extends Component {

    @property(Node)
    range_node: Node = null;

    private _startPos: Vec3;

    private _touchStarPos: Vec3;
    private _touchEndPos: Vec3;

    public clickCall: Function = null;
    public dragCall: Function = null;

    /**边缘size */
    private _rangeSize = {
        topY: 0,
        bottomY: 0,
        leftX: 0,
        rightX: 0,
    };

    protected onLoad(): void {
        this.resetStartPos();
        this.resetRange();
    }

    public resetStartPos() {
        this._startPos = v3(this.node.position.x, this.node.position.y);
    }

    public resetRange() {
        let arnchor = this.range_node.getComponent(UITransform).anchorPoint;
        let size = this.range_node.getComponent(UITransform).contentSize;
        let self_size = this.node.getComponent(UITransform).contentSize;
        this._rangeSize.leftX = -size.width / 2 + self_size.width / 2;
        this._rangeSize.rightX = size.width / 2 - self_size.width / 2;
        this._rangeSize.topY = size.height * (1 - arnchor.y) - self_size.height / 2;
        this._rangeSize.bottomY = size.height * (0 - arnchor.y) + self_size.height / 2;
        // console.log("_rangeSize: ", this._rangeSize);
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        Tween.stopAllByTarget(this.node);
    }


    private onTouchStart() {
        this._touchStarPos = v3(this.node.position.x, this.node.position.y);
        tween(this.node)
            .to(0.1, { scale: v3(0.9, 0.9, 1) })
            .start()
    }
    private onTouchMove(t: EventTouch) {
        // let pos_touch = t.getUILocation();
        // let pos_node = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(v3(pos_touch.x, pos_touch.y));
        let delta = t.getUIDelta();
        let pos_node = v3(this.node.position.x + delta.x, this.node.position.y + delta.y);
        // console.log('pos_node: ', pos_node);
        if (pos_node.x < this._rangeSize.leftX) pos_node.x = this._rangeSize.leftX;
        if (pos_node.x > this._rangeSize.rightX) pos_node.x = this._rangeSize.rightX;
        if (pos_node.y < this._rangeSize.bottomY) pos_node.y = this._rangeSize.bottomY;
        if (pos_node.y > this._rangeSize.topY) pos_node.y = this._rangeSize.topY;
        this.node.setPosition(pos_node);
    }

    private onTouchEnd() {
        tween(this.node)
            .to(0.1, { scale: v3(1, 1, 1) })
            .start()
        this._touchEndPos = v3(this.node.position.x, this.node.position.y);
        let move_distance = this._touchEndPos.subtract(this._touchStarPos).lengthSqr();
        if (move_distance < 100) {
            this.clickCall && this.clickCall();
        } else {
            this.dragCall && this.dragCall();
        }
    }

    public backStartPos() {
        this.node.setPosition(this._startPos);
    }
}


