/**
 * 语义化输入事件定义
 * 逻辑层只监听这些事件，彻底与具体的物理按键（键盘/手柄/屏幕触控）解耦
 */
export const InputEvents = {
    // 动作指令
    ACTION_USE_TOOL: 'INPUT_ACTION_USE_TOOL', // 触发使用当前工具 (代替原来的 Space)
    ACTION_CANCEL: 'INPUT_ACTION_CANCEL',     // 取消操作 (例如按 Esc 或 B 键)
    
    // 快捷键指令
    SLOT_SELECT: 'INPUT_SLOT_SELECT',         // 选中快捷栏 (附带参数 1-9)



    JOYSTICK_MOVE: "JOYSTICK_MOVE",             //摇杆移动
    JOYSTICK_END: "JOYSTICK_END",               //摇杆移动结束
};