/**
 * 背包物品格子 — InventoryItemCell
 *
 * 继承 CommonListItem，由 CommonList 统一管理生命周期与对象池复用。
 *
 * 职责（单一）：
 * - updateView()：渲染物品图标 / 名称 / 数量
 * - updateSelect()：选中时高亮边框节点（active 控制）
 * - clearUI()：回池前清空图标，防止残留
 * - 点击由 CommonListItem._onTouchEnd() 处理，
 *   emit "onTouchItem" → CommonList.clickCallBack → InventoryView 显示详情面板
 *
 * 不负责：
 * - 节点回收 / 创建（CommonList + PoolManager 负责）
 * - 详情面板展示（InventoryView 负责）
 *
 * 节点结构（挂在 InventoryItemCellPrefab 根节点，isPoolPrefab 勾选 true）：
 * ```
 * InventoryItemCell (挂本组件 + CommonListItem.isPoolPrefab = true)
 *   ├── IconSprite    ← 物品图标
 *   ├── NameLabel     ← 物品名称（可选，格子较小时可省略）
 *   ├── CountLabel    ← 数量，如 "×5"
 *   └── SelectFrame   ← 选中高亮边框（默认 active=false）
 * ```
 */

import { _decorator, Label, resources, Sprite, SpriteFrame } from 'cc';
import { CommonListItem } from '../../common/component/list/CommonListItem';
import { IInventoryItem } from './IInventory';

const { ccclass, property } = _decorator;


// ─────────────────────────────────────────────────────────────────────────────
// InventoryItemCell
// ─────────────────────────────────────────────────────────────────────────────

@ccclass('InventoryItemCell')
export class InventoryItemCell extends CommonListItem {

    // ── Editor 属性 ──────────────────────────────────────────────────────────

    /** 物品图标 */
    @property({ type: Sprite, tooltip: '物品图标 Sprite' })
    iconSprite: Sprite = null!;

    /** 物品名称（格子较小可不显示，置 null 跳过） */
    @property({ type: Label, tooltip: '物品名称 Label（可为空）' })
    nameLabel: Label = null!;

    /** 持有数量，显示 "×5" */
    @property({ type: Label, tooltip: '数量 Label，显示 "×5"' })
    countLabel: Label = null!;

    // /** 选中高亮边框节点（active 控制） */
    // @property({ type: Node, tooltip: '选中时显示的高亮边框节点' })
    // selectFrame: Node = null!;

    // ── CommonListItem 覆写 ───────────────────────────────────────────────────

    /**
     * updateView：由 CommonList.updateData() 驱动
     * this._data 为 IInventoryItem；data 为 null 时 node.active 已由基类设为 false
     */
    protected updateView(): void {
        const item = this._data as IInventoryItem;
        if (!item) return;

        if (this.nameLabel)  this.nameLabel.string  = item.name;
        if (this.countLabel) this.countLabel.string = `×${item.count}`;

        this._loadIcon(item.iconPath);
    }

    /**
     * updateSelect：选中状态变化时由 CommonList 调用
     * 切换高亮边框的显示
     */
    protected updateSelect(): void {
        // if (this.selectFrame) {
        //     this.selectFrame.active = this._isSelect;
        // }
    }

    /**
     * clearUI：回池前重置图标，避免旧图片残留到下一次 updateView 前
     */
    protected clearUI(): void {
        if (this.iconSprite) this.iconSprite.spriteFrame = null;
        // if (this.selectFrame) this.selectFrame.active = false;
    }

    // ── 私有：图标加载 ────────────────────────────────────────────────────────

    private _loadIcon(iconPath: string): void {
        if (!this.iconSprite || !iconPath) return;

        resources.load(iconPath, SpriteFrame, (err, sf) => {
            if (err || !this.iconSprite?.isValid) return;
            this.iconSprite.spriteFrame = sf;
        });
    }
}
