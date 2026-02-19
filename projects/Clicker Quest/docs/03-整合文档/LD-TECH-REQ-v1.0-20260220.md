# Clicker Quest - 完整技术需求文档

**文档编号**: LD-TECH-REQ-v1.0-20260220
**文档类型**: 主策划整合文档
**目标读者**: 主程序员(LP)
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
| 开发引擎 | Unity / Web技术栈 |
| 美术风格 | 二次元动漫风格 |
| 核心玩法 | 点击获取金币、购买道具、自动产出 |

### 1.2 核心游戏循环

```
点击获取金币 → 购买道具/升级 → 提升产出效率 → 积累更多金币 → 解锁成就/排行榜
      ↑                                                        ↓
      ←←←←←←←←←←←←←←←← 循环反馈 ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 1.3 系统模块概览

| 模块名称 | 模块职责 | 关联模块 |
|---------|---------|---------|
| 点击系统 | 处理点击检测、金币计算、暴击判定 | 金币系统、UI系统 |
| 金币系统 | 管理金币获取、消耗、显示 | 所有系统 |
| 道具系统 | 管理道具类型、效果、叠加规则 | 商店系统、金币系统 |
| 商店系统 | 提供道具购买、刷新、限制功能 | 道具系统、金币系统 |
| 存档系统 | 数据持久化、离线收益计算 | 所有系统 |
| 排行榜系统 | 排名计算、数据展示 | 存档系统 |
| 成就系统 | 成就解锁、奖励发放 | 所有系统 |
| UI系统 | 界面展示、交互反馈、动效播放 | 所有系统 |

---

## 二、技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         表现层 (Presentation)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 主界面UI │ │ 商店界面 │ │ 成就界面 │ │ 排行榜   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 动效系统 │ │ 音效系统 │ │ 粒子系统 │ │ 反馈系统 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
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
│  │ 事件总线 │ │ 对象池   │ │ 计时器   │ │ 日志系统 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```
点击系统 ──────→ 金币系统
    │              │
    ↓              ↓
暴击系统      道具系统
    │              │
    └──────┬───────┘
           ↓
       商店系统
           │
           ↓
       存档系统 ←── 排行榜系统
           │
           ↓
       成就系统
```

---

## 三、核心系统需求

### 3.1 点击系统

#### 3.1.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| CLICK-001 | 点击检测 | 检测玩家点击，判定点击有效性 | P0 |
| CLICK-002 | 点击冷却 | 50毫秒冷却时间，防止作弊 | P0 |
| CLICK-003 | 金币计算 | 计算点击获得的金币数量 | P0 |
| CLICK-004 | 暴击判定 | 判定暴击等级和倍率 | P0 |
| CLICK-005 | 反馈触发 | 触发视觉、听觉、触觉反馈 | P1 |

#### 3.1.2 点击判定规格

| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 判定区域 | 点击目标区域 | 圆形或方形 |
| 容错范围 | 10像素 | 向外扩展的容错区域 |
| 冷却时间 | 50毫秒 | 防止快速连点作弊 |
| 最小点击间隔 | 50毫秒 | 两次有效点击的最小间隔 |

#### 3.1.3 暴击系统规格

| 暴击等级 | 暴击倍率 | 基础概率 | 最大概率 | 视觉效果 |
|---------|---------|---------|---------|---------|
| 小暴击 | 2x | 10% | 50% | 金色闪光 + 小爆炸 |
| 中暴击 | 5x | 5% | 25% | 金色闪光 + 中爆炸 + 屏幕轻微震动 |
| 大暴击 | 10x | 1% | 10% | 金色闪光 + 大爆炸 + 屏幕强烈震动 + 全屏闪光 |

**暴击概率公式**:
```
finalCritChance = baseCritChance + critChanceBonus
```

**暴击判定流程**:
```
1. 生成随机数 random (0-100)
2. 判断暴击等级:
   - 如果 random < finalLargeCritChance → 大暴击
   - 否则如果 random < finalMediumCritChance → 中暴击
   - 否则如果 random < finalSmallCritChance → 小暴击
   - 否则 → 普通点击
```

### 3.2 金币系统

#### 3.2.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| GOLD-001 | 金币获取 | 处理金币增加逻辑 | P0 |
| GOLD-002 | 金币消耗 | 处理金币扣除逻辑 | P0 |
| GOLD-003 | 金币显示 | 格式化显示金币数量 | P0 |
| GOLD-004 | DPS计算 | 计算每秒金币产出 | P0 |
| GOLD-005 | 离线收益 | 计算离线期间的金币收益 | P1 |

#### 3.2.2 金币获取途径

| 获取途径 | 获取方式 | 金币数量 | 备注 |
|---------|---------|---------|------|
| 手动点击 | 玩家主动点击 | 1~1,000,000/次 | 受暴击影响 |
| 自动点击器 | 自动产出 | 根据DPS计算 | 每秒自动获取 |
| 成就奖励 | 完成成就 | 固定数值 | 一次性奖励 |
| 离线收益 | 离线期间 | DPS × 离线时长 × 50% | 上限24小时 |
| 观看广告 | 观看激励视频 | DPS × 60秒 | 每日限制次数 |

#### 3.2.3 金币计算公式

**点击金币公式**:
```
clickGold = (baseClickGold + clickLevelBonus) × critMultiplier × globalMultiplier

