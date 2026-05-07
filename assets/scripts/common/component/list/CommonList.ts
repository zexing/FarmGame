import { _decorator, Component, Enum, instantiate, Node, Prefab, UITransform } from 'cc';
import { EDITOR } from 'cc/env';
import { PoolManager } from '../../manager/PoolManager';
import { CommonListItem } from './CommonListItem';
const { ccclass, property, executionOrder } = _decorator;

export enum ListType {
    ViewItem = 1,//界面item类型（主要用于item数量固定的list界面）
    PrefabItem = 2,//预制体item类型（主要用于item数量不固定的list界面）
}

export enum TaberType {
    SingleChoice = 1,//单选
    MultipleChoice = 2,//多选
    SingleChoiceCancel = 3,//单选可取消（点击当前选中变为取消选择）
    NoneChoice = 4,//不选择
}

/**
 * 通用list组件（基础）
 * **/
@ccclass('CommonList')
@executionOrder(-5000)
export class CommonList extends Component {
    @property({
        type: Enum(ListType),
        tooltip: "list界面类型，包括：\n1.ViewItem：界面item类型（主要用于item数量固定的list界面）\n2.PrefabItem：预制体item类型（主要用于item数量不固定的list界面）"
    })
    public listType: ListType = ListType.ViewItem;

    @property({ tooltip: "是否是对象池预制体", visible: function (this: CommonList) { return this.listType == ListType.PrefabItem; } })
    protected isPoolPrefab: boolean = false;//是否是对象池预制体

    @property({ type: Prefab, visible: function (this: CommonList) { return this.listType == ListType.PrefabItem; } })
    public set prefabNode(value: Prefab) {
        this.prefab = value;
        if (EDITOR) {
            let prefab = instantiate(this.prefab);
            if (prefab) {
                let itme = prefab.getComponent(CommonListItem);
                this.isPoolPrefab = itme.isPoolPrefab;
            }
        }
    }
    public get prefabNode() {
        return this.prefab;
    }

    @property({ type: Prefab, readonly: true, visible: function (this: CommonList) { return this.listType == ListType.PrefabItem; } })
    protected prefab: Prefab;

    @property({
        type: Enum(TaberType),
        tooltip: "item选择类型，包括：\n1.SingleChoice：单选\n2.MultipleChoice：多选"
    })
    public type: number = TaberType.SingleChoice;

    private _isVirtual: boolean = false;//是否添加虚拟列表
    @property({ tooltip: "添加虚拟列表组件" })
    public get isVirtual() {
        return this._isVirtual;
    }
    public set isVirtual(value) {
        this._isVirtual = value;
        if (this._isVirtual) {
            if (!this.node.getComponent("CommonVirtualList")) {
                this.node.addComponent("CommonVirtualList")["initEDITOR"]();
            }
        }
    }

    protected _virtualList: any//当前节点是否存在虚拟列表，如果存在需要处理显示数据

    protected _selectIndex: number = -1;//当前选择item序号
    protected _data: any[] = [];
    protected _itemList: CommonListItem[] = [];//子节点Item组件列表
    protected _prefabList: Node[] = [];//子节点列表

    protected onLoad(): void {
        this._virtualList = this.node.getComponent("CommonVirtualList");
    }

    protected onEnable(): void {
        if (this.listType == ListType.ViewItem) {
            this._itemList = [];
            let index = 0;
            let children = this.node.children;
            let item: CommonListItem;
            for (let i = 0; i < children.length; i++) {
                item = children[i].getComponent(CommonListItem);
                if (item) {
                    children[i].on("onTouchItem", this.onTouchItem, this);
                    item.itemIndex = index++;
                    this._itemList.push(item);
                }
            }
            //赋值之后才显示，需要重新刷新一次界面，防止显示错误
            if (this._data && this._data.length > 0) {
                this.updateView();
            }
        } else if (this.listType == ListType.PrefabItem) {
            for (let i = 0; i < this._itemList.length; i++) {
                this._itemList[i].node?.on("onTouchItem", this.onTouchItem, this);
            }
        }
    }

    protected onDisable(): void {
        for (let i = 0; i < this._itemList.length; i++) {
            this._itemList[i].node?.off("onTouchItem", this.onTouchItem, this);
        }
    }


