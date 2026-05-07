import { _decorator, CCInteger, Component, EventHandler, Layout, Node, NodeEventType, ScrollView, Tween, tween, UITransform, Vec3 } from 'cc';
import { DEV, EDITOR } from 'cc/env';
import { ToolUtils } from '../../common_utils/ToolUtils';
import { CommonList } from './CommonList';
const { ccclass, property, requireComponent } = _decorator;

/**
 * 通用list组件（配套虚拟列表）
 * **/
@ccclass('CommonVirtualList')
@requireComponent(CommonList)
export class CommonVirtualList extends Component {
    public static readonly UPDATE_VIRTUAL_SIZE = "UPDATE_VIRTUAL_SIZE";   //更新虚拟列表尺寸变化

    @property({ type: ScrollView })
    protected scrollView: ScrollView;//滚动视图

    @property({ type: Node })
    protected maskNode: Node;//遮罩节点

    @property({ type: Node })
    protected content: Node;//容器节点

    @property({ tooltip: DEV && "开启列表中数量少于最小排布数时自适应(列表item不足时滚动视图相应缩小)" })
    protected isDefaultCentered: boolean = false;//开启列表中数量少于最小排布数时自适应

    @property({ type: [Node], tooltip: DEV && "需要关联移动节点容器" })
    protected virtualNodes: Node[] = [];//需要计算位置显示容器

    @property({ type: [EventHandler] })
    public eventHandlerMove: EventHandler[] = [];

    //刷新频率
    @property({ type: CCInteger })
    private _updateRate: number = 0;
    @property({
        type: CCInteger,
        range: [0, 6, 1],
        tooltip: DEV && '刷新频率（值越大刷新频率越低、性能越高）',
        slide: true,
    })
    set updateRate(val: number) {
        if (val >= 0 && val <= 6) {
            this._updateRate = val;
        }
    }
    get updateRate() {
        return this._updateRate;
    }

    // @property({ tooltip: DEV && "在" })
    // need_update_scrollView: boolean = false;

    protected _list: CommonList;

    protected _maskWidth: number = 0;           //遮罩节点宽度
    protected _maskHeight: number = 0;          //遮罩节点宽度
    protected _maskAnchorX: number = 0;         //遮罩节点锚点位置的 X 坐标
    protected _maskAnchorY: number = 0;         //遮罩节点锚点位置的 Y 坐标
    protected _contentWidth: number = 0;        //容器宽度
    protected _contentHeight: number = 0;       //容器高度
    protected _contentAnchorX: number = 0;      //容器锚点位置的 X 坐标
    protected _contentAnchorY: number = 0;      //容器锚点位置的 Y 坐标
    protected _paddingLeft: number = 0;         //容器左侧边界
    protected _paddingRight: number = 0;        //容器右侧边界
    protected _paddingTop: number = 0;          //容器上侧边界
    protected _paddingBottom: number = 0;       //容器下侧边界
    protected _nodeAnchorX: number = 0;         //列表锚点位置的 X 坐标
    protected _nodeAnchorY: number = 0;         //列表锚点位置的 Y 坐标
    protected _itemWidth: number = 0;           //item宽度
    protected _itemHeight: number = 0;          //item高度
    protected _itemFlagX: number = 0;           //item横向排列方向
    protected _itemFlagY: number = 0;           //item纵向排列方向
    protected _itemSpacingX: number = 0;        //item横向间隔
    protected _itemSpacingY: number = 0;        //item纵向间隔
    protected _constraintNumX: number = 0;      //item横向最大数量
    protected _constraintNumY: number = 0;      //item纵向最大数量
    protected _itemNum: number = 0;             //当前item数据数量
    protected _showItemNum: number = 0;         //当前显示item数量
    protected _currIndex: number = -1;          //当前显示起始index
    protected _moveIndex: number = -1;          //当前缓动index值
    protected _frameCount: number;              //拖动时刷新
    protected _moveData: any;                   //当前缓动参数

    protected tweenNode: Tween<any>;

    //初始化编辑器状态下相关节点赋值
    public initEDITOR() {
        if (EDITOR) {
            this.content = this.node.parent;
            this.maskNode = this.content.parent;
            this.scrollView = this.maskNode.parent.getComponent(ScrollView);
        }
    }

