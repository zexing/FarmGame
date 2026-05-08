import { ConfigManager } from '../../common/manager/ConfigManager';
import { EventManager } from '../../common/manager/EventManager';
import { ICropConfig } from '../../config/CropConfig';
import { ECellState } from '../../const/GameDefine'; // 注意你的 ECellState 命名
import { FarmEvent } from '../../events';
import { SystemEvents } from '../../events/SystemEvents';
import { InventoryManager } from '../inventory/InventoryManager';
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class SeedBagTool implements ITool {
    public readonly id: string = 'tool_seed';
    public readonly name: string = '种子袋';
    public readonly iconPath: string = 'icons/tools/seed';

    // 假设当前玩家手里捏着的是“玉米种子” (在 CropConfig.json 中，玉米种子 ID 是 101)
    // 以后这个值可以通过 UI 选中不同的种子来动态切换
    public currentSeedId: string = "101";

    public canUse(cell: ICellData | null): boolean {
        // 只能在刚开垦的土地上播种
        return !!cell && cell.state === ECellState.Tilled;
    }

    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) return false;

        // 🎒 1. 检查背包里有没有足够的种子
        if (!InventoryManager.instance.hasEnough(this.currentSeedId, 1)) {
            EventManager.instance.dispatchEvent(SystemEvents.GameTip, { msg: `背包中没有足够的种子！` });
            return false;
        }

        // 🔍 2. 查表：通过 seedId 反查出到底种的是什么 cropId
        const allCrops = ConfigManager.getInstance().getTable<ICropConfig>("CropConfig");
        const cropInfo = allCrops.find(c => c.seedId.toString() === this.currentSeedId);

        if (!cropInfo) {
            console.error(`[SeedBagTool] 找不到 seedId=${this.currentSeedId} 对应的作物配置！`);
            return false;
        }

        // 🎒 3. 真正扣除种子！(原子操作)
        InventoryManager.instance.remove(this.currentSeedId, 1);

        // 🌾 4. 修改地块数据
        cell.state = ECellState.Planted;
        cell.cropId = cropInfo.cropId; // 记录真实作物的 ID (如 1001)
        cell.plantDay = 0;
        cell.growStage = 0;

        EventManager.instance.dispatchEvent(FarmEvent.CellStateChanged, { row, col, newState: cell.state });
        EventManager.instance.dispatchEvent(SystemEvents.GameTip, { msg: `成功种下了 1 颗 [${cropInfo.name}] 种子` });
        return true;
    }
}