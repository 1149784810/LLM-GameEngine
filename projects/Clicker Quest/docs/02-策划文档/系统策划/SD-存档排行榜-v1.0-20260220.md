# 存档系统与排行榜系统设计文档

**文档编号**: SD-存档排行榜-v1.0-20260220
**策划角色**: 系统策划-存档系统(SD-4)
**负责模块**: 存档系统、排行榜系统
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、文档概述

### 1.1 设计目标
本文档详细定义Clicker Quest游戏的存档系统和排行榜系统设计,确保玩家数据的安全性和完整性,同时提供公平的竞争机制。

### 1.2 核心目标
- 设计可靠的数据存档机制,防止数据丢失
- 实现自动存档和手动存档,确保数据实时性
- 设计离线收益系统,提升玩家留存
- 建立公平的排行榜规则,激发玩家竞争动力
- 确保数据安全和防作弊

### 1.3 适用范围
- 存档数据结构设计
- 自动存档机制设计
- 离线收益计算设计
- 排行榜规则设计
- 数据安全设计

---

## 二、存档数据结构设计

### 2.1 核心数据结构

#### 2.1.1 玩家基础数据 (PlayerData)

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
- `playerId`: 玩家唯一标识符,格式: `player_[timestamp]_[random]`
- `playerName`: 玩家昵称,默认: "冒险者[随机数]"
- `createTime`: 账号创建时间戳(毫秒)
- `lastSaveTime`: 最后存档时间戳(毫秒)
- `totalPlayTime`: 累计游戏时长(秒)
- `loginDays`: 累计登录天数
- `lastLoginDate`: 最后登录日期,格式: YYYY-MM-DD

#### 2.1.2 金币数据 (CurrencyData)

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
- `critRate`: 暴击率(百分比,如: 10表示10%)
- `critMultiplier`: 暴击倍率(如: 2表示2倍)

#### 2.1.3 道具数据 (ItemData)

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

**字段说明**:
- `ownedItems`: 已拥有道具列表
  - `itemId`: 道具ID,格式: `item_[类型]_[序号]`
  - `itemName`: 道具名称
  - `itemType`: 道具类型(auto/buff/consum/perm)
  - `quantity`: 道具数量
  - `level`: 道具等级
  - `isActive`: 是否激活
  - `remainingTime`: 剩余时间(秒),限时道具专用
  - `purchaseTime`: 购买时间戳
- `autoClickers`: 自动点击器列表
  - `autoClickerId`: 自动点击器ID
  - `type`: 类型(primary/intermediate/advanced/top)
  - `baseOutput`: 基础产出(金币/秒)
  - `currentOutput`: 当前产出(含加成)
  - `quantity`: 拥有数量
  - `level`: 等级
  - `totalOutput`: 累计产出

#### 2.1.4 成就数据 (AchievementData)

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

**字段说明**:
- `unlockedAchievements`: 已解锁成就列表
  - `achievementId`: 成就ID,格式: `ach_[类型]_[序号]`
  - `achievementName`: 成就名称
  - `unlockTime`: 解锁时间戳
  - `isClaimed`: 是否已领取奖励
  - `claimTime`: 领取时间戳
- `achievementProgress`: 成就进度映射表
  - `current`: 当前进度
  - `target`: 目标进度
  - `progress`: 完成百分比(0-100)

#### 2.1.5 设置数据 (SettingsData)

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

**字段说明**:
- `audio`: 音频设置
  - `musicEnabled`: 音乐开关
  - `musicVolume`: 音乐音量(0-100)
  - `sfxEnabled`: 音效开关
  - `sfxVolume`: 音效音量(0-100)
- `notification`: 通知设置
  - `notificationEnabled`: 通知总开关
  - `offlineRewardNotification`: 离线收益通知
  - `achievementNotification`: 成就通知
