import { ConfigManager } from '../../common/manager/ConfigManager'; // ✅ 引入配置大管家
import { EventManager } from '../../common/manager/EventManager';
import { ICropConfig } from '../../config/CropConfig';
import { FarmEvent } from '../../events/FarmEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { InventoryManager } from '../inventory/InventoryManager'; // ✅ 引入背包大管家
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class SickleTool implements ITool {
    public readonly id: string = 'tool_sickle';
    public readonly name: string = '镰刀';
    public readonly iconPath: string = 'icons/tools/sickle';

    /**
     * 判断当前格子是否可以挥舞镰刀
     */
    public canUse(cell: ICellData | null): boolean {
        // 1. 格子必须有效，且必须种了东西 (注意现在的 cropId 是字符串)
        if (!cell || !cell.cropId) return false;

        // 2. 获取作物配置
        const cropInfo = ConfigManager.getInstance<ConfigManager>().getConfigByKey<ICropConfig>("CropConfig", cell.cropId);
        if (!cropInfo) return false;

        // 3. ✅ 核心防误触：只有美术阶段达到最后一张贴图（完全成熟），才能收割
        return cell.growStage >= cropInfo.growStages - 1;
    }

    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) {
            // 失败飘字：植物还没熟，或者根本没植物
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `作物还没有成熟，无法收割！` });
            return false;
        }

        const cropId = cell.cropId;
        const cropInfo = ConfigManager.getInstance<ConfigManager>().getConfigByKey<ICropConfig>("CropConfig", cropId);
        if (!cropInfo) return false;

        // ==========================================
        // 🎒 1. 核心链路：将产出物装进背包！
        // ==========================================
        const addedCount = InventoryManager.instance.add(cropId.toString(), 1);
        
        if (addedCount <= 0) {
            // 如果加不进去（比如达到 MAX_STACK 上限了）
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `背包已满，无法收割更多的 ${cropInfo.name}！` });
            return false; 
        }

        // ==========================================
        // 🌾 2. 处理作物数据（单次/多次收割机制）
        // ==========================================
        // 初始化或增加收割次数记录
        cell.harvestCount = (cell.harvestCount || 0) + 1;

        if (cell.harvestCount >= cropInfo.harvestCount) {
            // 💀 寿命耗尽：超过或等于最大收割次数，连根拔起
            cell.cropId = 0; // 清空作物 ID
            cell.growStage = 0;
            cell.plantDay = 0;
            cell.harvestCount = 0;
        } else {
            // 🌱 再度发育：多次收割作物（如番茄），退回到重新生长的起点
            cell.plantDay = 0; // 重置经过天数，因为接下来的目标天数变成了 reGrowDays
            cell.growStage = 1; // 视觉上退回到小苗阶段 (你可以根据美术需求调整这个常数)
        }

        // 通知地图层刷新该格子的贴图表现
        EventManager.getInstance().dispatchEvent(FarmEvent.CellStateChanged, { row, col, newState: cell.state });

        // ✅ 成功飘字，带上动态配置表里的中文名字
        EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `成功收割了 1 个 [${cropInfo.name}]` });
        return true;
    }
}