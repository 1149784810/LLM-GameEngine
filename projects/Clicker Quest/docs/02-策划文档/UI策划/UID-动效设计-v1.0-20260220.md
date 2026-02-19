# Clicker Quest - 动效设计文档

**文档编号**: UID-动效设计-v1.0-20260220
**策划角色**: UI策划-动效设计(UID-3)
**负责模块**: 动效设计
**创建日期**: 2026-02-20
**版本**: v1.0

---

## 一、文档概述

### 1.1 设计目标
本文档定义Clicker Quest游戏的所有动效规范,确保游戏具有流畅、自然、符合二次元风格的动画效果,提升玩家的操作反馈感和游戏体验。

### 1.2 设计原则
- **即时反馈**: 所有操作必须有明确的视觉反馈
- **流畅自然**: 动画过渡平滑,符合物理直觉
- **性能优先**: 动效不影响游戏性能,保持60fps
- **风格统一**: 所有动效符合二次元动漫风格
- **可配置性**: 提供动效开关和强度调节

### 1.3 适用范围
- 金币飘字动效
- 按钮点击反馈动效
- 暴击特效
- 界面过渡动画
- 其他UI动效

---

## 二、金币飘字动效设计

### 2.1 设计概述
金币飘字是玩家点击后获得金币的视觉反馈,需要清晰、醒目、具有二次元风格的动效表现。

### 2.2 基础飘字动效

#### 2.2.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 初始位置 | 点击位置 | 从点击坐标生成 |
| 移动方向 | 向上飘动 | 垂直向上 |
| 移动距离 | 120px | 向上移动120像素 |
| 移动时长 | 1000ms | 总动画时长 |
| 缓动函数 | ease-out | 开始快,结束慢 |

#### 2.2.2 样式参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 字体大小 | 28px | 基础字号 |
| 字体颜色 | #FFD700 | 金色 |
| 字体描边 | 2px #000000 | 黑色描边增强可读性 |
| 字体粗细 | bold | 加粗 |
| 文字阴影 | 0 0 10px rgba(255, 215, 0, 0.8) | 金色发光效果 |

#### 2.2.3 动画序列
```
时间轴: 0ms → 1000ms

阶段1: 生成阶段 (0ms - 100ms)
- 透明度: 0% → 100%
- 缩放: 1.2 → 1.0
- 位置: 原地

阶段2: 飘动阶段 (100ms - 800ms)
- 透明度: 100% → 100%
- 缩放: 1.0 → 1.0
- 位置: 向上移动100px
- 水平偏移: 随机±20px

阶段3: 消失阶段 (800ms - 1000ms)
- 透明度: 100% → 0%
- 缩放: 1.0 → 0.8
- 位置: 继续向上移动20px
```

#### 2.2.4 CSS实现代码
```css
@keyframes coinFloat {
  0% {
    opacity: 0;
    transform: translateY(0) scale(1.2);
  }
  10% {
    opacity: 1;
    transform: translateY(0) scale(1.0);
  }
  80% {
    opacity: 1;
    transform: translateY(-100px) scale(1.0);
  }
  100% {
    opacity: 0;
    transform: translateY(-120px) scale(0.8);
  }
}

.coin-text {
  position: absolute;
  font-size: 28px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 
    2px 2px 0 #000000,
    -2px -2px 0 #000000,
    2px -2px 0 #000000,
    -2px 2px 0 #000000,
    0 0 10px rgba(255, 215, 0, 0.8);
  animation: coinFloat 1000ms ease-out forwards;
  pointer-events: none;
  z-index: 1000;
}
```

### 2.3 暴击飘字动效

#### 2.3.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 初始位置 | 点击位置 | 从点击坐标生成 |
| 移动方向 | 向上飘动 | 垂直向上 |
| 移动距离 | 150px | 向上移动150像素 |
| 移动时长 | 1500ms | 总动画时长 |
| 缓动函数 | ease-out | 开始快,结束慢 |

