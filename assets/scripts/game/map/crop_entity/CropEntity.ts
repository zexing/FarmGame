import { _decorator, Color, resources, Sprite, SpriteFrame } from 'cc';
import { ICellData } from 'db://assets/scripts/game/map/IMap';
import { BaseComponent } from '../../../common/base/BaseComponent';

const { ccclass, property } = _decorator;

@ccclass('CropEntity')
export class CropEntity extends BaseComponent {
    
    @property({ type: Sprite, tooltip: "作物贴图" })
    cropSprite: Sprite = null!;

    public refresh(data: ICellData): void {
        if (!data) return;

        // 动态拼装路径加载
        const imagePath = `textures/crop/${data.cropId}_${data.growStage}/spriteFrame`;
        
        resources.load(imagePath, SpriteFrame, (err, frame) => {
            if (err) {
                // 兜底色块
                const greenValue = Math.max(50, 255 - data.growStage * 60);
                this.cropSprite.color = new Color(0, greenValue, 0, 255);
                return;
            }
            if (this.isValid && this.cropSprite) {
                this.cropSprite.spriteFrame = frame;
                this.cropSprite.color = Color.WHITE;
            }
        });
    }
}