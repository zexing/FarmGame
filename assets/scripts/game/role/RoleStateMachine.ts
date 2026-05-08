import { ERoleDir, ERoleState } from './IRole';

export class RoleStateMachine { // 🌟 不再继承任何东西，纯净的 TS 类！
    private _currentState: ERoleState = ERoleState.IDLE;
    private _currentDir: ERoleDir = ERoleDir.DOWN;

    public get state() { return this._currentState; }
    public get dir() { return this._currentDir; }

    // 🌟 定义一个回调委托 (Delegate)
    public onStateChanged: ((state: ERoleState, dir: ERoleDir) => void) | null = null;

    public setStateAndDir(newState: ERoleState, newDir: ERoleDir): boolean {
        let changed = false;

        if (this._currentState !== newState) {
            this._currentState = newState;
            changed = true;
        }

        if (this._currentDir !== newDir) {
            this._currentDir = newDir;
            changed = true;
        }

        if (changed) {
            // 🌟 核心：直接调用委托方法，没有任何事件派发的开销！
            if (this.onStateChanged) {
                this.onStateChanged(this._currentState, this._currentDir);
            }
        }

        return changed;
    }
}