- `display`: 显示设置
  - `particleEffects`: 粒子特效开关
  - `numberFormat`: 数字格式(standard/scientific/abbreviated)
  - `theme`: 主题(light/dark/auto)
- `gameplay`: 游戏设置
  - `autoSaveInterval`: 自动存档间隔(秒)
  - `offlineRewardRatio`: 离线收益比例(百分比)

#### 2.1.6 统计数据 (StatisticsData)

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

**字段说明**:
- `totalClicks`: 累计点击次数
- `totalCrits`: 累计暴击次数
- `maxCritGold`: 单次暴击最大金币
- `totalItemsPurchased`: 累计购买道具数
- `totalAutoClickersPurchased`: 累计购买自动点击器数
- `totalAchievementsUnlocked`: 累计解锁成就数
- `highestDPS`: 历史最高DPS
- `highestGold`: 历史最高金币
- `longestOfflineTime`: 最长离线时间(秒)
- `totalOfflineRewards`: 累计离线收益

### 2.2 完整存档数据结构

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

**字段说明**:
- `version`: 存档版本号,格式: `v1.0.0`
- `checksum`: 数据校验和,用于验证数据完整性
- `timestamp`: 存档时间戳(毫秒)
- `data`: 实际游戏数据

### 2.3 存储键名规范

| 数据类型 | LocalStorage键名 | 说明 |
|---------|-----------------|------|
| 完整存档 | `clicker_quest_save` | 完整游戏存档 |
| 玩家数据 | `clicker_quest_player` | 玩家基础数据 |
| 金币数据 | `clicker_quest_currency` | 金币相关数据 |
| 道具数据 | `clicker_quest_items` | 道具相关数据 |
| 成就数据 | `clicker_quest_achievements` | 成就相关数据 |
| 设置数据 | `clicker_quest_settings` | 游戏设置 |
| 统计数据 | `clicker_quest_statistics` | 统计数据 |
| 缓存数据 | `clicker_quest_cache` | 临时缓存数据 |

---

## 三、自动存档机制设计

### 3.1 存档触发时机

#### 3.1.1 定时自动存档
- **触发条件**: 每30秒自动触发一次
- **存档内容**: 完整游戏数据
- **存档方式**: 异步存档,不阻塞游戏主线程
- **失败处理**: 自动重试3次,间隔1秒

#### 3.1.2 关键操作存档
触发关键操作后立即存档:

| 操作类型 | 触发时机 | 优先级 |
|---------|---------|--------|
| 购买道具 | 购买成功后 | P0 |
| 升级道具 | 升级成功后 | P0 |
| 领取成就 | 领取奖励后 | P0 |
| 使用消耗品 | 使用成功后 | P1 |
| 修改设置 | 设置变更后 | P2 |
| 大额金币变动 | 变动超过10%当前金币 | P1 |

#### 3.1.3 游戏关闭存档
- **触发条件**: 浏览器关闭/标签页关闭/游戏退出
- **存档方式**: 同步存档,确保数据写入完成
- **超时处理**: 最多等待5秒,超时后强制关闭
- **实现方式**: 监听 `beforeunload` 和 `unload` 事件

#### 3.1.4 离线收益存档
- **触发时机**: 玩家上线领取离线收益后
- **存档内容**: 更新金币和统计数据
- **特殊处理**: 记录离线时长和收益

### 3.2 存档流程设计

```
触发存档
    ↓
收集游戏数据
    ↓
数据序列化(JSON)
    ↓
数据压缩(可选)
    ↓
计算校验和
    ↓
写入LocalStorage
    ↓
验证写入结果
    ↓
存档成功反馈
```

### 3.3 存档优化策略

#### 3.3.1 增量存档
- **原理**: 只保存变化的数据字段
- **实现**: 记录数据变更标记,只序列化变更部分
- **优势**: 减少存档时间和数据量
- **适用场景**: 高频小改动(如金币变化)

