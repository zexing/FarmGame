import { _decorator } from 'cc';
import { UIManager } from '../common/manager/UIManager';
import { BaseUI } from '../common/ui/base/BaseUI';
import { BaseUIView } from '../common/ui/base/BaseUIView';
import { UIID } from '../common/ui/base/UIConfig';
import { ToastPop } from '../game/ui/ToastPop';
const { ccclass, property } = _decorator;

@ccclass('UIToastPop')
export class UIToastPop extends BaseUI {

    @property(ToastPop)
    toast_pop: ToastPop = null;

    private _baseUIView: BaseUIView;//基础通用界面


    protected onLoad(): void {
        this._baseUIView = this.node.getComponentInChildren(BaseUIView);

    }

    /**
     * 每次显示界面都会执行
     */
    protected showView(params: any) {
        super.showView(params);
        this._baseUIView.showView();
        this.toast_pop.show(params['msg'], () => {
            UIManager.instance.closeView(UIID.Toast);
        });
    }

    /**
     * 每次隐藏界面都会执行
     */
    protected closeView() {

    }
}


