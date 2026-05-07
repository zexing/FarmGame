/**支持场景内直接查看spine */
import { _decorator, js, sp } from "cc";

const { ccclass, executeInEditMode } = _decorator;

let TrackBinding = js.getClassByName("cc.animation.TrackBinding");

const origincreateRuntimeBinding = TrackBinding.prototype.createRuntimeBinding;

TrackBinding.prototype.createRuntimeBinding = function (target: any, poseOutput: any, isConstant: boolean) {

    let res = origincreateRuntimeBinding.call(this, target, poseOutput, isConstant);

    const originSet = res.setValue;

    res.setValue = function (value: any) {

        if (res.target instanceof sp.Skeleton) {

            if (value != res.getValue()) {

                originSet.call(this, value);

            }

        } else {

            originSet.call(this, value);

        }

    }

    return res;

}

const originProload = sp.Skeleton.prototype.__preload;

sp.Skeleton.prototype.__preload = function () {

    originProload.call(this);

    this.paused = false;

    this._updateSkeletonData();

    this._updateDebugDraw();

}
