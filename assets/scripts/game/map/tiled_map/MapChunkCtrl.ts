import { Node, resources, TiledMap, TiledMapAsset, Vec3 } from 'cc';
import { ECellState, MapConst, MapLayerName } from '../../../const/GameDefine';
import { BaseMVCSubCtrl } from '../../../mvc/BaseMVCSubCtrl';
import { IMapModel, IMapView } from '../IMap';

const CHUNK_ROWS = 32;
const CHUNK_COLS = 32;

/**
 * 🗺️ 地图区块控制器 (MVC SubCtrl)
 * 职责：负责 TiledMap 区块的动态加载与无缝拼接
 */
export class MapChunkCtrl extends BaseMVCSubCtrl {

    protected _model: IMapModel;
    protected _view: IMapView;

    // 活跃地图块 (Key: "x,y")
    private _activeChunks: Map<string, Node> = new Map();
    // 正在加载中的标记
    private _loadingChunks: Set<string> = new Set();
    // 当前可视需求
    private _currentVisibleKeys: Set<string> = new Set();

    private _lastChunkX: number = -999;
    private _lastChunkY: number = -999;

    /**
     * 🚀 核心逻辑：根据主角所在的格子坐标，调度区块加载
     */
    public async updateChunks(centerRow: number, centerCol: number): Promise<void> {
        // 直接利用传进来的行列号，算出主角当前所在的 Chunk 坐标
        // 注意：等轴测坐标系中，列对应 X，行对应 Y
        const currentChunkX = Math.floor(centerCol / CHUNK_COLS);
        const currentChunkY = Math.floor(centerRow / CHUNK_ROWS);

        if (this._lastChunkX === currentChunkX && this._lastChunkY === currentChunkY) {
            return; // 还在同一个区块里溜达，跳过
        }

        this._lastChunkX = currentChunkX;
        this._lastChunkY = currentChunkY;

        // 1. 更新可视区域
        this._currentVisibleKeys.clear();
        for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
            if (x < 0 || (x > MapConst.WORLD_CHUNKS_COL - 1)) continue;
            for (let y = currentChunkY - 1; y <= currentChunkY + 1; y++) {
                if (y < 0 || (y > MapConst.WORLD_CHUNKS_ROW - 1)) continue;
                this._currentVisibleKeys.add(`${x},${y}`);
            }
        }

        // 2. 卸载不再需要的远方区块
        this._unloadFarChunks();

        // // 3. 加载新进入视野的区块
        // for (const key of this._currentVisibleKeys) {
        //     if (!this._activeChunks.has(key) && !this._loadingChunks.has(key)) {
        //         this._loadChunkAsync(key);
        //     }
        // }

        // 收集所有需要加载的异步任务
        const loadPromises: Promise<void>[] = [];

        for (const key of this._currentVisibleKeys) {
            if (!this._activeChunks.has(key) && !this._loadingChunks.has(key)) {
                // 把异步加载任务塞进数组
                loadPromises.push(this._loadChunkAsync(key));
            }
        }

