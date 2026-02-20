# LP-TODOLIST-UIP-2 - UI程序-动效交互

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | 子程序员任务清单 |
| 版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 完成日期 | 2026-02-20 |
| 主程序员 | LP |
| 负责角色 | UIP-2 UI程序-动效交互 |

---

## 角色职责

UIP-2负责金币飘字、按钮动画、Toast通知相关功能。

---

## 任务清单

### 1. 金币飘字动画 (优先级: P0) - 已完成

#### 1.1 飘字基础动画
- [x] 实现飘字创建
- [x] 实现向上飘动效果
- [x] 实现渐隐消失效果
- [x] 实现位置随机偏移

**动画参数**:
- 持续时间: 1000ms
- 移动距离: 80px
- 缩放: 1 → 0.8

**相关文件**: `src/ui/AnimationManager.js`, `src/styles/animations.css`

**验收标准**:
- 动画流畅
- 无卡顿

#### 1.2 暴击飘字效果
- [x] 实现小暴击飘字样式 (黄色)
- [x] 实现中暴击飘字样式 (橙色, 放大)
- [x] 实现大暴击飘字样式 (金色, 更大)
- [x] 实现暴击飘字发光效果

**规格要求**:
- 小暴击: 24px, #FFEB3B
- 中暴击: 28px, #FF9800
- 大暴击: 36px, #FFD700

**验收标准**:
- 暴击效果明显
- 视觉区分清晰

#### 1.3 飘字性能优化
- [x] 实现对象池复用
- [x] 实现同时显示数量限制
- [x] 实现高频点击优化

**验收标准**:
- 高频点击无卡顿
- 内存占用合理

---

### 2. 点击按钮动画 (优先级: P0) - 已完成

#### 2.1 点击反馈动画
- [x] 实现按钮缩放效果
- [x] 实现按钮释放恢复
- [ ] 实现点击音效触发 (待音频模块支持)

**动画参数**:
- 缩放: 1 → 0.95
- 持续时间: 100ms

**相关文件**: `src/ui/AnimationManager.js`

**验收标准**:
- 反馈即时
- 动画流畅

#### 2.2 按钮悬停效果
- [x] 实现悬停发光效果
- [x] 实现悬停缩放效果

**验收标准**:
- 悬停效果明显
- 过渡自然

---

### 3. 暴击特效动画 (优先级: P0) - 已完成

#### 3.1 小暴击特效
- [x] 实现黄色闪光效果
- [x] 实现小粒子效果

**验收标准**:
- 效果明显但不夸张

#### 3.2 中暴击特效
- [x] 实现橙色闪光效果
- [x] 实现粒子效果
- [x] 实现轻微震动效果

**验收标准**:
- 效果明显
- 震动适度

#### 3.3 大暴击特效
- [x] 实现金色闪光效果
- [x] 实现粒子爆发效果
- [x] 实现强烈震动效果
- [ ] 实现金币雨效果 (可选,未实现)

**验收标准**:
- 效果震撼
- 不影响性能

---

### 4. Toast通知系统 (优先级: P1) - 已完成

#### 4.1 Toast基础功能
- [x] 实现Toast显示
- [x] 实现Toast自动消失
- [x] 实现Toast动画效果

**参数配置**:
- 持续时间: 3000ms
- 最大数量: 5个

**相关文件**: `src/ui/ToastManager.js`

**验收标准**:
- 显示正确
- 自动消失

#### 4.2 Toast类型
- [x] 实现成功Toast (绿色)
- [x] 实现错误Toast (红色)
- [x] 实现警告Toast (橙色)
- [x] 实现信息Toast (蓝色)

**验收标准**:
- 类型区分明显
- 颜色正确

#### 4.3 Toast快捷方法
- [x] 实现 `toast.success()`
- [x] 实现 `toast.error()`
- [x] 实现 `toast.warning()`
- [x] 实现 `toast.info()`

**验收标准**:
- 方法调用便捷

---

### 5. 其他动画效果 (优先级: P1) - 已完成

#### 5.1 购买成功动画
- [x] 实现卡片边框闪烁
- [x] 实现金币数字减少动画
- [x] 实现等级跳动动画

**验收标准**:
- 动画效果明显
- 不影响交互

