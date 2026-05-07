/**
 * 货币格式化工具类
 * 用于统一处理货币在显示层的转换
 * 
 * 设计原则：
 * - 逻辑层使用服务器原始值（分，整数）
 * - 显示层使用用户友好的值（元，浮点数）
 * - 所有货币显示转换都通过此工具类进行
 */

import { GameDefine } from "../../const/GameDefine";

export class CurrencyFormatter {
    /**
     * 将服务器货币值（分）转换为显示值（元）
     * @param serverValue 服务器原始值（分）
     * @returns 显示值（元）
     */
    public static toDisplayValue(serverValue: number): number {
        return serverValue / GameDefine.CurrencyTimes;
    }

    /**
     * 将服务器货币值（分）转换为格式化的显示字符串（元）
     * @param serverValue 服务器原始值（分）
     * @param fractionDigits 小数位数，默认2位
     * @returns 格式化的显示字符串
     */
    public static toDisplayString(serverValue: number, fractionDigits: number = 2): string {
        return this.toDisplayValue(serverValue).toFixed(fractionDigits);
    }

    /**
     * 将显示值（元）转换为服务器货币值（分）
     * @param displayValue 显示值（元）
     * @returns 服务器原始值（分）
     */
    public static toServerValue(displayValue: number): number {
        return Math.round(displayValue * GameDefine.CurrencyTimes);
    }

    /**
     * 批量转换服务器货币值数组为显示值数组
     * @param serverValues 服务器原始值数组
     * @returns 显示值数组
     */
    public static toDisplayValues(serverValues: number[]): number[] {
        return serverValues.map(value => this.toDisplayValue(value));
    }
}