#### 3.3.2 数据压缩
- **压缩算法**: LZ-String压缩算法
- **压缩率**: 约60-70%
- **适用场景**: 完整存档时压缩
- **优势**: 减少LocalStorage占用空间

#### 3.3.3 异步存档
- **实现方式**: 使用 `setTimeout` 或 `requestIdleCallback`
- **优先级**: 低优先级,不影响游戏性能
- **队列机制**: 存档请求进入队列,依次执行
- **防抖机制**: 1秒内多次触发只执行最后一次

#### 3.3.4 存档验证
- **写入验证**: 写入后立即读取验证
- **校验和验证**: 计算并验证数据校验和
- **完整性验证**: 检查所有必要字段是否存在
- **异常处理**: 验证失败时回滚到上次成功存档

### 3.4 存档失败处理

#### 3.4.1 失败原因分析
| 失败原因 | 概率 | 处理方案 |
|---------|------|---------|
| LocalStorage已满 | 中 | 清理旧数据,提示玩家 |
| 浏览器隐私模式 | 低 | 提示玩家退出隐私模式 |
| 数据序列化失败 | 低 | 记录错误日志,使用备用方案 |
| 写入被中断 | 低 | 自动重试,最多3次 |

#### 3.4.2 失败恢复流程
```
存档失败
    ↓
记录错误日志
    ↓
判断失败原因
    ↓
尝试自动恢复
    ↓
恢复失败?
    ↓ 是
提示玩家
    ↓
提供手动存档选项
```

---

## 四、离线收益计算设计

### 4.1 离线时间计算

#### 4.1.1 时间计算公式
```
离线时长 = 当前时间 - 最后存档时间
```

**限制条件**:
- 最小离线时长: 60秒(小于60秒不计收益)
- 最大离线时长: 86400秒(24小时)
- 超过最大时长按最大时长计算

#### 4.1.2 时间计算示例
```javascript
// 示例1: 正常离线
最后存档时间: 2026-02-19 20:00:00
当前登录时间: 2026-02-20 08:00:00
离线时长: 12小时 = 43200秒

// 示例2: 超过上限
最后存档时间: 2026-02-18 08:00:00
当前登录时间: 2026-02-20 08:00:00
实际离线时长: 48小时
计算离线时长: 24小时(按上限计算)
```

### 4.2 离线收益计算公式

#### 4.2.1 基础离线收益公式
```
基础离线收益 = 当前DPS × 离线时长 × 离线收益比例
```

**参数说明**:
- `当前DPS`: 玩家当前每秒金币产出
- `离线时长`: 实际离线时长(秒)
- `离线收益比例`: 基础比例50%,可通过道具提升

#### 4.2.2 离线收益比例计算
```
最终离线收益比例 = 基础比例(50%) + 道具加成 + VIP加成
```

**加成上限**: 最高100%(即1倍收益)

#### 4.2.3 完整计算公式
```
离线收益 = floor(DPS × min(离线时长, 86400) × min(离线收益比例, 100%))
```

### 4.3 离线收益计算示例

#### 示例1: 基础情况
```
玩家DPS: 100金币/秒
离线时长: 4小时(14400秒)
离线收益比例: 50%

离线收益 = 100 × 14400 × 0.5 = 720,000金币
```

#### 示例2: 有道具加成
```
玩家DPS: 500金币/秒
离线时长: 8小时(28800秒)
离线收益比例: 50% + 20%(道具) = 70%

离线收益 = 500 × 28800 × 0.7 = 10,080,000金币
```

#### 示例3: 达到上限
```
玩家DPS: 1000金币/秒
离线时长: 48小时(超过24小时上限)
实际计算时长: 24小时(86400秒)
离线收益比例: 80%

离线收益 = 1000 × 86400 × 0.8 = 69,120,000金币
```

### 4.4 离线收益展示设计

#### 4.4.1 展示时机
- 玩家打开游戏时自动弹出
- 离线时长≥60秒时才展示
- 展示在游戏主界面中央

