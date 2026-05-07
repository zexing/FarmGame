// scripts/game/farm/FarmModel.ts
import { ECellState } from '../../const/GameDefine';
import { BaseMVCModel } from '../../mvc/BaseMVCModel';
import { createDefaultCellData, ICellData, IMapModel } from './IMap';

export class MapModel extends BaseMVCModel implements IMapModel {
    //地块数据数组
    private _cellDatas: ICellData[][] = [];

    // //地块组件数组
    // private _cells: GroundCell[][] = [];

    private _rows: number = 0;
    private _cols: number = 0;

    public get rows(): number { return this._rows; }
    public set rows(rows: number) { this._rows = rows; }
    public get cols(): number { return this._cols; }
    public set cols(cols: number) { this._cols = cols }

    public onInit(): void {
        console.log("MapModel onInit!!!!");
    }

    /**
     * 实现 IFarmModel 接口要求的 clear
     * 满足基类 IModel 的约束
     */
    public clear(): void {
        this._cellDatas = [];
        this._rows = 0;
        this._cols = 0;
        console.log("[MapModel] 数据已完全清空");
    }

    public onDestroy(): void {
        // 遵循 MVC 规范，销毁时自动调用 clear
        this.clear();
    }

    public initMapCellDatas(rows: number, cols: number): void {
        // this._rows = rows;
        // this._cols = cols;
        // this._cellDatas = [];
        // for (let r = 0; r < rows; r++) {
        //     const rowArray: ICellData[] = [];
        //     for (let c = 0; c < cols; c++) {
        //         rowArray.push(createDefaultCellData(r, c));
        //     }
        //     this._cellDatas.push(rowArray);
        // }
    }

    public isValidCell(row: number, col: number): boolean {
        return row >= 0 && row < this._rows && col >= 0 && col < this._cols;
    }

    /**
     * 🌟 核心改造：更新格子数据（支持越界自动扩容）
     */
    public updateCellData(data: ICellData): void {
        // 废弃原来的 isValidCell 强硬拦截！因为世界是无限的。
        // if (!this.isValidCell(data.row, data.col)) { return; }

        // 动态开辟行
        if (!this._cellDatas[data.row]) {
            this._cellDatas[data.row] = [];
        }

        // 存入数据
        this._cellDatas[data.row][data.col] = data;
    }

    /**
     * 🌟 核心改造：获取格子数据（懒加载模式）
     */
    public getCellData(row: number, col: number): ICellData {
        // 1. 如果这一行根本就不存在，开辟这一行
        if (!this._cellDatas[row]) {
            this._cellDatas[row] = [];
        }

        // 2. 如果这一列的数据不存在，就在这一瞬间生成默认数据！
        if (!this._cellDatas[row][col]) {
            this._cellDatas[row][col] = createDefaultCellData(row, col);
        }

        // 3. 返回真实数据
        return this._cellDatas[row][col];
    }

    public updateCellState(row: number, col: number, newState: ECellState): void {
        const cell = this.getCellData(row, col);
        if (cell) cell.state = newState;
    }

    public forEachCellData(callback: (cell: ICellData, row: number, col: number) => void): void {
        for (let r = 0; r < this._rows; r++) {
            for (let c = 0; c < this._cols; c++) {
                callback(this._cellDatas[r][c], r, c);
            }
        }
    }

}