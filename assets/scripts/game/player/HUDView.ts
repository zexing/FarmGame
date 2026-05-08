// /**
//  * HUD 视图层 — HUDView
//  *
//  * 职责（精简后）：
//  * - 作为 HUD 的根节点组件，持有各子面板的引用
//  * - 各子面板（GoldPanel / ExpPanel / TimePanel / ToastView）独立监听事件、自行更新显示
//  * - HUDView 本身不含业务逻辑，只负责初始化顺序的协调（如有需要）
//  *
//  * 节点结构（在 Cocos Editor 中搭建）：
//  * ```
//  * HUDView (挂本组件)
//  *   ├── GoldPanel     (挂 GoldPanel 组件)    ← 金币显示
//  *   ├── ExpPanel      (挂 ExpPanel 组件)     ← 等级 / 经验条
//  *   ├── TimePanel     (挂 TimePanel 组件)    ← 日期 / 季节 / 天气
//  *   └── ToastView     (挂 ToastView 组件)    ← Toast 提示
//  * ```
//  *
//  * 各子面板均在 onLoad() 中自行绑定事件，在 start() 中读取初始值，
//  * 无需 HUDView 做额外协调。
//  */

// import { _decorator } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { ExpPanel } from '../ui/ExpPanel';
// import { GoldPanel } from '../ui/GoldPanel';
// import { TimePanel } from '../ui/TimePanel';
// import { ToastPop } from '../ui/ToastPop';

// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // HUDView
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('HUDView')
// export class HUDView extends BaseComponent {

//     // ── Editor 属性（将各子面板节点拖入）──────────────────────────────────────

//     /** 金币面板（挂 GoldPanel 组件的节点） */
//     @property({ type: GoldPanel, tooltip: '金币面板组件，负责监听 PlayerEvents.GoldChanged 并更新显示' })
//     goldPanel: GoldPanel = null!;

//     /** 经验 / 等级面板（挂 ExpPanel 组件的节点） */
//     @property({ type: ExpPanel, tooltip: '经验等级面板组件，负责监听 PlayerEvents.ExpChanged / LevelUp 并更新显示' })
//     expPanel: ExpPanel = null!;

//     /** 时间面板（挂 TimePanel 组件的节点） */
//     @property({ type: TimePanel, tooltip: '时间面板组件，负责监听 TimeEvents.DayBegin 并更新日期 / 季节显示' })
//     timePanel: TimePanel = null!;

//     /** Toast 提示视图（挂 ToastView 组件的节点） */
//     @property({ type: ToastPop, tooltip: 'Toast 提示组件，负责监听 FarmUIEvent.ShowToast 并弹出淡出提示' })
//     toastView: ToastPop = null!;
// }
