import { Asset, AssetManager, assetManager, resources, SpriteFrame } from "cc";
import { SingletonManager } from "../base/SingletonManager";
import { isEmpty, isNil } from "../common_utils/Globals";


export class ResInfo {
    readonly respath: string;
    readonly bundleName: string;
    readonly options?: Record<string, any>;
    uikey?: string;
}

export function createResInfo(respath: string, bundleName: string): ResInfo {
    return {
        respath: respath,
        bundleName: bundleName,
    }
}

function getResUrl(info): string {
    if (info.bundleName && info.bundleName > 0) {
        return info.bundleName + '/' + info.respath;
    }
    return info.respath;
}


// 加载进度回调
export type ProcessCallback = (completedCount: number, totalCount: number, item: any) => void;
// 加载完成回调
export type CompletedCallback = (error: Error, resource: any | any[]) => void;


interface hv {
    h: string;
    v: string;
}

/**
 * Bundle管理器
 * 使用统一的单例模式管理
 */
export class BundleManager extends SingletonManager {

    public static readonly bundleName: string = 'resources';

    /**
     * 获取单例实例
     */
    public static get instance(): BundleManager {
        return BundleManager.getInstance<BundleManager>();
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        console.log('[BundleManager] Cleared');
    }

    public getBundle(bundleName: string): AssetManager.Bundle {
        if (isEmpty(bundleName)) { return resources; }
        return assetManager.getBundle(bundleName);
    }

    public loadBundle(bundleName: string, options: Record<string, any>, cb: (err: Error, bundle: AssetManager.Bundle) => void) {
        let bun = this.getBundle(bundleName);
        if (bun) {
            if (cb) { cb(null, bun); }
            return;
        }

        console.log("======> load bundle begin ", bundleName);

        if (isNil(options)) {
            assetManager.loadBundle(bundleName, (err: Error, bundle: AssetManager.Bundle) => {
                if (err) {
                    console.warn("load bundle fial: ", bundleName, err);
                } else {
                    console.log("======> load bundle end ", bundleName);
                }
                if (cb) { cb(err, bundle); }
            });
        } else {
            assetManager.loadBundle(bundleName, options, (err: Error, bundle: AssetManager.Bundle) => {
                if (err) {
                    console.warn("load bundle fial: ", bundleName, err);
                } else {
                    console.log("======> load bundle end ", bundleName);
                }
                if (cb) { cb(err, bundle); }
            });
        }
    }

    public releaseBundle(bundleName: string) {
        if (bundleName === null || bundleName === undefined || bundleName == "" || bundleName === "resources") {
            return;
        }
        let bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
            console.log("======> release bundle: ", bundleName);
        }
    }

    public loadRes(info: ResInfo, type: typeof Asset, cbComplete: CompletedCallback, cbProgress?: ProcessCallback) {
        if (isNil(info)) {
            if (cbComplete) { cbComplete(new Error("info is invalid"), null); }
            return;
        }

        let url = getResUrl(info);
        if (isEmpty(url)) {
            if (cbComplete) { cbComplete(new Error("url is invalid"), null); }
            return;
        }

        if (type == SpriteFrame) {
            url += "/spriteFrame";
        }

        this.loadBundle(info.bundleName, info.options, (err, bundle) => {
            if (err) {
                if (cbComplete) cbComplete(err, null);
                return;
            }

            var rsc = bundle.get(url, type);
            if (rsc) {
                if (cbComplete) { cbComplete(null, rsc); }
                return;
            }

            if (cbComplete) {
                if (cbProgress) {
                    bundle.load(url, type, cbProgress, (e, r) => {
                        cbComplete(e, r);
                    });
                } else {
                    bundle.load(url, type, (e, r) => {
                        cbComplete(e, r);
                    });
                }
            }
        });
    }


}


