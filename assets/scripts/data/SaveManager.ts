// /**
//  * 存档管理器 — SaveManager
//  *
//  * 职责：
//  * - 将所有游戏系统的运行时数据序列化为 JSON 并写入 localStorage
//  * - 从 localStorage 读取存档并分发给各系统恢复数据
//  * - 自动存档（监听 TimeEvents.DayEnd）
//  * - 节流保护：两次存档之间最少间隔 MIN_SAVE_INTERVAL_MS，防止频繁写磁盘
//  *
//  * 解耦设计（Provider 注册模式）：
//  * - SaveManager 不直接 import 任何业务 Controller
//  * - 各系统在初始化时向 SaveManager 注册「存档 Provider」（存/读 回调对）
//  * - GameScene 负责注册所有 Provider，SaveManager 只管调用
//  *
//  *   GameScene.onLoad():
//  *     SaveManager.instance.registerFarm(
//  *       () => farmCtrl.toSaveData(),
//  *       (d) => farmCtrl.loadFromSave(d)
//  *     );
//  *
//  * 自动存档触发时机：
//  *   1. 每天结束（TimeEvents.DayEnd）
//  *   2. 游戏切到后台（需在 GameScene 监听 Cocos 的 hide 事件后手动调用 save()）
//  *   3. 玩家点击"回主界面"按钮时
//  *
//  * 存档版本管理：
//  *   - 每次存档结构变更时递增 SAVE_VERSION
//  *   - load() 时比较版本号，若不兼容则清档（MVP 阶段策略，上线后换迁移逻辑）
//  */

// import { sys } from 'cc';
// import { SingletonManager } from '../common/base/SingletonManager';
// import { EventManager } from '../common/manager/EventManager';
// import { TimeEvent } from '../events/FarmEvents';
// import type { IBuildingSaveData } from '../game/building/IBuilding';
// import type { IFarmSaveData } from '../game/map/IMap';
// import { InventoryManager } from '../game/inventory/InventoryManager';
// import type { IInventorySaveData, IPlayerSaveData } from '../game/player/IPlayer';
// import { IWorldTimeSaveData, WorldTimeManager } from '../game/world/WorldTimeManager';


// // ─────────────────────────────────────────────────────────────────────────────
// // 存档数据结构
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * 完整存档结构（顶层）
//  */
// export interface ISaveData {
//     /** 存档版本号，结构变更时递增 */
//     version:   string;
//     /** 存档时间戳（ms，用于"上次游玩时间"显示） */
//     savedAt:   number;
//     /** 世界时间（日期 / 季节 / 天气 / 行动点） */
//     worldTime: IWorldTimeSaveData;
//     /** 农场格子数据 */
//     farm:      IFarmSaveData;
//     /** 玩家数值数据（金币 / 等级 / 经验 / 特殊材料） */
//     player:    IPlayerSaveData;
//     /** 背包物品数据 */
//     inventory: IInventorySaveData;
//     /** 建筑系统数据（已建造列表 + 加工/养殖状态） */
//     building?: IBuildingSaveData;
// }

// /** 存档版本号。每次存档字段有破坏性变更时递增 */
// const SAVE_VERSION = '1.0.0';

// /** 存档 localStorage key */
// const SAVE_KEY = 'farm_save_v1';

// /** 两次存档之间的最短现实毫秒间隔（5 秒） */
// const MIN_SAVE_INTERVAL_MS = 5_000;


// // ─────────────────────────────────────────────────────────────────────────────
// // Provider 类型（各系统注册的回调对）
// // ─────────────────────────────────────────────────────────────────────────────

// type Saver<T>   = () => T;
// type Loader<T>  = (data: T) => void;

// interface IFarmProvider {
//     save: Saver<IFarmSaveData>;
//     load: Loader<IFarmSaveData>;
// }

// interface IPlayerProvider {
//     save: Saver<IPlayerSaveData>;
//     load: Loader<IPlayerSaveData>;
// }

// interface IBuildingProvider {
//     save: Saver<IBuildingSaveData>;
//     load: Loader<IBuildingSaveData>;
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // SaveManager
// // ─────────────────────────────────────────────────────────────────────────────

// export class SaveManager extends SingletonManager {

//     // ── 单例访问 ─────────────────────────────────────────────────────────────

//     public static get instance(): SaveManager {
//         return SaveManager.getInstance<SaveManager>();
//     }

//     public static delInstance(): void {
//         SaveManager.destroyInstance();
//     }

//     // ── 内部状态 ─────────────────────────────────────────────────────────────

//     /** 已注册的农场数据提供者 */
//     private _farmProvider:   IFarmProvider   | null = null;

//     /** 已注册的玩家数据提供者 */
//     private _playerProvider: IPlayerProvider | null = null;

