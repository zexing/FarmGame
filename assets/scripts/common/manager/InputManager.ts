import { EventKeyboard, input, Input, KeyCode } from 'cc';
import { InputEvent } from '../../events/InputEvents';
import { WorldTimeManager } from '../../game/world/WorldTimeManager';
import { SingletonManager } from '../base/SingletonManager';
import { EventManager } from './EventManager';

export class InputManager extends SingletonManager {

    /**
     * 完美契合 SingletonManager 的自动初始化契约！
     */
    public onInit(): void {
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        console.log("🎮 [InputManager] 硬件输入监听已启动");
    }

    /**
     * 完美契合 SingletonManager 的自动销毁契约！
     */
    public onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        console.log("🎮 [InputManager] 硬件输入监听已彻底移除");
    }

    /**
     * 核心翻译逻辑：硬件信号 -> 游戏语义事件
     */
    private _onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {

            // 1. 动作交互类
            case KeyCode.SPACE:
            case KeyCode.ENTER:
                EventManager.getInstance().dispatchEvent(InputEvent.ACTION_USE_TOOL);
                break;

            // 2. 快捷栏切换类 (数字键 1-4)
            case KeyCode.DIGIT_1:
            case KeyCode.NUM_1: // 👈 修改这里：Cocos 中的小键盘 1
                EventManager.getInstance().dispatchEvent(InputEvent.SLOT_SELECT, { slotIndex: 1 });
                break;
            case KeyCode.DIGIT_2:
            case KeyCode.NUM_2: // 👈 修改这里：Cocos 中的小键盘 2
                EventManager.getInstance().dispatchEvent(InputEvent.SLOT_SELECT, { slotIndex: 2 });
                break;
            case KeyCode.DIGIT_3:
            case KeyCode.NUM_3: // 👈 修改这里
                EventManager.getInstance().dispatchEvent(InputEvent.SLOT_SELECT, { slotIndex: 3 });
                break;
            case KeyCode.DIGIT_4:
            case KeyCode.NUM_4: // 👈 修改这里
                EventManager.getInstance().dispatchEvent(InputEvent.SLOT_SELECT, { slotIndex: 4 });
                break;
            case KeyCode.DIGIT_5:
            case KeyCode.NUM_5: // 👈 修改这里
                EventManager.getInstance().dispatchEvent(InputEvent.SLOT_SELECT, { slotIndex: 5 });
                break;

            // 3. 菜单/取消类
            case KeyCode.ESCAPE:
                EventManager.getInstance().dispatchEvent(InputEvent.ACTION_CANCEL);
                break;


            // 🛠️ 开发者作弊键：一键跨天！
            case KeyCode.KEY_N:
                console.log("======== 🌙 主角上床睡觉 ========");
                WorldTimeManager.getInstance().sleepToNextDay();
                break;
        }
    }
}