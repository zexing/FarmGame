# 技术架构设计文档

> 创建时间：2026-04-13
> 引擎：Cocos Creator 3.8.6 · TypeScript
> 基于：[game-design-discussion.md](./game-design-discussion.md) 所有已确认设计决策
> 完善 MVC 分层，明确 45° 坐标转换逻辑。

---

## 一、整体架构原则

1. **复用现有 MVC 框架**：`BaseController / BaseModel / BaseMVCView / ICtrlBase` 全部保留，所有业务模块继承这套基类
2. **模块化隔离**：每个游戏系统（农场/作物/时间/背包…）是独立的 MVC 单元，通过 `EventManager` 通信，禁止跨模块直接持有引用
3. **配置数据驱动**：作物、建筑、配方等所有静态数据放在 `config/` 目录的 JSON 配置表里，代码只读配置，不硬编码数值
4. **存档与运行时分离**：`SaveData`（持久化结构）与 `RuntimeData`（运行时对象）严格区分，存档只保存最小化数据
5. **严格 MVC：View 脚本（如 GroundCell）禁止修改数据，仅通过监听事件刷新 UI。**
6. **坐标对齐：使用 IsoMath 工具类处理 125x98 的等距坐标转换，GroundGridView 动态计算 mapOffsetY 以对齐 TiledMap。**


---

## 二、目录结构

```
assets/scripts/
│
├── common/           ✅ 现有，完整保留
│   ├── base/         BaseComponent, SingletonManager
│   ├── manager/      EventManager, UIManager, AudioManager,
│   │                 GameTimerManager, PoolManager, ResourceManager
│   └── ...           工具类、UI组件等
│
├── mvc/              ✅ 现有，完整保留
│   ├── ICtrlBase.ts
│   ├── BaseModel.ts
│   ├── BaseController.ts
│   └── BaseMVCView.ts
│
├── config/           🆕 静态配置表（只读数据，不参与存档）
│   ├── CropConfig.ts       作物配置（ID/名称/季节/生长天数/价格）
│   ├── BuildingConfig.ts   建筑配置（ID/类型/建造材料/解锁等级）
│   ├── RecipeConfig.ts     加工配方（建筑ID/输入/输出/耗时）
│   ├── LivestockConfig.ts  养殖配置（动物ID/产出/喂养/周期）
│   ├── LevelConfig.ts      等级经验配置（每级所需EXP/解锁内容）
│   └── ExploreConfig.ts    探索区资源节点配置
│
├── data/             ⚠️ 保留并重写业务数据
│   ├── GameData.ts         ✅ 保留单例结构，清空Slot业务数据
│   ├── UserData.ts         ✅ 保留单例结构，重写为玩家数据
│   ├── SaveManager.ts      🆕 存档管理（本地读写/序列化）
│   └── save/               🆕 存档数据结构定义
│       ├── FarmSaveData.ts       农场格子存档结构
│       ├── PlayerSaveData.ts     玩家存档结构
│       ├── BuildingSaveData.ts   建筑存档结构
│       └── WorldTimeSaveData.ts  游戏内时间存档结构
│
├── events/           ⚠️ 完全重写（清除所有Slot事件）
│   ├── FarmEvents.ts       农场操作事件
│   ├── CropEvents.ts       作物生长事件
│   ├── PlayerEvents.ts     玩家数据变化事件
│   ├── TimeEvents.ts       时间/季节/天气事件
│   ├── UIEvents.ts         ✅ 保留结构，内容重写
│   ├── SystemEvents.ts     ✅ 保留
│   ├── EventPayloads.ts    ⚠️ 重写为种田游戏事件载荷
│   └── index.ts            统一导出
│
├── const/            ⚠️ 保留结构，重写枚举内容
│   └── GameDefine.ts       游戏常量（格子状态/季节/天气/作物阶段枚举）
│
└── game/             🆕 业务逻辑主目录
    │
    ├── world/              世界时间系统（独立单例，不走MVC）
    │   └── WorldTimeManager.ts   游戏内日期/季节/天气/行动点管理
    │
    ├── farm/               农场地图模块
    │   ├── IFarm.ts              接口定义
    │   ├── FarmModel.ts          格子数据、地块状态
    │   ├── FarmController.ts     地块操作逻辑（开垦/播种/浇水/收获）
    │   └── FarmView.ts           农场地图渲染、格子Prefab管理
    │
    ├── crop/               作物系统（子控制器，归属 FarmController）
    │   ├── ICrop.ts
    │   ├── CropStateMachine.ts   作物生长状态机（种子→发芽→生长→成熟→枯萎）
    │   └── CropRenderer.ts       单格作物渲染组件
    │
    ├── player/             玩家系统
    │   ├── IPlayer.ts
    │   ├── PlayerModel.ts        等级/经验/金币/特殊材料
    │   ├── PlayerController.ts   升级逻辑/传送移动
    │   ├── PlayerView.ts         主角Sprite/动画
    │   └── InventoryManager.ts   背包管理（物品叠加/增删）
    │
    ├── building/           建筑系统
    │   ├── IBuilding.ts
    │   ├── BuildingModel.ts      已建造建筑列表/加工队列
    │   ├── BuildingController.ts 建造/拆除/加工逻辑
    │   └── BuildingView.ts       建筑渲染
    │
    ├── livestock/          养殖系统
    │   ├── ILivestock.ts
    │   ├── LivestockModel.ts     动物列表/喂养状态/产出计时
    │   ├── LivestockController.ts 喂养/收取产出逻辑
    │   └── LivestockView.ts      动物渲染
    │
    ├── explore/            探索系统
    │   ├── IExplore.ts
    │   ├── ExploreModel.ts       行动点/资源节点状态
    │   ├── ExploreController.ts  采集逻辑/行动点消耗
    │   └── ExploreView.ts        探索区地图渲染
    │
    ├── npc/                NPC系统
    │   ├── INpc.ts
    │   ├── NpcModel.ts           NPC状态/任务进度/好感度（预留）
    │   ├── NpcController.ts      对话触发/任务发布与验收
    │   └── NpcView.ts            NPC渲染/气泡显示
    │
    ├── shop/               商店系统（商人NPC的交易界面）
    │   ├── ShopModel.ts          商品列表/库存
    │   ├── ShopController.ts     买卖逻辑
    │   └── ShopView.ts           商店UI
    │
    └── scene/              场景入口（顶层组装）
        ├── GameScene.ts          主场景，组装所有模块
        └── UIScene.ts            UI覆盖层，管理HUD和弹窗
```