其中:
- baseClickGold: 基础点击金币（初始为1）
- clickLevelBonus: 点击升级加成
- critMultiplier: 暴击倍率（1x/2x/5x/10x）
- globalMultiplier: 全局加成（来自道具、活动等）
```

**DPS计算公式**:
```
DPS = baseAutoClickerDPS × autoClickerCount × autoClickerLevelBonus × globalMultiplier

其中:
- baseAutoClickerDPS: 自动点击器基础DPS
- autoClickerCount: 自动点击器数量
- autoClickerLevelBonus: 自动点击器升级加成
- globalMultiplier: 全局加成
```

**离线收益公式**:
```
offlineGold = DPS × min(offlineTime, 86400) × offlineMultiplier

其中:
- DPS: 当前每秒金币产出
- offlineTime: 离线时长（秒），上限24小时 = 86,400秒
- offlineMultiplier: 离线收益系数，默认50%
```

#### 3.2.4 金币显示格式

| 数值范围 | 显示格式 | 示例 |
|---------|---------|------|
| < 1,000 | 原始数值 | 999 |
| 1,000 ~ 999,999 | K格式 | 1.5K, 999K |
| 1,000,000 ~ 999,999,999 | M格式 | 1.5M, 999M |
| 1,000,000,000 ~ 999,999,999,999 | B格式 | 1.5B, 999B |
| 1,000,000,000,000+ | T格式 | 1.5T |
| 超大数值 | 科学计数法 | 1.5e15 |

### 3.3 道具系统

#### 3.3.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| ITEM-001 | 道具管理 | 管理道具的获取、使用、出售 | P0 |
| ITEM-002 | 效果应用 | 应用道具效果到游戏系统 | P0 |
| ITEM-003 | 叠加处理 | 处理道具效果的叠加规则 | P0 |
| ITEM-004 | 持续时间 | 管理限时道具的持续时间 | P1 |
| ITEM-005 | 离线计算 | 计算离线期间的道具效果 | P1 |

#### 3.3.2 道具类型定义

| 道具类型 | 类型标识 | 说明 | 示例 |
|---------|---------|------|------|
| 自动点击器 | AUTO | 持续产出金币 | 初级/中级/高级/顶级自动点击器 |
| 增益道具 | BUFF | 临时提升效果 | 金币翻倍、幸运药水、时间加速 |
| 消耗道具 | CONSUMABLE | 一次性使用 | 金币宝箱、幸运符、时间胶囊 |
| 永久道具 | PERMANENT | 永久提升效果 | 永久金币加成、永久暴击加成 |

#### 3.3.3 道具叠加规则

| 叠加类型 | 英文标识 | 说明 | 示例 |
|---------|---------|------|------|
| 可叠加 | STACKABLE | 效果累加，无上限 | 幸运药水 |
| 刷新叠加 | REFRESH | 效果不累加，刷新时间 | 金币翻倍 |
| 上限叠加 | CAP | 效果累加，有上限 | 暴击率（上限50%） |
| 不可叠加 | NON_STACKABLE | 效果不累加，不刷新 | 永久加成 |

#### 3.3.4 道具稀有度定义

| 稀有度 | 英文标识 | 颜色代码 | 获取难度 | 效果强度 |
|-------|---------|---------|---------|---------|
| 普通 | COMMON | #FFFFFF | 容易获取 | 基础效果 |
| 稀有 | RARE | #4A90E2 | 中等难度 | 1.5倍效果 |
| 史诗 | EPIC | #9B59B6 | 较难获取 | 2倍效果 |
| 传说 | LEGENDARY | #F39C12 | 极难获取 | 3倍效果 |

### 3.4 商店系统

#### 3.4.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| SHOP-001 | 道具展示 | 展示可购买的道具列表 | P0 |
| SHOP-002 | 购买流程 | 处理道具购买逻辑 | P0 |
| SHOP-003 | 购买限制 | 检查购买条件限制 | P0 |
| SHOP-004 | 刷新机制 | 处理商店道具刷新 | P1 |
| SHOP-005 | 排序筛选 | 提供道具排序和筛选功能 | P2 |

#### 3.4.2 购买前置条件检查

| 检查项 | 检查逻辑 | 失败提示 |
|-------|---------|---------|
| 金币数量 | currentGold >= itemPrice | "金币不足！还需要 X 金币" |
| 购买次数 | boughtCount < buyLimit | "该道具购买次数已达上限" |
| 等级限制 | playerLevel >= unlockLevel | "需要 X 级才能购买" |
| 前置道具 | hasItem(unlockItem) | "需要先购买 X" |
| 成就解锁 | hasAchievement(unlockAchievement) | "需要完成成就: X" |
| 冷却时间 | currentTime - lastBuyTime >= cooldown | "冷却中: X秒" |

#### 3.4.3 商店刷新规则

| 刷新类型 | 刷新时间 | 持续时间 | 示例 |
|---------|---------|---------|------|
| 每日刷新 | 每天0:00 | 24小时 | 每日礼包 |
| 每周刷新 | 每周一0:00 | 7天 | 每周礼包 |
| 随机刷新(4小时) | 每4小时检查 | 30%概率出现 | 稀有道具 |
| 随机刷新(8小时) | 每8小时检查 | 10%概率出现 | 史诗道具 |
| 随机刷新(24小时) | 每24小时检查 | 5%概率出现 | 传说道具 |

### 3.5 存档系统

#### 3.5.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| SAVE-001 | 自动存档 | 定时自动保存游戏数据 | P0 |
| SAVE-002 | 手动存档 | 玩家手动触发存档 | P1 |
| SAVE-003 | 数据加载 | 加载已保存的游戏数据 | P0 |
| SAVE-004 | 数据验证 | 验证存档数据的完整性 | P0 |
| SAVE-005 | 数据加密 | 加密敏感数据防止篡改 | P1 |

#### 3.5.2 存档触发时机

| 触发类型 | 触发条件 | 存档内容 | 优先级 |
|---------|---------|---------|--------|
| 定时存档 | 每30秒 | 完整游戏数据 | 低 |
| 关键操作存档 | 购买道具/升级/领取成就后 | 变更数据 | 高 |
| 关闭存档 | 游戏关闭时 | 完整游戏数据 | 高 |
| 离线存档 | 领取离线收益后 | 金币和统计数据 | 中 |

#### 3.5.3 数据安全方案

| 安全措施 | 实现方式 | 说明 |
|---------|---------|------|
| 数据加密 | AES-256-GCM | 加密敏感数据（金币、道具等） |
| 校验和验证 | SHA256 | 验证数据完整性 |
| 数据签名 | HMAC-SHA256 | 检测数据篡改 |
| 备份机制 | 保留最近3个存档 | 主存档损坏时自动恢复 |

### 3.6 排行榜系统

#### 3.6.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| RANK-001 | 排名计算 | 计算玩家在各排行榜中的排名 | P0 |
| RANK-002 | 数据展示 | 展示排行榜数据 | P0 |
| RANK-003 | 实时更新 | 实时更新排行榜数据 | P1 |
| RANK-004 | 周榜奖励 | 发放周榜奖励 | P2 |

#### 3.6.2 排行榜类型

| 排行榜类型 | 排名依据 | 数据来源 | 更新频率 |
|-----------|---------|---------|---------|
| 总金币排行榜 | 累计获得金币总数 | totalGoldEarned | 实时 |
| DPS排行榜 | 当前每秒金币产出 | currentDPS | 实时 |
| 游戏时长排行榜 | 累计游戏时长 | totalPlayTime | 实时 |
| 成就排行榜 | 累计解锁成就数量 | totalAchievementsUnlocked | 实时 |

#### 3.6.3 同分排名规则

当多个玩家排名依据相同时:
1. **优先级1**: 达到该数值的时间（越早排名越高）
2. **优先级2**: 累计游戏时长（越长排名越高）
3. **优先级3**: 玩家ID（字典序）

### 3.7 成就系统

#### 3.7.1 功能需求

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|---------|---------|--------|
| ACHV-001 | 成就解锁 | 检测并解锁成就 | P0 |
| ACHV-002 | 奖励发放 | 发放成就奖励 | P0 |
| ACHV-003 | 进度追踪 | 追踪成就完成进度 | P1 |
| ACHV-004 | 里程碑奖励 | 发放里程碑奖励 | P1 |

#### 3.7.2 成就类型分布

| 成就类型 | 成就数量 | 占比 | 设计理念 |
|---------|---------|------|---------|
| 点击成就 | 7个 | 17% | 核心玩法，基础成就 |
| 金币成就 | 7个 | 17% | 经济系统，进度体现 |
| 道具成就 | 10个 | 24% | 深度玩法，策略探索 |
| 时间成就 | 8个 | 19% | 长期投入，留存激励 |
| 特殊成就 | 10个 | 24% | 趣味挑战，话题传播 |

#### 3.7.3 成就难度分布

| 难度等级 | 成就数量 | 占比 | 目标玩家 |
|---------|---------|------|---------|
| 简单 | 15个 | 36% | 新手玩家 |
| 中等 | 15个 | 36% | 普通玩家 |
| 困难 | 8个 | 19% | 资深玩家 |
| 极难 | 3个 | 7% | 核心玩家 |
| 传说 | 1个 | 2% | 完美主义者 |

---

## 四、接口定义

### 4.1 点击系统接口

#### 4.1.1 点击管理器接口 (IClickManager)

```csharp
/// <summary>
/// 点击管理器接口
/// 负责处理点击检测、金币计算和反馈触发
/// </summary>
public interface IClickManager
{
    /// <summary>
    /// 处理点击事件
    /// </summary>
    /// <param name="clickPosition">点击位置（屏幕坐标）</param>
    /// <returns>点击结果（包含金币数量、暴击等级等）</returns>
    ClickResult HandleClick(Vector2 clickPosition);

