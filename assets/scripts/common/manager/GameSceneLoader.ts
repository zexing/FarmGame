import { Component, find, instantiate, Node, Prefab, UITransform } from "cc";
import { SingletonManager } from "../base/SingletonManager";
import { BundleManager, createResInfo } from "./BundleManager";

/**
 * 游戏场景加载器
 * 职责：管理游戏主场景的加载、实例化和生命周期
 * 与UIManager分离，避免"游戏场景"和"UI"混淆
 * 使用统一的单例模式管理
 */
export class GameSceneLoader extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): GameSceneLoader {
        return GameSceneLoader.getInstance<GameSceneLoader>();
    }

    private _gameRoot: Node = null;
    private _currentGameScene: Node = null;

    /**
     * 获取或创建 GameRoot 节点
     * GameRoot 是游戏场景的容器，挂载在 Canvas 下，独立于 UIRoot
     */
    private getOrCreateGameRoot(): Node {
        if (this._gameRoot && this._gameRoot.isValid) {
            return this._gameRoot;
        }

        const canvas = find('Canvas');
        if (!canvas) {
            console.error('[GameSceneLoader] Canvas not found!');
            return null;
        }

        // 查找已存在的 GameRoot
        let gameRoot = canvas.getChildByName('GameRoot');
        if (!gameRoot) {
            // 创建新的 GameRoot
            gameRoot = new Node('GameRoot');

            // 添加 UITransform 组件并设置为全屏
            let transform = gameRoot.getComponent(UITransform);
            if (!transform) {
                transform = gameRoot.addComponent(UITransform);
            }
            const canvasTransform = canvas.getComponent(UITransform);
            if (canvasTransform) {
                transform.setContentSize(canvasTransform.contentSize);
            }

            // 设置锚点为中心
            transform.setAnchorPoint(0.5, 0.5);

            // 设置位置为 (0, 0)，相对于 Canvas 中心
            gameRoot.setPosition(0, 0, 0);

            // 插入到 Canvas 的索引 1 位置（索引 0 保留给 Camera）
            canvas.insertChild(gameRoot, 1);
            console.log('[GameSceneLoader] GameRoot created with full canvas size at index 1');
        }

        this._gameRoot = gameRoot;
        return this._gameRoot;
    }

    /**
     * 加载游戏场景
     * @param prefabPath 场景预制体路径
     * @param bundleName Bundle名称
     * @param onProgress 加载进度回调
     * @returns Promise<Node> 返回实例化的游戏场景节点
     */
    public async loadGameScene(
        prefabPath: string,
        bundleName: string = BundleManager.bundleName,
        onProgress?: (progress: number) => void
    ): Promise<Node> {
        return new Promise((resolve, reject) => {
            // 如果已经有游戏场景在运行，先清理
            if (this._currentGameScene && this._currentGameScene.isValid) {
                console.log('[GameSceneLoader] Cleaning existing game scene');
                this._currentGameScene.destroy();
                this._currentGameScene = null;
            }

            console.log(`[GameSceneLoader] Loading game scene: ${prefabPath}`);

            BundleManager.instance.loadRes(
                createResInfo(prefabPath, bundleName),
                Prefab,
                (err, prefab: Prefab) => {
                    if (err) {
                        console.error('[GameSceneLoader] Load failed:', err);
                        reject(err);
                        return;
                    }

                    try {
                        // 实例化场景
                        const gameScene = instantiate(prefab);
                        // 保留原始名称，不要重命名
                        // gameScene.name = 'GameScene'; // 已移除，保留 prefab 原名

                        // 挂载到 GameRoot
                        const gameRoot = this.getOrCreateGameRoot();
                        if (!gameRoot) {
                            reject(new Error('GameRoot creation failed'));
                            return;
                        }

                        gameRoot.addChild(gameScene);
                        this._currentGameScene = gameScene;

                        console.log(`[GameSceneLoader] Game scene "${gameScene.name}" loaded successfully`);
                        resolve(gameScene);
                    } catch (error) {
                        console.error('[GameSceneLoader] Instantiate failed:', error);
                        reject(error);
                    }
                },
                onProgress
            );
        });
    }

    /**
     * 卸载当前游戏场景
     */
    public unloadGameScene(): void {
        if (this._currentGameScene && this._currentGameScene.isValid) {
            console.log('[GameSceneLoader] Unloading game scene');
            this._currentGameScene.destroy();
            this._currentGameScene = null;
        }
    }

    /**
     * 获取当前游戏场景节点
     */
    public getCurrentGameScene(): Node {
        return this._currentGameScene;
    }

    /**
     * 获取游戏场景上的组件
     */
    public getGameSceneComponent<T extends Component>(type: new () => T): T {
        if (this._currentGameScene && this._currentGameScene.isValid) {
            return this._currentGameScene.getComponent(type);
        }
        return null;
    }

    /**
     * 清理资源
     */
    public clear(): void {
        this.unloadGameScene();

        if (this._gameRoot && this._gameRoot.isValid) {
            this._gameRoot.destroy();
            this._gameRoot = null;
        }
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear();
        console.log('[GameSceneLoader] Game scene cleared');
    }
}