    /**更新数据**/
    public updateData(d: any[], selectIndex = 0) {
        this._selectIndex = selectIndex;
        this._data = d;
        if (this._data) {
            if (this._virtualList) {
                this._virtualList.updateView(this._data.length);
            } else {
                this.updateView();
            }
        }

    }

    //刷新界面显示
    public updateView() {
        if (this._data) {
            let dataIndex = 0;
            let i = 0;
            let len = this._data.length;
            if (this._virtualList) {
                let data = this._virtualList.getItemShow();
                dataIndex = data[0];
                len = data[1];
                this.updateItemsSiblingIndex(dataIndex, dataIndex + len - 1);
            }
            if (this.listType == ListType.ViewItem) {
                for (i = 0; i < len; i++) {
                    if (this._itemList[i]) {
                        this._itemList[i].updateData(dataIndex + i, this._data[dataIndex + i]);
                        if (this.type == TaberType.SingleChoice || this.type == TaberType.SingleChoiceCancel) {
                            this._itemList[i].select = dataIndex + i == this._selectIndex;
                        }
                    }
                }
            } else if (this.listType == ListType.PrefabItem) {
                for (i = 0; i < len; i++) {
                    if (!this._itemList[i] && this.prefab) {
                        let prefab = this.getPrefabNode();
                        this._itemList[i] = prefab.getComponent(CommonListItem);
                    }
                    this._itemList[i].updateData(dataIndex + i, this._data[dataIndex + i]);
                    if (this.type == TaberType.SingleChoice || this.type == TaberType.SingleChoiceCancel) {
                        this._itemList[i].select = dataIndex + i == this._selectIndex;
                    }
                }
            }
            for (i; i < this._itemList.length; i++) {
                this._itemList[i].updateData(-1, null);
                this._itemList[i].select = false;
            }
        }
    }

    //调整列表中子集层级
    private updateItemsSiblingIndex(startIndex: number, endIndex: number) {
        let isChange = false;//是否进行子集层级变化
        let itemLen = this._itemList.length;
        for (let i = 0; i < itemLen; i++) {
            if (this._itemList[i].itemIndex < startIndex) {
                this._itemList[i].node.setSiblingIndex(itemLen - 1);
                isChange = true;
            } else if (this._itemList[i].itemIndex > endIndex) {
                this._itemList[i].node.setSiblingIndex(0);
                isChange = true;
            }
        }
        if (isChange) {
            this._itemList = [];
            let children = this.node.children;
            let item: CommonListItem;
            for (let i = 0; i < children.length; i++) {
                item = children[i].getComponent(CommonListItem);
                if (item) {
                    this._itemList.push(item);
                }
            }
        }
    }

    /**
     * 定位跳转指定位置
     * index: 位置index值
     * data: 跳转方式 => isTween:是否缓动形式;tweenStartPos 开始位置;tweenSpeed 速度;callBlack:回调函数;offsetNum:偏移量
     * **/
    public onShowMoveIndex(index: number, data: { isTween?: boolean, tweenStartPos?: number, tweenSpeed?: number, callBack?: Function, offsetNum?: number } = null) {
        if (this._virtualList) {
            this._virtualList.onShowMoveIndex(index, data);
        }
    }

    /**清除所有子节点(仅移除显示)**/
    public removeAllItem() {
        for (let i = 0; i < this._itemList.length; i++) {
            this._itemList[i].node?.off("onTouchItem", this.onTouchItem, this);
            this._itemList[i].resetState();
            this._itemList[i] = null;
        }
        this._itemList = [];

        if (this.listType == ListType.ViewItem) {
        } else if (this.listType == ListType.PrefabItem) {
            if (this.isPoolPrefab) {
                for (let i = this._prefabList.length - 1; i >= 0; i--) {
                    PoolManager.instance.putNode(this._prefabList[i]);
                    this._prefabList[i] = null;
                }
            } else {
                // this.node.removeAllChildren();
                for (let i = this._prefabList.length - 1; i >= 0; i--) {
                    this._prefabList[i].parent = null;
                }
            }
            this._prefabList = [];
        }
    }

    /**获取指定index子节点Item**/
    public getItemByIndex(index: number) {
        for (let i = 0; i < this._itemList.length; i++) {
            if (this._itemList[i].itemIndex == index) {
                return this._itemList[i];
            }
        }
        return null;
    }

