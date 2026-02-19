# Clicker Quest - 游戏文案设计文档

**文档编号**: ND-游戏文案-v1.0-20260220
**策划角色**: 文案策划(ND-1)
**负责模块**: 游戏文案
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、文档概述

本文档定义了Clicker Quest游戏的所有文案内容，包括按钮文案、提示文字和反馈语。文案设计遵循"简洁、友好、清晰"的原则，确保玩家能够快速理解游戏信息，享受流畅的游戏体验。

### 文案设计原则

1. **简洁明了**: 按钮文案2-4字，描述文案10-30字
2. **友好亲切**: 使用"你"而非"您"，语气积极正面
3. **统一规范**: 用词、格式、标点保持一致
4. **易于理解**: 避免专业术语，使用通俗表达

### 用词规范

- **金币**: 统一使用"金币"，不使用"钱"、"货币"
- **购买**: 统一使用"购买"，不使用"买"、"购入"
- **升级**: 统一使用"升级"，不使用"提升"、"强化"
- **领取**: 统一使用"领取"，不使用"获取"、"领取"

### 格式规范

- **数字格式**: 使用阿拉伯数字（如: 1000）
- **单位格式**: 统一使用中文单位（如: 金币、秒、小时）
- **标点符号**: 使用中文标点符号
- **空格规范**: 中英文之间加空格

---

## 二、按钮文案表

### 2.1 导航按钮

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_btn_nav_001 | 主页 | Home | 主导航栏 | 返回主页 |
| text_btn_nav_002 | 商店 | Shop | 主导航栏 | 进入商店 |
| text_btn_nav_003 | 成就 | Achievements | 主导航栏 | 查看成就 |
| text_btn_nav_004 | 排行榜 | Leaderboard | 主导航栏 | 查看排行榜 |
| text_btn_nav_005 | 设置 | Settings | 主导航栏 | 打开设置 |

### 2.2 操作按钮

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_btn_op_001 | 购买 | Buy | 商店道具卡片 | 购买道具 |
| text_btn_op_002 | 升级 | Upgrade | 道具升级 | 升级道具 |
| text_btn_op_003 | 领取 | Claim | 成就奖励 | 领取奖励 |
| text_btn_op_004 | 确认 | Confirm | 弹窗确认 | 确认操作 |
| text_btn_op_005 | 取消 | Cancel | 弹窗取消 | 取消操作 |
| text_btn_op_006 | 使用 | Use | 道具使用 | 使用道具 |
| text_btn_op_007 | 重置 | Reset | 设置界面 | 重置数据 |
| text_btn_op_008 | 返回 | Back | 二级界面 | 返回上一页 |
| text_btn_op_009 | 关闭 | Close | 弹窗关闭 | 关闭弹窗 |
| text_btn_op_010 | 分享 | Share | 分享功能 | 分享游戏 |

### 2.3 状态按钮

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_btn_status_001 | 已拥有 | Owned | 商店道具卡片 | 已购买的道具 |
| text_btn_status_002 | 金币不足 | Not Enough Gold | 商店道具卡片 | 金币不够购买 |
| text_btn_status_003 | 已领取 | Claimed | 成就奖励 | 已领取的奖励 |
| text_btn_status_004 | 已完成 | Completed | 成就列表 | 已完成的成就 |
| text_btn_status_005 | 已解锁 | Unlocked | 功能解锁 | 已解锁的功能 |
| text_btn_status_006 | 未解锁 | Locked | 功能锁定 | 未解锁的功能 |
| text_btn_status_007 | 进行中 | In Progress | 成就进度 | 正在进行的成就 |
| text_btn_status_008 | 已装备 | Equipped | 道具装备 | 已装备的道具 |

