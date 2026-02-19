# LP-ARCH-v1.0-20260220
# Clicker Quest - 技术架构文档

**文档编号**: LP-ARCH-v1.0-20260220
**文档类型**: 技术架构文档
**创建者**: 主程序员(LP)
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、项目概述

### 1.1 项目基本信息

| 项目属性 | 属性值 |
|---------|--------|
| 项目名称 | Clicker Quest |
| 游戏类型 | 点击放置类游戏 |
| 目标平台 | Web (PC/移动端) |
| 技术栈 | HTML5 + CSS3 + JavaScript (ES6+) |
| 开发模式 | 模块化开发 |

### 1.2 项目目录结构

```
projects/Clicker Quest/
├── index.html              # 入口文件
├── css/
│   └── style.css           # 主样式文件
├── js/
│   ├── main.js             # 主入口
│   ├── core/               # 核心模块
│   │   ├── EventBus.js     # 事件总线
│   │   ├── GameManager.js  # 游戏管理器
│   │   ├── GoldManager.js  # 金币管理器
│   │   ├── ClickManager.js # 点击管理器
│   │   ├── ShopManager.js  # 商店管理器
│   │   ├── ItemManager.js  # 道具管理器
│   │   ├── AchievementManager.js # 成就管理器
│   │   └── SaveManager.js  # 存档管理器
│   ├── systems/            # 系统模块
│   │   ├── DPSManager.js   # DPS管理器
│   │   ├── CriticalHitSystem.js # 暴击系统
│   │   └── OfflineRewardSystem.js # 离线收益系统
│   ├── ui/                 # UI模块
│   │   ├── UIManager.js    # UI管理器
│   │   ├── MainScreenUI.js # 主界面UI
│   │   ├── ShopScreenUI.js # 商店界面UI
│   │   ├── AchievementScreenUI.js # 成就界面UI
│   │   ├── ModalManager.js # 弹窗管理器
│   │   └── AnimationManager.js # 动画管理器
│   └── utils/              # 工具模块
│       ├── NumberFormatter.js # 数字格式化
│       ├── TimeFormatter.js # 时间格式化
│       ├── StorageHelper.js # 存储辅助
│       └── AudioHelper.js  # 音频辅助
├── assets/
│   ├── images/             # 图片资源
│   └── audio/              # 音频资源
├── config/
│   └── game.config.js      # 游戏配置
└── docs/                   # 文档目录
```

---

## 二、系统架构

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         表现层 (Presentation)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 主界面UI │ │ 商店界面 │ │ 成就界面 │ │ 弹窗系统 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ 动画系统 │ │ 音效系统 │ │ 反馈系统 │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
├─────────────────────────────────────────────────────────────────┤
│                         业务逻辑层 (Business Logic)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 点击管理 │ │ 金币管理 │ │ 道具管理 │ │ 商店管理 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 成就管理 │ │ 升级管理 │ │ DPS计算  │ │ 暴击系统 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                         数据层 (Data)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 存档管理 │ │ 配置管理 │ │ 缓存管理 │ │ 加密管理 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                         基础设施层 (Infrastructure)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 事件总线 │ │ 工具函数 │ │ 存储封装 │ │ 日志系统 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```
                    ┌─────────────┐
                    │ GameManager │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  EventBus     │  │  SaveManager  │  │   UIManager   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ GoldManager   │  │ ItemManager   │  │ ShopManager   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                ┌───────────────────┐
                │ AchievementManager│
                └───────────────────┘
```

---

## 三、核心模块设计

### 3.1 GameManager (游戏管理器)

**职责**: 游戏核心管理器，负责初始化所有子系统、管理游戏生命周期、协调各模块交互

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `init()` | 初始化游戏 |
| `startGameLoop()` | 启动游戏循环 |
| `update(deltaTime)` | 更新游戏状态 |
| `pause()` | 暂停游戏 |
| `resume()` | 恢复游戏 |
| `save()` | 保存游戏 |
| `reset()` | 重置游戏 |

**依赖模块**: EventBus, GoldManager, ClickManager, ShopManager, ItemManager, AchievementManager, SaveManager, UIManager

### 3.2 GoldManager (金币管理器)

**职责**: 管理金币的获取、消耗、显示格式化

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `addGold(amount, source)` | 增加金币 |
| `spendGold(amount, purpose)` | 消耗金币 |
| `hasEnoughGold(amount)` | 检查金币是否足够 |
| `formatGold(amount)` | 格式化金币显示 |
| `setGlobalMultiplier(multiplier)` | 设置全局倍率 |

