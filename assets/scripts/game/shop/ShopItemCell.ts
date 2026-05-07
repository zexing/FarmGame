/**
 * 商店物品格子 — ShopItemCell
 *
 * 继承 CommonListItem，由 CommonList 统一管理生命周期与对象池复用。
 *
 * 职责（单一）：
 * - 覆写 updateView()：根据 IShopCellData.mode 渲染购买 / 出售两种布局
 * - 覆写 addEvents / removeEvents：将触摸事件绑定在 btnAction 子节点上
 * - 点击 btnAction 后派发 ShopUIEvent.BuyItem / SellItem，由 ShopView 订阅执行
 *
 * 不负责：
 * - 节点回收 / 创建（CommonList + PoolManager 负责）
 * - 买卖业务逻辑（ShopController 负责）
 * - 列表数据管理（ShopView → CommonList.updateData() 负责）
 *
 * 节点结构（挂在 ShopItemCellPrefab 根节点，isPoolPrefab 勾选 true）：
 * ```
 * ShopItemCell (挂本组件 + CommonListItem.isPoolPrefab = true)
 *   ├── IconSprite       ← 作物图标
 *   ├── NameLabel        ← 作物名称
 *   ├── PriceLabel       ← 单价
 *   ├── CountLabel       ← 数量
 *   ├── SeasonLabel      ← 季节（购买模式显示，出售模式隐藏）
 *   └── BtnAction        ← 操作按钮
 *         └── BtnLabel   ← 按钮文字
 * ```
 */

import { _decorator, Label, Node, Sprite, SpriteFrame, EventTouch, resources } from 'cc';
import { CommonListItem } from '../../common/component/list/CommonListItem';
import { EventManager } from '../../common/manager/EventManager';
import { ShopUIEvent } from '../../events/FarmEvents';
import { IShopCellData, IShopBuyItem, IShopSellItem } from './IShop';
import { GameDefine } from '../../const/GameDefine';

const { ccclass, property } = _decorator;


// ─────────────────────────────────────────────────────────────────────────────
// ShopItemCell
// ─────────────────────────────────────────────────────────────────────────────

@ccclass('ShopItemCell')
export class ShopItemCell extends CommonListItem {

    // ── Editor 属性 ──────────────────────────────────────────────────────────

    @property({ type: Sprite, tooltip: '作物图标 Sprite' })
    iconSprite: Sprite = null!;

    @property({ type: Label, tooltip: '作物名称 Label' })
    nameLabel: Label = null!;

    @property({ type: Label, tooltip: '价格 Label' })
    priceLabel: Label = null!;

    @property({ type: Label, tooltip: '数量 Label' })
    countLabel: Label = null!;

    @property({ type: Label, tooltip: '季节 Label（购买模式显示，出售模式隐藏）' })
    seasonLabel: Label = null!;

    @property({ type: Node, tooltip: '操作按钮节点' })
    btnAction: Node = null!;

    @property({ type: Label, tooltip: '按钮文字 Label' })
    btnLabel: Label = null!;

    // ── CommonListItem 覆写 ───────────────────────────────────────────────────

    /**
     * addEvents：将触摸事件绑定到 btnAction，而非整个 cell 节点
     * （CommonList 的 "onTouchItem" 选中逻辑不适用商店，TaberType.NoneChoice）
     */
    protected addEvents(): void {
        this.btnAction?.on(Node.EventType.TOUCH_END, this._onBtnAction, this);
    }

    protected removeEvents(): void {
        this.btnAction?.off(Node.EventType.TOUCH_END, this._onBtnAction, this);
    }

    /**
     * updateView：由 CommonList.updateData() 驱动，this._data 为 IShopCellData
     * data 为 null（多余格子）时 CommonListItem 已将 node.active 设为 false，无需处理
     */
    protected updateView(): void {
        const cellData = this._data as IShopCellData;
        if (!cellData) return;

        if (cellData.mode === 'buy') {
            this._renderBuy(cellData.item);
        } else {
            this._renderSell(cellData.item);
        }
    }

    /**
     * clearUI：回收到对象池前重置图标，避免残留上一条数据的图片
     */
    protected clearUI(): void {
        if (this.iconSprite) this.iconSprite.spriteFrame = null;
    }

    // ── 私有：渲染 ────────────────────────────────────────────────────────────

    private _renderBuy(item: IShopBuyItem): void {
        if (this.nameLabel)   this.nameLabel.string   = item.cropName;
        if (this.priceLabel)  this.priceLabel.string  = `-${item.seedPrice} 金`;
        if (this.countLabel)  this.countLabel.string  = `持有 ${item.ownedCount}`;
        if (this.seasonLabel) {
            this.seasonLabel.node.active = true;
            this.seasonLabel.string      = item.seasonDesc;
        }
        if (this.btnLabel) this.btnLabel.string = '购买';

        this._loadIcon(item.spriteDir);
    }

    private _renderSell(item: IShopSellItem): void {
        if (this.nameLabel)   this.nameLabel.string   = item.cropName;
        if (this.priceLabel)  this.priceLabel.string  = `+${item.sellPrice} 金/个`;
        if (this.countLabel)  this.countLabel.string  = `×${item.ownedCount}`;
        if (this.seasonLabel) this.seasonLabel.node.active = false;
        if (this.btnLabel)    this.btnLabel.string    = '全部出售';

        this._loadIcon(item.spriteDir);
    }

    // ── 私有：按钮点击 ────────────────────────────────────────────────────────

    private _onBtnAction(e: EventTouch): void {
        e.propagationStopped = true;

        const cellData = this._data as IShopCellData;
        if (!cellData) return;

        if (cellData.mode === 'buy') {
            EventManager.instance.dispatchEvent(ShopUIEvent.BuyItem, {
                seedId: (cellData.item as IShopBuyItem).seedId,
                count:  1,
            });
        } else {
            const sell = cellData.item as IShopSellItem;
            EventManager.instance.dispatchEvent(ShopUIEvent.SellItem, {
                cropId: sell.cropId,
                count:  sell.ownedCount,
            });
        }
    }

    // ── 私有：图标加载 ────────────────────────────────────────────────────────

    private _loadIcon(spriteDir: string): void {
        if (!this.iconSprite) return;

        const path = `${GameDefine.CropSpritesUrl}${spriteDir}/stage_0/spriteFrame`;
        resources.load(path, SpriteFrame, (err, sf) => {
            if (err || !this.iconSprite?.isValid) return;
            this.iconSprite.spriteFrame = sf;
        });
    }
}
