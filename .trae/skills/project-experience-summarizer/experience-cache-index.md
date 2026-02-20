# 项目经验库缓存索引表（Experience Cache Index）

> **功能说明**：本文件为经验库的多级缓存索引系统，支持关键词匹配、频次计数和缓存级别动态调整。
> 
> **缓存级别说明**：
> - **L0 (Critical)**：最高频问题，必须优先检查
> - **L1 (High)**：高频问题，建议检查
> - **L2 (Medium)**：中频问题，按需检查
> - **L3 (Low)**：低频问题，参考检查
> 
> **更新规则**：当某条经验被匹配时，计数+1，达到阈值后升级到更高级别缓存

---

## 元数据

| 属性 | 值 |
|------|-----|
| 最后更新 | 2026-02-20 |
| 总条目数 | 12 |
| L0条目数 | 7 |
| L1条目数 | 7 |
| L2条目数 | 1 |
| L3条目数 | 0 |

---

## 缓存级别定义

### L0 - Critical Cache（关键缓存）
- **匹配阈值**：计数 >= 10
- **检查优先级**：最高，QA测试时必须逐项检查
- **更新策略**：计数每+1，保持L0级别
- **降级策略**：30天内无匹配，降级到L1

### L1 - High Cache（高频缓存）
- **匹配阈值**：计数 >= 5
- **检查优先级**：高，建议逐项检查
- **升级策略**：计数达到10，升级到L0
- **降级策略**：20天内无匹配，降级到L2

### L2 - Medium Cache（中频缓存）
- **匹配阈值**：计数 >= 2
- **检查优先级**：中，按需检查
- **升级策略**：计数达到5，升级到L1
- **降级策略**：15天内无匹配，降级到L3

### L3 - Low Cache（低频缓存）
- **匹配阈值**：计数 >= 1
- **检查优先级**：低，参考检查
- **升级策略**：计数达到2，升级到L2
- **淘汰策略**：30天内无匹配，归档到历史库

---

## 缓存索引表

### L0 - Critical Cache（关键缓存）

> **QA测试时必须逐项检查以下问题**

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| L0-001 | #3, #6, #15 | 技术问题 | Web游戏 | ES Module, CORS, file协议 | 0 | - | 检查是否使用`<script type="module">`，如是则要求改为内联脚本 |
| L0-002 | #4 | 技术问题 | Web游戏 | DOM事件, UI类, 事件绑定 | 0 | - | 检查UI类是否在构造函数中绑定事件，如是则要求改为延迟绑定 |
| L0-003 | #5, #11, #12, #22 | 流程问题 | 通用 | QA测试, 审核, 功能失效 | 0 | - | 检查QA是否实际点击了每个按钮，审核是否流于形式 |
| L0-004 | #9, #10 | 技术问题 | Web游戏 | JavaScript, 常量, 全局暴露 | 0 | - | 检查常量是否定义在文件开头，类是否暴露到window |
| L0-005 | #13, #14 | 流程问题 | 通用 | 测试跳过, 回归测试, 按下葫芦浮起瓢 | 0 | - | 检查是否执行了功能测试、视觉测试、回归测试 |
| L0-006 | #23 | 技术问题 | Web游戏 | 数值计算, 加成, 重复应用 | 0 | - | 检查加成是否只应用一次，基础值和最终值是否分离 |
| L0-007 | #26 | 技术问题 | Web游戏 | DOM元素, ID引用, 不一致 | 0 | - | 检查JavaScript中的元素ID与HTML是否一致 |

### L1 - High Cache（高频缓存）

> **建议QA测试时检查以下问题**

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| L1-001 | #1 | 流程问题 | 休闲游戏 | 角色分工, 主程序员, 子程序员 | 0 | - | 检查主程序员是否只写框架，子程序员是否实现具体功能 |
| L1-002 | #2 | 流程问题 | 通用 | QA流程, 验收环节 | 0 | - | 检查Phase 3是否包含QA测试环节 |
| L1-003 | #7 | 技术问题 | 通用 | 算法, 路径检测, 边界条件 | 0 | - | 检查算法是否覆盖边界情况，是否有单元测试 |
| L1-004 | #16 | 流程问题 | 通用 | 经验总结, 技能调用 | 0 | - | 检查项目完成后是否调用经验总结技能 |
| L1-005 | #24 | 技术问题 | Web游戏 | 概率分配, 暴击系统, 阈值计算 | 0 | - | 检查额外概率是否正确分配到各类型 |
| L1-006 | #25 | 技术问题 | Web游戏 | 条件检测, 成就系统, 类型枚举 | 0 | - | 检查所有条件类型都有对应的检测逻辑 |
| L1-007 | #27 | 技术问题 | Web游戏 | 系统连接, 依赖注入, 初始化顺序 | 0 | - | 检查所有系统依赖都已显式连接 |

