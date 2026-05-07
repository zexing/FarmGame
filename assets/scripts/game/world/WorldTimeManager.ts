import { SingletonManager } from "../../common/base/SingletonManager";
import { EventManager } from "../../common/manager/EventManager";
import { Season } from "../../const/GameDefine";
import { TimeEvent } from "../../events/FarmEvents";

export class WorldTimeManager extends SingletonManager {
    public year: number = 1;
    public season: Season = Season.Spring;
    public day: number = 1;

    public onInit(): void {
        console.log(`⏱️ [WorldTimeManager] 时间轴启动！当前：第${this.year}年/第${this.season}季/第${this.day}天。`);
    }

    public onDestroy(): void {
        console.log("⏱️ [WorldTimeManager] 销毁");
    }

    /**
     * 主流程：上床睡觉，推进时间线
     */
    public sleepToNextDay(): void {
        console.log(`=========================================`);
        console.log(`🌙 太阳下山了，开始执行第${this.day}天的结算法术...`);

        // 1. 派发当天结束事件
        EventManager.getInstance().dispatchEvent(TimeEvent.DayEnd, {
            year: this.year, season: this.season, day: this.day
        });

        // 2. 推进日期
        this.day++;
        let isSeasonChanged = false;
        let isYearChanged = false;

        // 3. 跨季/跨年判断
        if (this.day > 28) {
            this.day = 1;
            isSeasonChanged = true;
            // ✅ 调用独立的流转方法，并获取是否跨年的结果
            isYearChanged = this._transitionToNextSeason();
        }

        // 4. 派发跃迁事件
        if (isYearChanged) {
            EventManager.getInstance().dispatchEvent(TimeEvent.YearChanged, { year: this.year });
        }
        if (isSeasonChanged) {
            EventManager.getInstance().dispatchEvent(TimeEvent.SeasonChanged, { season: this.season });
        }

        // 5. 状态重置与天亮UI刷新
        EventManager.getInstance().dispatchEvent(TimeEvent.ActionPointReset);

        console.log(`🌅 鸡鸣狗叫，天亮了！当前是 第${this.year}年/第${this.season}季/第${this.day}天。`);
        EventManager.getInstance().dispatchEvent(TimeEvent.DayBegin, {
            year: this.year, season: this.season, day: this.day
        });
    }

    /**
     * 🍂 独立方法：处理严格的季节流转与跨年逻辑
     * @returns {boolean} 是否发生了跨年
     */
    private _transitionToNextSeason(): boolean {
        let yearChanged = false;

        switch (this.season) {
            case Season.Spring:
                this.season = Season.Summer;
                break;
            case Season.Summer:
                this.season = Season.Autumn;
                break;
            case Season.Autumn:
                this.season = Season.Winter;
                break;
            case Season.Winter:
                this.season = Season.Spring; // 冬天过完，回到春天
                this.year++;                 // 增加年份
                yearChanged = true;          // 标记跨年
                break;
            default:
                console.error("❌ [WorldTimeManager] 未知的季节状态！");
                this.season = Season.Spring;
                break;
        }

        return yearChanged;
    }
}