**数据结构**:
```javascript
{
    currentGold: number,      // 当前金币
    totalGoldEarned: number,  // 累计获得金币
    totalGoldSpent: number,   // 累计消耗金币
    globalMultiplier: number  // 全局倍率
}
```

### 3.3 ClickManager (点击管理器)

**职责**: 处理点击检测、金币计算、暴击判定、点击冷却

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `handleClick(event)` | 处理点击事件 |
| `canClick()` | 检查是否可以点击 |
| `isValidClickArea(x, y, element)` | 检测点击区域有效性 |
| `calculateClickGold(critMultiplier)` | 计算点击金币 |
| `getBaseClickGold()` | 获取基础点击金币 |

**数据结构**:
```javascript
ClickResult {
    goldGained: number,           // 获得的金币数量
    criticalLevel: string,        // 暴击等级
    criticalMultiplier: number,   // 暴击倍率
    isValid: boolean,             // 点击是否有效
    clickPosition: {x, y},        // 点击位置
    timestamp: number             // 时间戳
}
```

### 3.4 ShopManager (商店管理器)

**职责**: 管理商店商品展示、购买流程、购买限制和商店刷新

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `getShopItems(category, page, pageSize)` | 获取商品列表 |
| `buyItem(itemId, quantity)` | 购买商品 |
| `checkPurchaseConditions(item)` | 检查购买条件 |
| `refreshShop(useFreeRefresh)` | 刷新商店 |

### 3.5 ItemManager (道具管理器)

**职责**: 管理道具的获取、使用、效果应用、叠加规则

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `addItem(item, quantity)` | 添加道具 |
| `useItem(itemId)` | 使用道具 |
| `removeItem(itemId, quantity)` | 移除道具 |
| `getActiveBuffs()` | 获取激活的BUFF列表 |
| `calculateDPSBonus()` | 计算DPS加成 |

### 3.6 AchievementManager (成就管理器)

**职责**: 管理成就解锁、进度追踪、奖励发放

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `checkAchievement(achievementId)` | 检查成就条件 |
| `unlockAchievement(achievementId)` | 解锁成就 |
| `updateProgress(achievementId, progress)` | 更新成就进度 |
| `getAchievements(type, difficulty)` | 获取成就列表 |

### 3.7 SaveManager (存档管理器)

**职责**: 管理游戏数据的持久化、加密、验证

**主要方法**:
| 方法名 | 描述 |
|--------|------|
| `save(isAutoSave)` | 保存游戏数据 |
| `load()` | 加载游戏数据 |
| `hasSaveData()` | 检查存档是否存在 |
| `exportSave()` | 导出存档 |
| `importSave(saveString)` | 导入存档 |

---

## 四、数据结构定义

### 4.1 玩家数据 (PlayerData)

```javascript
{
    playerId: string,         // 玩家ID
    playerName: string,       // 玩家昵称
    createTime: number,       // 创建时间戳
    lastSaveTime: number,     // 最后保存时间戳
    totalPlayTime: number,    // 累计游戏时长(秒)
    loginDays: number,        // 累计登录天数
    lastLoginDate: string     // 最后登录日期
}
```

### 4.2 金币数据 (CurrencyData)

```javascript
{
    currentGold: number,      // 当前金币
    totalGoldEarned: number,  // 累计获得金币
    totalGoldSpent: number,   // 累计消耗金币
    currentDPS: number,       // 当前DPS
    clickPower: number,       // 点击金币数
    critRate: number,         // 暴击率
    critMultiplier: number    // 暴击倍率
}
```

### 4.3 道具数据 (ItemData)

```javascript
{
    itemId: string,           // 道具ID
    itemName: string,         // 道具名称
    itemType: string,         // 道具类型(AUTO/BUFF/CONSUMABLE/PERMANENT)
    quantity: number,         // 数量
    level: number,            // 等级
    isActive: boolean,        // 是否激活
    remainingTime: number,    // 剩余时间(秒)
    purchaseTime: number      // 购买时间戳
}
```

### 4.4 成就数据 (AchievementData)

```javascript
{
    achievementId: string,    // 成就ID
    achievementName: string,  // 成就名称
    unlockTime: number,       // 解锁时间戳
    isClaimed: boolean,       // 是否领取奖励
    claimTime: number         // 领取时间戳
}
```

---

