# LP-TODOLIST-DP-1-v1.0-20260220
# 子程序员任务清单 - DP-1 (自动点击器开发)

**文档编号**: LP-TODOLIST-DP-1-v1.0-20260220
**目标程序员**: DP-1 (自动点击器开发程序员)
**创建者**: 主程序员(LP)
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、任务概述

| 项目 | 内容 |
|------|------|
| 模块名称 | 自动点击器 |
| 负责文件 | `js/systems/DPSManager.js`, `js/systems/OfflineRewardSystem.js` |
| 优先级 | P0 (最高) |
| 预计工时 | 2天 |

---

## 二、任务清单

### 2.1 DPSManager 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| DP1-001 | 实现DPS计算 | P0 | 待开发 | calculateTotalDPS正确计算总DPS |
| DP1-002 | 实现自动点击器添加 | P0 | 待开发 | addAutoClicker正确添加 |
| DP1-003 | 实现自动点击器升级 | P1 | 待开发 | upgradeAutoClicker正确升级 |
| DP1-004 | 实现全局倍率应用 | P1 | 待开发 | setGlobalMultiplier正确应用 |
| DP1-005 | 实现DPS更新事件 | P0 | 待开发 | 触发DPS_CHANGED事件 |
| DP1-006 | 实现自动产出逻辑 | P0 | 待开发 | 每秒自动增加金币 |

### 2.2 OfflineRewardSystem 核心功能

| 任务ID | 任务描述 | 优先级 | 状态 | 验收标准 |
|--------|---------|--------|------|---------|
| DP1-007 | 实现离线收益计算 | P0 | 待开发 | calculateOfflineReward正确计算 |
| DP1-008 | 实现离线时长上限 | P0 | 待开发 | 最大24小时 |
| DP1-009 | 实现离线收益领取 | P0 | 待开发 | claimOfflineReward正确入账 |
| DP1-010 | 实现离线收益弹窗 | P1 | 待开发 | 显示离线时间和收益 |

---

## 三、计算公式

### 3.1 DPS计算

```
DPS = Σ(baseDPS × count × levelBonus) × globalMultiplier
```

### 3.2 离线收益计算

```
offlineGold = DPS × min(offlineTime, 86400) × 0.5
```

---

## 四、验收标准

### 4.1 功能验收

- [ ] DPS计算正确
- [ ] 自动产出正常工作
- [ ] 离线收益计算正确
- [ ] 离线时长上限生效
- [ ] 离线收益正确入账

---

**文档状态**: 已完成
