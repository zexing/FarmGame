import { _decorator, Canvas, director, Enum } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangLabel } from './LangLabel';
import { LanguageMode } from './LangManager';
import { LangProperty } from './LangProperty';
import { LangSpine } from './LangSpine';
import { LangSprite } from './LangSprite';
const { ccclass, property } = _decorator;

@ccclass('LangPreview')
export class LangPreview extends BaseComponent {

    @property({ type: Enum(LanguageMode) })
    langMode: LanguageMode = LanguageMode.en

    @property
    _apply: boolean = false

    @property
    set apply(v: boolean) {
        v = false
        this._apply = v
        this.applyLangSetting()
    }

    get apply() {
        return this._apply
    }

    private applyLangSetting() {
        let canvas = director.getScene().getComponentInChildren(Canvas)
        let spts = canvas.getComponentsInChildren(LangSprite)
        spts.forEach((compt) => {
            compt.langMode = this.langMode
        })
        let lbs = canvas.getComponentsInChildren(LangLabel)
        lbs.forEach((compt) => {
            compt.langMode = this.langMode
        })
        let props = canvas.getComponentsInChildren(LangProperty)
        props.forEach((compt) => {
            compt.langMode = this.langMode
        })
        let spines = canvas.getComponentsInChildren(LangSpine)
        spines.forEach((compt) => {
            compt.langMode = this.langMode
        })
    }

    start() {

    }

    update(deltaTime: number) {

    }
}