#### 4.4.2 展示内容
```
┌─────────────────────────────┐
│      欢迎回来,冒险者!        │
│                             │
│   离线时长: 8小时32分        │
│                             │
│   离线收益:                  │
│   +10,080,000 金币          │
│                             │
│   [点击领取]                 │
└─────────────────────────────┘
```

#### 4.4.3 领取动画
- 金币飞入动画: 从中央向金币显示区域飞入
- 数字滚动动画: 金币数字快速滚动增加
- 音效: 金币掉落音效
- 持续时间: 1.5秒

### 4.5 离线收益道具设计

#### 4.5.1 永久提升道具
| 道具ID | 道具名称 | 效果 | 价格 |
|--------|---------|------|------|
| item_perm_offline_1 | 离线收益+10% | 永久提升10%离线收益 | 100,000金币 |
| item_perm_offline_2 | 离线收益+20% | 永久提升20%离线收益 | 500,000金币 |
| item_perm_offline_3 | 离线收益+30% | 永久提升30%离线收益 | 2,000,000金币 |

#### 4.5.2 限时增益道具
| 道具ID | 道具名称 | 效果 | 持续时间 | 价格 |
|--------|---------|------|---------|------|
| item_buff_offline_1 | 离线收益药水(小) | 临时+20%离线收益 | 24小时 | 10,000金币 |
| item_buff_offline_2 | 离线收益药水(中) | 临时+30%离线收益 | 48小时 | 50,000金币 |
| item_buff_offline_3 | 离线收益药水(大) | 临时+50%离线收益 | 72小时 | 200,000金币 |

---

## 五、排行榜系统设计

### 5.1 排行榜类型

#### 5.1.1 总金币排行榜
- **排名依据**: 累计获得金币总数
- **数据来源**: `totalGoldEarned`
- **更新频率**: 实时更新
- **显示数量**: 前100名

#### 5.1.2 DPS排行榜
- **排名依据**: 当前每秒金币产出(DPS)
- **数据来源**: `currentDPS`
- **更新频率**: 实时更新
- **显示数量**: 前100名

#### 5.1.3 游戏时长排行榜
- **排名依据**: 累计游戏时长
- **数据来源**: `totalPlayTime`
- **更新频率**: 实时更新
- **显示数量**: 前100名

#### 5.1.4 成就排行榜
- **排名依据**: 累计解锁成就数量
- **数据来源**: `totalAchievementsUnlocked`
- **更新频率**: 实时更新
- **显示数量**: 前100名

### 5.2 排名规则

#### 5.2.1 排名计算
```
排名 = 根据排名依据数值降序排列
```

#### 5.2.2 同分处理规则
当多个玩家排名依据相同时:
1. **优先级1**: 达到该数值的时间(越早排名越高)
2. **优先级2**: 累计游戏时长(越长排名越高)
3. **优先级3**: 玩家ID(字典序)

#### 5.2.3 排名更新机制
- **触发时机**: 玩家数据变化时
- **更新方式**: 增量更新,只更新变化部分
- **缓存机制**: 排行榜数据缓存5分钟
- **刷新限制**: 玩家手动刷新间隔≥10秒

### 5.3 排行榜数据结构

#### 5.3.1 排行榜条目数据
```json
{
  "rank": "number",
  "playerId": "string",
  "playerName": "string",
  "score": "number",
  "achieveTime": "number",
  "playTime": "number",
  "isSelf": "boolean"
}
```

**字段说明**:
- `rank`: 排名
- `playerId`: 玩家ID
- `playerName`: 玩家昵称
- `score`: 排名依据数值
- `achieveTime`: 达到该数值的时间戳
- `playTime`: 游戏时长(秒)
- `isSelf`: 是否是当前玩家

#### 5.3.2 排行榜完整数据
```json
{
  "leaderboardType": "string",
  "updateTime": "number",
  "totalPlayers": "number",
  "myRank": "number",
  "myScore": "number",
  "rankings": [
    "LeaderboardEntry"
  ]
}
```