#### 2.3.2 样式参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 字体大小 | 42px | 比普通飘字大50% |
| 字体颜色 | #FF4500 | 红橙色 |
| 字体描边 | 3px #000000 | 更粗的描边 |
| 字体粗细 | bold | 加粗 |
| 文字阴影 | 0 0 20px rgba(255, 69, 0, 1.0) | 更强的发光效果 |

#### 2.3.3 动画序列
```
时间轴: 0ms → 1500ms

阶段1: 生成阶段 (0ms - 150ms)
- 透明度: 0% → 100%
- 缩放: 1.5 → 1.2
- 震动: 左右震动3次

阶段2: 飘动阶段 (150ms - 1200ms)
- 透明度: 100% → 100%
- 缩放: 1.2 → 1.0
- 位置: 向上移动130px
- 震动: 持续轻微震动

阶段3: 消失阶段 (1200ms - 1500ms)
- 透明度: 100% → 0%
- 缩放: 1.0 → 0.7
- 位置: 继续向上移动20px
```

#### 2.3.4 CSS实现代码
```css
@keyframes criticalFloat {
  0% {
    opacity: 0;
    transform: translateY(0) scale(1.5);
  }
  5% {
    transform: translateY(0) scale(1.5) translateX(-5px);
  }
  10% {
    transform: translateY(0) scale(1.5) translateX(5px);
  }
  15% {
    transform: translateY(0) scale(1.5) translateX(-5px);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1.2) translateX(0);
  }
  80% {
    opacity: 1;
    transform: translateY(-130px) scale(1.0);
  }
  100% {
    opacity: 0;
    transform: translateY(-150px) scale(0.7);
  }
}

.critical-text {
  position: absolute;
  font-size: 42px;
  font-weight: bold;
  color: #FF4500;
  text-shadow: 
    3px 3px 0 #000000,
    -3px -3px 0 #000000,
    3px -3px 0 #000000,
    -3px 3px 0 #000000,
    0 0 20px rgba(255, 69, 0, 1.0),
    0 0 40px rgba(255, 69, 0, 0.6);
  animation: criticalFloat 1500ms ease-out forwards;
  pointer-events: none;
  z-index: 1001;
}
```

### 2.4 飘字管理规范

#### 2.4.1 对象池管理
```javascript
class CoinTextPool {
  constructor(maxSize = 20) {
    this.pool = [];
    this.maxSize = maxSize;
    this.activeTexts = [];
  }
  
  // 获取飘字对象
  getText() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createText();
  }
  
  // 回收飘字对象
  recycleText(textElement) {
    if (this.pool.length < this.maxSize) {
      textElement.style.display = 'none';
      this.pool.push(textElement);
    } else {
      textElement.remove();
    }
  }
}
```

#### 2.4.2 同时显示数量
- 最大同时显示: 10个
- 超出处理: 移除最早的飘字
- 间距控制: 相邻飘字垂直间距至少30px

---

## 三、按钮点击反馈动效设计

### 3.1 设计概述
按钮点击反馈是玩家交互的核心反馈机制,需要提供即时、明显的视觉和触觉反馈。

### 3.2 点击缩放动效

#### 3.2.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 默认状态 | scale(1.0) | 正常大小 |
| 点击瞬间 | scale(0.92) | 缩小8% |
| 恢复时长 | 150ms | 恢复到正常大小 |
| 缓动函数 | ease-out | 平滑过渡 |

#### 3.2.2 CSS实现代码
```css
.btn-click {
  transition: transform 150ms ease-out;
  cursor: pointer;
}

.btn-click:active {
  transform: scale(0.92);
}
```

### 3.3 点击震动动效

#### 3.3.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 震动幅度 | 3px | 左右偏移3像素 |
| 震动次数 | 3次 | 左右震动3次 |
| 震动时长 | 150ms | 总震动时长 |
| 震动频率 | 50ms/次 | 每次震动50ms |

#### 3.3.2 CSS实现代码
```css
@keyframes btnShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-3px);
  }
}

.btn-shake {
  animation: btnShake 150ms ease-in-out;
}
```