---

## 三、核心系统详细设计

### 3.1 世界时间系统 `WorldTimeManager`

> **独立单例**，不走 MVC，所有模块通过它查询当前时间状态

```typescript
// 核心数据结构
interface IWorldTime {
    day:     number;   // 当天是第几天（1~30）
    season:  Season;   // 当前季节 Spring/Summer/Autumn/Winter
    year:    number;   // 当前年份
    weather: Weather;  // 当日天气（每天重新生成）
    timeOfDay: number; // 0~1，一天内的时间进度（用于光照变化）
}

// 时间推进：每 600 秒现实时间 = 1 游戏天
// 由 GameTimerManager 每帧累计，满 600s 触发 onDayEnd()
// 天结束时依次触发：
//   1. 作物生长推进
//   2. 建筑加工推进
//   3. 养殖产出推进
//   4. 探索区资源刷新
//   5. 行动点重置
//   6. 新天气生成
//   7. 检查季节切换
```

**时间事件流：**
```
WorldTimeManager.tick(dt)
  → 累计时间满 600s
  → emit TimeEvents.DayEnd { day, season, year }
  → FarmController  监听 → 推进所有作物生长阶段
  → BuildingController 监听 → 推进加工进度
  → LivestockController 监听 → 推进产出计时
  → ExploreController 监听 → 重置行动点 + 刷新节点
  → emit TimeEvents.NewWeather { weather }   → UI 更新天气图标
  → 如果 day > 30 → emit TimeEvents.SeasonChanged → 切换季节
```

---

### 3.2 农场格子系统 `FarmModel`

```typescript
// 格子状态枚举
enum CellState {
    Locked     = 0,  // 未解锁（灰色荒地）
    Empty      = 1,  // 空地（可开垦）
    Tilled     = 2,  // 已耕地（可播种）
    Planted    = 3,  // 已种植（生长中）
    Harvestable = 4, // 可收获
    Withered   = 5,  // 已枯萎（季节切换后未收获）
}

// 单格存档数据（最小化存储）
interface ICellSaveData {
    state:       CellState;
    cropId?:     string;   // 作物配置ID，如 "crop_tomato"
    plantDay?:   number;   // 种植时的游戏绝对天数
    growStage?:  number;   // 当前生长阶段（0~N）
    watered?:    boolean;  // 今天是否已浇水
    fertilized?: boolean;  // 是否施肥（加速生长）
}

// 农场Model持有二维数组
class FarmModel extends BaseModel {
    private cells: ICellSaveData[][];  // [row][col]
    private gridSize: { rows: number; cols: number };
}
```

---

### 3.3 作物生长状态机 `CropStateMachine`

