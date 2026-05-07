import { Node, NodePool, Prefab, instantiate } from "cc";
import { SingletonManager } from "../base/SingletonManager";

interface IDictPool {
    [name: string]: NodePool;
}
interface IDictPrefab {
    [name: string]: Prefab;
}

/**
 * 对象池管理器
 * 使用统一的单例模式管理
 */
export class PoolManager extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): PoolManager {
        return PoolManager.getInstance<PoolManager>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        PoolManager.destroyInstance();
    }

    // 🔍 对象池大小警告阈值
    private static readonly POOL_SIZE_WARNING_THRESHOLD = 25;

    private _dictPool: IDictPool = {};
    // private _dictPrefab: IDictPrefab = {};

    // 🔍 测试用：统计节点创建、复用和回收的次数
    private _createCount: { [name: string]: number } = {};
    private _reuseCount: { [name: string]: number } = {};
    private _recycleCount: { [name: string]: number } = {};

    // 🔍 记录已警告过的池，避免重复警告
    private _warnedPools: Set<string> = new Set();    /**
     * 🔍 测试方法：打印节点统计信息
     */
    public printNodeStats(): void {
        // console.log('========== PoolManager 节点统计 ==========');
        // const allNames = new Set([...Object.keys(this._createCount), ...Object.keys(this._recycleCount)]);

        // for (const name of allNames) {
        //     const created = this._createCount[name] || 0;
        //     const reused = this._reuseCount[name] || 0;
        //     const recycled = this._recycleCount[name] || 0;
        //     const leaked = created + reused - recycled;

        //     console.log(`[${name}]`);
        //     console.log(`  创建: ${created} 个`);
        //     console.log(`  复用: ${reused} 个`);
        //     console.log(`  回收: ${recycled} 个`);
        //     console.log(`  未回收(可能泄漏): ${leaked} 个`);

        //     if (leaked > 0) {
        //         console.warn(`  ⚠️ 可能存在内存泄漏！未回收节点: ${leaked} 个`);
        //     }
        // }
        // console.log('==========================================');
    }

    /**
     * 预制体对象池
     * @param prefab //预制体
     * @param parent //父节点对象
     * @returns 
     */
    public getNode(prefab: Prefab, parent: Node = null) {
        if (!prefab || !prefab.data) {
            return;
        }
        let node: Node = null;
        let name: string = prefab.data.name;

        // this._dictPrefab[name] = prefab;
        if (!this._dictPool[name]) {
            this._dictPool[name] = new NodePool();
        }
        if (this._dictPool[name].size() > 0) {
            node = this._dictPool[name].get();
            // console.log(`🔄 [PoolManager] 复用节点: ${name}, 池中剩余: ${this._dictPool[name].size()}`);
            // if (!node.components || node.components.length == 0) {
            //     node = instantiate(prefab);
            // }
            // 🔍 只在创建新节点时统计
            if (!this._reuseCount[name]) {
                this._reuseCount[name] = 0;
            }
            this._reuseCount[name]++;
        } else {
            node = instantiate(prefab);
            // console.log(`🆕 [PoolManager] 创建新节点: ${name}`);
            // 🔍 只在创建新节点时统计
            if (!this._createCount[name]) {
                this._createCount[name] = 0;
            }
            this._createCount[name]++;
        }

        // 🔍 保存预制体原始名称，用于回收时统计（node.name会被修改）
        node['__poolName__'] = name;

        if (parent) {
            node.parent = parent;
        }
        node.active = true;

        return node;
    }
    public putNode(node: Node) {
        if (!node) {
            return;
        }

        // 🔍 统计回收次数 - 使用保存的原始预制体名称
        let name = node['__poolName__'] || node.name;
        if (!this._recycleCount[name]) {
            this._recycleCount[name] = 0;
        }
        this._recycleCount[name]++;

        node.removeFromParent();
        if (!this._dictPool[name]) {
            this._dictPool[name] = new NodePool();
        }
        this._dictPool[name].put(node);
        const poolSize = this._dictPool[name].size();
        // console.log(`♻️ [PoolManager] 回收节点: ${name} (显示名: ${node.name}), 池中数量: ${poolSize}`);

        // 🔍 检查池大小是否超过阈值，只警告一次
        if (poolSize > PoolManager.POOL_SIZE_WARNING_THRESHOLD && !this._warnedPools.has(name)) {
            // console.warn(`⚠️ [PoolManager] 对象池 [${name}] 大小超过阈值！当前: ${poolSize}, 阈值: ${PoolManager.POOL_SIZE_WARNING_THRESHOLD}`);
            this._warnedPools.add(name);
        }
    }

    /***
     * 清空指定预制体对象池
     */
    public clearPoolByPrefab(prefab: Prefab) {
        if (!prefab || !prefab.data) {
            return;
        }
        let name: string = prefab.data.name;
        if (this._dictPool[name]) {

            this._dictPool[name].clear();
            delete this._dictPool[name];
            // delete this._dictPrefab[name];
        }
    }

    /**清除缓存 */
    public clear() {
        this._dictPool = {};
        // this._dictPrefab = {};
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear();
        // console.log('[PoolManager] All pools cleared');
    }
}