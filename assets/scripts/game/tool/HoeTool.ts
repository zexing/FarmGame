import { EventManager } from '../../common/manager/EventManager';
import { ECellState } from '../../const/GameDefine';
import { FarmEvent } from '../../events/FarmEvents';
import { SystemEvent } from '../../events/SystemEvents';
import { ICellData } from '../map/IMap';
import { ITool, IToolContext } from './ITool';

export class HoeTool implements ITool {

    // ─── 严格实现 ITool 属性 ──────────────────────────────────────────

    public readonly id: string = 'tool_hoe';
    public readonly name: string = '锄头';
    public readonly iconPath: string = 'icons/tools/hoe'; // 对应你资源里的路径

    // ─── 严格实现 ITool 方法 ──────────────────────────────────────────

    /**
     * 判断能否使用：只有当格子存在，且状态为“荒地”时，才能挥动锄头
     */
    public canUse(cell: ICellData | null): boolean {
        if (!cell) return false;
        return cell.state === ECellState.Untilled;
    }

    /**
     * 执行操作：严格匹配 ITool 的接口签名
     */
    public use(row: number, col: number, cell: ICellData | null, ctx: IToolContext): boolean {
        if (!this.canUse(cell) || !cell) {
            // 失败飘字
            EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `这里无法使用${this.name}！` });
            return false;
        }

        cell.state = ECellState.Tilled;
        EventManager.getInstance().dispatchEvent(FarmEvent.CellStateChanged, { row, col, newState: cell.state });
        
        // ✅ 成功飘字
        EventManager.getInstance().dispatchEvent(SystemEvent.GameTip, { msg: `成功开垦了土地！` });
        return true;
    }
}