//     /** 已注册的建筑数据提供者 */
//     private _buildingProvider: IBuildingProvider | null = null;

//     /** 上次成功存档的时间戳（ms），用于节流 */
//     private _lastSaveTime: number = 0;

//     /** 是否已初始化（已监听事件） */
//     private _initialized: boolean = false;

//     // ── 初始化 ───────────────────────────────────────────────────────────────

//     /**
//      * 启动 SaveManager：开始监听 DayEnd 自动存档
//      * 由 GameScene.onLoad() 在所有 Provider 注册完成后调用
//      */
//     public init(): void {
//         if (this._initialized) return;
//         this._initialized = true;

//         EventManager.instance.on(TimeEvents.DayEnd, this._onDayEnd, this);
//         // console.log('[SaveManager] 初始化完成，已启动自动存档监听');
//     }

//     /**
//      * 停止监听（场景卸载时调用）
//      */
//     public shutdown(): void {
//         if (!this._initialized) return;
//         this._initialized = false;

//         EventManager.instance.off(TimeEvents.DayEnd, this._onDayEnd, this);
//         // console.log('[SaveManager] 已关闭');
//     }

//     // ── Provider 注册 ────────────────────────────────────────────────────────

//     /**
//      * 注册农场数据存读回调
//      * 由 GameScene 在 FarmController 初始化后调用
//      *
//      * @param saver  () => farmController.toSaveData()
//      * @param loader (d) => farmController.loadFromSave(d)
//      */
//     public registerFarm(saver: Saver<IFarmSaveData>, loader: Loader<IFarmSaveData>): void {
//         this._farmProvider = { save: saver, load: loader };
//         // console.log('[SaveManager] 已注册农场数据 Provider');
//     }

//     /**
//      * 注册玩家数据存读回调
//      * 由 GameScene 在 PlayerController 初始化后调用
//      */
//     public registerPlayer(saver: Saver<IPlayerSaveData>, loader: Loader<IPlayerSaveData>): void {
//         this._playerProvider = { save: saver, load: loader };
//         // console.log('[SaveManager] 已注册玩家数据 Provider');
//     }

//     /**
//      * 注册建筑数据存读回调
//      * 由 GameScene 在 BuildingModel 初始化后调用
//      */
//     public registerBuilding(saver: Saver<IBuildingSaveData>, loader: Loader<IBuildingSaveData>): void {
//         this._buildingProvider = { save: saver, load: loader };
//         // console.log('[SaveManager] 已注册建筑数据 Provider');
//     }

//     // ── 存档 ─────────────────────────────────────────────────────────────────

//     /**
//      * 立即执行存档
//      *
//      * 节流：距上次存档不足 MIN_SAVE_INTERVAL_MS 时，打日志后跳过
//      *
//      * @param force 强制存档（忽略节流，用于退出游戏时）
//      * @returns true = 成功写入；false = 跳过或失败
//      */
//     public save(force: boolean = false): boolean {
//         const now = Date.now();

//         if (!force && now - this._lastSaveTime < MIN_SAVE_INTERVAL_MS) {
//             // console.log('[SaveManager] 存档节流，跳过本次存档');
//             return false;
//         }

//         const data = this._collectSaveData();
//         if (!data) {
//             console.warn('[SaveManager] 数据收集失败，存档取消');
//             return false;
//         }

//         try {
//             const json = JSON.stringify(data);
//             sys.localStorage.setItem(SAVE_KEY, json);
//             this._lastSaveTime = now;
//             // console.log(`[SaveManager] 存档成功 [${new Date(now).toLocaleTimeString()}] 大小: ${json.length} 字节`);
//             return true;
//         } catch (e) {
//             console.error('[SaveManager] 存档失败（localStorage 可能已满）:', e);
//             return false;
//         }
//     }

//     /**
//      * 强制存档（退出游戏 / 切后台时调用，跳过节流）
//      */
//     public saveImmediate(): boolean {
//         return this.save(true);
//     }

//     // ── 读档 ─────────────────────────────────────────────────────────────────

//     /**
//      * 从 localStorage 读取存档
//      *
//      * @returns 存档数据；不存在或解析失败时返回 null
//      */
//     public load(): ISaveData | null {
//         try {
//             const raw = sys.localStorage.getItem(SAVE_KEY);
//             if (!raw) return null;

//             const data = JSON.parse(raw) as ISaveData;

//             // 版本检查
//             if (!this._isCompatible(data.version)) {
//                 console.warn(`[SaveManager] 存档版本不兼容（存档:${data.version} 当前:${SAVE_VERSION}），清档`);
//                 this.deleteSave();
//                 return null;
//             }