### 2.4 特殊按钮

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_btn_special_001 | 开始游戏 | Start Game | 主页界面 | 开始游戏 |
| text_btn_special_002 | 继续游戏 | Continue | 主页界面 | 继续上次游戏 |
| text_btn_special_003 | 新游戏 | New Game | 主页界面 | 开始新游戏 |
| text_btn_special_004 | 观看广告 | Watch Ad | 广告奖励 | 观看广告获取奖励 |
| text_btn_special_005 | 领取奖励 | Get Reward | 奖励弹窗 | 领取奖励 |
| text_btn_special_006 | 双倍奖励 | Double Reward | 广告奖励 | 观看广告双倍奖励 |

---

## 三、提示文字表

### 3.1 成功提示

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_tip_success_001 | 购买成功！ | Purchase successful! | 购买道具成功 | 简洁明了 |
| text_tip_success_002 | 升级成功！ | Upgrade successful! | 道具升级成功 | 简洁明了 |
| text_tip_success_003 | 领取成功！获得 {奖励} | Claimed! Got {reward} | 领取奖励成功 | 显示具体奖励 |
| text_tip_success_004 | 恭喜！解锁成就【{成就名称}】 | Congrats! Achievement unlocked: {name} | 成就解锁 | 显示成就名称 |
| text_tip_success_005 | 使用成功！ | Used successfully! | 道具使用成功 | 简洁明了 |
| text_tip_success_006 | 设置已保存！ | Settings saved! | 设置保存成功 | 简洁明了 |
| text_tip_success_007 | 分享成功！ | Shared successfully! | 分享成功 | 简洁明了 |
| text_tip_success_008 | 奖励已到账！ | Reward received! | 奖励发放成功 | 简洁明了 |

### 3.2 失败提示

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_tip_fail_001 | 金币不足！还需要 {差额} 金币 | Not enough gold! Need {amount} more | 金币不够购买 | 显示差额 |
| text_tip_fail_002 | 购买失败，请稍后重试 | Purchase failed, please try again | 购买失败 | 友好提示 |
| text_tip_fail_003 | 网络连接失败，请检查网络 | Network error, please check connection | 网络错误 | 明确原因 |
| text_tip_fail_004 | 操作失败，请重试 | Operation failed, please try again | 操作失败 | 友好提示 |
| text_tip_fail_005 | 道具数量不足！ | Not enough items! | 道具不够使用 | 简洁明了 |
| text_tip_fail_006 | 功能暂未开放 | Feature coming soon | 功能未开放 | 友好提示 |
| text_tip_fail_007 | 已达到上限！ | Reached the limit! | 达到上限 | 简洁明了 |
| text_tip_fail_008 | 操作过于频繁，请稍后再试 | Too many requests, please wait | 操作频繁 | 友好提示 |

### 3.3 确认提示

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_tip_confirm_001 | 确定花费 {价格} 金币购买 {道具名称} 吗？ | Spend {price} gold to buy {item}? | 购买确认 | 显示价格和道具 |
| text_tip_confirm_002 | 确定要重置游戏数据吗？此操作不可撤销！ | Reset game data? This cannot be undone! | 重置确认 | 强调不可撤销 |
| text_tip_confirm_003 | 确定要退出游戏吗？ | Are you sure you want to quit? | 退出确认 | 简洁明了 |
| text_tip_confirm_004 | 确定要使用 {道具名称} 吗？ | Use {item}? | 道具使用确认 | 显示道具名称 |
| text_tip_confirm_005 | 确定要升级 {道具名称} 吗？ | Upgrade {item}? | 道具升级确认 | 显示道具名称 |
| text_tip_confirm_006 | 确定要观看广告获取双倍奖励吗？ | Watch ad for double reward? | 广告确认 | 明确奖励 |

