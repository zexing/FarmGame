import { _decorator, Enum, sp } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

@ccclass("LangSpineConfig")
export class LangSpineConfig {
    @property({ type: Enum(LanguageMode) })
    lang: LanguageMode = LanguageMode.en

    @property(sp.SkeletonData)
    data: sp.SkeletonData = null

    @property
    skin: string = ""

    @property
    animation: string = ""
}

@ccclass('LangSpine')
export class LangSpine extends BaseComponent {
    @property([LangSpineConfig])
    configs: LangSpineConfig[] = []

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
        let spine = this.getComponent(sp.Skeleton)
        if (spine) {
            let target: LangSpineConfig = null
            for (let i = 0; i < this.configs.length; i++) {
                const cfg = this.configs[i];
                if (cfg.lang == this._langMode) {
                    target = cfg
                    break
                }
            }
            if (target) {
                spine.skeletonData = target.data
                if (target.skin.length > 0) {
                    spine.setSkin(target.skin)
                }
                if (target.animation.length > 0) {
                    spine.animation = target.animation
                } else {
                    // let anims = spine.skeletonData.getRuntimeData().animations
                    // if (anims.length > 0) {
                    //     spine.animation = anims[0].name
                    // }
                }
            }
        }
    }

    onLoad() {
        this.langMode = LangManager.instance.getLangMode()
        this.updateView()
    }

    update(deltaTime: number) {

    }
}

