import { _decorator, CCInteger, Component, EventTouch, Node, ScrollView, UITransform, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

const delta_multiply = (800 / 13);

@ccclass('CommonBarTouch')
export class CommonBarTouch extends Component {

    @property({ type: CCInteger, tooltip: '灵敏度' })
    sensitivity: number = 750;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    bar: Node = null;

    @property(Node)
    auto_scroll_top: Node = null;
    @property(Node)
    auto_scroll_bottom: Node = null;

    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);

        this.auto_scroll_top?.on(Node.EventType.TOUCH_START, this._onTouchScrollToTopStart, this);
        this.auto_scroll_top?.on(Node.EventType.TOUCH_END, this._onTouchScrollToTopEnd, this);
        this.auto_scroll_top?.on(Node.EventType.TOUCH_CANCEL, this._onTouchScrollToTopEnd, this);

        this.auto_scroll_bottom?.on(Node.EventType.TOUCH_START, this._onTouchScrollToBottomStart, this);
        this.auto_scroll_bottom?.on(Node.EventType.TOUCH_END, this._onTouchScrollToBottomEnd, this);
        this.auto_scroll_bottom?.on(Node.EventType.TOUCH_CANCEL, this._onTouchScrollToBottomEnd, this);

    }
    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);

        this.auto_scroll_top?.off(Node.EventType.TOUCH_START, this._onTouchScrollToTopStart, this);
        this.auto_scroll_top?.off(Node.EventType.TOUCH_END, this._onTouchScrollToTopEnd, this);
        this.auto_scroll_top?.off(Node.EventType.TOUCH_CANCEL, this._onTouchScrollToTopEnd, this);

        this.auto_scroll_bottom?.off(Node.EventType.TOUCH_START, this._onTouchScrollToBottomStart, this);
        this.auto_scroll_bottom?.off(Node.EventType.TOUCH_END, this._onTouchScrollToBottomEnd, this);
        this.auto_scroll_bottom?.off(Node.EventType.TOUCH_CANCEL, this._onTouchScrollToBottomEnd, this);
    }

    autoScroll(delta: number) {
        // const self_height = this.node.getComponent(UITransform).contentSize.height;
        // const bar_height = this.bar.getComponent(UITransform).contentSize.height;
        // const multiply = Math.round(self_height / bar_height);
        // console.log(multiply);

        if (delta > 0) {
            if (this.x < 1) {
                this.x = Math.min(1, this.x + delta / this.sensitivity);
                this.scrollView.scrollTo(v2(0, this.x));
            }
        } else {
            if (this.x > 0) {
                this.x = Math.max(0, this.x + delta / this.sensitivity);
                this.scrollView.scrollTo(v2(0, this.x));
            }
        }
    }


    _onTouchStart(event: EventTouch) {
        // this.scrollView.vertical = true;
        // console.log(event.getUILocation());

        // 根据点击位置计算初始滚动位置
        const touchPos = event.getUILocation();
        const worldToNodeTransform = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(touchPos.x, touchPos.y, 0));
        const nodeHeight = this.node.getComponent(UITransform).contentSize.height;

        // 将点击位置转换为滚动比例 (0-1)
        // 点击顶部时应该对应滚动到最上边(1)，点击底部时对应滚动到最下边(0)
        const rawValue = (worldToNodeTransform.y + nodeHeight / 2) / nodeHeight;
        this.x = Math.max(0, Math.min(1, rawValue));

        // 确保边界值的精确性
        if (this.x <= 0.01) this.x = 0;
        if (this.x >= 0.99) this.x = 1;

        // 立即设置滚动位置到点击的位置
        this.scrollView.scrollTo(v2(0, this.x));
    }

    x = 1;
    _onTouchMove(event: EventTouch) {
        this.scrollView.vertical = true;
        let delta = event.getDelta().y;//移动的距离
        // console.log(delta);
        this.autoScroll(delta);
    }

    _onTouchEnd(event: EventTouch) {
        // this.scrollView.vertical = false;
    }

    private _isAutoScrollToTop: boolean = false;
    private _onTouchScrollToTopStart() {
        this._isAutoScrollToTop = true;
        // this.scrollView.vertical = true;
    }
    private _onTouchScrollToTopEnd() {
        this._isAutoScrollToTop = false;
        // this.scrollView.vertical = false;
    }

    private _isAutoScrollToBottom: boolean = false;
    private _onTouchScrollToBottomStart() {
        this._isAutoScrollToBottom = true;
        // this.scrollView.vertical = true;
    }
    private _onTouchScrollToBottomEnd() {
        this._isAutoScrollToBottom = false;
        // this.scrollView.vertical = false;
    }

    protected update(dt: number): void {
        if (this._isAutoScrollToBottom) {
            this.autoScroll(-1);
        }

        if (this._isAutoScrollToTop) {
            this.autoScroll(1);
        }
    }

}