    protected onLoad(): void {
        this._list = this.node.getComponent(CommonList);
        let layout = this.node.getComponent(Layout);

        switch (layout.type) {
            case Layout.Type.HORIZONTAL:
                this._constraintNumX = 0;
                this._constraintNumY = 1;
                break;
            case Layout.Type.VERTICAL:
                this._constraintNumX = 1;
                this._constraintNumY = 0;
                break;
            case Layout.Type.GRID:
                if (layout.startAxis == Layout.AxisDirection.HORIZONTAL) {
                    this._constraintNumX = layout.constraintNum;
                    this._constraintNumY = 0;
                } else {
                    this._constraintNumX = 0;
                    this._constraintNumY = layout.constraintNum;
                }
                break;
        }

        this.updateMaskSize();
    }

    protected onEnable(): void {
        ToolUtils.addEvents(this, this.addEvents);
        this.updateMaskSize();
    }

    protected onDisable(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        this._moveData = null;
        this.tweenNode = null;
    }

    private addEvents() {
        this.maskNode.on(NodeEventType.SIZE_CHANGED, this.updateMaskSize, this);
        this.scrollView?.node.on('scrolling', this.onMoveContent, this);
        this.scrollView?.node.on('scroll-ended', this.onMoveContentEnd, this);
    }

    private removeEvents() {
        this.maskNode.off(NodeEventType.SIZE_CHANGED, this.updateMaskSize, this);
        this.scrollView?.node.off('scrolling', this.onMoveContent, this);
        this.scrollView?.node.off('scroll-ended', this.onMoveContentEnd, this);
        if (this.tweenNode) {
            this.tweenNode.stop();
        }
    }

    /**更新遮罩尺寸变化**/
    public updateMaskSize() {
        let layout = this.node.getComponent(Layout);
        let maskSize = this.maskNode.getComponent(UITransform);
        let contentSize = this.content.getComponent(UITransform);
        let nodeSize = this.node.getComponent(UITransform);
        let itemSize = this._list.getItemSize();

        this._maskWidth = maskSize.width;
        this._maskHeight = maskSize.height;
        this._maskAnchorX = maskSize.anchorX;
        this._maskAnchorY = maskSize.anchorY;
        this._contentAnchorX = contentSize.anchorX;
        this._contentAnchorY = contentSize.anchorY;
        this._nodeAnchorX = nodeSize.anchorX;
        this._nodeAnchorY = nodeSize.anchorY;
        this._itemWidth = itemSize.width;
        this._itemHeight = itemSize.height;
        this._itemFlagX = layout.verticalDirection;
        this._itemFlagY = layout.horizontalDirection;
        this._itemSpacingX = layout.spacingX;
        this._itemSpacingY = layout.spacingY;
        this._paddingLeft = layout.paddingLeft;
        this._paddingRight = layout.paddingRight;
        this._paddingTop = layout.paddingTop;
        this._paddingBottom = layout.paddingBottom;

        this.node.emit(CommonVirtualList.UPDATE_VIRTUAL_SIZE, this);
        this.updateView(this._itemNum);
        if (this._moveIndex >= 0) {
            this.onShowMoveIndex(this._moveIndex, this._moveData);
        }
    }

    //更新界面显示
    public updateView(itemNum: number) {
        this._itemNum = itemNum;
        //更新容器节点尺寸
        let contentW = 0;
        let contentH = 0;
        if (this._constraintNumX > 0) {
            let alignNum = Math.ceil(itemNum / this._constraintNumX);
            contentW = this._itemWidth * this._constraintNumX + this._itemSpacingX * (this._constraintNumX - 1);
            contentH = this._itemHeight * alignNum + this._itemSpacingY * (alignNum - 1);
        } else if (this._constraintNumY > 0) {
            let alignNum = Math.ceil(itemNum / this._constraintNumY);
            contentW = this._itemWidth * alignNum + this._itemSpacingX * (alignNum - 1);
            contentH = this._itemHeight * this._constraintNumY + this._itemSpacingY * (this._constraintNumY - 1);
        }
        this._contentWidth = contentW + this._paddingLeft + this._paddingRight;
        this._contentHeight = contentH + this._paddingTop + this._paddingBottom;

        this.content.getComponent(UITransform).setContentSize(this._contentWidth, this._contentHeight);
        if (this.isDefaultCentered) {//自适应(列表item不足时滚动视图相应缩小)
            let scroll_transform = this.scrollView.getComponent(UITransform);
            if (this._contentWidth < this._maskWidth) {
                scroll_transform.setContentSize(this._contentWidth, scroll_transform.height);
            }
            if (this._contentHeight < this._maskHeight) {
                scroll_transform.setContentSize(scroll_transform.width, this._contentHeight);
            }
        }
        this.updateContentPos(true);
    }