    //更新指定子节点选中状态
    private updateItemSelect(index: number) {
        for (let i = 0; i < this._itemList.length; i++) {
            this._itemList[i].select = this._itemList[i].itemIndex == index;
        }
    }

    /**获取子节点尺寸（主要用于布局）**/
    public getItemSize() {
        if (!this._itemList[0]) {
            if (this.listType == ListType.PrefabItem && this.prefab) {
                let prefab = this.getPrefabNode();
                this._itemList[0] = prefab.getComponent(CommonListItem);
            }
        }
        let uiTransform = this._itemList[0].getComponent(UITransform);
        return { width: uiTransform.width, height: uiTransform.height };
    }

    //子集item点击
    private onTouchItem(e) {
        let index = this._itemList.indexOf(e);
        if (index >= 0) {
            this.selectIndex = e.itemIndex;
        }
    }

    /**获取指定index数据**/
    public getItemDataByIndex(index: number) {
        return this._data[index];
    }

    /**获取容器距离顶部距离**/
    public getContentToTop() {
        if (this._virtualList) {
            return this._virtualList.getContentToTop();
        }
        return 0;
    }

    /**获取容器距离顶部距离**/
    public getContentToBottom() {
        if (this._virtualList) {
            return this._virtualList.getContentToBottom();
        }
        return 0;
    }

    //获取是否可以滚动
    public getISCanScroll() {
        if (this._virtualList) {
            return this._virtualList.getISCanScroll();
        }
        return false;
    }

    /**获取列表数据**/
    public get dataList() {
        return this._data;
    }

    /**获取当前所有子界面Item组件数据**/
    public get itemList() {
        return this._itemList;
    }

    /**设置当前选择item序号**/
    public set selectIndex(value: number) {
        if (this.type == TaberType.NoneChoice) {
            return;
        }
        if (this.type == TaberType.SingleChoice) {
            this.updateItemSelect(value);
        } else if (this.type == TaberType.MultipleChoice) {
            let item = this.getItemByIndex(value);
            if (item) {
                item.select = !item.select;
            }
        } else if (this.type == TaberType.SingleChoiceCancel) {
            if (this._selectIndex == value) {
                value = -1;
            }
            this.updateItemSelect(value);
        }
        this._selectIndex = value;
        if (this.clickCallBack) {
            if (this._data) {
                this.clickCallBack(this._data[value], this.getItemByIndex(value));
            } else {
                this.clickCallBack();
            }
        }
    }

    /**获取当前选择item序号**/
    public get selectIndex() {
        return this._selectIndex;
    }

    /**获取当前子节点Item**/
    public get selectItem() {
        if (this._virtualList) {
            for (let i = 0; i < this.itemList.length; i++) {
                if (this.itemList[i].itemIndex == this._selectIndex) {
                    return this.itemList[i];
                }
            }
        }
        return this.itemList[this._selectIndex];
    }

    /**获取当前子节点Item**/
    public get selectItemData() {
        if (!this._data) {
            return null;
        }
        return this._data[this._selectIndex];
    }

    //将预制体转化为节点
    protected getPrefabNode() {
        let prefab;
        if (this.isPoolPrefab) {
            prefab = PoolManager.instance.getNode(this.prefab);
        } else {
            prefab = instantiate(this.prefab);
        }
        prefab.on("onTouchItem", this.onTouchItem, this);
        prefab.setPosition(0, 0);
        this._prefabList.push(prefab);
        this.node.addChild(prefab);
        return prefab;
    }

    private clickCallBack: Function = null;
    public setClickCallBack(callBackFun: Function) {
        this.clickCallBack = callBackFun;
    }
    public clearClickCallBack() {
        this.clickCallBack = null;
    }

    /**清除数据**/
    public clearData() {
        this._data.length = 0;
        this._selectIndex = -1;
    }

    /**清除界面--子列表显示，数据**/
    public clearUI() {
        this.removeAllItem();
        this._data = [];
        this._selectIndex = -1;
        this.clickCallBack = null;
    }

    protected onDestroy(): void {
        this._prefabList = null;
        this._itemList = null;
        this._data = null;
        this.clickCallBack = null;
        this._virtualList = null;
        // this.prefab = null;
    }
}