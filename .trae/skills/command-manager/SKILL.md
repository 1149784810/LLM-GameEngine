---
name: "command-manager"
version: "1.0.0"
description: "命令管理器，负责封装流程操作为命令，支持命令的撤销(Undo)和重做(Redo)。实现操作的完整可追溯性。"
author: "engine-team"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 2
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "状态管理"
  - name: "event-bus"
    layer: 2
    type: "required"
    purpose: "事件总线"

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
    name: "execute_command"
    signature: "execute_command(command: COMMAND) -> RESULT"
    description: "执行命令"
  state_managers:
    - name: "undo"
      signature: "undo() -> RESULT"
      description: "撤销上一个命令"
    - name: "redo"
      signature: "redo() -> RESULT"
      description: "重做命令"
---

# 命令管理器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **状态引用**：[state-manager](.trae/skills/state-manager/SKILL.md)
> 
> **事件引用**：[event-bus](.trae/skills/event-bus/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程中的**命令生命周期**，包括：
- 封装流程操作为命令
- 支持命令的撤销（Undo）和重做（Redo）
- 维护命令历史
- 命令分组和批处理

> **核心原则**：每个可撤销操作都必须封装为命令，确保操作可追溯

---

## 命令定义

### 命令结构 (COMMAND)

```typescript
COMMAND ::= {
  command_id: UUID,           // 命令唯一标识
  command_type: COMMAND_TYPE, // 命令类型
  
  payload: COMMAND_PAYLOAD,   // 命令负载
  
  context: {
    project_name: STRING,
    state_id: UUID,           // 执行时的状态ID
    executed_by: ROLE_ID      // 执行者
  },
  
  // 执行记录
  execution: {
    status: "PENDING" | "EXECUTED" | "UNDONE" | "REDONE",
    executed_at: ISO8601|null,
    undone_at: ISO8601|null,
    redone_at: ISO8601|null
  },
  
  // 反向命令（用于撤销）
  inverse_command: COMMAND|null,
  
  // 影响范围
  affected_states: [UUID],    // 影响的状态ID
  affected_artifacts: [ARTIFACT_PATH],  // 影响的产出物
  
  metadata: {
    description: STRING,
    is_undoable: BOOL,        // 是否可撤销
    is_redoable: BOOL,        // 是否可重做
    group_id: UUID|null       // 命令组ID（用于批处理）
  }
}

COMMAND_TYPE ::=
  // 流程推进命令
  | "ADVANCE_TO" { stage: STAGE_ID }
  | "UNLOCK_BP" { bp_id: BP-XXX }
  
  // 角色管理命令
  | "ASSIGN_ROLE" { role_id: ROLE_ID, task: TASK_ID }
  | "REMOVE_ROLE" { role_id: ROLE_ID }
  | "COMPLETE_ROLE" { role_id: ROLE_ID, artifacts: [ARTIFACT_PATH] }
  | "FAIL_ROLE" { role_id: ROLE_ID, reason: STRING }
  
  // 状态管理命令
  | "SAVE_CHECKPOINT" { name: STRING }
  | "ROLLBACK_TO" { target_state_id: UUID }
  
  // 验证命令
  | "VALIDATE_OUTPUT" { role_id: ROLE_ID }
  | "GRANT_EXCEPTION" { role_id: ROLE_ID, checks: [CHECK_TYPE] }
  
  // 策略命令
  | "APPLY_STRATEGY" { strategy_id: STRING }
  | "UPDATE_CONTRACT" { role_id: ROLE_ID, updates: OBJECT }
  
  // 批量命令
  | "BATCH_COMMANDS" { commands: [COMMAND] }
```

---

## 核心接口

### 1. 执行命令

```
FUNCTION: execute(command: COMMAND) → { 
  success: BOOL, 
  result: COMMAND_RESULT,
  new_state: STATE 
}

COMMAND_RESULT ::= {
  command_id: UUID,
  status: "SUCCESS" | "FAILED" | "PARTIAL",
  output: ANY,
  errors: [STRING],
  events_generated: [EVENT_ID]
}

示例:
  PL → command-manager.execute({
    command_type: "ASSIGN_ROLE",
    payload: { role_id: "SD-1", task: "M001" },
    context: { project_name: "clicker-game", state_id: "uuid-001", executed_by: "PL" }
  })
  返回: {
    success: true,
    result: { command_id: "cmd-001", status: "SUCCESS", ... },
    new_state: STATE { ... }
  }
```

### 2. 撤销命令

```
FUNCTION: undo(command_id: UUID|null = null) → { 
  success: BOOL, 
  undone_command: COMMAND,
  new_state: STATE 
}

输入:
  - command_id: 要撤销的命令ID（null表示撤销最后一个）

输出:
  - success: 是否成功
  - undone_command: 被撤销的命令
  - new_state: 撤销后的新状态

约束:
  - 只能撤销 is_undoable=true 的命令
  - 撤销操作本身会创建新命令（便于重做）
  - 撤销后必须通过 state-manager 保存新状态

示例:
  PL → command-manager.undo("cmd-001")
  返回: {
    success: true,
    undone_command: COMMAND { command_type: "ASSIGN_ROLE", ... },
    new_state: STATE { ... }
  }
```

### 3. 重做命令

```
FUNCTION: redo(command_id: UUID|null = null) → { 
  success: BOOL, 
  redone_command: COMMAND,
  new_state: STATE 
}

输入:
  - command_id: 要重做的命令ID（null表示重做最后一个撤销的）

约束:
  - 只能重做 is_redoable=true 的命令
  - 重做后必须通过 state-manager 保存新状态

示例:
  PL → command-manager.redo("cmd-001")
  返回: {
    success: true,
    redone_command: COMMAND { command_type: "ASSIGN_ROLE", ... },
    new_state: STATE { ... }
  }
```

### 4. 获取命令历史

```
FUNCTION: get_command_history(
  filter: COMMAND_FILTER,
  options: { limit: INT, offset: INT }
) → [COMMAND_SUMMARY]

COMMAND_FILTER ::= {
  project_name: STRING|null,
  command_types: [COMMAND_TYPE]|null,
  status: COMMAND_STATUS|null,
  time_range: { from: ISO8601, to: ISO8601 }|null,
  executed_by: ROLE_ID|null
}

COMMAND_SUMMARY ::= {
  command_id: UUID,
  command_type: COMMAND_TYPE,
  description: STRING,
  status: COMMAND_STATUS,
  executed_at: ISO8601,
  is_undoable: BOOL
}

示例:
  PL → command-manager.get_command_history(
    { project_name: "clicker-game", status: "EXECUTED" },
    { limit: 20, offset: 0 }
  )
  返回: [COMMAND_SUMMARY, ...]
```

### 5. 批量执行

```
FUNCTION: execute_batch(
  commands: [COMMAND],
  options: { atomic: BOOL = true, stop_on_error: BOOL = true }
) → BATCH_RESULT

BATCH_RESULT ::= {
  overall_success: BOOL,
  results: [{ command_id: UUID, success: BOOL, result: COMMAND_RESULT }],
  completed_count: INT,
  failed_count: INT,
  final_state: STATE
}

约束:
  - atomic=true 时，任一失败则全部回滚
  - 批量命令可以作为一个整体撤销

示例:
  PL → command-manager.execute_batch([
    { command_type: "ASSIGN_ROLE", payload: { role_id: "SD-1", ... } },
    { command_type: "ASSIGN_ROLE", payload: { role_id: "SD-2", ... } },
    { command_type: "ASSIGN_ROLE", payload: { role_id: "UID", ... } }
  ], { atomic: true })
  返回: {
    overall_success: true,
    results: [...],
    completed_count: 3,
    failed_count: 0,
    final_state: STATE { ... }
  }
```

---

## 命令分组

### 批处理命令组

```
// 将多个命令作为一个组，可以整体撤销
FUNCTION: create_command_group(
  description: STRING
) → group_id: UUID

// 在组内添加命令
FUNCTION: add_to_group(
  group_id: UUID,
  command: COMMAND
) → VOID

// 执行整个组
FUNCTION: execute_group(
  group_id: UUID
) → BATCH_RESULT

// 撤销整个组
FUNCTION: undo_group(
  group_id: UUID
) → { success: BOOL, undone_commands: [COMMAND] }
```

---

## 与状态管理器集成

### 命令执行触发状态保存

```
当命令执行成功时:
  1. command-manager 执行命令
  2. 生成 inverse_command（用于撤销）
  3. 调用 state-manager.save_checkpoint()
  4. 新状态中记录 command_executed=command_id

当命令撤销时:
  1. command-manager 执行 inverse_command
  2. 调用 state-manager.save_checkpoint()
  3. 新状态中记录 command_undone=command_id
```

### 状态中的命令信息

```
STATE.metadata.command_history = {
  last_executed: UUID|null,
  last_undone: UUID|null,
  command_count: INT,
  undo_stack: [UUID],
  redo_stack: [UUID]
}
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，支持完整命令生命周期管理 |
