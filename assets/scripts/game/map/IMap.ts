import { Node, Prefab, Vec3 } from "cc";
import { ECellState } from "../../const/GameDefine";

// 作物数据接口
export interface ICropData {
    cropId: number;//作物id
    plantDay: number;//种植天数
    harvestCount: number;//收获数量
    growStage: number;//种植阶段
    isWatered: boolean;//浇水标签
}

// 地图格子数据接口
export interface ICellData extends ICropData {
    row: number;
    col: number;
    state: ECellState;
}

/**
 * 🏭 数据工厂：统一生产一个干净的、默认的格子数据
 * @param row 所在行
 * @param col 所在列
 */
export function createDefaultCellData(row: number, col: number): ICellData {
    return {
        // 空间状态数据
        row: row,
        col: col,
        state: ECellState.Untilled,

        // 作物数据 (初始为空)
        cropId: 0,
        plantDay: 0,
        harvestCount: 0,
        growStage: 0,
        isWatered: false,
    };
}

/**
 * 🧹 数据清洗：统一重置一个格子的作物数据
 * 专供“收割”、“跨季枯萎”、“铁锹铲除”时调用
 */
export function clearCropData(cell: ICellData): void {
    if (!cell) return;

    // 清空作物本体数据
    cell.cropId = 0;
    cell.plantDay = 0;
    cell.harvestCount = 0;
    cell.isWatered = false;

    // 清空作物表现数据
    cell.growStage = 0;
}

/** 地图数据层接口 */
export interface IMapModel {
    rows: number;
    cols: number;
    initMapCellDatas(r: number, c: number): void;
    // initMapDataFromTiled(r: number, c: number, l: TiledLayer);
    updateCellData(data: ICellData);
    getCellData(row: number, col: number): ICellData | null;
    forEachCellData(callback: (cell: ICellData, row: number, col: number) => void): void;
    clear(): void;
}

/** 地图视图层接口 */
export interface IMapView {

    tiledMapContainer: Node;

    groundCellPrefab: Prefab;

    gridContainer: Node;

    cursorNode: Node;

    refreshCell(row: number, col: number, cell: ICellData): void;
    refreshAllCells(): void;

}

/** 地图控制层接口 */
export interface IMapController {

    // 获取地图地块总行数
    getRows(): number;

    // 获取地图地块总列数
    getCols(): number;

    /** 格子坐标转屏幕坐标 */
    isoToScreen(row: number, col: number): Vec3;

    /** 屏幕坐标转格子坐标 */
    screenToIso(x: number, y: number): { row: number, col: number };

    /** 获取指定格子坐标的地块数据 */
    getCellData(row: number, col: number): ICellData | null;

    /** 初始化可视地块区域（默认以地图中心绘制） */
    initViewPort(): Promise<void>;

    /** 更新可视地块区域 */
    updateViewport(centerRow: number, centerCol: number): Promise<void>;

}