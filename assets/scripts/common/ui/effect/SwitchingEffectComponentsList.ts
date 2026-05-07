import { _decorator, Component, Node } from 'cc';
import { SwitchingEffectComponents } from './SwitchingEffectComponents';
const { ccclass, property } = _decorator;

/**
 * 批量缓动效果类
 * **/
@ccclass('SwitchingEffectComponentsList')
export class SwitchingEffectComponentsList extends Component {
    private switchingList: SwitchingEffectComponents[] = [];//开场/退场切换动画特效列表

    public initList(node: Node) {
        if (node) {
            this.switchingList = node.getComponentsInChildren(SwitchingEffectComponents);
        } else {
            this.switchingList = [];
        }
    }

    /**播放进入动画效果**/
    public onPlaySwitchingIn(e: any = null) {
        for (let i = 0; i < this.switchingList.length; i++) {
            if (this.switchingList[i]) {
                this.switchingList[i].onPlaySwitchingIn(e);
            }
        }
    }

    /**播放退出动画效果**/
    public onPlaySwitchingOut(e: any = null) {
        for (let i = 0; i < this.switchingList.length; i++) {
            if (this.switchingList[i]) {
                this.switchingList[i].onPlaySwitchingOut(e);
            }
        }
    }
}