//             // console.log(`[SaveManager] 读档成功，存档时间: ${new Date(data.savedAt).toLocaleString()}`);
//             return data;
//         } catch (e) {
//             console.error('[SaveManager] 读档失败（JSON 解析错误）:', e);
//             return null;
//         }
//     }

//     /**
//      * 将存档数据分发给各系统，完成全局恢复
//      *
//      * 调用顺序（重要）：
//      *   1. WorldTimeManager  — 时间状态最先恢复，其他系统恢复时可能依赖当前季节
//      *   2. FarmController    — 农场格子状态
//      *   3. PlayerController  — 玩家数值
//      *   4. InventoryManager  — 背包物品（纯数据，无顺序依赖）
//      *
//      * @param data load() 返回的存档数据
//      */
//     public applyToSystems(data: ISaveData): void {
//         // console.log('[SaveManager] 开始恢复各系统数据...');

//         // 1. 时间系统（单例，直接访问）
//         WorldTimeManager.instance.loadFromSave(data.worldTime);

//         // 2. 农场
//         if (this._farmProvider && data.farm) {
//             this._farmProvider.load(data.farm);
//         } else if (!this._farmProvider) {
//             console.warn('[SaveManager] 农场 Provider 未注册，跳过恢复');
//         }

//         // 3. 玩家
//         if (this._playerProvider && data.player) {
//             this._playerProvider.load(data.player);
//         } else if (!this._playerProvider) {
//             console.warn('[SaveManager] 玩家 Provider 未注册，跳过恢复');
//         }

//         // 4. 背包（单例，直接访问）
//         if (data.inventory) {
//             InventoryManager.instance.loadFromSave(data.inventory);
//         }

//         // 5. 建筑（可选，旧存档无此字段时跳过，由 Controller 调用 initNew）
//         if (this._buildingProvider && data.building) {
//             this._buildingProvider.load(data.building);
//         }

//         // console.log('[SaveManager] 所有系统数据恢复完成');
//     }

//     // ── 存档管理 ─────────────────────────────────────────────────────────────

//     /**
//      * 判断是否存在有效存档
//      */
//     public hasSave(): boolean {
//         try {
//             return !!sys.localStorage.getItem(SAVE_KEY);
//         } catch {
//             return false;
//         }
//     }

//     /**
//      * 删除存档（清档）
//      * 用于版本不兼容或玩家手动重置
//      */
//     public deleteSave(): void {
//         try {
//             sys.localStorage.removeItem(SAVE_KEY);
//             // console.log('[SaveManager] 存档已删除');
//         } catch (e) {
//             console.error('[SaveManager] 删除存档失败:', e);
//         }
//     }

//     /**
//      * 获取上次存档的时间戳（ms）
//      * 返回 0 表示本次会话内尚未存过档
//      */
//     public get lastSaveTime(): number {
//         return this._lastSaveTime;
//     }

//     // ── 内部方法 ─────────────────────────────────────────────────────────────

//     /**
//      * 收集所有系统的存档数据，组装为 ISaveData
//      * 任何必要 Provider 未注册时，返回 null 取消存档
//      */
//     private _collectSaveData(): ISaveData | null {
//         // 农场和玩家是必须的
//         if (!this._farmProvider) {
//             console.warn('[SaveManager] 农场 Provider 未注册，无法存档');
//             return null;
//         }
//         if (!this._playerProvider) {
//             console.warn('[SaveManager] 玩家 Provider 未注册，无法存档');
//             return null;
//         }

//         return {
//             version:   SAVE_VERSION,
//             savedAt:   Date.now(),
//             worldTime: WorldTimeManager.instance.toSaveData(),
//             farm:      this._farmProvider.save(),
//             player:    this._playerProvider.save(),
//             inventory: InventoryManager.instance.toSaveData(),
//             building:  this._buildingProvider?.save(),
//         };
//     }

//     /**
//      * 检查存档版本是否与当前版本兼容
//      *
//      * MVP 策略：主版本号不同则不兼容（直接清档）
//      * 上线后：实现 migration 迁移逻辑
//      */
//     private _isCompatible(savedVersion: string): boolean {
//         if (!savedVersion) return false;

//         const [savedMajor]   = savedVersion.split('.').map(Number);
//         const [currentMajor] = SAVE_VERSION.split('.').map(Number);

//         return savedMajor === currentMajor;
//     }

//     /**
//      * DayEnd 自动存档（每天结束时触发）
//      */
//     private _onDayEnd(): void {
//         // console.log('[SaveManager] DayEnd 自动存档触发');
//         this.save();
//     }

//     // ── 生命周期 ─────────────────────────────────────────────────────────────

//     protected onDestroy(): void {
//         this.shutdown();
//         // console.log('[SaveManager] 销毁');
//     }
// }
