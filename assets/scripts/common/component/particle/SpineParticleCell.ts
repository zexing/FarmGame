import { _decorator, Color, Component, sp, UIOpacity, v2, v3, Vec2 } from 'cc';
const { ccclass, executeInEditMode } = _decorator;

/**
 * Spine粒子单元
 * 用于承载单个粒子的运动逻辑
 * 完全基于 Cocos 原生 API，无框架依赖
 */
@ccclass('SpineParticleCell')
@executeInEditMode
export class SpineParticleCell extends Component {

    private _speed: number = 0;
    private _dir: Vec2 = v2(0, -1);
    private _skeleton: sp.Skeleton | null = null;
    private _uiOpacity: UIOpacity | null = null;

    // 物理属性
    private _gravity: Vec2 = v2(0, 0);              // 重力
    private _radialAccel: number = 0;               // 径向加速度
    private _tangentialAccel: number = 0;           // 切向加速度
    
    // 缩放属性
    private _startSize: number = 1;                 // 起始大小
    private _endSize: number = 1;                   // 结束大小
    private _life: number = 1;                      // 粒子生命周期
    private _elapsed: number = 0;                   // 已运行时间
    
    // 透明度属性
    private _startOpacity: number = 255;            // 起始透明度
    private _endOpacity: number = 255;              // 结束透明度
    private _opacityDuration: number = 1.0;         // 透明度变化周期占比(0-1)
    
    // 速度向量（用于物理计算）
    private _velocity: Vec2 = v2(0, 0);             // 当前速度向量

    protected onLoad(): void {
        // 获取 Spine Skeleton 组件
        this._skeleton = this.node.getComponent(sp.Skeleton);
        
        // 获取或添加 UIOpacity 组件
        this._uiOpacity = this.node.getComponent(UIOpacity);
        if (!this._uiOpacity) {
            this._uiOpacity = this.node.addComponent(UIOpacity);
        }
        // console.log(`SpineParticleCell onLoad: enabled=${this.enabled}, node.active=${this.node.active}`);
    }

    protected onEnable(): void {
        // console.log(`SpineParticleCell onEnable: will call update`);
        this.node.scale = v3(0, 0, 1); // 初始化为0，等待update中设置正确大小
    }

    protected onDisable(): void {
        // console.log(`SpineParticleCell onDisable`);
    }

    /**
     * 初始化粒子
     * @param speed 移动速度
     * @param visualAngle 视觉旋转角度（仅用于显示）
     * @param dir 移动方向向量
     * @param animationName Spine动画名称
     * @param gravity 重力
     * @param radialAccel 径向加速度
     * @param tangentialAccel 切向加速度
     * @param startSize 起始大小
     * @param endSize 结束大小
     * @param life 粒子生命周期
     * @param startOpacity 起始透明度(0-255)
     * @param endOpacity 结束透明度(0-255)
     * @param opacityDuration 透明度变化周期占比(0-1)
     * @param colorR 红色通道(0-255)
     * @param colorG 绿色通道(0-255)
     * @param colorB 蓝色通道(0-255)
     */
    public init(
        speed: number, 
        visualAngle: number, 
        dir: Vec2, 
        animationName?: string,
        gravity?: Vec2,
        radialAccel?: number,
        tangentialAccel?: number,
        startSize?: number,
        endSize?: number,
        life?: number,
        startOpacity?: number,
        endOpacity?: number,
        opacityDuration?: number,
        colorR?: number,
        colorG?: number,
        colorB?: number
    ) {
        // 重新获取 Skeleton 组件（可能是动态添加的）
        if (!this._skeleton) {
            this._skeleton = this.node.getComponent(sp.Skeleton);
        }

        // 基础属性
        this._speed = speed;
        this.node.angle = visualAngle;
        this._dir.x = dir.x;
        this._dir.y = dir.y;
        
        // 初始化速度向量
        this._velocity.x = dir.x * speed;
        this._velocity.y = dir.y * speed;

        // 物理属性
        if (gravity) {
            this._gravity.x = gravity.x;
            this._gravity.y = gravity.y;
        }
        this._radialAccel = radialAccel || 0;
        this._tangentialAccel = tangentialAccel || 0;

        // 缩放属性
        this._startSize = startSize || 1;
        this._endSize = endSize || 1;
        this._life = life || 1;
        this._elapsed = 0;
        
        // 透明度属性
        this._startOpacity = startOpacity !== undefined ? startOpacity : 255;
        this._endOpacity = endOpacity !== undefined ? endOpacity : 255;
        this._opacityDuration = opacityDuration !== undefined ? opacityDuration : 1.0;
        
        // 设置初始缩放和透明度
        this.node.setScale(this._startSize, this._startSize, 1);
        if (this._uiOpacity) {
            this._uiOpacity.opacity = this._startOpacity;
        }
        
        // 设置颜色（默认白色255,255,255）
        const r = colorR !== undefined ? colorR : 255;
        const g = colorG !== undefined ? colorG : 255;
        const b = colorB !== undefined ? colorB : 255;
        
        // 对于Spine组件，设置骨骼的颜色
        if (this._skeleton) {
            this._skeleton.color = new Color(r, g, b, 255);
        }

        // 播放 Spine 动画（需要确保 skeletonData 已加载）
        if (this._skeleton && animationName) {
            // 检查 skeleton 是否已经初始化完成
            if (this._skeleton.skeletonData) {
                try {
                    // 确保 skeleton 处于可播放状态
                    this._skeleton.paused = false;
                    this._skeleton.timeScale = 1;
                    
                    // 设置并播放动画
                    const trackEntry = this._skeleton.setAnimation(0, animationName, true);
                    // console.log(`SpineParticleCell: Animation "${animationName}" set successfully, paused=${this._skeleton.paused}, timeScale=${this._skeleton.timeScale}`);
                } catch (e) {
                    // console.error(`SpineParticleCell: Failed to set animation "${animationName}"`, e);
                }
            } else {
                console.warn(`SpineParticleCell: skeletonData not ready, will retry`);
                // 如果 skeleton 还没初始化，等待下一帧再播放
                this.scheduleOnce(() => {
                    if (this._skeleton && this._skeleton.skeletonData) {
                        try {
                            this._skeleton.paused = false;
                            this._skeleton.timeScale = 1;
                            const trackEntry = this._skeleton.setAnimation(0, animationName, true);
                            // console.log(`SpineParticleCell (delayed): Animation "${animationName}" set successfully`);
                        } catch (e) {
                            // console.error(`SpineParticleCell (delayed): Failed to set animation "${animationName}"`, e);
                        }
                    } else {
                        // console.error(`SpineParticleCell (delayed): Still no skeletonData available`);
                    }
                }, 0);
            }
        } else {
            console.warn(`SpineParticleCell: Cannot play animation, skeleton=${!!this._skeleton}, animationName=${animationName}`);
        }
    }


