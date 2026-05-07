import { Asset, Constructor, assetManager, resources } from 'cc';
import { SingletonManager } from '../base/SingletonManager';

/**
 * 资源组信息
 */
interface IResourceGroup {
    id: string;
    name: string;
    owner?: any;
    assets: Set<string>; // 资源路径集合
    createTime: number;
}

/**
 * 资源引用信息
 */
interface IResourceRef {
    path: string;
    asset: Asset;
    refCount: number;
    groups: Set<string>; // 哪些组引用了这个资源
    loadTime: number;
}

/**
 * 加载选项
 */
interface ILoadOptions {
    priority?: 'low' | 'normal' | 'high';
    bundle?: string;
}

/**
 * 资源报告
 */
interface IResourceReport {
    totalAssets: number;
    totalMemory: number;
    groupsCount: number;
    assetsList: Array<{
        path: string;
        refCount: number;
        size: number;
        groups: string[];
    }>;
}

/**
 * 资源管理器
 * 
 * 功能:
 * - 资源分组管理
 * - 引用计数自动释放
 * - 与组件生命周期绑定
 * - 资源缓存复用
 * 
 * 使用方式:
 * ```typescript
 * // 1. 创建资源组
 * const groupId = ResourceManager.instance.createGroup('MyScene', this);
 * 
 * // 2. 加载资源（自动归属到组）
 * const prefab = await ResourceManager.instance.load('prefabs/item', Prefab, groupId);
 * 
 * // 3. 组件销毁时自动释放资源
 * // 无需手动调用 release
 * ```
 * 
 * @example
 * ```typescript
 * export class GameScene extends Component {
 *     private groupId: string;
 *     
 *     onLoad() {
 *         this.groupId = ResourceManager.instance.createGroup('GameScene', this);
 *     }
 *     
 *     async loadResources() {
 *         const prefab = await ResourceManager.instance.load(
 *             'prefabs/slot/SlotItem',
 *             Prefab,
 *             this.groupId
 *         );
 *         
 *         const texture = await ResourceManager.instance.load(
 *             'textures/bg',
 *             Texture2D,
 *             this.groupId
 *         );
 *     }
 *     
 *     // onDestroy时自动释放该组的所有资源
 * }
 * ```
 */
export class ResourceManager extends SingletonManager {
    /**
     * 资源缓存：路径 -> 资源信息
     */
    private resourceRefs = new Map<string, IResourceRef>();

    /**
     * 资源组映射：组ID -> 资源组信息
     */
    private groups = new Map<string, IResourceGroup>();

    /**
     * 组件 -> 资源组ID的映射（用于自动清理）
     */
    private ownerGroupMap = new WeakMap<any, string>();

    /**
     * 组ID计数器
     */
    private groupIdCounter = 0;

    /**
     * 获取单例实例
     */
    public static get instance(): ResourceManager {
        return ResourceManager.getInstance<ResourceManager>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        ResourceManager.destroyInstance();
    }

    /**
     * 创建资源组
     * 
     * @param name 组名称（用于调试）
     * @param owner 所属对象（通常是Component，用于自动绑定生命周期）
     * @returns 资源组ID
     * 
     * @example
     * ```typescript
     * onLoad() {
     *     const groupId = ResourceManager.instance.createGroup('MyScene', this);
     * }
     * ```
     */
    public createGroup(name: string, owner?: any): string {
        const groupId = `group_${++this.groupIdCounter}_${name}`;

        const group: IResourceGroup = {
            id: groupId,
            name,
            owner,
            assets: new Set(),
            createTime: Date.now()
        };

        this.groups.set(groupId, group);

        // 如果有owner，绑定生命周期
        if (owner && typeof owner === 'object') {
            this.ownerGroupMap.set(owner, groupId);
            this.bindOwnerLifecycle(owner, groupId);
        }

        console.log(`[ResourceManager] Created group: ${groupId}`);
        return groupId;
    }

