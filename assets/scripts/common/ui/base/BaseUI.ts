
import { _decorator } from 'cc';
import { BaseComponent } from '../../base/BaseComponent';
import { EventManager } from '../../manager/EventManager';
import { GameTimerManager } from '../../manager/GameTimerManager';
import { UIManager } from '../../manager/UIManager';
const { ccclass, property } = _decorator;

/**
 * UI基类
 * 继承 BaseComponent 以获得自动事件清理能力
 */
@ccclass('BaseUI')
export class BaseUI extends BaseComponent {

  /**
   * 是否是全面屏
   */
  public get isFullScreen() {
    return false
  }
  /**
   * 是否加载过
   */
  private _isStart = false;
  /**
   * 透传参数
   */
  public params: any;

  /**界面Id */
  public viewId: number = 0;

  /**背景界面 */
  protected defaultBaseView: number = 0;
  /**
   * 关闭界面
   */
  protected closeView() {

  }
  protected onLoad() {

  }
  protected start() {
    if (!this._isStart) {
      this._isStart = true;
      this.showView(this.params);
    }
  }
  /**
   * 显示界面
   */
  protected showView(params: any) {
  }
  /**
   * 界面添加viewId
   * @param params 
   */
  protected setViewId(value: any) {
    this.viewId = value;
  }
  /**
   * 界面添加触发
   * @param params 
   */
  protected onAdded(params: any) {
    this.params = params;
    if (this._isStart) {
      this.showView(params);
    }
  }
  /**
   * 界面移除触发
   * @param params 
   */
  protected onRemoving(params: any) {
    if (this._isStart) {
      this.closeView();
      // 触发自动清理（继承自 BaseComponent）
      // 清理所有通过 EventManager 和 GameTimerManager 注册的资源
      if (this.cleanOnDisable) {
        EventManager.instance.offAllByTarget(this);
        GameTimerManager.instance.removeAllByTarget(this);
      }
    }
  }
  /**
   * 界面移除完毕触发
   * @param params 
   */
  protected onRemoved(params: any) {
    if (this._isStart) {
      this.closeViewEnd();
    }
  }

  /**
   * 真正的关闭界面
   */
  protected closeViewEnd() {

  }


  /**关闭当前界面 */
  protected closeUIView() {
    UIManager.instance.closeView(this.viewId);
  }
}


