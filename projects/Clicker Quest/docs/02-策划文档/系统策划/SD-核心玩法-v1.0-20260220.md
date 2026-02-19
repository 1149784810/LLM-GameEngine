# 核心玩法设计文档

**文档编号**: SD-核心玩法-v1.0-20260220
**策划角色**: 系统策划-核心玩法(SD-1)
**负责模块**: 点击系统、金币系统
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、文档概述

### 1.1 设计目标
本文档定义Clicker Quest游戏的核心玩法机制，包括点击系统、金币系统和核心数值参数。这些机制是游戏的基础，直接影响玩家的第一印象和长期留存。

### 1.2 核心原则
- **简单易懂**: 玩家能在3秒内理解基本玩法
- **深度足够**: 提供长期成长和策略空间
- **反馈及时**: 每次操作都有明确的视觉和听觉反馈
- **数值平衡**: 前中后期体验流畅，避免数值膨胀

### 1.3 适用范围
- 点击检测和响应
- 金币获取和消耗
- DPS计算和显示
- 暴击机制
- 数值平衡

---

## 二、点击机制设计

### 2.1 基础点击规则

#### 2.1.1 点击判定
**判定区域**: 屏幕中央的点击目标区域（圆形或方形）
**判定范围**: 目标区域边界向外扩展10像素的容错区域
**点击响应**: 点击后立即触发金币获取和视觉反馈

**技术实现要点**:
```csharp
// 点击判定伪代码
public class ClickDetector
{
    // 点击目标区域
    private RectTransform clickTarget;

    // 点击判定方法
    public bool IsClickValid(Vector2 clickPosition)
    {
        // 转换为本地坐标
        Vector2 localPoint;
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            clickTarget, clickPosition, camera, out localPoint);

        // 判断是否在目标区域内（含容错范围）
        float expandedRadius = clickTarget.sizeDelta.x / 2 + 10f;
        return localPoint.magnitude <= expandedRadius;
    }
}
```

#### 2.1.2 点击冷却
**冷却时间**: 50毫秒（防止快速连点作弊）
**冷却机制**: 点击后进入冷却状态，冷却期间不响应新的点击
**视觉提示**: 冷却期间点击目标区域显示半透明效果

**技术实现要点**:
```csharp
public class ClickCooldown
{
    private float cooldownTime = 0.05f; // 50毫秒
    private float lastClickTime = 0f;

    public bool CanClick()
    {
        return Time.time - lastClickTime >= cooldownTime;
    }

    public void RecordClick()
    {
        lastClickTime = Time.time;
    }
}
```

#### 2.1.3 基础点击金币
**初始点击金币**: 1金币/次
**点击金币公式**: `baseClickGold = 1 + clickLevelBonus`
**点击金币范围**: 1 ~ 1,000,000 金币/次

### 2.2 暴击机制

#### 2.2.1 暴击类型
定义三种暴击等级，提供不同的视觉和数值反馈：

| 暴击等级 | 暴击倍率 | 基础概率 | 视觉效果 | 音效 |
|---------|---------|---------|---------|------|
| 小暴击 | 2x | 10% | 金色闪光 + 小爆炸 | coin_small_crit |
| 中暴击 | 5x | 5% | 金色闪光 + 中爆炸 | coin_medium_crit |
| 大暴击 | 10x | 1% | 金色闪光 + 大爆炸 + 屏幕震动 | coin_large_crit |

#### 2.2.2 暴击概率计算
**基础暴击概率**:
- 小暴击: 10%
- 中暴击: 5%
- 大暴击: 1%

**暴击概率公式**:
```
finalCritChance = baseCritChance + critChanceBonus

其中:
- baseCritChance: 基础暴击概率（见上表）
- critChanceBonus: 暴击率加成（来自升级、道具等）
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

**技术实现要点**:
```csharp
public class CriticalHitSystem
{
    // 暴击配置
    private const float BASE_SMALL_CRIT_CHANCE = 10f;    // 10%
    private const float BASE_MEDIUM_CRIT_CHANCE = 5f;    // 5%
    private const float BASE_LARGE_CRIT_CHANCE = 1f;     // 1%

