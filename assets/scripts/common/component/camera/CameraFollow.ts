import { _decorator, Camera, Component, EventMouse, input, Input, math, Node, Rect, Vec3, view } from 'cc';
import { SystemEvents } from '../../../events/SystemEvents';
import { EventManager } from '../../manager/EventManager';
const { ccclass, property } = _decorator;

/**
 * 摄像机平滑跟随与缩放组件
 */
@ccclass('CameraFollow')
export class CameraFollow extends Component {

    // ─── 跟随属性 ─────────────────────────────────────────────────────────────
    @property({ group: { name: "跟随设置", id: "1" }, type: Node, tooltip: '要跟随的目标节点' })
    public target: Node | null = null;

    @property({ group: { name: "跟随设置", id: "1" }, tooltip: '平滑跟随的速度，越大跟得越紧' })
    public followSpeed: number = 8;

    @property({ group: { name: "跟随设置", id: "1" }, tooltip: '摄像机相对于目标的固定偏移量' })
    public offset: Vec3 = new Vec3(0, 0, 1000);

    // ─── 缩放属性 ─────────────────────────────────────────────────────────────
    @property({ group: { name: "缩放设置", id: "2" }, tooltip: '最小正交高度（拉到最近，画面最大）' })
    public minZoom: number = 300;

    @property({ group: { name: "缩放设置", id: "2" }, tooltip: '最大正交高度（拉到最远，视野最广）' })
    public maxZoom: number = 1000;

    @property({ group: { name: "缩放设置", id: "2" }, tooltip: '每次拨动滚轮的缩放步长' })
    public zoomStep: number = 100;

    @property({ group: { name: "缩放设置", id: "2" }, tooltip: '缩放的平滑过渡速度' })
    public zoomSmoothSpeed: number = 10;

    // ─── 边界属性 (新增) ──────────────────────────────────────────────────────
    @property({ group: { name: "边界限制", id: "3" }, tooltip: '是否开启地图边界限制' })
    public enableBounds: boolean = true;


    // ─── 内部缓存变量 ─────────────────────────────────────────────────────────
    private _targetPos: Vec3 = new Vec3();
    private _currentPos: Vec3 = new Vec3();
    private _camera: Camera | null = null;
    private _targetOrthoHeight: number = 0;
    private _baseOrthoHeight: number = 0;
    private _mapBounds: Rect = new Rect(-2000, -2000, 4000, 4000); // 这里填入你地图的真实尺寸

    protected onLoad() {
        this._camera = this.getComponent(Camera);
        if (this._camera) {
            this._targetOrthoHeight = this._camera.orthoHeight;
            this._baseOrthoHeight = this._camera.orthoHeight;
        }
        input.on(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        // 👂 监听地图边界变更
        EventManager.getInstance().on(SystemEvents.MapBoundsChanged, this._onMapBoundsChanged, this);
    }

    // protected start() {
    //     if (this.target) {
    //         this.target.getWorldPosition(this._targetPos);
    //         this._currentPos.set(
    //             this._targetPos.x + this.offset.x,
    //             this._targetPos.y + this.offset.y,
    //             this.offset.z
    //         );

    //         // 初始时也进行一次边界限制
    //         this._applyBounds(this._currentPos);
    //         this.node.setWorldPosition(this._currentPos);
    //     }
    // }

    protected onDestroy() {
        input.off(Input.EventType.MOUSE_WHEEL, this._onMouseWheel, this);
        EventManager.getInstance().off(SystemEvents.MapBoundsChanged, this._onMapBoundsChanged, this);
    }

    /**
     * 接收来自 TiledMapCtrl 或 GridView 的边界同步通知
     */
    private _onMapBoundsChanged(payload: { bounds: Rect }): void {
        if (payload && payload.bounds) {
            this._mapBounds = payload.bounds;
            console.log("📸 [CameraFollow] 边界已自动对齐:", this._mapBounds);

            // 如果当前已经在跟随，立刻执行一次钳制防止穿帮
            if (this.target) {
                this.target.getWorldPosition(this._targetPos);
                this._applyBounds(this._targetPos);
            }
        }
    }

    private _onMouseWheel(event: EventMouse) {
        if (!this._camera) return;
        const scrollY = event.getScrollY();

        if (scrollY > 0) {
            this._targetOrthoHeight -= this.zoomStep;
        } else if (scrollY < 0) {
            this._targetOrthoHeight += this.zoomStep;
        }

        this._targetOrthoHeight = math.clamp(this._targetOrthoHeight, this.minZoom, this.maxZoom);
    }

    protected lateUpdate(dt: number) {
        if (this._camera) {
            const new_orthoHeight = math.lerp(
                this._camera.orthoHeight,
                this._targetOrthoHeight,
                dt * this.zoomSmoothSpeed
            );
            if (this._camera.orthoHeight != new_orthoHeight) {
                this._camera.orthoHeight = new_orthoHeight;
                const currentZoomRatio = this._camera.orthoHeight / this._baseOrthoHeight;
                // 通知网格系统：视窗缩放比例变了！
                EventManager.getInstance().dispatchEvent(SystemEvents.CameraZoomChanged, {
                    zoomRatio: currentZoomRatio
                });
            }
        }

        if (!this.target) return;

        // 1. 获取目标理论位置
        this.target.getWorldPosition(this._targetPos);
        this._targetPos.set(
            this._targetPos.x + this.offset.x,
            this._targetPos.y + this.offset.y,
            this.offset.z
        );

        // 2. 将理论位置进行边界钳制 (Clamp)
        this._applyBounds(this._targetPos);

        // 3. 执行平滑移动
        this.node.getWorldPosition(this._currentPos);
        const t = Math.min(1, this.followSpeed * dt);
        Vec3.lerp(this._currentPos, this._currentPos, this._targetPos, t);

        this.node.setWorldPosition(this._currentPos);
    }

    /**
     * 【新增】：根据摄像机视野大小，动态计算并限制摄像机的位置
     */
    private _applyBounds(pos: Vec3): void {
        if (!this.enableBounds || !this._camera) return;

        // 获取屏幕可视区域尺寸比例
        const visibleSize = view.getVisibleSize();
        const aspect = visibleSize.width / visibleSize.height;

        // 摄像机视野在世界坐标下的一半高和一半宽
        const halfHeight = this._camera.orthoHeight;
        const halfWidth = halfHeight * aspect;

        // 计算摄像机允许移动的最小和最大 XY 坐标
        // 使得视野的边缘永远不会超出 mapBounds 的边缘
        const minX = this._mapBounds.xMin + halfWidth;
        const maxX = this._mapBounds.xMax - halfWidth;
        const minY = this._mapBounds.yMin + halfHeight;
        const maxY = this._mapBounds.yMax - halfHeight;

        // 防止当地图比视野还小时出现的画面翻转反弹，做一次安全保护
        if (minX <= maxX) {
            pos.x = math.clamp(pos.x, minX, maxX);
        } else {
            // 如果视野宽过地图，强制居中
            pos.x = this._mapBounds.center.x;
        }

        if (minY <= maxY) {
            pos.y = math.clamp(pos.y, minY, maxY);
        } else {
            pos.y = this._mapBounds.center.y;
        }
    }
}