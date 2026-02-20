# Clicker Quest - 主界面UI设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | UI设计文档 |
| 文档版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 负责人 | UID-1 (UI策划-主界面) |
| 审核人 | LD (主策划) |

---

## 1. 界面布局设计

### 1.1 整体布局结构

```
+----------------------------------------------------------+
|  [设置]        Clicker Quest           [排行榜]          |  <- 状态栏 (8%)
+----------------------------------------------------------+
|                                                          |
|              [金币图标] 1,234,567 金币                    |  <- 金币显示区 (12%)
|              每秒产出: +123.45 金币/秒                    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|                                                          |
|                                                          |
|                       +--------+                         |
|                       |        |                         |
|                       | 点击我 |                         |
|                       |   [?]  |                         |
|                       +--------+                         |
|                                                          |
|                                                          |
|                     [金币飘字区域]                        |  <- 点击区域 (55%)
|                                                          |
|                                                          |
+----------------------------------------------------------+
|   [BUFF1] [BUFF2] [BUFF3] [BUFF4] ...                    |  <- BUFF状态栏 (10%)
+----------------------------------------------------------+
|   [商店]        [成就]        [道具]                      |  <- 底部导航 (15%)
+----------------------------------------------------------+
```

### 1.2 布局比例说明

| 区域 | 高度占比 | 说明 |
|------|---------|------|
| 状态栏 | 8% (约48px) | 固定高度，包含设置、标题、排行榜 |
| 金币显示区 | 12% (约72px) | 显示当前金币和DPS |
| 点击区域 | 55% (约330px) | 核心交互区域，包含点击按钮和飘字 |
| BUFF状态栏 | 10% (约60px) | 显示激活的道具效果 |
| 底部导航 | 15% (约90px) | 固定高度，三个导航按钮 |

### 1.3 安全区域

```
+----------------------------------------------------------+
|<-- 16px -->                                        <-- 16px -->|
|                                                          |
|                    内容安全区域                           |
|                                                          |
+----------------------------------------------------------+
```

- 页面左右边距: 16px
- 内容最大宽度: 600px (居中显示)
- 底部安全区域: 20px (适配刘海屏)

---

## 2. 状态栏设计 (UID-1-002)

### 2.1 布局结构

```
+----------------------------------------------------------+
|  [齿轮]    Clicker Quest              [奖杯]             |
|  24x24      20px Bold                24x24               |
+----------------------------------------------------------+
```

### 2.2 元素规格

| 元素 | 规格 | 样式 |
|------|------|------|
| 容器 | 高度: 48px, 宽度: 100% | 背景: 线性渐变 #FF9800 → #F57C00 |
| 设置按钮 | 44x44px 点击区域, 图标24x24px | 左对齐, margin-left: 16px |
| 游戏标题 | 字体: 20px Bold | 居中, 颜色: #FFFFFF, 文字阴影: 0 1px 2px rgba(0,0,0,0.3) |
| 排行榜按钮 | 44x44px 点击区域, 图标24x24px | 右对齐, margin-right: 16px |

### 2.3 交互设计

| 交互 | 效果 | 动画 |
|------|------|------|
| 点击设置按钮 | 打开设置面板 | 从底部滑入 (0.3s ease-out) |
| 点击排行榜按钮 | 打开排行榜面板 | 从右侧滑入 (0.3s ease-out) |
| 按钮按下 | 缩放至0.95 | 0.1s ease-out |
| 按钮释放 | 恢复至1.0 | 0.1s ease-out-back |

### 2.4 CSS实现参考

```css
.status-bar {
  height: 48px;
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease-out;
}

.status-btn:active {
  transform: scale(0.95);
}

.game-title {
  font-size: 20px;
  font-weight: bold;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
```

---

## 3. 金币显示区设计 (UID-1-003)

### 3.1 布局结构

```
+----------------------------------------------------------+
|                                                          |
|        +--------------------------------+                |
|        |  [?]  1,234,567 金币           |                |
|        |       每秒产出: +123.45/秒     |                |
|        +--------------------------------+                |
|                                                          |
+----------------------------------------------------------+
```

