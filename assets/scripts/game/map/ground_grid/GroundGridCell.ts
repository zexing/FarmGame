import { _decorator, Color, Sprite } from 'cc';
import { ICellData } from 'db://assets/scripts/game/map/IMap';
import { BaseComponent } from '../../../common/base/BaseComponent';
import { ECellState } from '../../../const/GameDefine';

const { ccclass, property } = _decorator;

const DRY_COLOR = new Color(255, 255, 255, 255);
const WET_COLOR = new Color(150, 150, 150, 255); // 浇水后泥土变暗

@ccclass('GroundGridCell')
export class GroundGridCell extends BaseComponent {
    @property({ type: Sprite, tooltip: "泥土地表" })
    soilSprite: Sprite = null!;

    @property({ type: Sprite, tooltip: "作物贴图" })
    cropSprite: Sprite = null!;

    /**
     * 🌟 核心：初次加载或滑入视野时的全量数据刷新
     */
    public refresh(data: ICellData): void {
        // console.log("GroundGridCell refresh: ", data);
        if (!data) return;

        // 1. 泥土层逻辑
        if (data.state === ECellState.Untilled || data.state === ECellState.Locked) {
            this.soilSprite.node.active = false;
        } else {
            this.soilSprite.node.active = true;
            this.soilSprite.color = data.isWatered ? WET_COLOR : DRY_COLOR;
        }

        // 2. 作物层逻辑 (暂时用颜色或者简单的 active 代替，等会儿我们再接真实的作物图集)
        if (data.state === ECellState.Planted || data.state === ECellState.Harvestable || data.state === ECellState.Withered) {
            this.cropSprite.node.active = true;
            // TODO: 根据 data.cropId 和 data.growStage 动态加载并替换 cropSprite 的 spriteFrame
        } else {
            this.cropSprite.node.active = false;
        }
    }

    /**
     * 🌟 核心：玩家挥舞工具后的增量视觉刷新
     * (这个方法已经在 GroundGridCtrl._onCellStateChanged 里被调用了！)
     */
    public updateStateVisual(state: ECellState) {
        // 最暴力的偷懒做法：反正有数据，直接让它请求 Model 重新拉取一次完整状态
        // 但在这里我们做个简单的状态切换演示：
        if (state === ECellState.Tilled) {
            this.soilSprite.node.active = true;
        } else if (state === ECellState.Untilled) {
            this.soilSprite.node.active = false;
        }
    }
}