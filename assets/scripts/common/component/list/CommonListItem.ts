import { _decorator, Component, NodeEventType } from 'cc';
import { ToolUtils } from '../../common_utils/ToolUtils';
const { ccclass, property } = _decorator;

@ccclass('CommonListItem')
export class CommonListItem extends Component {
    // @property({ type: Node, tooltip: "节点显示容器（用于遮罩等功能）" })
    // protected view: Node;

    @property
    public isPoolPrefab: boolean = false;//是否是对象池预制体

    protected _data: any;//item数据

    protected _initViewComplete: boolean = false;//界面是否初始化完毕（用于做界面初始化）
    protected _initDataComplete: boolean = false;//初始化数据完成（防止多次调用界面初始化）
    protected _isSelect: boolean = true;//当前是否为选中状态
    protected _itemIndex: number = -1;

    protected onLoad(): void {
        this._initViewComplete = true;
        this.initUI();
        if (this._initDataComplete) {
            this.updateView();
        }
    }

    protected onEnable(): void {
        ToolUtils.addEvents(this, this.addEvents);
    }

    protected onDisable(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
    }

    /**更新数据**/
    public updateData(index: number, d: any) {
        let isShow = !!d;
        this._itemIndex = index;
        this._data = d;
        this.node.active = isShow;
        this._initDataComplete = true;
        if (this._initViewComplete) {
            this.updateView();
        }
    }

    //添加监听
    protected addEvents() {
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnd, this);
    }

    //移除监听
    protected removeEvents() {
        this.node.off(NodeEventType.TOUCH_END, this._onTouchEnd, this);
    }

    //初始化界面
    protected initUI() {

    }

    //更新界面显示
    protected updateView() {

    }

    //更新选中状态显示
    protected updateSelect() {

    }

    //重置一些状态
    public resetState() {
        this.clearUI();
        this._itemIndex = -1;
        this._isSelect = false;
    }

    protected _onTouchEnd() {
        this.onTouchClick();
        this.node.emit("onTouchItem", this);
    }

    protected onTouchClick() {
    }

    /**设置是否为选中状态**/
    public set select(value: boolean) {
        // 跳过无状态转变时的更新
        if (this._isSelect == value) return;
        this._isSelect = value;
        this.updateSelect();
    }

    /**获取是否为选中状态**/
    public get select() {
        return this._isSelect;
    }

    /**获取在父节点子集中index值**/
    public get itemIndex() {
        return this._itemIndex;
    }

    /**设置在父节点子集中index值**/
    public set itemIndex(value) {
        this._itemIndex = value;
    }

    /**清除UI**/
    protected clearUI(): void {
    }

    protected onDestroy(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        this._data = null;
        this._initViewComplete = false;
        this._initDataComplete = false;
    }
}


