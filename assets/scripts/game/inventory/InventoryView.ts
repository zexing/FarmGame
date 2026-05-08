/**
 * 背包视图层 — InventoryView
 *
 * 职责（大控制器，只做"连线"）：
 * - 继承 Component，不感知 UIManager，可独立挂载在任意场景节点上
 * - 对外暴露 showView() / closeView() 两个公开接口，由 UIInventoryView 壳子调用
 * - 无独立 Model/Controller：数据直接从 InventoryManager 单例读取，
 *   经 _toInventoryItem() 转换为 IInventoryItem[] 后交给 CommonList 渲染
 * - 管理三个 Tab（全部 / 种子 / 作物），切换时重新过滤数据
 * - 监听 PlayerEvents.ItemAdded / ItemRemoved，背包变化时自动刷新当前 Tab
 * - CommonList.clickCallBack → 选中格子时填充并展示内嵌详情面板
 *
 * 两种使用方式：
 *   1. UIManager 弹窗（推荐）：由 UIInventoryView 壳子加载，showView/closeView 自动调用
 *   2. 场景直接挂载：将本组件挂到场景节点，外部手动调用 showView() / closeView()
 *
 * 节点结构（子节点由 UIInventoryView 预制体提供，或直接在场景中搭建）：
 * ```
 * InventoryView (挂本组件)
 *   ├── BtnTabAll           ← "全部" Tab 按钮
 *   ├── BtnTabSeed          ← "种子" Tab 按钮
 *   ├── BtnTabCrop          ← "作物" Tab 按钮
 *   ├── ItemList            ← CommonList 组件
 *   │                         ListType=PrefabItem, TaberType=SingleChoice
 *   │                         prefabNode = InventoryItemCellPrefab (isPoolPrefab=true)
 *   └── DetailPanel         ← 物品详情面板（默认 active=false）
 *         ├── DetailIconSprite
 *         ├── DetailNameLabel
 *         ├── DetailCountLabel
 *         └── DetailDescLabel
 * ```
 * 注意：BtnClose と遮罩由 BaseUIVew（UIInventoryView 内）统一管理，无需在此重复声明。
 */

import { _decorator, EventTouch, Label, Node, resources, Sprite, SpriteFrame } from 'cc';
import { BaseComponent } from '../../common/base/BaseComponent';
import { CommonList } from '../../common/component/list/CommonList';
import { CommonListItem } from '../../common/component/list/CommonListItem';
import { EventManager } from '../../common/manager/EventManager';
// import { getCropConfigBySeed } from '../../config/CropConfig';
import { GameDefine } from '../../const/GameDefine';
import { PlayerEvents } from '../../events/PlayerEvents';
import { IInventoryItem, InventoryTab } from './IInventory';
import { InventoryManager } from './InventoryManager';

const { ccclass, property } = _decorator;


// ─────────────────────────────────────────────────────────────────────────────
// InventoryView
// ─────────────────────────────────────────────────────────────────────────────

@ccclass('InventoryView')
export class InventoryView extends BaseComponent {

    // ── Editor 属性：Tab 按钮 ─────────────────────────────────────────────────

    @property({ type: Node, tooltip: '"全部" Tab 按钮' })
    btnTabAll: Node = null!;

    @property({ type: Node, tooltip: '"种子" Tab 按钮' })
    btnTabSeed: Node = null!;

    @property({ type: Node, tooltip: '"作物" Tab 按钮' })
    btnTabCrop: Node = null!;

    // ── Editor 属性：列表 ─────────────────────────────────────────────────────

    /**
     * 物品格子列表
     * Inspector 设置：ListType=PrefabItem，TaberType=SingleChoice
     * prefabNode 拖入 InventoryItemCellPrefab（isPoolPrefab 勾选 true）
     */
    @property({ type: CommonList, tooltip: '物品格子列表（CommonList）' })
    itemList: CommonList = null!;

    // ── Editor 属性：详情面板 ─────────────────────────────────────────────────

    /** 详情面板根节点（默认 active=false，点击格子后显示） */
    @property({ type: Node, tooltip: '物品详情面板根节点，点击格子后显示' })
    detailPanel: Node = null!;

