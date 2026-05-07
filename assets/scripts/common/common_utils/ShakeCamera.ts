import { _decorator, Component } from 'cc';
import { SystemEvent } from '../../events';
import { EventManager } from '../manager/EventManager';
import { TweenUtils } from './TweenUtils';
const { ccclass, property } = _decorator;

export interface IShakeCameraParam {
    times: number;      // 震动次数，-1表示无限次
    strength?: number;   // 单次震动强度
    duration?: number;   // 单次震动持续时间
}

/**此脚本用于做一些震屏效果 */
@ccclass('ShakeCamera')
export class ShakeCamera extends Component {


    protected onEnable(): void {
        EventManager.instance.on(SystemEvent.ShakeCamera, this.shakeCamera, this);
    }

    protected onDisable(): void {
        EventManager.instance.off(SystemEvent.ShakeCamera, this.shakeCamera, this);
    }


    /**震屏
     * @param times 震动次数，-1表示无限次
     * @param strength 单次震动强度
     * @param duration 单次震动持续时间
     */
    private shakeCamera(params: IShakeCameraParam = {
        times: 5,
        strength: 5,
        duration: 0.05
    }) {
        TweenUtils.playShakeAni(this.node, params.times, params.strength, params.duration);
    }

}