    /// <summary>
    /// 获取当前点击金币数（不含暴击）
    /// </summary>
    /// <returns>基础点击金币数</returns>
    long GetBaseClickGold();

    /// <summary>
    /// 获取当前点击冷却状态
    /// </summary>
    /// <returns>是否可以点击</returns>
    bool CanClick();

    /// <summary>
    /// 设置全局金币倍率
    /// </summary>
    /// <param name="multiplier">倍率值</param>
    void SetGlobalMultiplier(float multiplier);
}

/// <summary>
/// 点击结果数据结构
/// </summary>
public struct ClickResult
{
    public long goldGained;           // 获得的金币数量
    public CriticalLevel criticalLevel; // 暴击等级
    public int criticalMultiplier;    // 暴击倍率
    public bool isValid;              // 点击是否有效
}

/// <summary>
/// 暴击等级枚举
/// </summary>
public enum CriticalLevel
{
    None,   // 无暴击
    Small,  // 小暴击 (2x)
    Medium, // 中暴击 (5x)
    Large   // 大暴击 (10x)
}
```

#### 4.1.2 暴击系统接口 (ICriticalHitSystem)

```csharp
/// <summary>
/// 暴击系统接口
/// 负责暴击判定和暴击概率管理
/// </summary>
public interface ICriticalHitSystem
{
    /// <summary>
    /// 计算暴击结果
    /// </summary>
    /// <returns>暴击结果（包含暴击等级和倍率）</returns>
    CriticalHitResult CalculateCriticalHit();

