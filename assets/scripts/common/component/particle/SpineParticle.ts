import { _decorator, CCFloat, CCInteger, Component, Node, NodePool, sp, v2, Vec2 } from 'cc';
import { EDITOR } from 'cc/env';
import { SpineParticleCell } from './SpineParticleCell';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Spine粒子系统
 * 基于 Cocos2D ParticleSystem2D 的命名规范实现
 * 支持使用 Spine 动画作为粒子的粒子发射器
 * 完全独立，不依赖外部架构
 */
@ccclass('SpineParticle')
@executeInEditMode
export class SpineParticle extends Component {

    // ============ 基础配置 ============

    @property({ type: sp.SkeletonData, displayName: "Spine数据", tooltip: "粒子使用的 Spine 骨骼数据 (Spine skeleton data for particles)" })
    spineData: sp.SkeletonData = null;

    @property({ displayName: "动画名称", tooltip: "要播放的 Spine 动画名称 (Spine animation name to play)" })
    animationName: string = "";

    @property({ type: CCInteger, displayName: "粒子最大数量（限定了1000）", tooltip: "粒子最大数量 (Maximum particles of the system)", range: [1, 1000] })
    totalParticles: number = 100;

    @property({ type: CCFloat, displayName: "发射速率", tooltip: "发射速率 - 每秒发射的粒子数目 (Emission rate of the particles)" })
    emissionRate: number = 10;

    @property({ type: CCFloat, displayName: "持续时间", tooltip: "发射器生存时间(秒)，-1表示持续发射 (How many seconds the emitter will run. -1 means 'forever')" })
    duration: number = -1;

    @property({ displayName: "编辑器预览", tooltip: "在编辑器模式下预览粒子，启用后选中粒子时，粒子将自动播放 (Preview particle system in edit mode)" })
    preview: boolean = true;

    @property({ displayName: "加载时播放", tooltip: "如果设置为 true 运行时会自动发射粒子 (If set to true, the particle system will automatically start playing on onLoad)" })
    playOnLoad: boolean = true;

    @property({ displayName: "完成后自动移除", tooltip: "粒子播放完毕后自动销毁所在的节点 (Indicate whether the owner node will be auto-removed when it has no particles left)" })
    autoRemoveOnFinish: boolean = false;

    // ============ 粒子生命 ============

    @property({ displayName: "粒子生命周期及其变化范围", tooltip: "粒子的运行时间(秒)，X=值, Y=变化范围 (Life of each particle, X=value, Y=variation)" })
    life: Vec2 = v2(3, 0);

    // ============ 运动参数 (Gravity Mode) ============

    @property({ displayName: "速度及其变化范围", tooltip: "速度，X=值, Y=变化范围 (Speed, X=value, Y=variation)" })
    speed: Vec2 = v2(300, 100);

    @property({ displayName: "角度及其变化范围", tooltip: "粒子角度(度)，0°=右，90°=上，180°=左，270°=下，X=值, Y=变化范围 (Angle, X=value, Y=variation)" })
    angle: Vec2 = v2(0, 360);

    @property({ displayName: "发射源位置", tooltip: "发射器位置 (Source position of the emitter)" })
    sourcePos: Vec2 = v2(0, 0);

    @property({ displayName: "位置变化(横向及纵向)", tooltip: "发射器位置的变化范围(横向和纵向) (Variation of source position)" })
    posVar: Vec2 = v2(100, 100);

    @property({ displayName: "重力(横向及纵向)", tooltip: "重力方向和大小 (Gravity of the emitter)" })
    gravity: Vec2 = v2(0, 0);

    @property({ displayName: "径向加速度及其变化范围", tooltip: "粒子径向加速度，即平行于重力方向的加速度，X=值, Y=变化范围 (Radial acceleration, X=value, Y=variation)" })
    radialAccel: Vec2 = v2(0, 0);

