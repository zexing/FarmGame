// scripts/common/const/ServiceDefine.ts

/**
 * 核心服务定位器令牌 (Service Tokens)
 * 用于跨模块获取单例或顶级控制器，解除强依赖。
 * * 强制规范：
 * 1. 必须使用 Symbol 以防止字符串命名冲突。
 * 2. 只有顶层 Controller 或核心 Manager 才有资格在此注册。
 */
export const ServiceKey = {
    // ─── 游戏核心控制器 ───
    IMapController: Symbol('IMapController'),
    IFarmController: Symbol('IFarmController'),
    IPlayerController: Symbol('IPlayerController'),
    IShopController: Symbol('IShopController'),
    IInventoryController: Symbol('IInventoryController'),

    // ─── 也可以存放一些核心 Manager 的接口令牌（如有需要） ───
    // IAudioManager: Symbol('IAudioManager'),
};