### 5.4 排行榜展示设计

#### 5.4.1 界面布局
```
┌─────────────────────────────────────┐
│          排行榜                      │
│  [总金币] [DPS] [时长] [成就]        │
├─────────────────────────────────────┤
│  排名  玩家名称          数值        │
│  ─────────────────────────────────  │
│  🥇1   冒险者123        1.2B        │
│  🥈2   点击达人         980M        │
│  🥉3   金币大师         850M        │
│   4    新手玩家         720M        │
│   5    快乐点击         650M        │
│  ─────────────────────────────────  │
│  ...                                │
│  ─────────────────────────────────  │
│  125  我(冒险者456)     50M         │
│                                     │
│  [刷新] [关闭]                       │
└─────────────────────────────────────┘
```

#### 5.4.2 展示规则
- **前3名**: 显示奖牌图标(金银铜)
- **当前玩家**: 高亮显示,固定在底部
- **分页显示**: 每页显示20名
- **滚动加载**: 向下滚动自动加载更多

#### 5.4.3 数值显示格式
| 数值范围 | 显示格式 | 示例 |
|---------|---------|------|
| < 1,000 | 原始数值 | 999 |
| 1,000 - 999,999 | K格式 | 1.5K, 999K |
| 1,000,000 - 999,999,999 | M格式 | 1.5M, 999M |
| 1,000,000,000+ | B格式 | 1.5B, 999B |
| 1,000,000,000,000+ | T格式 | 1.5T |

### 5.5 排行榜奖励机制

#### 5.5.1 周榜奖励
| 排名 | 奖励 |
|------|------|
| 第1名 | 1,000,000金币 + 传说道具×1 |
| 第2名 | 500,000金币 + 史诗道具×1 |
| 第3名 | 300,000金币 + 稀有道具×1 |
| 4-10名 | 100,000金币 |
| 11-50名 | 50,000金币 |
| 51-100名 | 10,000金币 |

#### 5.5.2 奖励发放
- **发放时间**: 每周一0:00
- **发放方式**: 邮件发送
- **领取期限**: 7天
- **未领取处理**: 自动删除

---

## 六、数据安全设计

### 6.1 数据加密方案

#### 6.1.1 加密算法选择
- **算法**: AES-256-GCM
- **密钥管理**: 基于玩家ID生成唯一密钥
- **加密范围**: 敏感数据(金币、道具等)

#### 6.1.2 加密流程
```
原始数据
    ↓
JSON序列化
    ↓
生成加密密钥(基于playerId)
    ↓
AES-256-GCM加密
    ↓
Base64编码
    ↓
加密数据
```

#### 6.1.3 加密示例
```javascript
// 加密前
{
  "currentGold": 1000000,
  "totalGoldEarned": 5000000
}

// 加密后
{
  "encrypted": "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y=",
  "iv": "base64编码的初始向量",
  "tag": "认证标签"
}
```

### 6.2 数据验证机制

#### 6.2.1 校验和验证
```
校验和 = SHA256(JSON.stringify(data))
```

**验证流程**:
1. 存档时计算校验和并保存
2. 读档时重新计算校验和
3. 比对两个校验和
4. 不一致则数据可能被篡改

#### 6.2.2 数据完整性验证
检查项:
- [ ] 所有必要字段是否存在
- [ ] 数据类型是否正确
- [ ] 数值范围是否合理
- [ ] 逻辑关系是否正确(如: currentGold ≤ totalGoldEarned)

#### 6.2.3 异常数据检测
检测规则:
| 检测项 | 规则 | 处理方式 |
|--------|------|---------|
| 金币异常增长 | 单次增长>10倍当前金币 | 标记可疑,记录日志 |
| 负数数值 | 任何数值<0 | 重置为0 |
| 超大数值 | 超过Number.MAX_SAFE_INTEGER | 设置上限 |
| 时间异常 | 未来时间或负数时间 | 使用当前时间 |