    @property({ displayName: "切向加速度及其变化范围", tooltip: "粒子切向加速度，即垂直于重力方向的加速度，X=值, Y=变化范围 (Tangential acceleration, X=value, Y=variation)" })
    tangentialAccel: Vec2 = v2(0, 0);

    // ============ 旋转参数 ============

    @property({ displayName: "起始自旋角度及其变化范围", tooltip: "粒子开始自旋角度(度)，X=值, Y=变化范围 (Start spin angle, X=value, Y=variation)" })
    startSpin: Vec2 = v2(0, 360);

    @property({ displayName: "结束自旋角度及其变化范围", tooltip: "粒子结束自旋角度(度)，X=值, Y=变化范围 (End spin angle, X=value, Y=variation)" })
    endSpin: Vec2 = v2(0, 0);

    // ============ 大小参数 (可选) ============

    @property({ displayName: "起始大小及其变化范围", tooltip: "粒子的初始大小，X=值, Y=变化范围 (Start size, X=value, Y=variation)" })
    startSize: Vec2 = v2(1, 0);

    @property({ displayName: "结束大小及其变化范围", tooltip: "粒子结束时的大小，X=值, Y=变化范围 (End size, X=value, Y=variation)" })
    endSize: Vec2 = v2(1, 0);

    // ============ 透明度参数 (可选) ============

    @property({ displayName: "起始透明度及其变化范围", tooltip: "粒子的初始透明度(0-255)，X=值, Y=变化范围 (Start opacity, X=value, Y=variation)", range: [0, 255] })
    startOpacity: Vec2 = v2(255, 0);

    @property({ displayName: "结束透明度及其变化范围", tooltip: "粒子结束时的透明度(0-255)，X=值, Y=变化范围 (End opacity, X=value, Y=variation)", range: [0, 255] })
    endOpacity: Vec2 = v2(255, 0);

    @property({ type: CCFloat, displayName: "透明度变化周期占比", tooltip: "透明度变化占粒子生命周期的比重(0-1)，0=不变化始终保持起始透明度，1=全程变化，0.5=前半段变化后半段保持结束透明度 (Opacity transition duration ratio, 0=no change, 1=full lifetime, 0.5=first half changes)", range: [0, 1, 0.01], slide: true })
    opacityDuration: number = 1.0;

    // ============ 颜色参数 (可选) ============

    @property({ displayName: "初始随机颜色", tooltip: "是否为每个粒子随机生成颜色，不勾选则保持白色 (Randomize particle color on initialization, unchecked keeps white)" })
    randomColor: boolean = false;

    // ============ 私有变量 ============

    private _stopped: boolean = true;
    private _emitCounter: number = 0;
    private _elapsed: number = 0;
    private _particleCount: number = 0;
    private _previewTimer: number | null = null;
    private _focused: boolean = false;
    private _nodePool: NodePool | null = null;
    private _particleTimers: Map<Node, number> = new Map();  // 存储粒子的定时器

    // ============ 公共接口 ============

    /**
     * 当前播放的粒子数量 (Current quantity of particles that are being simulated)
     */
    public get particleCount(): number {
        return this._particleCount;
    }

    /**
     * 指示粒子播放是否完毕 (Indicate whether the system simulation have stopped)
     */
    public get stopped(): boolean {
        return this._stopped;
    }

    protected onLoad(): void {
        // 初始化对象池
        this._initNodePool();

        if (!this.spineData) {
            console.warn("SpineParticle: spineData is null");
            return;
        }

        // 自动播放（仅运行时）
        if (EDITOR) {
            // 编辑器模式下，如果开启预览则自动播放
            if (this.preview) {
                this.scheduleOnce(() => {
                    this.resetSystem();
                }, 0);
            }
        } else {
            // 运行时模式
            if (this.playOnLoad) {
                this.scheduleOnce(() => {
                    this.resetSystem();
                }, 0);
            }
        }
    }

