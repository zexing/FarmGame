import { assetManager, JsonAsset, resources } from "cc"
import { EDITOR } from "cc/env"
import { SingletonManager } from "../common/base/SingletonManager"

export enum LanguageMode {
    en = 0,
    cn = 1,
}

export class LangString {
    id: number
    isRichText: boolean
    enText: string
    cnText: string
}

//这个配置根据实际项目修改
class StringConfig {
    public static file: string = "StringUI"
    public static localPath: string = 'db://assets/resources/StringUI.json'
}

/**
 * 多语言管理器
 * 使用统一的单例模式管理
 */
export class LangManager extends SingletonManager {

    private langMode: LanguageMode = LanguageMode.en

    private stringMap: Map<number, LangString> = new Map()

    /**
     * 获取单例实例（新统一API）
     */
    public static get instance(): LangManager {
        return LangManager.getInstance<LangManager>();
    }

    /**
     * 获取单例实例（旧API，保留兼容）
     * @deprecated 请使用 LangManager.instance 代替
     */
    public static ins(): LangManager {
        return LangManager.instance;
    }

    setLangMode(mode: LanguageMode) {
        this.langMode = mode
    }

    getLangMode() {
        return this.langMode
    }

    init() {
        // if (global_httpUtils.language == "cn") {
        //     LangManager.instance.setLangMode(LanguageMode.cn)
        // } else {
        //     LangManager.instance.setLangMode(LanguageMode.en)
        // }
        resources.load(StringConfig.file, JsonAsset, (err, data: JsonAsset) => {
            if (err) {
                console.error("String resource not found.")
            } else {
                this.fillStringMap(data)
            }
        })
    }

    private fillStringMap(data: JsonAsset) {
        this.stringMap.clear()
        Object.keys(data.json).forEach((key) => {
            let obj = data.json[key]
            let bean = new LangString()
            bean.id = obj.ID
            bean.isRichText = (obj.isRichText == 2)
            bean.cnText = obj.cnText
            bean.enText = obj.engText
            this.stringMap.set(bean.id, bean)
        })
    }

    private async loadStringMap() {
        if (EDITOR) {
            const uuid = await Editor.Message.request("asset-db", "query-uuid", StringConfig.localPath);
            return new Promise<void>(res => {
                assetManager.loadAny({ type: "uuid", uuid: uuid }, (err, data) => {
                    if (err) {
                        console.error("String resource not found.")
                        res()
                    } else {
                        let jsData = data as JsonAsset
                        this.fillStringMap(jsData)
                        res()
                    }
                })
            })
        }
    }

    async getStringInEditor(id: number, langMode: LanguageMode = null) {
        if (this.stringMap.size == 0) {
            await this.loadStringMap()
        }
        return this.getString(id, langMode)
    }

    getString(id: number, langMode: LanguageMode = null) {
        let dt = this.stringMap.get(id)
        if (!dt) {
            return null
        }
        if (langMode == null) {
            langMode = this.langMode
        }
        switch (langMode) {
            case LanguageMode.en:
                return dt.enText
            case LanguageMode.cn:
                return dt.cnText
            default:
                return null
        }
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.stringMap.clear();
        console.log('[LangManager] Language resources cleared');
    }
}