### 3.4 点击发光动效

#### 3.4.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 发光颜色 | rgba(255, 255, 255, 0.6) | 半透明白色 |
| 发光范围 | 0 → 20px | 从内向外扩散 |
| 发光时长 | 300ms | 总发光时长 |
| 发光强度 | 1.0 → 0.0 | 从强到弱 |

#### 3.4.2 CSS实现代码
```css
@keyframes btnGlow {
  0% {
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
}

.btn-glow {
  animation: btnGlow 300ms ease-out;
}
```

### 3.5 点击涟漪动效

#### 3.5.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 涟漪颜色 | rgba(255, 255, 255, 0.4) | 半透明白色 |
| 涟漪形状 | 圆形 | 从点击位置扩散 |
| 涟漪范围 | 0 → 100px | 从小到大扩散 |
| 涟漪时长 | 400ms | 总扩散时长 |
| 涟漪透明度 | 0.4 → 0.0 | 渐变消失 |

#### 3.5.2 CSS实现代码
```css
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.4;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  width: 25px;
  height: 25px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 400ms ease-out;
  pointer-events: none;
}
```

### 3.6 组合动效应用

#### 3.6.1 主按钮点击动效
```css
.btn-main:active {
  transform: scale(0.92);
  animation: btnShake 150ms ease-in-out, btnGlow 300ms ease-out;
}
```

#### 3.6.2 商店按钮点击动效
```css
.btn-shop:active {
  transform: scale(0.95);
  animation: btnGlow 300ms ease-out;
}
```

---

## 四、暴击特效设计

### 4.1 设计概述
暴击特效是游戏中最华丽的动效,需要给玩家强烈的视觉冲击和成就感。

### 4.2 屏幕震动特效

#### 4.2.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 震动幅度 | 8px | 全方向随机偏移 |
| 震动次数 | 5次 | 震动5次 |
| 震动时长 | 300ms | 总震动时长 |
| 震动频率 | 60ms/次 | 每次震动60ms |

#### 4.2.2 CSS实现代码
```css
@keyframes screenShake {
  0%, 100% {
    transform: translate(0, 0);
  }
  10% {
    transform: translate(-8px, -6px);
  }
  20% {
    transform: translate(8px, 6px);
  }
  30% {
    transform: translate(-6px, 8px);
  }
  40% {
    transform: translate(6px, -8px);
  }
  50% {
    transform: translate(-8px, 6px);
  }
  60% {
    transform: translate(8px, -6px);
  }
  70% {
    transform: translate(-6px, -8px);
  }
  80% {
    transform: translate(6px, 8px);
  }
  90% {
    transform: translate(-4px, -4px);
  }
}

.screen-shake {
  animation: screenShake 300ms ease-in-out;
}
```

### 4.3 光芒特效

#### 4.3.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 光芒颜色 | #FFD700 | 金色 |
| 光芒数量 | 12条 | 从中心向外扩散 |
| 光芒长度 | 0 → 200px | 从短到长 |
| 光芒时长 | 800ms | 总动画时长 |
| 光芒旋转 | 0deg → 360deg | 旋转一周 |

#### 4.3.2 CSS实现代码
```css
@keyframes lightRays {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5) rotate(360deg);
    opacity: 0;
  }
}

.light-rays {
  position: absolute;
  width: 400px;
  height: 400px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.8) 15deg,
    transparent 30deg
  );
  animation: lightRays 800ms ease-out forwards;
  pointer-events: none;
}
```

### 4.4 粒子特效

#### 4.4.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 粒子颜色 | #FFD700, #FF4500, #FFA500 | 金色、红色、橙色 |
| 粒子形状 | 星星、圆形 | 混合形状 |
| 粒子数量 | 30个 | 总粒子数 |
| 粒子大小 | 8-16px | 随机大小 |
| 粒子速度 | 100-200px/s | 向外扩散速度 |
| 粒子时长 | 1000ms | 粒子生命周期 |

