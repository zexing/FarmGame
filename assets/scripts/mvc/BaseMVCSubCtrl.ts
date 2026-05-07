import { IMVCModel, IMVCSubCtrl, IMVCView } from "./IBaseMVC";

export class BaseMVCSubCtrl implements IMVCSubCtrl {

    protected _model: IMVCModel;
    protected _view: IMVCView;

    init(model: IMVCModel, view: IMVCView): void {
        this._model = model;
        this._view = view;
    }
    
    destroy(): void {
        this._model = undefined;
        this._view = undefined;
    }

}


