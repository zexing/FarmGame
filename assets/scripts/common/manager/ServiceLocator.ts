// scripts/common/manager/ServiceLocator.ts

export class ServiceLocator {
    // 存储所有服务的字典
    private static _services: Map<symbol | string, any> = new Map();

    /**
     * 注册服务 (Provide)
     * @param key 服务令牌 (通常是 ServiceKey)
     * @param service 服务的具体实例
     */
    public static provide<T>(key: symbol | string, service: T): void {
        if (this._services.has(key)) {
            console.warn(`[ServiceLocator] 服务被覆盖: ${key.toString()}`);
        }
        this._services.set(key, service);
        console.log(`[ServiceLocator] 成功注册服务: ${key.toString()}`);
    }

    /**
     * 获取服务 (Get)
     * @param key 服务令牌
     */
    public static get<T>(key: symbol | string): T {
        const service = this._services.get(key);
        if (!service) {
            console.error(`❌ [ServiceLocator] 找不到请求的服务: ${key.toString()}`);
        }
        return service as T;
    }

    /**
     * 清理所有服务 (在切换场景或销毁游戏时调用)
     */
    public static clear(): void {
        this._services.clear();
        console.log(`[ServiceLocator] 所有服务已注销`);
    }
}