#### 4.4.2 JavaScript实现代码
```javascript
class ParticleSystem {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.maxParticles = 30;
  }
  
  createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // 随机属性
    const size = 8 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 100;
    const color = ['#FFD700', '#FF4500', '#FFA500'][Math.floor(Math.random() * 3)];
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
    `;
    
    this.container.appendChild(particle);
    
    // 动画
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    let opacity = 1;
    let currentX = x;
    let currentY = y;
    
    const animate = () => {
      currentX += vx * 0.016;
      currentY += vy * 0.016;
      opacity -= 0.016;
      
      particle.style.left = currentX + 'px';
      particle.style.top = currentY + 'px';
      particle.style.opacity = opacity;
      
      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  burst(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.createParticle(x, y), i * 10);
    }
  }
}
```

### 4.5 暴击文字特效

#### 4.5.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 文字内容 | "暴击!" / "CRITICAL!" | 暴击提示文字 |
| 字体大小 | 56px | 大号字体 |
| 字体颜色 | #FF4500 | 红橙色 |
| 动画时长 | 1200ms | 总动画时长 |
| 动画序列 | 放大→震动→消失 | 三阶段动画 |

#### 4.5.2 CSS实现代码
```css
@keyframes criticalText {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  20% {
    transform: scale(1.3);
    opacity: 1;
  }
  25% {
    transform: scale(1.3) rotate(-5deg);
  }
  30% {
    transform: scale(1.3) rotate(5deg);
  }
  35% {
    transform: scale(1.3) rotate(-5deg);
  }
  40% {
    transform: scale(1.3) rotate(5deg);
  }
  45% {
    transform: scale(1.3) rotate(0deg);
  }
  80% {
    transform: scale(1.0);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

.critical-text-effect {
  position: absolute;
  font-size: 56px;
  font-weight: bold;
  color: #FF4500;
  text-shadow: 
    4px 4px 0 #000000,
    -4px -4px 0 #000000,
    4px -4px 0 #000000,
    -4px 4px 0 #000000,
    0 0 30px rgba(255, 69, 0, 1.0),
    0 0 60px rgba(255, 69, 0, 0.6);
  animation: criticalText 1200ms ease-out forwards;
  pointer-events: none;
  z-index: 1002;
}
```

---

## 五、界面过渡动画设计

### 5.1 设计概述
界面过渡动画确保界面切换流畅自然,提升用户体验的连贯性。

### 5.2 淡入淡出动效

#### 5.2.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 淡出时长 | 250ms | 界面淡出时间 |
| 淡入时长 | 250ms | 界面淡入时间 |
| 缓动函数 | ease-in-out | 平滑过渡 |
| 透明度变化 | 0% ↔ 100% | 完全透明到完全不透明 |

#### 5.2.2 CSS实现代码
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.fade-in {
  animation: fadeIn 250ms ease-in-out forwards;
}

.fade-out {
  animation: fadeOut 250ms ease-in-out forwards;
}
```

### 5.3 滑动动效

#### 5.3.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 滑动方向 | 左右滑动 | 根据导航方向 |
| 滑动距离 | 100% | 屏幕宽度 |
| 滑动时长 | 350ms | 总滑动时间 |
| 缓动函数 | ease-out | 平滑减速 |

#### 5.3.2 CSS实现代码
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.slide-in-right {
  animation: slideInRight 350ms ease-out forwards;
}

.slide-out-left {
  animation: slideOutLeft 350ms ease-out forwards;
}
```

### 5.4 缩放动效

#### 5.4.1 动画参数
| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 缩放比例 | 0.8 → 1.0 | 从小到大 |
| 缩放时长 | 300ms | 总缩放时间 |
| 缓动函数 | ease-out | 平滑减速 |
| 透明度配合 | 0% → 100% | 配合透明度变化 |

#### 5.4.2 CSS实现代码
```css
@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1.0);
    opacity: 1;
  }
}

@keyframes scaleOut {
  from {
    transform: scale(1.0);
    opacity: 1;
  }
  to {
    transform: scale(0.8);
    opacity: 0;
  }
}

