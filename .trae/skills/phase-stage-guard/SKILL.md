---
name: "phase-stage-guard"
version: "1.0.0"
description: "流程阶段守卫，强制执行Stage顺序检查，防止跳过阶段。在每个Stage开始前必须调用，验证阻塞点状态和前置条件。"
author: "engine-team"
created_at: "2026-02-20"
updated_at: "2026-02-20"

layer: 3
dependencies:
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "状态管理"

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
    supported: false

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "阶段顺序正确"
      metric: "stage_order_valid"
      threshold: 1.0
      operator: "=="
      required: true
  testing:
    required_tests: []
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
  error_codes:
    - code: "E201"
      name: "PHASE_TRANSITION_FAILED"
      severity: "HIGH"
      rollback_required: false
    - code: "E202"
      name: "BLOCKING_POINT_LOCKED"
      severity: "MEDIUM"
      rollback_required: false
  checkpoints: []

functions:
  main:
    name: "check_stage"
    signature: "check_stage(current_stage: STRING, target_stage: STRING) -> CHECK_RESULT"
    description: "检查是否可以从当前阶段进入目标阶段"
  validators:
    - name: "validate_parallel_stage"
      signature: "validate_parallel_stage(stage: STRING, roles: [ROLE_ID]) -> VALIDATION_RESULT"
      description: "验证并行阶段是否满足要求"
  queries:
    - name: "check_blocking_point"
      signature: "check_blocking_point(bp_id: STRING) -> { unlocked: BOOL }"
      description: "检查阻塞点是否已解锁"
---

# 流程阶段守卫

> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **状态管理**：[state-manager](.trae/skills/state-manager/SKILL.md)

---

## 功能概述

本技能作为**PL调度前的强制检查点**，确保：

1. **阶段顺序正确**：不允许跳过任何Stage
2. **阻塞点验证**：前置阻塞点必须已解锁
3. **并行阶段检查**：并行阶段必须启动足够数量的角色
4. **状态一致性**：项目状态与当前阶段匹配

---

## 调用时机

**CRITICAL：PL在调度任何角色前，必须先调用本技能进行阶段检查。**

```
PL准备调度角色
    ↓
【强制】调用 phase-stage-guard.check_stage()
    ↓
检查通过 → 允许调度
检查失败 → 阻止调度，返回错误信息
```

---

## 阶段检查规则

### Phase 1 需求分析阶段

| Stage | 前置条件 | 检查项 | 阻塞点 |
|-------|---------|--------|--------|
| **Stage 1-1** | BP-001解锁 | 需求文档存在 | ⛔ BP-002 |
| **Stage 1-2** | BP-002解锁 | 主策划拆分文档存在 | ⛔ BP-003 |
| **Stage 1-3** | BP-003解锁 | 所有子策划文档存在 | ⛔ BP-004 |

### Stage 1-2 并行检查 ⭐关键

**Stage 1-2 是子策划并行设计阶段，必须满足以下条件才能进入 Stage 1-3：**

```yaml
Stage_1_2_Requirements:
  parallel_designers:
    min_count: 5          # 最少启动5个子策划
    target_count: 8       # 目标启动8个子策划
    required_roles:
      - SD-1              # 系统策划-玩法
      - SD-2              # 系统策划-规则
      - UID               # UI策划
      - BD-1              # 数值策划-经济
      - LvD-1             # 关卡策划
    optional_roles:
      - BD-2              # 数值策划-战斗
      - CD-1              # 战斗策划-机制
      - 3CD-1             # 3C策划
  
  output_requirements:
    - 每个子策划必须输出独立的设计文档
    - 文档必须存放在 docs/02-策划文档/对应目录
    - 文档命名必须符合规范
  
  completion_criteria:
    - 所有启动的子策划都完成设计
    - 所有文档通过契约验证
    - BP-003 解锁
```

### Phase 2 技术实现阶段

| Stage | 前置条件 | 检查项 | 阻塞点 |
|-------|---------|--------|--------|
| **Stage 2-1** | BP-004解锁 | 整合文档存在 | ⛔ BP-005 |
| **Stage 2-2** | BP-005解锁 | 主程序框架存在 | ⛔ BP-006 |
| **Stage 2-3** | BP-006解锁 | 所有子程序代码存在 | ⛔ BP-007 |
| **Stage 2-4** | BP-007解锁 | 代码整合完成 | ⛔ BP-008 |

### Stage 2-2 并行检查 ⭐关键

```yaml
Stage_2_2_Requirements:
  parallel_programmers:
    min_count: 5          # 最少启动5个子程序员
    target_count: 8       # 目标启动8个子程序员
    required_roles:
      - CP-1              # 核心程序-点击系统
      - CP-2              # 核心程序-金币系统
      - UIP-1             # UI程序-主界面
      - UIP-2             # UI程序-商店界面
      - SP-1              # 商店程序-界面
  
  output_requirements:
    - 每个子程序员必须输出代码文件
    - 代码必须符合架构规范
    - 接口契约必须满足
  
  completion_criteria:
    - 所有启动的子程序员都完成开发
    - 代码通过契约验证
    - BP-006 解锁
```