### 3.2 元素规格

| 元素 | 规格 | 样式 |
|------|------|------|
| 容器 | 内边距: 16px | 居中对齐 |
| 金币卡片 | 最大宽度: 300px, 内边距: 16px | 背景: rgba(0,0,0,0.6), 圆角: 12px |
| 金币图标 | 32x32px | 金色硬币图标 |
| 金币数值 | 字体: 32px Bold | 颜色: #FFD700, 文字阴影: 0 2px 4px rgba(255,215,0,0.3) |
| DPS显示 | 字体: 16px Regular | 颜色: #4CAF50, 上边距: 4px |

### 3.3 数字格式化规则

| 数值范围 | 显示格式 | 示例 |
|---------|---------|------|
| < 1,000 | 原始数值 | 999 |
| 1,000 - 999,999 | K格式 | 1.23K, 456.7K |
| 1,000,000 - 999,999,999 | M格式 | 1.23M, 456.7M |
| >= 1,000,000,000 | B格式 | 1.23B |

### 3.4 动画效果

| 动画 | 触发条件 | 效果 |
|------|---------|------|
| 数字增长 | 金币增加 | 数字滚动动画 (0.3s ease-out) |
| 卡片呼吸 | 持续 | 轻微缩放 1.0 → 1.02 → 1.0 (2s循环) |
| 高亮闪烁 | 大额获得 | 边框发光 (0.5s) |

### 3.5 CSS实现参考

```css
.coin-display {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.coin-card {
  background: rgba(0,0,0,0.6);
  border-radius: 12px;
  padding: 16px;
  min-width: 200px;
  max-width: 300px;
  text-align: center;
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.coin-value {
  font-size: 32px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(255,215,0,0.3);
}

.dps-value {
  font-size: 16px;
  color: #4CAF50;
  margin-top: 4px;
}
```

---

## 4. 点击按钮设计 (UID-1-004)

### 4.1 按钮规格

| 属性 | 规格 |
|------|------|
| 尺寸 | 120x120px (移动端: 100x100px) |
| 形状 | 圆形 (border-radius: 50%) |
| 背景 | 径向渐变: #FF9800 → #F57C00 |
| 边框 | 4px solid #FFE0B2 |
| 阴影 | 0 8px 16px rgba(255,152,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3) |

### 4.2 按钮内容

```
        +------------+
       /              \
      |    [金币图标]  |
      |     48x48     |
      |               |
      |    点击我      |
      |    16px       |
       \              /
        +------------+
```

### 4.3 交互效果

#### 4.3.1 点击反馈

| 状态 | 效果 | 动画 |
|------|------|------|
| 默认 | scale(1), 阴影正常 | - |
| 按下 | scale(0.95), 阴影缩小 | 0.1s ease-out |
| 释放 | scale(1.05) → scale(1) | 0.15s ease-out-back |
| 悬停 | scale(1.05), 阴影加深 | 0.2s ease-out |

#### 4.3.2 连击效果

| 连击数 | 效果 |
|--------|------|
| 5连击 | 按钮周围显示 "x2" 文字 |
| 10连击 | 按钮周围显示 "x3" 文字 + 轻微震动 |
| 20连击 | 按钮周围显示 "x5" 文字 + 震动 + 发光 |

#### 4.3.3 暴击效果

| 暴击类型 | 效果 |
|---------|------|
| 小暴击 (2x) | 按钮闪烁橙色光 |
| 中暴击 (5x) | 按钮闪烁金色光 + 震动 |
| 大暴击 (10x) | 按钮闪烁彩虹光 + 强烈震动 + 屏幕震动 |

### 4.4 CSS实现参考