.scale-in {
  animation: scaleIn 300ms ease-out forwards;
}

.scale-out {
  animation: scaleOut 300ms ease-out forwards;
}
```

### 5.5 组合动效应用

#### 5.5.1 弹窗出现动效
```css
.modal-enter {
  animation: scaleIn 300ms ease-out, fadeIn 300ms ease-out;
}
```

#### 5.5.2 页面切换动效
```css
.page-enter {
  animation: slideInRight 350ms ease-out, fadeIn 250ms ease-out;
}

.page-leave {
  animation: slideOutLeft 350ms ease-out, fadeOut 250ms ease-out;
}
```

---

## 六、动画参数定义

### 6.1 时间参数规范

| 参数类型 | 参数值范围 | 推荐值 | 说明 |
|---------|-----------|--------|------|
| 微动效时长 | 100-200ms | 150ms | 按钮点击、小元素动画 |
| 标准动效时长 | 200-400ms | 300ms | 界面元素过渡 |
| 长动效时长 | 400-1000ms | 800ms | 复杂动画、特效 |
| 超长动效时长 | 1000-2000ms | 1500ms | 暴击特效、华丽动画 |

### 6.2 缓动函数规范

| 缓动类型 | CSS值 | 适用场景 |
|---------|-------|---------|
| ease-in | 慢开始 | 元素消失、退出 |
| ease-out | 慢结束 | 元素出现、进入 |
| ease-in-out | 慢开始慢结束 | 循环动画、过渡 |
| linear | 匀速 | 连续动画、滚动 |
| cubic-bezier(0.68, -0.55, 0.265, 1.55) | 弹性效果 | 弹跳、回弹 |

### 6.3 性能参数规范

| 参数名称 | 参数值 | 说明 |
|---------|--------|------|
| 目标FPS | 60fps | 保持流畅动画 |
| 最大粒子数 | 100个 | 同时显示的粒子上限 |
| 最大飘字数 | 10个 | 同时显示的飘字上限 |
| 动效内存占用 | < 10MB | 动效相关内存占用 |
| 同时播放动效 | < 10个 | 同时播放的动效上限 |

### 6.4 设备分级参数

#### 6.4.1 低端设备
- 粒子数量: 50% (最多50个)
- 飘字数量: 50% (最多5个)
- 动效时长: 缩短20%
- 特效强度: 简化版

#### 6.4.2 中端设备
- 粒子数量: 75% (最多75个)
- 飘字数量: 75% (最多7个)
- 动效时长: 标准时长
- 特效强度: 标准版

#### 6.4.3 高端设备
- 粒子数量: 100% (最多100个)
- 飘字数量: 100% (最多10个)
- 动效时长: 标准时长
- 特效强度: 完整版

---

## 七、动效实现规范

### 7.1 CSS动画优先原则
- **优先使用CSS动画**: 性能更好,浏览器优化
- **使用transform和opacity**: 触发GPU加速
- **避免使用left/top**: 触发重排,性能差
- **使用will-change**: 提前告知浏览器优化

### 7.2 JavaScript动画规范
```javascript
// 推荐使用requestAnimationFrame
function animate(element, property, start, end, duration) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const value = start + (end - start) * easeOut(progress);
    element.style[property] = value;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

### 7.3 对象池管理规范
```javascript
class ObjectPool {
  constructor(createFn, maxSize = 20) {
    this.createFn = createFn;
    this.pool = [];
    this.maxSize = maxSize;
  }
  
  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }
  
  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
  
  reset(obj) {
    // 重置对象状态
    obj.style.opacity = '0';
    obj.style.display = 'none';
  }
}
```

### 7.4 性能监控规范
```javascript
class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }
  
  update() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // FPS低于30时自动降级
      if (this.fps < 30) {
        this.downgrade();
      }
    }
  }
  
  downgrade() {
    // 降低动效质量
    console.warn('FPS过低,自动降低动效质量');
    document.body.classList.add('low-performance');
  }
}
```

