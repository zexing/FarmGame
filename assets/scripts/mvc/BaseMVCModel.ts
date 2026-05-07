/**
 * MVC 公共框架 — Model 基类
 *
 * 提炼自 GameBoardModel 中与业务无关的通用能力：
 * - 布尔状态管理（避免每个 Model 手写重复的 get/set）
 * - 统一的 clear() 生命周期入口
 * - 可选的调试日志开关
 *
 * 使用方式（业务层）：
 * ```typescript
 * export class GameBoardModel extends BaseModel implements IGameBoardModel {
 *
 *     // 直接使用框架提供的状态管理，无需手写 _isRolling 字段
 *     public isRolling(): boolean   { return this.getState('rolling'); }
 *     public setRolling(v: boolean) { this.setState('rolling', v); }
 *
 *     // 业务数据
 *     private slotColumns: SlotColumn[] = [];
 *
 *     protected onClear(): void {
 *         this.slotColumns.length = 0;
 *         // 父类 clear() 会自动重置所有 state
 *     }
 * }
 * ```
 */

import { IMVCModel } from './IBaseMVC';

export abstract class BaseMVCModel implements IMVCModel {

    // ─── 状态存储 ───────────────────────────────
    /** 布尔状态 Map，key 由子类自定义（如 'rolling' / 'forceStopped'） */
    private readonly _stateMap: Map<string, boolean> = new Map();

    // ─── 生命周期 ────────────────────────────────

    /**
     * 清空所有数据和状态
     * 子类重写 onClear() 来清理业务数据，无需重写此方法
     */
    public clear(): void {
        this._stateMap.clear();
        this.onClear();
    }

    /**
     * 子类业务数据清理入口
     * 父类 clear() 完成 state 重置后调用
     * 子类在此方法中清空自己的业务数组、Map 等
     */
    protected onClear(): void {
        // 子类按需重写
    }

    // ─── 状态管理（布尔型）─────────────────────────

    /**
     * 读取布尔状态
     * @param key 状态键，由子类定义（建议使用常量字符串）
     * @returns 状态值，未设置过的 key 默认返回 false
     *
     * @example
     * public isRolling(): boolean { return this.getState('rolling'); }
     */
    protected getState(key: string): boolean {
        return this._stateMap.get(key) ?? false;
    }

    /**
     * 设置布尔状态
     * @param key 状态键
     * @param value 状态值
     *
     * @example
     * public setRolling(value: boolean): void { this.setState('rolling', value); }
     */
    protected setState(key: string, value: boolean): void {
        this._stateMap.set(key, value);
    }

    /**
     * 重置指定状态为 false
     * @param key 状态键
     */
    protected resetState(key: string): void {
        this._stateMap.set(key, false);
    }

    /**
     * 重置所有状态为 false（clear() 时自动调用）
     */
    protected resetAllStates(): void {
        this._stateMap.clear();
    }

    /**
     * 检查某个状态是否已被设置过（区分"未设置"和"设置为 false"）
     * @param key 状态键
     */
    protected hasState(key: string): boolean {
        return this._stateMap.has(key);
    }
}
