import { EventManager } from '../../common/manager/EventManager';
import { ECellState } from '../../const/GameDefine';
import { FarmEvent } from '../../events/FarmEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class SeedBagTool implements ITool {
    public readonly id: string = 'tool_seeds';
    public readonly name: string = '防风草种子'; // 临时硬编码测试，后续可从背包数据读取
    public readonly iconPath: string = 'icons/tools/seeds';

    public canUse(cell: ICellData | null): boolean {
        if (!cell) return false;
        // 只能种在耕地上，且当前没种东西
        return cell.state === ECellState.Tilled && cell.cropId === 0;
    }

    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) {
            // 失败飘字
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `这里无法使用${this.name}！` });
            return false;
        }

        cell.state = ECellState.Planted;
        // 修改核心数据：种下 1 号作物，重置生长周期
        cell.cropId = 1; // 假设 1 号是防风草
        cell.plantDay = 0;
        cell.growStage = 0;

        EventManager.getInstance().dispatchEvent(FarmEvent.CellStateChanged, { row, col, newState: cell.state });

        // ✅ 成功飘字
        EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `成功在 (${row}, ${col}) 播下了种子！` });
        return true;
    }
}