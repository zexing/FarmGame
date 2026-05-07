import { _decorator, instantiate, Node, Prefab, Widget } from 'cc';
import { GameDefine } from '../../../const/GameDefine';
import { BundleManager } from '../../manager/BundleManager';
import { Res } from '../../manager/Res';
import { LayerType, UIID, UIInfo, ViewParams } from './UIConfig';
const { ccclass, property } = _decorator;

@ccclass('LayerUI')
export class LayerUI extends Node {
    /** 界面节点集合 */
    public ui_nodes = new Map<string, ViewParams>();

    /** 弹窗节点集合 */
    public popup_ui_nodes = new Map<string, ViewParams>();

    /**跑马灯层节点集合 */
    public marquee_ui_nodes = new Map<string, ViewParams>();

    constructor(name: string) {
        super(name);
        var widget: Widget = this.getComponent(Widget);
        if (!widget) {
            widget = this.addComponent(Widget);
        }
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;
        widget.alignMode = 2;
        widget.enabled = true;
        widget.updateAlignment();
    }
    /** 构造一个唯一标识UUID */
    public getUuid(prefabPath: string): string {
        var uuid = `${this.name}_${prefabPath}`;
        return uuid.replace(/\//g, "_");
    }
    public add(config: UIInfo, params?: any, callbacks?: Function) {
        let prefabPath = config.prefab;
        var uuid = this.getUuid(prefabPath);
        var viewParams: ViewParams = this.getViewParamByLayer(config.layer, uuid);
        if (viewParams && viewParams.valid) {
            viewParams.opening = false;
            //UI界面和主界面强制刷新（处理同一界面跳转）
            if (config.layer == LayerType.UI || 
                config.layer == LayerType.PopupUI || 
                config.layer == LayerType.MarqueeUI
            ) {
                this.applyComponentsFunction(viewParams.node, 'onAdded', params || {});
            }
            //重复加载
            return;
        }
        if (viewParams == null) {
            viewParams = new ViewParams();
            viewParams.uuid = uuid;
            viewParams.prefabPath = prefabPath;
            viewParams.layer = config.layer;
            viewParams.viewId = config.viewId;
            viewParams.onlyUnPop = config.onlyUnPop;
            viewParams.opening = true;
            let layer = this.getLayerMap(config.layer);
            if (layer) {
                layer.set(viewParams.uuid, viewParams);
            }
        }
        viewParams.params = params || {};
        viewParams.callbacks = callbacks || null;
        // viewParams.valid = true;
        this.load(viewParams)
        return uuid;

    }

    protected load(viewParams: ViewParams) {
        var vp: ViewParams = this.getViewParamByLayer(viewParams.layer, viewParams.uuid);
        if (vp && vp.node) {
            vp.opening = false;
            this.createNode(vp);
        } else {
            // resources.load(vp.prefabPath, (err: Error | null, res: Prefab) => {
            //     // console.log('界面URL' + res.uuid);
            //     vp.opening = false;
            //     if (!err) {
            //         if (!viewParams.valid) {
            //             let childNode: Node = instantiate(res);
            //             viewParams.node = childNode;
            //             this.createNode(viewParams);
            //         }
            //     }

            // })

            Res.load(BundleManager.bundleName, GameDefine.UIPrefabUrl + vp.prefabPath)
                .then((res: Prefab) => {
                    vp.opening = false;
                    if (!viewParams.valid) {
                        let childNode: Node = instantiate(res);
                        viewParams.node = childNode;
                        this.createNode(viewParams);
                    }
                })
                .catch(err => {
                    if (err) {
                        console.error(`加载【${vp.prefabPath}】 UI 资源出错, ${err}`);
                    }
                })
        }
    }

    //获取界面信息
    getViewParamByLayer(layer: LayerType, uuid: string) {
        var vp: ViewParams = null;
        let layerMap = this.getLayerMap(layer);
        if (layerMap) {
            vp = layerMap.get(uuid);
        }
        return vp;
    }

    protected applyComponentsFunction(node: Node, funName: string, params: any) {
        if (node && node.components) {
            for (let i = 0; i < node.components.length; i++) {
                let component: any = node.components[i];
                let func = component[funName];
                if (func) {
                    func.call(component, params);
                }
            }
        }
        // if (funName == 'onRemoved') {
        //     MessageManager.Instance.dispatchEvent(MainCityManager.GAME_CLOSE_VIEW);
        // }
    }
    /**
     * 
     * @param viewParams 创建界面
     */
    protected createNode(viewParams: ViewParams) {
        if (this._children && !viewParams.valid) {
            viewParams.valid = true;
            let childNode: Node | null = viewParams!.node!;
            childNode.parent = this;
            this.applyComponentsFunction(childNode, 'setViewId', viewParams.viewId);
            this.applyComponentsFunction(childNode, 'onAdded', viewParams.params);
            if (viewParams.callbacks) {
                viewParams.callbacks();
            }
        }
    }
    /**
     * 
     * @param prefabPath 移除界面
     */
    remove(prefabPath: string, layer: LayerType): void {
        this._removeLayerChild(this.getLayerMap(layer), prefabPath);
    }

    /**清除指定层所有界面并销毁数据存储(用于切换场景销毁)**/
    public clearLayerAllChild(layer: LayerType) {
        this._clearLayerAllChild(this.getLayerMap(layer));
    }

    /**移除指定层所有界面显示(用于层级界面清空显示)**/
    public removeLayerAllChild(layer: LayerType, UIs: UIID[] = []) {
        this._removeLayerAllChild(this.getLayerMap(layer));
    }

    /**清除所有层子对象**/
    public clearAllLayer() {
        this._clearLayerAllChild(this.ui_nodes);
        this._clearLayerAllChild(this.popup_ui_nodes);
    }

    //获取指定层节点缓存
    private getLayerMap(layer: LayerType) {
        let node;
        switch (layer) {
            case LayerType.UI:
                node = this.ui_nodes;
                break;
            case LayerType.PopupUI:
                node = this.popup_ui_nodes;
                break;
            case LayerType.MarqueeUI:
                node = this.marquee_ui_nodes;
        }
        return node;
    }

    /**
     * 移除指定层所有界面显示(用于层级界面清空显示)
     * layer: 层缓存数据
     * prefabPath: 移除预制体路径
     * **/
    private _removeLayerChild(layer: Map<string, ViewParams>, prefabPath: string) {
        layer.forEach((value: ViewParams, key) => {
            if (value.prefabPath == prefabPath) {
                this.removeLayerChild(value);
            }
        })
    }

    //清除指定层所有界面并销毁数据存储(用于切换场景销毁)
    private _clearLayerAllChild(layer: Map<string, ViewParams>) {
        layer.forEach((value: ViewParams, key) => {
            this.removeLayerChild(value, true);
        });
        layer.clear();
    }

    /**
     * 移除指定层所有界面显示(用于层级界面清空显示)
     * layer： 层缓存数据
     * UIs：排除数据
     * **/
    private _removeLayerAllChild(layer: Map<string, ViewParams>, UIs: UIID[] = []) {
        layer.forEach((value: ViewParams, key) => {
            if (UIs.indexOf(+value.uuid) > -1) {
                return;
            }
            this.removeLayerChild(value);
        })
    }

    //清除节点界面
    private removeLayerChild(value: ViewParams, destroy?: boolean) {
        if (value.node) {
            //先移除再调用界面移除逻辑最后清除，防止界面移除逻辑错误
            if (value.valid) {
                this.applyComponentsFunction(value.node, 'onRemoving', value.params);
            }
            value.node.removeFromParent();
            if (value.valid) {
                value.valid = false;
                this.applyComponentsFunction(value.node, 'onRemoved', value.params);
            }
            destroy && value.node.destroy();
        }

    }
}


