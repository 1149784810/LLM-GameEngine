# Clicker Quest - 技术需求文档 (LD-TECH-REQ)

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | 技术需求文档 |
| 版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 主策划 | LD |
| 整合来源 | SD-核心玩法, SD-商店道具, UID-主界面, UID-商店界面, BD-经济数值, LvD-成就系统 |

---

## 目录

1. [系统架构概述](#一系统架构概述)
2. [核心系统技术需求](#二核心系统技术需求)
3. [商店系统技术需求](#三商店系统技术需求)
4. [道具系统技术需求](#四道具系统技术需求)
5. [成就系统技术需求](#五成就系统技术需求)
6. [数据结构定义](#六数据结构定义)
7. [接口规范](#七接口规范)
8. [配置表汇总](#八配置表汇总)

---

## 一、系统架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Clicker Quest 系统架构                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│   │   UI 层     │    │  逻辑层     │    │  数据层     │               │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘               │
│          │                  │                  │                        │
│   ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐               │
│   │ 主界面UI    │    │ 点击系统    │    │ 玩家数据    │               │
│   │ 商店界面UI  │◄──►│ 连击系统    │◄──►│ 商品数据    │               │
│   │ 道具界面UI  │    │ 暴击系统    │    │ 道具数据    │               │
│   │ 成就界面UI  │    │ GPS系统     │    │ 成就数据    │               │
│   │ 设置界面UI  │    │ 商店系统    │    │ 配置数据    │               │
│   └─────────────┘    │ 道具系统    │    └─────────────┘               │
│                      │ 成就系统    │                                  │
│                      │ 离线系统    │                                  │
│                      │ 存档系统    │                                  │
│                      └─────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 系统模块划分

| 模块 | 职责 | 依赖模块 |
|------|------|----------|
| 点击系统 | 处理点击事件、计算产出 | 连击系统、暴击系统 |
| 连击系统 | 检测连击、计算倍率 | - |
| 暴击系统 | 随机暴击判定 | - |
| GPS系统 | 自动产出金币 | 商店系统 |
| 商店系统 | 商品购买、价格计算 | - |
| 道具系统 | 道具使用、BUFF管理 | - |
| 成就系统 | 成就追踪、奖励发放 | - |
| 离线系统 | 离线收益计算 | GPS系统 |
| 存档系统 | 数据持久化 | 所有系统 |

### 1.3 技术栈要求

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | 原生JavaScript / Vue.js / React | 推荐原生JS实现轻量化 |
| 样式 | CSS3 / SASS | 支持响应式设计 |
| 存储 | localStorage | 本地存档，支持云存档扩展 |
| 音频 | Web Audio API | 音效播放 |
| 动画 | CSS Animation / requestAnimationFrame | 流畅动画效果 |

---

## 二、核心系统技术需求

### 2.1 点击系统

#### 2.1.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| CLICK-001 | 响应点击事件，产出金币 | P0 |
| CLICK-002 | 支持高频点击(≥10次/秒) | P0 |
| CLICK-003 | 点击响应时间≤50ms | P0 |
| CLICK-004 | 计算点击产出(基础+加成) | P0 |
| CLICK-005 | 触发连击检测 | P1 |
| CLICK-006 | 触发暴击检测 | P1 |
| CLICK-007 | 播放点击反馈动画 | P1 |

#### 2.1.2 计算公式

```javascript
// 点击产出计算
clickOutput = (baseClick + clickPowerLevel) 
            × (hasDoubleClick ? 2 : 1) 
            × (1 + goldenTouchLevel × 0.10) 
            × comboMultiplier 
            × criticalMultiplier 
            × buffMultiplier;
```

#### 2.1.3 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 点击响应延迟 | ≤50ms | 从点击到金币增加 |
| 动画帧率 | 60 FPS | 点击动画帧率 |
| 内存占用 | ≤5MB | 点击相关数据 |
| 最大点击频率 | 20次/秒 | 系统支持上限 |

### 2.2 连击系统

#### 2.2.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| COMBO-001 | 检测连击(500ms窗口) | P0 |
| COMBO-002 | 计算连击倍率(最高2.0x) | P0 |
| COMBO-003 | 连击中断检测 | P0 |
| COMBO-004 | 显示连击UI反馈 | P1 |
| COMBO-005 | 记录最高连击数 | P2 |

#### 2.2.2 连击倍率计算

```javascript
// 连击倍率计算
comboMultiplier = Math.min(1.0 + (comboCount × 0.1), 2.0);

// 连击判定
if (currentTime - lastClickTime <= 500) {
    comboCount++;
} else {
    comboCount = 1;
}
```

#### 2.2.3 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| TIME_WINDOW | 500ms | 连击时间窗口 |
| MAX_MULTIPLIER | 2.0 | 最大倍率 |
| MULTIPLIER_INCREMENT | 0.1 | 每次连击增加倍率 |

### 2.3 暴击系统

#### 2.3.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| CRIT-001 | 随机暴击判定 | P0 |
| CRIT-002 | 三种暴击类型(小/中/大) | P0 |
| CRIT-003 | 暴击倍率应用 | P0 |
| CRIT-004 | 暴击视觉反馈 | P1 |
| CRIT-005 | 暴击音效播放 | P1 |
| CRIT-006 | 暴击统计记录 | P2 |

#### 2.3.2 暴击配置

| 暴击类型 | 概率 | 倍率 | 视觉效果 |
|----------|------|------|----------|
| 小暴击 | 10% | 2x | 黄色闪光 |
| 中暴击 | 5% | 5x | 橙色闪光+震动 |
| 大暴击 | 1% | 10x | 金色闪光+粒子+强烈震动 |
| 无暴击 | 84% | 1x | 无 |

#### 2.3.3 暴击判定算法

```javascript
function checkCritical() {
    const random = Math.random() * 100;
    
    if (random < 1) return { type: 'MEGA', multiplier: 10 };
    if (random < 6) return { type: 'MEDIUM', multiplier: 5 };
    if (random < 16) return { type: 'SMALL', multiplier: 2 };
    return { type: 'NONE', multiplier: 1 };
}
```

### 2.4 GPS系统 (自动产出)

#### 2.4.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| GPS-001 | 每秒自动产出金币 | P0 |
| GPS-002 | GPS数值计算 | P0 |
| GPS-003 | 升级后即时更新GPS | P0 |
| GPS-004 | 显示当前GPS | P1 |
| GPS-005 | GPS倍率加成 | P1 |

#### 2.4.2 GPS计算公式

```javascript
// GPS计算
baseGPS = autoClickerLevel × 1 + megaClickerLevel × 10;
totalGPS = baseGPS × (1 + goldenTouchLevel × 0.10) × buffGPSMultiplier;
```

#### 2.4.3 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| PRODUCE_INTERVAL | 1000ms | 产出间隔 |
| MIN_GPS | 0 | 最小GPS |

### 2.5 离线收益系统

#### 2.5.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| OFFLINE-001 | 记录退出时间 | P0 |
| OFFLINE-002 | 计算离线收益 | P0 |
| OFFLINE-003 | 显示离线收益弹窗 | P1 |
| OFFLINE-004 | 领取离线收益 | P0 |
| OFFLINE-005 | 离线时间上限(24小时) | P0 |

#### 2.5.2 离线收益计算

```javascript
// 离线收益计算
function calculateOfflineReward(gps, offlineSeconds, timeWarpLevel) {
    const maxSeconds = 86400; // 24小时
    const effectiveSeconds = Math.min(offlineSeconds, maxSeconds);
    const efficiency = 0.5 + timeWarpLevel * 0.10;
    return Math.floor(gps * efficiency * effectiveSeconds);
}
```

#### 2.5.3 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| MIN_OFFLINE_SECONDS | 60 | 最小计算时间 |
| MAX_OFFLINE_SECONDS | 86400 | 最大计算时间(24小时) |
| BASE_EFFICIENCY | 0.5 | 基础效率(50%) |

---

## 三、商店系统技术需求

### 3.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| SHOP-001 | 显示商品列表 | P0 |
| SHOP-002 | 商品价格计算 | P0 |
| SHOP-003 | 购买流程处理 | P0 |
| SHOP-004 | 商品状态管理 | P0 |
| SHOP-005 | 解锁条件检测 | P1 |
| SHOP-006 | 批量购买支持 | P2 |

### 3.2 商品配置汇总

| 商品ID | 名称 | 基础价格 | 增长率 | 效果类型 | 效果值 |
|--------|------|----------|--------|----------|--------|
| click_power | 点击强化 | 10 | 1.15x | click_add | +1/点击 |
| auto_clicker | 自动点击器 | 100 | 1.15x | gps_add | +1 GPS |
| double_click | 双击 | 500 | 1.5x | click_multiplier | x2 |
| lucky_finger | 幸运手指 | 1,000 | 1.3x | crit_rate_add | +5%暴击率 |
| golden_touch | 黄金之手 | 5,000 | 1.4x | gold_multiplier | +10%金币 |
| time_warp | 时间扭曲 | 10,000 | 1.5x | offline_bonus | +10%离线效率 |
| mega_clicker | 超级点击器 | 50,000 | 1.2x | gps_add | +10 GPS |
| critical_master | 暴击大师 | 100,000 | 1.3x | crit_damage_add | +50%暴击伤害 |

### 3.3 价格计算公式

```javascript
// 当前价格计算
currentPrice = Math.ceil(basePrice × Math.pow(growthRate, level));

// 批量购买总价计算
function calculateTotalPrice(basePrice, growthRate, currentLevel, count) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += Math.ceil(basePrice * Math.pow(growthRate, currentLevel + i));
    }
    return total;
}
```

### 3.4 购买流程

```
点击商品 → 检查解锁条件 → 检查金币数量 → 扣除金币 → 应用效果 → 更新等级 → 计算新价格 → 更新UI
```

---

## 四、道具系统技术需求

### 4.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| ITEM-001 | 道具库存管理 | P0 |
| ITEM-002 | 道具使用处理 | P0 |
| ITEM-003 | BUFF系统管理 | P0 |
| ITEM-004 | BUFF倒计时 | P0 |
| ITEM-005 | BUFF效果计算 | P0 |
| ITEM-006 | 道具获取处理 | P1 |

### 4.2 道具配置汇总

| 道具ID | 名称 | 效果类型 | 效果值 | 持续时间 | 获取方式 |
|--------|------|----------|--------|----------|----------|
| gold_boost_2x | 金币翻倍 | gold_multiplier | x2 | 30秒 | 商店购买 |
| gold_boost_5x | 金币五倍 | gold_multiplier | x5 | 15秒 | 成就奖励 |
| instant_gold | 即时金币 | instant_gold | 10% | 即时 | 商店购买 |
| lucky_hour | 幸运时刻 | crit_rate_add | +20% | 60秒 | 成就奖励 |
| auto_boost | 自动加速 | gps_multiplier | x3 | 60秒 | 商店购买 |

### 4.3 BUFF叠加规则

| 规则 | 说明 |
|------|------|
| 同类效果时间叠加 | 金币翻倍+金币翻倍=时间延长 |
| 不同类效果可叠加 | 金币翻倍+自动加速=效果叠加 |
| 与永久升级叠加 | 黄金之手(永久)+金币翻倍(临时) |

### 4.4 BUFF数据结构

```javascript
{
    id: 'buff_12345',
    itemId: 'gold_boost_2x',
    name: '金币翻倍',
    effect: {
        type: 'gold_multiplier',
        value: 2
    },
    remainingTime: 25,
    startTime: 1708400000000
}
```

---

## 五、成就系统技术需求

### 5.1 功能需求

| 需求ID | 需求描述 | 优先级 |
|--------|----------|--------|
| ACHV-001 | 成就进度追踪 | P0 |
| ACHV-002 | 成就解锁检测 | P0 |
| ACHV-003 | 奖励发放 | P0 |
| ACHV-004 | 成就通知显示 | P1 |
| ACHV-005 | 里程碑系统 | P1 |
| ACHV-006 | 排行榜系统 | P2 |

### 5.2 成就分类

| 分类 | ID前缀 | 统计维度 |
|------|--------|----------|
| 点击类 | click_ | 累计点击次数 |
| 金币类 | gold_ | 累计获得金币 |
| 升级类 | upgrade_ | 累计购买次数 |
| 暴击类 | crit_ | 累计暴击次数 |
| 离线类 | offline_ | 累计离线收益 |

### 5.3 成就配置表

#### 点击类成就

| ID | 名称 | 条件 | 奖励 |
|----|------|------|------|
| click_1 | 初次点击 | 点击1次 | 10金币 |
| click_2 | 点击新手 | 点击100次 | 100金币 |
| click_3 | 点击达人 | 点击1,000次 | 500金币 |
| click_4 | 点击大师 | 点击10,000次 | 5,000金币 |
| click_5 | 点击传奇 | 点击100,000次 | 50,000金币 |
| click_6 | 点击之神 | 点击1,000,000次 | 500,000金币 |

#### 金币类成就

| ID | 名称 | 条件 | 奖励 |
|----|------|------|------|
| gold_1 | 小富翁 | 累计1,000金币 | 道具:金币翻倍 |
| gold_2 | 中富翁 | 累计10,000金币 | 道具:自动加速 |
| gold_3 | 大富翁 | 累计100,000金币 | 道具:金币五倍 |
| gold_4 | 超级富翁 | 累计1,000,000金币 | 道具:幸运时刻 |
| gold_5 | 亿万富翁 | 累计10,000,000金币 | 道具:金币五倍x3 |
| gold_6 | 首富 | 累计100,000,000金币 | 道具:金币五倍x5 |

---

## 六、数据结构定义

### 6.1 玩家数据结构

```javascript
const playerData = {
    // 金币相关
    currentGold: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    
    // 点击相关
    totalClicks: 0,
    sessionClicks: 0,
    lastClickTime: 0,
    
    // 连击相关
    comboCount: 0,
    comboMultiplier: 1.0,
    maxCombo: 0,
    
    // 暴击相关
    totalCriticals: 0,
    smallCriticals: 0,
    mediumCriticals: 0,
    megaCriticals: 0,
    
    // GPS相关
    currentGPS: 0,
    
    // 升级等级
    upgrades: {
        click_power: { level: 0, totalSpent: 0 },
        auto_clicker: { level: 0, totalSpent: 0 },
        double_click: { level: 0, totalSpent: 0 },
        lucky_finger: { level: 0, totalSpent: 0 },
        golden_touch: { level: 0, totalSpent: 0 },
        time_warp: { level: 0, totalSpent: 0 },
        mega_clicker: { level: 0, totalSpent: 0 },
        critical_master: { level: 0, totalSpent: 0 }
    },
    
    // 道具相关
    inventory: {},
    activeBuffs: [],
    
    // 成就相关
    achievements: {},
    milestones: {},
    
    // 离线相关
    exitTime: 0,
    totalOfflineGold: 0,
    
    // 游戏时间
    playTime: 0,
    firstPlayTime: 0,
    lastSaveTime: 0
};
```

### 6.2 商品数据结构

```javascript
const shopItem = {
    id: 'click_power',
    name: '点击强化',
    description: '每次点击额外获得 +1 金币',
    type: 'permanent',
    basePrice: 10,
    growthRate: 1.15,
    currentPrice: 10,
    level: 0,
    maxLevel: null,
    effect: {
        type: 'click_add',
        value: 1
    },
    unlockCondition: null,
    icon: '👆'
};
```

### 6.3 道具数据结构

```javascript
const item = {
    id: 'gold_boost_2x',
    name: '金币翻倍',
    description: '所有金币产出翻倍，持续30秒',
    type: 'buff',
    effect: {
        type: 'gold_multiplier',
        value: 2
    },
    duration: 30,
    source: 'shop',
    price: 5000,
    maxStack: 99,
    icon: '💰'
};
```

### 6.4 成就数据结构

```javascript
const achievement = {
    id: 'click_1',
    name: '初次点击',
    description: '完成你的第一次点击',
    category: 'click',
    condition: {
        type: 'click_count',
        target: 1
    },
    reward: {
        type: 'gold',
        value: 10
    },
    icon: 'icon_click_1',
    hidden: false,
    prerequisite: null
};
```

---

## 七、接口规范

### 7.1 点击系统接口

```javascript
interface IClickSystem {
    handleClick(): void;
    getClickGold(): number;
    getTotalClicks(): number;
    resetClicks(): void;
}
```

### 7.2 连击系统接口

```javascript
interface IComboSystem {
    checkCombo(clickTime: number): void;
    getComboMultiplier(): number;
    getComboCount(): number;
    resetCombo(): void;
}
```

### 7.3 暴击系统接口

```javascript
interface ICriticalSystem {
    checkCritical(): CriticalResult;
    getLastCriticalMultiplier(): number;
    getCriticalStats(): CriticalStats;
}

interface CriticalResult {
    type: 'NONE' | 'SMALL' | 'MEDIUM' | 'MEGA';
    multiplier: number;
}

interface CriticalStats {
    total: number;
    small: number;
    medium: number;
    mega: number;
}
```

### 7.4 GPS系统接口

```javascript
interface IGPSManager {
    calculateGPS(): number;
    getCurrentGPS(): number;
    startProduction(): void;
    stopProduction(): void;
    updateGPS(): void;
}
```

### 7.5 商店系统接口

```javascript
interface IShopManager {
    getItem(itemId: string): ShopItem;
    purchaseItem(itemId: string): boolean;
    calculatePrice(itemId: string): number;
    checkUnlockCondition(itemId: string): boolean;
    getItemStatus(itemId: string): ItemStatus;
}
```

### 7.6 道具系统接口

```javascript
interface IItemManager {
    useItem(itemId: string): boolean;
    getInventory(): Inventory;
    addItem(itemId: string, count: number): void;
    removeItem(itemId: string, count: number): void;
}

interface IBuffManager {
    addBuff(itemId: string): void;
    removeBuff(buffId: string): void;
    updateBuffs(deltaTime: number): void;
    getActiveBuffs(): Buff[];
    calculateTotalBuffs(): BuffEffects;
}
```

### 7.7 成就系统接口

```javascript
interface IAchievementManager {
    checkAchievement(achievementId: string): boolean;
    claimReward(achievementId: string): void;
    getProgress(achievementId: string): AchievementProgress;
    getAchievementsByCategory(category: string): Achievement[];
}
```

### 7.8 存档系统接口

```javascript
interface ISaveManager {
    saveGame(): void;
    loadGame(): PlayerData | null;
    deleteSave(): void;
    exportSave(): string;
    importSave(saveString: string): boolean;
}
```

---

## 八、配置表汇总

### 8.1 游戏参数配置

```json
{
    "gameParams": {
        "click": {
            "baseOutput": 1,
            "comboWindow": 500,
            "comboMaxMultiplier": 2.0,
            "comboIncrement": 0.1
        },
        "critical": {
            "small": { "probability": 10, "multiplier": 2 },
            "medium": { "probability": 5, "multiplier": 5 },
            "mega": { "probability": 1, "multiplier": 10 }
        },
        "gps": {
            "produceInterval": 1000,
            "minGPS": 0
        },
        "offline": {
            "efficiency": 0.5,
            "maxHours": 24,
            "minSeconds": 60
        },
        "display": {
            "maxGold": 1e308,
            "formatThresholds": {
                "K": 1000,
                "M": 1000000,
                "B": 1000000000,
                "T": 1000000000000
            }
        },
        "save": {
            "autoSaveInterval": 30000,
            "storageKey": "clicker_quest_save"
        }
    }
}
```

### 8.2 商品配置表

```json
{
    "upgrades": [
        {
            "id": "click_power",
            "name": "点击强化",
            "basePrice": 10,
            "growthRate": 1.15,
            "effect": { "type": "click_add", "value": 1 }
        },
        {
            "id": "auto_clicker",
            "name": "自动点击器",
            "basePrice": 100,
            "growthRate": 1.15,
            "effect": { "type": "gps_add", "value": 1 }
        },
        {
            "id": "double_click",
            "name": "双击",
            "basePrice": 500,
            "growthRate": 1.5,
            "maxLevel": 1,
            "effect": { "type": "click_multiplier", "value": 2 }
        },
        {
            "id": "lucky_finger",
            "name": "幸运手指",
            "basePrice": 1000,
            "growthRate": 1.3,
            "effect": { "type": "crit_rate_add", "value": 0.05 }
        },
        {
            "id": "golden_touch",
            "name": "黄金之手",
            "basePrice": 5000,
            "growthRate": 1.4,
            "effect": { "type": "gold_multiplier", "value": 0.10 }
        },
        {
            "id": "time_warp",
            "name": "时间扭曲",
            "basePrice": 10000,
            "growthRate": 1.5,
            "effect": { "type": "offline_bonus", "value": 0.10 }
        },
        {
            "id": "mega_clicker",
            "name": "超级点击器",
            "basePrice": 50000,
            "growthRate": 1.2,
            "effect": { "type": "gps_add", "value": 10 }
        },
        {
            "id": "critical_master",
            "name": "暴击大师",
            "basePrice": 100000,
            "growthRate": 1.3,
            "effect": { "type": "crit_damage_add", "value": 0.50 }
        }
    ]
}
```

### 8.3 道具配置表

```json
{
    "items": [
        {
            "id": "gold_boost_2x",
            "name": "金币翻倍",
            "price": 5000,
            "effect": { "type": "gold_multiplier", "value": 2.0, "duration": 30 },
            "source": "shop"
        },
        {
            "id": "instant_gold",
            "name": "即时金币",
            "price": 10000,
            "effect": { "type": "instant_percent", "value": 0.10 },
            "source": "shop"
        },
        {
            "id": "auto_boost",
            "name": "自动加速",
            "price": 20000,
            "effect": { "type": "gps_multiplier", "value": 3.0, "duration": 60 },
            "source": "shop"
        },
        {
            "id": "gold_boost_5x",
            "name": "金币五倍",
            "effect": { "type": "gold_multiplier", "value": 5.0, "duration": 15 },
            "source": "achievement"
        },
        {
            "id": "lucky_hour",
            "name": "幸运时刻",
            "effect": { "type": "crit_rate_add", "value": 0.20, "duration": 60 },
            "source": "achievement"
        }
    ]
}
```

### 8.4 成就配置表

```json
{
    "achievements": [
        { "id": "click_1", "name": "初次点击", "category": "click", "condition": { "clicks": 1 }, "reward": { "gold": 10 } },
        { "id": "click_2", "name": "点击新手", "category": "click", "condition": { "clicks": 100 }, "reward": { "gold": 100 } },
        { "id": "click_3", "name": "点击达人", "category": "click", "condition": { "clicks": 1000 }, "reward": { "gold": 500 } },
        { "id": "click_4", "name": "点击大师", "category": "click", "condition": { "clicks": 10000 }, "reward": { "gold": 5000 } },
        { "id": "click_5", "name": "点击传奇", "category": "click", "condition": { "clicks": 100000 }, "reward": { "gold": 50000 } },
        { "id": "click_6", "name": "点击之神", "category": "click", "condition": { "clicks": 1000000 }, "reward": { "gold": 500000 } },
        { "id": "gold_1", "name": "小富翁", "category": "gold", "condition": { "totalGold": 1000 }, "reward": { "item": "gold_boost_2x" } },
        { "id": "gold_2", "name": "中富翁", "category": "gold", "condition": { "totalGold": 10000 }, "reward": { "item": "auto_boost" } },
        { "id": "gold_3", "name": "大富翁", "category": "gold", "condition": { "totalGold": 100000 }, "reward": { "item": "gold_boost_5x" } },
        { "id": "gold_4", "name": "超级富翁", "category": "gold", "condition": { "totalGold": 1000000 }, "reward": { "item": "lucky_hour" } },
        { "id": "upgrade_1", "name": "升级新手", "category": "upgrade", "condition": { "upgrades": 5 }, "reward": { "gold": 200 } },
        { "id": "upgrade_2", "name": "升级达人", "category": "upgrade", "condition": { "upgrades": 25 }, "reward": { "gold": 1000 } },
        { "id": "upgrade_3", "name": "升级大师", "category": "upgrade", "condition": { "upgrades": 100 }, "reward": { "gold": 10000 } },
        { "id": "crit_1", "name": "暴击新手", "category": "crit", "condition": { "crits": 10 }, "reward": { "gold": 100 } },
        { "id": "crit_2", "name": "暴击达人", "category": "crit", "condition": { "crits": 100 }, "reward": { "item": "lucky_hour" } },
        { "id": "crit_3", "name": "暴击大师", "category": "crit", "condition": { "crits": 1000 }, "reward": { "item": "gold_boost_5x" } },
        { "id": "offline_1", "name": "离线新手", "category": "offline", "condition": { "offlineEarned": true }, "reward": { "gold": 100 } },
        { "id": "offline_2", "name": "离线达人", "category": "offline", "condition": { "offlineGold": 10000 }, "reward": { "gold": 1000 } }
    ]
}
```

---

## 文档修订记录

| 版本 | 日期 | 修订内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-02-20 | 初始版本，整合所有子策划文档 | LD |

---

**文档结束**
