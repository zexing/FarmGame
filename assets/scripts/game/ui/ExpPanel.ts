// /**
//  * 经验 / 等级面板 — ExpPanel
//  *
//  * 职责：
//  * - 监听 PlayerEvent.ExpChanged / PlayerEvent.LevelUp，实时更新等级 + 经验条 + 经验文字
//  * - 在 start() 从 PlayerView 读取初始等级 / 经验（首屏正确显示）
//  *
//  * 节点结构（在 Cocos Editor 中搭建）：
//  * ```
//  * ExpPanel (挂本组件)
//  *   ├── LevelLabel    ← 等级标签（如 "Lv.3"）
//  *   ├── ExpLabel      ← 经验文字（如 "35 / 200"，满级显示 "MAX"）
//  *   └── ExpBarFill    ← 经验进度条填充节点（锚点 anchorX = 0，用 scaleX 0~1 控制）
//  * ```
//  */

// import { _decorator, Label, Node } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { EventManager } from '../../common/manager/EventManager';
// import { getExpToNextLevel } from '../../config/LevelConfig';
// import { PlayerEvent } from '../../events/FarmEvents';
// import { PlayerView } from '../player/PlayerView';

// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // ExpPanel
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('ExpPanel')
// export class ExpPanel extends BaseComponent {

//     // ── Editor 属性 ──────────────────────────────────────────────────────────

//     /** 等级标签（显示如 "Lv.3"） */
//     @property({ type: Label, tooltip: '等级 Label，显示格式 "Lv.N"，PlayerEvent.LevelUp 触发时更新' })
//     levelLabel: Label = null!;

//     /** 经验文字标签（显示如 "35 / 200"，满级显示 "MAX"） */
//     @property({ type: Label, tooltip: '经验文字 Label，显示格式 "当前经验 / 升级所需"，满级显示 "MAX"' })
//     expLabel: Label = null!;

//     /**
//      * 经验条填充节点
//      *
//      * 通过 scaleX（0 ~ 1）模拟进度条。
//      * ⚠️ 锚点必须设为左侧（anchorX = 0），否则缩放时会从中心收缩。
//      */
//     @property({ type: Node, tooltip: '经验进度条填充节点（锚点 anchorX=0），通过 scaleX 0~1 控制进度' })
//     expBarFill: Node = null!;

//     /**
//      * 玩家视图引用（用于 start() 读取初始等级 / 经验）
//      */
//     @property({ type: PlayerView, tooltip: '玩家视图引用，start() 时通过此引用读取初始等级和经验值' })
//     playerView: PlayerView = null!;

//     // ── Cocos 生命周期 ────────────────────────────────────────────────────────

//     protected onLoad(): void {
//         const em = EventManager.instance;
//         em.on(PlayerEvent.ExpChanged, this._onExpChanged, this);
//         em.on(PlayerEvent.LevelUp,   this._onLevelUp,    this);
//     }

//     protected start(): void {
//         // 所有 onLoad 完成后，PlayerController 已就绪，安全读取初始值
//         const ctrl = this.playerView?.controller;
//         if (ctrl) {
//             this._updateDisplay(ctrl.level, ctrl.currentExp);
//         }
//     }

//     protected onDestroy(): void {
//         const em = EventManager.instance;
//         em.off(PlayerEvent.ExpChanged, this._onExpChanged, this);
//         em.off(PlayerEvent.LevelUp,   this._onLevelUp,    this);
//     }

//     // ── 事件处理 ──────────────────────────────────────────────────────────────

//     private _onExpChanged(_payload: { delta: number; total: number }): void {
//         const ctrl = this.playerView?.controller;
//         if (ctrl) this._updateDisplay(ctrl.level, ctrl.currentExp);
//     }

//     private _onLevelUp(_payload: { oldLevel: number; newLevel: number }): void {
//         const ctrl = this.playerView?.controller;
//         if (ctrl) this._updateDisplay(ctrl.level, ctrl.currentExp);
//     }

//     // ── 显示更新 ──────────────────────────────────────────────────────────────

//     /**
//      * 更新等级 / 经验进度显示
//      *
//      * @param level      当前等级
//      * @param currentExp 当前等级内已积累的经验
//      */
//     private _updateDisplay(level: number, currentExp: number): void {
//         const expToNext = getExpToNextLevel(level);

//         if (this.levelLabel) {
//             this.levelLabel.string = `Lv.${level}`;
//         }

//         if (this.expLabel) {
//             this.expLabel.string = expToNext > 0 ? `${currentExp} / ${expToNext}` : 'MAX';
//         }

//         if (this.expBarFill) {
//             const progress = expToNext > 0 ? Math.min(currentExp / expToNext, 1) : 1;
//             this.expBarFill.setScale(progress, 1, 1);
//         }
//     }
// }
