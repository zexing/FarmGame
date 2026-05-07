import { find, Layers, Node, Widget } from "cc";
import { SingletonManager } from "../base/SingletonManager";
import { BaseUI } from "../ui/base/BaseUI";
import { LayerUI } from "../ui/base/LayerUI";
import { LayerType, UIConfigData, UIID, ViewParams } from "../ui/base/UIConfig";

/**
 * UI管理器
 * 使用统一的单例模式管理
 */
export class UIManager extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): UIManager {
        return UIManager.getInstance<UIManager>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        UIManager.destroyInstance();
    }

    /**
     * ui 根节点
     */
    private _rootUI!: Node;

    public get rootUI(): Node {
        return this._rootUI;
    }

    //UI相关分层
    private _ui: LayerUI;

    /**
     * 当前UI层是否存在全面屏界面
     * @returns 
     */
    public haveFullScreen(): boolean {
        if (this._ui) {
            const children = this._ui.children;
            if (children) {
                let baseUI: BaseUI;
                for (let i = 0; i < children.length; i++) {
                    baseUI = children[i].getComponent(BaseUI);
                    if (baseUI && baseUI.isFullScreen) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // //主UI相关分层
    // private _mainUI: LayerUI;

    //弹窗UI相关分层
    private _popupUI: LayerUI;


    private _curPopupId: number = 0;//当前弹窗界面id
    private _waitPopupUIList: any[] = [];//等待弹出的弹窗id缓存列表


    //跑马灯相关分层
    private _marqueeUI: LayerUI;


    /**
     * 
     * @param UI 
     * @param Map 
     */
    public constructor() {
        super(); // 调用父类构造函数

        let canvas = find('Canvas');
        let rootUI = canvas.getChildByName("UIRoot");
        if (!rootUI) {
            rootUI = new Node("UIRoot");
            rootUI.layer = Layers.Enum.UI_2D;
            canvas.insertChild(rootUI, canvas.children.length + 1);
            let widget = rootUI.getComponent(Widget);
            if (!widget) {
                widget = rootUI.addComponent(Widget);
            }
            widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
            widget.left = widget.right = widget.top = widget.bottom = 0;
            widget.alignMode = 2;
            widget.updateAlignment();
        }
        this._rootUI = rootUI;
        let indexUI = rootUI.children.length;//在父节点排序Index

        //UI分层
        let layerUI = rootUI.getChildByName(LayerType.UI) as LayerUI;
        if (!layerUI) {
            this._ui = new LayerUI(LayerType.UI);
            this._ui.layer = Layers.Enum.UI_2D;
            rootUI.insertChild(this._ui, indexUI - 1);
            this._ui.setPosition(0, 0);
            indexUI++;
        } else {
            this._ui = layerUI;
        }

        //弹出层
        layerUI = rootUI.getChildByName(LayerType.PopupUI) as LayerUI;
        if (!layerUI) {
            this._popupUI = new LayerUI(LayerType.PopupUI);
            this._popupUI.layer = Layers.Enum.UI_2D;
            rootUI.insertChild(this._popupUI, indexUI);
            this._popupUI.setPosition(0, 0);
            indexUI++;
        } else {
            this._popupUI = layerUI;
        }

        //跑马灯层
        layerUI = rootUI.getChildByName(LayerType.MarqueeUI) as LayerUI;
        if (!layerUI) {
            this._marqueeUI = new LayerUI(LayerType.MarqueeUI);
            this._marqueeUI.layer = Layers.Enum.UI_2D;
            rootUI.insertChild(this._marqueeUI, indexUI);
            this._marqueeUI.setPosition(0, 0);
            indexUI++;
        } else {
            this._marqueeUI = layerUI;
        }
    }


    public addViewUI(view: Node) {
        this._ui.addChild(view);
    }
    /**
     * 打开界面
     * @param uiId 
     * @param uiArgs 
     * @param callbacks 
     */
    public openView(uiId: number, uiArgs: any = null, callbacks?: Function) {
        var config = UIConfigData[uiId];
        if (config) {
            config.viewId = uiId;
            switch (config.layer) {
                case LayerType.UI://UI层
                    if (this._ui) {
                        this._ui.add(config, uiArgs, callbacks);
                    }
                    break;
                case LayerType.PopupUI://弹窗层
                    if (this._popupUI) {
                        if (config.onlyPop) {//唯一弹窗，特殊处理
                            if (this._curPopupId > 0) {
                                if (this.getViewIsOpen(uiId) || this.getViewOpening(uiId)) {
                                    return;//弹窗已打开
                                }
                                for (let i = 0; i < this._waitPopupUIList.length; i++) {
                                    if (this._waitPopupUIList[i].uiId == uiId) {
                                        return;//弹窗已在队列中
                                    }
                                }
                                this._waitPopupUIList.push({ uiId: uiId, uiArgs: uiArgs, callbacks: callbacks });
                                return;//将弹窗存入队列中
                            }
                        }
                        this._popupUI.add(config, uiArgs, callbacks);
                        if (!config.onlyUnPop) {
                            this._curPopupId = uiId;
                        }
                    }
                    break;
                case LayerType.MarqueeUI://跑马灯层
                    if (this._marqueeUI) {
                        this._marqueeUI.add(config, uiArgs, callbacks);
                    }
                    break;
            }
            return true;
        } else {
            console.warn('打开界面配置信息不存！编号：' + uiId);
        }
    }
    public closeView(uiId: number) {
        var config = UIConfigData[uiId];
        if (config) {
            switch (config.layer) {
                case LayerType.UI://UI层
                    this._ui.remove(config.prefab, config.layer);
                    break;
                case LayerType.PopupUI://弹窗层
                    this._popupUI.remove(config.prefab, config.layer);
                    let isHasPop = false;
                    this._popupUI.popup_ui_nodes.forEach((value: ViewParams, key) => {
                        if (value.valid && !value.onlyUnPop) {
                            isHasPop = true;
                            return;
                        }
                    })
                    if (!isHasPop) {
                        if (!config.onlyUnPop) {
                            this._curPopupId = 0;
                            if (this._waitPopupUIList.length) {
                                let data = this._waitPopupUIList.shift();
                                this.openView(data.uiId, data.uiArgs, data.callbacks);
                            }
                        }
                    }
                    break;
                case LayerType.MarqueeUI:
                    this._marqueeUI.remove(config.prefab, config.layer);
                    break;
            }
        } else {
            console.warn('删除界面配置信息不存！编号：' + uiId);
        }
    }

    /**
     * 
     * @param uiId 获取某个界面是否打开
     * @returns 
     */
    public getViewIsOpen(uiId: number) {
        var config = UIConfigData[uiId];
        var uuid = '';
        var viewParams: ViewParams;
        if (config) {
            if (config.layer == LayerType.UI) {
                uuid = this._ui.getUuid(config.prefab);
                viewParams = this._ui.ui_nodes.get(uuid);
                if (viewParams && viewParams.valid) {
                    //重复加载
                    return true;
                }
            } else if (config.layer == LayerType.PopupUI) {
                uuid = this._popupUI.getUuid(config.prefab);
                viewParams = this._popupUI.popup_ui_nodes.get(uuid);
                if (viewParams && viewParams.valid) {
                    //重复加载
                    return true;
                }
            } else if (config.layer == LayerType.MarqueeUI) {
                uuid = this._marqueeUI.getUuid(config.prefab);
                viewParams = this._marqueeUI.marquee_ui_nodes.get(uuid);
                if (viewParams && viewParams.valid) {
                    //重复加载
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param uiId 获取某个界面是否正在打开
     * @returns 
     */
    public getViewOpening(uiId: number) {
        var config = UIConfigData[uiId];
        var uuid = '';
        var viewParams: ViewParams;
        if (config) {
            if (config.layer == LayerType.UI) {
                uuid = this._ui.getUuid(config.prefab);
                viewParams = this._ui.ui_nodes.get(uuid);
                if (viewParams && (viewParams.valid || viewParams.opening)) {
                    //重复加载
                    return true;
                }
            } else if (config.layer == LayerType.PopupUI) {
                uuid = this._popupUI.getUuid(config.prefab);
                viewParams = this._popupUI.popup_ui_nodes.get(uuid);
                if (viewParams && (viewParams.valid || viewParams.opening)) {
                    //重复加载
                    return true;
                }
            } else if (config.layer == LayerType.MarqueeUI) {
                uuid = this._marqueeUI.getUuid(config.prefab);
                viewParams = this._marqueeUI.marquee_ui_nodes.get(uuid);
                if (viewParams && (viewParams.valid || viewParams.opening)) {
                    //重复加载
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param uiId 获取某个界面所属层类型
     * @returns 
     */
    public getViewLayerType(uiId: number) {
        var config = UIConfigData[uiId];
        if (config) {
            return config.layer;
        }
        return -1;
    }
    //获取UI打开的数量
    public getUiShowNum() {
        if (this._ui.children) {
            return this._ui.children.length;
        }
        return 0;

    }
    //获取PopUI打开的数量
    public getPopUiShowNum() {
        if (this._popupUI.children) {
            return this._popupUI.children.length;
        }
        return 0;

    }

    //是否没有打开的界面
    public getAllUiShowNum() {
        return this.getUiShowNum() == 0 && this.getPopUiShowNum() == 0;
    }

    //清除所有UI界面
    public clearUIAllView() {
        this._ui.clearLayerAllChild(LayerType.UI);
    }

    //清楚所有除指定UI的UI界面
    public removeAllUIExclude(UIs: UIID[] = []) {
        this._ui.removeLayerAllChild(LayerType.UI, UIs);
    }

    //清楚所有除指定UI的弹窗界面
    public removeAllPopupUIExclude(UIs: UIID[] = []) {
        this._popupUI.removeLayerAllChild(LayerType.PopupUI, UIs);
    }

    /**
     * 清理
     */
    public clear(destroy: boolean = true) {
        //这里掉用ui 里面会清楚所有UI的
        this._ui.clearAllLayer();
        // this._mainUI.clearAllLayer();
        this._popupUI.clearAllLayer();
        this._marqueeUI.clearAllLayer();
        if (destroy) {
            this._rootUI?.destroy();
            this._rootUI = null;
        }
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear(true);
        console.log('[UIManager] All UI cleared');
    }
}