### L2 - Medium Cache（中频缓存）

> **按需检查以下问题**

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| L2-001 | #8 | 最佳实践 | 通用 | 经验查询, 前置规避 | 0 | - | 检查项目启动前是否查询了经验库 |

### L3 - Low Cache（低频缓存）

> **参考检查以下问题**

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| （暂无） | - | - | - | - | 0 | - | - |

---

## 关键词索引表

### 按关键词快速查找

| 关键词 | 关联缓存ID | 经验ID | 问题描述 |
|--------|-----------|--------|----------|
| ES Module | L0-001 | #3, #6, #15 | CORS跨域限制，file协议下无法加载 |
| CORS | L0-001 | #3, #6, #15 | 浏览器安全策略阻止本地文件加载 |
| file协议 | L0-001 | #3, #6, #15 | 本地文件系统打开导致的问题 |
| DOM事件 | L0-002 | #4 | 事件绑定时机和方式问题 |
| UI类 | L0-002 | #4 | UI类设计缺陷导致的事件失效 |
| 事件绑定 | L0-002 | #4 | 重复绑定或绑定时机错误 |
| QA测试 | L0-003 | #5, #11, #12, #22 | 测试覆盖不足，审核流于形式 |
| 审核 | L0-003 | #5, #11, #12, #22 | 策划审核、程序审核不全面 |
| 功能失效 | L0-003 | #5, #11, #12, #22 | 功能实际不可用但审核通过 |
| JavaScript | L0-004 | #9, #10 | JS代码执行顺序和暴露问题 |
| 常量 | L0-004 | #9 | 常量定义顺序错误 |
| 全局暴露 | L0-004 | #10 | 类未暴露到window导致跨文件访问失败 |
| 测试跳过 | L0-005 | #13 | 功能测试、视觉测试被跳过 |
| 回归测试 | L0-005 | #13, #14 | 修改后未验证原有功能 |
| 按下葫芦浮起瓢 | L0-005 | #14 | 修复A导致B出错 |
| 角色分工 | L1-001 | #1 | 主程序员直接写功能，子程序员未参与 |
| QA流程 | L1-002 | #2 | 缺少QA测试环节 |
| 算法 | L1-003 | #7 | 算法逻辑缺陷，边界条件处理不当 |
| 路径检测 | L1-003 | #7 | 路径检测算法实现问题 |
| 经验总结 | L1-004 | #16 | 项目完成后未进行经验总结 |
| 经验查询 | L2-001 | #8 | 项目启动前未查询经验库 |
| 数值计算 | L0-006 | #23 | 加成重复应用，数值异常 |
| 加成 | L0-006 | #23 | 加成效果被重复计算 |
| DOM元素 | L0-007 | #26 | 元素ID引用不一致 |
| ID引用 | L0-007 | #26 | JavaScript和HTML元素ID不匹配 |
| 概率分配 | L1-005 | #24 | 额外概率分配逻辑缺陷 |
| 暴击系统 | L1-005 | #24 | 暴击率计算问题 |
| 条件检测 | L1-006 | #25 | 成就条件类型不完整 |
| 成就系统 | L1-006 | #25 | 条件检测逻辑缺失 |
| 系统连接 | L1-007 | #27 | 依赖注入不完整 |
| 依赖注入 | L1-007 | #27 | 系统间连接确认缺失 |

---

## 匹配规则定义

### 精确匹配（权重：1.0）
- 关键词完全匹配
- 例如："ES Module" 匹配 "ES Module"

### 模糊匹配（权重：0.8）
- 关键词包含关系
- 例如："ES Module" 匹配 "ES6 Module"

### 语义匹配（权重：0.6）
- 同义词或相关概念
- 例如："CORS" 匹配 "跨域"