```
作物生长阶段（以番茄为例，共5阶段）：

  [种子] → [发芽] → [小苗] → [开花] → [成熟] → 收获
    0         1        2        3        4

每天天结束时检查：
  - 当天浇水 → 正常推进 1 阶段
  - 未浇水   → 跳过（阶段不推进，但不扣阶段）
  - 施肥     → 额外 +1 阶段
  - 季节不符 → 已种植的跨季作物变为 Withered

多次收获型作物（番茄）：
  到达成熟阶段后可收获，收获后退回 [开花] 阶段继续生长
  最多收获 N 次（配置表定义），超出后枯萎
```

---

### 3.4 主角移动系统 `PlayerController`

```typescript
// MVP 方案：点击传送
// 点击格子 → 传送到格子旁的空格 → 触发操作

class PlayerController {
    // 计算主角应该站在目标格的哪个相邻位置
    private getStandPosition(targetCell: Vec2): Vec3 { ... }

    // 传送（MVP阶段）：瞬移 + 播放简短位移Tween
    public teleportTo(targetCell: Vec2): Promise<void> {
        const pos = this.getStandPosition(targetCell);
        return TweenUtils.moveTo(this.playerNode, pos, 0.15);
    }

    // 到达后弹出操作菜单
    public showActionMenu(cell: ICellSaveData): void { ... }
}
```

---

### 3.5 背包系统 `InventoryManager`

```typescript
// 每格无限叠加（上限999）、格数无限
interface IInventoryItem {
    itemId:  string;   // 物品ID（对应配置表）
    count:   number;   // 当前数量（1~999）
}

class InventoryManager {
    private items: Map<string, IInventoryItem>;  // key = itemId

    public add(itemId: string, count: number): void { ... }
    public remove(itemId: string, count: number): boolean { ... }
    public getCount(itemId: string): number { ... }
    public hasEnough(itemId: string, count: number): boolean { ... }
}
```

---

### 3.6 存档系统 `SaveManager`

```typescript
// 存档结构（最小化，只保存运行时无法重建的数据）
interface ISaveData {
    version:    string;        // 存档版本号，用于迁移
    worldTime:  IWorldTimeSave;
    farm:       IFarmSave;
    player:     IPlayerSave;
    buildings:  IBuildingSave[];
    livestock:  ILivestockSave[];
    npc:        INpcSave;
}

class SaveManager extends SingletonManager {
    private static readonly SAVE_KEY = 'farm_save_v1';

    // 存档（节流：最少间隔5秒，避免频繁写磁盘）
    public save(): void {
        const data = this.collectSaveData();
        sys.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }

    // 读档
    public load(): ISaveData | null {
        const raw = sys.localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    // 触发存档的时机：
    //   - 每次天结束（DayEnd事件）
    //   - 玩家手动回主界面
    //   - 游戏切换到后台（app pause事件）
}
```

---

## 四、事件系统重写

### 需要定义的事件枚举

```typescript
// events/FarmEvents.ts
export enum FarmEvent {
    CellTilled      = "farm.cellTilled",       // 格子被开垦
    CropPlanted     = "farm.cropPlanted",      // 作物种下
    CropWatered     = "farm.cropWatered",      // 浇水
    CropFertilized  = "farm.cropFertilized",   // 施肥
    CropGrown       = "farm.cropGrown",        // 生长阶段推进
    CropHarvestable = "farm.cropHarvestable",  // 作物成熟可收获
    CropHarvested   = "farm.cropHarvested",    // 收获完成
    CropWithered    = "farm.cropWithered",     // 作物枯萎
}

// events/PlayerEvents.ts
export enum PlayerEvent {
    GoldChanged     = "player.goldChanged",    // 金币变化
    ExpChanged      = "player.expChanged",     // 经验变化
    LevelUp         = "player.levelUp",        // 升级
    ItemAdded       = "player.itemAdded",      // 背包增加物品
    ItemRemoved     = "player.itemRemoved",    // 背包减少物品
    MaterialChanged = "player.materialChanged",// 特殊材料变化
}

// events/TimeEvents.ts
export enum TimeEvent {
    DayEnd          = "time.dayEnd",           // 天结束
    SeasonChanged   = "time.seasonChanged",    // 季节切换
    WeatherChanged  = "time.weatherChanged",   // 天气变化（新的一天）
    ActionPointReset = "time.apReset",         // 行动点重置
}

// events/BuildingEvents.ts
export enum BuildingEvent {
    Built           = "building.built",        // 建筑完工
    ProcessStart    = "building.processStart", // 开始加工
    ProcessDone     = "building.processDone",  // 加工完成
}

// events/ExploreEvents.ts
export enum ExploreEvent {
    ResourceCollected = "explore.collected",   // 采集资源
    ActionPointUsed   = "explore.apUsed",      // 消耗行动点
    NodeRefreshed     = "explore.nodeRefresh", // 资源节点刷新
}
```