### 6.3 防作弊机制

#### 6.3.1 时间戳验证
```
验证规则:
1. 最后存档时间 ≤ 当前时间
2. 游戏时长 ≤ 账号创建至今的总时长
3. 离线时长 ≤ 账号创建至今的总时长
```

#### 6.3.2 数据签名验证
```
签名算法:
signature = HMAC-SHA256(data, secretKey)

验证流程:
1. 存档时生成签名
2. 读档时验证签名
3. 签名不匹配则拒绝加载
```

#### 6.3.3 异常行为检测
检测维度:
- **点击频率**: 超过人类极限(>20次/秒)
- **金币增长速度**: 超过理论最大值
- **道具获取速度**: 短时间内大量获取
- **成就解锁速度**: 短时间内大量解锁

处理方式:
1. 记录异常日志
2. 标记可疑账号
3. 限制部分功能
4. 人工审核确认

### 6.4 数据备份机制

#### 6.4.1 本地备份
- **备份时机**: 每次存档前
- **备份数量**: 保留最近3个存档
- **备份命名**: `clicker_quest_save_backup_[timestamp]`
- **恢复机制**: 主存档损坏时自动恢复

#### 6.4.2 云备份(后续版本)
- **触发时机**: 玩家手动触发或每日自动
- **存储位置**: 云端服务器
- **同步机制**: 本地与云端数据合并
- **冲突处理**: 以最新时间戳为准

---

## 七、接口定义

### 7.1 存档系统接口

#### 7.1.1 保存游戏数据
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

function saveGameData(request: SaveGameDataRequest): SaveGameDataResponse
```

#### 7.1.2 加载游戏数据
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

function loadGameData(request: LoadGameDataRequest): LoadGameDataResponse
```

#### 7.1.3 删除游戏数据
```typescript
interface DeleteGameDataRequest {
  playerId: string;
  confirmDelete: boolean;
}

interface DeleteGameDataResponse {
  success: boolean;
  deleteTime: number;
  error?: string;
}

function deleteGameData(request: DeleteGameDataRequest): DeleteGameDataResponse
```

#### 7.1.4 计算离线收益
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

function calculateOfflineReward(request: CalculateOfflineRewardRequest): CalculateOfflineRewardResponse
```

### 7.2 排行榜系统接口

#### 7.2.1 获取排行榜数据
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

function getLeaderboard(request: GetLeaderboardRequest): GetLeaderboardResponse
```

#### 7.2.2 更新排行榜数据
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

function updateLeaderboard(request: UpdateLeaderboardRequest): UpdateLeaderboardResponse
```

#### 7.2.3 获取玩家排名
```typescript
interface GetPlayerRankRequest {
  playerId: string;
  leaderboardType: string;
}

interface GetPlayerRankResponse {
  success: boolean;
  rank?: number;
  score?: number;
  error?: string;
}

function getPlayerRank(request: GetPlayerRankRequest): GetPlayerRankResponse
```

### 7.3 数据安全接口

#### 7.3.1 加密数据
```typescript
interface EncryptDataRequest {
  data: any;
  playerId: string;
}

interface EncryptDataResponse {
  encrypted: string;
  iv: string;
  tag: string;
}

function encryptData(request: EncryptDataRequest): EncryptDataResponse
```

#### 7.3.2 解密数据
```typescript
interface DecryptDataRequest {
  encrypted: string;
  iv: string;
  tag: string;
  playerId: string;
}

interface DecryptDataResponse {
  data: any;
  success: boolean;
  error?: string;
}

function decryptData(request: DecryptDataRequest): DecryptDataResponse
```

#### 7.3.3 验证数据完整性
```typescript
interface ValidateDataRequest {
  data: GameData;
  checksum: string;
}

