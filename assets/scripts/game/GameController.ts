import Adaptor from "../common/Adaptor";
import { SingletonManager } from "../common/base/SingletonManager";
import { ConfigManager } from "../common/manager/ConfigManager";
import { EventManager } from "../common/manager/EventManager";
import { InputManager } from "../common/manager/InputManager";
import { ServiceLocator } from "../common/manager/ServiceLocator";
import { UIManager } from "../common/manager/UIManager";
import { UIID } from "../common/ui/base/UIConfig";
import { ServiceKey } from "../const/ServiceDefine";
import { SystemEvents } from "../events/SystemEvents";
import { BaseMVCController } from "../mvc/BaseMVCController";
import { GameModel } from "./GameModel";
import { GameView } from "./GameView";
import { InventoryManager } from "./inventory/InventoryManager";
import { IMapController } from "./map/IMap";
import { IPlayercontroller } from "./player/IPlayer";
import { ToolManager } from "./tool/ToolManager";

export class GameController extends BaseMVCController<GameModel, GameView> {


    protected onInit(): void {
        console.log("GameController onInit!!!!");
        InventoryManager.instance.add("101", 5);
        // 👂 监听底层的飘字需求
        EventManager.getInstance().on(SystemEvents.GameTip, this._onGameTip, this);
    }

    /**
     * 游戏销毁时的清理逻辑
     */
    protected onDestroy(): void {
        EventManager.getInstance().off(SystemEvents.GameTip, this._onGameTip, this);
        // 使用你源码中定义的专属大招，一键清空所有监听！
        SingletonManager.destroyAllInstances();
        super.onDestroy();
    }

    private _mapController: IMapController;
    private _playerController: IPlayercontroller;

    /** 绑定各个总控制器 */
    public bindControllers(
        mapController: IMapController,
        playerController: IPlayercontroller) {
        this._mapController = mapController;
        this._playerController = playerController;

        // 【重构后】：只需要登记上架！
        ServiceLocator.provide(ServiceKey.IMapController, mapController);
        ServiceLocator.provide(ServiceKey.IPlayerController, playerController);
        // ServiceLocator.provide(ServiceKey.IFarmController, farmController);
    }

    // ─── 初始化装配流水线 ─────────────────────────────────────────────────────

    public async initGameWorld(): Promise<void> {
        console.log("======== 🌍 游戏世界初始化开始 ========");

        //屏幕尺寸适配
        Adaptor.listenScreen();

        // // // 🚀 唤醒常驻 HUD：快捷工具栏！
        // UIManager.instance.openView(UIID.ToolBar);

        // 阶段 0：唤醒大管家系统下的核心单例
        InputManager.getInstance();
        ToolManager.getInstance(); // ✅ 唤醒武器库！

        // 阶段 1：加载静态数据字典
        await ConfigManager.getInstance().loadAllConfigs();

        // 阶段 2：实体生成
        this._playerController.spawnPlayer();

        const { row, col } = this._playerController.getCurrentRowCol();
        await this._mapController.updateViewport(row, col);

        console.log("======== 🚀 游戏世界初始化完美闭环 ========");
    }

    /**
     * 接收到底层工具/系统的飘字事件，转交给 UIManager
     */
    private _onGameTip(payload: { msg: string }): void {
        // 🚀 通过统一框架打开跑马灯层的 UIToastPop，并将 payload 传入
        UIManager.instance.openView(UIID.Toast, payload);
    }

}


