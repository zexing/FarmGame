import { _decorator, Component, Label } from 'cc';
import { EventManager } from '../../manager/EventManager';
const { ccclass, property } = _decorator;

@ccclass('ComEventLabel')
export class ComEventLabel extends Component {

    @property
    public event: string = "";

    lab: Label;

    protected onLoad(): void {
        this.lab = this.node.getComponent(Label);
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        EventManager.instance.on(this.event, this.updateLabel, this);
    }

    removeListener() {
        EventManager.instance.off(this.event, this.updateLabel, this);
    }

    updateLabel(str: number | string) {
        // console.log("onEvent", this.event);
        if (!this.lab) return;
        if (typeof str == "number") {
            this.lab.string = str.toString();
        } else {
            this.lab.string = str;
        }

    }

}


