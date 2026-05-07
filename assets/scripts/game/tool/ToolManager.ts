import { SingletonManager } from '../../common/base/SingletonManager';
import { EventManager } from '../../common/manager/EventManager';
import { InputEvent } from '../../events/InputEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { ClearTool } from './ClearTool';
import { HoeTool } from './HoeTool';
import { ITool } from './ITool';
import { SeedBagTool } from './SeedBagTool';
import { SickleTool } from './SickleTool';
import { WateringCanTool } from './WateringCanTool';


export class ToolManager extends SingletonManager {

    // 武器库：键是快捷栏编号(1-9)，值是具体的工具实例
    private _tools: Map<number, ITool> = new Map();

    // 当前手里拿的快捷栏编号（默认拿第 1 格）
    private _currentSlot: number = 1;

    public onInit(): void {
        // 装配完整工具箱！
        this._tools.set(1, new HoeTool());         // 1 键：锄头
        this._tools.set(2, new WateringCanTool()); // 2 键：水壶
        this._tools.set(3, new SeedBagTool());     // 3 键：种子
        this._tools.set(4, new SickleTool());      // 4 键：镰刀
        this._tools.set(5, new ClearTool());       // 5 键：十字镐

        EventManager.getInstance().on(InputEvent.SLOT_SELECT, this._onSlotSelect, this);
        console.log(`🎒 [ToolManager] 工具箱装配完毕！`);
    }

    /**
     * 自动卸载生命周期
     */
    public onDestroy(): void {
        EventManager.getInstance().off(InputEvent.SLOT_SELECT, this._onSlotSelect, this);
    }

    /**
     * 处理切枪逻辑
     */
    private _onSlotSelect(payload: { slotIndex: number }): void {
        const { slotIndex } = payload;

        // 只有这个格子里有工具，才允许切换
        if (this._tools.has(slotIndex)) {
            this._currentSlot = slotIndex;
            const tool = this._tools.get(this._currentSlot);

            console.log(`🧰 [ToolManager] 丝滑切枪！当前装备快捷栏 ${slotIndex}: 【${tool?.name}】`);

            // ✅ 核心新增：通知全服，玩家换工具了！
            EventManager.getInstance().dispatchEvent(SystemEvent.ToolChanged, { slotIndex: slotIndex });
        } else {
            console.log(`🧰 [ToolManager] 快捷栏 ${slotIndex} 是空的，没东西可拿！`);
        }
    }

    /**
     * 供主角获取当前手里的工具
     */
    public getCurrentTool(): ITool | null {
        return this._tools.get(this._currentSlot) || null;
    }
}