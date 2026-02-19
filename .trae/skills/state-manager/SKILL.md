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
FUNCTION: validate_state_consistency(state: STATE) → {
  valid: BOOL,
  errors: [CONSISTENCY_ERROR],
  warnings: [CONSISTENCY_WARNING]
}

CONSISTENCY_ERROR ::= 
  | ARTIFACT_MISSING { path: STRING }
  | ARTIFACT_CHECKSUM_MISMATCH { path: STRING, expected: SHA256, actual: SHA256 }
  | ROLE_STATE_INVALID { role_id: ROLE_ID, reason: STRING }
  | BP_STATE_INVALID { bp_id: BP-XXX, reason: STRING }
  | PARENT_STATE_NOT_FOUND { parent_state_id: UUID }

示例:
  PL → state-manager.validate_state_consistency(current_state)
  返回: {
    valid: false,
    errors: [
      { type: "ARTIFACT_MISSING", path: "docs/02-策划文档/SD-GAMEPLAY-20240219.md" }
    ],
    warnings: []
  }
```

### 7. 比较状态差异

```
FUNCTION: diff_states(
  state_a_id: UUID,
  state_b_id: UUID
) → STATE_DIFF

STATE_DIFF ::= {
  added_artifacts: [ARTIFACT_PATH],
  removed_artifacts: [ARTIFACT_PATH],
  modified_artifacts: [{ path: STRING, checksum_a: SHA256, checksum_b: SHA256 }],
  role_changes: [{ role_id: ROLE_ID, from: STATUS, to: STATUS }],
  bp_changes: [{ bp_id: BP-XXX, from: STATUS, to: STATUS }],
  position_change: { from: POSITION, to: POSITION }
}

示例:
  PL → state-manager.diff_states("uuid-002", "uuid-003")
  返回: {
    added_artifacts: ["docs/02-策划文档/SD-GAMEPLAY-20240219.md", ...],
    removed_artifacts: [],
    modified_artifacts: [],
    role_changes: [{ role_id: "SD-1", from: "IN_PROGRESS", to: "COMPLETED" }],
    bp_changes: [{ bp_id: "BP-003", from: "LOCKED", to: "UNLOCKED" }],
    position_change: { from: { phase: 1, stage: "1-2" }, to: { phase: 1, stage: "1-3" } }
  }
```

---

## 与事件总线集成 ⭐新增

### 集成架构

```
┌─────────────────────────────────────────────────────────┐
│                    状态-事件集成架构                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────┐      状态变更事件      ┌──────────┐ │
│   │ StateManager │ ─────────────────────→ │ EventBus │ │
│   └──────────────┘                        └──────────┘ │
│          ↑                                    │        │
│          │         历史事件查询               │        │
│          └────────────────────────────────────┘        │
│                                                         │
│   集成点：                                               │
│   1. save_checkpoint() → 发布 STATE_SAVED 事件         │
│   2. rollback_to()     → 查询事件历史 + 发布 ROLLBACK_COMPLETED │
│   3. 状态diff          → 生成 STATE_CHANGED 事件        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 集成接口

#### 8. 发布状态变更事件

```
FUNCTION: publish_state_change(
  previous_state: STATE|null,
  current_state: STATE,
  change_type: "CHECKPOINT" | "ROLLBACK" | "UPDATE"
) → { success: BOOL, event_id: UUID }

输入:
  - previous_state: 变更前状态（null表示初始状态）
  - current_state: 变更后状态
  - change_type: 变更类型

输出:
  - success: 是否成功
  - event_id: 事件ID

副作用:
  - 调用 event-bus.publish() 发布 STATE_SAVED 或 STATE_ROLLED_BACK 事件
  - 更新 current_state.event_log_anchor

事件负载格式:
  {
    event_type: "STATE_SAVED" | "STATE_ROLLED_BACK",
    payload: {
      state_id: UUID,
      previous_state_id: UUID|null,
      change_summary: {
        position_change: { from: POSITION, to: POSITION }|null,
        bp_changes: [{ bp_id: BP-XXX, from: STATUS, to: STATUS }],
        role_changes: [{ role_id: ROLE_ID, from: STATUS, to: STATUS }],
        artifact_changes: { added: INT, modified: INT, removed: INT }
      },
      change_type: "CHECKPOINT" | "ROLLBACK" | "UPDATE"
    },
    context: {
      project_name: STRING,
      state_id: UUID,
      triggered_by: "state-manager"
    }
  }

示例:
  // 在 save_checkpoint() 内部调用
  state-manager.publish_state_change(prev_state, new_state, "CHECKPOINT")
  返回: { success: true, event_id: "event-005" }
  // new_state.event_log_anchor 自动更新为 "event-005"
```

