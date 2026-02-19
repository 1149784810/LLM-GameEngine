# LP-TODOLIST-CP-2-v1.0-20260220
# 子程序员任务清单 - CP-2 (金币系统开发)

**文档编号**: LP-TODOLIST-CP-2-v1.0-20260220
**目标程序员**: CP-2 (金币系统开发程序员)
**创建者**: 主程序员(LP)
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、任务概述

| 项目 | 内容 |
|------|------|
| 模块名称 | 金币系统 |
| 负责文件 | `js/core/GoldManager.js`, `js/utils/NumberFormatter.js` |
| 优先级 | P0 (最高) |
| 预计工时 | 1.5天 |

---

## 二、任务清单

### 2.1 GoldManager 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| CP2-001 | 实现金币增加逻辑 | P0 | 待开发 | addGold正确更新currentGold和totalGoldEarned |
| CP2-002 | 实现金币消耗逻辑 | P0 | 待开发 | spendGold正确扣除并更新totalGoldSpent |
| CP2-003 | 实现金币检查逻辑 | P0 | 待开发 | hasEnoughGold返回正确布尔值 |
| CP2-004 | 实现全局倍率设置 | P1 | 待开发 | setGlobalMultiplier正确应用 |
| CP2-005 | 实现金币格式化集成 | P0 | 待开发 | formatGold调用NumberFormatter |
| CP2-006 | 实现事件触发 | P0 | 待开发 | GOLD_CHANGED, GOLD_EARNED, GOLD_SPENT事件 |
| CP2-007 | 实现存档数据集成 | P1 | 待开发 | getSaveData/loadSaveData |
| CP2-008 | 实现初始化逻辑 | P1 | 待开发 | 从gameData加载金币数据 |

### 2.2 NumberFormatter 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| CP2-009 | 实现数字格式化 | P0 | 待开发 | 正确使用K/M/B/T格式 |
| CP2-010 | 实现金币格式化 | P0 | 待开发 | formatGold正确显示 |
| CP2-011 | 实现DPS格式化 | P1 | 待开发 | formatDPS添加+前缀 |
| CP2-012 | 实现科学计数法 | P2 | 待开发 | 超大数值使用科学计数法 |

---

## 三、接口契约

### 3.1 GoldManager 必须实现的方法

```javascript
class GoldManager {
    // 获取当前金币
    getCurrentGold() { return number; }
    
    // 获取累计获得金币
    getTotalGoldEarned() { return number; }
    
    // 增加金币
    addGold(amount, source) { return number; }
    
    // 消耗金币
    spendGold(amount, purpose) { return boolean; }
    
    // 检查金币是否足够
    hasEnoughGold(amount) { return boolean; }
    
    // 设置全局倍率
    setGlobalMultiplier(multiplier) { }
    
    // 格式化金币
    formatGold(amount) { return string; }
}
```

### 3.2 NumberFormatter 必须实现的方法

```javascript
class NumberFormatter {
    // 格式化数字
    format(num, decimals) { return string; }
    
    // 格式化金币
    formatGold(gold) { return string; }
    
    // 格式化DPS
    formatDPS(dps) { return string; }
    
    // 格式化百分比
    formatPercent(value, decimals) { return string; }
}
```

---

## 四、数据结构

### 4.1 金币数据

```javascript
{
    currentGold: number,      // 当前金币
    totalGoldEarned: number,  // 累计获得金币
    totalGoldSpent: number,   // 累计消耗金币
    globalMultiplier: number  // 全局倍率
}
```

### 4.2 金币来源枚举

```javascript
const GoldSource = {
    MANUAL_CLICK: 'manual_click',
    AUTO_CLICKER: 'auto_clicker',
    ACHIEVEMENT: 'achievement',
    OFFLINE_REWARD: 'offline_reward',
    AD_REWARD: 'ad_reward',
    OTHER: 'other'
};
```

### 4.3 金币用途枚举

```javascript
const GoldPurpose = {
    BUY_AUTO_CLICKER: 'buy_auto_clicker',
    UPGRADE_CLICK: 'upgrade_click',
    UPGRADE_CRITICAL: 'upgrade_critical',
    BUY_ITEM: 'buy_item',
    RESET_SKILL: 'reset_skill',
    OTHER: 'other'
};
```

---

## 五、计算公式

### 5.1 金币增加

```
actualAmount = amount × globalMultiplier
currentGold += actualAmount
totalGoldEarned += actualAmount
```

### 5.2 金币消耗

```
if currentGold >= amount:
    currentGold -= amount
    totalGoldSpent += amount
    return true
else:
    return false
```

### 5.3 金币格式化

| 数值范围 | 显示格式 | 示例 |
|---------|---------|------|
| < 1,000 | 原始数值 | 999 |
| 1,000 ~ 999,999 | K格式 | 1.5K, 999K |
| 1,000,000 ~ 999,999,999 | M格式 | 1.5M, 999M |
| 1,000,000,000 ~ 999,999,999,999 | B格式 | 1.5B, 999B |
| 1,000,000,000,000+ | T格式 | 1.5T |
| 超大数值 | 科学计数法 | 1.5e15 |

---

## 六、验收标准

### 6.1 功能验收

- [ ] 金币增加正确更新所有字段
- [ ] 金币消耗正确检查和扣除
- [ ] 全局倍率正确应用
- [ ] 金币格式化正确显示各数量级
- [ ] 事件正确触发
- [ ] 存档数据正确保存和恢复

### 6.2 边界条件

- [ ] 金币为0时消耗返回false
- [ ] 金币为负数时正确处理
- [ ] 超大数值正确格式化

### 6.3 代码质量

- [ ] 代码符合项目规范
- [ ] 有适当的注释
- [ ] 错误处理完善

---

## 七、依赖关系

### 7.1 依赖模块

- `EventBus` - 事件总线
- `GameConfig` - 游戏配置

### 7.2 被依赖模块

- `ClickManager` - 点击管理器
- `ShopManager` - 商店管理器
- `ItemManager` - 道具管理器
- `MainScreenUI` - 主界面UI

---

**文档状态**: 已完成
**下一步**: CP-2 开始开发