    /// <summary>
    /// 获取当前暴击概率
    /// </summary>
    /// <param name="level">暴击等级</param>
    /// <returns>暴击概率（百分比）</returns>
    float GetCriticalChance(CriticalLevel level);

    /// <summary>
    /// 增加暴击概率
    /// </summary>
    /// <param name="bonus">增加的概率（百分比）</param>
    void AddCriticalChanceBonus(float bonus);

    /// <summary>
    /// 重置暴击概率加成
    /// </summary>
    void ResetCriticalChanceBonus();
}

/// <summary>
/// 暴击结果数据结构
/// </summary>
public struct CriticalHitResult
{
    public CriticalLevel level;    // 暴击等级
    public int multiplier;         // 暴击倍率
}
```

### 4.2 金币系统接口

#### 4.2.1 金币管理器接口 (IGoldManager)

```csharp
/// <summary>
/// 金币管理器接口
/// 负责金币的获取、消耗和显示
/// </summary>
public interface IGoldManager
{
    /// <summary>
    /// 当前金币数量
    /// </summary>
    long CurrentGold { get; }

    /// <summary>
    /// 总获得金币数量
    /// </summary>
    long TotalGoldEarned { get; }

    /// <summary>
    /// 增加金币
    /// </summary>
    /// <param name="amount">增加数量</param>
    /// <param name="source">金币来源</param>
    void AddGold(long amount, GoldSource source);

    /// <summary>
    /// 消耗金币
    /// </summary>
    /// <param name="amount">消耗数量</param>
    /// <param name="purpose">消耗用途</param>
    /// <returns>是否消耗成功</returns>
    bool SpendGold(long amount, GoldPurpose purpose);

    /// <summary>
    /// 检查是否有足够金币
    /// </summary>
    /// <param name="amount">需要的金币数量</param>
    /// <returns>是否足够</returns>
    bool HasEnoughGold(long amount);

    /// <summary>
    /// 获取格式化的金币字符串
    /// </summary>
    /// <returns>格式化的金币字符串</returns>
    string GetFormattedGold();

    /// <summary>
    /// 金币变化事件
    /// </summary>
    event Action<long, long> OnGoldChanged; // (oldGold, newGold)
}

/// <summary>
/// 金币来源枚举
/// </summary>
public enum GoldSource
{
    ManualClick,      // 手动点击
    AutoClicker,      // 自动点击器
    Achievement,      // 成就奖励
    OfflineReward,    // 离线收益
    AdReward,         // 广告奖励
    Other             // 其他
}

/// <summary>
/// 金币用途枚举
/// </summary>
public enum GoldPurpose
{
    BuyAutoClicker,   // 购买自动点击器
    UpgradeClick,     // 升级点击
    UpgradeCritical,  // 升级暴击
    BuyItem,          // 购买道具
    ResetSkill,       // 重置技能
    Other             // 其他
}
```

#### 4.2.2 DPS计算器接口 (IDPSCalculator)

```csharp
/// <summary>
/// DPS计算器接口
/// 负责计算和更新每秒金币产出
/// </summary>
public interface IDPSCalculator
{
    /// <summary>
    /// 当前DPS
    /// </summary>
    long CurrentDPS { get; }

    /// <summary>
    /// 计算总DPS
    /// </summary>
    /// <returns>总DPS值</returns>
    long CalculateTotalDPS();

    /// <summary>
    /// 添加自动点击器
    /// </summary>
    /// <param name="autoClicker">自动点击器数据</param>
    void AddAutoClicker(AutoClickerData autoClicker);

    /// <summary>
    /// 移除自动点击器
    /// </summary>
    /// <param name="autoClickerId">自动点击器ID</param>
    void RemoveAutoClicker(string autoClickerId);

    /// <summary>
    /// 更新自动点击器数据
    /// </summary>
    /// <param name="autoClickerId">自动点击器ID</param>
    /// <param name="newData">新数据</param>
    void UpdateAutoClicker(string autoClickerId, AutoClickerData newData);

    /// <summary>
    /// 设置全局DPS倍率
    /// </summary>
    /// <param name="multiplier">倍率值</param>
    void SetGlobalMultiplier(float multiplier);

    /// <summary>
    /// DPS变化事件
    /// </summary>
    event Action<long> OnDPSChanged;
}

/// <summary>
/// 自动点击器数据结构
/// </summary>
public class AutoClickerData
{
    public string id;              // 自动点击器ID
    public AutoClickerType type;   // 自动点击器类型
    public long baseDPS;           // 基础DPS
    public int count;              // 数量
    public float levelBonus;       // 等级加成

    /// <summary>
    /// 计算实际DPS
    /// </summary>
    public long CalculateActualDPS()
    {
        return (long)(baseDPS * count * levelBonus);
    }
}

