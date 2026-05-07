import { _decorator, Enum, UITransform, v2, v3, Vec2 } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

@ccclass("LangConfigs")
export class LangConfigs {

    @property({ type: Enum(LanguageMode) })
    lang: LanguageMode = LanguageMode.en

    @property
    scale: Vec2 = v2(1, 1)

    @property
    position: Vec2 = v2(0, 0)

    @property
    size: Vec2 = v2(0, 0)

    @property
    rotation: number = 0

    @property
    active: boolean = true
}

@ccclass('LangConfig')
export class LangConfig extends BaseComponent {

    @property([LangConfigs])
    configs: LangConfigs[] = []

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

    private async updateView() {

        let target: LangConfigs = null
        for (let i = 0; i < this.configs.length; i++) {
            const cfg = this.configs[i];
            if (cfg.lang == this._langMode) {
                target = cfg
                break
            }
        }
        if (target) {
            this.node.setScale(v3(target.scale.x, target.scale.y, 1))
            let x = target.position.x == 0 ? this.node.position.x : target.position.x;
            let y = target.position.y == 0 ? this.node.position.y : target.position.y;
            this.node.setPosition(v3(x, y, 0));
            this.node.angle = target.rotation == 0 ? this.node.angle : target.rotation;
            this.node.active = target.active;
            this.node.getComponent(UITransform).width = target.size.x == 0 ? this.node.getComponent(UITransform).width : target.size.x;
            this.node.getComponent(UITransform).height = target.size.y == 0 ? this.node.getComponent(UITransform).height : target.size.y;
        }
    }

    onLoad() {
        this.langMode = LangManager.instance.getLangMode()
        //this.updateView()
    }

    update(deltaTime: number) {

    }
}

