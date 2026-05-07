import { Asset, assetManager, AssetManager } from "cc";

// 声明全局变量类型
declare const CC_DEV: boolean;

export namespace Res {
    const resCache: Map<string, Asset> = new Map();

    /**
     * 加载bundle
     * @param bundleName bundle 名字
     * @returns bundle
     */
    export async function loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>((resolve, reject) => {
            const bundle = assetManager.getBundle(bundleName);
            if (bundle) {
                resolve(bundle);
                return;
            }

            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(bundle);
            });
        });
    }

    /*
    * 加载图集
    */
    export async function loadSpriteAtlas(bundleName: string, key: string) {
        try {
            const atlas = await Res.load(bundleName, key);
            return atlas;
        } catch (err: any) {
            console.error(`load sprite atlas res: ${bundleName} atlas name :${key}`);
        }
    }

    /**
     * 加载资源
     * @param bundleName bundle 名字
     * @param type
     * @param assetUrl 资源路径
     * @returns 资源
     */
    export async function load<T extends Asset>(bundleName: string, assetUrl: string, onProgress?: Function): Promise<T> {
        const key = `${bundleName}-${assetUrl}`;
        const res = resCache.get(key);
        if (res) {
            return res as T;
        }

        return new Promise<T>((resolve, reject) => {
            loadBundle(bundleName)
                .then((bundle) => {
                    bundle.load<T>(
                        `${assetUrl}`,
                        (finish: number, total: number, item: any) => {
                            onProgress && onProgress(finish / total);
                        },
                        (err, asset) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resCache.set(key, asset);
                            resolve(asset);
                        }
                    );
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * 加载远程资源
     * @param assetUrl 资源地址
     * @returns 资源
     */
    export async function loadRemote<T extends Asset>(assetUrl: string, options?: Record<string, any>): Promise<T> {
        const key = `${assetUrl}`;
        const res = resCache.get(key);
        if (res) {
            return res as T;
        }

        return new Promise<T>((resolve, reject) => {
            assetManager.loadRemote<T>(assetUrl, options ?? {}, (err, asset) => {
                if (err) {
                    reject(err);
                    return;
                }

                resCache.set(key, asset);

                resolve(asset);
            });
        });
    }

    export function releaseAssets(bundleName: string, assertUrl?: string) {
        if (assertUrl) {
            // 释放特定资源
            const key = `${bundleName}-${assertUrl}`;
            const res = resCache.get(key);
            if (res) {
                try {
                    res.decRef();
                    resCache.delete(key);
                    console.log(`资源已释放: ${key}`);
                } catch (error) {
                    console.error(`释放资源失败: ${key}`, error);
                }
            }
        } else {
            // 释放所有指定bundle的资源
            const keysToDelete: string[] = [];
            resCache.forEach((asset, key) => {
                if (key.startsWith(`${bundleName}-`)) {
                    try {
                        asset.decRef();
                        keysToDelete.push(key);
                    } catch (error) {
                        console.error(`释放资源失败: ${key}`, error);
                    }
                }
            });

            keysToDelete.forEach(key => resCache.delete(key));
            console.log(`Bundle资源已释放: ${bundleName}, 释放了${keysToDelete.length}个资源`);
        }
    }

    export function releaseBundle(bundleName: string) {
        // 首先释放缓存中的资源
        releaseAssets(bundleName);

        // 然后释放整个Bundle
        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            try {
                bundle.releaseAll();
                assetManager.removeBundle(bundle);
                console.log(`Bundle已完全释放: ${bundleName}`);
            } catch (error) {
                console.error(`释放Bundle失败: ${bundleName}`, error);
            }
        }
    }

    export function clearCache() {
        resCache.clear();
    }

    export function getBundle(bundleName: string) {
        return assetManager.getBundle(bundleName);
    }

    /**
     * 开发模式下的资源泄漏检测
     */
    export function startResourceLeakDetection() {
        // ⚠️ 此功能已禁用，避免内存泄漏
        // setInterval + console.warn 会导致严重内存泄漏
        // 如需监控资源，请使用 MemoryMonitor.getPoolStats()
        return;

        // if (typeof CC_DEV === 'undefined' || !CC_DEV) {
        //     return; // 只在开发模式下启用
        // }

        // let lastCacheSize = resCache.size;

        // setInterval(() => {
        //     const currentSize = resCache.size;

        //     if (currentSize > lastCacheSize + 10) { // 如果资源增长超过10个
        //         console.warn(`🚨 资源缓存增长过快: ${lastCacheSize} → ${currentSize}`);
        //         console.warn('当前缓存的资源:');
        //         resCache.forEach((asset, key) => {
        //             console.warn(`  - ${key}: refs=${asset.refCount}`);
        //         });
        //     }

        //     lastCacheSize = currentSize;
        // }, 10000); // 每10秒检查一次
    }

    /**
     * 获取当前资源缓存状态
     */
    export function getResourceStats() {
        const stats = {
            totalCachedAssets: resCache.size,
            assets: Array.from(resCache.entries()).map(([key, asset]) => ({
                key,
                refCount: asset.refCount,
                isValid: asset.isValid
            }))
        };

        return stats;
    }

    // 在开发模式下自动启动资源泄漏检测
    if (typeof CC_DEV !== 'undefined' && CC_DEV) {
        startResourceLeakDetection();
    }
}