/// <summary>
/// 自动点击器类型枚举
/// </summary>
public enum AutoClickerType
{
    Beginner,     // 新手助手
    Apprentice,   // 见习矿工
    Skilled,      // 熟练工人
    Professional, // 专业团队
    Golden        // 黄金矿工
}
```

### 4.3 道具系统接口

#### 4.3.1 道具基础接口 (IItemBase)

```typescript
interface ItemBase {
  itemId: string;           // 道具ID
  itemName: string;         // 道具名称
  itemDescription: string;  // 道具描述
  itemIcon: string;         // 道具图标
  itemRarity: Rarity;       // 道具稀有度
  itemType: ItemType;       // 道具类型
  maxStack: number;         // 最大堆叠数
  sellPrice: number;        // 出售价格
}

enum Rarity {
  COMMON = "COMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY"
}

enum ItemType {
  AUTO = "AUTO",
  BUFF = "BUFF",
  CONSUMABLE = "CONSUMABLE",
  PERMANENT = "PERMANENT"
}
```

#### 4.3.2 道具效果接口 (IItemEffect)

```typescript
interface ItemEffect {
  effectType: EffectType;   // 效果类型
  effectValue: number;      // 效果数值
  effectDuration: number;   // 持续时间(秒)
  effectScope: EffectScope; // 效果范围
  stackType: StackType;     // 叠加类型
}

enum EffectType {
  GOLD_MULTIPLIER = "GOLD_MULTIPLIER",    // 金币倍率
  CRIT_RATE = "CRIT_RATE",                // 暴击率
  DPS_BOOST = "DPS_BOOST",                // DPS提升
  INSTANT_GOLD = "INSTANT_GOLD",          // 立即获得金币
  GUARANTEED_CRIT = "GUARANTEED_CRIT",    // 必定暴击
  OFFLINE_REWARD = "OFFLINE_REWARD"       // 离线收益
}

enum EffectScope {
  CLICK = "CLICK",               // 点击
  AUTO_CLICKER = "AUTO_CLICKER", // 自动点击器
  ALL = "ALL"                    // 全部
}

enum StackType {
  STACKABLE = "STACKABLE",       // 可叠加
  REFRESH = "REFRESH",           // 刷新叠加
  CAP = "CAP",                   // 上限叠加
  NON_STACKABLE = "NON_STACKABLE" // 不可叠加
}
```

#### 4.3.3 增益状态接口 (IBuffStatus)

```typescript
interface BuffStatus {
  buffId: string;        // 增益ID
  buffType: EffectType;  // 增益类型
  buffValue: number;     // 增益数值
  remainingTime: number; // 剩余时间(秒)
  stackCount: number;    // 叠加层数
  isActive: boolean;     // 是否激活
}

interface BuffCalculation {
  baseValue: number;      // 基础值
  buffMultiplier: number; // 增益倍率
  buffAddition: number;   // 增益加成
  finalValue: number;     // 最终值
  buffList: BuffStatus[]; // 增益列表
}
```

### 4.4 商店系统接口

#### 4.4.1 获取商店道具列表 (getShopItems)

**请求参数**:
```json
{
    "category": "category_upgrade",  // 分类ID，可选
    "page": 1,                       // 页码，默认1
    "pageSize": 20,                  // 每页数量，默认20
    "sortBy": "default"              // 排序方式: default/price_asc/price_desc/popular
}
```

**返回数据**:
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "items": [
            {
                "itemId": "item_upgrade_click_001",
                "itemName": "点击金币升级I",
                "itemDesc": "点击金币+1",
                "itemIcon": "icon_upgrade_click_001",
                "itemRarity": "common",
                "itemType": "upgrade",
                "price": 100,
                "currency": "gold",
                "buyLimit": 0,
                "boughtCount": 0,
                "unlockLevel": 1,
                "unlockItem": null,
                "unlockAchievement": null,
                "cooldown": 0,
                "lastBuyTime": null,
                "isLimited": false,
                "limitedEndTime": null,
                "isRandom": false,
                "randomProbability": 0,
                "effect": {
                    "type": "click_gold_add",
                    "value": 1,
                    "duration": 0
                },
                "canBuy": true,
                "reason": ""
            }
        ],
        "total": 50,
        "page": 1,
        "pageSize": 20
    }
}
```

#### 4.4.2 购买道具 (buyItem)

**请求参数**:
```json
{
    "itemId": "item_upgrade_click_001",
    "quantity": 1,
    "confirm": true
}
```

**返回数据**:
```json
{
    "code": 200,
    "message": "购买成功",
    "data": {
        "itemId": "item_upgrade_click_001",
        "itemName": "点击金币升级I",
        "quantity": 1,
        "costGold": 100,
        "remainingGold": 900,
        "effect": {
            "type": "click_gold_add",
            "value": 1,
            "duration": 0
        },
        "boughtCount": 1,
        "currentLevel": 1,
        "timestamp": "2026-02-20 10:30:00"
    }
}
```

#### 4.4.3 错误码定义

| 错误码 | 错误信息 | 说明 |
|--------|---------|------|
| 200 | 成功 | 操作成功 |
| 400 | 参数错误 | 请求参数格式错误 |
| 401 | 未授权 | 未登录或登录已过期 |
| 403 | 禁止访问 | 无权限访问 |
| 404 | 道具不存在 | 道具ID不存在 |
| 1001 | 金币不足 | 金币数量不足 |
| 1002 | 购买次数已达上限 | 购买次数已达上限 |
| 1003 | 等级不足 | 未达到解锁等级 |
| 1004 | 前置道具未购买 | 未购买前置道具 |
| 1005 | 成就未完成 | 未完成解锁成就 |
| 1006 | 冷却中 | 道具购买冷却中 |
| 1007 | 道具已下架 | 限时道具已下架 |
| 1008 | 网络异常 | 网络连接失败 |
| 1009 | 数据保存失败 | 数据保存失败 |

