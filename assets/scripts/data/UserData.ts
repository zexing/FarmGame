import { _decorator } from 'cc';
import { SingletonManager } from '../common/base/SingletonManager';
const { ccclass, property } = _decorator;

/**
 * 用户数据相关
 * 使用统一的单例模式管理
 */
@ccclass('UserData')
export class UserData extends SingletonManager {
    /**
     * 获取单例实例
     */
    public static get instance(): UserData {
        return UserData.getInstance<UserData>();
    }

    /**
     * 销毁单例实例
     */
    public static delInstance(): void {
        UserData.destroyInstance();
    }

    private clear() {
        this._userId = null;
        this._bgm_vol = null;
        this._sound_vol = null;
        this._is_skip_loading = null
        this._is_finish_all_demo = null;
    }


    /**用户uid */
    private _userId: string;
    public get userId() {
        return this._userId;
    }
    public set userId(value) {
        if (value === null || value === undefined || value === "") {
            console.warn("invalid value: ", value);
            return;
        }
        this._userId = value;
    }



    /**背景音量 */
    private _bgm_vol;
    get bgm_vol() {
        if (this._bgm_vol != undefined) return this._bgm_vol;
        let local_save = localStorage.getItem(this._userId + "_bgm_vol");
        if (!local_save) {
            this.bgm_vol = 3;
        } else {
            this._bgm_vol = Number(local_save);
        }
        return this._bgm_vol;
    }
    set bgm_vol(value: number) {
        this._bgm_vol = value;
        localStorage.setItem(this._userId + "_bgm_vol", value.toString());
    }

    /**音效音量 */
    private _sound_vol;
    get sound_vol() {
        if (this._sound_vol != undefined) return this._sound_vol;
        let local_save = localStorage.getItem(this._userId + "_sound_vol");
        if (!local_save) {
            this.sound_vol = 3;
        } else {
            this._sound_vol = Number(local_save);
        }
        return this._sound_vol;
    }
    set sound_vol(value: number) {
        this._sound_vol = value;
        localStorage.setItem(this._userId + "_sound_vol", value.toString());
    }



    /**是否跳过loading */
    private _is_skip_loading: boolean;
    public get is_skip_loading(): boolean {
        if (this._is_skip_loading != undefined) return this._is_skip_loading;
        let local_save = localStorage.getItem(this._userId + "_is_skip_loading");
        this._is_skip_loading = local_save === "1" ? true : false;
        return this._is_skip_loading;
    }
    public set is_skip_loading(value: boolean) {
        this._is_skip_loading = value;
        localStorage.setItem(this._userId + "_is_skip_loading", value ? "1" : "0");
    }



    /**是否完成全部新手引导 */
    private _is_finish_all_demo: boolean;
    public get is_finish_all_demo(): boolean {
        if (this.is_finish_demo1 && this.is_finish_demo2) {
            this._is_finish_all_demo = true;
        } else {
            this._is_finish_all_demo = false;
        }
        return this._is_finish_all_demo;
    }

    /**是否完成新手引导1 */
    private _is_finish_demo1: boolean;
    public get is_finish_demo1(): boolean {
        if (this._is_finish_demo1 != undefined) return this._is_finish_demo1;
        let local_save = localStorage.getItem(this._userId + "_is_finish_demo1");
        this._is_finish_demo1 = local_save === "1" ? true : false;
        return this._is_finish_demo1;
    }
    public set is_finish_demo1(value: boolean) {
        this._is_finish_demo1 = value;
        localStorage.setItem(this._userId + "_is_finish_demo1", value ? "1" : "0");
    }

    /**是否完成新手引导2 */
    private _is_finish_demo2: boolean;
    public get is_finish_demo2(): boolean {
        if (this._is_finish_demo2 != undefined) return this._is_finish_demo2;
        let local_save = localStorage.getItem(this._userId + "_is_finish_demo2");
        this._is_finish_demo2 = local_save === "1" ? true : false;
        return this._is_finish_demo2;
    }
    public set is_finish_demo2(value: boolean) {
        this._is_finish_demo2 = value;
        localStorage.setItem(this._userId + "_is_finish_demo2", value ? "1" : "0");
    }

    /**
     * 销毁时的清理方法
     */
    protected onDestroy(): void {
        this.clear();
        console.log('[UserData] User data cleared');
    }
}