#### 9. 获取状态变更历史（基于事件）

```
FUNCTION: get_state_changes_via_events(
  state_id: UUID,
  options: { include_details: BOOL = false }
) → STATE_CHANGE_HISTORY

输入:
  - state_id: 状态ID
  - options: 选项

输出:
  - STATE_CHANGE_HISTORY: 状态变更历史

实现:
  1. 获取指定状态的 event_log_anchor
  2. 调用 event-bus.get_event_log() 查询相关事件
  3. 按时间顺序组装变更历史

STATE_CHANGE_HISTORY ::= {
  state_id: UUID,
  created_at: ISO8601,
  created_by_event: UUID,
  previous_state_id: UUID|null,
  change_chain: [{
    event_id: UUID,
    event_type: "STATE_SAVED" | "STATE_ROLLED_BACK" | "BP_UNLOCKED" | ...,
    timestamp: ISO8601,
    summary: STRING,
    details: OBJECT|null  // 当 include_details=true 时
  }]
}

示例:
  PL → state-manager.get_state_changes_via_events("uuid-003", { include_details: true })
  返回: {
    state_id: "uuid-003",
    created_at: "2024-02-19T10:30:00Z",
    created_by_event: "event-003",
    previous_state_id: "uuid-002",
    change_chain: [
      {
        event_id: "event-002",
        event_type: "BP_UNLOCKED",
        timestamp: "2024-02-19T10:15:00Z",
        summary: "阻塞点 BP-003 解锁",
        details: { bp_id: "BP-003", unlocked_by: "LD" }
      },
      {
        event_id: "event-003",
        event_type: "STATE_SAVED",
        timestamp: "2024-02-19T10:30:00Z",
        summary: "状态检查点: Stage-1-2-complete",
        details: { ... }
      }
    ]
  }
```

#### 10. 生成回滚计划（基于事件历史）

```
FUNCTION: generate_rollback_plan_with_events(
  current_state_id: UUID,
  target_state_id: UUID
) → ROLLBACK_PLAN_WITH_EVENTS

输入:
  - current_state_id: 当前状态ID
  - target_state_id: 目标状态ID

输出:
  - ROLLBACK_PLAN_WITH_EVENTS: 增强版回滚计划

实现:
  1. 调用 event-bus.get_event_log() 获取两个状态之间的事件
  2. 分析事件序列，识别需要逆向的操作
  3. 生成详细的回滚步骤

ROLLBACK_PLAN_WITH_EVENTS ::= {
  ...ROLLBACK_PLAN,
  event_analysis: {
    events_to_revert: [{
      event_id: UUID,
      event_type: EVENT_TYPE,
      revert_action: STRING,
      revert_payload: OBJECT
    }],
    events_to_replay: [EVENT_ID],  // 回滚后需要重放的事件
    side_effects: [STRING]         // 可能的副作用警告
  },
  step_by_step_guide: [STRING]     // 人类可读的操作步骤
}

示例:
  PL → state-manager.generate_rollback_plan_with_events("uuid-006", "uuid-003")
  返回: {
    target_state: STATE { ... },
    states_to_discard: ["uuid-004", "uuid-005", "uuid-006"],
    artifacts_to_remove: [...],
    artifacts_to_restore: [],
    roles_to_reassign: ["SD-1", "SD-2"],
    blocking_points_to_reset: ["BP-004"],
    event_analysis: {
      events_to_revert: [
        {
          event_id: "event-004",
          event_type: "ARTIFACT_CREATED",
          revert_action: "删除产出物",
          revert_payload: { path: "docs/02-策划文档/SD-1-xxx.md" }
        },
        {
          event_id: "event-005",
          event_type: "ROLE_COMPLETED",
          revert_action: "重置角色状态",
          revert_payload: { role_id: "SD-1", status: "PENDING" }
        }
      ],
      events_to_replay: [],
      side_effects: ["SD-1 的工作进度将丢失", "BP-004 将重新锁定"]
    },
    step_by_step_guide: [
      "1. 确认目标状态 uuid-003 (Stage-1-2-complete) 完整性",
      "2. 删除 uuid-004 至 uuid-006 的状态文件",
      "3. 删除产出物: docs/02-策划文档/SD-1-xxx.md",
      "4. 重置角色 SD-1 状态为 PENDING",
      "5. 锁定阻塞点 BP-004",
      "6. 创建新状态 uuid-007，标记为回滚结果"
    ]
  }
```

