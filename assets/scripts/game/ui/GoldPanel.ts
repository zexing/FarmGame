// /**
//  * 金币面板 — GoldPanel
//  *
//  * 职责：
//  * - 监听 PlayerEvents.GoldChanged，实时更新金币数量显示
//  * - 在 start() 从 PlayerView 读取初始金币值（首屏正确显示）
//  *
//  * 节点结构（在 Cocos Editor 中搭建）：
//  * ```
//  * GoldPanel (挂本组件)
//  *   └── GoldLabel    ← 金币数值 Label（如 "500"）
//  * ```
//  */

// import { _decorator, Label } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { EventManager } from '../../common/manager/EventManager';
// import { PlayerEvent } from '../../events/FarmEvents';
// import { PlayerView } from '../player/PlayerView';

// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // GoldPanel
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('GoldPanel')
// export class GoldPanel extends BaseComponent {

//     // ── Editor 属性 ──────────────────────────────────────────────────────────

//     /** 金币数值 Label */
//     @property({ type: Label, tooltip: '金币数量 Label，PlayerEvents.GoldChanged 触发时更新' })
//     goldLabel: Label = null!;

//     /**
//      * 玩家视图引用（用于 start() 读取初始金币值）
//      *
//      * start() 执行时所有 onLoad 均已完成，PlayerController 已就绪，
//      * 可安全读取 ctrl.gold 作为首屏初始值。
//      */
//     @property({ type: PlayerView, tooltip: '玩家视图引用，start() 时通过此引用读取初始金币值' })
//     playerView: PlayerView = null!;

//     // ── Cocos 生命周期 ────────────────────────────────────────────────────────

//     protected onLoad(): void {
//         EventManager.instance.on(PlayerEvents.GoldChanged, this._onGoldChanged, this);
//     }

//     protected start(): void {
//         // 所有 onLoad 完成后，PlayerController 已就绪，安全读取初始值
//         const gold = this.playerView?.controller?.gold ?? 0;
//         this._updateDisplay(gold);
//     }

//     protected onDestroy(): void {
//         EventManager.instance.off(PlayerEvents.GoldChanged, this._onGoldChanged, this);
//     }

//     // ── 事件处理 ──────────────────────────────────────────────────────────────

//     private _onGoldChanged(payload: { delta: number; total: number }): void {
//         this._updateDisplay(payload.total);
//     }

//     // ── 显示更新 ──────────────────────────────────────────────────────────────

//     private _updateDisplay(total: number): void {
//         if (this.goldLabel) {
//             this.goldLabel.string = `${total}`;
//         }
//     }
// }
