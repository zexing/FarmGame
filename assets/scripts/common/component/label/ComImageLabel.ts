import { _decorator, Color, Component, Enum, Prefab, Sprite, SpriteFrame, UITransform } from 'cc';
import { PoolManager } from '../../manager/PoolManager';
const { ccclass, property } = _decorator;

/**偏移量尺寸配置
 * 为合并多个同配置项，将之抽取出来单独做配置
 */
@ccclass('NumberConfig')
export class NumberConfig {
    @property({ tooltip: "X轴偏移量（相对于基准位置）" })
    offsetX = 0;

    @property({ tooltip: "Y轴偏移量（相对于基准位置）" })
    offsetY = 0;

    @property({ tooltip: "字符自定义宽度（用于间距计算，0表示使用实际宽度）" })
    customWidth = 0;
}



/**单个字符图配置 */
@ccclass('ImageLabelConfig')
export class ImageLabelConfig {
    @property({ tooltip: "对应字符" })
    key = "";

    @property({ type: SpriteFrame, tooltip: "对应图片" })
    spriteFrame: SpriteFrame = null;

    @property({ tooltip: "对应NumberConfig配置的下标" })
    numberConfigIndex: number = 0;
}


/**目前支持无布局和固定宽度布局 */
export enum EImageLabelLayoutType {
    None,
    CustomWidht,
}

/**
 * 该组件用于字符图片拼凑完整的字符串
 */
@ccclass('ComImageLabel')
export class ComImageLabel extends Component {

    @property({ type: Prefab, tooltip: "字符预制" })
    charPrefab: Prefab = null;

    @property({ type: [NumberConfig], tooltip: "字符尺寸属性配置" })
    numberConfigs: NumberConfig[] = [];

    @property({ type: [ImageLabelConfig], tooltip: "字符图片配置" })
    imageLabelConfigs: ImageLabelConfig[] = [];

    @property({ tooltip: "字符间距" })
    spacing: number = 0;

    @property({ tooltip: "是否水平居中对齐" })
    horizontalCenter: boolean = true;

    // @property({ tooltip: "是否垂直居中对齐" })
    // verticalCenter: boolean = false;

    @property({
        tooltip: "预览字符串",
        visible: function (this: ComImageLabel) {
            if (!this.preview_string || this.preview_string.length == 0) this.clearChars();
            if (this._charCoinfg.size == 0) this.initCharConfig();
            this.setStr(this.preview_string);
            return true;
        }
    })
    preview_string: string = '';

    @property({ tooltip: "缩放倍率" })
    scale: number = 1;

    @property({ type: Enum(EImageLabelLayoutType) })
    layoutType: EImageLabelLayoutType = EImageLabelLayoutType.None;

    @property({
        visible: function (this: ComImageLabel) {
            return this.layoutType == EImageLabelLayoutType.CustomWidht;
        }
    })
    customWidth: number = 0;

    @property({
        tooltip: "是否需要限制最大尺寸",
        visible: function (this: ComImageLabel) {
            return this.layoutType == EImageLabelLayoutType.CustomWidht;
        }
    })
    need_max_size: boolean = false;

    @property({
        tooltip: "是否需要限制最大尺寸",
        visible: function (this: ComImageLabel) {
            return this.layoutType == EImageLabelLayoutType.CustomWidht
                && this.need_max_size;
        }
    })
    max_size: number = 1;

    @property(Color)
    color: Color = new Color(255, 255, 255, 255);

    private _string: string = '';

    public get string(): string {
        return this._string;
    }
    public set string(str: string) {
        this._string = str;
        this.setStr(str);
    }


    private _charInfos: Array<{
        char: string;
        spriteFrame: SpriteFrame;
        numberConfig: NumberConfig;
    }> = [];

    /**保留的字符串配置映射 */
    private _charCoinfg: Map<string, ImageLabelConfig> = new Map();

    /**是否已初始化 */
    private _isInited: boolean = false;

    protected onLoad(): void {
        this._charInfos = [];
        this.initCharConfig();
        this._isInited = true;
    }

    private initCharConfig() {
        this._charCoinfg = new Map();
        this.imageLabelConfigs.forEach(cfg => {
            if (cfg && cfg.key) {
                this._charCoinfg.set(cfg.key, cfg);
            }
        });
    }

