# LP-TODOLIST-CP-1 - 核心程序-点击金币

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Clicker Quest (点击冒险) |
| 文档类型 | 子程序员任务清单 |
| 版本 | v1.0 |
| 创建日期 | 2026-02-20 |
| 主程序员 | LP |
| 负责角色 | CP-1 核心程序-点击金币 |

---

## 角色职责

CP-1负责点击检测、金币计算、暴击判定相关功能。

---

## 任务清单

### 1. 点击系统完善 (优先级: P0)

#### 1.1 点击事件处理
- [ ] 实现高频点击支持 (≥10次/秒)
- [ ] 确保点击响应时间≤50ms
- [ ] 实现点击防抖/节流优化
- [ ] 添加点击音效触发

**相关文件**: `src/core/ClickSystem.js`

**验收标准**:
- 点击响应延迟≤50ms
- 支持20次/秒点击频率
- 无点击丢失

#### 1.2 金币计算公式实现
- [ ] 实现完整金币计算公式
- [ ] 添加点击强化加成计算
- [ ] 添加双击加成计算
- [ ] 添加黄金之手加成计算
- [ ] 添加BUFF金币倍率计算

**计算公式**:
```javascript
gold = (baseClick + clickPowerLevel) 
     × (hasDoubleClick ? 2 : 1) 
     × (1 + goldenTouchLevel × 0.10) 
     × comboMultiplier 
     × criticalMultiplier 
     × buffMultiplier;
```

**相关文件**: `src/core/ClickSystem.js`

**验收标准**:
- 计算结果精确无误
- 所有加成正确叠加

---

### 2. 连击系统完善 (优先级: P0)

#### 2.1 连击检测逻辑
- [ ] 实现500ms时间窗口检测
- [ ] 实现连击倍率递增 (每次+0.1)
- [ ] 实现最大倍率限制 (2.0x)
- [ ] 实现连击中断检测

**相关文件**: `src/core/ComboSystem.js`

**验收标准**:
- 连击时间窗口准确500ms
- 倍率计算正确
- 中断检测准确

#### 2.2 连击UI反馈
- [ ] 连击倍率实时显示
- [ ] 连击中断视觉反馈
- [ ] 最高连击记录保存

**验收标准**:
- UI实时更新
- 最高记录持久化

---

### 3. 暴击系统完善 (优先级: P0)

#### 3.1 暴击判定实现
- [ ] 实现小暴击判定 (10%概率, 2x倍率)
- [ ] 实现中暴击判定 (5%概率, 5x倍率)
- [ ] 实现大暴击判定 (1%概率, 10x倍率)
- [ ] 添加幸运手指暴击率加成
- [ ] 添加BUFF暴击率加成

**相关文件**: `src/core/CriticalSystem.js`

**验收标准**:
- 暴击概率准确
- 倍率计算正确
- 加成正确叠加

#### 3.2 暴击伤害加成
- [ ] 实现暴击大师伤害加成 (+50%/级)
- [ ] 暴击伤害正确应用

**验收标准**:
- 伤害加成计算正确

---

### 4. GPS系统完善 (优先级: P1)

#### 4.1 GPS产出计算
- [ ] 实现自动点击器GPS加成 (+1/级)
- [ ] 实现超级点击器GPS加成 (+10/级)
- [ ] 添加黄金之手GPS加成
- [ ] 添加BUFF GPS倍率

**相关文件**: `src/systems/GPSManager.js`

**验收标准**:
- GPS计算准确
- 每秒产出正确

#### 4.2 GPS产出逻辑
- [ ] 实现每秒自动产出
- [ ] 升级后即时更新GPS
- [ ] 显示当前GPS数值

**验收标准**:
- 产出间隔准确1秒
- 升级后GPS立即更新

---

### 5. 单元测试 (优先级: P1)

- [ ] 编写点击系统单元测试
- [ ] 编写连击系统单元测试
- [ ] 编写暴击系统单元测试
- [ ] 编写GPS系统单元测试

---

## 接口依赖

### 需要调用的接口
- `GameState.getGold()` - 获取金币数量
- `GameState.addGold()` - 添加金币
- `GameState.getUpgradeLevel()` - 获取升级等级
- `BuffManager.getGoldMultiplier()` - 获取金币倍率
- `BuffManager.getCritRateBonus()` - 获取暴击率加成

### 提供的接口
- `ClickSystem.handleClick()` - 处理点击
- `ClickSystem.calculateClickGold()` - 计算点击产出
- `ComboSystem.checkCombo()` - 检测连击
- `ComboSystem.getComboMultiplier()` - 获取连击倍率
- `CriticalSystem.checkCritical()` - 检测暴击
- `CriticalSystem.getTotalCritRate()` - 获取总暴击率
- `GPSManager.calculateGPS()` - 计算GPS
- `GPSManager.startProduction()` - 启动产出

---

## 技术参考

- 技术需求文档: `docs/03-整合文档/LD-TECH-REQ-v1.0-20260220.md`
- 功能路径文档: `docs/03-整合文档/LD-FUNC-PATH-v1.0-20260220.md`

---

## 完成标准

1. 所有P0任务完成
2. 单元测试通过
3. 代码符合规范
4. 无控制台错误

---

**文档结束**