    private const int SMALL_CRIT_MULTIPLIER = 2;
    private const int MEDIUM_CRIT_MULTIPLIER = 5;
    private const int LARGE_CRIT_MULTIPLIER = 10;

    // 暴击加成（来自升级、道具等）
    private float critChanceBonus = 0f;

    public CriticalHitResult CalculateCriticalHit()
    {
        float random = Random.Range(0f, 100f);

        // 大暴击判定
        if (random < BASE_LARGE_CRIT_CHANCE + critChanceBonus)
        {
            return new CriticalHitResult(CriticalLevel.Large, LARGE_CRIT_MULTIPLIER);
        }

        // 中暴击判定
        if (random < BASE_MEDIUM_CRIT_CHANCE + critChanceBonus)
        {
            return new CriticalHitResult(CriticalLevel.Medium, MEDIUM_CRIT_MULTIPLIER);
        }

        // 小暴击判定
        if (random < BASE_SMALL_CRIT_CHANCE + critChanceBonus)
        {
            return new CriticalHitResult(CriticalLevel.Small, SMALL_CRIT_MULTIPLIER);
        }

        // 普通点击
        return new CriticalHitResult(CriticalLevel.None, 1);
    }
}

public enum CriticalLevel
{
    None,   // 无暴击
    Small,  // 小暴击
    Medium, // 中暴击
    Large   // 大暴击
}

public struct CriticalHitResult
{
    public CriticalLevel level;
    public int multiplier;

    public CriticalHitResult(CriticalLevel level, int multiplier)
    {
        this.level = level;
        this.multiplier = multiplier;
    }
}
```

#### 2.2.3 暴击金币计算
**暴击金币公式**:
```
critGold = baseClickGold × critMultiplier

其中:
- baseClickGold: 基础点击金币
- critMultiplier: 暴击倍率（2x/5x/10x）
```

### 2.3 点击反馈设计

#### 2.3.1 视觉反馈
**点击瞬间**:
- 点击目标缩放动画（scale: 1.0 → 0.95 → 1.0，时长0.1秒）
- 金币飞出动画（从点击位置飞向金币显示区域）
- 金币数字弹出（+1、+2等，向上飘动后消失）

**暴击视觉**:
- 小暴击: 金色闪光 + 小爆炸粒子效果
- 中暴击: 金色闪光 + 中爆炸粒子效果 + 屏幕轻微震动
- 大暴击: 金色闪光 + 大爆炸粒子效果 + 屏幕强烈震动 + 全屏闪光

#### 2.3.2 听觉反馈
**点击音效**:
- 普通点击: coin_click_normal（短促清脆的金属音）
- 小暴击: coin_click_small_crit（带回响的金属音）
- 中暴击: coin_click_medium_crit（带回响的金属音 + 爆炸音）
- 大暴击: coin_click_large_crit（带回响的金属音 + 大爆炸音 + 欢呼音效）

**音效设计原则**:
- 音效时长不超过0.5秒
- 音效音量随暴击等级递增
- 音效频率避免过于刺耳

#### 2.3.3 触觉反馈（移动端）
**震动强度**:
- 普通点击: 无震动
- 小暴击: 轻微震动（10毫秒）
- 中暴击: 中等震动（30毫秒）
- 大暴击: 强烈震动（50毫秒）

---

## 三、金币系统设计

### 3.1 金币获取

#### 3.1.1 获取途径

| 获取途径 | 获取方式 | 金币数量 | 备注 |
|---------|---------|---------|------|
| 手动点击 | 玩家主动点击 | 1~1,000,000/次 | 受暴击影响 |
| 自动点击器 | 自动产出 | 根据DPS计算 | 每秒自动获取 |
| 成就奖励 | 完成成就 | 固定数值 | 一次性奖励 |
| 离线收益 | 离线期间 | DPS × 离线时长 × 50% | 上限24小时 |
| 观看广告 | 观看激励视频 | DPS × 60秒 | 每日限制次数 |

#### 3.1.2 点击金币计算
**完整计算公式**:
```
clickGold = (baseClickGold + clickLevelBonus) × critMultiplier × globalMultiplier

