import { _decorator, Enum, sp, SpriteFrame } from 'cc';
import { BaseComponent } from '../common/base/BaseComponent';
import { LangManager, LanguageMode } from './LangManager';
const { ccclass, property } = _decorator;

export enum PropertyValueType {

    SpriteFrame_Array = 0,
    SkeletonData_Array = 1
}

@ccclass('LangPropertyConfig')
export class LangPropertyConfig {

    @property({ type: Enum(LanguageMode) })
    lang: LanguageMode = LanguageMode.en

    @property({ type: Enum(PropertyValueType) })
    valueType: PropertyValueType = PropertyValueType.SpriteFrame_Array

    @property({
        type: [SpriteFrame], visible: function () {
            return this.valueType == PropertyValueType.SpriteFrame_Array
        }
    })
    spriteFrameArrayValue: SpriteFrame[] = []

    @property({
        type: [sp.SkeletonData], visible: function () {
            return this.valueType == PropertyValueType.SkeletonData_Array
        }
    })
    skeletonDataArrayValue: sp.SkeletonData[] = []

    getValue() {
        switch (this.valueType) {
            case PropertyValueType.SpriteFrame_Array:
                return this.spriteFrameArrayValue
            case PropertyValueType.SkeletonData_Array:
                return this.skeletonDataArrayValue
        }
        return null
    }
}

@ccclass('LangProperty')
export class LangProperty extends BaseComponent {

    @property
    componentName: string = ""

    @property
    propertyName: string = ""

    @property([LangPropertyConfig])
    configs: LangPropertyConfig[] = []

    @property
    _langMode: LanguageMode = LanguageMode.en

    @property({ type: Enum(LanguageMode) })
    set langMode(v: LanguageMode) {
        this._langMode = v
        this.updateProperty()
    }

    get langMode() {
        return this._langMode
    }

    private updateProperty() {
        let compt = this.node.getComponent(this.componentName)
        if (compt) {
            let target: LangPropertyConfig = null
            for (let i = 0; i < this.configs.length; i++) {
                const cfg = this.configs[i];
                if (cfg.lang == this._langMode) {
                    target = cfg
                    break
                }
            }
            if (target) {
                compt[this.propertyName] = target.getValue()
            }
        }
    }

    start() {
        this.langMode = LangManager.instance.getLangMode()
        this.updateProperty()
    }

    update(deltaTime: number) {

    }
}

