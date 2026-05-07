import { _decorator, Animation, AnimationClip, Enum } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

@ccclass("LangAnimationConfig")
export class LangAnimationConfig {

    @property({ type: Enum(LanguageMode) })
    lang: LanguageMode = LanguageMode.en

    @property([AnimationClip])
    clips: AnimationClip[] = [];

}

@ccclass('LangAnimation')
export class LangAnimation extends BaseComponent {

    @property([LangAnimationConfig])
    configs: LangAnimationConfig[] = []

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
        let ani_comp = this.getComponent(Animation);
        if (ani_comp) {
            let target: LangAnimationConfig = null
            for (let i = 0; i < this.configs.length; i++) {
                const cfg = this.configs[i];
                if (cfg.lang == this._langMode) {
                    target = cfg
                    break
                }
            }
            if (target) {
                ani_comp.clips = target.clips;
            }
        }
    }
    protected onLoad(): void {
        this.langMode = LangManager.instance.getLangMode()
        this.updateView()
    }

    update(deltaTime: number) {

    }
}

