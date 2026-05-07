import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComScale')
export class ComScale extends Component {

    @property
    max_scale: number = 1.2;

    @property
    min_scale: number = 0.8;

    @property
    duration: number = 2;

    private dir = 1;
    private sub_scale = 0;

    start() {
        this.dir = 1;
        this.node.setScale(1, 1);
        this.sub_scale = (this.max_scale - this.min_scale) / this.duration / 60;
    }

    update(deltaTime: number) {
        let scale = this.node.getScale().x;
        if ((this.dir * this.sub_scale + scale) > this.max_scale) {
            this.dir = -this.dir;
            scale = this.max_scale;
        } else if (this.dir * this.sub_scale + this.node.scale.x < this.min_scale) {
            this.dir = -this.dir;
            scale = this.min_scale;
        } else {
            scale += this.dir * this.sub_scale;
        }
        this.node.setScale(scale, scale);
    }
}


