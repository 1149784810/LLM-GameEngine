---
name: "project-optimizer"
version: "1.0.0"
description: "对已有或新建项目进行需求变更优化，确保最小改动原则。Invoke when user needs to modify specific requirements while keeping other stable features intact, or when performing targeted optimizations on existing projects."
author: "engine-team"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 3
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"

contracts:
  input:
    required_documents: []
  output:
    required_documents: []

execution:
  mode: "blocking"
  preconditions: []
  postconditions: []
  rollback:
    supported: true
    strategy: "checkpoint"

quality:
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
  error_codes: []
  checkpoints: []

functions:
  main:
    name: "optimize"
    signature: "optimize(project_path: PATH, changes: [CHANGE]) -> OPTIMIZE_RESULT"
    description: "优化项目"
---

# 项目优化器 (Project Optimizer)

## 目的

为已有项目或新建项目提供需求变更优化服务，确保在修改特定需求时，遵循**最小改动原则**，保持其他已稳定功能的完整性。

## 核心原则

### 1. 最小改动原则 (Minimal Change Principle)
- 只修改与目标需求直接相关的代码
- 避免对稳定功能产生副作用
- 保持现有架构和代码风格的一致性

### 2. 需求索引机制 (Requirement Indexing)
在改动前建立完整的需求索引：
- 识别所有需求项（A, B, C, D, E...）
- 标记每个需求的实现位置（文件、函数、代码块）
- 建立需求之间的依赖关系图

### 3. 影响范围控制 (Impact Scope Control)
- 精确识别改动影响范围
- 评估变更对其他需求的潜在影响
- 制定风险缓解策略

## 执行流程

### Phase 1: 需求分析与索引建立

1. **收集现有需求**
   - 列出项目中所有已实现的需求
   - 识别当前需求的稳定状态
   - 明确用户希望变更的目标需求

2. **建立需求索引表**
   ```
   | 需求ID | 需求描述 | 实现文件 | 关键函数/类 | 依赖需求 | 稳定状态 |
   |--------|----------|----------|-------------|----------|----------|
   | REQ-A  | 功能A    | file1.ts | funcA()     | -        | 稳定     |
   | REQ-B  | 功能B    | file2.ts | classB      | REQ-A    | 待修改   |
   | REQ-C  | 功能C    | file3.ts | funcC()     | REQ-A    | 稳定     |
   ```

3. **分析依赖关系**
   - 识别需求间的调用关系
   - 标记共享代码块
   - 识别潜在的耦合点

### Phase 2: 变更影响评估

1. **目标需求分析**
   - 理解变更的具体内容（B → B1）
   - 识别需要修改的代码范围
   - 评估变更复杂度

2. **影响范围分析**
   - 直接影响的文件和函数
   - 间接影响的依赖项
   - 需要回归测试的功能点

3. **风险评估**
   - 高：可能破坏核心功能
   - 中：可能影响边界情况
   - 低：局部影响，易于回滚

### Phase 3: 优化执行

1. **代码修改**
   - 严格按照需求索引进行改动
   - 保持原有代码风格和命名规范
   - 添加必要的注释说明变更原因

2. **依赖项保护**
   - 确保未变更需求的实现不受影响
   - 维护接口兼容性
   - 避免引入新的耦合

3. **增量验证**
   - 验证目标需求变更正确性
   - 验证未变更需求保持原行为
   - 执行回归测试

### Phase 4: 验证与文档

1. **功能验证**
   - 目标需求B1功能正确
   - 需求A、C、D、E等保持原有行为
   - 无引入新的bug

2. **文档更新**
   - 更新需求索引表
   - 记录变更内容和影响范围
   - 更新相关技术文档

## 使用场景

### 场景1: 需求局部变更
用户希望将需求B修改为B1，但A、C、D、E等功能已稳定运行。

**执行步骤：**
1. 建立完整需求索引
2. 分析B与A、C、D、E的依赖关系
3. 仅修改B相关代码，确保A、C、D、E不受影响
4. 验证所有需求功能完整性

### 场景2: 性能优化
对特定功能进行性能优化，不影响其他功能。

**执行步骤：**
1. 识别性能瓶颈所在的需求模块
2. 评估优化方案对其他模块的影响
3. 实施局部优化
4. 验证整体系统稳定性

### 场景3: Bug修复
修复特定需求的bug，避免引入回归问题。

**执行步骤：**
1. 定位bug所属的需求模块
2. 分析修复方案的影响范围
3. 实施精准修复
4. 执行全面回归测试

## 检查清单

### 变更前检查
- [ ] 需求索引表已建立
- [ ] 依赖关系已分析
- [ ] 影响范围已评估
- [ ] 回滚方案已准备

### 变更中检查
- [ ] 仅修改目标需求相关代码
- [ ] 保持代码风格一致性
- [ ] 未变更需求的接口未改动
- [ ] 新增代码有适当注释

### 变更后检查
- [ ] 目标需求功能正确
- [ ] 未变更需求功能保持原样
- [ ] 无编译错误
- [ ] 无运行时异常
- [ ] 回归测试通过

## 最佳实践

1. **版本控制**
   - 变更前创建分支或备份
   - 小步提交，便于回滚
   - 清晰的提交信息

2. **测试策略**
   - 为目标需求编写针对性测试
   - 为未变更需求执行回归测试
   - 考虑边界情况和异常场景

3. **代码审查**
   - 重点检查影响范围控制
   - 验证最小改动原则执行
   - 确认无意外副作用

4. **文档同步**
   - 及时更新需求文档
   - 记录架构变更
   - 更新开发指南

## 输出模板

### 需求索引报告
```markdown
## 需求索引报告

### 项目信息
- 项目名称: [项目名]
- 分析时间: [时间]
- 目标变更: [B → B1]

### 需求清单
| ID | 描述 | 状态 | 关键文件 |
|----|------|------|----------|
| A  | ...  | 稳定 | ...      |
| B  | ...  | 变更中| ...      |

### 依赖关系图
A ← B ← C
    ↓
    D

### 变更影响分析
- 直接影响: [文件列表]
- 间接影响: [文件列表]
- 风险等级: [高/中/低]
```

### 优化执行报告
```markdown
## 优化执行报告

### 变更摘要
- 变更需求: B → B1
- 修改文件数: N
- 新增代码行: N
- 删除代码行: N

### 修改详情
1. [文件路径]
   - 修改内容: ...
   - 影响需求: ...

### 验证结果
- [x] 目标需求B1功能正确
- [x] 需求A功能保持正常
- [x] 需求C功能保持正常
- [x] 回归测试通过

### 注意事项
- [需要关注的问题]
```
