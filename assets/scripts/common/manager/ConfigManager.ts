// scripts/common/manager/ConfigManager.ts
import { JsonAsset, resources } from 'cc';
import { SingletonManager } from '../base/SingletonManager';

/** * 内部接口：专门用于匹配紧凑型 JSON 的结构 
 */
interface ICompactConfig {
    keys: string[];
    data: any[][];
}

export class ConfigManager extends SingletonManager {

    // 【核心改造 1】：万能嵌套字典。外层 Key 是表名(如 'CropConfig')，内层 Key 是数据的主键(id)
    private _configs: Map<string, Map<string | number, any>> = new Map();

    public init(): void {
        console.log("[ConfigManager] 初始化完毕");
    }

    /**
     * 自动加载并解析 configs 目录下的所有紧凑型 JSON 配置文件
     */
    public async loadAllConfigs(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 【核心改造 2】：使用 loadDir 加载整个文件夹，以后加新表完全不需要改这里的代码！
            resources.loadDir('configs', JsonAsset, (err, assets: JsonAsset[]) => {
                if (err) {
                    console.error('[ConfigManager] 批量加载配置失败', err);
                    return reject(err);
                }

                this._configs.clear();

                // 遍历所有读取到的 json 文件
                assets.forEach((asset: JsonAsset) => {
                    const tableName = asset.name; // 自动获取文件名作为表名（比如 'CropConfig'）
                    const compactData = asset.json as ICompactConfig;

                    // 容错处理：确保文件符合我们的紧凑型结构
                    if (compactData && compactData.keys && compactData.data) {
                        const keys = compactData.keys;
                        const rows = compactData.data;
                        const tableMap = new Map<string | number, any>();

                        // 遍历二维数组，动态拼装对象
                        for (let i = 0; i < rows.length; i++) {
                            const rowArr = rows[i];
                            const cfg: any = {};

                            for (let j = 0; j < keys.length; j++) {
                                let cellValue = rowArr[j];

                                // 🌟 核心升级：自动识别并解析 Excel 里的数组或复杂对象！
                                // 如果读到的是字符串，并且以 '[' 开头、']' 结尾
                                if (typeof cellValue === 'string' && cellValue.startsWith('[') && cellValue.endsWith(']')) {
                                    try {
                                        cellValue = JSON.parse(cellValue); // 将 "[1,3]" 变成真正的数组 [1, 3]
                                    } catch (e) {
                                        console.warn(`[ConfigManager] 表 [${tableName}] 第 ${i} 行的数组解析失败: ${cellValue}`);
                                    }
                                }

                                cfg[keys[j]] = cellValue;
                            }
                            // 默认所有配置表都必须有一个名为 'id' 的字段
                            // 并且紧跟着id的后一列要作为此配置表的逐渐
                            if (cfg.id !== undefined && cfg.id !== null) {
                                const only_key = keys[1];

                                // console.log(tableName + " only_key: ", only_key);
                                tableMap.set(cfg[only_key], cfg);
                            } else {
                                console.warn(`[ConfigManager] 表 [${tableName}] 第 ${i} 行缺失 'id' 主键字段！`);
                            }
                        }

                        // 将这张表存入总字典
                        this._configs.set(tableName, tableMap);
                        console.log(`[ConfigManager] 成功加载表: ${tableName}，共 ${rows.length} 条数据`);
                    }
                });

                console.log(`[ConfigManager] 🌍 所有静态配表加载完美闭环！`);
                resolve();
            });
        });
    }

    /**
     * 【核心改造 3】：通用的单行配置查询接口
     * @param tableName 表名 (比如 "CropConfig")
     * @param key 数据的唯一标识 ID
     */
    public getConfigByKey<T>(tableName: string, key: string | number): T | null {
        const tableMap = this._configs.get(tableName);
        if (tableMap && tableMap.has(key)) {
            return tableMap.get(key) as T;
        }
        console.warn(`[ConfigManager] 未找到表 [${tableName}] 中 key 为 [${key}] 的数据！`);
        return null;
    }

    /**
     * 【附加赠送】：获取整张表的所有数据（转成数组），方便做 UI 列表（比如商店列表、图鉴等）
     * @param tableName 表名
     */
    public getTable<T>(tableName: string): T[] {
        const tableMap = this._configs.get(tableName);
        if (tableMap) {
            return Array.from(tableMap.values()) as T[];
        }
        return [];
    }

    /**
     * 修复之前的遗留问题，实现父类的抽象清理方法
     */
    protected onDestroy(): void {
        this.clear();
    }

    public clear(): void {
        this._configs.clear();
        console.log("[ConfigManager] 所有配置数据已彻底清理");
    }
}