其中:
- baseClickGold: 基础点击金币（初始为1）
- clickLevelBonus: 点击升级加成
- critMultiplier: 暴击倍率（1x/2x/5x/10x）
- globalMultiplier: 全局加成（来自道具、活动等）
```

**计算示例**:
```
假设:
- baseClickGold = 1
- clickLevelBonus = 5（升级后）
- critMultiplier = 5（中暴击）
- globalMultiplier = 1.5（活动加成）

clickGold = (1 + 5) × 5 × 1.5 = 45金币
```

#### 3.1.3 自动点击器金币
**DPS计算公式**:
```
DPS = baseAutoClickerDPS × autoClickerCount × autoClickerLevelBonus × globalMultiplier

其中:
- baseAutoClickerDPS: 自动点击器基础DPS
- autoClickerCount: 自动点击器数量
- autoClickerLevelBonus: 自动点击器升级加成
- globalMultiplier: 全局加成
```

**自动点击器类型**:

| 自动点击器 | 基础DPS | 购买成本 | 解锁条件 |
|-----------|---------|---------|---------|
| 新手助手 | 1 | 100 | 初始解锁 |
| 见习矿工 | 5 | 500 | 总金币达到1,000 |
| 熟练工人 | 25 | 2,500 | 总金币达到10,000 |
| 专业团队 | 100 | 10,000 | 总金币达到100,000 |
| 黄金矿工 | 500 | 50,000 | 总金币达到1,000,000 |

#### 3.1.4 离线收益
**离线收益计算**:
```
offlineGold = DPS × offlineTime × offlineMultiplier

其中:
- DPS: 当前每秒金币产出
- offlineTime: 离线时长（秒），上限24小时 = 86,400秒
- offlineMultiplier: 离线收益系数，默认50%
```

**离线收益上限**:
- 最大离线时长: 24小时
- 离线收益系数: 50%（可通过升级提升至100%）

**技术实现要点**:
```csharp
public class OfflineRewardCalculator
{
    private const int MAX_OFFLINE_SECONDS = 86400; // 24小时
    private const float BASE_OFFLINE_MULTIPLIER = 0.5f; // 50%

    public long CalculateOfflineReward(DateTime lastOnlineTime, long currentDPS)
    {
        // 计算离线时长
        TimeSpan offlineSpan = DateTime.Now - lastOnlineTime;
        int offlineSeconds = (int)Mathf.Min((float)offlineSpan.TotalSeconds, MAX_OFFLINE_SECONDS);

        // 计算离线收益
        float offlineMultiplier = BASE_OFFLINE_MULTIPLIER + GetOfflineBonus();
        long offlineGold = currentDPS * offlineSeconds * (long)offlineMultiplier;

        return offlineGold;
    }