### 3.4 引导提示

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_tip_guide_001 | 点击屏幕中央的按钮获取金币 | Tap the center button to earn gold | 新手引导 | 引导点击 |
| text_tip_guide_002 | 金币足够时可以购买道具 | Buy items when you have enough gold | 商店引导 | 引导购买 |
| text_tip_guide_003 | 完成成就可以获得丰厚奖励 | Complete achievements for rewards | 成就引导 | 引导成就 |
| text_tip_guide_004 | 升级道具可以提升效果 | Upgrade items to boost effects | 升级引导 | 引导升级 |
| text_tip_guide_005 | 离线时自动点击器继续产出 | Auto clickers work while offline | 离线引导 | 引导离线 |
| text_tip_guide_006 | 观看广告可以获得额外奖励 | Watch ads for bonus rewards | 广告引导 | 引导广告 |
| text_tip_guide_007 | 暴击可以获得更多金币！ | Critical hits give more gold! | 暴击引导 | 引导暴击 |
| text_tip_guide_008 | 长按可以快速购买 | Long press for quick purchase | 快速购买引导 | 引导操作 |

### 3.5 信息提示

| 文案ID | 中文文案 | 英文文案 | 使用场景 | 备注 |
|--------|---------|---------|---------|------|
| text_tip_info_001 | 当前金币：{数量} | Current gold: {amount} | 金币显示 | 显示当前金币 |
| text_tip_info_002 | 每秒产出：{数量} 金币 | Gold per second: {amount} | 产出显示 | 显示每秒产出 |
| text_tip_info_003 | 离线收益：{数量} 金币 | Offline earnings: {amount} | 离线收益 | 显示离线收益 |
| text_tip_info_004 | 暴击倍率：{倍率}x | Critical multiplier: {mult}x | 暴击倍率 | 显示暴击倍率 |
| text_tip_info_005 | 暴击率：{百分比}% | Critical chance: {percent}% | 暴击率 | 显示暴击率 |
| text_tip_info_006 | 游戏时长：{时长} 小时 | Play time: {hours} hours | 游戏时长 | 显示游戏时长 |
| text_tip_info_007 | 总点击次数：{次数} | Total clicks: {count} | 点击次数 | 显示总点击次数 |
| text_tip_info_008 | 道具数量：{数量} | Items owned: {count} | 道具数量 | 显示道具数量 |

---

## 四、反馈语设计

### 4.1 点击反馈

| 文案ID | 中文文案 | 英文文案 | 触发条件 | 备注 |
|--------|---------|---------|---------|------|
| text_feedback_click_001 | +{数量} 金币 | +{amount} gold | 普通点击 | 显示获得金币 |
| text_feedback_click_002 | 暴击！+{数量} 金币 | Critical! +{amount} gold | 暴击点击 | 突出显示 |
| text_feedback_click_003 | 超级暴击！+{数量} 金币 | Super Critical! +{amount} gold | 超级暴击 | 强调效果 |
| text_feedback_click_004 | 连击 x{次数} | Combo x{count} | 连续点击 | 显示连击次数 |
| text_feedback_click_005 | 完美点击！ | Perfect! | 完美时机点击 | 特殊反馈 |

### 4.2 道具反馈

| 文案ID | 中文文案 | 英文文案 | 触发条件 | 备注 |
|--------|---------|---------|---------|------|
| text_feedback_item_001 | 金币翻倍中... {剩余时间}秒 | Gold doubled... {time}s left | 金币翻倍道具 | 显示剩余时间 |
| text_feedback_item_002 | 幸运药水生效中！暴击率 +{百分比}% | Lucky potion active! Crit +{percent}% | 幸运药水 | 显示效果 |
| text_feedback_item_003 | 时间加速中... 自动点击器效率 x{倍率} | Time warp... Auto clicker x{mult} | 时间加速 | 显示效果 |
| text_feedback_item_004 | 道具效果已叠加！ | Effect stacked! | 道具叠加 | 叠加提示 |
| text_feedback_item_005 | 道具效果已刷新！ | Effect refreshed! | 道具刷新 | 刷新提示 |

### 4.3 成就反馈