    /**
     * 定位跳转指定位置
     * index: 位置index值
     * data: 跳转方式 =>   isTween:是否缓动形式;tweenStartPos 开始位置;tweenSpeed 缓动时长;callBack:回调函数;offsetNum:偏移量 
     * **/
    public onShowMoveIndex(index: number, data: { isTween?: boolean, tweenStartPos?: number, tweenDuration?: number, callBack?: Function, offsetNum?: number } = null) {
        if (this.tweenNode) {
            this.tweenNode.stop();
        }
        this.scrollView?.stopAutoScroll();
        this._moveIndex = -1;
        this._moveData = null;
        let contentX = this.content.position.x;
        let contentY = this.content.position.y;
        if (this._constraintNumX > 0) {
            if (this._contentHeight <= this._maskHeight) {
                this.content.setPosition(contentX, 0);
                this.updateContentPos();
                if (data && data.callBack) {
                    data.callBack();
                }
                return;
            }
            if (data && data.tweenStartPos) {//开始位置
                let startIndex = index - data.tweenStartPos;
                if (startIndex < 0) {
                    startIndex = 0;
                }
                this.content.setPosition(contentX, this.getIndexPos(startIndex));
            }
            contentY = this.getIndexPos(index);

            if (data && data.offsetNum) {
                if (this._itemFlagX == Layout.VerticalDirection.BOTTOM_TO_TOP) {
                    contentY += data.offsetNum;
                } else {
                    contentY -= data.offsetNum;
                }
            }
        } else if (this._constraintNumY > 0) {
            if (this._contentWidth <= this._maskWidth) {
                this.content.setPosition(0, contentY);
                this.updateContentPos();
                if (data && data.callBack) {
                    data.callBack();
                }
                return;
            }
            if (data && data.tweenStartPos) {//开始位置
                let startIndex = index - data.tweenStartPos;
                if (startIndex < 0) {
                    startIndex = 0;
                }
                this.content.setPosition(this.getIndexPos(startIndex), contentY);
            }
            contentX = this.getIndexPos(index);

            if (data && data.offsetNum) {
                if (this._itemFlagY == Layout.HorizontalDirection.LEFT_TO_RIGHT) {
                    contentX += data.offsetNum;
                } else {
                    contentX -= data.offsetNum;
                }
            }
        }
        if (this.content.position.x == contentX && this.content.position.y == contentY) {
            this.updateContentPos();
            if (data && data.callBack) {
                data.callBack();
            }
        } else if (data && data.isTween) {
            this._moveIndex = index;
            this._moveData = data;
            let posVec: Vec3 = this.content.getPosition();
            posVec.x = contentX;
            posVec.y = contentY;
            this.tweenNode = tween(this.content)
                .to(data.tweenDuration ? data.tweenDuration : 0.35,
                    { position: posVec },
                    {
                        easing: "smooth",
                        onUpdate: this.updateContentPos.bind(this)
                    })
                .call(() => {
                    this._moveIndex = -1;
                    this._moveData = null;
                    data.callBack?.();
                })
                .start();
        } else {
            this.content.setPosition(contentX, contentY);
            this.updateContentPos();
            if (data && data.callBack) {
                data.callBack();
            }
        }
    }

