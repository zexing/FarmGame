import { EventManager } from '../../common/manager/EventManager';
import { ECellState } from '../../const/GameDefine';
import { FarmEvent } from '../../events/FarmEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class ClearTool implements ITool {
    public readonly id: string = 'tool_clear';
    public readonly name: string = '十字镐';
    public readonly iconPath: string = 'icons/tools/clear';

    public canUse(cell: ICellData | null): boolean {
        if (!cell) return false;
        // 只能砸平“空的耕地”
        return cell.state === ECellState.Tilled && cell.cropId === 0;
    }

    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) {
            // 失败飘字
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `这里无法使用${this.name}！` });
            return false;
        }

        // 状态退化为荒地，同时清除浇水状态
        cell.state = ECellState.Untilled;
        cell.isWatered = false;

        EventManager.getInstance().dispatchEvent(FarmEvent.CellStateChanged, { row, col, newState: cell.state });

        // ✅ 成功飘字
        EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `成功将 (${row}, ${col}) 的耕地砸平复原了！` });
        return true;
    }
}