    public playAnimation(animationName: string) {
        if (this._skeleton && this._skeleton.skeletonData) {
            this._skeleton.setAnimation(0, animationName, true);
            // console.log(`SpineParticleCell playAnimation: Playing animation "${animationName}"`);
        }
    }
    protected update(dt: number): void {
        this._elapsed += dt;
        
        const currentPos = this.node.position;
        
        // 1. 应用重力
        this._velocity.x += this._gravity.x * dt;
        this._velocity.y += this._gravity.y * dt;
        
        // 2. 应用径向加速度和切向加速度
        if (this._radialAccel !== 0 || this._tangentialAccel !== 0) {
            // 计算相对于发射点的方向
            const radial = v2(currentPos.x, currentPos.y);
            radial.normalize();
            
            // 切向是径向旋转90度
            const tangential = v2(-radial.y, radial.x);
            
            // 应用径向加速度
            this._velocity.x += radial.x * this._radialAccel * dt;
            this._velocity.y += radial.y * this._radialAccel * dt;
            
            // 应用切向加速度
            this._velocity.x += tangential.x * this._tangentialAccel * dt;
            this._velocity.y += tangential.y * this._tangentialAccel * dt;
        }
        
        // 3. 根据速度更新位置
        const newX = currentPos.x + this._velocity.x * dt;
        const newY = currentPos.y + this._velocity.y * dt;
        this.node.setPosition(newX, newY, currentPos.z);
        
        // 4. 应用大小变化（线性插值）
        if (this._startSize !== this._endSize && this._life > 0) {
            const progress = Math.min(this._elapsed / this._life, 1);
            const currentSize = this._startSize + (this._endSize - this._startSize) * progress;
            this.node.setScale(currentSize, currentSize, 1);
        }
        
        // 5. 应用透明度变化（分阶段线性插值）
        if (this._uiOpacity) {
            if (this._opacityDuration > 0 && this._life > 0) {
                const opacityPhaseTime = this._life * this._opacityDuration;
                let currentOpacity: number;
                
                if (this._elapsed <= opacityPhaseTime) {
                    // 变化阶段：从起始透明度线性过渡到结束透明度
                    const progress = this._elapsed / opacityPhaseTime;
                    currentOpacity = this._startOpacity + (this._endOpacity - this._startOpacity) * progress;
                } else {
                    // 保持阶段：维持结束透明度
                    currentOpacity = this._endOpacity;
                }
                
                this._uiOpacity.opacity = Math.max(0, Math.min(255, currentOpacity));
            } else if (this._opacityDuration === 0) {
                // 不变化，始终保持起始透明度
                this._uiOpacity.opacity = this._startOpacity;
            }
        }
    }
}
