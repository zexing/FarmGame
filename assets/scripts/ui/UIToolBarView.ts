import { _decorator } from 'cc';
import { EventManager } from '../common/manager/EventManager';
import { BaseUI } from '../common/ui/base/BaseUI';
import { SystemEvent } from '../events/SystemEvents';
import { ToolBarPanel } from '../game/ui/ToolBarPanel';


const { ccclass, property } = _decorator;

@ccclass('UIToolBarView')
export class UIToolBarView extends BaseUI {

    @property(ToolBarPanel)
    public panel: ToolBarPanel = null!;

    protected showView(params: any): void {
        super.showView(params);

        // 👂 监听切枪事件
        EventManager.getInstance().on(SystemEvent.ToolChanged, this._onToolChanged, this);

        // 界面刚打开时，默认高亮第 1 个格子 (锄头)
        this._onToolChanged({ slotIndex: 1 });
    }

    protected closeView(): void {
        // 继承了 BaseComponent 的 cleanOnDisable 其实会自动清理，但显式写一下也是好习惯
        EventManager.getInstance().off(SystemEvent.ToolChanged, this._onToolChanged, this);
        super.closeView();
    }

    /**
     * 接收到事件后的处理逻辑
     */
    private _onToolChanged(payload: { slotIndex: number }): void {
        if (this.panel) {
            this.panel.selectSlot(payload.slotIndex);
        }
    }
}