---

## 检查API

### check_stage(current_stage, target_stage)

**用途**：检查是否可以从当前阶段进入目标阶段

**参数**：
- `current_stage`: 当前阶段标识（如 "Stage 1-1"）
- `target_stage`: 目标阶段标识（如 "Stage 1-2"）

**返回**：
```typescript
{
  allowed: boolean,           // 是否允许进入
  blocking_reason?: string,   // 阻塞原因
  missing_prerequisites: [],  // 缺失的前置条件
  required_actions: []        // 需要执行的动作
}
```

### validate_parallel_stage(stage, roles_started)

**用途**：验证并行阶段是否满足要求

**参数**：
- `stage`: 阶段标识（如 "Stage 1-2"）
- `roles_started`: 已启动的角色列表

**返回**：
```typescript
{
  valid: boolean,
  min_required: number,       // 最少需要角色数
  actual_count: number,       // 实际启动角色数
  missing_roles: [],          // 缺失的角色
  warning?: string            // 警告信息
}
```

### check_blocking_point(bp_id)

**用途**：检查阻塞点是否已解锁

**参数**：
- `bp_id`: 阻塞点ID（如 "BP-002"）

**返回**：
```typescript
{
  unlocked: boolean,
  unlock_time?: Date,
  unlock_condition?: string
}
```

---

## 错误处理

### 常见错误及处理

| 错误类型 | 错误信息 | 处理方式 |
|---------|---------|---------|
| **跳过阶段** | "不能从 Stage 1-1 直接跳到 Stage 1-3" | 返回正确流程，要求先执行 Stage 1-2 |
| **阻塞点未解锁** | "BP-002 未解锁，无法进入 Stage 1-2" | 提示完成前置任务 |
| **并行人数不足** | "Stage 1-2 至少需要5个子策划，当前只启动了1个" | 要求补充角色 |
| **文档缺失** | "子策划文档不存在，无法进入 Stage 1-3" | 提示先生成子策划文档 |

---

## 使用示例

### 示例1：正确流程

```
PL: 准备调度主策划进行需求拆分
    ↓
phase-stage-guard.check_stage("Stage 0-0", "Stage 1-1")
    → { allowed: true }  // BP-001已解锁
    ↓
PL: 调度 game-lead-designer
    ↓
主策划完成需求拆分
    ↓
PL: 准备调度子策划
    ↓
phase-stage-guard.check_stage("Stage 1-1", "Stage 1-2")
    → { allowed: true }  // BP-002已解锁
    ↓
phase-stage-guard.validate_parallel_stage("Stage 1-2", ["SD-1", "SD-2", "UID", "BD-1", "LvD-1"])
    → { valid: true, actual_count: 5, min_required: 5 }
    ↓
PL: 并行调度5个子策划
```

### 示例2：错误流程（跳过阶段）

```
PL: 准备调度主策划进行文档整合
    ↓
phase-stage-guard.check_stage("Stage 1-1", "Stage 1-3")
    → { 
        allowed: false, 
        blocking_reason: "不能跳过 Stage 1-2",
        missing_prerequisites: ["Stage 1-2 子策划并行设计"],
        required_actions: ["先执行 Stage 1-2，调度子策划进行并行设计"]
      }
    ↓
PL: 收到错误，改为调度子策划
```

### 示例3：并行人数不足

```
PL: 准备调度子策划
    ↓
phase-stage-guard.validate_parallel_stage("Stage 1-2", ["SD-1"])
    → { 
        valid: false, 
        min_required: 5, 
        actual_count: 1,
        missing_roles: ["SD-2", "UID", "BD-1", "LvD-1"],
        warning: "Stage 1-2 至少需要5个子策划并行设计"
      }
    ↓
PL: 补充调度更多子策划
```

---

## 集成到 fullstack-game-engine

### 修改建议

在 `fullstack-game-engine` 中添加强制检查：

```markdown
## ⚠️ 强制阶段检查 ⭐新增

**PL在调度任何角色前，必须调用 phase-stage-guard 进行阶段检查。**

### 调度前检查流程

```
PL收到调度请求
    ↓
调用 phase-stage-guard.check_stage(current, target)
    ↓
检查通过？
    ├─ 是 → 执行调度
    └─ 否 → 返回错误，要求修正流程
```

### 禁止行为

| 禁止行为 | 后果 |
|---------|------|
| 跳过 Stage 1-2 直接进入 Stage 1-3 | 阻止调度，返回错误 |
| 跳过 Stage 2-2 直接进入 Stage 2-3 | 阻止调度，返回错误 |
| 并行阶段启动人数不足 | 阻止调度，返回警告 |
| 未解锁阻塞点就进入下一阶段 | 阻止调度，返回错误 |
```

---

## 注意事项

1. **强制执行**：此技能是强制性的，PL不能绕过
2. **状态持久化**：检查结果应记录到 state-manager
3. **错误恢复**：提供清晰的错误信息和修复建议
4. **日志记录**：所有检查结果应记录到项目日志

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-02-20 | 初始版本，创建流程阶段守卫功能 |