### 4.5 存档系统接口

#### 4.5.1 保存游戏数据 (saveGameData)

```typescript
interface SaveGameDataRequest {
  data: GameData;
  isAutoSave: boolean;
}

interface SaveGameDataResponse {
  success: boolean;
  saveTime: number;
  checksum: string;
  error?: string;
}
```

#### 4.5.2 加载游戏数据 (loadGameData)

```typescript
interface LoadGameDataRequest {
  playerId: string;
}

interface LoadGameDataResponse {
  success: boolean;
  data?: GameData;
  loadTime: number;
  error?: string;
}
```

#### 4.5.3 计算离线收益 (calculateOfflineReward)

```typescript
interface CalculateOfflineRewardRequest {
  lastSaveTime: number;
  currentTime: number;
  currentDPS: number;
  offlineRewardRatio: number;
}

interface CalculateOfflineRewardResponse {
  offlineTime: number;
  offlineReward: number;
  cappedTime: boolean;
}
```

### 4.6 排行榜系统接口

#### 4.6.1 获取排行榜数据 (getLeaderboard)

```typescript
interface GetLeaderboardRequest {
  leaderboardType: 'totalGold' | 'dps' | 'playTime' | 'achievements';
  page: number;
  pageSize: number;
}

interface GetLeaderboardResponse {
  success: boolean;
  leaderboard?: LeaderboardData;
  error?: string;
}
```

#### 4.6.2 更新排行榜数据 (updateLeaderboard)

```typescript
interface UpdateLeaderboardRequest {
  playerId: string;
  leaderboardType: string;
  score: number;
}

interface UpdateLeaderboardResponse {
  success: boolean;
  newRank: number;
  error?: string;
}
```

---

## 五、数据结构定义

### 5.1 玩家基础数据 (PlayerData)

```json
{
  "playerId": "string",
  "playerName": "string",
  "createTime": "number",
  "lastSaveTime": "number",
  "totalPlayTime": "number",
  "loginDays": "number",
  "lastLoginDate": "string"
}
```

**字段说明**:
- `playerId`: 玩家唯一标识符，格式: `player_[timestamp]_[random]`
- `playerName`: 玩家昵称，默认: "冒险者[随机数]"
- `createTime`: 账号创建时间戳(毫秒)
- `lastSaveTime`: 最后存档时间戳(毫秒)
- `totalPlayTime`: 累计游戏时长(秒)
- `loginDays`: 累计登录天数
- `lastLoginDate`: 最后登录日期，格式: YYYY-MM-DD

### 5.2 金币数据 (CurrencyData)

```json
{
  "currentGold": "number",
  "totalGoldEarned": "number",
  "totalGoldSpent": "number",
  "currentDPS": "number",
  "clickPower": "number",
  "critRate": "number",
  "critMultiplier": "number"
}
```

**字段说明**:
- `currentGold`: 当前金币数量
- `totalGoldEarned`: 累计获得金币
- `totalGoldSpent`: 累计消耗金币
- `currentDPS`: 当前每秒产出(DPS)
- `clickPower`: 点击金币数
- `critRate`: 暴击率(百分比，如: 10表示10%)
- `critMultiplier`: 暴击倍率(如: 2表示2倍)

### 5.3 道具数据 (ItemData)

```json
{
  "ownedItems": [
    {
      "itemId": "string",
      "itemName": "string",
      "itemType": "string",
      "quantity": "number",
      "level": "number",
      "isActive": "boolean",
      "remainingTime": "number",
      "purchaseTime": "number"
    }
  ],
  "autoClickers": [
    {
      "autoClickerId": "string",
      "type": "string",
      "baseOutput": "number",
      "currentOutput": "number",
      "quantity": "number",
      "level": "number",
      "totalOutput": "number"
    }
  ]
}
```

### 5.4 成就数据 (AchievementData)

```json
{
  "unlockedAchievements": [
    {
      "achievementId": "string",
      "achievementName": "string",
      "unlockTime": "number",
      "isClaimed": "boolean",
      "claimTime": "number"
    }
  ],
  "achievementProgress": {
    "achievementId": {
      "current": "number",
      "target": "number",
      "progress": "number"
    }
  }
}
```

### 5.5 设置数据 (SettingsData)

```json
{
  "audio": {
    "musicEnabled": "boolean",
    "musicVolume": "number",
    "sfxEnabled": "boolean",
    "sfxVolume": "number"
  },
  "notification": {
    "notificationEnabled": "boolean",
    "offlineRewardNotification": "boolean",
    "achievementNotification": "boolean"
  },
  "display": {
    "particleEffects": "boolean",
    "numberFormat": "string",
    "theme": "string"
  },
  "gameplay": {
    "autoSaveInterval": "number",
    "offlineRewardRatio": "number"
  }
}
```

### 5.6 统计数据 (StatisticsData)

```json
{
  "totalClicks": "number",
  "totalCrits": "number",
  "maxCritGold": "number",
  "totalItemsPurchased": "number",
  "totalAutoClickersPurchased": "number",
  "totalAchievementsUnlocked": "number",
  "highestDPS": "number",
  "highestGold": "number",
  "longestOfflineTime": "number",
  "totalOfflineRewards": "number"
}
```

### 5.7 完整存档数据结构

