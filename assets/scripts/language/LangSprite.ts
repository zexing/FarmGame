import { _decorator, Color, color, Enum, Sprite, SpriteFrame, v2, v3, Vec2 } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

@ccclass("LangSpriteConfig")
export class LangSpriteConfig {

    @property({ type: Enum(LanguageMode) })
    lang: LanguageMode = LanguageMode.en

    @property(SpriteFrame)
    spriteFrame: SpriteFrame = null

    @property(Color)
    color: Color = color(255, 255, 255)

    @property
    scale: Vec2 = v2(1, 1)
}

@ccclass('LangSprite')
export class LangSprite extends BaseComponent {

    @property([LangSpriteConfig])
    configs: LangSpriteConfig[] = []

    @property
    _langMode: LanguageMode = LanguageMode.en

    @property({ type: Enum(LanguageMode) })
    set langMode(v: LanguageMode) {
        this._langMode = v
        this.updateView()
    }

    get langMode() {
        return this._langMode
    }

    private updateView() {
        let spt = this.getComponent(Sprite)
        if (spt) {
            let target: LangSpriteConfig = null
            for (let i = 0; i < this.configs.length; i++) {
                const cfg = this.configs[i];
                if (cfg.lang == this._langMode) {
                    target = cfg
                    break
                }
            }
            if (target) {
                spt.spriteFrame = target.spriteFrame
                spt.color = target.color
                this.node.setScale(v3(target.scale.x, target.scale.y, 1))
            }
        }
    }

    start() {
        this.langMode = LangManager.instance.getLangMode()
        this.updateView()
    }

    update(deltaTime: number) {

    }
}