| 文案ID | 中文文案 | 英文文案 | 触发条件 | 备注 |
|--------|---------|---------|---------|------|
| text_feedback_achieve_001 | 成就进度：{当前}/{目标} | Progress: {current}/{target} | 成就进度更新 | 显示进度 |
| text_feedback_achieve_002 | 即将完成！还差 {数量} | Almost there! {amount} more | 接近完成 | 激励提示 |
| text_feedback_achieve_003 | 成就已解锁！点击领取奖励 | Achievement unlocked! Tap to claim | 成就解锁 | 引导领取 |
| text_feedback_achieve_004 | 恭喜完成所有成就！ | Congrats! All achievements completed! | 全部完成 | 特殊反馈 |
| text_feedback_achieve_005 | 新成就已解锁！ | New achievement available! | 新成就解锁 | 提示查看 |

### 4.4 系统反馈

| 文案ID | 中文文案 | 英文文案 | 触发条件 | 备注 |
|--------|---------|---------|---------|------|
| text_feedback_sys_001 | 欢迎回来！离线收益：{数量} 金币 | Welcome back! Offline: {amount} gold | 离线回归 | 显示离线收益 |
| text_feedback_sys_002 | 每日奖励已发放！ | Daily reward received! | 每日奖励 | 奖励提示 |
| text_feedback_sys_003 | 游戏数据已同步 | Game data synced | 数据同步 | 同步提示 |
| text_feedback_sys_004 | 新版本已更新！ | New version updated! | 版本更新 | 更新提示 |
| text_feedback_sys_005 | 活动已开启！ | Event started! | 活动开启 | 活动提示 |

### 4.5 错误反馈

| 文案ID | 中文文案 | 英文文案 | 触发条件 | 备注 |
|--------|---------|---------|---------|------|
| text_feedback_error_001 | 操作失败，请重试 | Failed, please try again | 操作失败 | 友好提示 |
| text_feedback_error_002 | 网络连接中断 | Connection lost | 网络中断 | 明确原因 |
| text_feedback_error_003 | 数据加载失败 | Data load failed | 加载失败 | 友好提示 |
| text_feedback_error_004 | 功能暂时不可用 | Feature temporarily unavailable | 功能不可用 | 友好提示 |
| text_feedback_error_005 | 请稍后再试 | Please try again later | 通用错误 | 友好提示 |

---

## 五、道具描述文案

### 5.1 自动点击器描述

| 道具ID | 道具名称 | 中文描述 | 英文描述 | 备注 |
|--------|---------|---------|---------|------|
| item_auto_001 | 初级自动点击器 | 每秒自动获得 1 金币 | Automatically earns 1 gold per second | 基础道具 |
| item_auto_002 | 中级自动点击器 | 每秒自动获得 5 金币 | Automatically earns 5 gold per second | 进阶道具 |
| item_auto_003 | 高级自动点击器 | 每秒自动获得 25 金币 | Automatically earns 25 gold per second | 高级道具 |
| item_auto_004 | 顶级自动点击器 | 每秒自动获得 100 金币 | Automatically earns 100 gold per second | 顶级道具 |

### 5.2 增益道具描述

| 道具ID | 道具名称 | 中文描述 | 英文描述 | 备注 |
|--------|---------|---------|---------|------|
| item_buff_gold_30 | 金币翻倍(30秒) | 30 秒内金币获取翻倍 | Double gold earnings for 30 seconds | 短时增益 |
| item_buff_gold_60 | 金币翻倍(60秒) | 60 秒内金币获取翻倍 | Double gold earnings for 60 seconds | 中时增益 |
| item_buff_gold_120 | 金币翻倍(120秒) | 120 秒内金币获取翻倍 | Double gold earnings for 120 seconds | 长时增益 |
| item_buff_luck_60 | 幸运药水(60秒) | 60 秒内暴击率提升 20% | +20% critical chance for 60 seconds | 暴击增益 |
| item_buff_luck_120 | 幸运药水(120秒) | 120 秒内暴击率提升 20% | +20% critical chance for 120 seconds | 暴击增益 |
| item_buff_time_60 | 时间加速(60秒) | 60 秒内自动点击器效率翻倍 | Double auto clicker speed for 60 seconds | 效率增益 |
| item_buff_time_120 | 时间加速(120秒) | 120 秒内自动点击器效率翻倍 | Double auto clicker speed for 120 seconds | 效率增益 |

