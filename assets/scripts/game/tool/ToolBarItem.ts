import { _decorator, Color, Label, Sprite, tween, Vec3 } from 'cc';
import { CommonListItem } from '../../common/component/list/CommonListItem';
import { ToolNameMap } from './ITool';
const { ccclass, property } = _decorator;


export interface IToolBarItemData {
    toolId: number;
}

@ccclass('ToolBarItem')
export class ToolBarItem extends CommonListItem {

    @property(Sprite)
    icon: Sprite = null;

    @property(Label)
    labName: Label = null;

    protected _data: IToolBarItemData;

    //更新选中状态显示
    protected updateSelect() {

        this.icon.color = this._isSelect ? Color.WHITE : Color.GRAY;
        if (this._isSelect) {
            // 赋予灵魂的 Q 弹特效！(先放大到 1.2 倍，再回弹到 1.0)
            tween(this.node)
                .set({ scale: new Vec3(1.2, 1.2, 1) })
                .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
    }

    protected updateView(): void {
        if (!this._data) return;
        this.updateIcon();
        this.updateName();
    }

    private updateIcon() {
        // 这里记得保证图集路径正确，可能需要从 ResourceManager 动态加载，或者编辑器拖入图集
        if (this.icon && this.icon.spriteAtlas) {
            this.icon.spriteFrame = this.icon.spriteAtlas.getSpriteFrame("tool" + this._data.toolId);
        }
    }

    private updateName() {
        this.labName.string = ToolNameMap[this._data.toolId] || "";
    }

}