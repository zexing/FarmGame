// ─────────────────────────────────────────────────────────────────────────────
// 玩家数据事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 玩家数据变化事件
 * 用于驱动 HUD 显示更新，任何修改玩家数据的地方派发对应事件
 */
export enum PlayerEvent {
    /** 金币数量变化（增加或减少） */
    GoldChanged        = 'player.goldChanged',
    /** 特殊材料数量变化 */
    MaterialChanged    = 'player.materialChanged',
    /** 经验值变化 */
    ExpChanged         = 'player.expChanged',
    /** 玩家升级 */
    LevelUp            = 'player.levelUp',
    /** 背包新增物品 */
    ItemAdded          = 'player.itemAdded',
    /** 背包减少物品 */
    ItemRemoved        = 'player.itemRemoved',
    /** 探索行动点变化 */
    ActionPointChanged = 'player.apChanged',
    /** 玩家传送到指定位置 */
    PlayerTeleported   = 'player.teleported',

    /** 🌟 新增：玩家瞄准的地块发生改变 */
    TargetChanged      = 'player.targetChanged',
}