    protected onDestroy(): void {

        // 清理所有定时器
        this._particleTimers.forEach((timerId) => {
            this.unschedule(timerId as any);
        });
        this._particleTimers.clear();

        // 清理对象池
        if (this._nodePool) {
            this._nodePool.clear();
            this._nodePool = null;
        }
    }

    /**
     * 初始化节点对象池
     */
    private _initNodePool(): void {
        this._nodePool = new NodePool();
    }

    /**
     * 编辑器聚焦回调（当在编辑器中选中此节点时）
     */
    public onFocusInEditor(): void {
        this._focused = true;
        if (this.preview) {
            this._startPreview();
        }
    }

    /**
     * 编辑器失焦回调（当在编辑器中取消选中此节点时）
     */
    public onLostFocusInEditor(): void {
        this._focused = false;
        if (this.preview) {
            this._stopPreview();
        }
    }

    /**
     * 开始预览
     */
    private _startPreview(): void {
        if (this.preview && this.spineData) {
            this.resetSystem();
        }
    }

    /**
     * 停止预览
     */
    private _stopPreview(): void {
        if (this._previewTimer) {
            clearInterval(this._previewTimer);
            this._previewTimer = null;
        }
        this.resetSystem();
        this.stopSystem();
    }

    protected update(dt: number): void {
        if (this._stopped) {
            return;
        }

        // 更新运行时间
        if (this.duration !== -1) {
            this._elapsed += dt;
            if (this._elapsed >= this.duration) {
                this.stopSystem();
                return;
            }
        }

        // 发射粒子
        const rate = 1.0 / this.emissionRate;
        this._emitCounter += dt;

        while (!this.isFull() && this._emitCounter > rate) {
            this.addParticle();
            this._emitCounter -= rate;
        }

        // 检查是否所有粒子都消失了
        if (this._particleCount === 0 && this._elapsed >= this.duration && this.duration !== -1) {
            this._finishedSimulation();
        }
    }

    // ============ 核心方法 (API) ============

    /**
     * 添加一个粒子到发射器中 (Add a particle to the emitter)
     */
    public addParticle(): void {
        if (this.isFull()) {
            return;
        }

        if (!this.spineData) {
            console.warn("SpineParticle: spineData is null");
            return;
        }

        // 从对象池获取或创建节点
        let particleNode: Node = null;
        if (this._nodePool.size() > 0) {
            particleNode = this._nodePool.get();
        } else {
            particleNode = this._createParticleNode();
        }

        if (!particleNode) {
            console.warn("SpineParticle: Failed to create particle node");
            return;
        }

        // 将节点添加到当前节点下
        particleNode.setParent(this.node);

        // 计算随机生命周期
        const particleLife = this.life.x + this.life.y * (Math.random() * 2 - 1);

        // 计算随机速度
        const randomSpeed = this.speed.x + this.speed.y * (Math.random() * 2 - 1);

        // 计算随机角度
        const randomAngle = this.angle.x + this.angle.y * (Math.random() * 2 - 1);

        // 计算移动方向向量
        const radian = randomAngle * Math.PI / 180;
        const dir = v2(Math.cos(radian), Math.sin(radian));

        // 计算随机视觉角度
        const randomStartSpin = this.startSpin.x + this.startSpin.y * (Math.random() * 2 - 1);

        // 计算随机初始位置
        const randomX = this.sourcePos.x + this.posVar.x * (Math.random() * 2 - 1);
        const randomY = this.sourcePos.y + this.posVar.y * (Math.random() * 2 - 1);
        particleNode.setPosition(randomX, randomY, 0);

        // 计算随机初始缩放（如果需要）
        const randomStartSize = this.startSize.x + this.startSize.y * (Math.random() * 2 - 1);
        const randomEndSize = this.endSize.x + this.endSize.y * (Math.random() * 2 - 1);

        // 计算随机加速度
        const randomRadialAccel = this.radialAccel.x + this.radialAccel.y * (Math.random() * 2 - 1);
        const randomTangentialAccel = this.tangentialAccel.x + this.tangentialAccel.y * (Math.random() * 2 - 1);

        // 计算随机透明度
        const randomStartOpacity = Math.max(0, Math.min(255, this.startOpacity.x + this.startOpacity.y * (Math.random() * 2 - 1)));
        const randomEndOpacity = Math.max(0, Math.min(255, this.endOpacity.x + this.endOpacity.y * (Math.random() * 2 - 1)));

        // 生成随机颜色（如果开启）
        let randomColorR = 255;
        let randomColorG = 255;
        let randomColorB = 255;
        if (this.randomColor) {
            randomColorR = Math.floor(Math.random() * 256);
            randomColorG = Math.floor(Math.random() * 256);
            randomColorB = Math.floor(Math.random() * 256);
        }

        // 先激活节点，确保 Skeleton 组件正确初始化
        particleNode.active = true;

        // 延迟一帧初始化粒子组件，确保 Skeleton 已经初始化完成
        this.scheduleOnce(() => {
            const particleComp = particleNode.getComponent(SpineParticleCell);
            if (particleComp) {
                particleComp.init(
                    randomSpeed, 
                    randomStartSpin, 
                    dir, 
                    this.animationName,
                    this.gravity,           // 重力
                    randomRadialAccel,      // 径向加速度
                    randomTangentialAccel,  // 切向加速度
                    randomStartSize,        // 起始大小
                    randomEndSize,          // 结束大小
                    particleLife,           // 生命周期
                    randomStartOpacity,     // 起始透明度
                    randomEndOpacity,       // 结束透明度
                    this.opacityDuration,   // 透明度变化周期占比
                    randomColorR,           // 随机颜色R
                    randomColorG,           // 随机颜色G
                    randomColorB            // 随机颜色B
                );
            } else {
                console.warn("SpineParticle: SpineParticleCell component not found");
            }
        }, 0);

        this._particleCount++;

        // 设置生命周期，到时间后回收
        const timerId = this.scheduleOnce(() => {
            this._recycleParticle(particleNode);
        }, particleLife);

        this._particleTimers.set(particleNode, timerId as any);
    }

