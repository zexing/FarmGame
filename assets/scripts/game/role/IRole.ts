// 角色状态枚举
export enum ERoleState {
    IDLE = 1,
    MOVING = 2,
    // 预留给未来：ATTACK, DEAD, SKILL...
}

// 8 方向枚举 (顺时针或逆时针定义皆可，这里采用顺时针)
export enum ERoleDir {
    RIGHT = 0,
    RIGHT_DOWN = 1,
    DOWN = 2,
    LEFT_DOWN = 3,
    LEFT = 4,
    LEFT_UP = 5,
    UP = 6,
    RIGHT_UP = 7
}


export interface IRole {
    // 预留给未来角色实体实现
}