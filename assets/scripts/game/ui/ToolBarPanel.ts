import { _decorator, Component } from 'cc';
import { CommonList } from '../../common/component/list/CommonList';
const { ccclass, property } = _decorator;

@ccclass('ToolBarPanel')
export class ToolBarPanel extends Component {

    @property(CommonList)
    tools_list: CommonList = null;

    protected onLoad(): void {
        this.updateToolList();
    }

    public updateToolList() {
        const datas = [];
        for (let i = 0; i < 5; i++) {
            datas.push({
                toolId: i + 1,
            })
        }
        this.tools_list.updateData(datas);
    }

    /**
     * 表现层对外的唯一接口：选中指定的槽位
     * @param toolId 槽位编号 (1-5)
     */
    public selectSlot(toolId: number): void {
        // 数组下标是 index - 1
        this.tools_list.selectIndex = toolId - 1;
    }
}