```css
.click-button {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #FFB74D 0%, #FF9800 50%, #F57C00 100%);
  border: 4px solid #FFE0B2;
  box-shadow: 
    0 8px 16px rgba(255,152,0,0.4),
    inset 0 2px 4px rgba(255,255,255,0.3);
  cursor: pointer;
  transition: transform 0.1s ease-out, box-shadow 0.2s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.click-button:hover {
  transform: scale(1.05);
  box-shadow: 
    0 12px 24px rgba(255,152,0,0.5),
    inset 0 2px 4px rgba(255,255,255,0.3);
}

.click-button:active {
  transform: scale(0.95);
  box-shadow: 
    0 4px 8px rgba(255,152,0,0.3),
    inset 0 2px 4px rgba(255,255,255,0.3);
}

.click-button.critical {
  animation: critical-flash 0.3s ease-out;
}

@keyframes critical-flash {
  0%, 100% { 
    box-shadow: 0 8px 16px rgba(255,152,0,0.4);
  }
  50% { 
    box-shadow: 
      0 8px 16px rgba(255,215,0,0.8),
      0 0 30px rgba(255,215,0,0.6);
  }
}
```

---

## 5. 金币飘字设计 (UID-1-005)

### 5.1 飘字生成规则

```
                    +-- 随机偏移 ±30px --+
                    |                    |
        [+]123      [+]456    [+]789     |
            \        |        /          |
             \       |       /           |
              \      |      /            |
               +-----+-----+             |
                     |                   |
              [点击按钮位置]              |
+----------------------------------------+
```

### 5.2 飘字规格

| 属性 | 普通金币 | 暴击金币 |
|------|---------|---------|
| 字体大小 | 18px Bold | 24px Bold |
| 颜色 | #FFD700 | #FF5722 |
| 内容 | "+X" | "+X (暴击!)" |
| 动画时长 | 0.5s | 0.7s |
| 额外效果 | 无 | 放大 + 金色边框 |

### 5.3 动画轨迹

```
时间轴:
t=0.0s  →  生成于按钮上方, opacity: 1, scale: 1.0
t=0.1s  →  向上移动 20px, 左右随机偏移
t=0.3s  →  继续向上移动 40px, opacity: 0.7
t=0.5s  →  向上移动 60px, opacity: 0, scale: 0.8
```

### 5.4 连击飘字

| 连击状态 | 飘字效果 |
|---------|---------|
| 普通点击 | 单个 "+X" |
| 连击中 | "+X (x2)" 显示倍率 |
| 连击结束 | 显示总连击数 "连击结束! +XXX" |

### 5.5 CSS实现参考

```css
.coin-popup {
  position: absolute;
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  pointer-events: none;
  animation: float-up 0.5s ease-out forwards;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.coin-popup.critical {
  font-size: 24px;
  color: #FF5722;
  animation: float-up-critical 0.7s ease-out forwards;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(var(--random-x)) scale(1);
  }
  70% {
    opacity: 0.7;
    transform: translateY(-40px) translateX(calc(var(--random-x) * 1.5)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) translateX(calc(var(--random-x) * 2)) scale(0.8);
  }
}

@keyframes float-up-critical {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  50% {
    transform: translateY(-30px) scale(1.5);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.8);
  }
}
```

---

## 6. BUFF状态栏设计 (UID-1-006)

### 6.1 布局结构

```
+----------------------------------------------------------+
|  +--------+  +--------+  +--------+  +--------+          |
|  | [图标] |  | [图标] |  | [图标] |  | [图标] |   ...    |
|  | 双倍   |  | 暴击   |  | 自动   |  | 金币   |          |
|  | 00:30  |  | 00:15  |  | 05:00  |  | 02:45  |          |
|  +--------+  +--------+  +--------+  +--------+          |
+----------------------------------------------------------+
```

### 6.2 单个BUFF卡片规格

| 属性 | 规格 |
|------|------|
| 卡片尺寸 | 60x70px |
| 内边距 | 8px |
| 背景 | rgba(255,255,255,0.9) |
| 圆角 | 8px |
| 阴影 | 0 2px 4px rgba(0,0,0,0.1) |

### 6.3 BUFF卡片元素