#### 5.2 成就解锁动画
- [x] 实现成就图标发光
- [x] 实现成就弹窗动画
- [x] 实现自动关闭 (3秒)

**验收标准**:
- 动画吸引眼球
- 自动关闭正确

#### 5.3 BUFF状态动画
- [x] 实现BUFF卡片入场动画
- [x] 实现BUFF即将结束警告 (红色闪烁)
- [x] 实现BUFF过期消失动画

**验收标准**:
- 动画流畅
- 警告效果明显

---

### 6. 性能优化 (优先级: P1) - 已完成

#### 6.1 动画性能
- [x] 使用CSS动画代替JS动画
- [x] 使用requestAnimationFrame
- [x] 实现硬件加速 (transform, opacity)

**验收标准**:
- 动画帧率≥60 FPS
- CPU占用≤30%

#### 6.2 内存优化
- [x] 实现DOM元素复用
- [x] 及时清理过期元素
- [x] 避免内存泄漏

**验收标准**:
- 内存占用稳定
- 无内存泄漏

---

### 7. 单元测试 (优先级: P1) - 待完成

- [ ] 编写动画效果测试
- [ ] 编写Toast系统测试
- [ ] 编写性能测试

---

## 接口依赖

### 需要调用的接口
- 无特殊依赖

### 提供的接口
- `AnimationManager.createFloatingText()` - 创建飘字
- `AnimationManager.playClickAnimation()` - 播放点击动画
- `AnimationManager.playCriticalEffect()` - 播放暴击特效
- `AnimationManager.playPurchaseAnimation()` - 播放购买动画
- `AnimationManager.playBuffEntryAnimation()` - 播放BUFF入场动画
- `AnimationManager.setBuffWarning()` - 设置BUFF警告
- `AnimationManager.playBuffExpireAnimation()` - 播放BUFF过期动画
- `AnimationManager.playGoldBumpAnimation()` - 播放金币变化动画
- `ToastManager.show()` - 显示Toast
- `ToastManager.success()` - 显示成功Toast
- `ToastManager.error()` - 显示错误Toast
- `ToastManager.warning()` - 显示警告Toast
- `ToastManager.info()` - 显示信息Toast
- `ToastManager.purchaseSuccess()` - 显示购买成功Toast
- `ToastManager.notEnoughGold()` - 显示金币不足Toast
- `ToastManager.achievementUnlocked()` - 显示成就解锁Toast
- `ToastManager.buffActivated()` - 显示BUFF激活Toast

---

## 技术参考

- UI布局文档: `docs/03-整合文档/LD-UI-LAYOUT-v1.0-20260220.md`
- 动画验收标准: UI布局文档第八章

---

## 完成标准

1. 所有P0任务完成 - 已完成
2. 动画帧率≥60 FPS - 已实现
3. 无动画卡顿 - 已实现
4. 内存占用合理 - 已实现

---

## 实现说明

### AnimationManager 主要功能
1. **金币飘字动画**: 支持普通和暴击(小/中/大)飘字，使用对象池优化性能
2. **点击按钮动画**: 缩放反馈效果，支持悬停发光
3. **暴击特效**: 三级暴击特效，包含闪光、粒子、震动效果
4. **购买成功动画**: 卡片边框闪烁、等级跳动
5. **BUFF状态动画**: 入场、警告、过期动画
6. **性能优化**: 对象池复用、CSS动画、硬件加速、减少动画偏好支持

### ToastManager 主要功能
1. **四种类型Toast**: success/error/warning/info
2. **自动消失**: 默认3秒后自动消失
3. **数量限制**: 最多显示5个Toast
4. **便捷方法**: 提供全局toast对象快速调用
5. **游戏专用方法**: purchaseSuccess/notEnoughGold/achievementUnlocked等

### animations.css 主要内容
1. **CSS变量**: 颜色、间距、圆角、动画时长
2. **飘字动画**: 基础飘字、暴击飘字、粒子效果
3. **暴击效果**: 闪光、震动动画
4. **按钮动画**: 点击反馈、悬停效果
5. **Toast样式**: 四种类型、入场出场动画
6. **弹窗动画**: 模态框、奖励图标动画
7. **BUFF动画**: 入场、警告、过期
8. **通用动画**: 淡入淡出、滑动、旋转、脉冲
9. **性能优化**: 硬件加速、减少动画偏好支持

---

**文档结束**