    //更新容器位置变化
    public updateContentPos(force: boolean = false) {
        //计算遮罩内需要显示的Item数据
        let contentX = this.content.position.x;
        let contentY = this.content.position.y;
        let currIndex = 0;
        let pos0Num = this.getIndexPos();//距离0相对距离
        let posIndexNum = 0;//距离index相对距离
        let itemInterval = 0;//item间隔
        let constraintNum = 0;//item单行最大数量
        if (this._constraintNumX > 0) {
            itemInterval = this._itemHeight + this._itemSpacingY;
            constraintNum = this._constraintNumX;
            if (this._itemFlagX == Layout.VerticalDirection.BOTTOM_TO_TOP) {
                posIndexNum = -(contentY - pos0Num);
            } else {
                posIndexNum = (contentY - pos0Num);
            }
        } else if (this._constraintNumY > 0) {
            itemInterval = this._itemWidth + this._itemSpacingX;
            constraintNum = this._constraintNumY;
            if (this._itemFlagY == Layout.HorizontalDirection.LEFT_TO_RIGHT) {
                posIndexNum = -(contentX - pos0Num);
            } else {
                posIndexNum = (contentX - pos0Num);
            }
        }
        currIndex = Math.floor(posIndexNum / itemInterval) * constraintNum;
        //计算完成，进行赋值
        if (currIndex < 0) {
            currIndex = 0;
        }
        if (!force && currIndex == this._currIndex) {
            //未发生渲染个体变化
            return false;
        }
        this._currIndex = currIndex;
        this.updateList();
        return true;
    }

    //获取指定index值坐标位置
    protected getIndexPos(index = 0) {
        let pos0Num = 0;//距离0相对距离
        let posIndexNum = 0;//距离index相对距离
        let itemInterval = 0;//item间隔
        let constraintNum = 0;//item单行最大数量
        let minPos = 0;//坐标最小值
        let maxPos = 0;//坐标最大值
        let isOut = false;//是否超出
        if (this._constraintNumX > 0) {
            itemInterval = this._itemHeight + this._itemSpacingY;
            constraintNum = this._constraintNumX;
            if (this._itemFlagX == Layout.VerticalDirection.BOTTOM_TO_TOP) {
                pos0Num = this._contentHeight * this._contentAnchorY - this._maskHeight * this._maskAnchorY;//index为0时坐标
                // pos0Num -= this._paddingTop;//去除边界额外距离
                posIndexNum = pos0Num - itemInterval * Math.floor(index / constraintNum);
            } else {
                pos0Num = this._maskHeight * (1 - this._maskAnchorY) - this._contentHeight * (1 - this._contentAnchorY);//index为0时坐标
                // pos0Num += this._paddingBottom;//去除边界额外距离
                posIndexNum = pos0Num + itemInterval * Math.floor(index / constraintNum);
            }
            if (this._contentHeight > this._maskHeight) {
                isOut = true;
                minPos = this._maskHeight * (1 - this._maskAnchorY) - this._contentHeight * (1 - this._contentAnchorY);
                maxPos = this._contentHeight * this._contentAnchorY - this._maskHeight * this._maskAnchorY;
            }
        } else if (this._constraintNumY > 0) {
            itemInterval = this._itemWidth + this._itemSpacingX;
            constraintNum = this._constraintNumY;
            if (this._itemFlagY == Layout.HorizontalDirection.LEFT_TO_RIGHT) {
                pos0Num = this._contentWidth * this._contentAnchorX - this._maskWidth * this._maskAnchorX;//index为0时坐标
                // pos0Num -= this._paddingLeft;//去除边界额外距离
                posIndexNum = pos0Num - itemInterval * Math.floor(index / constraintNum);
            } else {
                pos0Num = this._maskWidth * (1 - this._maskAnchorX) - this._contentWidth * (1 - this._contentAnchorX);//index为0时坐标
                // pos0Num += this._paddingRight;//去除边界额外距离
                posIndexNum = pos0Num + itemInterval * Math.floor(index / constraintNum);
            }
            if (this._contentWidth > this._maskWidth) {
                isOut = true;
                minPos = this._maskWidth * (1 - this._maskAnchorX) - this._contentWidth * (1 - this._contentAnchorX);
                maxPos = this._contentWidth * this._contentAnchorX - this._maskWidth * this._maskAnchorX;
            }
        }
        if (isOut) {
            if (posIndexNum < minPos) {
                posIndexNum = minPos;
            }
            if (posIndexNum > maxPos) {
                posIndexNum = maxPos;
            }
        }
        return posIndexNum;
    }

    //容器拖动时计算位置
    protected onMoveContent() {
        if (this._frameCount == null)
            this._frameCount = this._updateRate;
        if (this._frameCount > 0) {
            this._frameCount--;
            return;
        } else
            this._frameCount = this._updateRate;
        this.updateContentPos();
    }

