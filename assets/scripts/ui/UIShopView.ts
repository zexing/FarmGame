import { _decorator } from 'cc';
import { BaseUI } from '../common/ui/base/BaseUI';
const { ccclass, property } = _decorator;

@ccclass('UIShopView')
export class UIShopView extends BaseUI {
    // @property(ShopView)
    // shopView: ShopView = null;

    // private _baseUIView: BaseUIVew;//基础通用界面


    // protected onLoad(): void {
    //     this._baseUIView = this.node.getComponentInChildren(BaseUIVew);

    // }

    // /**
    //  * 每次显示界面都会执行
    //  */
    // protected showView(params: {
    //         playerCtrl: PlayerController;
    //         defaultTab?: ShopTab;
    //     }) {
    //     super.showView(params);
    //     this._baseUIView.showView();
    //     this.shopView.showView(params);
    // }

    // /**
    //  * 每次隐藏界面都会执行
    //  */
    // protected closeView() {

    // }
}