    /**
     * 创建一个新的粒子节点
     */
    private _createParticleNode(): Node {
        const node = new Node('SpineParticle');

        // 添加 Spine 组件
        let skeleton = node.getComponent(sp.Skeleton);
        if (!skeleton) {
            skeleton = node.addComponent(sp.Skeleton);
        }
        skeleton.skeletonData = this.spineData;

        // // 设置默认材质和其他属性
        // skeleton.premultipliedAlpha = false;
        skeleton.timeScale = 1;

        // console.log(`Created particle node with skeleton data: ${this.spineData ? this.spineData.name : 'null'}`);

        if (!node.getComponent(SpineParticleCell)) {
            node.addComponent(SpineParticleCell);
        }

        return node;
    }

    /**
     * 停止发射器发射粒子，发射出去的粒子将继续运行，直至粒子生命结束
     * (Stop emitting particles. Running particles will continue to run until they die)
     */
    public stopSystem(): void {
        this._stopped = true;
    }

    /**
     * 杀死所有存在的粒子，然后重新启动粒子发射器
     * (Kill all living particles, then restart the particle emitter)
     */
    public resetSystem(): void {
        this._stopped = false;
        this._elapsed = 0;
        this._emitCounter = 0;
        this._particleCount = 0;
        this.clearAllParticles();
    }

    /**
     * 发射器中粒子是否大于等于设置的总粒子数量
     * (Whether or not the system is full)
     */
    public isFull(): boolean {
        return this._particleCount >= this.totalParticles;
    }

