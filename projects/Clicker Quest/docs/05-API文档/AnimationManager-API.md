# AnimationManager API 文档

## 概述

AnimationManager 是 Clicker Quest 游戏的动画管理器，负责所有视觉特效的创建和播放。

## 初始化

```javascript
const eventBus = new EventBus();
const animationManager = new AnimationManager(eventBus);
```

## API 方法

### 1. playGoldFloat(amount, position, type)

播放金币飘字动画。

**参数：**
- `amount` (number): 金币数量
- `position` (Object): 位置对象 `{x, y}`
- `type` (string): 类型，可选值：
  - `'normal'` - 普通金币（默认）
  - `'critical-small'` - 小暴击
  - `'critical-medium'` - 中暴击
  - `'critical-large'` - 大暴击

**示例：**
```javascript
// 普通金币
animationManager.playGoldFloat(100, { x: 200, y: 300 });

// 暴击金币
animationManager.playGoldFloat(500, { x: 200, y: 300 }, 'critical-medium');
```

**动画效果：**
- 普通金币：向上飘动50px，持续800ms
- 小暴击：金色，字体较大
- 中暴击：橙色，字体更大
- 大暴击：红色，字体最大，持续1000ms

---

### 2. playCriticalEffect(level, position)

播放暴击特效（组合效果）。

**参数：**
- `level` (string): 暴击等级，可选值：
  - `'small'` - 小暴击（2倍）
  - `'medium'` - 中暴击（5倍）
  - `'large'` - 大暴击（10倍）
- `position` (Object): 位置对象 `{x, y}`

**示例：**
```javascript
animationManager.playCriticalEffect('large', { x: 400, y: 300 });
```

**组合效果包括：**
1. 屏幕震动（强度随等级递增）
2. 光晕扩散效果
3. 粒子爆发
4. 暴击文字提示

---

### 3. playButtonClick(element)

播放按钮点击动画。

**参数：**
- `element` (HTMLElement): 要添加动画的DOM元素

**示例：**
```javascript
const button = document.querySelector('.my-button');
button.addEventListener('click', () => {
    animationManager.playButtonClick(button);
});
```

**动画效果：**
- 缩放到92%
- 发光效果增强
- 波纹扩散
- 持续150ms

---

### 4. playNumberChange(element, from, to, duration)

播放数值滚动动画。

**参数：**
- `element` (HTMLElement): 显示数值的DOM元素
- `from` (number): 起始值
- `to` (number): 目标值
- `duration` (number): 持续时间（毫秒），默认300ms

**示例：**
```javascript
const goldDisplay = document.querySelector('.gold-value');
animationManager.playNumberChange(goldDisplay, 1000, 5000, 500);
```

**动画效果：**
- 数字平滑滚动
- 使用缓动函数（ease-out-cubic）
- 自动格式化大数字（K, M, B）

---

### 5. playScreenShake(intensity, duration)

播放屏幕震动效果。

**参数：**
- `intensity` (number): 震动强度（像素），默认10
- `duration` (number): 持续时间（毫秒），默认100

**示例：**
```javascript
// 轻微震动
animationManager.playScreenShake(10, 100);

// 强烈震动
animationManager.playScreenShake(40, 200);
```

**动画效果：**
- 随机方向震动
- 强度随时间衰减
- 自动恢复原位

---

### 6. playParticles(options)

播放粒子效果。

**参数：**
- `options` (Object): 粒子配置对象
  - `position` (Object): 位置 `{x, y}`
  - `count` (number): 粒子数量，默认10
  - `color` (string): 颜色，默认'#FFD700'
  - `type` (string): 类型，可选值：
    - `'burst'` - 爆发（向四周扩散）
    - `'fountain'` - 喷泉（向上喷射）
    - `'rain'` - 雨滴（向下飘落）

**示例：**
```javascript
// 爆发粒子
animationManager.playParticles({
    position: { x: 400, y: 300 },
    count: 20,
    color: '#FF9800',
    type: 'burst'
});

// 喷泉粒子
animationManager.playParticles({
    position: { x: 400, y: 500 },
    count: 15,
    color: '#4CAF50',
    type: 'fountain'
});
```

**动画效果：**
- 粒子带有重力效果
- 透明度渐变消失
- 尺寸逐渐缩小
- 持续800ms

---

### 7. createCoinFlyAnimation(from, to, count, onComplete)

创建金币飞行动画。

**参数：**
- `from` (Object): 起始位置 `{x, y}`
- `to` (Object): 目标位置 `{x, y}`
- `count` (number): 金币数量，默认5
- `onComplete` (Function): 完成回调函数（可选）

**示例：**
```javascript
animationManager.createCoinFlyAnimation(
    { x: 200, y: 400 },  // 从点击位置
    { x: 100, y: 50 },   // 飞到金币显示区
    10,                   // 10个金币
    () => {
        console.log('金币收集完成！');
    }
);
```

**动画效果：**
- 贝塞尔曲线轨迹
- 金币旋转效果
- 透明度渐变
- 持续600ms

---

## 事件系统

AnimationManager 通过 EventBus 触发和监听事件。

### 监听的事件

```javascript
// 金币获得事件
eventBus.on('gold:earned', (data) => {
    // data: { amount, position, type }
});

// 暴击事件
eventBus.on('critical:hit', (data) => {
    // data: { level, position }
});
```

### 触发的事件

```javascript
// 金币飘字完成
eventBus.on('animation:goldFloat', (data) => {
    // data: { amount, type }
});

// 暴击特效播放
eventBus.on('animation:critical', (data) => {
    // data: { level, position }
});
```

---

## 性能优化建议

1. **粒子数量控制**
   - 小暴击：5个粒子
   - 中暴击：10个粒子
   - 大暴击：20个粒子
   - 避免同时播放过多粒子效果

2. **动画队列管理**
   - AnimationManager 自动清理完成的动画元素
   - 避免内存泄漏

3. **帧率优化**
   - 使用 `requestAnimationFrame` 确保流畅动画
   - CSS动画优先，JS动画辅助

---

## 完整示例

```javascript
// 初始化
const eventBus = new EventBus();
const animationManager = new AnimationManager(eventBus);

// 点击金币按钮
function onCoinClick(event) {
    const rect = event.target.getBoundingClientRect();
    const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    
    // 判断是否暴击
    const isCritical = Math.random() < 0.1;
    
    if (isCritical) {
        // 播放暴击特效
        const level = Math.random() < 0.3 ? 'large' : 
                      Math.random() < 0.5 ? 'medium' : 'small';
        animationManager.playCriticalEffect(level, position);
        
        // 显示暴击金币
        const multiplier = level === 'large' ? 10 : 
                          level === 'medium' ? 5 : 2;
        animationManager.playGoldFloat(
            baseGold * multiplier, 
            position, 
            `critical-${level}`
        );
    } else {
        // 普通点击
        animationManager.playButtonClick(event.target);
        animationManager.playGoldFloat(baseGold, position);
    }
    
    // 更新金币显示
    animationManager.playNumberChange(
        goldDisplay, 
        currentGold, 
        currentGold + earnedGold
    );
}
```

---

## 测试

打开 `test-animation.html` 文件可以测试所有动画效果。

测试内容包括：
- 金币飘字动画（4种类型）
- 暴击特效（3个等级）
- 屏幕震动（3种强度）
- 数值滚动动画
- 按钮点击动画
- 金币飞行动画
- 粒子效果（3种类型）