    //容器拖动结束
    protected onMoveContentEnd() {
        this.updateContentPos();
    }

    protected updateList() {
        //计算遮罩内需要显示的Item数据
        let itemNum, posX = 0, posY = 0;
        if (this._constraintNumX > 0) {
            let itemInterval = this._itemHeight + this._itemSpacingY;//item间隔
            let constraintNum = this._constraintNumX;//item单行最大数量
            itemNum = Math.ceil(this._maskHeight / itemInterval) + 1;
            itemNum = itemNum * constraintNum;

            let startIndex = this._currIndex;
            let endIndex = this._currIndex + itemNum;
            if (endIndex > this._itemNum) {
                endIndex = this._itemNum;
            }
            let rows = Math.ceil((endIndex - startIndex) / constraintNum);
            let nodeHeight = rows * this._itemHeight + (rows - 1) * this._itemSpacingY + this._paddingTop + this._paddingBottom;

            if (this._itemFlagX == Layout.VerticalDirection.BOTTOM_TO_TOP) {
                posY = nodeHeight * this._nodeAnchorY - this._contentHeight * this._contentAnchorY;
                posY += (Math.ceil(this._currIndex / constraintNum) * itemInterval);
            } else {
                posY = this._contentHeight * (1 - this._contentAnchorY) - nodeHeight * (1 - this._nodeAnchorY);
                posY -= (Math.ceil(this._currIndex / constraintNum) * itemInterval);
            }
        } else if (this._constraintNumY > 0) {
            let itemInterval = this._itemWidth + this._itemSpacingX;//item间隔
            let constraintNum = this._constraintNumY;//item单行最大数量
            itemNum = Math.ceil(this._maskWidth / itemInterval) + 1;
            itemNum = itemNum * constraintNum;

            let startIndex = this._currIndex;
            let endIndex = this._currIndex + itemNum;
            if (endIndex > this._itemNum) {
                endIndex = this._itemNum;
            }
            let rows = Math.ceil((endIndex - startIndex) / constraintNum);
            let nodeWidth = rows * this._itemWidth + (rows - 1) * this._itemSpacingX + this._paddingLeft + this._paddingRight;

            if (this._itemFlagY == Layout.HorizontalDirection.LEFT_TO_RIGHT) {
                posX = nodeWidth * this._nodeAnchorX - this._contentWidth * this._contentAnchorX;
                posX += (Math.ceil(this._currIndex / constraintNum) * itemInterval);
            } else {
                posX = this._contentWidth * (1 - this._contentAnchorX) - nodeWidth * (1 - this._nodeAnchorX);
                posX -= (Math.ceil(this._currIndex / constraintNum) * itemInterval);
            }
        }
        this._showItemNum = itemNum;

        this._list.updateView();

        this.node.setPosition(posX, posY);
        for (let i = 0; i < this.virtualNodes.length; i++) {
            this.virtualNodes[i].setPosition(posX, posY);
        }

        EventHandler.emitEvents(this.eventHandlerMove);
    }

    //获取当前遮罩内显示item的Index和显示数量
    public getItemShow() {
        let startIndex = this._currIndex;
        let endIndex = this._currIndex + this._showItemNum;
        if (endIndex > this._itemNum) {
            endIndex = this._itemNum;
        }
        return [startIndex, endIndex - startIndex];
    }

    /**获取容器距离顶部距离**/
    public getContentToTop() {
        let contentY = this.content.position.y;
        contentY += this._contentHeight * (1 - this._contentAnchorY);
        return contentY;
    }

    /**获取容器距离顶部距离**/
    public getContentToBottom() {
        let contentY = this.content.position.y;
        contentY -= this._contentHeight * this._contentAnchorY;
        contentY += this._maskHeight;
        return -contentY;
    }

    //获取是否可以滚动
    public getISCanScroll() {
        if (this._constraintNumX > 0) {
            return this._contentHeight > this._maskHeight;
        } else if (this._constraintNumY > 0) {
            return this._contentWidth > this._maskWidth;
        }
        return false;
    }

    protected onDestroy(): void {
        ToolUtils.removeEvents(this, this.removeEvents);
        this._moveData = null;
        this.tweenNode = null;
    }
}


