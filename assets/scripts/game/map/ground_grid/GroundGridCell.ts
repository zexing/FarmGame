import { _decorator, Color, resources, Sprite, SpriteFrame } from 'cc';
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

        // 2. 作物层逻辑
        if (data.state === ECellState.Planted || data.state === ECellState.Harvestable || data.state === ECellState.Withered) {
            this.cropSprite.node.active = true;
            
            // 路径结尾必须加上 /spriteFrame，这是 Cocos 3.x 动态加载 SpriteFrame 的强制要求
            const imagePath = `textures/crop/crop_${data.cropId}_${data.growStage}/spriteFrame`;
            
            resources.load(imagePath, SpriteFrame, (err, frame) => {
                if (err) {
                    // 如果因为还没来得及切图而找不到文件，我们做一个绿色的兜底色块，防止报错卡死
                    console.warn(`[GroundGridCell] 贴图加载失败: ${imagePath}，使用默认色块兜底。`);
                    const greenValue = Math.max(50, 255 - data.growStage * 60);
                    this.cropSprite.color = new Color(0, greenValue, 0, 255);
                    return;
                }
                
                // 确保加载回来时，这个格子还没被对象池回收或销毁
                if (this.isValid && this.cropSprite) {
                    this.cropSprite.spriteFrame = frame;
                    this.cropSprite.color = Color.WHITE; // 恢复正常颜色
                }
            });
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