    /**
     * 设置要显示的字符串
     * @param str 要显示的字符串
     */
    public setStr(str: string) {
        // console.log("str: ", str);
        if (!str) {
            // console.log("no str!!!");
            this.clearChars();
            return;
        }

        // 确保配置已初始化
        if (!this._isInited || this._charCoinfg.size === 0) {
            this.initCharConfig();
            this._isInited = true;
        }

        // 检查缩放值是否有效
        if (this.scale <= 0) {
            console.warn("ComImageLabel: scale 必须大于 0");
            return;
        }

        if (!this.charPrefab) {
            console.log("no charPrefab!!!");
            return;
        }

        this._charInfos = [];

        // 第一步：预计算所有字符的宽度和总宽度
        let char: string;
        let label_config: ImageLabelConfig = null;
        let number_config: NumberConfig = null;
        let totalWidth = 0;
        let charInfo: { char: string; spriteFrame: SpriteFrame; numberConfig: NumberConfig; };
        for (let i = 0; i < str.length; i++) {
            char = str[i];
            label_config = this._charCoinfg.get(char);
            if (!label_config) {
                // console.warn(`ComImageLabel: 找不到字符 '${char}' 的Image配置`);
                continue;
            }
            // charInfo.spriteFrame = label_config.spriteFrame;
            number_config = this.numberConfigs[label_config ? label_config.numberConfigIndex : 0];
            if (!number_config) {
                console.warn(`ComImageLabel: 找不到字符 '${char}' 的尺寸配置`);
                continue;
            }
            // charInfo.width = number_config.customWidth > 0 ? number_config.customWidth : label_config.spriteFrame.width;
            charInfo = {
                char: char,
                spriteFrame: label_config.spriteFrame,
                numberConfig: number_config
            }
            this._charInfos.push(charInfo);
            totalWidth += number_config.customWidth * this.scale;
            if (i < str.length - 1) { // 最后一个字符不加间距
                totalWidth += this.spacing * this.scale;
            }
        }


        /**
         * 此处需要做优化处理，如果当前的布局模式是自定义宽度，那么需要针对计算的宽度进行缩放处理
         * 同理位置计算和尺寸计算也要缩放
         */

        let custom_scale = 1;

        if (this.layoutType == EImageLabelLayoutType.CustomWidht) {
            custom_scale = this.customWidth / totalWidth;
            /**此处限定最大尺寸 */
            if (this.need_max_size && custom_scale > this.max_size) {
                custom_scale = this.max_size;
            }
        }

        this.node.getComponent(UITransform).setContentSize(totalWidth * custom_scale, 0);

        // 第二步：计算起始位置（用于居中对齐）
        let startX = 0;
        if (this.horizontalCenter) {
            startX = -totalWidth / 2 * custom_scale;
        }

        let currentX = startX;

        // 第三步：创建和定位字符节点
        for (let i = 0; i < this._charInfos.length; i++) {
            charInfo = this._charInfos[i];

            // 从对象池获取字符节点
            let charNode = this.node.children[i];
            if (!charNode) {
                charNode = PoolManager.instance.getNode(this.charPrefab, this.node);
            }

            charNode.setScale(this.scale * custom_scale, this.scale * custom_scale);

            // 设置字符图片
            const sprite = charNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = charInfo.spriteFrame;
            } else {
                console.warn("ComImageLabel: 字符预制上没有找到 Sprite 组件");
            }

            sprite.color = this.color;

            // 计算Y轴位置
            let yPos = charInfo.numberConfig.offsetY * this.scale * custom_scale;
            // if (this.verticalCenter) {
            //     // 垂直居中时，可以根据字符高度进行调整
            //     const charHeight = config.spriteFrame.height;
            //     yPos = number_config.offsetY; // 保持原有偏移，可以根据需要调整
            // }

            // 设置位置，包含字符特定的偏移
            const halfWidth = charInfo.numberConfig.customWidth / 2 * this.scale * custom_scale;
            const charCenterX = currentX + halfWidth;
            charNode.setPosition(charCenterX + charInfo.numberConfig.offsetX * this.scale * custom_scale, yPos, 0);
            currentX += charInfo.numberConfig.customWidth * this.scale * custom_scale;
            if (i < this._charInfos.length - 1) { // 最后一个字符不加间距
                currentX += this.spacing * this.scale * custom_scale;
            }
        }

        // 第四步：清理多余的字符节点
        while (this.node.children.length > this._charInfos.length) {
            const child = this.node.children[this.node.children.length - 1];
            PoolManager.instance.putNode(child);
        }
    }


    /** */

    /**
     * 清空所有字符节点
     */
    private clearChars() {
        while (this.node.children.length > 0) {
            const child = this.node.children[0];
            PoolManager.instance.putNode(child);
        }
        this._charInfos = [];
    }

    protected onDestroy() {
        this.clearChars();
    }
}