---

## 八、动效测试规范

### 8.1 功能测试
- [ ] 所有动效正常播放
- [ ] 动效触发时机正确
- [ ] 动效参数符合设计
- [ ] 动效可正常停止

### 8.2 性能测试
- [ ] FPS保持60fps
- [ ] 内存占用正常
- [ ] CPU占用正常
- [ ] 无内存泄漏

### 8.3 兼容性测试
- [ ] Chrome浏览器测试通过
- [ ] Firefox浏览器测试通过
- [ ] Safari浏览器测试通过
- [ ] Edge浏览器测试通过

### 8.4 设备测试
- [ ] PC端测试通过
- [ ] 平板端测试通过
- [ ] 手机端测试通过
- [ ] 低端设备测试通过

---

## 九、验收标准

### 9.1 金币飘字动效
- [ ] 飘字动画流畅自然
- [ ] 飘字样式清晰可读
- [ ] 飘字效果符合二次元风格
- [ ] 暴击飘字有明显区分
- [ ] 性能良好,保持60fps

### 9.2 按钮反馈动效
- [ ] 按钮动效流畅自然
- [ ] 动效反馈及时明显
- [ ] 动效符合二次元风格
- [ ] 性能良好,保持60fps

### 9.3 暴击特效
- [ ] 暴击特效华丽有冲击力
- [ ] 特效符合二次元风格
- [ ] 特效不会过于频繁影响体验
- [ ] 性能良好,保持60fps

### 9.4 界面过渡动画
- [ ] 界面切换动效流畅
- [ ] 动效不会影响界面响应
- [ ] 动效符合二次元风格
- [ ] 性能良好,保持60fps

---

## 十、附录

### 10.1 动效参数速查表

| 动效类型 | 时长 | 缓动函数 | 主要属性 |
|---------|------|---------|---------|
| 金币飘字 | 1000ms | ease-out | transform, opacity |
| 暴击飘字 | 1500ms | ease-out | transform, opacity |
| 按钮缩放 | 150ms | ease-out | transform: scale |
| 按钮震动 | 150ms | ease-in-out | transform: translateX |
| 按钮发光 | 300ms | ease-out | box-shadow |
| 按钮涟漪 | 400ms | ease-out | transform: scale |
| 屏幕震动 | 300ms | ease-in-out | transform: translate |
| 光芒特效 | 800ms | ease-out | transform: scale, rotate |
| 粒子特效 | 1000ms | linear | transform: translate |
| 暴击文字 | 1200ms | ease-out | transform: scale, rotate |
| 淡入淡出 | 250ms | ease-in-out | opacity |
| 滑动 | 350ms | ease-out | transform: translateX |
| 缩放 | 300ms | ease-out | transform: scale |

### 10.2 颜色参数速查表

| 颜色名称 | 颜色值 | 适用场景 |
|---------|--------|---------|
| 金币金 | #FFD700 | 金币飘字、光芒特效 |
| 暴击红 | #FF4500 | 暴击飘字、暴击文字 |
| 发光白 | rgba(255, 255, 255, 0.6) | 按钮发光、涟漪 |
| 粒子橙 | #FFA500 | 粒子特效 |
| 描边黑 | #000000 | 文字描边 |

### 10.3 性能优化建议

1. **使用CSS动画代替JavaScript动画**
   - CSS动画由浏览器优化,性能更好
   - 使用transform和opacity触发GPU加速

2. **使用对象池复用元素**
   - 避免频繁创建和销毁DOM元素
   - 减少内存分配和垃圾回收

3. **限制同时播放的动效数量**
   - 最多同时播放10个动效
   - 超出时移除最早的动效

4. **根据设备性能分级**
   - 低端设备使用简化动效
   - 高端设备使用完整动效

5. **监控FPS并自动降级**
   - FPS低于30时自动降低动效质量
   - 确保游戏流畅运行

---

**文档状态**: 已完成
**下一步**: 提交给程序团队实现