    private float GetOfflineBonus()
    {
        // 从升级系统中获取离线收益加成
        return 0f; // 初始无加成
    }
}
```

### 3.2 金币消耗

#### 3.2.1 消耗途径

| 消耗途径 | 消耗方式 | 金币数量 | 备注 |
|---------|---------|---------|------|
| 购买自动点击器 | 解锁新的自动点击器 | 根据类型递增 | 永久性投资 |
| 升级点击金币 | 提升每次点击金币 | 根据等级递增 | 永久性投资 |
| 升级暴击率 | 提升暴击概率 | 根据等级递增 | 永久性投资 |
| 购买道具 | 购买临时加成道具 | 固定价格 | 限时效果 |
| 重置技能 | 重置技能点 | 根据等级递增 | 特殊功能 |

#### 3.2.2 消耗平衡原则
**前期（0-10分钟）**:
- 第一笔购买时间: 1-2分钟
- 购买后体验提升明显
- 避免过早卡关

**中期（10-60分钟）**:
- 购买频率: 每5-10分钟一次大额购买
- 提供多种购买选择
- 保持购买期待感

**后期（1小时+）**:
- 购买频率: 每15-30分钟一次大额购买
- 引入长期目标
- 避免数值膨胀过快

### 3.3 金币显示

#### 3.3.1 数值显示格式

**显示规则**:
- 金币数量 < 1,000: 显示完整数字（例如: 999）
- 金币数量 ≥ 1,000: 使用K/M/B/T后缀（例如: 1.5K, 2.3M, 4.5B, 7.8T）
- 金币数量 ≥ 1,000T: 使用科学计数法（例如: 1.5e15）

**后缀对应表**:

| 数值范围 | 后缀 | 示例 |
|---------|------|------|
| 1,000 ~ 999,999 | K (千) | 1,500 → 1.5K |
| 1,000,000 ~ 999,999,999 | M (百万) | 2,300,000 → 2.3M |
| 1,000,000,000 ~ 999,999,999,999 | B (十亿) | 4,500,000,000 → 4.5B |
| 1,000,000,000,000 ~ 999,999,999,999,999 | T (万亿) | 7,800,000,000,000 → 7.8T |
| ≥ 1,000,000,000,000,000 | 科学计数法 | 1,500,000,000,000,000 → 1.5e15 |

**技术实现要点**:
```csharp
public static class GoldFormatter
{
    private static readonly string[] SUFFIXES = { "", "K", "M", "B", "T" };

    public static string FormatGold(long gold)
    {
        if (gold < 1000)
        {
            return gold.ToString();
        }

        // 计算后缀索引
        int suffixIndex = 0;
        double tempGold = gold;

        while (tempGold >= 1000 && suffixIndex < SUFFIXES.Length - 1)
        {
            tempGold /= 1000;
            suffixIndex++;
        }

        // 如果超过T，使用科学计数法
        if (suffixIndex >= SUFFIXES.Length - 1 && tempGold >= 1000)
        {
            return gold.ToString("e2");
        }

        // 格式化为1位小数
        return $"{tempGold:F1}{SUFFIXES[suffixIndex]}";
    }
}
```

#### 3.3.2 金币变化动画
**增加动画**:
- 金币数字向上滚动（例如: 1,000 → 1,500）
- 金币图标轻微跳动
- 增加数字飘出（+500，向上飘动后消失）

**减少动画**:
- 金币数字向下滚动（例如: 1,500 → 1,000）
- 金币图标轻微缩小
- 减少数字飘出（-500，向下飘动后消失）

**动画时长**: 0.5秒
**动画曲线**: EaseOutQuad

#### 3.3.3 DPS显示
**显示位置**: 金币显示区域下方
**显示格式**: "DPS: [数值]/秒"
**更新频率**: 每秒更新一次
**数值格式**: 与金币显示格式相同

**DPS计算更新**:
```csharp
public class DPSDisplay : MonoBehaviour
{
    private long currentDPS;
    private Text dpsText;

    private void Start()
    {
        InvokeRepeating("UpdateDPS", 1f, 1f);
    }

    private void UpdateDPS()
    {
        currentDPS = CalculateTotalDPS();
        dpsText.text = $"DPS: {GoldFormatter.FormatGold(currentDPS)}/秒";
    }