### 集成配置

```typescript
// 状态管理器配置
STATE_MANAGER_CONFIG ::= {
  // 事件总线集成
  event_bus: {
    enabled: true,                    // 启用事件集成
    auto_publish: true,               // 自动发布状态变更事件
    publish_on_checkpoint: true,      // 检查点时发布
    publish_on_rollback: true,        // 回滚时发布
    include_diff_in_event: true,      // 事件中包含差异详情
    event_history_limit: 1000         // 事件历史保留数量
  },
  
  // 回滚配置
  rollback: {
    use_event_history: true,          // 使用事件历史辅助回滚
    generate_step_guide: true,        // 生成步骤指南
    warn_on_side_effects: true        // 副作用警告
  }
}
```

### 使用示例

```
// 场景1: 保存检查点时自动发布事件
PL → state-manager.save_checkpoint(state, "Stage-1-2-complete", true)
  内部流程:
    1. 创建新状态 new_state
    2. 计算与 previous_state 的差异
    3. 调用 publish_state_change(previous_state, new_state, "CHECKPOINT")
    4. event-bus 发布 STATE_SAVED 事件
    5. 返回 new_state（包含更新的 event_log_anchor）

// 场景2: 回滚时查询事件历史
PL → state-manager.rollback_to("uuid-003")
  内部流程:
    1. 调用 generate_rollback_plan_with_events(current, target)
    2. 查询事件历史，分析需要逆向的操作
    3. 生成详细的回滚计划（包含步骤指南）
    4. 执行回滚操作
    5. 调用 publish_state_change(null, new_state, "ROLLBACK")
    6. event-bus 发布 STATE_ROLLED_BACK 事件
    7. 返回回滚结果

// 场景3: 查看状态完整历史
PL → state-manager.get_state_changes_via_events("uuid-005", { include_details: true })
  返回: 从初始状态到 uuid-005 的完整变更链
```

---

## 数据存储规范

### 目录结构

```
projects/{project_name}/
├── .state/                          # 状态存储目录
│   ├── state_INIT.json              # 初始状态
│   ├── state_{uuid}.json            # 各状态快照
│   ├── chain.json                   # 状态链索引
│   ├── checkpoints.json             # 检查点索引
│   └── archive/                     # 归档状态（超过30天的）
│       └── state_{uuid}.json.gz
```

### 状态文件格式

```json
{
  "state_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_state_id": null,
  "timestamp": "2024-02-19T10:30:00Z",
  "project_name": "clicker-game",
  "current_position": {
    "phase": 1,
    "stage": "1-2",
    "step": null
  },
  "blocking_points": {
    "BP-001": { "status": "UNLOCKED", "unlocked_at": "2024-02-19T10:00:00Z", "unlocked_by": "PL" },
    "BP-002": { "status": "UNLOCKED", "unlocked_at": "2024-02-19T10:15:00Z", "unlocked_by": "LD" },
    "BP-003": { "status": "LOCKED", "unlocked_at": null, "unlocked_by": null }
  },
  "active_roles": [
    {
      "role_id": "SD-1",
      "assigned_at": "2024-02-19T10:30:00Z",
      "task": "M001",
      "status": "IN_PROGRESS",
      "artifacts": []
    }
  ],
  "completed_roles": [],
  "artifacts": {},
  "event_log_anchor": "event-001",
  "metadata": {
    "version": "1.0",
    "schema_hash": "sha256:abc123...",
    "is_checkpoint": true,
    "checkpoint_name": "Stage-1-2-start"
  }
}
```

