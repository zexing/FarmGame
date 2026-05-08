/**
 * 虚拟摇杆视图 — JoystickView
 *
 * 职责：
 * - 接收屏幕触摸输入，将手指位移转化为归一化方向向量 (dx, dy)
 * - 通过 direction 属性实时输出给 PlayerMover
 * - 摇杆底盘固定在屏幕左下角；摇杆头跟随手指，限制在底盘半径内
 * - 手指抬起后自动归零并归中
 *
 * 节点结构（挂在 UI Canvas 下）：
 * ```
 * JoystickView  (挂本组件，全屏触摸区域)
 *   ├── JoystickBase   ← 底盘 Sprite（半透明圆）
 *   └── JoystickThumb  ← 摇杆头 Sprite（小圆）
 * ```
 *
 * 注意：本组件只负责 UI 呈现与输入采集，不依赖任何游戏逻辑。
 */

import { _decorator, Component, EventTouch, Node, UITransform, v2, v3, Vec2, Vec3 } from 'cc';
import { EventManager } from '../../common/manager/EventManager';
import { InputEvents } from '../../events/InputEvents';

const { ccclass, property } = _decorator;


// ─────────────────────────────────────────────────────────────────────────────
// JoystickView
// ─────────────────────────────────────────────────────────────────────────────

@ccclass('JoystickView')
export class JoystickView extends Component {

    // ── Editor 属性 ──────────────────────────────────────────────────────────

    /** 摇杆底盘节点 */
    @property({ type: Node, tooltip: '摇杆底盘节点（半透明圆形背景）' })
    joystickBase: Node = null!;

    /** 摇杆头节点（跟随手指移动的小圆） */
    @property({ type: Node, tooltip: '摇杆头节点（跟随手指移动）' })
    joystickThumb: Node = null!;

    @property({ type: Node, tooltip: '摇杆节点' })
    joystickNode: Node = null!;


    /**
     * 底盘半径（像素）
     * 摇杆头偏移不会超过此值
     */
    @property({ tooltip: '底盘半径（像素），摇杆头最大偏移距离' })
    radius: number = 80;

    /**
     * 死区阈值（0~1）
     * direction 长度小于此值时视为静止，不触发移动
     */
    @property({ tooltip: '死区阈值（0~1），小于此值视为静止' })
    deadZone: number = 0.2;

    // ── 运行时 ────────────────────────────────────────────────────────────────

    /** 当前归一化方向向量，长度 0~1，由 PlayerMover 每帧读取 */
    private _direction: Vec2 = v2(0, 0);

    /** 触摸 ID，用于多点触控时区分摇杆手指 */
    private _touchId: number = -1;

    /** 底盘初始本地坐标 */
    private _baseOrigin: Vec2 = v2(0, 0);

    // ── Cocos 生命周期 ────────────────────────────────────────────────────────

    protected onLoad(): void {
        if (this.joystickBase) {
            const pos = this.joystickBase.position;
            this._baseOrigin = v2(pos.x, pos.y);
        }
        this._hideJoystick();
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this._reset();
    }

    // ── 公开接口 ──────────────────────────────────────────────────────────────

    /** 当前归一化方向向量（长度 0~1） */
    public get direction(): Vec2 {
        return this._direction;
    }

    /** 是否正在输入（方向向量长度超过死区） */
    public get isActive(): boolean {
        return this._direction.length() > this.deadZone;
    }

    // ── 触摸处理 ──────────────────────────────────────────────────────────────

    private _onTouchStart(e: EventTouch): void {
        const loc = e.getUILocation();
        const uiTrans = this.joystickNode.parent.getComponent(UITransform);
        if (!uiTrans) return;

        if (this._touchId !== -1) return;  // 已有摇杆触摸，忽略多点
        this._touchId = e.getID();
        e.propagationStopped = true;
        const node_pos = uiTrans.convertToNodeSpaceAR(v3(loc.x, loc.y));
        this._updataJoystickPos(node_pos)
    }

    private _onTouchMove(e: EventTouch): void {
        if (e.getID() !== this._touchId) return;

        const start = e.getUIStartLocation();
        const cur = e.getUILocation();

        let dx = cur.x - start.x;
        let dy = cur.y - start.y;

        // 限制在半径内
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.radius) {
            dx = dx / dist * this.radius;
            dy = dy / dist * this.radius;
        }

        // 更新摇杆头位置
        if (this.joystickThumb) {
            this.joystickThumb.setPosition(
                this._baseOrigin.x + dx,
                this._baseOrigin.y + dy,
                0,
            );
        }

        // 更新方向向量（归一化到 0~1）
        this._direction = v2(dx / this.radius, dy / this.radius);
        e.propagationStopped = true;

        EventManager.instance.dispatchEvent(InputEvents.JOYSTICK_MOVE, this._direction);
    }

    private _onTouchEnd(e: EventTouch): void {
        if (e.getID() !== this._touchId) return;
        this._reset();
        e.propagationStopped = true;
        this._hideJoystick();
        EventManager.instance.dispatchEvent(InputEvents.JOYSTICK_END);
    }

    // ── 内部 ──────────────────────────────────────────────────────────────────

    private _reset(): void {
        this._touchId = -1;
        this._direction = v2(0, 0);

        // 摇杆头归中
        if (this.joystickThumb) {
            this.joystickThumb.setPosition(
                this._baseOrigin.x,
                this._baseOrigin.y,
                0,
            );
        }
    }

    /**设置轮盘节点的位置 */
    private _updataJoystickPos(pos: Vec3) {
        this.joystickNode.active = true;
        this.joystickNode.setPosition(pos);
        this.joystickBase.setPosition(0, 0);
        this.joystickThumb.setPosition(0, 0);
    }

    private _hideJoystick() {
        this.joystickNode.active = false;
    }
}