```json
{
  "version": "string",
  "checksum": "string",
  "timestamp": "number",
  "data": {
    "player": "PlayerData",
    "currency": "CurrencyData",
    "items": "ItemData",
    "achievements": "AchievementData",
    "settings": "SettingsData",
    "statistics": "StatisticsData"
  }
}
```

---

## 六、数值参数表

### 6.1 核心数值参数

| 参数名称 | 初始值 | 成长公式 | 上限 | 说明 |
|---------|-------|---------|------|------|
| 基础点击产出 | 1 | 1 × (1 + 0.1 × 等级) | 1000 | 每次点击的基础产出 |
| 点击升级成本 | 100 | 100 × 2^(等级-1) | 无 | 点击升级的金币成本 |
| 基础DPS | 0 | Σ(自动点击器产出) | 1e+15 | 每秒自动产出 |
| 暴击概率(小) | 10% | 10% + 道具加成 | 50% | 小暴击触发概率 |
| 暴击概率(中) | 5% | 5% + 道具加成 | 25% | 中暴击触发概率 |
| 暴击概率(大) | 1% | 1% + 道具加成 | 10% | 大暴击触发概率 |
| 离线收益比例 | 50% | 50% + 道具加成 | 100% | 离线时的收益比例 |
| 离线时长上限 | 24小时 | 固定 | 24小时 | 离线收益计算时长上限 |

### 6.2 自动点击器参数表

| 类型 | 名称 | 基础DPS | 基础价格 | 价格倍率 | 最高等级 |
|------|------|---------|---------|---------|---------|
| 1 | 实习生 | 0.1 | 15 | 1.07 | 100 |
| 2 | 员工 | 1 | 100 | 1.08 | 100 |
| 3 | 主管 | 5 | 500 | 1.09 | 100 |
| 4 | 经理 | 20 | 2000 | 1.10 | 100 |
| 5 | 总监 | 100 | 10000 | 1.11 | 100 |
| 6 | VP | 500 | 50000 | 1.12 | 100 |
| 7 | CEO | 2000 | 200000 | 1.13 | 100 |
| 8 | 董事会 | 10000 | 1000000 | 1.14 | 100 |
| 9 | 集团 | 50000 | 5000000 | 1.15 | 100 |
| 10 | 帝国 | 250000 | 25000000 | 1.15 | 100 |

### 6.3 道具价格表

#### 6.3.1 自动点击器价格

| 道具ID | 道具名称 | 基础价格 | 价格增长公式 | 最高价格 |
|--------|---------|---------|-------------|---------|
| item_auto_001 | 初级自动点击器 | 100 | price = 100 × 1.15^n | 1,174,313 |
| item_auto_002 | 中级自动点击器 | 500 | price = 500 × 1.15^n | 5,871,565 |
| item_auto_003 | 高级自动点击器 | 2,000 | price = 2000 × 1.15^n | 23,486,261 |
| item_auto_004 | 顶级自动点击器 | 10,000 | price = 10000 × 1.15^n | 117,431,307 |

#### 6.3.2 增益道具价格

| 道具ID | 道具名称 | 效果 | 持续时间 | 价格 |
|--------|---------|------|---------|------|
| item_buff_gold_2x_30 | 金币翻倍(小) | 金币获取×2 | 30秒 | 1,000 |
| item_buff_gold_2x_60 | 金币翻倍(中) | 金币获取×2 | 60秒 | 2,500 |
| item_buff_gold_2x_120 | 金币翻倍(大) | 金币获取×2 | 120秒 | 5,000 |
| item_buff_luck_10 | 幸运药水(小) | 暴击率+10% | 60秒 | 500 |
| item_buff_luck_20 | 幸运药水(中) | 暴击率+20% | 120秒 | 1,200 |
| item_buff_luck_50 | 幸运药水(大) | 暴击率+50% | 300秒 | 3,000 |
| item_buff_speed_2x | 时间加速(小) | 自动点击器效率×2 | 60秒 | 800 |
| item_buff_speed_5x | 时间加速(中) | 自动点击器效率×5 | 120秒 | 2,000 |
| item_buff_speed_10x | 时间加速(大) | 自动点击器效率×10 | 300秒 | 5,000 |

### 6.4 升级成本表

#### 6.4.1 点击金币升级

**升级ID**: `upgrade_click_gold`
**基础成本**: 100金币
**成本公式**: `cost = 100 × 2^(level-1)`
**最高等级**: 100级

| 等级 | 升级成本 | 累计成本 | 升级效果 |
|------|---------|---------|---------|
| 1 | 100 | 100 | +1金币/次 |
| 5 | 1,600 | 3,100 | +1金币/次 |
| 10 | 51,200 | 102,300 | +1金币/次 |
| 20 | 52,428,800 | 104,857,500 | +1金币/次 |
| 50 | 5.63e+14 | 1.13e+15 | +1金币/次 |
| 100 | 6.34e+29 | 1.27e+30 | +1金币/次 |

#### 6.4.2 暴击率升级

**升级ID**: `upgrade_crit_rate`
**基础成本**: 500金币
**成本公式**: `cost = 500 × 2^(level-1)`
**最高等级**: 50级

| 等级 | 升级成本 | 累计成本 | 升级效果 |
|------|---------|---------|---------|
| 1 | 500 | 500 | +1%暴击率 |
| 5 | 8,000 | 15,500 | +1%暴击率 |
| 10 | 256,000 | 511,500 | +1%暴击率 |
| 25 | 8.39e+09 | 1.68e+10 | +1%暴击率 |
| 50 | 2.81e+17 | 5.63e+17 | +1%暴击率 |

