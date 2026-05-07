import { _decorator, Node, PageView } from 'cc';
import { CommonBtnItem } from '../btn/CommonBtnItem';
const { ccclass, property } = _decorator;

@ccclass('CyclePageView')
export class CyclePageView extends PageView {

    @property({ type: CommonBtnItem, tooltip: '下一页' })
    btn_next: CommonBtnItem = null;

    @property({ type: CommonBtnItem, tooltip: '上一页' })
    btn_pre: CommonBtnItem = null;

    private _autoTurningTime: number = 0;

    start() {
        this.setCurrentPageIndex(4);
    }

    onEnable(): void {
        super.onEnable();
        this.addListener();
    }

    onDisable(): void {
        super.onDisable();
        this.removeListener();
    }

    addListener() {
        this.btn_next.setClickCallBack(this.nextPage.bind(this));
        this.btn_pre.setClickCallBack(this.prePage.bind(this));
        this.node.on('scroll-ended', this.onPageTurning, this);
    }

    removeListener() {
        this.btn_next.clearClickCallBack();
        this.btn_pre.clearClickCallBack();
        this.node.off('scroll-ended', this.onPageTurning, this);
    }

    onPageTurning() {
        let pageCount = this._pages.length;
        // console.log("onPageTurning newIndex:", this._curPageIdx);
        let page: Node;
        if (this.curPageIdx == pageCount - 1) {//翻到了最后一页
            page = this._pages[0];
            this.removePage(page);
            this.addPage(page);
            // this.scheduleOnce(() => {
            this.scrollToPage(pageCount - 2, 0);
            this.setCurrentPageIndex(pageCount - 2);
            this._curPageIdx = pageCount - 2;
            // })
        } else if (this.curPageIdx == 0) {//翻到了第一页
            page = this._pages[pageCount - 1];
            this.removePage(page);
            this.insertPage(page, 0);
            // this.scheduleOnce(() => {
            this.scrollToPage(1, 0);
            this.setCurrentPageIndex(1);
            this._curPageIdx = 1;
            // })
        }
        // if (newIndex == 0) {
        //     this.scrollToPage(this.pageCount, 0);
        //     this.setCurrentPageIndex(this.pageCount);
        // }
        // if (newIndex == this.pageCount) {
        //     this.scrollToPage(1, 0);
        //     this.setCurrentPageIndex(1);
        // }
        // this.updatePageIndex();
    }

    nextPage() {
        this._autoTurningTime = 0;
        let newIndex = this.getCurrentPageIndex() + 1;
        this.scrollToPage(newIndex);
    }

    prePage() {
        this._autoTurningTime = 0;
        let newIndex = this.getCurrentPageIndex() - 1;
        this.scrollToPage(newIndex);
    }


    updatePageIndex() {
        // let index = this.getCurrentPageIndex();
        // if (index == 0) index = this.pageCount;
        // else if (index == this.pageCount) index = 1;
        // else index = index - 1;
        // for (let i = 0; i < this.page_index.children.length; i++) {
        //     let node = this.page_index.children[i];
        //     node.active = i == index;
        // }
    }

    update(dt: number): void {
        super.update(dt);
        this._autoTurningTime += dt;
        if (this._autoTurningTime >= 5) {
            this._autoTurningTime = 0;
            this.nextPage();
        }
    }

}