    /**
     * 清理所有粒子 (Clear all particles)
     */
    public clearAllParticles(): void {
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            const particleNode = this.node.children[i];
            this._recycleParticle(particleNode);
        }
        this._particleCount = 0;
    }

    /**
     * 一次性发射指定数量的粒子 (Emit specified number of particles instantly)
     */
    public emit(count: number): void {
        for (let i = 0; i < count && !this.isFull(); i++) {
            this.addParticle();
        }
    }

    // ============ 私有方法 ============

    /**
     * 回收粒子
     */
    private _recycleParticle(particleNode: Node): void {
        if (!particleNode || !particleNode.isValid) {
            return;
        }

        this._particleCount = Math.max(0, this._particleCount - 1);

        // 清理定时器
        const timerId = this._particleTimers.get(particleNode);
        if (timerId) {
            this._particleTimers.delete(particleNode);
        }

        // // 停用粒子组件
        // const particleComp = particleNode.getComponent(SpineParticleCell);
        // if (particleComp) {
        //     particleComp.enabled = false;
        // }

        // // 停止 Spine 动画
        // const skeleton = particleNode.getComponent(sp.Skeleton);
        // if (skeleton) {
        //     skeleton.clearTracks();
        // }

        // 移除父节点
        particleNode.removeFromParent();
        particleNode.active = false;

        // 放入对象池
        if (this._nodePool) {
            this._nodePool.put(particleNode);
        }
    }

    /**
     * 粒子播放完成
     */
    private _finishedSimulation(): void {
        this._stopped = true;

        if (this.autoRemoveOnFinish) {
            this.node.destroy();
        }
    }

    // ============ 兼容性方法（与原 DropCoinView 保持接口兼容）============

    /**
     * @deprecated 使用 resetSystem() 代替
     */
    public startDropCoins(): void {
        this.resetSystem();
    }

    /**
     * @deprecated 使用 stopSystem() 代替
     */
    public stopDropCoins(): void {
        this.stopSystem();
    }

    /**
     * @deprecated 使用 emit(count) 代替
     */
    public dropCoinsInstantly(count: number = -1): void {
        const dropCount = count > 0 ? count : this.totalParticles;
        this.emit(dropCount);
    }

    /**
     * 设置发射参数 (批量设置参数的便捷方法)
     */
    public setEmitterParams(params: {
        totalParticles?: number,
        emissionRate?: number,
        duration?: number,
        life?: Vec2,
        speed?: Vec2,
        angle?: Vec2,
        sourcePos?: Vec2,
        posVar?: Vec2,
        gravity?: Vec2,
        radialAccel?: Vec2,
        tangentialAccel?: Vec2,
        startSpin?: Vec2,
        endSpin?: Vec2,
        startSize?: Vec2,
        endSize?: Vec2,
        startOpacity?: Vec2,
        endOpacity?: Vec2,
        opacityDuration?: number,
        randomColor?: boolean
    }): void {
        if (params.totalParticles !== undefined) this.totalParticles = params.totalParticles;
        if (params.emissionRate !== undefined) this.emissionRate = params.emissionRate;
        if (params.duration !== undefined) this.duration = params.duration;
        if (params.life !== undefined) this.life = params.life;
        if (params.speed !== undefined) this.speed = params.speed;
        if (params.angle !== undefined) this.angle = params.angle;
        if (params.sourcePos !== undefined) this.sourcePos = params.sourcePos;
        if (params.posVar !== undefined) this.posVar = params.posVar;
        if (params.gravity !== undefined) this.gravity = params.gravity;
        if (params.radialAccel !== undefined) this.radialAccel = params.radialAccel;
        if (params.tangentialAccel !== undefined) this.tangentialAccel = params.tangentialAccel;
        if (params.startSpin !== undefined) this.startSpin = params.startSpin;
        if (params.endSpin !== undefined) this.endSpin = params.endSpin;
        if (params.startSize !== undefined) this.startSize = params.startSize;
        if (params.endSize !== undefined) this.endSize = params.endSize;
        if (params.startOpacity !== undefined) this.startOpacity = params.startOpacity;
        if (params.endOpacity !== undefined) this.endOpacity = params.endOpacity;
        if (params.opacityDuration !== undefined) this.opacityDuration = params.opacityDuration;
        if (params.randomColor !== undefined) this.randomColor = params.randomColor;
    }
}
