import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComFollow')
export class ComFollow extends Component {
    @property(Node)
    private _target: Node = null;
    public get target(): Node {
        return this._target;
    }
    public set target(value: Node) {
        this._target = value;
        this.followTarget();
    }

    protected onDisable(): void {
        this.clearTarget();
    }

    public clearTarget() {
        this._target = null;
        this.target_world_pos = null;
        this.target_node_pos = null;
    }

    target_world_pos: Vec3;
    target_node_pos: Vec3;

    public followTarget() {
        if (!this.target) return;
        if (!this.target.parent) return;
        this.target_world_pos = this.target.parent.getComponent(UITransform).convertToWorldSpaceAR(this.target.position);
        this.target_node_pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(this.target_world_pos);
        this.node.setPosition(this.target_node_pos);
    }

    protected update(dt: number): void {
        this.followTarget();
    }
}