### 5.3 特殊道具描述

| 道具ID | 道具名称 | 中文描述 | 英文描述 | 备注 |
|--------|---------|---------|---------|------|
| item_perm_offline | 离线收益提升 | 离线收益比例永久提升 10% | +10% permanent offline earnings | 永久道具 |
| item_perm_crit | 暴击倍率提升 | 暴击倍率永久提升 1 倍 | +1x permanent critical multiplier | 永久道具 |
| item_perm_gold | 金币加成 | 金币获取永久提升 5% | +5% permanent gold earnings | 永久道具 |

---

## 六、成就文案

### 6.1 点击次数成就

| 成就ID | 成就名称 | 中文描述 | 英文描述 | 奖励文案 |
|--------|---------|---------|---------|---------|
| achievement_click_001 | 初级点击者 | 累计点击 100 次 | Click 100 times | 奖励: 100 金币 |
| achievement_click_002 | 中级点击者 | 累计点击 1,000 次 | Click 1,000 times | 奖励: 500 金币 |
| achievement_click_003 | 高级点击者 | 累计点击 10,000 次 | Click 10,000 times | 奖励: 2,000 金币 |
| achievement_click_004 | 大师点击者 | 累计点击 100,000 次 | Click 100,000 times | 奖励: 10,000 金币 |
| achievement_click_005 | 传奇点击者 | 累计点击 1,000,000 次 | Click 1,000,000 times | 奖励: 100,000 金币 |

### 6.2 金币成就

| 成就ID | 成就名称 | 中文描述 | 英文描述 | 奖励文案 |
|--------|---------|---------|---------|---------|
| achievement_gold_001 | 小富翁 | 累计获得 1,000 金币 | Earn 1,000 gold total | 奖励: 金币翻倍(30秒) x1 |
| achievement_gold_002 | 中富翁 | 累计获得 10,000 金币 | Earn 10,000 gold total | 奖励: 金币翻倍(60秒) x1 |
| achievement_gold_003 | 大富翁 | 累计获得 100,000 金币 | Earn 100,000 gold total | 奖励: 金币翻倍(120秒) x1 |
| achievement_gold_004 | 超级富翁 | 累计获得 1,000,000 金币 | Earn 1,000,000 gold total | 奖励: 幸运药水(120秒) x3 |
| achievement_gold_005 | 终极富翁 | 累计获得 10,000,000 金币 | Earn 10,000,000 gold total | 奖励: 离线收益提升 x1 |

### 6.3 道具成就

| 成就ID | 成就名称 | 中文描述 | 英文描述 | 奖励文案 |
|--------|---------|---------|---------|---------|
| achievement_item_001 | 收藏家 | 购买 10 个道具 | Buy 10 items | 奖励: 1,000 金币 |
| achievement_item_002 | 大收藏家 | 购买 50 个道具 | Buy 50 items | 奖励: 5,000 金币 |
| achievement_item_003 | 超级收藏家 | 购买 100 个道具 | Buy 100 items | 奖励: 20,000 金币 |
| achievement_item_004 | 道具大师 | 购买 500 个道具 | Buy 500 items | 奖励: 暴击倍率提升 x1 |

### 6.4 时间成就

| 成就ID | 成就名称 | 中文描述 | 英文描述 | 奖励文案 |
|--------|---------|---------|---------|---------|
| achievement_time_001 | 新手玩家 | 游戏时长达到 1 小时 | Play for 1 hour | 奖励: 500 金币 |
| achievement_time_002 | 资深玩家 | 游戏时长达到 10 小时 | Play for 10 hours | 奖励: 5,000 金币 |
| achievement_time_003 | 老玩家 | 游戏时长达到 100 小时 | Play for 100 hours | 奖励: 50,000 金币 |
| achievement_time_004 | 骨灰玩家 | 游戏时长达到 1,000 小时 | Play for 1,000 hours | 奖励: 金币加成 x1 |

### 6.5 特殊成就