---

## 七、性能需求

### 7.1 响应时间要求

| 操作类型 | 响应时间要求 | 说明 |
|---------|-------------|------|
| 点击响应 | < 50ms | 从点击到视觉反馈 |
| 金币更新 | < 16ms | 金币数量变化到显示更新 |
| 商店加载 | < 1s | 商店界面完全加载 |
| 存档操作 | < 100ms | 存档写入完成 |
| 离线收益计算 | < 500ms | 离线收益计算完成 |

### 7.2 帧率要求

| 场景 | 目标帧率 | 最低帧率 |
|------|---------|---------|
| 主界面 | 60fps | 30fps |
| 商店界面 | 60fps | 30fps |
| 暴击特效 | 60fps | 30fps |
| 滚动列表 | 60fps | 30fps |

### 7.3 内存要求

| 资源类型 | 内存占用上限 | 说明 |
|---------|-------------|------|
| 游戏总内存 | < 100MB | 包含所有资源 |
| UI资源 | < 20MB | 界面相关资源 |
| 音效资源 | < 10MB | 所有音效文件 |
| 动画资源 | < 30MB | 所有动画文件 |
| 存档数据 | < 5MB | 完整存档大小 |

### 7.4 存储要求

| 存储类型 | 存储上限 | 说明 |
|---------|---------|------|
| LocalStorage | < 10MB | 本地存储上限 |
| 单个存档 | < 1MB | 单个存档文件大小 |
| 缓存数据 | < 5MB | 临时缓存数据 |

---

## 八、安全需求

### 8.1 数据安全

| 安全措施 | 实现方式 | 说明 |
|---------|---------|------|
| 数据加密 | AES-256-GCM | 加密敏感数据（金币、道具等） |
| 校验和验证 | SHA256 | 验证数据完整性 |
| 数据签名 | HMAC-SHA256 | 检测数据篡改 |
| 备份机制 | 保留最近3个存档 | 主存档损坏时自动恢复 |

### 8.2 防作弊机制

| 检测项 | 检测规则 | 处理方式 |
|-------|---------|---------|
| 时间戳验证 | lastSaveTime ≤ currentTime | 使用当前时间 |
| 数值异常 | 单次增长>10倍当前金币 | 标记可疑，记录日志 |
| 负数数值 | 任何数值<0 | 重置为0 |
| 超大数值 | 超过Number.MAX_SAFE_INTEGER | 设置上限 |
| 点击频率 | >20次/秒 | 标记可疑账号 |

---

## 九、兼容性需求

### 9.1 浏览器兼容性

| 浏览器 | 最低版本 | 支持程度 |
|-------|---------|---------|
| Chrome | 80+ | 完全支持 |
| Firefox | 75+ | 完全支持 |
| Safari | 13+ | 完全支持 |
| Edge | 80+ | 完全支持 |

### 9.2 设备兼容性

| 设备类型 | 分辨率范围 | 适配方式 |
|---------|-----------|---------|
| PC大屏 | >= 1200px | 最大宽度1200px居中 |
| PC小屏 | 992px - 1199px | 自适应布局 |
| 平板横屏 | 768px - 991px | 自适应布局 |
| 平板竖屏 | 576px - 767px | 自适应布局 |
| 手机大屏 | 414px - 575px | 移动端适配 |
| 手机小屏 | < 414px | 移动端适配 |

---

## 十、验收标准

### 10.1 功能验收

- [ ] 点击检测准确，判定区域合理
- [ ] 点击冷却机制有效，防止作弊
- [ ] 暴击机制正常工作，概率符合设计
- [ ] 金币获取和消耗逻辑正确
- [ ] DPS计算准确，实时更新
- [ ] 金币显示格式正确，动画流畅
- [ ] 离线收益计算正确
- [ ] 道具效果正确应用
- [ ] 商店购买流程完整
- [ ] 存档保存和加载正常
- [ ] 排行榜排名计算正确
- [ ] 成就解锁和奖励发放正确

### 10.2 性能验收

- [ ] 点击响应延迟 < 50ms
- [ ] DPS计算耗时 < 1ms
- [ ] 金币显示更新流畅，无卡顿
- [ ] 内存占用 < 100MB
- [ ] 无内存泄漏
- [ ] 帧率保持60fps

### 10.3 安全验收

- [ ] 数据加密正确
- [ ] 数据解密正确
- [ ] 校验和验证有效
- [ ] 数据篡改检测有效
- [ ] 异常数据检测有效

---

## 十一、附录

### 11.1 术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| DPS | Damage Per Second | 每秒伤害（游戏中指每秒金币产出） |
| 暴击 | Critical Hit | 触发暴击时获得额外金币倍率 |
| 自动点击器 | Auto Clicker | 自动产出金币的道具 |
| 离线收益 | Offline Reward | 玩家离线期间的金币收益 |
| 性价比 | Cost Performance | 效果与成本的比值 |

### 11.2 相关文档

- [完整功能路径描述](./LD-FUNC-PATH-v1.0-20260220.md)
- [UI布局与验收](./LD-UI-LAYOUT-v1.0-20260220.md)

### 11.3 版本历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|---------|--------|
| v1.0 | 2026-02-20 | 初始版本，整合所有子策划文档 | 主策划(LD) |

---

**文档状态**: 已完成
**下一步**: 交付主程序员(LP)进行技术评审
