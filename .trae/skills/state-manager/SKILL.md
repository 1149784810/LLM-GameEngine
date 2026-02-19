---
name: "state-manager"
description: "状态管理器，负责维护游戏开发流程的完整状态、历史记录和快照回滚。确保流程状态可追溯、可回滚、数据一致性。"
---

# 状态管理器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **事件引用**：[event-bus](.trae/skills/event-bus/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程的**状态生命周期**，包括：
- 状态快照创建与存储
- 状态历史记录维护
- 状态回滚与恢复
- 数据一致性验证
- 并发状态隔离

> **注意**：本技能只负责状态管理，不定义开发流程。流程定义参见 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)。

> **核心原则**：每个状态变更都必须原子化，支持回滚，确保数据一致性

---

## 调用时机

**由 PL 在以下时机调用：**
- 流程初始化时：创建初始状态
- 每个阻塞点解锁前：保存状态快照
- 每个阶段完成时：保存状态快照
- 需要回滚时：加载历史状态
- 流程异常时：诊断状态历史

---

## 状态定义

### 状态结构 (STATE)

```typescript
STATE ::= {
  // 元数据
  state_id: UUID,              // 状态唯一标识
  parent_state_id: UUID|null,  // 父状态（用于回滚链）
  timestamp: ISO8601,          // 创建时间
  project_name: STRING,        // 项目名称
  
  // 流程位置（引用 fullstack-game-engine 定义）
  current_position: {
    phase: Phase,              // Phase 0-4
    stage: Stage,              // Stage X-Y
    step: Step|null            // Step X-Y-Z (可选)
  },
  
  // 阻塞点状态（引用 project-flow-manager 管理）
  blocking_points: {
    [bp_id: BP-XXX]: {
      status: "LOCKED" | "UNLOCKED",
      unlocked_at: ISO8601|null,
      unlocked_by: ROLE_ID|null
    }
  },
  
  // 活跃角色（引用 hr-manager 分配）
  active_roles: [{
    role_id: ROLE_ID,
    assigned_at: ISO8601,
    task: TASK_ID,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
    artifacts: [ARTIFACT_PATH]
  }],
  
  // 已完成角色
  completed_roles: [{
    role_id: ROLE_ID,
    completed_at: ISO8601,
    artifacts: [ARTIFACT_PATH],
    validation_result: VALIDATION_RESULT
  }],
  
  // 产出物清单
  artifacts: {
    [artifact_path: STRING]: {
      checksum: SHA256,
      created_by: ROLE_ID,
      created_at: ISO8601,
      schema_version: STRING,
      validated: BOOL
    }
  },
  
  // 事件日志引用（关联 event-bus）
  event_log_anchor: EVENT_ID,  // 关联到 event-bus 的事件ID
  
  // 元数据
  metadata: {
    version: "1.0",
    schema_hash: SHA256,       // 状态结构校验
    is_checkpoint: BOOL        // 是否为检查点（可回滚）
  }
}
```

### 状态类型

| 类型 | 标识 | 说明 | 回滚支持 |
|------|------|------|---------|
| **初始状态** | INIT | 流程开始时的空状态 | ❌ |
| **检查点** | CHECKPOINT | 关键节点保存的状态 | ✅ |
| **临时状态** | TEMP | 阶段中的中间状态 | ❌ |
| **终态** | FINAL | 流程完成状态 | ❌ |
| **错误状态** | ERROR | 异常终止状态 | ✅ |

---

## 核心接口

### 1. 创建初始状态

```
FUNCTION: initialize_state(project_name: STRING) → STATE

输入:
  - project_name: 项目名称

输出:
  - STATE: 初始状态对象

副作用:
  - 创建 projects/{project_name}/.state/ 目录
  - 写入 state_INIT.json
  - 初始化状态链

示例:
  PL → state-manager.initialize_state("clicker-game")
  返回: STATE { state_id: "uuid-001", current_position: { phase: 0, stage: "0-0" }, ... }
```

### 2. 保存状态快照

```
FUNCTION: save_checkpoint(
  current_state: STATE,
  checkpoint_name: STRING,
  is_checkpoint: BOOL = true
) → STATE

输入:
  - current_state: 当前状态
  - checkpoint_name: 检查点名称（如 "BP-003-unlocked"）
  - is_checkpoint: 是否标记为可回滚检查点

输出:
  - new_state: 新状态对象

约束:
  - 必须验证 current_state 的 schema_hash
  - 必须原子化写入（先写临时文件，再重命名）
  - 必须更新 parent_state_id 链

示例:
  PL → state-manager.save_checkpoint(state, "Stage-1-2-complete", true)
  返回: STATE { state_id: "uuid-002", parent_state_id: "uuid-001", ... }
```

### 3. 加载历史状态

```
FUNCTION: load_state(state_id: UUID) → STATE

输入:
  - state_id: 状态ID

输出:
  - STATE: 状态对象

错误:
  - StateNotFoundError: 状态不存在
  - StateCorruptedError: 状态文件损坏
  - SchemaMismatchError: 状态结构版本不匹配

示例:
  PL → state-manager.load_state("uuid-001")
  返回: STATE { ... }
```

### 4. 状态回滚

```
FUNCTION: rollback_to(target_state_id: UUID) → { 
  success: BOOL, 
  new_state: STATE,
  rollback_plan: ROLLBACK_PLAN 
}

输入:
  - target_state_id: 目标状态ID

输出:
  - success: 是否成功
  - new_state: 回滚后的新状态
  - rollback_plan: 回滚执行计划

ROLLBACK_PLAN ::= {
  target_state: STATE,
  states_to_discard: [STATE_ID],
  artifacts_to_remove: [ARTIFACT_PATH],
  artifacts_to_restore: [ARTIFACT_PATH],
  roles_to_reassign: [ROLE_ID],
  blocking_points_to_reset: [BP-XXX]
}

约束:
  - 只能回滚到标记为 is_checkpoint=true 的状态
  - 必须验证目标状态的完整性
  - 必须生成详细的回滚计划供 PL 确认
  - 回滚操作本身会创建新状态（便于追踪）

示例:
  PL → state-manager.rollback_to("uuid-003")
  返回: {
    success: true,
    new_state: STATE { state_id: "uuid-010", parent_state_id: "uuid-003", ... },
    rollback_plan: {
      target_state: STATE { ... },
      states_to_discard: ["uuid-004", "uuid-005", "uuid-006"],
      artifacts_to_remove: ["docs/02-策划文档/SD-*.md"],
      artifacts_to_restore: [],
      roles_to_reassign: ["SD-1", "SD-2"],
      blocking_points_to_reset: ["BP-004"]
    }
  }
```

### 5. 获取状态历史

```
FUNCTION: get_state_history(
  from_state_id: UUID|null = null,
  to_state_id: UUID|null = null,
  filter: FILTER = {}
) → [STATE_SUMMARY]

STATE_SUMMARY ::= {
  state_id: UUID,
  timestamp: ISO8601,
  checkpoint_name: STRING,
  current_position: POSITION,
  active_roles_count: INT,
  completed_roles_count: INT,
  artifacts_count: INT,
  is_checkpoint: BOOL
}

示例:
  PL → state-manager.get_state_history()
  返回: [
    { state_id: "uuid-001", checkpoint_name: "INIT", ... },
    { state_id: "uuid-002", checkpoint_name: "BP-002-unlocked", ... },
    { state_id: "uuid-003", checkpoint_name: "BP-003-unlocked", ... }
  ]
```

### 6. 验证状态一致性

```
FUNCTION: validate_state_consistency(state: STATE) →