## 五、事件系统

### 5.1 事件类型定义

| 事件名 | 描述 | 数据 |
|--------|------|------|
| `GOLD_CHANGED` | 金币变化 | { oldGold, newGold, change } |
| `CLICK_PERFORMED` | 点击执行 | ClickResult |
| `CRITICAL_HIT` | 暴击触发 | { level, multiplier } |
| `DPS_CHANGED` | DPS变化 | { oldDPS, newDPS } |
| `ITEM_PURCHASED` | 道具购买 | { itemId, quantity, cost } |
| `BUFF_ACTIVATED` | BUFF激活 | BuffData |
| `BUFF_DEACTIVATED` | BUFF停用 | { buffId } |
| `ACHIEVEMENT_UNLOCKED` | 成就解锁 | AchievementData |
| `SAVE_COMPLETED` | 存档完成 | { saveTime } |
| `GAME_INITIALIZED` | 游戏初始化完成 | - |

### 5.2 事件使用示例

```javascript
// 订阅事件
eventBus.on(GameEvents.GOLD_CHANGED, (data) => {
    console.log(`金币变化: ${data.oldGold} -> ${data.newGold}`);
});

// 发布事件
eventBus.emit(GameEvents.GOLD_CHANGED, {
    oldGold: 100,
    newGold: 150,
    change: 50
});
```

---

## 六、接口契约

### 6.1 IClickManager 接口

```typescript
interface IClickManager {
    handleClick(event: Event): ClickResult | null;
    canClick(): boolean;
    getBaseClickGold(): number;
    setGlobalMultiplier(multiplier: number): void;
}
```

### 6.2 IGoldManager 接口

```typescript
interface IGoldManager {
    currentGold: number;
    totalGoldEarned: number;
    addGold(amount: number, source: GoldSource): number;
    spendGold(amount: number, purpose: GoldPurpose): boolean;
    hasEnoughGold(amount: number): boolean;
    formatGold(amount: number): string;
}
```

### 6.3 IShopManager 接口

```typescript
interface IShopManager {
    getShopItems(category?: string, page?: number, pageSize?: number): ShopItemsResult;
    buyItem(itemId: string, quantity?: number): PurchaseResult;
    checkPurchaseConditions(item: ShopItem): ConditionResult;
    refreshShop(useFreeRefresh?: boolean): RefreshResult;
}
```

---

## 七、性能优化策略

### 7.1 渲染优化

- 使用CSS transform进行动画，避免触发重排
- 使用requestAnimationFrame进行游戏循环
- 金币飘字使用对象池复用DOM元素
- 长列表使用虚拟滚动

### 7.2 数据优化

- 大数值使用BigInt或科学计数法
- 存档数据压缩
- 增量更新，避免全量刷新

### 7.3 内存优化

- 及时清理过期BUFF数据
- 限制金币飘字最大数量
- 音频资源按需加载

---

## 八、安全策略

### 8.1 数据安全

- 存档数据使用AES-256-GCM加密
- 使用SHA256校验和验证数据完整性
- 使用HMAC-SHA256检测数据篡改

### 8.2 防作弊机制

- 点击冷却限制(50ms)
- 离线时长上限(24小时)
- 数值异常检测

---

## 九、子程序员任务分配

| 子程序标识 | 负责模块 | 主要任务 |
|-----------|---------|---------|
| CP-1 | 点击系统 | 实现点击检测、金币计算、冷却机制 |
| CP-2 | 金币系统 | 实现金币管理、格式化显示、倍率计算 |
| CP-3 | 存档系统 | 实现数据持久化、加密、备份恢复 |
| SP-1 | 商店界面 | 实现商店UI渲染、分类切换 |
| SP-2 | 购买逻辑 | 实现购买流程、条件检查、效果执行 |
| DP-1 | 自动点击器 | 实现DPS计算、自动产出逻辑 |
| DP-2 | 倍率系统 | 实现全局倍率、BUFF叠加计算 |
| UIP-1 | 主界面 | 实现主界面UI、金币飘字、点击反馈 |
| UIP-2 | 商店界面 | 实现商品卡片、购买弹窗 |
| UIP-3 | 动效系统 | 实现各种动画效果、粒子系统 |

---

## 十、版本历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|---------|--------|
| v1.0 | 2026-02-20 | 初始版本，定义技术架构 | 主程序员(LP) |

---

**文档状态**: 已完成
**下一步**: 交付子程序员进行模块开发