### 上下文匹配（权重：0.4）
- 在相同上下文中出现
- 例如：在"Web游戏"上下文中匹配相关技术问题

---

## 计数和升级规则

### 匹配计数规则

```javascript
// 匹配计数逻辑
function incrementCounter(cacheId, matchType) {
  const cache = findCacheEntry(cacheId);
  const weight = getMatchWeight(matchType); // 1.0, 0.8, 0.6, 0.4
  
  cache.count += weight;
  cache.lastMatchDate = new Date().toISOString();
  cache.matchHistory.push({
    date: new Date().toISOString(),
    type: matchType,
    project: currentProject.name
  });
  
  // 检查是否升级
  checkUpgrade(cache);
}
```

### 升级检查逻辑

```javascript
// 升级检查
function checkUpgrade(cache) {
  const thresholds = {
    'L3': 2,   // L3 -> L2
    'L2': 5,   // L2 -> L1
    'L1': 10   // L1 -> L0
  };
  
  const currentLevel = cache.level;
  const nextLevel = getNextLevel(currentLevel);
  
  if (nextLevel && cache.count >= thresholds[currentLevel]) {
    upgradeCache(cache, nextLevel);
  }
}
```

### 降级检查逻辑

```javascript
// 降级检查（每天执行一次）
function checkDowngrade() {
  const now = new Date();
  
  cacheIndex.forEach(cache => {
    const daysSinceLastMatch = (now - new Date(cache.lastMatchDate)) / (1000 * 60 * 60 * 24);
    
    const downgradeDays = {
      'L0': 30,
      'L1': 20,
      'L2': 15,
      'L3': 30  // L3淘汰而不是降级
    };
    
    if (daysSinceLastMatch > downgradeDays[cache.level]) {
      if (cache.level === 'L3') {
        archiveCache(cache);  // 归档到历史库
      } else {
        downgradeCache(cache);  // 降级
      }
    }
  });
}
```

---

## QA测试检查流程

### Phase 3 测试阶段使用流程

```
主测试(LT)准备测试计划
    ↓
读取缓存索引表（从L0开始）
    ↓
L0缓存逐项检查（必须）
    ↓
L1缓存逐项检查（建议）
    ↓
根据时间选择L2/L3缓存检查
    ↓
分配测试任务给子QA
    ↓
子QA测试时对比缓存条目
    ↓
发现问题 → 匹配缓存条目 → 计数+1
    ↓
更新缓存索引表
```

### 检查清单模板

```markdown
## QA测试 - 经验库缓存检查清单

### L0 - Critical（必须检查）
- [ ] **L0-001**: ES Module CORS问题
  - 检查：是否使用`<script type="module">`
  - 结果：通过 / 未通过 / 不适用
  - 备注：

- [ ] **L0-002**: DOM事件绑定失效
  - 检查：UI类是否在构造函数中绑定事件
  - 结果：通过 / 未通过 / 不适用
  - 备注：

- [ ] **L0-003**: QA测试覆盖不足
  - 检查：是否实际点击了每个按钮
  - 结果：通过 / 未通过 / 不适用
  - 备注：

- [ ] **L0-004**: JavaScript常量/暴露问题
  - 检查：常量是否定义在文件开头，类是否暴露到window
  - 结果：通过 / 未通过 / 不适用
  - 备注：

- [ ] **L0-005**: 测试环节缺失
  - 检查：是否执行了功能测试、视觉测试、回归测试
  - 结果：通过 / 未通过 / 不适用
  - 备注：

### L1 - High（建议检查）
- [ ] **L1-001**: 角色分工问题
- [ ] **L1-002**: QA流程缺失
- [ ] **L1-003**: 算法边界条件
- [ ] **L1-004**: 经验总结缺失

### L2 - Medium（按需检查）
- [ ] **L2-001**: 经验查询前置

### 检查结果统计
- L0通过: __/5
- L1通过: __/4
- L2通过: __/1
- 总计通过: __/10

### 新发现问题
| 问题描述 | 关联经验ID | 缓存级别建议 |
|---------|-----------|-------------|
| | | |

### 缓存更新记录
| 缓存ID | 原计数 | 新增计数 | 新计数 | 是否升级 |
|--------|--------|---------|--------|---------|
| | | | | |
```

---

## 缓存管理工具接口

### 1. 查询缓存