        // 🌟 核心：等待这批视野内的地图块【全部】加载并解析完毕！
        if (loadPromises.length > 0) {
            await Promise.all(loadPromises);
        }
    }

    private _unloadFarChunks(): void {
        const toRemove: string[] = [];
        this._activeChunks.forEach((node, key) => {
            if (!this._currentVisibleKeys.has(key)) toRemove.push(key);
        });

        toRemove.forEach(key => {
            const node = this._activeChunks.get(key);
            if (node) {
                node.destroy(); // 这里也可以走 PoolManager
                this._activeChunks.delete(key);
            }
        });
    }

    private async _loadChunkAsync(key: string): Promise<void> {

        return new Promise<void>(resolve => {
            const [xStr, yStr] = key.split(',');
            const x = parseInt(xStr);
            const y = parseInt(yStr);
            const resPath = `maps/chunk_${x}_${y}`;

            this._loadingChunks.add(key);

            // 🌟 核心修改 1：加载类型从 Prefab 改为 TiledMapAsset
            resources.load(resPath, TiledMapAsset, (err, tmxAsset) => {
                this._loadingChunks.delete(key);

                if (err) {
                    console.warn(`[TiledMapCtrl] 找不到地图文件: ${resPath}`);
                    return;
                }

                // 异步校验：如果玩家已经跑远了，放弃生成
                if (this._lastChunkX < x - 1 || this._lastChunkX > x + 1 ||
                    this._lastChunkY < y - 1 || this._lastChunkY > y + 1) {
                    return;
                }

                // 🌟 核心修改 2：彻底抛弃 instantiate，全动态组装！
                // 凭空创建一个空节点
                const chunkNode = new Node(`chunk_${x}_${y}`);
                chunkNode.layer = 1;// 设置为Map层

                // 给空节点挂载 TiledMap 组件
                const tiledMapComp = chunkNode.addComponent(TiledMap);

                // 将刚刚加载到的地图数据资产，赋值给组件！引擎会自动在底层生成所有的地表 Layer！
                tiledMapComp.tmxAsset = tmxAsset;

                // 计算等轴测偏移位置 (保持你原本完美的数学公式)
                const baseRow = y * CHUNK_ROWS;
                const baseCol = x * CHUNK_COLS;
                const screenX = (baseCol - baseRow) * (MapConst.CELL_WIDTH / 2);
                const screenY = -(baseCol + baseRow) * (MapConst.CELL_HEIGHT / 2);

                chunkNode.setPosition(new Vec3(screenX, screenY, 0));

                // 塞进 View 层的容器
                this._view.tiledMapContainer.addChild(chunkNode);
                this._activeChunks.set(key, chunkNode);

                // 解析逻辑层数据 (石头、河流等阻挡)
                this._parseChunkLogic(chunkNode, x, y);

                // 🌟 插入点：每次新区块加入后，立刻对整个大世界进行一次洗牌排序！
                this._sortActiveChunks();

                console.log(`✨ 动态组装 TiledMap 成功: ${key}`);

                resolve();
            });
        })
    }


    /**
     * 🌟 核心：根据等轴测规则，对所有当前活跃的区块进行渲染层级重排
     * 规则：X 越大，Y 越大，层级越高 (渲染越靠上)
     */
    private _sortActiveChunks(): void {
        // 1. 获取所有当前活跃的区块 Key (例如 "0,0", "1,0")
        const keys = Array.from(this._activeChunks.keys());

        // 2. 根据等轴测深度公式进行排序
        keys.sort((a, b) => {
            const [ax, ay] = a.split(',').map(Number);
            const [bx, by] = b.split(',').map(Number);

            const weightA = ax + ay;
            const weightB = bx + by;

            // 如果权重相等 (比如 0,1 和 1,0)，则按 X 排序保证渲染稳定性
            if (weightA === weightB) {
                return ax - bx;
            }
            // 权重越大，排在数组越后面
            return weightA - weightB;
        });

        // 3. 按照排序后的顺序，依次强制重置它们的节点层级！
        keys.forEach((key, index) => {
            const chunkNode = this._activeChunks.get(key);
            if (chunkNode && chunkNode.isValid) {
                // setSiblingIndex 是 Cocos 控制 2D 渲染顺序的终极 API
                // index 越大，渲染越晚，越盖在别人上面
                chunkNode.setSiblingIndex(index);
            }
        });

        // console.log(`[MapChunkCtrl] 区块层级重排完成，当前活跃区块数: ${keys.length}`);
    }


    /**
     * 🌟 核心：极速解析 TiledMap 区块的逻辑层
     */
    private _parseChunkLogic(chunkNode: Node, chunkX: number, chunkY: number): void {
        const tiledMap = chunkNode.getComponent(TiledMap);
        if (!tiledMap) return;

        const logicLayer = tiledMap.getLayer(MapLayerName.Logic);
        if (!logicLayer) return;

        const baseRow = chunkY * MapConst.CHUNK_SIZE;
        const baseCol = chunkX * MapConst.CHUNK_SIZE;

        // 🌟 优化 1：建立【局部 GID 缓存字典】
        // 记录已经查过的 GID 对应的状态，绝不向引擎底层询问第二次同样的问题！
        const gidStateCache = new Map<number, ECellState>();

        // 遍历 32x32 格子
        for (let r = 0; r < MapConst.CHUNK_SIZE; r++) {
            for (let c = 0; c < MapConst.CHUNK_SIZE; c++) {

                const gid = logicLayer.getTileGIDAt(c, r);

                // 🌟 优化 2：彻底信任懒加载！
                // 透明格子代表默认状态(Untilled)，交给 MapModel 的懒加载去兜底，这里直接飞过！
                if (gid === 0) continue;

                // --- 能走到这里的，只有真正在 Tiled 里画了阻挡/特殊逻辑的格子（占比极少） ---

                let state = ECellState.Untilled;

                // 🌟 优化 1 落地：查缓存
                if (gidStateCache.has(gid)) {
                    state = gidStateCache.get(gid)!;
                } else {
                    // 只有第一次遇到这个 GID 时，才去麻烦引擎底层
                    const props = tiledMap.getPropertiesForGID(gid);
                    if (props && props.logicType) {
                        if (props.logicType === ECellState[ECellState.Locked]) {
                            state = ECellState.Locked;
                        }
                        // 如果有其他类型，继续写 else if
                    }
                    // 查完立刻存入缓存
                    gidStateCache.set(gid, state);
                }

                // 局部 -> 绝对坐标转换
                const globalRow = baseRow + r;
                const globalCol = baseCol + c;

                // 🌟 优化 3：精准防覆盖
                // 直接向 Model 索要数据 (触发懒加载)，判断它是不是被玩家改造过了
                const cellData = this._model.getCellData(globalRow, globalCol);

                // 只有当这个格子处于最原始的“未开垦”状态时，我们才把地图编辑器里的配置刷进去
                // 如果它已经是 Tilled(已耕种) 或 Seeded(已播种)，说明这是玩家留下的存档，绝对不能覆盖！
                if (cellData.state === ECellState.Untilled) {
                    cellData.state = state;
                    // 由于获取的是引用，只要修改了对象属性，Model 里也就同步更新了，连 updateCellData 都不用调！
                }
            }
        }

        console.log(`⚡ [MapChunkCtrl] 区块 (${chunkX}, ${chunkY}) 逻辑数据极速解析完毕！`);
    }


}