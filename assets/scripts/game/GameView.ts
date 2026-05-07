import { _decorator } from 'cc';
import { BaseMVCView } from '../mvc/BaseMVCView';
import { GameController } from './GameController';
import { GameModel } from './GameModel';
import { MapView } from './map/MapView';
import { PlayerView } from './player/PlayerView';
const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends BaseMVCView<GameModel, GameController> {

    protected createModel(): GameModel {
        return new GameModel();
    }
    protected createController(): GameController {
        return new GameController();
    }


    @property(MapView)
    mapView: MapView = null;

    @property(PlayerView)
    playerView: PlayerView = null;


    protected start(): void {
        
        this.controller.bindControllers(this.mapView.controller, this.playerView.controller);
        this.controller.initGameWorld();
    }

}


