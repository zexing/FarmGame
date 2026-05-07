import { _decorator, Enum, Label } from 'cc';
import { EDITOR } from 'cc/env';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

@ccclass('LangLabel')
export class LangLabel extends BaseComponent {

    @property
    id: string = ""

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
        let i = parseInt(this.id)
        if (Number.isNaN(i)) {
            console.error("unknown string id: ", this.id)
            return
        }
        let lb = this.getComponent(Label)
        if (lb) {
            if (EDITOR) {
                let str = await LangManager.instance.getStringInEditor(i, this.langMode)
                lb.string = str
            } else {
                let str = LangManager.instance.getString(i)
                lb.string = str
            }
        }
    }
    protected onLoad(): void {
        this.langMode = LangManager.instance.getLangMode()
    }
    start() {
        this.updateView()
    }

    update(deltaTime: number) {

    }
}

