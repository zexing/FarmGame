import { _decorator, Component, Enum, instantiate, Node, Prefab, ScrollView } from 'cc';
import { CommonList } from '../../component/list/CommonList';
import { BundleManager } from '../../manager/BundleManager';
import { Res } from '../../manager/Res';
import { InfoView } from './InfoView';
const { ccclass, property } = _decorator;

export enum InfoType {
    ViewInfo = 1,//界面子界面类型（主要用于固定显示界面）
    PrefabInfo = 2,//预制体子界面类型（主要用于动态创造界面）
}

/**
 * 子界面切换控制类
 * **/
@ccclass('InfoViewSwitch')
export class InfoViewSwitch extends Component {
    @property({ type: CommonList, tooltip: "切换按钮列表" })
    private btnTaber: CommonList;

    @property({ type: ScrollView, tooltip: "切换按钮列表" })
    private scrollView: ScrollView;

    @property({ type: Enum(InfoType), tooltip: "子界面类型" })
    private infoType: InfoType = InfoType.ViewInfo;

    @property({ type: [InfoView], tooltip: "子界面列表", visible: function (this: InfoViewSwitch) { return this.infoType == InfoType.ViewInfo; } })
    private infoViewList: InfoView[] = [];

    @property({ type: Node, tooltip: "子界面容器", visible: function (this: InfoViewSwitch) { return this.infoType == InfoType.PrefabInfo; } })
    private view: Node;

    private _currInfoView: Node;        //当前子界面节点

    public callFunc: Function;//切换回调


    @property({ tooltip: "初始化定位长度" })
    protected isInitPosSize: number = 0;

    private isPositioning = false;

    private _currViewId: number = -1;   //当前界面id
    private _viewData: any;//当前所选界面数据
    private viewPreData: any = {};      //界面预制体

    public initTaber(tabData: any[], call: Function = null) {
        this.btnTaber.updateData(tabData);
        this.btnTaber.setClickCallBack(this.onBtnTaber.bind(this));
        this.callFunc = call;

        if (this.isInitPosSize && tabData.length > this.isInitPosSize) {
            this.isPositioning = true;
        }
    }

    public updateData(data: any) {
        this._viewData = data;
    }

    public showView() {
        this.updateView();
    }

    public hideView() {
        if (this.infoType == InfoType.ViewInfo) {
            let infoView: InfoView;
            for (let i = 0; i < this.infoViewList.length; i++) {
                infoView = this.infoViewList[i];
                if (!infoView) {
                    continue;
                }
                infoView.hideView();
            }
        } else {
            let infoView: InfoView;
            for (let i in this.viewPreData) {
                infoView = this.viewPreData[i].getComponent(InfoView);
                if (infoView) {
                    infoView.hideView();
                }
                this.viewPreData[i].parent = null;
            }
        }
        if (this.btnTaber) {
            this.btnTaber.clearUI();
        }
        this.isPositioning = false;
        this._currViewId = -1;
        this._viewData = null;
    }

    private updateView() {
        if (this.infoType == InfoType.ViewInfo) {
            let selectIndex = this.btnTaber.selectIndex;
            let infoView: InfoView;
            for (let i = 0; i < this.infoViewList.length; i++) {
                infoView = this.infoViewList[i];
                if (!infoView) {
                    continue;
                }
                if (selectIndex == i) {
                    infoView.node.active = true;
                    infoView.updateData(this._viewData);
                } else {
                    infoView.node.active = false;
                }
            }
            if (this.callFunc) {
                this.callFunc();
            }
        } else {
            this.updateInfoSwitch();
        }
    }

    //点击子界面切换
    private onBtnTaber(data: any) {
        if (!data) {
            return;
        }
        this.updateView();
    }

    //更新子界面切换
    private updateInfoSwitch() {
        let data = this.btnTaber.selectItemData;
        let id = data.id;
        if (id == this._currViewId) {
            this.updateCurrInfo();
            return;
        }
        let infoView: InfoView;
        this._currViewId = id;
        if (this._currInfoView) {
            infoView = this._currInfoView.getComponent(InfoView);
            if (infoView) {
                infoView.hideView();
            }
            this._currInfoView.active = false;
            this._currInfoView = null;
        }
        let res = data.prefabs;
        if (this.viewPreData[res]) {
            this._currInfoView = this.viewPreData[res];
            this._currInfoView.active = true;
            this.updateCurrInfo();
        } else {
            if (res != "") {
                Res.load(BundleManager.bundleName, res)
                    .then((prefab: Prefab) => {
                        if (!this.isValid) {
                            return;
                        }
                        if (!this.view) {
                            return;
                        }
                        if (this._currViewId == -1 || id != this._currViewId) {
                            return;
                        }
                        if (this.viewPreData[res]) {
                            return;
                        }
                        let modelPre = instantiate(prefab);
                        this.view.addChild(modelPre);
                        this.viewPreData[res] = modelPre;
                        this._currInfoView = modelPre;
                        this.updateCurrInfo();
                        if (this.callFunc) {
                            this.callFunc();
                        }
                    })
                    .catch(err => {
                        console.log("加载预制体失败", err);
                    })
            }
        }
        if (this.callFunc) {
            this.callFunc();
        }
    }

    //更新当前子界面
    private updateCurrInfo() {
        if (this._currInfoView) {
            let infoView = this._currInfoView.getComponent(InfoView);
            if (infoView) {
                let data = this.btnTaber.selectItemData;
                let updateData = this._viewData;
                if (data.updateData) {
                    updateData = data.updateData;
                }
                infoView.updateData(updateData);
            }
        }
    }

    /**更新tab列表位置**/
    public updateScrollToPercent() {
        if (this.isValid && this.scrollView) {
            if (this.isPositioning) {
                this.scrollView.scrollToLeft();
            } else {
                this.scrollView.scrollToRight();
            }
        }
    }

    /**获取当前界面**/
    public getInfoView() {
        if (this._currInfoView) {
            return this._currInfoView.getComponent(InfoView);
        }
        return null;
    }

    /**获取当前界面index值**/
    public get selectIndex() {
        return this.btnTaber.selectIndex;
    }

    /**设置当前界面index值**/
    public set selectIndex(value: number) {
        this.btnTaber.selectIndex = value;
    }

    protected onDestroy(): void {
        if (this.btnTaber) {
            this.btnTaber.clearClickCallBack();
        }
        this._viewData = null;
        this.callFunc = null;
    }
}


