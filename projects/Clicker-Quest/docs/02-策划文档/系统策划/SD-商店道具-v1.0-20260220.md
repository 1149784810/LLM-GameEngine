# Clicker Quest - 商店与道具系统设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | 系统策划 - 商店道具系统 |
| 文档版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 负责人 | SD-2 (系统策划-商店道具) |
| 主策划 | LD |

---

## 目录

1. [系统概述](#系统概述)
2. [商店系统设计](#商店系统设计)
3. [道具系统设计](#道具系统设计)
4. [BUFF系统设计](#buff系统设计)
5. [数据结构规范](#数据结构规范)
6. [验收标准](#验收标准)

---

## 系统概述

### 系统定位

商店与道具系统是Clicker Quest的核心成长系统之一，为玩家提供：
- **永久升级**: 通过商店购买永久提升属性的升级
- **临时增益**: 通过道具获得短期强力BUFF
- **策略选择**: 不同升级路线和道具组合创造多样玩法

### 系统关系图

```
核心玩法系统 (SD-1)
    ↓
商店系统 (SD-2)
    ├── 商品购买 → 永久属性提升
    └── 道具购买 → 道具库存
            ↓
        道具系统 (SD-2)
            └── 道具使用 → BUFF效果
                    ↓
                BUFF状态栏 (SD-2)
```

### 系统边界

| 系统 | 包含内容 | 不包含内容 |
|------|---------|-----------|
| 商店系统 | 商品定义、购买流程、价格计算 | UI布局、数值平衡 |
| 道具系统 | 道具定义、获取、使用、BUFF管理 | 成就触发逻辑 |

---

## 商店系统设计

### 1. 商品详细配置表

#### 1.1 商品分类

商店商品分为三大类：

| 分类 | 说明 | 商品数量 |
|------|------|---------|
| 点击强化类 | 提升点击产出 | 3种 |
| 自动产出类 | 提升GPS | 2种 |
| 特殊加成类 | 提供特殊加成 | 3种 |

#### 1.2 商品详细配置

##### 商品 1: 点击强化 (click_power)

| 属性 | 内容 |
|------|------|
| **商品ID** | `click_power` |
| **显示名称** | 点击强化 |
| **商品描述** | 每次点击额外获得 +1 金币 |
| **商品类型** | 永久升级 |
| **基础价格** | 10 金币 |
| **价格增长率** | 1.15x |
| **效果类型** | `click_add` (点击加成) |
| **效果数值** | +1 金币/点击/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 游戏开始即可购买 |

**价格计算示例**:
```
Lv.1:  10 × 1.15^0 = 10 金币
Lv.5:  10 × 1.15^4 = 17.5 ≈ 18 金币
Lv.10: 10 × 1.15^9 = 35.2 ≈ 36 金币
Lv.50: 10 × 1.15^49 = 1,083 金币
```

**效果说明**:
- 每次升级增加 1 金币/点击的基础产出
- 与暴击、连击、双击等效果叠加
- 是最基础的升级，适合新手玩家

---

##### 商品 2: 自动点击器 (auto_clicker)

| 属性 | 内容 |
|------|------|
| **商品ID** | `auto_clicker` |
| **显示名称** | 自动点击器 |
| **商品描述** | 每秒自动获得 +1 金币 (GPS +1) |
| **商品类型** | 永久升级 |
| **基础价格** | 100 金币 |
| **价格增长率** | 1.15x |
| **效果类型** | `gps_add` (GPS加成) |
| **效果数值** | +1 GPS/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 游戏开始即可购买 |

**价格计算示例**:
```
Lv.1:  100 × 1.15^0 = 100 金币
Lv.5:  100 × 1.15^4 = 175 ≈ 175 金币
Lv.10: 100 × 1.15^9 = 352 ≈ 352 金币
Lv.50: 100 × 1.15^49 = 10,836 金币
```

**效果说明**:
- 每次升级增加 1 GPS
- GPS = 每秒自动获得的金币数量
- 离线收益基于GPS计算
- 是挂机收益的核心来源

---

##### 商品 3: 双击 (double_click)

| 属性 | 内容 |
|------|------|
| **商品ID** | `double_click` |
| **显示名称** | 双击 |
| **商品描述** | 点击产出翻倍 (×2) |
| **商品类型** | 永久升级 |
| **基础价格** | 500 金币 |
| **价格增长率** | 1.5x |
| **效果类型** | `click_multiplier` (点击倍率) |
| **效果数值** | ×2 倍率 |
| **购买上限** | 1级 (一次性升级) |
| **解锁条件** | 累计获得 500 金币后解锁 |

**价格计算示例**:
```
Lv.1: 500 × 1.5^0 = 500 金币 (唯一等级)
```

**效果说明**:
- 购买后所有点击产出翻倍
- 与点击强化、暴击等效果叠加
- 计算公式: (基础点击 + 点击强化) × 2
- 是中期重要的提升手段

---

##### 商品 4: 幸运手指 (lucky_finger)

| 属性 | 内容 |
|------|------|
| **商品ID** | `lucky_finger` |
| **显示名称** | 幸运手指 |
| **商品描述** | 暴击率 +5% |
| **商品类型** | 永久升级 |
| **基础价格** | 1,000 金币 |
| **价格增长率** | 1.3x |
| **效果类型** | `crit_rate_add` (暴击率加成) |
| **效果数值** | +5% 暴击率/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 累计获得 1,000 金币后解锁 |

**价格计算示例**:
```
Lv.1:  1,000 × 1.3^0 = 1,000 金币
Lv.5:  1,000 × 1.3^4 = 2,856 ≈ 2,856 金币
Lv.10: 1,000 × 1.3^9 = 10,604 ≈ 10,605 金币
Lv.20: 1,000 × 1.3^19 = 146,192 金币
```

**效果说明**:
- 每次升级增加 5% 暴击率
- 暴击率上限: 100%
- 影响所有暴击类型 (小暴击、中暴击、大暴击)
- 提升整体产出期望

**暴击率计算**:
```
总暴击率 = 基础暴击率 + 幸运手指加成
基础暴击率 = 10% (小暴击) + 5% (中暴击) + 1% (大暴击) = 16%
Lv.1: 16% + 5% = 21%
Lv.5: 16% + 25% = 41%
Lv.10: 16% + 50% = 66%
```

---

##### 商品 5: 黄金之手 (golden_touch)

| 属性 | 内容 |
|------|------|
| **商品ID** | `golden_touch` |
| **显示名称** | 黄金之手 |
| **商品描述** | 所有金币产出 +10% (包括点击和GPS) |
| **商品类型** | 永久升级 |
| **基础价格** | 5,000 金币 |
| **价格增长率** | 1.4x |
| **效果类型** | `gold_multiplier` (金币倍率) |
| **效果数值** | +10% 金币倍率/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 累计获得 5,000 金币后解锁 |

**价格计算示例**:
```
Lv.1:  5,000 × 1.4^0 = 5,000 金币
Lv.5:  5,000 × 1.4^4 = 19,208 ≈ 19,208 金币
Lv.10: 5,000 × 1.4^9 = 202,741 金币
Lv.20: 5,000 × 1.4^19 = 8.3M 金币
```

**效果说明**:
- 每次升级增加 10% 全金币加成
- 影响点击产出、GPS、离线收益
- 计算公式: 最终产出 = 基础产出 × (1 + 黄金之手加成)
- 是后期最重要的升级之一

**金币产出计算**:
```
点击产出 = (基础点击 + 点击强化) × 双击倍率 × (1 + 黄金之手)
GPS = (自动点击器 × 1 + 超级点击器 × 10) × (1 + 黄金之手)
```

---

##### 商品 6: 时间扭曲 (time_warp)

| 属性 | 内容 |
|------|------|
| **商品ID** | `time_warp` |
| **显示名称** | 时间扭曲 |
| **商品描述** | 离线收益效率 +10% |
| **商品类型** | 永久升级 |
| **基础价格** | 10,000 金币 |
| **价格增长率** | 1.5x |
| **效果类型** | `offline_bonus` (离线加成) |
| **效果数值** | +10% 离线效率/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 累计获得 10,000 金币后解锁 |

**价格计算示例**:
```
Lv.1:  10,000 × 1.5^0 = 10,000 金币
Lv.5:  10,000 × 1.5^4 = 50,625 金币
Lv.10: 10,000 × 1.5^9 = 384,433 金币
Lv.20: 10,000 × 1.5^19 = 221.5M 金币
```

**效果说明**:
- 每次升级增加 10% 离线收益效率
- 基础离线效率: 50%
- 计算公式: 离线收益 = GPS × (50% + 时间扭曲加成) × 离线时间
- 最长计算 24 小时

**离线收益计算**:
```
Lv.1: GPS × 60% × 离线时间
Lv.5: GPS × 100% × 离线时间
Lv.10: GPS × 150% × 离线时间
```

---

##### 商品 7: 超级点击器 (mega_clicker)

| 属性 | 内容 |
|------|------|
| **商品ID** | `mega_clicker` |
| **显示名称** | 超级点击器 |
| **商品描述** | 每秒自动获得 +10 金币 (GPS +10) |
| **商品类型** | 永久升级 |
| **基础价格** | 50,000 金币 |
| **价格增长率** | 1.2x |
| **效果类型** | `gps_add` (GPS加成) |
| **效果数值** | +10 GPS/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 累计获得 50,000 金币后解锁 |

**价格计算示例**:
```
Lv.1:  50,000 × 1.2^0 = 50,000 金币
Lv.5:  50,000 × 1.2^4 = 103,680 金币
Lv.10: 50,000 × 1.2^9 = 258,047 金币
Lv.50: 50,000 × 1.2^49 = 454.8M 金币
```

**效果说明**:
- 每次升级增加 10 GPS
- 是自动点击器的高级版本
- 性价比: 10倍效果，但价格更高
- 适合后期快速提升GPS

---

##### 商品 8: 暴击大师 (critical_master)

| 属性 | 内容 |
|------|------|
| **商品ID** | `critical_master` |
| **显示名称** | 暴击大师 |
| **商品描述** | 暴击伤害 +50% |
| **商品类型** | 永久升级 |
| **基础价格** | 100,000 金币 |
| **价格增长率** | 1.3x |
| **效果类型** | `crit_damage_add` (暴击伤害加成) |
| **效果数值** | +50% 暴击伤害/级 |
| **购买上限** | 无限制 |
| **解锁条件** | 累计获得 100,000 金币后解锁 |

**价格计算示例**:
```
Lv.1:  100,000 × 1.3^0 = 100,000 金币
Lv.5:  100,000 × 1.3^4 = 285,610 金币
Lv.10: 100,000 × 1.3^9 = 1.06M 金币
Lv.20: 100,000 × 1.3^19 = 14.6M 金币
```

**效果说明**:
- 每次升级增加 50% 暴击伤害
- 影响所有暴击类型的伤害倍率
- 计算公式: 最终暴击伤害 = 基础暴击伤害 × (1 + 暴击大师加成)

**暴击伤害计算**:
```
基础暴击伤害:
- 小暴击: 2x
- 中暴击: 5x
- 大暴击: 10x

Lv.1 暴击大师:
- 小暴击: 2 × 1.5 = 3x
- 中暴击: 5 × 1.5 = 7.5x
- 大暴击: 10 × 1.5 = 15x

Lv.5 暴击大师:
- 小暴击: 2 × 3.5 = 7x
- 中暴击: 5 × 3.5 = 17.5x
- 大暴击: 10 × 3.5 = 35x
```

---

#### 1.3 商品配置汇总表

| 商品ID | 显示名称 | 基础价格 | 增长率 | 效果类型 | 效果数值 | Lv.10价格 | Lv.50价格 |
|--------|---------|---------|--------|---------|---------|-----------|-----------|
| click_power | 点击强化 | 10 | 1.15x | click_add | +1/点击 | 36 | 1,083 |
| auto_clicker | 自动点击器 | 100 | 1.15x | gps_add | +1 GPS | 352 | 10,836 |
| double_click | 双击 | 500 | 1.5x | click_multiplier | ×2 | 500 (唯一) | - |
| lucky_finger | 幸运手指 | 1,000 | 1.3x | crit_rate_add | +5% 暴击率 | 10,605 | 4.56M |
| golden_touch | 黄金之手 | 5,000 | 1.4x | gold_multiplier | +10% 金币 | 202,741 | 1.18B |
| time_warp | 时间扭曲 | 10,000 | 1.5x | offline_bonus | +10% 离线效率 | 384,433 | 2.13B |
| mega_clicker | 超级点击器 | 50,000 | 1.2x | gps_add | +10 GPS | 258,047 | 454.8M |
| critical_master | 暴击大师 | 100,000 | 1.3x | crit_damage_add | +50% 暴击伤害 | 1.06M | 456.3M |

---

### 2. 购买流程设计

#### 2.1 购买流程图

```
┌─────────────────┐
│  玩家点击商品   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  检查解锁条件   │
└────────┬────────┘
         │
    ┌────┴────┐
    │已解锁？ │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   否         是
    │         │
    ▼         ▼
┌───────┐ ┌─────────────────┐
│显示   │ │  检查金币数量   │
│锁定   │ └────────┬────────┘
│提示   │          │
└───────┘     ┌────┴────┐
               │金币足够？│
               └────┬────┘
                    │
               ┌────┴────┐
               │         │
              否         是
               │         │
               ▼         ▼
         ┌─────────┐ ┌─────────────────┐
         │显示金币 │ │  扣除金币       │
         │不足提示 │ │  currentGold    │
         └─────────┘ │  -= price       │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  应用商品效果   │
                     │  更新玩家属性   │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  更新商品等级   │
                     │  level += 1     │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  计算新价格     │
                     │  price = base   │
                     │  × rate^level   │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  显示购买成功   │
                     │  动画和音效     │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  更新UI显示     │
                     │  - 金币数量     │
                     │  - 商品价格     │
                     │  - 商品等级     │
                     │  - 属性面板     │
                     └─────────────────┘
```

#### 2.2 购买流程详细步骤

**步骤 1: 点击商品卡片**
- 玩家点击商店中的商品卡片
- 触发购买流程
- 记录点击的商品ID

**步骤 2: 检查解锁条件**
```javascript
function checkUnlockCondition(itemId) {
    const item = shopItems[itemId];
    if (!item.unlockCondition) {
        return true; // 无解锁条件
    }

    // 检查累计金币是否达到要求
    if (item.unlockCondition.totalGold) {
        return player.totalGoldEarned >= item.unlockCondition.totalGold;
    }

    return true;
}
```

**步骤 3: 检查金币数量**
```javascript
function checkGold(itemId) {
    const item = shopItems[itemId];
    return player.currentGold >= item.currentPrice;
}
```

**步骤 4: 扣除金币**
```javascript
function deductGold(itemId) {
    const item = shopItems[itemId];
    player.currentGold -= item.currentPrice;
    player.totalGoldSpent += item.currentPrice;
}
```

**步骤 5: 应用商品效果**
```javascript
function applyItemEffect(itemId) {
    const item = shopItems[itemId];
    const effect = item.effect;

    switch (effect.type) {
        case 'click_add':
            player.clickPower += effect.value;
            break;
        case 'gps_add':
            player.gps += effect.value;
            break;
        case 'click_multiplier':
            player.clickMultiplier *= effect.value;
            break;
        case 'crit_rate_add':
            player.critRate += effect.value;
            break;
        case 'gold_multiplier':
            player.goldMultiplier += effect.value;
            break;
        case 'offline_bonus':
            player.offlineBonus += effect.value;
            break;
        case 'crit_damage_add':
            player.critDamageBonus += effect.value;
            break;
    }
}
```

**步骤 6: 更新商品等级**
```javascript
function updateItemLevel(itemId) {
    const item = shopItems[itemId];
    item.level += 1;
}
```

**步骤 7: 计算新价格**
```javascript
function calculateNewPrice(itemId) {
    const item = shopItems[itemId];
    item.currentPrice = Math.ceil(
        item.basePrice * Math.pow(item.growthRate, item.level)
    );
}
```

**步骤 8: 显示购买成功动画**
```javascript
function showPurchaseSuccess(itemId) {
    // 播放购买音效
    playSound('purchase_success');

    // 显示购买成功动画
    showAnimation('gold_sparkle');

    // 显示购买成功提示
    showToast(`购买成功! ${shopItems[itemId].name} Lv.${shopItems[itemId].level}`);
}
```

**步骤 9: 更新UI显示**
```javascript
function updateUI() {
    // 更新金币显示
    updateGoldDisplay();

    // 更新商品卡片
    updateShopItemCards();

    // 更新属性面板
    updateStatsPanel();

    // 更新GPS显示
    updateGPSDisplay();
}
```

#### 2.3 购买失败处理

**情况 1: 商品未解锁**
```javascript
if (!checkUnlockCondition(itemId)) {
    showToast(`需要累计获得 ${item.unlockCondition.totalGold} 金币才能解锁`);
    return false;
}
```

**情况 2: 金币不足**
```javascript
if (!checkGold(itemId)) {
    const shortage = item.currentPrice - player.currentGold;
    showToast(`金币不足! 还需要 ${formatGold(shortage)} 金币`);
    return false;
}
```

**情况 3: 商品已达上限**
```javascript
if (item.maxLevel && item.level >= item.maxLevel) {
    showToast(`${item.name} 已达到最高等级`);
    return false;
}
```

#### 2.4 批量购买功能

**设计说明**:
- 支持长按商品卡片批量购买
- 自动计算可购买次数
- 显示批量购买预览

**实现逻辑**:
```javascript
function calculateMaxPurchase(itemId) {
    const item = shopItems[itemId];
    let gold = player.currentGold;
    let level = item.level;
    let count = 0;

    // 计算最多可购买次数
    while (gold >= item.basePrice * Math.pow(item.growthRate, level)) {
        const price = Math.ceil(item.basePrice * Math.pow(item.growthRate, level));
        gold -= price;
        level += 1;
        count += 1;

        // 限制最大购买次数为100次
        if (count >= 100) break;
    }

    return count;
}

function batchPurchase(itemId, count) {
    for (let i = 0; i < count; i++) {
        if (!purchaseItem(itemId)) {
            break;
        }
    }
}
```

---

### 3. 商品状态设计

#### 3.1 商品状态定义

| 状态 | 触发条件 | 视觉表现 | 交互行为 |
|------|---------|---------|---------|
| **可购买** | 金币足够且已解锁 | 正常亮度，彩色图标 | 可点击购买 |
| **不可购买** | 金币不足或未解锁 | 半透明，灰色图标 | 可点击查看详情 |
| **已购买** | 一次性商品已购买 | 显示"已拥有"标记 | 不可再次购买 |
| **已达上限** | 达到等级上限 | 显示"MAX"标记 | 不可再次购买 |

#### 3.2 状态判断逻辑

```javascript
function getItemStatus(itemId) {
    const item = shopItems[itemId];

    // 检查是否已达上限
    if (item.maxLevel && item.level >= item.maxLevel) {
        return 'max_level';
    }

    // 检查是否已购买 (一次性商品)
    if (item.maxLevel === 1 && item.level >= 1) {
        return 'purchased';
    }

    // 检查是否已解锁
    if (!checkUnlockCondition(itemId)) {
        return 'locked';
    }

    // 检查金币是否足够
    if (player.currentGold >= item.currentPrice) {
        return 'purchasable';
    } else {
        return 'not_affordable';
    }
}
```

#### 3.3 状态视觉设计

**可购买状态**:
```css
.shop-item.purchasable {
    opacity: 1.0;
    filter: none;
    border: 2px solid #FFD700; /* 金色边框 */
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.shop-item.purchasable .icon {
    filter: none;
}

.shop-item.purchasable .price {
    color: #FFD700;
}
```

**不可购买状态**:
```css
.shop-item.not-affordable {
    opacity: 0.5;
    filter: grayscale(50%);
    border: 2px solid #666;
}

.shop-item.not-affordable .icon {
    filter: grayscale(100%);
}

.shop-item.not-affordable .price {
    color: #999;
}
```

**已购买状态**:
```css
.shop-item.purchased {
    opacity: 0.8;
    border: 2px solid #4CAF50; /* 绿色边框 */
}

.shop-item.purchased::after {
    content: "已拥有";
    position: absolute;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}
```

**已达上限状态**:
```css
.shop-item.max-level {
    opacity: 0.8;
    border: 2px solid #9C27B0; /* 紫色边框 */
}

.shop-item.max-level::after {
    content: "MAX";
    position: absolute;
    top: 10px;
    right: 10px;
    background: #9C27B0;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}
```

#### 3.4 状态切换流程

```
游戏开始
    ↓
初始化商品状态
    ↓
┌─────────────────┐
│  监听金币变化   │ ◄─────┐
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│  更新商品状态   │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│  更新UI显示     │       │
└────────┬────────┘       │
         │                │
         └────────────────┘
```

**金币变化监听**:
```javascript
// 使用观察者模式监听金币变化
function onGoldChanged(oldValue, newValue) {
    // 遍历所有商品，更新状态
    for (const itemId in shopItems) {
        const oldStatus = getItemStatus(itemId);
        const newStatus = getItemStatus(itemId);

        if (oldStatus !== newStatus) {
            updateItemVisual(itemId, newStatus);
        }
    }
}
```

---

### 4. 价格增长机制设计

#### 4.1 价格计算公式

**基础公式**:
```
当前价格 = 基础价格 × (增长率 ^ 当前等级)
```

**JavaScript实现**:
```javascript
function calculatePrice(basePrice, growthRate, level) {
    return Math.ceil(basePrice * Math.pow(growthRate, level));
}
```

#### 4.2 价格增长策略

**策略 1: 早期快速成长 (增长率 1.15x)**
- 适用商品: 点击强化、自动点击器
- 特点: 价格增长缓慢，鼓励频繁升级
- 目标: 让新手玩家快速看到成长

**策略 2: 中期平稳过渡 (增长率 1.2x - 1.3x)**
- 适用商品: 超级点击器、幸运手指、暴击大师
- 特点: 价格增长适中，需要一定积累
- 目标: 创造中期目标感

**策略 3: 后期高门槛 (增长率 1.4x - 1.5x)**
- 适用商品: 黄金之手、时间扭曲、双击
- 特点: 价格增长快速，需要长期积累
- 目标: 延长游戏寿命，创造稀有感

#### 4.3 价格增长曲线图

**点击强化 (1.15x)**:
```
等级 | 价格    | 累计投入
-----|---------|----------
1    | 10      | 10
5    | 18      | 75
10   | 36      | 229
20   | 146     | 1,476
50   | 1,083   | 28,068
100  | 117,431 | 7.8M
```

**黄金之手 (1.4x)**:
```
等级 | 价格      | 累计投入
-----|-----------|----------
1    | 5,000     | 5,000
5    | 19,208    | 68,828
10   | 202,741   | 926,464
20   | 8.3M      | 38.2M
50   | 1.18B     | 5.4B
```

#### 4.4 价格显示格式化

**格式化规则**:
```javascript
function formatPrice(price) {
    if (price < 1000) {
        return price.toString();
    } else if (price < 1000000) {
        return (price / 1000).toFixed(1) + 'K';
    } else if (price < 1000000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price < 1000000000000) {
        return (price / 1000000000).toFixed(1) + 'B';
    } else {
        return (price / 1000000000000).toFixed(1) + 'T';
    }
}
```

**显示示例**:
```
10 → "10"
1,500 → "1.5K"
2,500,000 → "2.5M"
8,300,000,000 → "8.3B"
1,180,000,000,000 → "1.2T"
```

#### 4.5 价格溢出处理

**问题**: 高等级商品价格可能超过JavaScript Number最大值 (1.7976931348623157e+308)

**解决方案**:
```javascript
function calculatePriceSafe(basePrice, growthRate, level) {
    // 使用对数运算避免溢出
    const logPrice = Math.log(basePrice) + level * Math.log(growthRate);

    // 检查是否超过最大值
    if (logPrice > 709.78) { // ln(1e308) ≈ 709.78
        return Infinity;
    }

    return Math.ceil(Math.exp(logPrice));
}

// 显示处理
function formatPrice(price) {
    if (price === Infinity) {
        return "∞";
    }
    // ... 正常格式化
}
```

---

## 道具系统设计

### 1. 道具详细配置表

#### 1.1 道具分类

| 分类 | 说明 | 道具数量 |
|------|------|---------|
| 金币加成类 | 提升金币产出 | 3种 |
| 特殊效果类 | 提供特殊效果 | 2种 |

#### 1.2 道具详细配置

##### 道具 1: 金币翻倍 (gold_boost_2x)

| 属性 | 内容 |
|------|------|
| **道具ID** | `gold_boost_2x` |
| **显示名称** | 金币翻倍 |
| **道具描述** | 所有金币产出翻倍，持续30秒 |
| **道具类型** | 临时BUFF |
| **效果类型** | `gold_multiplier` (金币倍率) |
| **效果数值** | ×2 倍率 |
| **持续时间** | 30秒 |
| **获取方式** | 商店购买 |
| **商店价格** | 5,000 金币 |
| **库存上限** | 99个 |
| **可叠加** | 是 (时间叠加) |

**效果说明**:
- 所有金币产出翻倍 (点击、GPS、离线收益)
- 与永久升级叠加
- 计算公式: 最终产出 = 基础产出 × (1 + 黄金之手) × 2

**使用场景**:
- 配合高GPS快速刷金币
- 配合离线收益翻倍
- 活动期间最大化收益

---

##### 道具 2: 金币五倍 (gold_boost_5x)

| 属性 | 内容 |
|------|------|
| **道具ID** | `gold_boost_5x` |
| **显示名称** | 金币五倍 |
| **道具描述** | 所有金币产出×5，持续15秒 |
| **道具类型** | 临时BUFF |
| **效果类型** | `gold_multiplier` (金币倍率) |
| **效果数值** | ×5 倍率 |
| **持续时间** | 15秒 |
| **获取方式** | 成就奖励 |
| **成就条件** | 累计获得 1,000,000 金币 |
| **库存上限** | 99个 |
| **可叠加** | 是 (时间叠加) |

**效果说明**:
- 所有金币产出×5
- 持续时间短但效果强力
- 只能通过成就获得，稀有度高

**使用场景**:
- 关键时刻爆发使用
- 配合其他BUFF叠加
- 突破瓶颈期

---

##### 道具 3: 即时金币 (instant_gold)

| 属性 | 内容 |
|------|------|
| **道具ID** | `instant_gold` |
| **显示名称** | 即时金币 |
| **道具描述** | 立即获得当前金币的10% |
| **道具类型** | 即时效果 |
| **效果类型** | `instant_gold` (即时金币) |
| **效果数值** | 当前金币 × 10% |
| **持续时间** | 即时 (无持续时间) |
| **获取方式** | 商店购买 |
| **商店价格** | 10,000 金币 |
| **库存上限** | 99个 |
| **可叠加** | 不适用 |

**效果说明**:
- 立即获得当前金币的10%
- 金币越多，收益越高
- 计算公式: 获得金币 = currentGold × 0.1

**使用场景**:
- 金币积累到一定数量后使用
- 快速突破价格门槛
- 配合其他金币加成使用

**性价比分析**:
```
需要 currentGold > 100,000 才划算
(因为价格 10,000，收益 100,000 × 10% = 10,000)
```

---

##### 道具 4: 幸运时刻 (lucky_hour)

| 属性 | 内容 |
|------|------|
| **道具ID** | `lucky_hour` |
| **显示名称** | 幸运时刻 |
| **道具描述** | 暴击率 +20%，持续60秒 |
| **道具类型** | 临时BUFF |
| **效果类型** | `crit_rate_add` (暴击率加成) |
| **效果数值** | +20% 暴击率 |
| **持续时间** | 60秒 |
| **获取方式** | 成就奖励 |
| **成就条件** | 累计触发 100 次暴击 |
| **库存上限** | 99个 |
| **可叠加** | 是 (时间叠加) |

**效果说明**:
- 暴击率额外增加 20%
- 与幸运手指永久升级叠加
- 计算公式: 总暴击率 = 基础暴击率 + 幸运手指 + 幸运时刻

**使用场景**:
- 配合暴击大师提升暴击伤害
- 快速刷金币时使用
- 配合金币翻倍道具

---

##### 道具 5: 自动加速 (auto_boost)

| 属性 | 内容 |
|------|------|
| **道具ID** | `auto_boost` |
| **显示名称** | 自动加速 |
| **道具描述** | GPS ×3，持续60秒 |
| **道具类型** | 临时BUFF |
| **效果类型** | `gps_multiplier` (GPS倍率) |
| **效果数值** | ×3 GPS倍率 |
| **持续时间** | 60秒 |
| **获取方式** | 商店购买 |
| **商店价格** | 20,000 金币 |
| **库存上限** | 99个 |
| **可叠加** | 是 (时间叠加) |

**效果说明**:
- GPS产出×3
- 不影响点击产出
- 计算公式: 实际GPS = 基础GPS × 3

**使用场景**:
- 挂机时使用
- 配合金币翻倍道具
- 快速积累金币

**性价比分析**:
```
需要 GPS > 111/秒 才划算
(因为价格 20,000，60秒收益 = GPS × 3 × 60 = GPS × 180)
(需要 GPS × 180 > 20,000，即 GPS > 111)
```

---

#### 1.3 道具配置汇总表

| 道具ID | 显示名称 | 效果类型 | 效果数值 | 持续时间 | 获取方式 | 价格/条件 | 库存上限 |
|--------|---------|---------|---------|---------|---------|----------|---------|
| gold_boost_2x | 金币翻倍 | gold_multiplier | ×2 | 30秒 | 商店购买 | 5,000 金币 | 99 |
| gold_boost_5x | 金币五倍 | gold_multiplier | ×5 | 15秒 | 成就奖励 | 1M金币成就 | 99 |
| instant_gold | 即时金币 | instant_gold | 当前×10% | 即时 | 商店购买 | 10,000 金币 | 99 |
| lucky_hour | 幸运时刻 | crit_rate_add | +20% 暴击率 | 60秒 | 成就奖励 | 100次暴击 | 99 |
| auto_boost | 自动加速 | gps_multiplier | ×3 GPS | 60秒 | 商店购买 | 20,000 金币 | 99 |

---

### 2. 道具获取系统设计

#### 2.1 获取途径

**途径 1: 商店购买**
```javascript
function purchaseItem(itemId) {
    const item = items[itemId];

    // 检查是否可购买
    if (item.source !== 'shop') {
        showToast('该道具无法购买');
        return false;
    }

    // 检查金币
    if (player.currentGold < item.price) {
        showToast('金币不足');
        return false;
    }

    // 检查库存上限
    if (player.inventory[itemId] >= item.maxStack) {
        showToast('库存已满');
        return false;
    }

    // 扣除金币
    player.currentGold -= item.price;

    // 添加到道具栏
    player.inventory[itemId] = (player.inventory[itemId] || 0) + 1;

    // 显示成功提示
    showToast(`购买成功! ${item.name} x1`);

    return true;
}
```

**途径 2: 成就奖励**
```javascript
function onAchievementComplete(achievementId) {
    const achievement = achievements[achievementId];

    // 检查是否有道具奖励
    if (achievement.itemReward) {
        const itemId = achievement.itemReward;
        const item = items[itemId];

        // 检查库存上限
        if (player.inventory[itemId] >= item.maxStack) {
            // 转换为金币奖励
            const goldReward = item.price || 10000;
            player.currentGold += goldReward;
            showToast(`库存已满，获得 ${formatGold(goldReward)} 金币`);
        } else {
            // 添加到道具栏
            player.inventory[itemId] = (player.inventory[itemId] || 0) + 1;
            showToast(`获得道具: ${item.name} x1`);
        }
    }
}
```

**途径 3: 里程碑奖励**
```javascript
function onMilestoneReached(milestoneId) {
    const milestone = milestones[milestoneId];

    // 检查是否有道具奖励
    if (milestone.itemReward) {
        const itemId = milestone.itemReward;
        const item = items[itemId];

        // 添加到道具栏
        player.inventory[itemId] = (player.inventory[itemId] || 0) + 1;
        showToast(`里程碑奖励: ${item.name} x1`);
    }
}
```

#### 2.2 道具栏设计

**道具栏UI布局**:
```
┌─────────────────────────────────┐
│  道具栏 (5/99)                  │
├─────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐       │
│  │金币│  │金币│  │即时│       │
│  │翻倍│  │五倍│  │金币│       │
│  │ x5 │  │ x2 │  │ x3 │       │
│  └────┘  └────┘  └────┘       │
│  ┌────┐  ┌────┐               │
│  │幸运│  │自动│               │
│  │时刻│  │加速│               │
│  │ x1 │  │ x0 │               │
│  └────┘  └────┘               │
└─────────────────────────────────┘
```

**道具栏数据结构**:
```javascript
player.inventory = {
    gold_boost_2x: 5,
    gold_boost_5x: 2,
    instant_gold: 3,
    lucky_hour: 1,
    auto_boost: 0
};
```

#### 2.3 道具获取提示

**获取提示设计**:
```javascript
function showItemAcquired(itemId, count = 1) {
    const item = items[itemId];

    // 创建提示框
    const toast = document.createElement('div');
    toast.className = 'item-acquired-toast';
    toast.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-count">×${count}</div>
        </div>
    `;

    // 添加到屏幕
    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
```

---

### 3. 道具使用系统设计

#### 3.1 道具使用流程图

```
┌─────────────────┐
│ 点击道具栏道具  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  检查道具库存   │
└────────┬────────┘
         │
    ┌────┴────┐
    │库存>0？ │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   否         是
    │         │
    ▼         ▼
┌───────┐ ┌─────────────────┐
│显示   │ │  扣除道具数量   │
│库存   │ │  inventory[id]  │
│不足   │ │  -= 1           │
│提示   │ └────────┬────────┘
└───────┘          │
                   ▼
          ┌─────────────────┐
          │  检查效果类型   │
          └────────┬────────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
      即时效果  持续BUFF   特殊效果
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │立即应用│ │添加到  │ │特殊处理│
    │效果    │ │BUFF列表│ │        │
    └────────┘ └────────┘ └────────┘
         │         │         │
         └─────────┼─────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  显示使用效果   │
          │  - 音效         │
          │  - 动画         │
          │  - 提示         │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  更新UI显示     │
          │  - 道具栏       │
          │  - BUFF状态栏   │
          │  - 属性面板     │
          └─────────────────┘
```

#### 3.2 道具使用详细步骤

**步骤 1: 点击道具栏道具**
```javascript
function onItemClick(itemId) {
    // 检查库存
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) {
        showToast('道具库存不足');
        return false;
    }

    // 使用道具
    useItem(itemId);
}
```

**步骤 2: 扣除道具数量**
```javascript
function deductItem(itemId) {
    player.inventory[itemId] -= 1;

    // 如果数量为0，删除该道具
    if (player.inventory[itemId] <= 0) {
        delete player.inventory[itemId];
    }
}
```

**步骤 3: 应用道具效果**

**即时效果处理**:
```javascript
function applyInstantEffect(itemId) {
    const item = items[itemId];

    switch (item.effect.type) {
        case 'instant_gold':
            // 即时金币
            const goldGain = player.currentGold * item.effect.value;
            player.currentGold += goldGain;
            showToast(`获得 ${formatGold(goldGain)} 金币!`);
            break;
    }
}
```

**持续BUFF处理**:
```javascript
function applyBuffEffect(itemId) {
    const item = items[itemId];

    // 检查是否已有同类BUFF
    const existingBuff = player.activeBuffs.find(
        buff => buff.effect.type === item.effect.type
    );

    if (existingBuff) {
        // 时间叠加
        existingBuff.remainingTime += item.duration;
        showToast(`${item.name} 效果延长至 ${existingBuff.remainingTime} 秒`);
    } else {
        // 添加新BUFF
        const buff = {
            id: generateBuffId(),
            itemId: itemId,
            name: item.name,
            icon: item.icon,
            effect: { ...item.effect },
            remainingTime: item.duration,
            startTime: Date.now()
        };

        player.activeBuffs.push(buff);
        showToast(`${item.name} 已激活!`);
    }
}
```

**步骤 4: 显示使用效果**
```javascript
function showUseEffect(itemId) {
    const item = items[itemId];

    // 播放音效
    playSound('item_use');

    // 显示动画
    if (item.effect.type === 'instant_gold') {
        showGoldRainAnimation();
    } else {
        showBuffActivationAnimation(item.icon);
    }
}
```

**步骤 5: 更新UI显示**
```javascript
function updateUIAfterItemUse(itemId) {
    // 更新道具栏
    updateInventoryUI();

    // 更新BUFF状态栏
    updateBuffBar();

    // 更新属性面板
    updateStatsPanel();
}
```

#### 3.3 效果叠加规则

**规则 1: 同类效果时间叠加**
```javascript
// 金币翻倍 + 金币翻倍 = 时间延长
// 30秒 + 30秒 = 60秒
```

**规则 2: 不同类效果可叠加**
```javascript
// 金币翻倍 + 自动加速 = 效果叠加
// 金币 ×2 + GPS ×3 = 总产出大幅提升
```

**规则 3: 永久升级与临时BUFF叠加**
```javascript
// 黄金之手 (永久 +10%) + 金币翻倍 (临时 ×2)
// 最终倍率 = (1 + 0.1) × 2 = 2.2x
```

**效果计算示例**:
```javascript
// 假设玩家有以下加成:
// - 黄金之手 Lv.5: +50% 金币
// - 金币翻倍激活: ×2
// - 自动加速激活: ×3 GPS

// 点击产出计算:
clickOutput = baseClick × (1 + 0.5) × 2

// GPS计算:
gpsOutput = baseGPS × (1 + 0.5) × 2 × 3
```

#### 3.4 BUFF持续时间管理

**BUFF更新机制**:
```javascript
function updateBuffs(deltaTime) {
    // 遍历所有激活的BUFF
    for (let i = player.activeBuffs.length - 1; i >= 0; i--) {
        const buff = player.activeBuffs[i];

        // 减少剩余时间
        buff.remainingTime -= deltaTime;

        // 检查是否过期
        if (buff.remainingTime <= 0) {
            // 移除BUFF
            player.activeBuffs.splice(i, 1);

            // 显示过期提示
            showToast(`${buff.name} 效果已结束`);

            // 更新UI
            updateBuffBar();
        }
    }
}

// 每秒更新一次
setInterval(() => {
    updateBuffs(1);
}, 1000);
```

---

### 4. BUFF系统设计

#### 4.1 BUFF状态栏设计

**UI布局**:
```
┌─────────────────────────────────┐
│  激活的BUFF                     │
├─────────────────────────────────┤
│  ┌───────────────────────────┐ │
│  │ [图标] 金币翻倍    25秒   │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ [图标] 自动加速    58秒   │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ [图标] 幸运时刻    45秒   │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

**BUFF卡片设计**:
```html
<div class="buff-card">
    <div class="buff-icon">💰</div>
    <div class="buff-info">
        <div class="buff-name">金币翻倍</div>
        <div class="buff-timer">25秒</div>
    </div>
    <div class="buff-progress">
        <div class="progress-bar" style="width: 83%"></div>
    </div>
</div>
```

#### 4.2 BUFF数据结构

```javascript
player.activeBuffs = [
    {
        id: 'buff_12345',
        itemId: 'gold_boost_2x',
        name: '金币翻倍',
        icon: '💰',
        effect: {
            type: 'gold_multiplier',
            value: 2
        },
        remainingTime: 25,
        startTime: 1708400000000
    },
    {
        id: 'buff_12346',
        itemId: 'auto_boost',
        name: '自动加速',
        icon: '⚡',
        effect: {
            type: 'gps_multiplier',
            value: 3
        },
        remainingTime: 58,
        startTime: 1708400005000
    }
];
```

#### 4.3 BUFF显示规则

**规则 1: 按剩余时间排序**
```javascript
function sortBuffsByTime() {
    player.activeBuffs.sort((a, b) => {
        return a.remainingTime - b.remainingTime;
    });
}
```

**规则 2: 实时更新倒计时**
```javascript
function updateBuffTimers() {
    const buffCards = document.querySelectorAll('.buff-card');

    buffCards.forEach((card, index) => {
        const buff = player.activeBuffs[index];
        if (buff) {
            // 更新时间显示
            card.querySelector('.buff-timer').textContent =
                `${Math.ceil(buff.remainingTime)}秒`;

            // 更新进度条
            const item = items[buff.itemId];
            const progress = (buff.remainingTime / item.duration) * 100;
            card.querySelector('.progress-bar').style.width = `${progress}%`;
        }
    });
}
```

**规则 3: 过期BUFF自动移除**
```javascript
function removeExpiredBuffs() {
    const expiredBuffs = player.activeBuffs.filter(
        buff => buff.remainingTime <= 0
    );

    expiredBuffs.forEach(buff => {
        showToast(`${buff.name} 效果已结束`);
    });

    player.activeBuffs = player.activeBuffs.filter(
        buff => buff.remainingTime > 0
    );
}
```

#### 4.4 BUFF交互设计

**点击BUFF查看详情**:
```javascript
function onBuffClick(buffId) {
    const buff = player.activeBuffs.find(b => b.id === buffId);
    const item = items[buff.itemId];

    // 显示详情弹窗
    showBuffDetailModal({
        name: buff.name,
        description: item.description,
        effect: `${getEffectDescription(buff.effect)}`,
        remainingTime: `${Math.ceil(buff.remainingTime)}秒`,
        totalTime: `${item.duration}秒`
    });
}
```

**BUFF详情弹窗**:
```
┌─────────────────────────────┐
│  金币翻倍                   │
├─────────────────────────────┤
│  所有金币产出翻倍           │
│                             │
│  效果: 金币 ×2              │
│  剩余时间: 25秒 / 30秒      │
│  ████████████░░░░ 83%       │
│                             │
│  来源: 商店购买             │
└─────────────────────────────┘
```

#### 4.5 BUFF效果计算

**综合效果计算**:
```javascript
function calculateTotalBuffs() {
    let goldMultiplier = 1;
    let gpsMultiplier = 1;
    let critRateBonus = 0;

    // 遍历所有激活的BUFF
    player.activeBuffs.forEach(buff => {
        switch (buff.effect.type) {
            case 'gold_multiplier':
                goldMultiplier *= buff.effect.value;
                break;
            case 'gps_multiplier':
                gpsMultiplier *= buff.effect.value;
                break;
            case 'crit_rate_add':
                critRateBonus += buff.effect.value;
                break;
        }
    });

    return {
        goldMultiplier,
        gpsMultiplier,
        critRateBonus
    };
}
```

**应用到产出计算**:
```javascript
function calculateClickOutput() {
    const buffs = calculateTotalBuffs();

    // 基础点击产出
    let output = 1; // 基础1金币

    // + 点击强化
    output += player.clickPowerLevel;

    // × 双击倍率
    if (player.hasDoubleClick) {
        output *= 2;
    }

    // × 黄金之手
    output *= (1 + player.goldenTouchLevel * 0.1);

    // × BUFF金币倍率
    output *= buffs.goldMultiplier;

    return output;
}

function calculateGPS() {
    const buffs = calculateTotalBuffs();

    // 基础GPS
    let gps = 0;

    // + 自动点击器
    gps += player.autoClickerLevel * 1;

    // + 超级点击器
    gps += player.megaClickerLevel * 10;

    // × 黄金之手
    gps *= (1 + player.goldenTouchLevel * 0.1);

    // × BUFF金币倍率
    gps *= buffs.goldMultiplier;

    // × BUFF GPS倍率
    gps *= buffs.gpsMultiplier;

    return gps;
}
```

---

## 数据结构规范

### 1. 商品数据结构

```javascript
// 商品配置
const shopItems = {
    click_power: {
        id: 'click_power',
        name: '点击强化',
        description: '每次点击额外获得 +1 金币',
        type: 'permanent',
        basePrice: 10,
        growthRate: 1.15,
        currentPrice: 10,
        level: 0,
        maxLevel: null, // null表示无上限
        effect: {
            type: 'click_add',
            value: 1
        },
        unlockCondition: null, // null表示无解锁条件
        icon: '👆'
    },
    auto_clicker: {
        id: 'auto_clicker',
        name: '自动点击器',
        description: '每秒自动获得 +1 金币 (GPS +1)',
        type: 'permanent',
        basePrice: 100,
        growthRate: 1.15,
        currentPrice: 100,
        level: 0,
        maxLevel: null,
        effect: {
            type: 'gps_add',
            value: 1
        },
        unlockCondition: null,
        icon: '🤖'
    },
    // ... 其他商品
};

// 玩家商品数据
player.shopData = {
    click_power: { level: 5, totalSpent: 75 },
    auto_clicker: { level: 3, totalSpent: 350 },
    // ...
};
```

### 2. 道具数据结构

```javascript
// 道具配置
const items = {
    gold_boost_2x: {
        id: 'gold_boost_2x',
        name: '金币翻倍',
        description: '所有金币产出翻倍，持续30秒',
        type: 'buff',
        effect: {
            type: 'gold_multiplier',
            value: 2
        },
        duration: 30,
        source: 'shop', // 'shop' | 'achievement' | 'milestone'
        price: 5000,
        maxStack: 99,
        icon: '💰'
    },
    instant_gold: {
        id: 'instant_gold',
        name: '即时金币',
        description: '立即获得当前金币的10%',
        type: 'instant',
        effect: {
            type: 'instant_gold',
            value: 0.1
        },
        duration: 0, // 即时效果
        source: 'shop',
        price: 10000,
        maxStack: 99,
        icon: '💎'
    },
    // ... 其他道具
};

// 玩家道具数据
player.inventory = {
    gold_boost_2x: 5,
    gold_boost_5x: 2,
    instant_gold: 3,
    lucky_hour: 1,
    auto_boost: 0
};
```

### 3. BUFF数据结构

```javascript
// 激活的BUFF
player.activeBuffs = [
    {
        id: 'buff_12345', // 唯一ID
        itemId: 'gold_boost_2x', // 关联的道具ID
        name: '金币翻倍',
        icon: '💰',
        effect: {
            type: 'gold_multiplier',
            value: 2
        },
        remainingTime: 25, // 剩余时间(秒)
        startTime: 1708400000000 // 开始时间戳
    }
];
```

### 4. 玩家属性数据结构

```javascript
player = {
    // 金币相关
    currentGold: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,

    // 点击相关
    clickPowerLevel: 0, // 点击强化等级
    hasDoubleClick: false, // 是否购买双击
    clickMultiplier: 1, // 点击倍率

    // GPS相关
    autoClickerLevel: 0, // 自动点击器等级
    megaClickerLevel: 0, // 超级点击器等级
    gps: 0, // 当前GPS

    // 暴击相关
    critRate: 0.16, // 基础暴击率
    critRateBonus: 0, // 暴击率加成
    critDamageBonus: 0, // 暴击伤害加成

    // 加成相关
    goldMultiplier: 1, // 金币倍率
    offlineBonus: 0.5, // 离线收益效率

    // 道具相关
    inventory: {}, // 道具库存
    activeBuffs: [], // 激活的BUFF

    // 商品相关
    shopData: {} // 商品购买记录
};
```

---

## 验收标准

### 1. 功能验收

#### 1.1 商店系统验收

- [ ] 所有8种商品定义完整
- [ ] 商品ID唯一且有意义
- [ ] 商品效果描述清晰准确
- [ ] 价格计算公式正确
- [ ] 价格增长符合设计预期
- [ ] 价格显示格式正确
- [ ] 高等级价格不溢出

#### 1.2 购买流程验收

- [ ] 购买流程完整无遗漏
- [ ] 金币扣除准确
- [ ] 效果即时生效
- [ ] 价格正确更新
- [ ] 购买失败有提示
- [ ] 商品状态显示正确
- [ ] 状态切换实时响应

#### 1.3 道具系统验收

- [ ] 所有5种道具定义完整
- [ ] 道具ID唯一且有意义
- [ ] 道具效果和持续时间明确
- [ ] 道具获取方式定义清晰
- [ ] 道具库存管理正确
- [ ] 道具使用流程完整
- [ ] 道具效果正确应用

#### 1.4 BUFF系统验收

- [ ] BUFF正确显示
- [ ] 倒计时实时更新
- [ ] 过期BUFF自动移除
- [ ] 多BUFF显示不重叠
- [ ] 点击交互正常
- [ ] BUFF效果叠加规则正确

### 2. 数据验收

- [ ] 商品数据结构正确
- [ ] 道具数据结构正确
- [ ] BUFF数据结构正确
- [ ] 玩家属性数据结构正确
- [ ] 配置表数据准确

### 3. 性能验收

- [ ] 购买响应时间 ≤100ms
- [ ] BUFF更新频率 1次/秒
- [ ] UI更新流畅无卡顿
- [ ] 无内存泄漏

### 4. 文档验收

- [ ] 商店系统设计文档完整
- [ ] 道具系统设计文档完整
- [ ] 商品配置表完整准确
- [ ] 道具配置表完整准确
- [ ] 购买流程图清晰
- [ ] BUFF系统设计完整

---

## 附录

### A. 商品价格计算工具

```javascript
// 价格计算器
class PriceCalculator {
    static calculate(basePrice, growthRate, level) {
        return Math.ceil(basePrice * Math.pow(growthRate, level));
    }

    static calculateTotal(basePrice, growthRate, targetLevel) {
        let total = 0;
        for (let i = 0; i < targetLevel; i++) {
            total += this.calculate(basePrice, growthRate, i);
        }
        return total;
    }

    static calculateMaxLevel(basePrice, growthRate, availableGold) {
        let level = 0;
        let totalCost = 0;

        while (totalCost + this.calculate(basePrice, growthRate, level) <= availableGold) {
            totalCost += this.calculate(basePrice, growthRate, level);
            level++;
        }

        return level;
    }
}

// 使用示例
console.log(PriceCalculator.calculate(10, 1.15, 10)); // Lv.10价格
console.log(PriceCalculator.calculateTotal(10, 1.15, 10)); // 升到Lv.10总花费
console.log(PriceCalculator.calculateMaxLevel(10, 1.15, 1000)); // 1000金币能升到几级
```

### B. BUFF效果计算工具

```javascript
// BUFF效果计算器
class BuffCalculator {
    static calculateTotalBuffs(activeBuffs) {
        let goldMultiplier = 1;
        let gpsMultiplier = 1;
        let critRateBonus = 0;

        activeBuffs.forEach(buff => {
            switch (buff.effect.type) {
                case 'gold_multiplier':
                    goldMultiplier *= buff.effect.value;
                    break;
                case 'gps_multiplier':
                    gpsMultiplier *= buff.effect.value;
                    break;
                case 'crit_rate_add':
                    critRateBonus += buff.effect.value;
                    break;
            }
        });

        return {
            goldMultiplier,
            gpsMultiplier,
            critRateBonus
        };
    }

    static calculateClickOutput(player) {
        const buffs = this.calculateTotalBuffs(player.activeBuffs);

        let output = 1;
        output += player.clickPowerLevel;
        output *= player.hasDoubleClick ? 2 : 1;
        output *= (1 + player.goldenTouchLevel * 0.1);
        output *= buffs.goldMultiplier;

        return output;
    }

    static calculateGPS(player) {
        const buffs = this.calculateTotalBuffs(player.activeBuffs);

        let gps = 0;
        gps += player.autoClickerLevel * 1;
        gps += player.megaClickerLevel * 10;
        gps *= (1 + player.goldenTouchLevel * 0.1);
        gps *= buffs.goldMultiplier;
        gps *= buffs.gpsMultiplier;

        return gps;
    }
}
```

### C. 金币格式化工具

```javascript
// 金币格式化器
class GoldFormatter {
    static format(gold) {
        if (gold < 1000) {
            return gold.toString();
        } else if (gold < 1000000) {
            return (gold / 1000).toFixed(1) + 'K';
        } else if (gold < 1000000000) {
            return (gold / 1000000).toFixed(1) + 'M';
        } else if (gold < 1000000000000) {
            return (gold / 1000000000).toFixed(1) + 'B';
        } else {
            return (gold / 1000000000000).toFixed(1) + 'T';
        }
    }

    static formatWithComma(gold) {
        return gold.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// 使用示例
console.log(GoldFormatter.format(1500)); // "1.5K"
console.log(GoldFormatter.format(2500000)); // "2.5M"
console.log(GoldFormatter.formatWithComma(1234567)); // "1,234,567"
```

---

## 文档版本历史

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|---------|--------|
| v1.0 | 2026-02-20 | 初始版本，完成所有设计任务 | SD-2 |

---

## 相关文档

- [核心玩法设计](./SD-1-核心玩法设计.md)
- [数值设计](../数值策划/BD-1-数值设计.md)
- [任务清单](./LD-TODOLIST-SD-2-v1.0-20260220.md)

---

**文档结束**
