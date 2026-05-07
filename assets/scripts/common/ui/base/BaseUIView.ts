import { _decorator, Component, Enum, Node, NodeEventType, Widget } from 'cc';
import { ToolUtils } from '../../common_utils/ToolUtils';
import { UIManager } from '../../manager/UIManager';
import { SwitchingEffectComponentsList } from '../effect/SwitchingEffectComponentsList';
import { InfoViewSwitch } from './InfoViewSwitch';
import { UIID } from './UIConfig';
const { ccclass, property } = _decorator;

@ccclass('BaseUIVew')
export class BaseUIView extends Component {
    // @property({ type: Node, tooltip: "界面根节点，空时为父节点" })
    private rootNode: Node;//界面根节点，空时为父节点

    // @property({ type: Node, tooltip: "尺寸节点，用于不同端界面缩放" })
    // private sizeNode: Node;//尺寸节点，用于不同端界面缩放

    // @property({ type: Node, tooltip: "覆盖节点，用于界面上层" })
    // private coverNode: Node;//覆盖节点，用于界面上层

    @property({ type: Node })
    public btnClose: Node;//关闭按钮

    @property({ type: Node })
    public maskClose: Node;//关闭遮罩（用于点击关闭）

    @property({ type: SwitchingEffectComponentsList, tooltip: "打开/关闭界面播放动画" })
    public switchingEffList: SwitchingEffectComponentsList;//打开/关闭界面播放动画

    @property({ type: InfoViewSwitch, tooltip: "子界面切换控制类" })
    public infoViewSwitch: InfoViewSwitch;

    // @property({ type: CommonResListView, tooltip: "资源列表" })
    // public resListView: CommonResListView;

    @property({ type: Enum(UIID), tooltip: "界面id" })
    public viewId: UIID = UIID.NONE;//界面id

    public parentId: number = 0;//返回上级界面id
    public parentObj: any = null;

    protected onEnable(): void {
        ToolUtils.addEvents(this, this.addEvents);
        if (!this.rootNode) {
            this.rootNode = this.node.parent;
        }
        if (this.switchingEffList) {
            this.switchingEffList.initList(this.rootNode);
        }
    }

    protected onDisable(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        if (this.switchingEffList) {
            this.switchingEffList.initList(null);
        }
        this.parentId = 0;
        this.parentObj = null;
    }

    private addEvents() {
        if (this.btnClose) {
            this.btnClose.on(NodeEventType.TOUCH_END, this.closeUIView, this);
        }
        if (this.maskClose) {
            this.maskClose.on(NodeEventType.TOUCH_END, this.onTouchMask, this);
        }
    }

    private removeEvents() {
        if (this.btnClose) {
            this.btnClose.off(NodeEventType.TOUCH_END, this.closeUIView, this);
        }
        if (this.maskClose) {
            this.maskClose.off(NodeEventType.TOUCH_END, this.onTouchMask, this);
        }
    }

    //初始化界面列表数据
    // public initTabData(tabData: CommonTaberItemData[], viewData: any, call: Function = null) {
    //     if (this.infoViewSwitch) {
    //         this.infoViewSwitch.initTaber(tabData, call);
    //         this.infoViewSwitch.updateData(viewData);
    //     }
    // }

    public showView() {
        if (this.infoViewSwitch) {
            this.infoViewSwitch.showView();
        }
        // if (this.resListView) {
        //     this.resListView.showView();
        // }
        // 2025.11.1 修正：移除延迟，立即播放动画避免闪屏
        // 之前的延迟会导致节点先在原始位置显示一帧，然后跳到偏移位置再开始动画
        if (this.switchingEffList && this.rootNode) {
            this.switchingEffList.initList(this.rootNode);
        }
        this.onSwitchingIn();
        this.updateWidgets();
    }

    public hideView() {
        if (this.infoViewSwitch) {
            // this.infoViewSwitch.selectIndex = -1;
            this.infoViewSwitch.hideView();
        }
        // if (this.resListView) {
        //     this.resListView.hideView();
        // }
    }

    /**更新界面数据**/
    public updateView(data: any) {
        if (this.infoViewSwitch) {
            this.infoViewSwitch.updateData(data);
            this.infoViewSwitch.showView();
        }
    }

    /**切换tab**/
    public onTabSelect(index: number) {
        if (this.infoViewSwitch) {
            this.infoViewSwitch.selectIndex = index;
        }
    }

    /**更新资源列表显示**/
    public updateResList(arr: number[]) {
        // if (this.resListView) {
        //     this.resListView.updateData(arr);
        // }
    }

    /**播放进入动画**/
    public onSwitchingIn() {
        if (this.isValid && this.infoViewSwitch) {
            this.infoViewSwitch.updateScrollToPercent();
        }
        if (this.switchingEffList) {
            this.switchingEffList.onPlaySwitchingIn();
        }
    }

    /**播放进入动画结束**/
    public onSwitchingInEnd() {
        // this.updateWidgets();
        // if (this.isValid && this.infoViewSwitch) {
        //     this.infoViewSwitch.updateScrollToPercent();
        // }

    }

    /**播放退出动画**/
    public onSwitchingOut() {
        if (this.switchingEffList) {
            this.switchingEffList.onPlaySwitchingOut();
        } else {
            this.onSwitchingOutEnd();
        }
    }

    /**播放退出动画结束**/
    public onSwitchingOutEnd() {
        if (this.parentId && this.parentId != this.viewId) {
            UIManager.instance.openView(this.parentId, this.parentObj);
        }
        UIManager.instance.closeView(this.viewId);
    }

    //更新界面中适配组件，防止缩放过程中产生错误数据
    private updateWidgets() {
        if (this.rootNode) {
            let widgets = this.rootNode.getComponentsInChildren(Widget);
            for (let i = 0; i < widgets.length; i++) {
                widgets[i].updateAlignment();
            }
        }
    }

    //点击遮罩
    private onTouchMask() {
        // AudioManager.instance.playEffect(GameDefine.GameSound.click_btn);
        this.closeUIView();
    }

    /**关闭界面**/
    public closeUIView() {
        // AudioManager.instance.playEffect(GameDefine.GameSound.click_btn);
        this.onSwitchingOut();
    }

    protected onDestroy(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        this.rootNode = null;
    }
}