    private long CalculateTotalDPS()
    {
        // 计算总DPS
        long totalDPS = 0;

        // 遍历所有自动点击器
        foreach (var autoClicker in autoClickers)
        {
            totalDPS += autoClicker.GetDPS();
        }

        return totalDPS;
    }
}
```

---

## 四、数值参数定义

### 4.1 核心数值表

#### 4.1.1 点击相关数值

| 参数名称 | 初始值 | 最大值 | 增长方式 | 备注 |
|---------|--------|--------|---------|------|
| 基础点击金币 | 1 | 1,000,000 | 升级提升 | 每次点击获得 |
| 点击冷却时间 | 50ms | 50ms | 固定 | 防止作弊 |
| 点击判定容错范围 | 10px | 10px | 固定 | 提升点击体验 |

#### 4.1.2 暴击相关数值

| 参数名称 | 初始值 | 最大值 | 增长方式 | 备注 |
|---------|--------|--------|---------|------|
| 小暴击概率 | 10% | 50% | 升级提升 | 2倍金币 |
| 中暴击概率 | 5% | 25% | 升级提升 | 5倍金币 |
| 大暴击概率 | 1% | 10% | 升级提升 | 10倍金币 |
| 小暴击倍率 | 2x | 2x | 固定 | - |
| 中暴击倍率 | 5x | 5x | 固定 | - |
| 大暴击倍率 | 10x | 10x | 固定 | - |

#### 4.1.3 自动点击器数值

| 自动点击器 | 基础DPS | 初始成本 | 成本增长率 | 数量上限 |
|-----------|---------|---------|-----------|---------|
| 新手助手 | 1 | 100 | +15% | 无限制 |
| 见习矿工 | 5 | 500 | +15% | 无限制 |
| 熟练工人 | 25 | 2,500 | +15% | 无限制 |
| 专业团队 | 100 | 10,000 | +15% | 无限制 |
| 黄金矿工 | 500 | 50,000 | +15% | 无限制 |

#### 4.1.4 升级相关数值

| 升级类型 | 初始成本 | 成本增长率 | 效果提升 | 等级上限 |
|---------|---------|-----------|---------|---------|
| 点击金币 | 100 | +50% | +1金币/级 | 100级 |
| 暴击率 | 500 | +100% | +1%/级 | 50级 |
| 离线收益 | 1,000 | +200% | +5%/级 | 10级 |

### 4.2 数值平衡策略

#### 4.2.1 前期数值（0-10分钟）
**目标**: 让玩家快速上手，体验成长乐趣

| 时间节点 | 目标金币 | 目标DPS | 关键事件 |
|---------|---------|---------|---------|
| 0-1分钟 | 0-100 | 0 | 学习点击 |
| 1-2分钟 | 100-500 | 0 | 第一次购买 |
| 2-5分钟 | 500-2,000 | 1-5 | 购买第一个自动点击器 |
| 5-10分钟 | 2,000-10,000 | 5-20 | 解锁更多内容 |

#### 4.2.2 中期数值（10-60分钟）
**目标**: 保持稳定增长，提供多样化选择

| 时间节点 | 目标金币 | 目标DPS | 关键事件 |
|---------|---------|---------|---------|
| 10-20分钟 | 10K-50K | 20-100 | 解锁多种自动点击器 |
| 20-40分钟 | 50K-500K | 100-500 | 升级点击金币 |
| 40-60分钟 | 500K-2M | 500-2,000 | 达到第一个里程碑 |

#### 4.2.3 后期数值（1小时+）
**目标**: 提供长期目标，避免数值膨胀

| 时间节点 | 目标金币 | 目标DPS | 关键事件 |
|---------|---------|---------|---------|
| 1-2小时 | 2M-10M | 2K-10K | 解锁高级自动点击器 |
| 2-5小时 | 10M-100M | 10K-100K | 大规模升级 |
| 5小时+ | 100M+ | 100K+ | 长期目标 |

#### 4.2.4 数值膨胀控制
**策略1: 成本指数增长**
- 自动点击器成本每次购买增加15%
- 升级成本每次提升增加50%-200%
- 避免线性增长导致的快速膨胀

**策略2: 效果递减**
- 高级自动点击器的性价比逐渐降低
- 升级效果在后期递减
- 引入边际效应

**策略3: 引入上限**
- 单个升级项目设置等级上限
- 总DPS设置软上限
- 引入重置机制（转生系统）

---

## 五、接口定义

### 5.1 点击系统接口

#### 5.1.1 点击管理器接口
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
    /// <summary>
    /// 获得的金币数量
    /// </summary>
    public long goldGained;

    /// <summary>
    /// 暴击等级
    /// </summary>
    public CriticalLevel criticalLevel;

    /// <summary>
    /// 暴击倍率
    /// </summary>
    public int criticalMultiplier;

    /// <summary>
    /// 点击是否有效
    /// </summary>
    public bool isValid;

    public ClickResult(long goldGained, CriticalLevel criticalLevel, int criticalMultiplier, bool isValid)
    {
        this.goldGained = goldGained;
        this.criticalLevel = criticalLevel;
        this.criticalMultiplier = criticalMultiplier;
        this.isValid = isValid;
    }
}
```

