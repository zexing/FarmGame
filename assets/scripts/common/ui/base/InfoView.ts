import { _decorator, Component, Widget } from 'cc';
import { ToolUtils } from '../../common_utils/ToolUtils';
const { ccclass, property } = _decorator;

/**
 * 子界面基类
 * **/
@ccclass('InfoView')
export class InfoView extends Component {
    protected _initViewComplete: boolean = false;//界面是否初始化完毕（用于做界面初始化）
    protected _initDataComplete: boolean = false;//初始化数据完成（防止多次调用界面初始化）

    public resList: number[] = [];//资源显示id列表

    protected _data: any;//初始化界面时传入数据

    /**节点初始化完成--子类禁止调用，使用initUI**/
    protected onLoad(): void {
        this._initViewComplete = true;
        this.initUI();
        if (this._initDataComplete) {
            this.showView();
        }
    }

    /**节点激活--子类禁止调用，使用showView**/
    protected onEnable(): void {
        ToolUtils.addEvents(this, this.addEvents);
    }

    /**节点禁用--子类禁止调用，使用hideView**/
    protected onDisable(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
    }

    /**更新数据--子类禁止调用，使用showView**/
    public updateData(d?: any) {
        this._data = d;
        this._initDataComplete = true;
        if (this._initViewComplete) {
            this.showView();
        }
    }

    //初始化界面--用于初始化完成时一次性显示
    protected initUI() {

    }

    //添加监听
    protected addEvents() {
    }

    //移除监听
    protected removeEvents() {
    }

    //显示界面--节点激活时处理逻辑
    public showView() {
    }

    //隐藏界面--节点禁用时处理逻辑
    public hideView() {
    }

    //更新界面中适配组件，防止缩放过程中产生错误数据
    protected updateWidgets() {
        let widgets = this.node.getComponentsInChildren(Widget);
        for (let i = 0; i < widgets.length; i++) {
            widgets[i].updateAlignment();
        }
    }

    protected onDestroy(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        // this._initViewComplete = false;
        // this._initDataComplete = false;
        this._data = null;
    }
}


