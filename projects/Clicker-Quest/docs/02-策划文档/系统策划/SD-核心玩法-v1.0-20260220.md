# Clicker Quest - 核心玩法系统设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | 系统策划 - 核心玩法设计 |
| 版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 负责人 | SD-1 系统策划 |
| 主策划 | LD |

---

## 目录

1. [基础点击机制设计](#一基础点击机制设计)
2. [连击奖励系统设计](#二连击奖励系统设计)
3. [暴击系统设计](#三暴击系统设计)
4. [金币格式化显示规则](#四金币格式化显示规则)
5. [自动产出机制设计](#五自动产出机制设计)
6. [离线收益系统设计](#六离线收益系统设计)
7. [点击反馈设计](#七点击反馈设计)
8. [接口定义](#八接口定义)
9. [数值配置表](#九数值配置表)

---

## 一、基础点击机制设计

### 1.1 系统概述

基础点击机制是Clicker Quest的核心交互方式，玩家通过点击屏幕获取金币，是游戏最基础的产出方式。

### 1.2 设计目标

- 提供即时、流畅的点击反馈
- 支持高频点击操作（≥10次/秒）
- 确保点击响应时间≤50ms
- 为后续系统（连击、暴击）提供基础支持

### 1.3 核心规则

#### 1.3.1 点击产出规则

| 参数 | 数值 | 说明 |
|------|------|------|
| 基础点击产出 | 1 金币 | 每次点击的基础金币产出 |
| 点击响应时间 | ≤50ms | 从点击到金币增加的时间 |
| 最大点击频率 | 20次/秒 | 系统支持的最大点击频率 |

#### 1.3.2 点击计数器

```
点击计数器状态:
├── totalClicks: number      // 总点击次数
├── sessionClicks: number    // 本次会话点击次数
└── lastClickTime: timestamp // 上次点击时间戳
```

### 1.4 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                     点击状态机                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [空闲状态]                                                │
│       │                                                     │
│       │ 点击事件触发                                        │
│       ▼                                                     │
│   [处理点击] ──────► [计算金币产出]                         │
│       │                    │                                │
│       │                    ▼                                │
│       │              [应用加成效果]                         │
│       │                    │                                │
│       │                    ▼                                │
│       │              [更新金币数量]                         │
│       │                    │                                │
│       │                    ▼                                │
│       │              [更新点击计数]                         │
│       │                    │                                │
│       │                    ▼                                │
│       │              [触发反馈效果]                         │
│       │                    │                                │
│       └────────────────────┘                                │
│                          │                                  │
│                          ▼                                  │
│                    [返回空闲状态]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 点击事件处理流程

```
点击事件处理流程:

1. 用户点击屏幕
      │
      ▼
2. 记录点击时间戳
      │
      ▼
3. 检查点击有效性
      │
      ├── 无效 ──► 忽略点击
      │
      ▼
4. 计算本次点击产出
   baseGold = 1
   totalGold = baseGold * clickMultiplier * globalMultiplier
      │
      ▼
5. 更新金币数量
   currentGold += totalGold
   totalGoldEarned += totalGold
      │
      ▼
6. 更新点击计数
   totalClicks++
   sessionClicks++
      │
      ▼
7. 触发连击检测
      │
      ▼
8. 触发暴击检测
      │
      ▼
9. 播放点击反馈
      │
      ▼
10. 更新UI显示
```

### 1.6 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 点击响应延迟 | ≤50ms | 从点击到金币增加的延迟 |
| 动画帧率 | 60 FPS | 点击动画的帧率 |
| 内存占用 | ≤5MB | 点击相关数据的内存占用 |
| 点击队列 | 无队列 | 直接处理，不排队 |

### 1.7 边界情况处理

| 情况 | 处理方式 |
|------|----------|
| 快速连续点击 | 直接处理，不节流 |
| 金币达到上限 | 金币不再增加，显示上限提示 |
| 点击时网络异常 | 本地正常处理，存档延迟同步 |
| 多点触控 | 只响应第一个触点 |

---

## 二、连击奖励系统设计

### 2.1 系统概述

连击系统奖励连续快速点击的玩家，通过提供临时倍率加成，鼓励玩家保持高频点击节奏。

### 2.2 设计目标

- 提供连续点击的正反馈
- 增加游戏的策略深度
- 平衡休闲玩家和硬核玩家的体验
- 避免强制玩家持续点击

### 2.3 核心规则

#### 2.3.1 连击判定规则

| 参数 | 数值 | 说明 |
|------|------|------|
| 连击时间窗口 | 500ms | 两次点击之间的最大间隔 |
| 连击倍率上限 | 2.0x | 最高连击倍率 |
| 连击倍率增长 | 0.1x/次 | 每次连击增加的倍率 |
| 连击中断时间 | 500ms | 超过此时间无点击则中断 |

#### 2.3.2 连击倍率计算公式

```
连击倍率计算:
comboMultiplier = min(1.0 + (comboCount * 0.1), 2.0)

其中:
- comboMultiplier: 最终连击倍率
- comboCount: 连击次数
- min(): 取最小值，确保不超过上限
```

#### 2.3.3 连击状态定义

| 状态 | 条件 | 倍率 |
|------|------|------|
| 无连击 | comboCount = 0 | 1.0x |
| 小连击 | 1 ≤ comboCount ≤ 5 | 1.1x - 1.5x |
| 中连击 | 6 ≤ comboCount ≤ 10 | 1.6x - 2.0x |
| 大连击(满) | comboCount > 10 | 2.0x (上限) |

### 2.4 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                     连击状态机                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌──────────────┐                         │
│                    │   无连击状态   │                         │
│                    │ comboCount=0 │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│              500ms内点击  │                                 │
│                           ▼                                 │
│                    ┌──────────────┐                         │
│                    │   连击进行中   │                         │
│                    │ comboCount++ │                         │
│                    │ 倍率递增      │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│        ┌──────────────────┼──────────────────┐              │
│        │                  │                  │              │
│  500ms内点击        达到上限(2.0x)    超过500ms无点击        │
│        │                  │                  │              │
│        ▼                  ▼                  ▼              │
│   [继续连击]        [满连击状态]       [连击中断]            │
│        │                  │                  │              │
│        │                  │                  │              │
│        └──────────────────┴──────────────────┘              │
│                           │                                 │
│                           ▼                                 │
│                    [重置连击计数]                           │
│                           │                                 │
│                           ▼                                 │
│                    [返回无连击状态]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 连击处理流程

```
连击检测流程:

1. 点击事件触发
      │
      ▼
2. 获取当前时间戳 currentTime
      │
      ▼
3. 计算时间差
   timeDiff = currentTime - lastClickTime
      │
      ▼
4. 判断连击状态
      │
      ├── timeDiff <= 500ms ──► 连击有效
      │       │
      │       ▼
      │   comboCount++
      │   更新连击倍率
      │   重置连击计时器
      │       │
      │       ▼
      │   触发连击UI反馈
      │
      └── timeDiff > 500ms ──► 连击中断
              │
              ▼
          记录最高连击数
              │
              ▼
          重置连击计数
              │
              ▼
          comboCount = 1 (本次点击为新连击开始)
              │
              ▼
          重置连击倍率 = 1.0x
      │
      ▼
5. 更新lastClickTime = currentTime
```

### 2.6 连击UI反馈需求

| 连击阶段 | 视觉反馈 | 音效反馈 |
|----------|----------|----------|
| 1-5 连击 | 轻微发光效果 | 轻柔"叮"声 |
| 6-10 连击 | 明显发光 + 震动效果 | 清脆"叮叮"声 |
| 11+ 连击 | 强烈发光 + 粒子效果 | 华丽"叮叮叮"声 |

### 2.7 连击数据结构

```javascript
// 连击状态数据
const comboState = {
    comboCount: 0,           // 当前连击数
    comboMultiplier: 1.0,    // 当前连击倍率
    lastClickTime: 0,        // 上次点击时间戳
    maxCombo: 0,             // 最高连击记录
    isComboActive: false     // 连击是否激活
};

// 连击配置
const comboConfig = {
    TIME_WINDOW: 500,        // 连击时间窗口(ms)
    MAX_MULTIPLIER: 2.0,     // 最大倍率
    MULTIPLIER_INCREMENT: 0.1 // 每次连击增加的倍率
};
```

---

## 三、暴击系统设计

### 3.1 系统概述

暴击系统为点击增加随机性奖励，玩家每次点击都有概率触发暴击，获得额外的金币倍率加成。

### 3.2 设计目标

- 增加点击的惊喜感和期待感
- 提供短期爆发收益的机会
- 通过视觉和音效反馈增强游戏体验
- 与其他系统（连击、道具）形成联动

### 3.3 核心规则

#### 3.3.1 暴击类型定义

| 暴击类型 | 触发概率 | 金币倍率 | 视觉效果 | 音效 |
|----------|----------|----------|----------|------|
| 小暴击 | 10% | 2x | 黄色闪光 | "叮"声 |
| 中暴击 | 5% | 5x | 橙色闪光 | "叮咚"声 |
| 大暴击 | 1% | 10x | 金色闪光 + 粒子 | "轰"声 |
| 无暴击 | 84% | 1x | 无 | 普通点击音效 |

#### 3.3.2 暴击概率计算

```
暴击判定流程:
1. 生成随机数 random = Math.random() * 100  // 0-100
2. 判定暴击类型:
   - random < 1: 大暴击 (1%)
   - 1 <= random < 6: 中暴击 (5%)
   - 6 <= random < 16: 小暴击 (10%)
   - random >= 16: 无暴击 (84%)
```

#### 3.3.3 暴击叠加规则

```
暴击与连击叠加计算:
finalGold = baseGold * comboMultiplier * criticalMultiplier * globalMultiplier

示例:
- 基础金币: 1
- 连击倍率: 1.5x
- 暴击倍率: 5x (中暴击)
- 全局倍率: 1.0x
- 最终金币: 1 * 1.5 * 5 * 1.0 = 7.5 金币
```

### 3.4 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                     暴击状态机                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [点击触发]                                                │
│       │                                                     │
│       ▼                                                     │
│   [生成随机数]                                              │
│       │                                                     │
│       ├─────────────────────────────────────────┐           │
│       │                                         │           │
│       ▼                     ▼                   ▼           │
│  ┌─────────┐          ┌─────────┐         ┌─────────┐      │
│  │ 大暴击   │          │ 中暴击   │         │ 小暴击   │      │
│  │ 1%      │          │ 5%      │         │ 10%     │      │
│  │ 10x     │          │ 5x      │         │ 2x      │      │
│  └────┬────┘          └────┬────┘         └────┬────┘      │
│       │                    │                   │           │
│       └────────────────────┴───────────────────┘           │
│                            │                                │
│                            ▼                                │
│                    [应用暴击效果]                           │
│                            │                                │
│                            ▼                                │
│                    [播放暴击反馈]                           │
│                            │                                │
│                            ▼                                │
│                    [更新暴击统计]                           │
│                            │                                │
│                            ▼                                │
│                    [返回等待状态]                           │
│                                                             │
│   注: 84%概率无暴击，直接计算普通金币                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 暴击处理流程

```
暴击判定流程:

1. 点击事件触发
      │
      ▼
2. 生成随机数
   random = Math.random() * 100
      │
      ▼
3. 判定暴击类型
      │
      ├── random < 1 ──────────► 大暴击
      │       │
      │       ▼
      │   criticalType = "MEGA"
      │   criticalMultiplier = 10
      │
      ├── 1 <= random < 6 ─────► 中暴击
      │       │
      │       ▼
      │   criticalType = "MEDIUM"
      │   criticalMultiplier = 5
      │
      ├── 6 <= random < 16 ────► 小暴击
      │       │
      │       ▼
      │   criticalType = "SMALL"
      │   criticalMultiplier = 2
      │
      └── random >= 16 ────────► 无暴击
              │
              ▼
          criticalType = "NONE"
          criticalMultiplier = 1
      │
      ▼
4. 计算最终金币
   finalGold = baseGold * comboMultiplier * criticalMultiplier
      │
      ▼
5. 播放暴击反馈
      │
      ▼
6. 更新暴击统计
   totalCriticals++
   criticalsByType[criticalType]++
```

### 3.6 暴击视觉反馈需求

#### 3.6.1 小暴击反馈

| 元素 | 规格 |
|------|------|
| 屏幕闪光 | 黄色 (#FFD700)，透明度 0.3，持续 0.2s |
| 金币飘字 | 黄色，放大 1.2x，显示 "+2x" |
| 粒子效果 | 5-10 个小粒子，向上飘散 |
| 音效 | 清脆"叮"声，音量 0.7 |

#### 3.6.2 中暴击反馈

| 元素 | 规格 |
|------|------|
| 屏幕闪光 | 橙色 (#FF9800)，透明度 0.5，持续 0.3s |
| 金币飘字 | 橙色，放大 1.5x，显示 "+5x" |
| 粒子效果 | 15-20 个中粒子，向四周扩散 |
| 音效 | 华丽"叮咚"声，音量 0.8 |
| 屏幕震动 | 轻微震动，幅度 2px |

#### 3.6.3 大暴击反馈

| 元素 | 规格 |
|------|------|
| 屏幕闪光 | 金色 (#FFD700)，透明度 0.7，持续 0.5s |
| 金币飘字 | 金色，放大 2.0x，显示 "+10x" |
| 粒子效果 | 30-50 个大粒子，爆炸式扩散 |
| 音效 | 华丽"轰"声，音量 1.0 |
| 屏幕震动 | 明显震动，幅度 5px |
| 特效叠加 | 金币雨效果，持续 1s |

### 3.7 暴击数据结构

```javascript
// 暴击状态数据
const criticalState = {
    totalCriticals: 0,           // 总暴击次数
    smallCriticals: 0,           // 小暴击次数
    mediumCriticals: 0,          // 中暴击次数
    megaCriticals: 0,            // 大暴击次数
    lastCriticalType: "NONE"     // 上次暴击类型
};

// 暴击配置
const criticalConfig = {
    SMALL: {
        probability: 10,         // 10%
        multiplier: 2,
        color: "#FFD700",
        sound: "critical_small.mp3"
    },
    MEDIUM: {
        probability: 5,          // 5%
        multiplier: 5,
        color: "#FF9800",
        sound: "critical_medium.mp3"
    },
    MEGA: {
        probability: 1,          // 1%
        multiplier: 10,
        color: "#FFD700",
        sound: "critical_mega.mp3"
    }
};
```

---

## 四、金币格式化显示规则

### 4.1 系统概述

金币格式化系统负责将大数字转换为易读的格式，提升玩家对金币数量的认知效率。

### 4.2 设计目标

- 提供清晰易读的金币显示
- 支持极大数值的显示
- 保持格式的一致性
- 减少玩家认知负担

### 4.3 格式化规则

#### 4.3.1 数值范围与显示格式

| 数值范围 | 显示格式 | 示例 |
|----------|----------|------|
| 0 - 999 | 原始数字 | 0, 123, 999 |
| 1,000 - 999,999 | K格式 (保留1位小数) | 1.0K, 12.3K, 999.9K |
| 1,000,000 - 999,999,999 | M格式 (保留1位小数) | 1.0M, 12.3M, 999.9M |
| 1,000,000,000 - 999,999,999,999 | B格式 (保留1位小数) | 1.0B, 12.3B, 999.9B |
| 1,000,000,000,000+ | T格式 (保留1位小数) | 1.0T, 12.3T, 999.9T |

#### 4.3.2 格式化算法

```javascript
/**
 * 格式化金币显示
 * @param {number} gold - 金币数量
 * @returns {string} 格式化后的字符串
 */
function formatGold(gold) {
    // 处理边界情况
    if (gold < 0) return "0";
    if (gold >= 1e308) return "MAX";
    if (gold < 1000) return Math.floor(gold).toString();
    
    // 定义单位
    const units = ["", "K", "M", "B", "T"];
    
    // 计算单位索引
    const tier = Math.floor(Math.log10(gold) / 3);
    
    // 限制最大单位为T
    const unitIndex = Math.min(tier, units.length - 1);
    
    // 计算显示数值
    const scaled = gold / Math.pow(1000, unitIndex);
    
    // 格式化输出
    if (scaled >= 100) {
        return Math.floor(scaled) + units[unitIndex];
    } else {
        return scaled.toFixed(1) + units[unitIndex];
    }
}
```

### 4.4 特殊情况处理

| 情况 | 处理方式 | 显示结果 |
|------|----------|----------|
| 金币为0 | 显示 "0" | "0" |
| 金币为负数 | 显示 "0" | "0" |
| 金币达到上限 | 显示 "MAX" | "MAX" |
| 小数点后为0 | 不显示小数 | "10K" 而非 "10.0K" |
| 小数点后非0 | 保留1位小数 | "10.5K" |

### 4.5 金币上限处理

```
金币上限规则:
- 最大金币数: 1e308 (JavaScript Number.MAX_VALUE)
- 达到上限时:
  1. 金币不再增加
  2. 显示 "MAX" 标识
  3. 弹出提示: "恭喜！你已达到金币上限！"
  4. 自动存档
```

### 4.6 格式化示例

| 原始数值 | 格式化结果 |
|----------|------------|
| 0 | 0 |
| 123 | 123 |
| 999 | 999 |
| 1,000 | 1.0K |
| 1,234 | 1.2K |
| 10,000 | 10K |
| 123,456 | 123.5K |
| 999,999 | 1.0M |
| 1,000,000 | 1.0M |
| 12,345,678 | 12.3M |
| 999,999,999 | 1.0B |
| 1,000,000,000 | 1.0B |
| 999,999,999,999 | 1.0T |
| 1,000,000,000,000 | 1.0T |
| 1e308 | MAX |

---

## 五、自动产出机制设计

### 5.1 系统概述

自动产出机制（GPS - Gold Per Second）允许玩家在无需点击的情况下自动获取金币，是放置游戏的核心机制之一。

### 5.2 设计目标

- 提供被动收益，降低玩家疲劳度
- 鼓励玩家投资升级
- 与商店系统形成联动
- 为离线收益提供计算基础

### 5.3 核心规则

#### 5.3.1 GPS计算公式

```
GPS计算公式:
GPS = baseGPS + sum(upgradeGPS)

其中:
- baseGPS: 基础GPS (初始为0)
- upgradeGPS: 各升级提供的GPS

详细计算:
GPS = (autoClickerLevel * 1) + (megaClickerLevel * 10) + ... 
    + (道具加成) + (全局加成)
```

#### 5.3.2 GPS产出规则

| 参数 | 数值 | 说明 |
|------|------|------|
| 产出频率 | 1秒 | 每秒触发一次产出 |
| 产出精度 | 整数 | 向下取整 |
| 最小GPS | 0 | 无升级时GPS为0 |
| 最大GPS | 无上限 | 随升级无限增长 |

#### 5.3.3 升级对GPS的影响

| 升级类型 | GPS增加 | 计算方式 |
|----------|---------|----------|
| 自动点击器 | +1/级 | autoClickerLevel * 1 |
| 超级点击器 | +10/级 | megaClickerLevel * 10 |
| 道具加成 | x倍率 | GPS * multiplier |

### 5.4 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                   自动产出状态机                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [游戏启动]                                                │
│       │                                                     │
│       ▼                                                     │
│   [初始化GPS]                                               │
│   - 计算当前GPS                                             │
│   - 启动产出计时器                                          │
│       │                                                     │
│       ▼                                                     │
│   ┌──────────────────────────────────────────┐              │
│   │              产出循环                     │              │
│   │                                          │              │
│   │   [等待1秒]                              │              │
│   │       │                                  │              │
│   │       ▼                                  │              │
│   │   [计算本次产出]                         │              │
│   │   gold = GPS * globalMultiplier          │              │
│   │       │                                  │              │
│   │       ▼                                  │              │
│   │   [添加金币]                             │              │
│   │   currentGold += gold                    │              │
│   │       │                                  │              │
│   │       ▼                                  │              │
│   │   [更新UI]                               │              │
│   │       │                                  │              │
│   │       └──────────────────────────────────┘              │
│                                                             │
│   [游戏暂停/关闭]                                           │
│       │                                                     │
│       ▼                                                     │
│   [停止产出计时器]                                          │
│   - 记录最后产出时间                                        │
│   - 保存游戏状态                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 GPS处理流程

```
GPS产出流程:

1. 游戏启动
      │
      ▼
2. 初始化GPS
   - 读取升级等级
   - 计算基础GPS
   - 应用道具加成
      │
      ▼
3. 启动产出计时器
   setInterval(produceGold, 1000)
      │
      ▼
4. 每秒执行产出
   ┌────────────────────────────────┐
   │  produceGold() {               │
   │    // 计算本次产出             │
   │    let gold = calculateGPS();  │
   │                               │
   │    // 应用全局加成             │
   │    gold *= globalMultiplier;   │
   │                               │
   │    // 添加金币                 │
   │    currentGold += gold;        │
   │    totalGoldEarned += gold;    │
   │                               │
   │    // 更新UI                   │
   │    updateGoldDisplay();        │
   │  }                            │
   └────────────────────────────────┘
      │
      ▼
5. 升级触发GPS更新
   - 重新计算GPS
   - 即时生效
```

### 5.6 GPS显示更新规则

| 触发条件 | 更新方式 |
|----------|----------|
| 游戏启动 | 立即计算并显示 |
| 购买升级 | 即时重新计算并更新 |
| 道具激活 | 即时应用加成并更新 |
| 道具失效 | 即时移除加成并更新 |
| 每秒产出 | 更新金币显示 |

### 5.7 GPS数据结构

```javascript
// GPS状态数据
const gpsState = {
    currentGPS: 0,              // 当前GPS
    baseGPS: 0,                 // 基础GPS
    multiplier: 1.0,            // GPS倍率
    lastProduceTime: 0,         // 上次产出时间
    totalProduced: 0            // 总产出金币
};

// GPS配置
const gpsConfig = {
    PRODUCE_INTERVAL: 1000,     // 产出间隔(ms)
    MIN_GPS: 0,                 // 最小GPS
    AUTO_SAVE_INTERVAL: 30000   // 自动存档间隔(ms)
};

// GPS计算函数
function calculateGPS() {
    let gps = 0;
    
    // 自动点击器贡献
    gps += upgrades.autoClicker.level * 1;
    
    // 超级点击器贡献
    gps += upgrades.megaClicker.level * 10;
    
    // 应用倍率
    gps *= gpsState.multiplier;
    
    return Math.floor(gps);
}
```

---

## 六、离线收益系统设计

### 6.1 系统概述

离线收益系统在玩家离线期间继续计算金币产出，鼓励玩家定期回归游戏。

### 6.2 设计目标

- 奖励回归玩家
- 降低玩家流失率
- 提供合理的离线收益上限
- 与GPS系统形成联动

### 6.3 核心规则

#### 6.3.1 离线收益计算规则

| 参数 | 数值 | 说明 |
|------|------|------|
| 离线效率 | 50% | 按GPS的50%计算 |
| 最大计算时间 | 24小时 | 超过24小时按24小时计算 |
| 最小离线时间 | 60秒 | 少于60秒不计算离线收益 |
| 收益上限 | 无 | 受最大时间限制 |

#### 6.3.2 离线收益计算公式

```
离线收益计算公式:
offlineGold = GPS * 0.5 * min(offlineSeconds, 86400)

其中:
- GPS: 当前的每秒金币产出
- 0.5: 离线效率(50%)
- offlineSeconds: 离线秒数
- 86400: 24小时的秒数
- min(): 取最小值，限制最大计算时间

示例:
- GPS = 100
- 离线时间 = 2小时 = 7200秒
- 离线收益 = 100 * 0.5 * 7200 = 360,000 金币
```

#### 6.3.3 离线时间限制规则

| 离线时间 | 处理方式 |
|----------|----------|
| < 60秒 | 不计算离线收益 |
| 60秒 - 24小时 | 正常计算 |
| > 24小时 | 按24小时计算 |

### 6.4 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                   离线收益状态机                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [游戏关闭]                                                │
│       │                                                     │
│       ▼                                                     │
│   [记录退出时间]                                            │
│   exitTime = Date.now()                                     │
│       │                                                     │
│       ▼                                                     │
│   [保存游戏状态]                                            │
│   - 当前金币                                                │
│   - GPS数值                                                 │
│   - 退出时间                                                │
│       │                                                     │
│       ▼                                                     │
│   [游戏离线]                                                │
│                                                             │
│   ─────────────────────────────────────────────────────     │
│                                                             │
│   [游戏重新打开]                                            │
│       │                                                     │
│       ▼                                                     │
│   [读取退出时间]                                            │
│       │                                                     │
│       ▼                                                     │
│   [计算离线时间]                                            │
│   offlineSeconds = (now - exitTime) / 1000                  │
│       │                                                     │
│       ├── offlineSeconds < 60秒 ──► [跳过离线收益]          │
│       │                                     │               │
│       │                                     ▼               │
│       │                              [正常进入游戏]         │
│       │                                                     │
│       └── offlineSeconds >= 60秒                            │
│               │                                             │
│               ▼                                             │
│       [计算离线收益]                                        │
│       offlineGold = GPS * 0.5 * min(offlineSeconds, 86400)  │
│               │                                             │
│               ▼                                             │
│       [显示离线收益弹窗]                                    │
│               │                                             │
│               ▼                                             │
│       [玩家确认领取]                                        │
│               │                                             │
│               ▼                                             │
│       [添加离线金币]                                        │
│       currentGold += offlineGold                            │
│               │                                             │
│               ▼                                             │
│       [更新统计]                                            │
│       totalOfflineGold += offlineGold                       │
│               │                                             │
│               ▼                                             │
│       [正常进入游戏]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 离线收益处理流程

```
离线收益处理流程:

1. 游戏启动
      │
      ▼
2. 读取存档数据
   - exitTime: 上次退出时间
   - lastGPS: 上次GPS
      │
      ▼
3. 计算离线时间
   currentTime = Date.now()
   offlineMs = currentTime - exitTime
   offlineSeconds = Math.floor(offlineMs / 1000)
      │
      ▼
4. 判断是否计算离线收益
      │
      ├── offlineSeconds < 60 ──► 跳过，直接进入游戏
      │
      └── offlineSeconds >= 60 ──► 继续计算
              │
              ▼
          5. 限制最大计算时间
              effectiveSeconds = Math.min(offlineSeconds, 86400)
              │
              ▼
          6. 计算离线收益
              offlineGold = lastGPS * 0.5 * effectiveSeconds
              offlineGold = Math.floor(offlineGold)
              │
              ▼
          7. 显示离线收益弹窗
              - 显示离线时间
              - 显示获得金币
              - 等待玩家确认
              │
              ▼
          8. 玩家点击"领取"
              │
              ▼
          9. 添加金币
              currentGold += offlineGold
              totalGoldEarned += offlineGold
              totalOfflineGold += offlineGold
              │
              ▼
          10. 更新成就进度
              - 离线收益成就检测
              │
              ▼
          11. 进入游戏主界面
```

### 6.6 离线收益弹窗设计

```
┌─────────────────────────────────────────┐
│                                         │
│           欢迎回来！                    │
│                                         │
│   你离线了 2小时30分钟                   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │      获得 360,000 金币！        │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│         ┌─────────────────┐             │
│         │     领 取       │             │
│         └─────────────────┘             │
│                                         │
└─────────────────────────────────────────┘

弹窗规格:
- 标题: "欢迎回来！"
- 离线时间: 格式化显示 (X小时X分钟)
- 金币数量: 格式化显示 (使用金币格式化规则)
- 领取按钮: 居中显示，点击后关闭弹窗并添加金币
```

### 6.7 离线收益数据结构

```javascript
// 离线收益状态数据
const offlineState = {
    exitTime: 0,                // 退出时间戳
    lastGPS: 0,                 // 退出时的GPS
    totalOfflineGold: 0,        // 累计离线收益
    maxOfflineSeconds: 86400,   // 最大计算秒数(24小时)
    minOfflineSeconds: 60,      // 最小计算秒数(60秒)
    offlineEfficiency: 0.5      // 离线效率(50%)
};

// 离线收益计算函数
function calculateOfflineReward(exitTime, gps) {
    const now = Date.now();
    const offlineMs = now - exitTime;
    const offlineSeconds = Math.floor(offlineMs / 1000);
    
    // 检查最小离线时间
    if (offlineSeconds < offlineState.minOfflineSeconds) {
        return 0;
    }
    
    // 限制最大计算时间
    const effectiveSeconds = Math.min(offlineSeconds, offlineState.maxOfflineSeconds);
    
    // 计算离线收益
    const offlineGold = gps * offlineState.offlineEfficiency * effectiveSeconds;
    
    return Math.floor(offlineGold);
}
```

---

## 七、点击反馈设计

### 7.1 系统概述

点击反馈系统为玩家提供即时的视觉和听觉反馈，增强点击的满足感和游戏体验。

### 7.2 设计目标

- 提供即时、明确的点击反馈
- 增强点击的满足感
- 区分不同类型的点击结果
- 与暴击、连击系统联动

### 7.3 反馈类型定义

#### 7.3.1 普通点击反馈

| 反馈元素 | 规格 | 说明 |
|----------|------|------|
| 按钮缩放 | 0.95 → 1.0 (0.1s) | 按下时缩小，释放时恢复 |
| 金币飘字 | 向上飘动 + 淡出 (0.5s) | 显示获得的金币数量 |
| 点击音效 | 清脆"叮"声 | 音量 0.5 |

#### 7.3.2 连击反馈

| 连击阶段 | 视觉反馈 | 音效 |
|----------|----------|------|
| 1-5 连击 | 按钮轻微发光 | 轻柔"叮"声 (音量 0.6) |
| 6-10 连击 | 按钮明显发光 + 边框高亮 | 清脆"叮叮"声 (音量 0.7) |
| 11+ 连击 | 强烈发光 + 粒子效果 | 华丽"叮叮叮"声 (音量 0.8) |

#### 7.3.3 暴击反馈

| 暴击类型 | 视觉反馈 | 音效 |
|----------|----------|------|
| 小暴击 | 黄色闪光 + 5-10粒子 | "叮"声 (音量 0.7) |
| 中暴击 | 橙色闪光 + 15-20粒子 + 轻微震动 | "叮咚"声 (音量 0.8) |
| 大暴击 | 金色闪光 + 30-50粒子 + 明显震动 + 金币雨 | "轰"声 (音量 1.0) |

### 7.4 按钮动画设计

#### 7.4.1 点击缩放动画

```
按钮缩放动画规格:
- 按下状态: scale(0.95)
- 释放状态: scale(1.0)
- 动画时长: 100ms
- 缓动函数: ease-out

CSS实现:
.button:active {
    transform: scale(0.95);
    transition: transform 0.1s ease-out;
}

.button {
    transform: scale(1.0);
    transition: transform 0.1s ease-out;
}
```

#### 7.4.2 连击发光动画

```
连击发光动画规格:
- 发光颜色: #FFD700 (金色)
- 发光强度: 
  - 1-5连击: box-shadow 0 0 10px
  - 6-10连击: box-shadow 0 0 20px
  - 11+连击: box-shadow 0 0 30px
- 动画时长: 持续到连击中断

CSS实现:
.combo-1-5 {
    box-shadow: 0 0 10px #FFD700;
    animation: glow-soft 0.5s infinite alternate;
}

.combo-6-10 {
    box-shadow: 0 0 20px #FFD700;
    animation: glow-medium 0.3s infinite alternate;
}

.combo-11-plus {
    box-shadow: 0 0 30px #FFD700;
    animation: glow-strong 0.2s infinite alternate;
}
```

### 7.5 金币飘字设计

#### 7.5.1 飘字动画规格

```
金币飘字动画规格:
- 初始位置: 点击按钮中心
- 移动方向: 向上
- 移动距离: 50-80px
- 动画时长: 500ms
- 淡出时间: 最后200ms
- 字体大小: 16px - 24px (根据金币数量)
- 颜色: 
  - 普通点击: #FFD700 (金色)
  - 小暴击: #FFD700 (金色) + 放大1.2x
  - 中暴击: #FF9800 (橙色) + 放大1.5x
  - 大暴击: #FFD700 (金色) + 放大2.0x
```

#### 7.5.2 飘字实现逻辑

```javascript
/**
 * 创建金币飘字效果
 * @param {number} gold - 获得的金币数量
 * @param {string} type - 点击类型 ("normal", "small", "medium", "mega")
 */
function createGoldPopup(gold, type = "normal") {
    // 创建飘字元素
    const popup = document.createElement("div");
    popup.className = "gold-popup";
    popup.textContent = "+" + formatGold(gold);
    
    // 根据类型设置样式
    const styles = {
        normal: { color: "#FFD700", scale: 1 },
        small: { color: "#FFD700", scale: 1.2 },
        medium: { color: "#FF9800", scale: 1.5 },
        mega: { color: "#FFD700", scale: 2.0 }
    };
    
    const style = styles[type];
    popup.style.color = style.color;
    popup.style.transform = `scale(${style.scale})`;
    
    // 设置初始位置
    popup.style.left = clickButton.centerX + "px";
    popup.style.top = clickButton.centerY + "px";
    
    // 添加到DOM
    document.body.appendChild(popup);
    
    // 启动动画
    animatePopup(popup);
    
    // 动画结束后移除
    setTimeout(() => popup.remove(), 500);
}
```

### 7.6 粒子效果设计

#### 7.6.1 粒子效果规格

| 粒子类型 | 数量 | 大小 | 颜色 | 运动 |
|----------|------|------|------|------|
| 普通点击 | 0 | - | - | - |
| 小暴击 | 5-10 | 3-5px | #FFD700 | 向上飘散 |
| 中暴击 | 15-20 | 5-8px | #FF9800 | 向四周扩散 |
| 大暴击 | 30-50 | 8-12px | #FFD700 | 爆炸式扩散 |

#### 7.6.2 粒子动画参数

```
粒子动画参数:
- 生成位置: 点击按钮中心
- 初始速度: 
  - 小暴击: 50-100px/s (向上)
  - 中暴击: 100-150px/s (四周)
  - 大暴击: 150-200px/s (爆炸)
- 重力: 50px/s² (向下)
- 生命周期: 500-800ms
- 淡出: 最后200ms
- 旋转: 随机 0-360度
```

### 7.7 音效设计

#### 7.7.1 音效文件规格

| 音效名称 | 文件格式 | 时长 | 文件大小 |
|----------|----------|------|----------|
| click_normal.mp3 | MP3 | 0.2s | < 5KB |
| click_combo_1.mp3 | MP3 | 0.2s | < 5KB |
| click_combo_2.mp3 | MP3 | 0.3s | < 5KB |
| click_combo_3.mp3 | MP3 | 0.3s | < 5KB |
| critical_small.mp3 | MP3 | 0.3s | < 10KB |
| critical_medium.mp3 | MP3 | 0.4s | < 10KB |
| critical_mega.mp3 | MP3 | 0.5s | < 15KB |

#### 7.7.2 音效播放逻辑

```javascript
/**
 * 播放点击音效
 * @param {string} type - 音效类型
 */
function playClickSound(type) {
    const soundMap = {
        normal: "click_normal.mp3",
        combo_1: "click_combo_1.mp3",
        combo_2: "click_combo_2.mp3",
        combo_3: "click_combo_3.mp3",
        critical_small: "critical_small.mp3",
        critical_medium: "critical_medium.mp3",
        critical_mega: "critical_mega.mp3"
    };
    
    const volumeMap = {
        normal: 0.5,
        combo_1: 0.6,
        combo_2: 0.7,
        combo_3: 0.8,
        critical_small: 0.7,
        critical_medium: 0.8,
        critical_mega: 1.0
    };
    
    const audio = new Audio(`./assets/audio/sfx/${soundMap[type]}`);
    audio.volume = volumeMap[type] * settings.sfxVolume;
    audio.play();
}
```

### 7.8 反馈数据结构

```javascript
// 反馈配置
const feedbackConfig = {
    button: {
        scaleDown: 0.95,
        scaleNormal: 1.0,
        animationDuration: 100
    },
    popup: {
        moveDistance: 60,
        duration: 500,
        fadeOutStart: 300
    },
    particle: {
        small: { count: [5, 10], size: [3, 5] },
        medium: { count: [15, 20], size: [5, 8] },
        mega: { count: [30, 50], size: [8, 12] }
    },
    sound: {
        normal: { file: "click_normal.mp3", volume: 0.5 },
        combo_1: { file: "click_combo_1.mp3", volume: 0.6 },
        combo_2: { file: "click_combo_2.mp3", volume: 0.7 },
        combo_3: { file: "click_combo_3.mp3", volume: 0.8 },
        critical_small: { file: "critical_small.mp3", volume: 0.7 },
        critical_medium: { file: "critical_medium.mp3", volume: 0.8 },
        critical_mega: { file: "critical_mega.mp3", volume: 1.0 }
    }
};
```

---

## 八、接口定义

### 8.1 点击系统接口

```javascript
/**
 * 点击系统接口
 */
interface IClickSystem {
    // 处理点击事件
    handleClick(): void;
    
    // 获取点击产出
    getClickGold(): number;
    
    // 获取总点击次数
    getTotalClicks(): number;
    
    // 重置点击计数
    resetClicks(): void;
}

/**
 * 点击系统实现
 */
class ClickSystem implements IClickSystem {
    private totalClicks: number = 0;
    private sessionClicks: number = 0;
    private lastClickTime: number = 0;
    
    handleClick(): void {
        this.totalClicks++;
        this.sessionClicks++;
        this.lastClickTime = Date.now();
        
        // 计算金币产出
        const gold = this.getClickGold();
        
        // 更新金币
        gameManager.addGold(gold);
        
        // 触发连击检测
        comboSystem.checkCombo(this.lastClickTime);
        
        // 触发暴击检测
        const critical = criticalSystem.checkCritical();
        
        // 播放反馈
        feedbackSystem.playClickFeedback(critical);
    }
    
    getClickGold(): number {
        let gold = 1; // 基础产出
        
        // 应用点击加成
        gold *= upgradeManager.getClickMultiplier();
        
        // 应用连击加成
        gold *= comboSystem.getComboMultiplier();
        
        // 应用暴击加成
        gold *= criticalSystem.getLastCriticalMultiplier();
        
        // 应用全局加成
        gold *= gameManager.getGlobalMultiplier();
        
        return Math.floor(gold);
    }
    
    getTotalClicks(): number {
        return this.totalClicks;
    }
    
    resetClicks(): void {
        this.sessionClicks = 0;
    }
}
```

### 8.2 连击系统接口

```javascript
/**
 * 连击系统接口
 */
interface IComboSystem {
    // 检查连击
    checkCombo(clickTime: number): void;
    
    // 获取连击倍率
    getComboMultiplier(): number;
    
    // 获取当前连击数
    getComboCount(): number;
    
    // 重置连击
    resetCombo(): void;
}

/**
 * 连击系统实现
 */
class ComboSystem implements IComboSystem {
    private comboCount: number = 0;
    private comboMultiplier: number = 1.0;
    private lastClickTime: number = 0;
    private maxCombo: number = 0;
    private comboTimer: number | null = null;
    
    private readonly TIME_WINDOW: number = 500; // ms
    private readonly MAX_MULTIPLIER: number = 2.0;
    private readonly MULTIPLIER_INCREMENT: number = 0.1;
    
    checkCombo(clickTime: number): void {
        const timeDiff = clickTime - this.lastClickTime;
        
        if (timeDiff <= this.TIME_WINDOW && this.comboCount > 0) {
            // 连击有效
            this.comboCount++;
            this.updateMultiplier();
        } else {
            // 连击中断或首次点击
            if (this.comboCount > this.maxCombo) {
                this.maxCombo = this.comboCount;
            }
            this.comboCount = 1;
            this.comboMultiplier = 1.0;
        }
        
        this.lastClickTime = clickTime;
        this.resetComboTimer();
    }
    
    private updateMultiplier(): void {
        this.comboMultiplier = Math.min(
            1.0 + (this.comboCount * this.MULTIPLIER_INCREMENT),
            this.MAX_MULTIPLIER
        );
    }
    
    private resetComboTimer(): void {
        if (this.comboTimer !== null) {
            clearTimeout(this.comboTimer);
        }
        
        this.comboTimer = window.setTimeout(() => {
            this.resetCombo();
        }, this.TIME_WINDOW);
    }
    
    getComboMultiplier(): number {
        return this.comboMultiplier;
    }
    
    getComboCount(): number {
        return this.comboCount;
    }
    
    resetCombo(): void {
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
        
        if (this.comboTimer !== null) {
            clearTimeout(this.comboTimer);
            this.comboTimer = null;
        }
    }
}
```

### 8.3 暴击系统接口

```javascript
/**
 * 暴击系统接口
 */
interface ICriticalSystem {
    // 检查暴击
    checkCritical(): CriticalResult;
    
    // 获取上次暴击倍率
    getLastCriticalMultiplier(): number;
    
    // 获取暴击统计
    getCriticalStats(): CriticalStats;
}

/**
 * 暴击结果
 */
interface CriticalResult {
    type: "NONE" | "SMALL" | "MEDIUM" | "MEGA";
    multiplier: number;
}

/**
 * 暴击统计
 */
interface CriticalStats {
    total: number;
    small: number;
    medium: number;
    mega: number;
}

/**
 * 暴击系统实现
 */
class CriticalSystem implements ICriticalSystem {
    private lastCriticalMultiplier: number = 1.0;
    private stats: CriticalStats = {
        total: 0,
        small: 0,
        medium: 0,
        mega: 0
    };
    
    private readonly CRITICAL_CONFIG = {
        MEGA: { probability: 1, multiplier: 10 },
        MEDIUM: { probability: 5, multiplier: 5 },
        SMALL: { probability: 10, multiplier: 2 }
    };
    
    checkCritical(): CriticalResult {
        const random = Math.random() * 100;
        
        let result: CriticalResult;
        
        if (random < this.CRITICAL_CONFIG.MEGA.probability) {
            result = { type: "MEGA", multiplier: this.CRITICAL_CONFIG.MEGA.multiplier };
            this.stats.mega++;
        } else if (random < this.CRITICAL_CONFIG.MEGA.probability + this.CRITICAL_CONFIG.MEDIUM.probability) {
            result = { type: "MEDIUM", multiplier: this.CRITICAL_CONFIG.MEDIUM.multiplier };
            this.stats.medium++;
        } else if (random < this.CRITICAL_CONFIG.MEGA.probability + this.CRITICAL_CONFIG.MEDIUM.probability + this.CRITICAL_CONFIG.SMALL.probability) {
            result = { type: "SMALL", multiplier: this.CRITICAL_CONFIG.SMALL.multiplier };
            this.stats.small++;
        } else {
            result = { type: "NONE", multiplier: 1 };
        }
        
        if (result.type !== "NONE") {
            this.stats.total++;
        }
        
        this.lastCriticalMultiplier = result.multiplier;
        return result;
    }
    
    getLastCriticalMultiplier(): number {
        return this.lastCriticalMultiplier;
    }
    
    getCriticalStats(): CriticalStats {
        return { ...this.stats };
    }
}
```

### 8.4 GPS系统接口

```javascript
/**
 * GPS系统接口
 */
interface IGPSManager {
    // 计算GPS
    calculateGPS(): number;
    
    // 获取当前GPS
    getCurrentGPS(): number;
    
    // 启动自动产出
    startProduction(): void;
    
    // 停止自动产出
    stopProduction(): void;
    
    // 更新GPS（升级后调用）
    updateGPS(): void;
}

/**
 * GPS管理器实现
 */
class GPSManager implements IGPSManager {
    private currentGPS: number = 0;
    private produceInterval: number | null = null;
    private lastProduceTime: number = 0;
    
    private readonly PRODUCE_INTERVAL: number = 1000; // 1秒
    
    calculateGPS(): number {
        let gps = 0;
        
        // 自动点击器贡献
        const autoClickerLevel = upgradeManager.getUpgradeLevel("auto_clicker");
        gps += autoClickerLevel * 1;
        
        // 超级点击器贡献
        const megaClickerLevel = upgradeManager.getUpgradeLevel("mega_clicker");
        gps += megaClickerLevel * 10;
        
        // 应用全局倍率
        gps *= gameManager.getGlobalMultiplier();
        
        return Math.floor(gps);
    }
    
    getCurrentGPS(): number {
        return this.currentGPS;
    }
    
    startProduction(): void {
        this.updateGPS();
        
        this.produceInterval = window.setInterval(() => {
            this.produce();
        }, this.PRODUCE_INTERVAL);
        
        this.lastProduceTime = Date.now();
    }
    
    stopProduction(): void {
        if (this.produceInterval !== null) {
            clearInterval(this.produceInterval);
            this.produceInterval = null;
        }
    }
    
    updateGPS(): void {
        this.currentGPS = this.calculateGPS();
        uiManager.updateGPSDisplay(this.currentGPS);
    }
    
    private produce(): void {
        if (this.currentGPS > 0) {
            gameManager.addGold(this.currentGPS);
            this.lastProduceTime = Date.now();
        }
    }
}
```

### 8.5 离线收益系统接口

```javascript
/**
 * 离线收益系统接口
 */
interface IOfflineManager {
    // 记录退出时间
    recordExit(): void;
    
    // 计算离线收益
    calculateOfflineReward(): number;
    
    // 显示离线收益弹窗
    showOfflinePopup(reward: number): void;
    
    // 领取离线收益
    claimOfflineReward(reward: number): void;
}

/**
 * 离线收益管理器实现
 */
class OfflineManager implements IOfflineManager {
    private exitTime: number = 0;
    private lastGPS: number = 0;
    private totalOfflineGold: number = 0;
    
    private readonly MIN_OFFLINE_SECONDS: number = 60;
    private readonly MAX_OFFLINE_SECONDS: number = 86400; // 24小时
    private readonly OFFLINE_EFFICIENCY: number = 0.5; // 50%
    
    recordExit(): void {
        this.exitTime = Date.now();
        this.lastGPS = gpsManager.getCurrentGPS();
        saveManager.saveGame();
    }
    
    calculateOfflineReward(): number {
        const now = Date.now();
        const offlineMs = now - this.exitTime;
        const offlineSeconds = Math.floor(offlineMs / 1000);
        
        // 检查最小离线时间
        if (offlineSeconds < this.MIN_OFFLINE_SECONDS) {
            return 0;
        }
        
        // 限制最大计算时间
        const effectiveSeconds = Math.min(offlineSeconds, this.MAX_OFFLINE_SECONDS);
        
        // 计算离线收益
        const reward = this.lastGPS * this.OFFLINE_EFFICIENCY * effectiveSeconds;
        
        return Math.floor(reward);
    }
    
    showOfflinePopup(reward: number): void {
        const offlineSeconds = Math.floor((Date.now() - this.exitTime) / 1000);
        const formattedTime = this.formatOfflineTime(offlineSeconds);
        const formattedReward = formatGold(reward);
        
        uiManager.showOfflinePopup({
            time: formattedTime,
            reward: formattedReward,
            onClaim: () => this.claimOfflineReward(reward)
        });
    }
    
    claimOfflineReward(reward: number): void {
        gameManager.addGold(reward);
        this.totalOfflineGold += reward;
        achievementManager.checkOfflineAchievements(reward);
    }
    
    private formatOfflineTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    }
}
```

### 8.6 金币格式化接口

```javascript
/**
 * 金币格式化接口
 */
interface IGoldFormatter {
    // 格式化金币显示
    format(gold: number): string;
    
    // 解析格式化字符串为数字
    parse(formatted: string): number;
}

/**
 * 金币格式化器实现
 */
class GoldFormatter implements IGoldFormatter {
    private readonly UNITS = ["", "K", "M", "B", "T"];
    private readonly MAX_GOLD = 1e308;
    
    format(gold: number): string {
        // 边界情况处理
        if (gold < 0) return "0";
        if (gold >= this.MAX_GOLD) return "MAX";
        if (gold < 1000) return Math.floor(gold).toString();
        
        // 计算单位索引
        const tier = Math.floor(Math.log10(gold) / 3);
        const unitIndex = Math.min(tier, this.UNITS.length - 1);
        
        // 计算显示数值
        const scaled = gold / Math.pow(1000, unitIndex);
        
        // 格式化输出
        if (scaled >= 100) {
            return Math.floor(scaled) + this.UNITS[unitIndex];
        } else {
            return scaled.toFixed(1) + this.UNITS[unitIndex];
        }
    }
    
    parse(formatted: string): number {
        if (formatted === "MAX") return this.MAX_GOLD;
        if (formatted === "0") return 0;
        
        const match = formatted.match(/^([\d.]+)([KMBT]?)$/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        const unitIndex = this.UNITS.indexOf(unit);
        if (unitIndex === -1) return value;
        
        return value * Math.pow(1000, unitIndex);
    }
}
```

---

## 九、数值配置表

### 9.1 点击系统配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| BASE_CLICK_GOLD | 1 | 基础点击金币产出 |
| MAX_CLICK_FREQUENCY | 20 | 最大点击频率(次/秒) |
| CLICK_RESPONSE_TIME | 50 | 点击响应时间上限(ms) |

### 9.2 连击系统配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| COMBO_TIME_WINDOW | 500 | 连击时间窗口(ms) |
| COMBO_MAX_MULTIPLIER | 2.0 | 最大连击倍率 |
| COMBO_MULTIPLIER_INCREMENT | 0.1 | 每次连击增加的倍率 |

### 9.3 暴击系统配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| CRITICAL_SMALL_PROBABILITY | 10 | 小暴击概率(%) |
| CRITICAL_SMALL_MULTIPLIER | 2 | 小暴击倍率 |
| CRITICAL_MEDIUM_PROBABILITY | 5 | 中暴击概率(%) |
| CRITICAL_MEDIUM_MULTIPLIER | 5 | 中暴击倍率 |
| CRITICAL_MEGA_PROBABILITY | 1 | 大暴击概率(%) |
| CRITICAL_MEGA_MULTIPLIER | 10 | 大暴击倍率 |

### 9.4 GPS系统配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| GPS_PRODUCE_INTERVAL | 1000 | GPS产出间隔(ms) |
| GPS_BASE_VALUE | 0 | 基础GPS值 |
| AUTO_CLICKER_GPS | 1 | 自动点击器每级GPS |
| MEGA_CLICKER_GPS | 10 | 超级点击器每级GPS |

### 9.5 离线收益配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| OFFLINE_MIN_SECONDS | 60 | 最小离线计算时间(秒) |
| OFFLINE_MAX_SECONDS | 86400 | 最大离线计算时间(秒) |
| OFFLINE_EFFICIENCY | 0.5 | 离线效率(%) |

### 9.6 金币显示配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| GOLD_MAX_VALUE | 1e308 | 金币上限 |
| GOLD_DECIMAL_PLACES | 1 | 小数位数 |
| GOLD_UNITS | ["", "K", "M", "B", "T"] | 金币单位 |

### 9.7 反馈效果配置

| 参数名 | 参数值 | 说明 |
|--------|--------|------|
| BUTTON_SCALE_DOWN | 0.95 | 按钮按下缩放 |
| BUTTON_ANIMATION_DURATION | 100 | 按钮动画时长(ms) |
| POPUP_MOVE_DISTANCE | 60 | 飘字移动距离(px) |
| POPUP_DURATION | 500 | 飘字动画时长(ms) |
| PARTICLE_SMALL_COUNT | [5, 10] | 小暴击粒子数量范围 |
| PARTICLE_MEDIUM_COUNT | [15, 20] | 中暴击粒子数量范围 |
| PARTICLE_MEGA_COUNT | [30, 50] | 大暴击粒子数量范围 |

---

## 附录

### A. 术语表

| 术语 | 全称 | 说明 |
|------|------|------|
| GPS | Gold Per Second | 每秒金币产出 |
| DPS | Damage Per Second | (本游戏不使用) |
| Combo | Combination | 连击 |
| Critical | Critical Hit | 暴击 |

### B. 参考文档

- [需求规格文档](../../01-需求文档/LD-REQ-SPLIT-v1.0-20260220.md)
- [项目信息](../../00-项目元数据/PROJECT-INFO.md)

### C. 修订历史

| 版本 | 日期 | 修订内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-02-20 | 初始版本 | SD-1 |

---

**文档结束**