| 元素 | 规格 | 样式 |
|------|------|------|
| 图标 | 24x24px | 居中, 顶部 |
| 名称 | 12px Regular | 颜色: #333333, 居中 |
| 剩余时间 | 14px Bold | 颜色: #FF5722, 居中 |

### 6.4 BUFF状态效果

| 状态 | 效果 |
|------|------|
| 激活中 | 正常显示, 白色背景 |
| 即将结束 (<10s) | 时间闪烁红色, 卡片轻微震动 |
| 已结束 | 淡出消失 (0.3s) |
| 新激活 | 从右侧滑入 (0.3s) |

### 6.5 交互设计

| 交互 | 效果 |
|------|------|
| 点击BUFF | 显示详细说明tooltip |
| 长按BUFF | 显示剩余时间倒计时 |
| 滑动 | 横向滚动查看更多BUFF |

### 6.6 CSS实现参考

```css
.buff-bar {
  height: 60px;
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.buff-bar::-webkit-scrollbar {
  display: none;
}

.buff-card {
  min-width: 60px;
  height: 70px;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  animation: slide-in 0.3s ease-out;
}

.buff-card.ending {
  animation: pulse-warning 0.5s ease-in-out infinite;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse-warning {
  0%, 100% { 
    background: rgba(255,255,255,0.9);
  }
  50% { 
    background: rgba(255,87,34,0.2);
  }
}

.buff-icon {
  width: 24px;
  height: 24px;
}

.buff-name {
  font-size: 12px;
  color: #333333;
  margin-top: 4px;
}

.buff-time {
  font-size: 14px;
  font-weight: bold;
  color: #FF5722;
  margin-top: 2px;
}
```

---

## 7. 底部导航栏设计 (UID-1-007)

### 7.1 布局结构

```
+----------------------------------------------------------+
|   [商店图标]        [成就图标]        [道具图标]          |
|     商店              成就              道具              |
+----------------------------------------------------------+
    33.3%              33.3%            33.3%
```

### 7.2 导航栏规格

| 属性 | 规格 |
|------|------|
| 高度 | 60px (含安全区域: 80px) |
| 背景 | #FFFFFF |
| 顶部边框 | 1px solid #E0E0E0 |
| 阴影 | 0 -2px 8px rgba(0,0,0,0.1) |

### 7.3 导航按钮规格

| 元素 | 规格 | 样式 |
|------|------|------|
| 按钮宽度 | 33.3% | flex: 1 |
| 图标 | 24x24px | 居中, 顶部 |
| 文字 | 12px Regular | 颜色: #666666, 居中 |
| 激活状态图标 | 24x24px | 颜色: #2196F3 |
| 激活状态文字 | 12px Bold | 颜色: #2196F3 |

### 7.4 交互效果

| 状态 | 效果 | 动画 |
|------|------|------|
| 默认 | 灰色图标和文字 | - |
| 激活 | 蓝色高亮 | 0.2s ease-out |
| 点击 | 缩放至0.95 | 0.1s ease-out |
| 页面切换 | 滑动过渡 | 0.3s ease-out |

### 7.5 CSS实现参考

```css
.nav-bar {
  height: 60px;
  background: #FFFFFF;
  border-top: 1px solid #E0E0E0;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.nav-btn:active {
  transform: scale(0.95);
}

.nav-btn.active .nav-icon {
  color: #2196F3;
}

.nav-btn.active .nav-text {
  color: #2196F3;
  font-weight: bold;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: #666666;
}

.nav-text {
  font-size: 12px;
  color: #666666;
}
```

---

## 8. 响应式设计 (UID-1-008)

### 8.1 断点定义

| 设备类型 | 断点 | 最大宽度 |
|---------|------|---------|
| 移动端 | < 768px | 100% |
| 平板 | 768px - 1024px | 768px |
| 桌面 | > 1024px | 600px |

### 8.2 移动端适配 (< 768px)