    /**
     * 绑定owner的生命周期
     * owner销毁时自动释放资源组
     */
    private bindOwnerLifecycle(owner: any, groupId: string): void {
        // 如果owner有onDestroy方法，拦截它
        if (typeof owner.onDestroy === 'function') {
            const originalOnDestroy = owner.onDestroy.bind(owner);

            owner.onDestroy = () => {
                // 先释放资源组
                this.releaseGroup(groupId);

                // 再调用原始的onDestroy
                originalOnDestroy();
            };
        }
    }

    /**
     * 加载资源
     * 
     * @param path 资源路径
     * @param type 资源类型
     * @param groupId 资源组ID（可选）
     * @param options 加载选项（可选）
     * @returns 资源对象
     * 
     * @example
     * ```typescript
     * // 加载Prefab
     * const prefab = await ResourceManager.instance.load(
     *     'prefabs/item',
     *     Prefab,
     *     groupId
     * );
     * 
     * // 加载纹理
     * const texture = await ResourceManager.instance.load(
     *     'textures/bg',
     *     Texture2D,
     *     groupId
     * );
     * ```
     */
    public async load<T extends Asset>(
        path: string,
        type: Constructor<T>,
        groupId?: string,
        options?: ILoadOptions
    ): Promise<T> {
        // 1. 检查缓存
        const cachedRef = this.resourceRefs.get(path);
        if (cachedRef) {
            // 缓存命中，增加引用计数
            this.addRef(path, groupId);
            console.log(`[ResourceManager] Cache hit: ${path} (refCount: ${cachedRef.refCount + 1})`);
            return cachedRef.asset as T;
        }

        // 2. 加载资源
        console.log(`[ResourceManager] Loading: ${path}`);
        const asset = await this.loadAssetAsync<T>(path, type, options);

        // 3. 缓存资源
        const ref: IResourceRef = {
            path,
            asset,
            refCount: 0,
            groups: new Set(),
            loadTime: Date.now()
        };

        this.resourceRefs.set(path, ref);

        // 4. 增加引用计数
        this.addRef(path, groupId);

        return asset;
    }

