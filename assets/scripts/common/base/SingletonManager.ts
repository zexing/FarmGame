export abstract class SingletonManager {
    /**
     * 使用类本身作为 key，避免类名被混淆导致的错误
     */
    private static instances: Map<Function, SingletonManager> = new Map();

    /**
     * 获取单例实例
     */
    public static getInstance<T extends SingletonManager>(this: new () => T): T {
        if (!SingletonManager.instances.has(this)) {
            const instance = new this();
            SingletonManager.instances.set(this, instance);

            if (typeof instance.onInit === 'function') {
                instance.onInit();
            }

            // console.log(`[SingletonManager] Created instance: ${this.name}`);
        }

        return SingletonManager.instances.get(this) as T;
    }

    /**
     * 销毁单例实例
     */
    public static destroyInstance(this: new () => any): void {
        const instance = SingletonManager.instances.get(this);

        if (instance) {
            // console.log(`[SingletonManager] Destroying instance: ${this.name}`);

            if (typeof instance.onDestroy === 'function') {
                instance.onDestroy();
            }

            SingletonManager.instances.delete(this);
        } else {
            console.warn(`[SingletonManager] Instance not found: ${this.name}`);
        }
    }

    /**
     * 销毁所有实例
     */
    public static destroyAllInstances(): void {
        // console.log('[SingletonManager] Destroying all instances...');

        const instances = Array.from(SingletonManager.instances.entries()).reverse();

        for (const [cls, instance] of instances) {
            // console.log(`[SingletonManager] Destroying: ${cls.name}`);
            if (typeof instance.onDestroy === 'function') {
                instance.onDestroy();
            }
        }

        SingletonManager.instances.clear();
    }

    /**
     * 检查是否存在实例
     */
    public static hasInstance(this: new () => any): boolean {
        return SingletonManager.instances.has(this);
    }

    /**
     * 可选初始化
     */
    protected onInit?(): void;

    /**
     * 必须实现的销毁方法
     */
    protected abstract onDestroy(): void;
}