```css
/* 移动端样式 */
@media (max-width: 767px) {
  .click-button {
    width: 100px;
    height: 100px;
  }
  
  .coin-value {
    font-size: 28px;
  }
  
  .game-title {
    font-size: 18px;
  }
  
  .status-bar {
    height: 44px;
  }
  
  .nav-bar {
    height: 56px;
  }
  
  .buff-card {
    min-width: 50px;
    height: 60px;
  }
}
```

### 8.3 平板适配 (768px - 1024px)

```css
/* 平板样式 */
@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
  
  .click-button {
    width: 140px;
    height: 140px;
  }
  
  .coin-value {
    font-size: 36px;
  }
  
  .game-title {
    font-size: 22px;
  }
}
```

### 8.4 桌面适配 (> 1024px)

```css
/* 桌面样式 */
@media (min-width: 1025px) {
  .container {
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    min-height: 100vh;
  }
  
  .click-button {
    width: 120px;
    height: 120px;
  }
  
  .click-button:hover {
    transform: scale(1.05);
    cursor: pointer;
  }
}
```

### 8.5 横屏适配

```css
/* 横屏样式 */
@media (orientation: landscape) and (max-height: 500px) {
  .status-bar {
    height: 40px;
  }
  
  .coin-display {
    padding: 8px;
  }
  
  .coin-card {
    padding: 12px;
  }
  
  .click-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .click-button {
    width: 80px;
    height: 80px;
  }
  
  .buff-bar {
    height: 50px;
  }
  
  .nav-bar {
    height: 50px;
  }
}
```

### 8.6 高DPI适配

```css
/* 高DPI屏幕 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .click-button {
    border-width: 2px;
  }
  
  .status-bar {
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
}
```

---

## 9. 设计规范汇总

### 9.1 颜色规范

| 用途 | 颜色值 | 使用场景 |
|------|--------|---------|
| 主色调 | #FF9800 | 按钮、状态栏背景 |
| 主色深 | #F57C00 | 渐变终点、按下状态 |
| 金币色 | #FFD700 | 金币数值、金币图标 |
| 成功色 | #4CAF50 | DPS显示、成功提示 |
| 信息色 | #2196F3 | 导航激活、链接 |
| 警告色 | #FF5722 | 暴击、BUFF即将结束 |
| 背景色 | #F5F5F5 | 页面背景 |
| 卡片背景 | #FFFFFF | 导航栏、BUFF卡片 |
| 文字主色 | #333333 | 标题、正文 |
| 文字次色 | #666666 | 说明文字、导航文字 |
| 边框色 | #E0E0E0 | 分割线、边框 |

### 9.2 字体规范

| 用途 | 字号 | 字重 | 颜色 | 行高 |
|------|------|------|------|------|
| 游戏标题 | 20px | Bold | #FFFFFF | 1.2 |
| 金币数字 | 32px | Bold | #FFD700 | 1.2 |
| DPS显示 | 16px | Regular | #4CAF50 | 1.4 |
| 按钮文字 | 16px | Bold | #FFFFFF | 1.2 |
| 飘字普通 | 18px | Bold | #FFD700 | 1.2 |
| 飘字暴击 | 24px | Bold | #FF5722 | 1.2 |
| BUFF名称 | 12px | Regular | #333333 | 1.2 |
| BUFF时间 | 14px | Bold | #FF5722 | 1.2 |
| 导航文字 | 12px | Regular/Bold | #666666/#2196F3 | 1.2 |

### 9.3 间距规范

| 类型 | 数值 | 使用场景 |
|------|------|---------|
| 页面边距 | 16px | 左右边距 |
| 元素间距 | 8px | 同级元素间距 |
| 内边距(大) | 16px | 卡片、容器内边距 |
| 内边距(小) | 8px | 小元素内边距 |
| 圆角(大) | 12px | 卡片、金币显示区 |
| 圆角(中) | 8px | BUFF卡片、按钮 |
| 圆角(小) | 4px | 小元素 |

### 9.4 动画规范