| 成就ID | 成就名称 | 中文描述 | 英文描述 | 奖励文案 |
|--------|---------|---------|---------|---------|
| achievement_special_001 | 暴击大师 | 累计暴击 100 次 | Get 100 critical hits | 奖励: 幸运药水(60秒) x5 |
| achievement_special_002 | 幸运儿 | 单次暴击获得 100 倍金币 | Get 100x gold from one critical hit | 奖励: 50,000 金币 |
| achievement_special_003 | 完美主义者 | 解锁所有其他成就 | Unlock all other achievements | 奖励: "完美主义者"称号 |

---

## 七、文案风格指南

### 7.1 语气风格

- **亲切友好**: 使用"你"而非"您"，拉近与玩家的距离
- **积极正面**: 使用积极的词汇，传递正能量
- **简洁有力**: 避免冗长表达，直击要点
- **统一口吻**: 保持一致的语气，避免风格跳跃

### 7.2 情感表达

- **成功时**: 使用感叹号，传递喜悦（如："购买成功！"）
- **失败时**: 使用友好语气，避免责备（如："请稍后重试"）
- **引导时**: 使用祈使句，清晰明确（如："点击按钮获取金币"）
- **奖励时**: 突出奖励内容，激发期待（如："获得 1000 金币！"）

### 7.3 数字表达

- **小数字**: 直接显示（如："5 金币"）
- **大数字**: 使用千位分隔符（如："1,000 金币"）
- **百分比**: 使用整数百分比（如："提升 20%"）
- **时间**: 使用秒/小时单位（如："60 秒"、"1 小时"）

### 7.4 特殊情况处理

- **变量占位符**: 使用 `{变量名}` 格式（如："{数量} 金币"）
- **多语言支持**: 所有文案提供中英文双语版本
- **长度限制**: 按钮文案不超过 4 字，提示文案不超过 20 字
- **避免歧义**: 使用明确表达，避免模糊词汇

---

## 八、文案审核清单

### 8.1 内容审核

- [ ] 文案内容准确无误
- [ ] 文案表达清晰易懂
- [ ] 文案没有歧义
- [ ] 文案符合游戏风格

### 8.2 格式审核

- [ ] 文案长度符合要求
- [ ] 标点符号使用正确
- [ ] 数字格式统一
- [ ] 中英文格式正确

### 8.3 风格审核

- [ ] 语气风格统一
- [ ] 用词规范统一
- [ ] 情感表达恰当
- [ ] 符合目标玩家群体

### 8.4 技术审核

- [ ] 变量占位符正确
- [ ] 多语言版本完整
- [ ] 文案ID唯一
- [ ] 文案可动态替换

---

## 九、验收标准

### 9.1 文档完整性

- [x] 按钮文案表完整
- [x] 提示文字表完整
- [x] 反馈语设计完整
- [x] 道具描述完整
- [x] 成就文案完整
- [x] 文案风格指南完整

### 9.2 文案质量

- [x] 按钮文案简洁明了
- [x] 提示文字友好亲切
- [x] 反馈语及时准确
- [x] 道具描述清晰准确
- [x] 成就文案有吸引力

### 9.3 风格统一

- [x] 语气风格统一
- [x] 用词规范统一
- [x] 格式规范统一
- [x] 情感表达统一

### 9.4 可实现性

- [x] 文案ID规范
- [x] 变量占位符规范
- [x] 多语言版本完整
- [x] 文案可动态配置

---

## 十、后续优化建议

### 10.1 短期优化

1. **收集玩家反馈**: 通过数据分析了解玩家对文案的理解程度
2. **A/B测试**: 对关键文案进行A/B测试，优化表达方式
3. **本地化支持**: 根据玩家地区提供更多语言版本

### 10.2 长期优化

1. **动态文案系统**: 根据玩家行为动态调整文案内容
2. **个性化文案**: 根据玩家偏好提供个性化文案
3. **情感化设计**: 增强文案的情感表达，提升玩家体验

---

**文档状态**: 已完成
**下一步**: 与UI策划协作，确保文案在界面中的展示效果
