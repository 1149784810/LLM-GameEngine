# LP-TODOLIST-CP-1-v1.0-20260220
# 子程序员任务清单 - CP-1 (点击系统开发)

**文档编号**: LP-TODOLIST-CP-1-v1.0-20260220
**目标程序员**: CP-1 (点击系统开发程序员)
**创建者**: 主程序员(LP)
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、任务概述

| 项目 | 内容 |
|------|------|
| 模块名称 | 点击系统 |
| 负责文件 | `js/core/ClickManager.js`, `js/systems/CriticalHitSystem.js` |
| 优先级 | P0 (最高) |
| 预计工时 | 2天 |

---

## 二、任务清单

### 2.1 ClickManager 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| CP1-001 | 实现点击冷却机制 | P0 | 待开发 | 两次点击间隔>=50ms才有效 |
| CP1-002 | 实现点击区域检测 | P0 | 待开发 | 点击金币区域判定准确 |
| CP1-003 | 实现金币计算逻辑 | P0 | 待开发 | 公式: (baseGold + bonus) * multiplier * critMultiplier |
| CP1-004 | 实现暴击判定集成 | P0 | 待开发 | 正确调用CriticalHitSystem |
| CP1-005 | 实现点击统计更新 | P1 | 待开发 | 更新totalClicks, totalCrits |
| CP1-006 | 实现点击威力加成 | P1 | 待开发 | addClickPowerBonus方法 |
| CP1-007 | 实现点击倍率设置 | P1 | 待开发 | setClickMultiplier方法 |
| CP1-008 | 实现存档数据集成 | P1 | 待开发 | getSaveData/loadSaveData |

### 2.2 CriticalHitSystem 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| CP1-009 | 实现暴击概率计算 | P0 | 待开发 | 基础概率+加成，不超过上限 |
| CP1-010 | 实现暴击等级判定 | P0 | 待开发 | 随机数判定暴击等级 |
| CP1-011 | 实现暴击概率加成 | P1 | 待开发 | addCriticalChanceBonus方法 |
| CP1-012 | 实现暴击重置功能 | P2 | 待开发 | resetCriticalChanceBonus方法 |

### 2.3 事件集成

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| CP1-013 | 触发CLICK_PERFORMED事件 | P0 | 待开发 | 点击成功后触发事件 |
| CP1-014 | 触发CRITICAL_HIT事件 | P0 | 待开发 | 暴击时触发事件 |
| CP1-015 | 监听GOLD_CHANGED事件 | P1 | 待开发 | 更新相关统计 |

---

## 三、接口契约

### 3.1 ClickManager 必须实现的方法

```javascript
class ClickManager {
    // 处理点击事件
    handleClick(event) { }
    
    // 检查是否可以点击
    canClick() { return boolean; }
    
    // 检测点击区域有效性
    isValidClickArea(x, y, targetElement) { return boolean; }
    
    // 计算点击金币
    calculateClickGold(critMultiplier) { return number; }
    
    // 获取基础点击金币
    getBaseClickGold() { return number; }
    
    // 增加点击威力加成
    addClickPowerBonus(bonus) { }
    
    // 设置点击倍率
    setClickMultiplier(multiplier) { }
    
    // 获取点击统计
    getClickStats() { return { totalClicks, totalCrits, critRate }; }
}
```

### 3.2 CriticalHitSystem 必须实现的方法

```javascript
class CriticalHitSystem {
    // 计算暴击结果
    calculateCriticalHit() { return { level, multiplier }; }
    
    // 获取暴击概率
    getCriticalChance(level) { return number; }
    
    // 增加暴击概率加成
    addCriticalChanceBonus(level, bonus) { }
}
```

---

## 四、数据结构

### 4.1 ClickResult 数据结构

```javascript
{
    goldGained: number,           // 获得的金币数量
    criticalLevel: 'none' | 'small' | 'medium' | 'large',  // 暴击等级
    criticalMultiplier: number,   // 暴击倍率 (1/2/5/10)
    isValid: boolean,             // 点击是否有效
    clickPosition: { x: number, y: number },  // 点击位置
    timestamp: number             // 时间戳
}
```

### 4.2 暴击配置

```javascript
{
    small: { multiplier: 2, baseChance: 10, maxChance: 50 },
    medium: { multiplier: 5, baseChance: 5, maxChance: 25 },
    large: { multiplier: 10, baseChance: 1, maxChance: 10 }
}
```

---

## 五、计算公式

### 5.1 点击金币计算

```
clickGold = (baseGoldPerClick + clickPowerBonus) × clickMultiplier × critMultiplier × globalMultiplier
```

### 5.2 暴击概率计算

```
finalCritChance = baseCritChance + critChanceBonus
if finalCritChance > maxCritChance:
    finalCritChance = maxCritChance
```

### 5.3 暴击判定流程

```
1. 生成随机数 random (0-100)
2. 判断暴击等级:
   - 如果 random < finalLargeCritChance → 大暴击 (10x)
   - 否则如果 random < finalMediumCritChance → 中暴击 (5x)
   - 否则如果 random < finalSmallCritChance → 小暴击 (2x)
   - 否则 → 普通点击 (1x)
```

---

## 六、验收标准

### 6.1 功能验收

- [ ] 点击冷却机制有效，50ms内重复点击无效
- [ ] 点击区域判定准确，容错范围10像素
- [ ] 金币计算公式正确
- [ ] 暴击概率符合配置
- [ ] 暴击倍率正确 (2x/5x/10x)
- [ ] 点击统计正确更新
- [ ] 事件正确触发

### 6.2 性能验收

- [ ] 点击响应延迟 < 50ms
- [ ] 无内存泄漏

### 6.3 代码质量

- [ ] 代码符合项目规范
- [ ] 有适当的注释
- [ ] 错误处理完善

---

## 七、依赖关系

### 7.1 依赖模块

- `EventBus` - 事件总线
- `GoldManager` - 金币管理器
- `GameConfig` - 游戏配置

### 7.2 被依赖模块

- `MainScreenUI` - 主界面UI
- `GameManager` - 游戏管理器

---

## 八、注意事项

1. 点击冷却必须严格实现，防止作弊
2. 暴击概率不能超过上限
3. 注意事件触发的时机和顺序
4. 存档数据必须包含所有必要字段

---

**文档状态**: 已完成
**下一步**: CP-1 开始开发