| 类型 | 时长 | 缓动函数 | 使用场景 |
|------|------|---------|---------|
| 快速 | 0.1s | ease-out | 按钮点击反馈 |
| 标准 | 0.2s | ease-out | 状态切换 |
| 慢速 | 0.3s | ease-out | 页面切换 |
| 飘字 | 0.5s | ease-out | 金币飘字 |
| 弹性 | 0.15s | ease-out-back | 按钮释放 |
| 呼吸 | 2s | ease-in-out | 金币卡片呼吸 |

---

## 10. 交互流程图

### 10.1 点击交互流程

```
用户点击按钮
    ↓
[按钮动画] 缩放 0.95 → 1.05 → 1.0
    ↓
[金币计算] 基础金币 × 倍率
    ↓
[飘字生成] 在按钮上方随机位置生成
    ↓
[飘字动画] 向上飘动 + 淡出
    ↓
[金币更新] 数字滚动动画
    ↓
[连击检测] 更新连击数
    ↓
[暴击检测] 是否触发暴击效果
    ↓
[特效播放] 暴击闪烁/震动
```

### 10.2 导航交互流程

```
用户点击导航按钮
    ↓
[按钮动画] 缩放 0.95
    ↓
[状态更新] 切换激活状态
    ↓
[页面切换] 滑动过渡动画
    ↓
[内容加载] 加载对应页面内容
    ↓
[动画完成] 显示新页面
```

---

## 11. 性能优化建议

### 11.1 动画性能

- 使用 `transform` 和 `opacity` 进行动画 (GPU加速)
- 避免使用 `width`, `height`, `margin` 等触发重排的属性
- 使用 `will-change` 提示浏览器优化
- 限制同时播放的动画数量

### 11.2 渲染优化

- 使用 `requestAnimationFrame` 进行动画帧控制
- 飘字使用对象池复用DOM元素
- 长列表使用虚拟滚动
- 图片使用懒加载

### 11.3 内存优化

- 及时清理已消失的飘字DOM
- 使用CSS Sprite合并小图标
- 压缩图片资源
- 避免内存泄漏

---

## 12. 验收检查清单

### 12.1 功能验收

- [x] 主界面布局比例正确
- [x] 状态栏显示正常
- [x] 金币显示正确
- [x] 点击按钮交互正常
- [x] 金币飘字动画正常
- [x] BUFF状态栏显示正常
- [x] 底部导航功能正常
- [x] 响应式适配正常

### 12.2 视觉验收

- [x] 颜色符合规范
- [x] 字体符合规范
- [x] 间距符合规范
- [x] 动画流畅 (60fps)

### 12.3 兼容性验收

- [ ] Chrome 最新版
- [ ] Safari 最新版
- [ ] Firefox 最新版
- [ ] iOS Safari
- [ ] Android Chrome

---

## 附录

### A. 图标资源清单

| 图标名称 | 尺寸 | 格式 | 用途 |
|---------|------|------|------|
| icon_settings | 24x24 | SVG/PNG | 设置按钮 |
| icon_trophy | 24x24 | SVG/PNG | 排行榜按钮 |
| icon_coin | 32x32, 48x48 | SVG/PNG | 金币图标 |
| icon_shop | 24x24 | SVG/PNG | 商店导航 |
| icon_achievement | 24x24 | SVG/PNG | 成就导航 |
| icon_inventory | 24x24 | SVG/PNG | 道具导航 |
| buff_double | 24x24 | SVG/PNG | 双倍金币BUFF |
| buff_critical | 24x24 | SVG/PNG | 暴击BUFF |
| buff_auto | 24x24 | SVG/PNG | 自动点击BUFF |

### B. 切图命名规范

```
[类型]_[名称]_[尺寸]_[状态].[格式]

示例:
btn_click_120x120_normal.png
btn_click_120x120_pressed.png
icon_coin_32x32.png
bg_statusbar_48h.png
```

---

## 文档修订历史

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|---------|
| v1.0 | 2026-02-20 | UID-1 | 初始版本，完成所有UI设计任务 |

---

**文档结束**