#### 5.1.2 暴击系统接口
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
    /// <summary>
    /// 暴击等级
    /// </summary>
    public CriticalLevel level;

    /// <summary>
    /// 暴击倍率
    /// </summary>
    public int multiplier;

    public CriticalHitResult(CriticalLevel level, int multiplier)
    {
        this.level = level;
        this.multiplier = multiplier;
    }
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

### 5.2 金币系统接口

#### 5.2.1 金币管理器接口
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

#### 5.2.2 DPS计算器接口
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
    /// <summary>
    /// 自动点击器ID
    /// </summary>
    public string id;

    /// <summary>
    /// 自动点击器类型
    /// </summary>
    public AutoClickerType type;

    /// <summary>
    /// 基础DPS
    /// </summary>
    public long baseDPS;

    /// <summary>
    /// 数量
    /// </summary>
    public int count;

    /// <summary>
    /// 等级加成
    /// </summary>
    public float levelBonus;

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
    Beginner,    // 新手助手
    Apprentice,  // 见习矿工
    Skilled,     // 熟练工人
    Professional,// 专业团队
    Golden       // 黄金矿工
}
```

### 5.3 升级系统接口

#### 5.3.1 升级管理器接口
```csharp
/// <summary>
/// 升级管理器接口
/// 负责管理各种升级项目
/// </summary>
public interface IUpgradeManager
{
    /// <summary>
    /// 获取升级项目
    /// </summary>
    /// <param name="upgradeId">升级项目ID</param>
    /// <returns>升级项目数据</returns>
    UpgradeData GetUpgrade(string upgradeId);

    /// <summary>
    /// 执行升级
    /// </summary>
    /// <param name="upgradeId">升级项目ID</param>
    /// <returns>是否升级成功</returns>
    bool PerformUpgrade(string upgradeId);

    /// <summary>
    /// 获取升级成本
    /// </summary>
    /// <param name="upgradeId">升级项目ID</param>
    /// <returns>升级成本</returns>
    long GetUpgradeCost(string upgradeId);

    /// <summary>
    /// 检查是否可以升级
    /// </summary>
    /// <param name="upgradeId">升级项目ID</param>
    /// <returns>是否可以升级</returns>
    bool CanUpgrade(string upgradeId);

    /// <summary>
    /// 升级事件
    /// </summary>
    event Action<string, int> OnUpgradePerformed; // (upgradeId, newLevel)
}

/// <summary>
/// 升级项目数据结构
/// </summary>
public class UpgradeData
{
    /// <summary>
    /// 升级项目ID
    /// </summary>
    public string id;

    /// <summary>
    /// 升级项目名称
    /// </summary>
    public string name;

    /// <summary>
    /// 升级项目描述
    /// </summary>
    public string description;

    /// <summary>
    /// 升级类型
    /// </summary>
    public UpgradeType type;

    /// <summary>
    /// 当前等级
    /// </summary>
    public int currentLevel;

    /// <summary>
    /// 最大等级
    /// </summary>
    public int maxLevel;

    /// <summary>
    /// 基础成本
    /// </summary>
    public long baseCost;

    /// <summary>
    /// 成本增长率
    /// </summary>
    public float costGrowthRate;

    /// <summary>
    /// 效果提升值
    /// </summary>
    public float effectBonus;

    /// <summary>
    /// 计算当前等级的成本
    /// </summary>
    public long CalculateCost()
    {
        return (long)(baseCost * Mathf.Pow(costGrowthRate, currentLevel));
    }

