const { ccclass, property, disallowMultiple, menu, executionOrder } = _decorator;
import { Component, Node, _decorator } from 'cc';
import { DEV } from 'cc/env';
import { ToolUtils } from '../../common_utils/ToolUtils';
import List from './List';

@ccclass
@disallowMultiple()
@menu('List Item')
@executionOrder(-5001)          //先于List
export default class ListItem extends Component {
    //自适应尺寸
    @property({
        tooltip: DEV && '自适应尺寸（宽或高）',
    })
    adaptiveSize: boolean = false;
    //依赖的List组件
    public list: List;
    //是否已经注册过事件
    private _eventReg = false;
    //序列id
    public listId: number;

    onLoad() {
    }

    onDestroy() {
        ToolUtils.off(this.node, Node.EventType.SIZE_CHANGED, this._onSizeChange, this);
    }

    _registerEvent() {
        if (!this._eventReg) {
            if (this.adaptiveSize) {
                this.node.on(Node.EventType.SIZE_CHANGED, this._onSizeChange, this);
            }
            this._eventReg = true;
        }
    }

    _onSizeChange() {
        this.list._onItemAdaptive(this.node);
    }

}