---

## 五、UI 系统规划

> 复用现有 `UIManager`，按层级管理弹窗

```
UI 层级（从下到上）：
  Layer 0 - 游戏世界层    农场地图、角色、建筑、动物
  Layer 1 - HUD 层        金币/等级/日期/季节/行动点 常驻显示
  Layer 2 - 操作菜单层    点击格子后出现的操作按钮
  Layer 3 - 面板层        背包、建筑列表、商店等全屏面板
  Layer 4 - 弹窗层        对话框、确认框、奖励弹窗
  Layer 5 - 提示层        Toast 提示、飘字效果
```

**HUD 常驻显示（MVP 必须）：**
- 💰 金币数量
- ⭐ 等级 + 经验进度条
- 📅 游戏内日期 + 季节图标
- ⚡ 行动点（探索用）

---

## 六、配置表结构

### 作物配置 `CropConfig`
```typescript
interface ICropConfig {
    id:          string;     // "crop_tomato"
    name:        string;     // "番茄"
    seasons:     Season[];   // 可种植的季节
    growDays:    number;     // 生长总天数
    growStages:  number;     // 生长阶段数（对应美术帧数）
    harvestCount: number;    // 可收获次数（1=一次性，>1=多次）
    seedPrice:   number;     // 种子购买价（金币）
    sellPrice:   number;     // 收获卖出价（金币）
    expReward:   number;     // 收获给予的经验值
    unlockLevel: number;     // 解锁所需等级
}
```

### 建筑配置 `BuildingConfig`
```typescript
interface IBuildingConfig {
    id:           string;           // "building_mill"
    name:         string;           // "磨坊"
    type:         BuildingType;     // Process / Storage / Livestock / House
    size:         { w: number; h: number };  // 占地格数
    unlockLevel:  number;
    buildCost:    { gold: number; materials: IItemCost[] };
    maxQueue:     number;           // 最大同时加工队列数
}

interface IItemCost { itemId: string; count: number; }
```

### 加工配方 `RecipeConfig`
```typescript
interface IRecipeConfig {
    id:          string;       // "recipe_flour"
    buildingId:  string;       // "building_mill"
    name:        string;       // "制作面粉"
    inputs:      IItemCost[];  // [{ itemId: "crop_wheat", count: 3 }]
    output:      IItemCost;    // { itemId: "product_flour", count: 1 }
    processDays: number;       // 加工所需游戏天数
    unlockLevel: number;
}
```

---

## 七、MVP 开发顺序

> 目标：2 周内跑通「开垦 → 播种 → 浇水 → 收获 → 卖出 → 金币」完整循环

```
Week 1：
  Day 1-2  配置表 + 枚举常量
           CropConfig（4种作物）/ GameDefine（枚举）/ 事件定义

  Day 3-4  WorldTimeManager（时间推进）
           + 基础 HUD（日期/金币显示）

  Day 5-6  FarmModel + FarmView（4×4格子渲染）
           + 格子点击交互（点击弹出操作菜单）

  Day 7    PlayerController（传送到格子旁）
           + 主角 Sprite 占位

Week 2：
  Day 8-9  CropStateMachine（生长状态机）
           + FarmController 完整操作流程

  Day 10   InventoryManager + PlayerModel（背包/金币/经验）

  Day 11   SaveManager（本地存档读写）
           + 游戏启动时还原存档

  Day 12   ShopModel + ShopView（简单卖出界面）
           + 商人NPC占位

  Day 13   整体联调 + 数值调试

  Day 14   Bug 修复 + 体验优化（音效/Tween/提示文字）
```

---

## 八、技术注意事项

### 多平台适配
- 屏幕分辨率基准：`1080×1920`（竖屏手机），Cocos 设计分辨率同此
- 微信小游戏包体：首包 < 4MB，资源分包加载（BundleManager 已存在，复用）
- PC 适配：鼠标点击事件与触摸事件统一处理（Cocos 自动适配，需测试缩放）

### 性能注意
- 农场格子使用 **对象池**（PoolManager 已存在），避免频繁创建/销毁节点
- 作物动画使用帧动画（Sprite Frame 切换），不用 Spine（减小包体）
- 地图滚动使用 **视口裁剪**，只渲染可见区域的格子

### 存档安全
- 存档写入前做 JSON 序列化校验，防止写入损坏数据
- 预留 `version` 字段，后期存档结构变更时做迁移处理

---

*文档持续更新，架构调整时同步修改。*
