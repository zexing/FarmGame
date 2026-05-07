import CommonUtil from "./CommonUtils";
import { isNil } from "./Globals";
import StringUtil from "./StringUtils";

// 自定义日期类型
export interface CustomDate {
	year: number,
	month: number,
	day: number
}

export default class DateUtil {

	//获取系统时间戳，单位为毫秒
	static getSysTime(): number {
		return (new Date()).getTime();
	}

	static second2hms(value: number): string {
		var s = value;	// 秒
		var m = 0;		// 分
		var h = 0;		// 小时
		if (s > 60) {
			m = Math.floor(s / 60);
			s = s % 60;
			if (m > 60) {
				h = Math.floor(m / 60);
				m = m % 60;
			}
		}

		if (h > 0) {
			return StringUtil.formatStr("%s:%s:%s", CommonUtil.num00(h), CommonUtil.num00(m), CommonUtil.num00(s));
		}
		if (m > 0) {
			return StringUtil.formatStr("%s:%s", CommonUtil.num00(m), CommonUtil.num00(s));
		}
		return StringUtil.formatStr("00:%s", CommonUtil.num00(s));
	}

	static formatTime(nSecond, lineCnt: number = 1): string {
		if (isNil(nSecond)) { return ""; }
		var now = new Date(parseInt(nSecond) * 1000);
		var year = now.getFullYear();
		var month = CommonUtil.num00(now.getMonth() + 1);
		var date = CommonUtil.num00(now.getDate());
		var hour = CommonUtil.num00(now.getHours());
		var minute = CommonUtil.num00(now.getMinutes());
		var second = CommonUtil.num00(now.getSeconds());
		if (lineCnt > 1) {
			return year + "-" + month + "-" + date + "\n" + hour + ":" + minute + ":" + second;
		}
		return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
	}
	static formatTime1(nSecond, lineCnt: number = 1): string {
		if (isNil(nSecond)) { return ""; }
		var now = new Date(parseInt(nSecond) * 1000);
		var year = now.getFullYear();
		var month = CommonUtil.num00(now.getMonth() + 1);
		var date = CommonUtil.num00(now.getDate());
		var hour = CommonUtil.num00(now.getHours());
		var minute = CommonUtil.num00(now.getMinutes());
		var second = CommonUtil.num00(now.getSeconds());
		return hour + ":" + minute + ":" + second + "\n" + month + "/" + date;
	}

	static formatDay(msTimestamp: number, sep: string) {
		let now = new Date(msTimestamp);
		let year = now.getFullYear();
		let month = now.getMonth() + 1;
		let day = now.getDate();
		return year + sep + month + sep + day;
	}

	//获取某年某月总共有多少天
	static getMonthDays(year: number, month: number) {
		return new Date(year, month, 0).getDate();
	}

	static getTimestamp(y: number, m: number, d: number, hour?: number, minute?: number, second?: number) {
		// '2021-07-15 12:30:45'; // 要转换的日期时间字符串
		const dateTimeStr = y + "-" + CommonUtil.num00(m) + "-" + CommonUtil.num00(d) + " " + hour + ":" + minute + ":" + second;
		const timestamp = new Date(dateTimeStr).getTime();
		// console.log(timestamp, this.formatTime(timestamp/1000));
		return timestamp;
	}

	// 获取零点时间戳，毫秒
	static getZeroTimestamp(year: number, month: number, day: number): number {
		let data = new Date(year, month, day);
		return data.getTime();
	}

	// 获取当日零点
	static getTodayZeroTimestamp() {
		let date = new Date();
		return this.getZeroTimestamp(date.getFullYear(), date.getMonth(), date.getDate());
	}



	/**获取指定天数前的日期 */
	public static getSomeBeforeDate(date: CustomDate, days: number): CustomDate {
		let temp_date = new Date(date.year, date.month - 1, date.day);
		temp_date.setDate(temp_date.getDate() - days);
		return { year: temp_date.getFullYear(), month: temp_date.getMonth() + 1, day: temp_date.getDate() };
	}

	/**
	 * 判断起始日期是否晚于结束日期
	 * @param start - 起始日期对象，包含年、月、日信息
	 * @param end - 结束日期对象，包含年、月、日信息
	 * @returns 如果起始日期晚于结束日期，返回 true；否则返回 false
	 */
	public static isAfterDate(start: CustomDate, end: CustomDate): boolean {
		// 首先比较年份，如果起始日期的年份大于结束日期的年份，说明起始日期晚于结束日期
		if (start.year > end.year) {
			return true;
		}
		// 若年份相同，则比较月份
		else if (start.year == end.year && start.month > end.month) {
			return true;
		}
		// 若年份和月份都相同，则比较日期
		else if (start.year == end.year && start.month == end.month && start.day > end.day) {
			return true;
		}
		// 若以上条件都不满足，说明起始日期不晚于结束日期
		else {
			return false;
		}
	}

}