    @property({ type: Sprite, tooltip: '详情面板：大图标' })
    detailIconSprite: Sprite = null!;

    @property({ type: Label, tooltip: '详情面板：物品名称' })
    detailNameLabel: Label = null!;

    @property({ type: Label, tooltip: '详情面板：持有数量，如 "持有：5"' })
    detailCountLabel: Label = null!;

    @property({ type: Label, tooltip: '详情面板：物品描述文字' })
    detailDescLabel: Label = null!;

    // ── 运行时 ────────────────────────────────────────────────────────────────

    private _currentTab: InventoryTab = 'all';

    // ── 公开接口（由 UIInventoryView 调用，或外部直接调用）────────────────────

    /**
     * 显示背包，每次打开时调用
     * 内部完成按钮绑定、事件订阅、初始刷新
     */
    public showView(): void {
        // 绑定 Tab 按钮（幂等：先 off 再 on）
        this._bindButtons();

        // 注册 CommonList 点击回调
        this.itemList?.setClickCallBack(this._onItemSelected.bind(this));

        // 订阅背包变化事件，实时刷新
        const em = EventManager.instance;
        em.on(PlayerEvents.ItemAdded,   this._onInventoryChanged, this);
        em.on(PlayerEvents.ItemRemoved, this._onInventoryChanged, this);

        // 每次打开重置详情面板
        if (this.detailPanel) this.detailPanel.active = false;

        // 默认显示"全部" Tab
        this._switchTab('all');

        console.log('[InventoryView] 已显示');
    }

    /**
     * 隐藏背包，关闭时调用
     * 解绑事件，清理 CommonList 回调
     */
    public closeView(): void {
        this.itemList?.clearClickCallBack();

        const em = EventManager.instance;
        em.off(PlayerEvents.ItemAdded,   this._onInventoryChanged, this);
        em.off(PlayerEvents.ItemRemoved, this._onInventoryChanged, this);

        console.log('[InventoryView] 已关闭');
    }

    /** 刷新当前 Tab 列表（外部可主动调用） */
    public refreshList(): void {
        this._refreshCurrentTab();
    }

    // ── Tab 切换 ──────────────────────────────────────────────────────────────

    private _onTabAll(e: EventTouch): void {
        e.propagationStopped = true;
        this._switchTab('all');
    }

    private _onTabSeed(e: EventTouch): void {
        e.propagationStopped = true;
        this._switchTab('seed');
    }

    private _onTabCrop(e: EventTouch): void {
        e.propagationStopped = true;
        this._switchTab('crop');
    }

    private _switchTab(tab: InventoryTab): void {
        this._currentTab = tab;

        // 切换 Tab 时收起详情面板，避免展示上一个物品的旧数据
        if (this.detailPanel) this.detailPanel.active = false;

        this._refreshCurrentTab();
    }

    // ── 列表刷新 ──────────────────────────────────────────────────────────────

    private _refreshCurrentTab(): void {
        const items = this._buildItems(this._currentTab);
        this.itemList?.updateData(items);
    }

    /**
     * 从 InventoryManager 读取所有物品，按 Tab 过滤，转换为 IInventoryItem[]
     */
    private _buildItems(tab: InventoryTab): IInventoryItem[] {
        return InventoryManager.instance.getAll()
            .filter(([itemId]) => {
                if (tab === 'all')  return true;
                if (tab === 'seed') return itemId.startsWith('seed_');
                if (tab === 'crop') return itemId.startsWith('crop_');
                return false;
            })
            .map(([itemId, count]) => this._toInventoryItem(itemId, count))
            .filter((item): item is IInventoryItem => item !== null);
    }

