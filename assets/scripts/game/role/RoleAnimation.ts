import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { ERoleDir, ERoleState } from './IRole';
import { RoleStateMachine } from './RoleStateMachine'; // 假设路径正确

const { ccclass, property } = _decorator;

// 定义一个动画配置接口
interface IAnimConfig {
    frames: SpriteFrame[]; // 该动作对应的序列帧
    fps: number;           // 播放帧率 (例如 10 帧/秒)
    loop: boolean;         // 是否循环
}

@ccclass('RoleAnimation')
export class RoleAnimation extends Component {
    @property(Sprite)
    private sprite: Sprite = null!;

    // 存储所有动画配置的字典。Key 为 "State_Dir" (例如 "1_2" 代表 IDLE_DOWN)
    private _animDict: Map<string, IAnimConfig> = new Map();

    private _currentConfig: IAnimConfig | null = null;
    private _frameIndex: number = 0;
    private _timer: number = 0;
    private _isPlaying: boolean = false;

    public stateMachine: RoleStateMachine = null!;

    public bindStateMachine(fsm: RoleStateMachine) {
        this.stateMachine = fsm;

        // 🌟 核心：直接把自己的私有方法，塞进状态机的回调槽位里！
        // 记得用 .bind(this) 确保 this 指向当前的 RoleAnimation 组件
        this.stateMachine.onStateChanged = this._onStateChanged.bind(this);
    }

    protected onDestroy(): void {
        if (this.stateMachine) {
            // 拔掉插头，防止内存泄露
            this.stateMachine.onStateChanged = null;
        }
    }
    /**
     * 🌟 给外部调用的方法：注册具体的序列帧
     */
    public registerAnim(state: ERoleState, dir: ERoleDir, frames: SpriteFrame[], fps: number = 10, loop: boolean = true) {
        const key = `${state}_${dir}`;
        this._animDict.set(key, { frames, fps, loop });
    }

    private _onStateChanged(state: ERoleState, dir: ERoleDir) {
        const key = `${state}_${dir}`;
        const config = this._animDict.get(key);

        if (config) {
            this._currentConfig = config;
            this._frameIndex = 0; // 重置帧索引
            this._timer = 0;
            this._isPlaying = true;
            this.sprite.spriteFrame = config.frames[0]; // 立刻切第一帧
        } else {
            console.warn(`[RoleAnimation] 缺少动画配置: ${key}`);
        }
    }

    protected update(dt: number): void {
        if (!this._isPlaying || !this._currentConfig || this._currentConfig.frames.length <= 1) return;

        this._timer += dt;
        const frameInterval = 1 / this._currentConfig.fps;

        if (this._timer >= frameInterval) {
            this._timer -= frameInterval; // 保留余数，使帧率更精准
            this._frameIndex++;

            if (this._frameIndex >= this._currentConfig.frames.length) {
                if (this._currentConfig.loop) {
                    this._frameIndex = 0; // 循环
                } else {
                    this._frameIndex = this._currentConfig.frames.length - 1;
                    this._isPlaying = false; // 播放结束
                }
            }
            // 切换图片
            this.sprite.spriteFrame = this._currentConfig.frames[this._frameIndex];
        }
    }
}