```javascript
// 根据项目类型和关键词查询缓存
function queryCache(projectType, keywords) {
  const results = {
    L0: [],
    L1: [],
    L2: [],
    L3: []
  };
  
  // 按级别查询
  ['L0', 'L1', 'L2', 'L3'].forEach(level => {
    results[level] = cacheIndex[level].filter(cache => {
      // 项目类型匹配
      const typeMatch = cache.projectTypes.includes(projectType) || 
                       cache.projectTypes.includes('通用');
      
      // 关键词匹配
      const keywordMatch = keywords.some(keyword => {
        return cache.keywords.some(cacheKeyword => {
          return matchKeyword(keyword, cacheKeyword);
        });
      });
      
      return typeMatch && keywordMatch;
    });
  });
  
  return results;
}
```

### 2. 更新缓存计数

```javascript
// 匹配缓存并更新计数
function matchCache(cacheId, projectInfo) {
  const cache = findCacheById(cacheId);
  if (!cache) return null;
  
  // 增加计数
  cache.count += 1;
  cache.lastMatchDate = new Date().toISOString();
  cache.matchHistory.push({
    date: new Date().toISOString(),
    project: projectInfo.name,
    type: projectInfo.type
  });
  
  // 检查升级
  const upgraded = checkAndUpgrade(cache);
  
  // 保存索引
  saveCacheIndex();
  
  return {
    cache,
    upgraded,
    message: upgraded ? `缓存 ${cacheId} 已升级到 ${cache.level}` : `缓存 ${cacheId} 计数+1`
  };
}
```

### 3. 生成检查清单

```javascript
// 生成QA测试检查清单
function generateChecklist(projectType, options = {}) {
  const checklist = {
    L0: [],
    L1: [],
    L2: [],
    L3: []
  };
  
  // 获取所有缓存
  const allCaches = getAllCaches();
  
  // 按级别筛选
  allCaches.forEach(cache => {
    if (cache.projectTypes.includes(projectType) || 
        cache.projectTypes.includes('通用')) {
      checklist[cache.level].push({
        id: cache.id,
        description: cache.description,
        checkMethod: cache.checkMethod,
        required: cache.level === 'L0'
      });
    }
  });
  
  return checklist;
}
```

---

## 使用示例

### 示例1：QA测试前查询

```javascript
// QA测试前，主测试查询经验库缓存
const projectType = 'Web游戏';
const keywords = ['ES Module', 'DOM事件', 'JavaScript'];

const cacheResults = queryCache(projectType, keywords);

console.log('L0级别缓存（必须检查）:', cacheResults.L0.length, '条');
console.log('L1级别缓存（建议检查）:', cacheResults.L1.length, '条');
```

### 示例2：发现问题后更新缓存

```javascript
// 测试中发现ES Module问题
const matchResult = matchCache('L0-001', {
  name: '新项目A',
  type: 'Web游戏'
});

console.log(matchResult.message);
// 输出: 缓存 L0-001 计数+1 (当前计数: 11)
// 或: 缓存 L0-001 已升级到 L0
```

### 示例3：生成检查清单

```javascript
// 生成Web游戏项目的检查清单
const checklist = generateChecklist('Web游戏');

// 输出Markdown格式清单
console.log(generateMarkdownChecklist(checklist));
```

---

## 维护说明

### 定期维护任务

1. **每日**：执行降级检查，清理过期缓存
2. **每周**：分析缓存命中率，优化关键词
3. **每月**：归档长期未匹配的L3缓存
4. **每季度**：审查缓存级别定义，调整阈值

### 缓存条目维护

```markdown
### 添加新缓存条目
1. 确定问题类型和项目类型
2. 提取关键词（3-5个）
3. 确定初始级别（通常L3）
4. 编写快速检查方法
5. 关联经验ID

### 更新缓存条目
1. 根据匹配频次调整级别
2. 更新关键词以提高匹配率
3. 优化快速检查方法
4. 更新关联经验ID

### 删除缓存条目
1. 确认问题已不再发生
2. 将条目归档到历史库
3. 更新所有关联索引
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-02-19 | 初始版本，建立L0-L3多级缓存索引系统 |

---

**关联文件**：
- [经验库主文档](experience-db.md)
- [经验库管理技能](SKILL.md)
- [QA标准管理器](../qa-standards-manager/SKILL.md)
