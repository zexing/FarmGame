import { EventManager } from '../../common/manager/EventManager';
import { ECellState } from '../../const/GameDefine';
import { FarmEvent } from '../../events/FarmEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class WateringCanTool implements ITool {
    public readonly id: string = 'tool_can';
    public readonly name: string = '水壶';
    public readonly iconPath: string = 'icons/tools/can';

    public canUse(cell: ICellData | null): boolean {
        if (!cell) return false;
        // 🌟 核心修正：无论是刚开垦的空地，还是已经播种的作物，只要没浇过水，都可以浇！
        const isWaterableState = (cell.state === ECellState.Tilled || cell.state === ECellState.Planted);

        return isWaterableState && !cell.isWatered;
    }

    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) {
            // 失败飘字
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `这里无法使用${this.name}！` });
            return false;
        }

        // 1. 修改核心数据：标记为已浇水
        cell.isWatered = true;

        // 2. 派发事件通知视图层刷新
        EventManager.getInstance().dispatchEvent(FarmEvent.CellStateChanged, {
            row: row,
            col: col,
            newState: cell.state
        });

        // ✅ 成功飘字
        EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `成功在 (${row}, ${col}) 浇水了！` });
        return true;
    }
}