    /**
     * 实际执行资源加载（使用Cocos的资源系统）
     */
    private loadAssetAsync<T extends Asset>(
        path: string,
        type: Constructor<T>,
        options?: ILoadOptions
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const bundleName = options?.bundle;

            // TODO: 这里可以根据bundleName使用不同的bundle加载
            // 目前使用默认的resources
            resources.load(path, type, (err: Error | null, asset: T) => {
                if (err) {
                    console.error(`[ResourceManager] Load failed: ${path}`, err);
                    reject(err);
                } else {
                    resolve(asset);
                }
            });
        });
    }

    /**
     * 增加资源引用计数
     */
    private addRef(path: string, groupId?: string): void {
        const ref = this.resourceRefs.get(path);
        if (!ref) return;

        ref.refCount++;

        // 记录到资源组
        if (groupId) {
            ref.groups.add(groupId);

            const group = this.groups.get(groupId);
            if (group) {
                group.assets.add(path);
            }
        }
    }

    /**
     * 减少资源引用计数
     */
    private reduceRef(path: string, groupId?: string): void {
        const ref = this.resourceRefs.get(path);
        if (!ref) return;

        ref.refCount = Math.max(0, ref.refCount - 1);

        // 从资源组中移除
        if (groupId) {
            ref.groups.delete(groupId);
        }

        // 引用计数为0时，真正释放资源
        if (ref.refCount === 0) {
            console.log(`[ResourceManager] Releasing asset: ${path}`);
            assetManager.releaseAsset(ref.asset);
            this.resourceRefs.delete(path);
        }
    }

    /**
     * 释放单个资源
     * 
     * @param path 资源路径
     * @param groupId 资源组ID（可选）
     * 
     * @example
     * ```typescript
     * ResourceManager.instance.release('prefabs/item', groupId);
     * ```
     */
    public release(path: string, groupId?: string): void {
        this.reduceRef(path, groupId);
    }

    /**
     * 释放整个资源组
     * 
     * @param groupId 资源组ID
     * 
     * @example
     * ```typescript
     * ResourceManager.instance.releaseGroup(groupId);
     * ```
     */
    public releaseGroup(groupId: string): void {
        const group = this.groups.get(groupId);
        if (!group) {
            console.warn(`[ResourceManager] Group not found: ${groupId}`);
            return;
        }

        console.log(`[ResourceManager] Releasing group: ${groupId} (${group.assets.size} assets)`);

        // 释放组内所有资源
        for (const path of group.assets) {
            this.reduceRef(path, groupId);
        }

        // 清空资源集合
        group.assets.clear();

        // 删除资源组
        this.groups.delete(groupId);
    }

    /**
     * 获取资源（不增加引用计数）
     * 
     * @param path 资源路径
     * @returns 资源对象，不存在返回null
     * 
     * @example
     * ```typescript
     * const texture = ResourceManager.instance.get<Texture2D>('textures/bg');
     * if (texture) {
     *     // 使用纹理
     * }
     * ```
     */
    public get<T extends Asset>(path: string): T | null {
        const ref = this.resourceRefs.get(path);
        return ref ? (ref.asset as T) : null;
    }

    /**
     * 获取资源引用计数
     * 
     * @param path 资源路径
     * @returns 引用计数
     */
    public getRefCount(path: string): number {
        const ref = this.resourceRefs.get(path);
        return ref ? ref.refCount : 0;
    }

    /**
     * 获取资源报告
     * 
     * @returns 资源使用情况报告
     * 
     * @example
     * ```typescript
     * const report = ResourceManager.instance.getResourceReport();
     * console.log('Total assets:', report.totalAssets);
     * console.log('Total memory:', report.totalMemory);
     * ```
     */
    public getResourceReport(): IResourceReport {
        const assetsList: IResourceReport['assetsList'] = [];
        let totalMemory = 0;

        for (const [path, ref] of this.resourceRefs) {
            const size = this.estimateAssetSize(ref.asset);
            totalMemory += size;

            assetsList.push({
                path,
                refCount: ref.refCount,
                size,
                groups: Array.from(ref.groups)
            });
        }

        // 按内存占用排序
        assetsList.sort((a, b) => b.size - a.size);

        return {
            totalAssets: this.resourceRefs.size,
            totalMemory,
            groupsCount: this.groups.size,
            assetsList
        };
    }

    /**
     * 估算资源大小（简化实现）
     */
    private estimateAssetSize(asset: Asset): number {
        // TODO: 根据不同资源类型计算实际大小
        // 这里返回简化的估算值
        return 1024; // 1KB
    }

    /**
     * 打印资源报告到控制台
     */
    public printReport(): void {
        const report = this.getResourceReport();

        console.log('========================================');
        console.log('      Resource Manager Report');
        console.log('========================================');
        console.log(`Total Assets: ${report.totalAssets}`);
        console.log(`Total Memory: ${(report.totalMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Active Groups: ${report.groupsCount}`);
        console.log('========================================');
        console.log('Top 10 Memory Consumers:');
        report.assetsList.slice(0, 10).forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.path} - ${(item.size / 1024).toFixed(2)} KB (ref: ${item.refCount})`
            );
        });
        console.log('========================================');
    }

    /**
     * 获取所有资源组信息
     */
    public getGroups(): IResourceGroup[] {
        return Array.from(this.groups.values());
    }

    /**
     * 清空所有资源（慎用！）
     */
    public clear(): void {
        console.warn('[ResourceManager] Clearing all resources');

        // 释放所有资源
        for (const ref of this.resourceRefs.values()) {
            assetManager.releaseAsset(ref.asset);
        }

        this.resourceRefs.clear();
        this.groups.clear();
        this.groupIdCounter = 0;
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear();
        console.log('[ResourceManager] Destroyed');
    }
}

// 全局声明，方便在浏览器控制台调试
if (typeof window !== 'undefined') {
    (window as any).__ResourceManager__ = ResourceManager.instance;
}