    /**
     * 将 [itemId, count] 转换为 IInventoryItem
     * - seed_xxx → CropConfig 取名称 + stage_0 图标
     * - crop_xxx → CropConfig 取名称 + 成熟帧图标
     * - 其他     → ItemIconUrl 路径，名称 fallback 为 itemId
     */
    private _toInventoryItem(itemId: string, count: number): IInventoryItem | null {
        if (itemId.startsWith('seed_')) {
            // const cfg = getCropConfigBySeed(itemId);
            // if (!cfg) return null;
            // return {
            //     itemId,
            //     count,
            //     name:     `${cfg.name}种子`,
            //     desc:     cfg.desc,
            //     iconPath: `${GameDefine.CropSpritesUrl}${cfg.spriteDir}/stage_0/spriteFrame`,
            //     itemType: 'seed',
            // };
        }

        if (itemId.startsWith('crop_')) {
            // const cfg = getCropConfig(itemId);
            // if (!cfg) return null;
            // return {
            //     itemId,
            //     count,
            //     name:     cfg.name,
            //     desc:     cfg.desc,
            //     iconPath: `${GameDefine.CropSpritesUrl}${cfg.spriteDir}/stage_${cfg.growStages - 1}/spriteFrame`,
            //     itemType: 'crop',
            // };
        }

        // 未知物品（材料/产品等，后续扩展）
        return {
            itemId,
            count,
            name:     itemId,
            desc:     '',
            iconPath: `${GameDefine.ItemIconUrl}${itemId}/spriteFrame`,
            itemType: 'other',
        };
    }

    // ── 详情面板 ──────────────────────────────────────────────────────────────

    /**
     * CommonList.clickCallBack：格子点击时由 CommonList 调用
     * @param data  当前格子的 IInventoryItem 数据
     * @param _cell 对应的 CommonListItem 组件（暂不使用）
     */
    private _onItemSelected(data: IInventoryItem, _cell: CommonListItem): void {
        if (!data) {
            if (this.detailPanel) this.detailPanel.active = false;
            return;
        }
        this._showDetail(data);
    }

    /** 填充并展示详情面板 */
    private _showDetail(item: IInventoryItem): void {
        if (!this.detailPanel) return;

        if (this.detailNameLabel)  this.detailNameLabel.string  = item.name;
        if (this.detailCountLabel) this.detailCountLabel.string = `持有：${item.count}`;
        if (this.detailDescLabel)  this.detailDescLabel.string  = item.desc || '暂无描述';

        if (this.detailIconSprite) {
            this.detailIconSprite.spriteFrame = null; // 先清空，防止旧图闪烁
            resources.load(item.iconPath, SpriteFrame, (err, sf) => {
                if (err || !this.detailIconSprite?.isValid) return;
                this.detailIconSprite.spriteFrame = sf;
            });
        }

        this.detailPanel.active = true;
    }

    // ── 背包变化事件 ──────────────────────────────────────────────────────────

    /**
     * 物品增减后刷新列表
     * 若详情面板正展示该物品，同步更新持有数量避免数据过时
     */
    private _onInventoryChanged(payload: { itemId: string; count: number }): void {
        this._refreshCurrentTab();

        if (this.detailPanel?.active && this.detailCountLabel) {
            const selected = this.itemList?.selectItemData as IInventoryItem | null;
            if (selected?.itemId === payload.itemId) {
                const newCount = InventoryManager.instance.getCount(payload.itemId);
                this.detailCountLabel.string = `持有：${newCount}`;
            }
        }
    }

    // ── 内部：按钮绑定（幂等）────────────────────────────────────────────────

    private _bindButtons(): void {
        this.btnTabAll?.off(Node.EventType.TOUCH_END,  this._onTabAll,  this);
        this.btnTabSeed?.off(Node.EventType.TOUCH_END, this._onTabSeed, this);
        this.btnTabCrop?.off(Node.EventType.TOUCH_END, this._onTabCrop, this);

        this.btnTabAll?.on(Node.EventType.TOUCH_END,  this._onTabAll,  this);
        this.btnTabSeed?.on(Node.EventType.TOUCH_END, this._onTabSeed, this);
        this.btnTabCrop?.on(Node.EventType.TOUCH_END, this._onTabCrop, this);
    }

    // ── Cocos 生命周期 ────────────────────────────────────────────────────────

    protected onDestroy(): void {
        // 防止组件销毁时事件未解绑（正常流程由 closeView 处理，此处兜底）
        const em = EventManager.instance;
        em.off(PlayerEvents.ItemAdded,   this._onInventoryChanged, this);
        em.off(PlayerEvents.ItemRemoved, this._onInventoryChanged, this);
    }
}