    /// <summary>
    /// 计算当前等级的效果
    /// </summary>
    public float CalculateEffect()
    {
        return effectBonus * currentLevel;
    }
}

/// <summary>
/// 升级类型枚举
/// </summary>
public enum UpgradeType
{
    ClickGold,      // 点击金币
    CriticalChance, // 暴击率
    OfflineReward,  // 离线收益
    AutoClicker     // 自动点击器
}
```

### 5.4 数据持久化接口

#### 5.4.1 存档管理器接口
```csharp
/// <summary>
/// 存档管理器接口
/// 负责游戏数据的保存和加载
/// </summary>
public interface ISaveManager
{
    /// <summary>
    /// 保存游戏数据
    /// </summary>
    void SaveGame();

    /// <summary>
    /// 加载游戏数据
    /// </summary>
    /// <returns>是否加载成功</returns>
    bool LoadGame();

    /// <summary>
    /// 重置游戏数据
    /// </summary>
    void ResetGame();

    /// <summary>
    /// 获取上次保存时间
    /// </summary>
    DateTime LastSaveTime { get; }

    /// <summary>
    /// 自动保存间隔（秒）
    /// </summary>
    float AutoSaveInterval { get; set; }
}

/// <summary>
/// 游戏存档数据结构
/// </summary>
[Serializable]
public class GameSaveData
{
    /// <summary>
    /// 当前金币
    /// </summary>
    public long currentGold;

    /// <summary>
    /// 总获得金币
    /// </summary>
    public long totalGoldEarned;

    /// <summary>
    /// 点击升级等级
    /// </summary>
    public int clickUpgradeLevel;

    /// <summary>
    /// 暴击升级等级
    /// </summary>
    public int criticalUpgradeLevel;

    /// <summary>
    /// 离线收益升级等级
    /// </summary>
    public int offlineUpgradeLevel;

    /// <summary>
    /// 自动点击器列表
    /// </summary>
    public List<AutoClickerSaveData> autoClickers;

    /// <summary>
    /// 上次保存时间
    /// </summary>
    public string lastSaveTime;
}

/// <summary>
/// 自动点击器存档数据
/// </summary>
[Serializable]
public class AutoClickerSaveData
{
    public string id;
    public AutoClickerType type;
    public int count;
    public int level;
}
```

---

## 六、验收标准

### 6.1 功能验收
- [ ] 点击检测准确，判定区域合理
- [ ] 点击冷却机制有效，防止作弊
- [ ] 暴击机制正常工作，概率符合设计
- [ ] 金币获取和消耗逻辑正确
- [ ] DPS计算准确，实时更新
- [ ] 金币显示格式正确，动画流畅
- [ ] 离线收益计算正确

### 6.2 数值验收
- [ ] 前期数值体验流畅，无卡关
- [ ] 中期数值增长合理，有期待感
- [ ] 后期数值不膨胀，有长期目标
- [ ] 暴击概率符合设计，不过于频繁或稀少
- [ ] 升级成本和效果平衡

### 6.3 性能验收
- [ ] 点击响应延迟 < 50ms
- [ ] DPS计算耗时 < 1ms
- [ ] 金币显示更新流畅，无卡顿
- [ ] 内存占用合理，无内存泄漏

### 6.4 体验验收
- [ ] 点击手感舒适，反馈及时
- [ ] 视觉反馈清晰，易于理解
- [ ] 音效悦耳，不刺耳
- [ ] 数值显示直观，易于理解

---

## 七、附录

### 7.1 相关文档
- [数值平衡方案文档](./数值平衡方案.md)
- [点击升级系统设计文档](./点击升级系统设计.md)
- [自动点击器设计文档](./自动点击器设计.md)

### 7.2 修订历史

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|---------|
| v1.0 | 2026-02-20 | SD-1 | 初始版本，完成核心玩法设计 |

---

**文档状态**: 已完成
**下一步**: 与数值策划(BD-1)协作，进行数值平衡调整
