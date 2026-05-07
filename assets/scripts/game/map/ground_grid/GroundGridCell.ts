import { _decorator, Color, Sprite } from 'cc';
import { ICellData } from 'db://assets/scripts/game/map/IMap';
import { BaseComponent } from '../../../common/base/BaseComponent';
import { ECellState } from '../../../const/GameDefine';

const { ccclass, property } = _decorator;

const DRY_COLOR = new Color(255, 255, 255, 255);
const WET_COLOR = new Color(150, 150, 150, 255);

@ccclass('GroundGridCell')
export class GroundGridCell extends BaseComponent {
    @property({ type: Sprite, tooltip: "泥土地表" })
    soilSprite: Sprite = null!;

    // 🌟 cropSprite 已经被删除了！

    public refresh(data: ICellData): void {
        if (!data) return;
        if (data.state === ECellState.Untilled || data.state === ECellState.Locked) {
            this.soilSprite.node.active = false;
        } else {
            this.soilSprite.node.active = true;
            this.soilSprite.color = data.isWatered ? WET_COLOR : DRY_COLOR;
        }
    }
}