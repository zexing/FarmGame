import { SingletonManager } from "../common/base/SingletonManager";

/**
 * 游戏数据
 * 使用统一的单例模式管理
 */
export class GameData extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): GameData {
        return GameData.getInstance<GameData>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        GameData.destroyInstance();
    }

    private clear() {

    }


    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear();
        console.log('[GameData] Game data cleared');
    }
}


