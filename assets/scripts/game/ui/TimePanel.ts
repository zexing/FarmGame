// /**
//  * 时间面板 — TimePanel
//  *
//  * 职责：
//  * - 监听 TimeEvents.DayBegin，实时更新游戏内日期 / 季节 / 天气显示
//  * - 在 start() 从 WorldTimeManager 读取初始状态（首屏正确显示）
//  *
//  * 节点结构（在 Cocos Editor 中搭建）：
//  * ```
//  * TimePanel (挂本组件)
//  *   ├── DayLabel      ← 当前天数（如 "第 5 天"）
//  *   ├── SeasonLabel   ← 当前季节（如 "春季"）
//  *   └── WeatherLabel  ← 当前天气（如 "晴天"，可选）
//  * ```
//  */

// import { _decorator, Label } from 'cc';
// import { BaseComponent } from '../../common/base/BaseComponent';
// import { EventManager } from '../../common/manager/EventManager';
// import { SEASON_NAMES } from '../../const/GameDefine';
// import { TimeEvent } from '../../events/FarmEvents';
// import { WorldTimeManager } from '../world/WorldTimeManager';

// const { ccclass, property } = _decorator;


// // ─────────────────────────────────────────────────────────────────────────────
// // 天气显示名称（中文映射）
// // ─────────────────────────────────────────────────────────────────────────────

// const WEATHER_NAMES: Record<string, string> = {
//     sunny: '晴天',
//     cloudy: '阴天',
//     rainy: '雨天',
//     snowy: '雪天',
//     stormy: '暴雨',
// };


// // ─────────────────────────────────────────────────────────────────────────────
// // TimePanel
// // ─────────────────────────────────────────────────────────────────────────────

// @ccclass('TimePanel')
// export class TimePanel extends BaseComponent {

//     // ── Editor 属性 ──────────────────────────────────────────────────────────

//     /** 当前天数标签（显示如 "第 5 天"） */
//     @property({ type: Label, tooltip: '当前游戏天数 Label，TimeEvents.DayBegin 触发时更新' })
//     dayLabel: Label = null!;

//     /** 当前季节标签（显示如 "春季"） */
//     @property({ type: Label, tooltip: '当前季节 Label，TimeEvents.DayBegin / 季节切换时更新' })
//     seasonLabel: Label = null!;

//     /**
//      * 天气标签（可选）
//      *
//      * 若不需要显示天气，在 Editor 中留空即可，不会报错。
//      */
//     @property({ type: Label, tooltip: '当前天气 Label（可选），TimeEvents.DayBegin 触发时更新，不需要可留空' })
//     weatherLabel: Label = null!;

//     // ── Cocos 生命周期 ────────────────────────────────────────────────────────

//     protected onLoad(): void {
//         EventManager.instance.on(TimeEvents.DayBegin, this._onDayBegin, this);
//     }

//     protected start(): void {
//         // 所有 onLoad 完成后，WorldTimeManager 已初始化，安全读取快照
//         try {
//             const snap = WorldTimeManager.instance.getSnapshot();
//             const weather = WorldTimeManager.instance.getWeather();
//             this._updateDisplay(snap.day, snap.season, weather);
//         } catch (e) {
//             console.warn('[TimePanel] WorldTimeManager 尚未初始化，时间显示跳过');
//         }
//     }

//     protected onDestroy(): void {
//         EventManager.instance.off(TimeEvents.DayBegin, this._onDayBegin, this);
//     }

//     // ── 事件处理 ──────────────────────────────────────────────────────────────

//     private _onDayBegin(payload: { day: number; season: string; weather?: string }): void {
//         this._updateDisplay(payload.day, payload.season, payload.weather);
//     }

//     // ── 显示更新 ──────────────────────────────────────────────────────────────

//     /**
//      * 更新日期 / 季节 / 天气显示
//      *
//      * @param day     当前游戏天数（从 1 开始）
//      * @param season  季节枚举字符串（如 'spring'）
//      * @param weather 天气枚举字符串（如 'sunny'），可选
//      */
//     private _updateDisplay(day: number, season: string, weather?: string): void {
//         if (this.dayLabel) {
//             this.dayLabel.string = `第 ${day} 天`;
//         }

//         if (this.seasonLabel) {
//             this.seasonLabel.string = (SEASON_NAMES as Record<string, string>)[season] ?? season;
//         }

//         if (this.weatherLabel && weather) {
//             this.weatherLabel.string = WEATHER_NAMES[weather] ?? weather;
//         }
//     }
// }