interface ValidateDataResponse {
  isValid: boolean;
  errors: string[];
}

function validateData(request: ValidateDataRequest): ValidateDataResponse
```

---

## 八、性能优化建议

### 8.1 存档性能优化
- 使用增量存档减少数据量
- 异步存档避免阻塞主线程
- 数据压缩减少存储空间
- 防抖机制避免频繁存档

### 8.2 排行榜性能优化
- 排行榜数据缓存5分钟
- 增量更新避免全量计算
- 分页加载减少数据传输
- 索引优化查询速度

### 8.3 数据验证优化
- 只在关键时刻验证(读档、关键操作)
- 异步验证不阻塞主流程
- 缓存验证结果避免重复验证

---

## 九、测试验收标准

### 9.1 存档系统测试

#### 9.1.1 功能测试
- [ ] 定时自动存档正常工作
- [ ] 关键操作触发存档
- [ ] 游戏关闭时存档成功
- [ ] 离线收益正确计算
- [ ] 存档数据完整加载

#### 9.1.2 异常测试
- [ ] LocalStorage已满时处理正确
- [ ] 存档损坏时恢复机制有效
- [ ] 网络异常时不影响本地存档
- [ ] 并发存档不会数据错乱

#### 9.1.3 性能测试
- [ ] 存档操作耗时<100ms
- [ ] 存档不影响游戏帧率
- [ ] 大数据量存档正常工作

### 9.2 排行榜系统测试

#### 9.2.1 功能测试
- [ ] 排名计算正确
- [ ] 同分排名规则正确
- [ ] 排行榜实时更新
- [ ] 玩家排名显示正确

#### 9.2.2 性能测试
- [ ] 排行榜加载时间<1秒
- [ ] 排名更新响应时间<500ms
- [ ] 大量玩家时性能稳定

### 9.3 数据安全测试

#### 9.3.1 加密测试
- [ ] 数据加密正确
- [ ] 数据解密正确
- [ ] 密钥管理安全

#### 9.3.2 验证测试
- [ ] 校验和验证有效
- [ ] 数据篡改检测有效
- [ ] 异常数据检测有效

#### 9.3.3 防作弊测试
- [ ] 时间戳验证有效
- [ ] 签名验证有效
- [ ] 异常行为检测有效

---

## 十、风险与应对

### 10.1 数据丢失风险
**风险等级**: 高
**风险描述**: LocalStorage容量限制或浏览器清理导致数据丢失
**应对措施**:
- 数据压缩减少存储空间
- 多备份机制保留多个存档
- 提示玩家导出存档
- 后续版本支持云存档

### 10.2 数据篡改风险
**风险等级**: 中
**风险描述**: 玩家通过修改LocalStorage作弊
**应对措施**:
- 数据加密防止直接修改
- 签名验证检测篡改
- 异常数据检测识别作弊
- 服务端验证(后续版本)

### 10.3 性能风险
**风险等级**: 中
**风险描述**: 频繁存档影响游戏性能
**应对措施**:
- 异步存档避免阻塞
- 增量存档减少数据量
- 防抖机制控制频率
- 性能监控和优化

### 10.4 排行榜作弊风险
**风险等级**: 中
**风险描述**: 玩家通过作弊提升排名
**应对措施**:
- 数据验证机制
- 异常行为检测
- 人工审核机制
- 排行榜奖励延迟发放

---

## 十一、后续迭代计划

### 11.1 v1.1版本计划
- 云存档功能
- 多设备同步
- 存档导出导入
- 排行榜赛季机制

### 11.2 v1.2版本计划
- 存档加密升级
- 防作弊系统升级
- 排行榜社交功能
- 好友排行榜

### 11.3 v2.0版本计划
- 服务端存档
- 跨平台同步
- 排行榜直播
- 电竞赛事支持

---

**文档状态**: 已完成
**审核状态**: 待审核
**下一步**: 提交程序团队评审