### 原子性保证

```
写入流程:
1. 计算新状态的 schema_hash
2. 写入到 .state/temp_{uuid}.json
3. 调用 fsync 确保落盘
4. 重命名为 state_{uuid}.json
5. 更新 chain.json
6. 如果是 checkpoint，更新 checkpoints.json
```

---

## 回滚策略

### 安全回滚原则

1. **只能回滚到检查点**：只有 is_checkpoint=true 的状态可以作为回滚目标
2. **回滚创建新状态**：不回写旧状态，而是基于旧状态创建新状态
3. **保留历史**：被回滚的状态仍然保留在历史中，便于审计
4. **PL确认**：回滚计划必须经 PL 确认后才执行

### 回滚执行流程

```
PL 请求回滚
    ↓
state-manager 验证目标状态
    ↓
state-manager 生成 rollback_plan
    ↓
PL 确认 rollback_plan
    ↓
state-manager 执行回滚:
  - 标记当前状态为 ROLLED_BACK
  - 基于目标状态创建新状态
  - 更新 active_roles
  - 重置 blocking_points
  - 通知 event-bus 发布 ROLLBACK_COMPLETED 事件
    ↓
PL 根据新状态重新调度
```

---

## 错误处理

### 状态损坏恢复

```
检测到状态文件损坏
    ↓
尝试从 parent_state_id 重建
    ↓
如果失败，尝试从最近检查点恢复
    ↓
如果失败，报告 PL 需要人工干预
```

### 并发冲突处理

```
如果两个操作同时修改状态:
  - 使用时间戳 + 乐观锁
  - 后提交的操作检测到版本冲突
  - 返回 ConcurrentModificationError
  - PL 需要重新获取状态后重试
```

---

## 使用示例

### 完整流程状态管理

```
// 1. 初始化项目
PL → state-manager.initialize_state("clicker-game")
返回: state_001 (INIT)

// 2. BP-001 解锁后保存检查点
PL → state-manager.save_checkpoint(state_001, "BP-001-unlocked", true)
返回: state_002

// 3. BP-002 解锁后保存检查点
PL → state-manager.save_checkpoint(state_002, "BP-002-unlocked", true)
返回: state_003

// 4. Stage 1-2 完成，所有子策划交付
PL → state-manager.save_checkpoint(state_003, "Stage-1-2-complete", true)
返回: state_004

// 5. 发现 SD-1 输出不合格，需要回滚到 Stage 1-2 开始
PL → state-manager.rollback_to(state_003.state_id)
返回: {
  success: true,
  new_state: state_005,
  rollback_plan: { ... }
}

// 6. 重新分配 SD-1 任务
PL 基于 state_005 重新调度 SD-1
```

---

## 接口汇总

| 接口 | 输入 | 输出 | 调用方 |
|------|------|------|--------|
| `initialize_state` | project_name | STATE | PL |
| `save_checkpoint` | STATE, name, is_checkpoint | STATE | PL |
| `load_state` | state_id | STATE | PL |
| `rollback_to` | target_state_id | {success, new_state, plan} | PL |
| `get_state_history` | filter | [STATE_SUMMARY] | PL |
| `validate_state_consistency` | STATE | {valid, errors} | PL |
| `diff_states` | state_a_id, state_b_id | STATE_DIFF | PL |

---

## 注意事项

1. **状态管理专注**：本技能只负责状态管理，不定义流程
2. **流程引用**：流程位置信息引用 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) 定义
3. **角色引用**：角色信息引用 [hr-manager](.trae/skills/hr-manager/SKILL.md) 分配
4. **事件集成**：状态变更通过 [event-bus](.trae/skills/event-bus/SKILL.md) 发布事件
5. **阻塞点引用**：阻塞点状态引用 [project-flow-manager](.trae/skills/project-flow-manager/SKILL.md) 管理
6. **术语一致**：所有描述必须使用 [terminology-standard](.trae/skills/terminology-standard/SKILL.md) 定义的标准术语

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.1 | 2024-02-20 | 重构：明确职责边界，统一引用格式 |
| v1.0 | 2024-02-19 | 初始版本，支持完整状态生命周期管理 |
