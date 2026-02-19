---
name: "event-bus"
description: "事件总线，负责接收和分发游戏开发流程事件，实现流程推进和角色调度的解耦。支持事件订阅、历史查询和回放。"
---

# 事件总线

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **状态引用**：[state-manager](.trae/skills/state-manager/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程中的**事件流**，包括：
- 接收和分发流程事件
- 维护事件队列和历史
- 支持事件订阅和监听
- 事件回放和重放

> **注意**：本技能只负责事件管理，不定义开发流程。流程定义参见 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)。

> **核心原则**：流程推进由事件驱动，各技能只关注自己关心的事件

---

## 调用时机

**在以下时机调用：**
- 流程状态变更时：发布事件
- 需要监听特定事件时：订阅事件
- 需要追溯历史时：查询事件日志
- 需要调试时：回放事件

---

## 事件定义

### 事件结构 (EVENT)

```typescript
EVENT ::= {
  event_id: UUID,             // 事件唯一标识
  event_type: EVENT_TYPE,     // 事件类型
  timestamp: ISO8601,         // 发生时间
  
  payload: EVENT_PAYLOAD,     // 事件负载
  
  context: {
    project_name: STRING,
    state_id: UUID,           // 关联的状态ID（引用 state-manager）
    triggered_by: ROLE_ID     // 触发者
  },
  
  metadata: {
    version: "1.0",
    priority: "HIGH" | "NORMAL" | "LOW",
    correlation_id: UUID|null // 关联事件链
  }
}

EVENT_TYPE ::=
  // 流程事件（引用 fullstack-game-engine 定义）
  | "FLOW_INITIALIZED"        // 流程初始化
  | "PHASE_STARTED"           // 阶段开始
  | "PHASE_COMPLETED"         // 阶段完成
  | "STAGE_STARTED"           // 子阶段开始
  | "STAGE_COMPLETED"         // 子阶段完成
  
  // 阻塞点事件（引用 project-flow-manager 管理）
  | "BP_LOCKED"               // 阻塞点锁定
  | "BP_UNLOCKED"             // 阻塞点解锁
  | "BP_BLOCKED"              // 阻塞点阻塞
  
  // 角色事件（引用 hr-manager 分配）
  | "ROLE_ASSIGNED"           // 角色分配
  | "ROLE_STARTED"            // 角色开始工作
  | "ROLE_COMPLETED"          // 角色完成
  | "ROLE_FAILED"             // 角色失败
  
  // 产出物事件
  | "ARTIFACT_CREATED"        // 产出物创建
  | "ARTIFACT_MODIFIED"       // 产出物修改
  | "ARTIFACT_VALIDATED"      // 产出物验证
  
  // 验证事件（引用 qa-standards-manager 标准）
  | "VALIDATION_PASSED"       // 验证通过
  | "VALIDATION_FAILED"       // 验证失败
  
  // 状态事件（引用 state-manager 管理）
  | "STATE_SAVED"             // 状态保存
  | "STATE_ROLLED_BACK"       // 状态回滚
  | "ROLLBACK_COMPLETED"      // 回滚完成
  
  // 异常事件
  | "ERROR_OCCURRED"          // 错误发生
  | "EXCEPTION_GRANTED"       // 例外授权
  
  // 监控事件
  | "TIMEOUT_WARNING"         // 超时警告
  | "QUALITY_ALERT"           // 质量告警
```

---

## 核心接口

### 1. 发布事件

```
FUNCTION: publish(event: EVENT) → { success: BOOL, event_id: UUID }

输入:
  - event: 事件对象

输出:
  - success: 是否成功
  - event_id: 事件ID

示例:
  PL → event-bus.publish({
    event_type: "BP_UNLOCKED",
    payload: { bp_id: "BP-003", unlocked_by: "PL" },
    context: { project_name: "clicker-game", state_id: "uuid-001", triggered_by: "PL" }
  })
  返回: { success: true, event_id: "event-001" }
```

### 2. 订阅事件

```
FUNCTION: subscribe(
  event_types: [EVENT_TYPE],
  handler: FUNCTION,
  filter: EVENT_FILTER = {}
) → subscription_id

输入:
  - event_types: 关注的事件类型列表
  - handler: 事件处理函数
  - filter: 过滤条件

输出:
  - subscription_id: 订阅ID（用于取消订阅）

示例:
  PL → event-bus.subscribe(
    ["ROLE_COMPLETED", "VALIDATION_PASSED"],
    handle_role_completion,
    { project_name: "clicker-game" }
  )
  返回: "sub-001"
```

### 3. 获取事件历史

```
FUNCTION: get_event_log(
  filter: EVENT_FILTER,
  options: { limit: INT, offset: INT }
) → [EVENT]

EVENT_FILTER ::= {
  project_name: STRING|null,
  event_types: [EVENT_TYPE]|null,
  state_id: UUID|null,
  time_range: { from: ISO8601, to: ISO8601 }|null,
  triggered_by: ROLE_ID|null
}

示例:
  PL → event-bus.get_event_log(
    { project_name: "clicker-game", event_types: ["BP_UNLOCKED"] },
    { limit: 50, offset: 0 }
  )
  返回: [EVENT, EVENT, ...]
```

### 4. 事件回放

```
FUNCTION: replay_events(
  from_event_id: UUID,
  to_event_id: UUID,
  speed: "REALTIME" | "FAST" = "FAST"
) → REPLAY_RESULT

用于调试或恢复，按顺序重放事件

示例:
  PL → event-bus.replay_events("event-001", "event-050", "FAST")
```

---

## 事件处理流程

```
事件发布
    ↓
事件总线接收
    ↓
匹配订阅者
    ↓
并行分发给所有订阅者
    ↓
订阅者处理事件
    ↓
可选择发布新事件
```

---

## 数据存储规范

### 目录结构

```
projects/{project_name}/
├── .events/                         # 事件存储目录
│   ├── event_log.json               # 事件日志主文件
│   ├── event_index.json             # 事件索引
│   └── archive/                     # 归档事件（超过30天的）
│       └── events_{date}.json.gz
```

### 事件文件格式

```json
{
  "event_id": "event-001",
  "event_type": "BP_UNLOCKED",
  "timestamp": "2024-02-19T10:30:00Z",
  "payload": {
    "bp_id": "BP-003",
    "unlocked_by": "PL"
  },
  "context": {
    "project_name": "clicker-game",
    "state_id": "uuid-001",
    "triggered_by": "PL"
  },
  "metadata": {
    "version": "1.0",
    "priority": "HIGH",
    "correlation_id": null
  }
}
```

---

## 使用示例

### 完整流程事件管理

```
// 1. 流程初始化
PL → event-bus.publish({
  event_type: "FLOW_INITIALIZED",
  payload: { project_name: "clicker-game" },
  context: { project_name: "clicker-game", state_id: "uuid-001", triggered_by: "PL" }
})

// 2. Phase 1 开始
PL → event-bus.publish({
  event_type: "PHASE_STARTED",
  payload: { phase: 1 },
  context: { project_name: "clicker-game", state_id: "uuid-002", triggered_by: "PL" }
})

// 3. BP-002 解锁
PL → event-bus.publish({
  event_type: "BP_UNLOCKED",
  payload: { bp_id: "BP-002", unlocked_by: "LD" },
  context: { project_name: "clicker-game", state_id: "uuid-003", triggered_by: "LD" }
})

// 4. 角色完成
PL → event-bus.publish({
  event_type: "ROLE_COMPLETED",
  payload: { role_id: "SD-1", task: "M001" },
  context: { project_name: "clicker-game", state_id: "uuid-004", triggered_by: "SD-1" }
})
```

---

## 接口汇总

| 接口 | 输入 | 输出 | 调用方 |
|------|------|------|--------|
| `publish` | EVENT | {success, event_id} | PL/技能 |
| `subscribe` | event_types, handler, filter | subscription_id | PL/技能 |
| `get_event_log` | filter, options | [EVENT] | PL/技能 |
| `replay_events` | from_event_id, to_event_id, speed | REPLAY_RESULT | PL |

---

## 与状态管理器集成 ⭐新增

### 集成架构

```
┌─────────────────────────────────────────────────────────┐
│                    事件-状态集成架构                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐      状态查询/更新        ┌──────────────┐│
│   │ EventBus │ ←──────────────────────→ │ StateManager ││
│   └──────────┘                           └──────────────┘│
│        │                                          │      │
│        │         事件驱动状态变更                 │      │
│        └──────────────────────────────────────────┘      │
│                                                         │
│   集成点：                                               │
│   1. 事件发布时自动关联当前状态ID                        │
│   2. 支持按状态ID查询相关事件                            │
│   3. 支持事件驱动的状态变更                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 集成接口

#### 5. 获取指定状态相关的事件

```
FUNCTION: get_events_by_state(
  state_id: UUID,
  options: { 
    include_previous: BOOL = false,  // 是否包含前序状态的事件
    include_subsequent: BOOL = false, // 是否包含后续状态的事件
    event_types: [EVENT_TYPE]|null    // 事件类型过滤
  }
) → STATE_EVENTS

输入:
  - state_id: 状态ID
  - options: 查询选项

输出:
  - STATE_EVENTS: 状态相关事件集合

STATE_EVENTS ::= {
  state_id: UUID,
  created_by: EVENT_ID,           // 创建该状态的事件
  events_in_state: [EVENT],       // 该状态下发生的事件
  previous_chain: [EVENT]|null,   // 前序事件链（如果 include_previous=true）
  subsequent_chain: [EVENT]|null  // 后续事件链（如果 include_subsequent=true）
}

实现:
  1. 查询 event.context.state_id = state_id 的所有事件
  2. 如果 include_previous=true，递归查询 parent_state_id 链
  3. 如果 include_subsequent=true，查询该状态之后的所有事件

示例:
  PL → event-bus.get_events_by_state("uuid-003", { 
    include_previous: true, 
    event_types: ["BP_UNLOCKED", "ROLE_COMPLETED"] 
  })
  返回: {
    state_id: "uuid-003",
    created_by: "event-003",
    events_in_state: [
      { event_id: "event-004", event_type: "ROLE_STARTED", ... },
      { event_id: "event-005", event_type: "ARTIFACT_CREATED", ... }
    ],
    previous_chain: [
      { event_id: "event-001", event_type: "FLOW_INITIALIZED", ... },
      { event_id: "event-002", event_type: "BP_UNLOCKED", ... },
      { event_id: "event-003", event_type: "STATE_SAVED", ... }
    ]
  }
```

#### 6. 获取状态变更事件序列

```
FUNCTION: get_state_change_events(
  project_name: STRING,
  options: { 
    from_state_id: UUID|null,
    to_state_id: UUID|null,
    include_bp_events: BOOL = true,
    include_role_events: BOOL = true
  }
) → [STATE_CHANGE_EVENT]

输入:
  - project_name: 项目名称
  - options: 查询选项

输出:
  - [STATE_CHANGE_EVENT]: 状态变更事件序列

STATE_CHANGE_EVENT ::= {
  event_id: UUID,
  timestamp: ISO8601,
  event_type: "STATE_SAVED" | "STATE_ROLLED_BACK" | "BP_UNLOCKED" | "ROLE_COMPLETED" | ...,
  state_id: UUID,
  summary: STRING,
  details: OBJECT
}

实现:
  1. 查询项目相关的所有 STATE_SAVED 和 STATE_ROLLED_BACK 事件
  2. 根据选项包含 BP 解锁和角色完成事件
  3. 按时间顺序排序

示例:
  PL → event-bus.get_state_change_events("clicker-game", { 
    include_bp_events: true 
  })
  返回: [
    { event_id: "event-001", timestamp: "2024-02-19T10:00:00Z", event_type: "FLOW_INITIALIZED", state_id: "uuid-001", summary: "流程初始化", ... },
    { event_id: "event-002", timestamp: "2024-02-19T10:15:00Z", event_type: "BP_UNLOCKED", state_id: "uuid-002", summary: "BP-002 解锁", ... },
    { event_id: "event-003", timestamp: "2024-02-19T10:30:00Z", event_type: "STATE_SAVED", state_id: "uuid-002", summary: "检查点: BP-002-unlocked", ... },
    { event_id: "event-004", timestamp: "2024-02-19T11:00:00Z", event_type: "ROLE_COMPLETED", state_id: "uuid-003", summary: "SD-1 完成", ... },
    ...
  ]
```

#### 7. 订阅状态变更事件

```
FUNCTION: subscribe_state_changes(
  project_name: STRING,
  handler: FUNCTION,
  filter: { 
    state_types: ["CHECKPOINT" | "ROLLBACK" | "UPDATE"]|null,
    bp_ids: [BP-XXX]|null,
    role_ids: [ROLE_ID]|null
  } = {}
) → subscription_id

输入:
  - project_name: 项目名称
  - handler: 事件处理函数 (event) → void
  - filter: 过滤条件

输出:
  - subscription_id: 订阅ID

实现:
  1. 内部订阅 ["STATE_SAVED", "STATE_ROLLED_BACK"] 事件
  2. 根据 filter 条件过滤事件
  3. 调用 handler 处理符合条件的事件

示例:
  // 订阅所有检查点事件
  PL → event-bus.subscribe_state_changes(
    "clicker-game",
    (event) => { console.log(`检查点: ${event.payload.checkpoint_name}`) },
    { state_types: ["CHECKPOINT"] }
  )
  返回: "sub-state-001"
```

### 集成配置

```typescript
// 事件总线配置
EVENT_BUS_CONFIG ::= {
  // 状态管理器集成
  state_manager: {
    enabled: true,                    // 启用状态集成
    auto_link_state: true,            // 自动关联当前状态ID到事件
    persist_state_reference: true,    // 持久化状态引用
    enable_state_query: true          // 启用按状态查询
  },
  
  // 事件索引配置
  indexing: {
    by_state_id: true,                // 按状态ID索引
    by_event_type: true,              // 按事件类型索引
    by_timestamp: true,               // 按时间戳索引
    by_correlation_id: true           // 按关联ID索引
  }
}
```

### 使用示例

```
// 场景1: 发布事件时自动关联状态
PL → event-bus.publish({
  event_type: "BP_UNLOCKED",
  payload: { bp_id: "BP-003", unlocked_by: "LD" },
  context: { 
    project_name: "clicker-game", 
    state_id: "uuid-003",           // 自动关联当前状态
    triggered_by: "LD" 
  }
})

// 场景2: 查询某个状态下的所有事件
PL → event-bus.get_events_by_state("uuid-005", { include_previous: true })
  返回: 从初始状态到 uuid-005 的所有事件链

// 场景3: 获取完整的状态变更历史
PL → event-bus.get_state_change_events("clicker-game", {})
  返回: 项目的完整状态演进历史

// 场景4: 订阅状态变更
PL → event-bus.subscribe_state_changes("clicker-game", handler, { state_types: ["CHECKPOINT"] })
  // 每当创建检查点时，handler 被调用
```

---

## 注意事项

1. **事件管理专注**：本技能只负责事件管理，不定义流程
2. **流程引用**：事件类型引用 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) 定义的流程
3. **状态关联**：事件关联的状态ID引用 [state-manager](.trae/skills/state-manager/SKILL.md) 管理
4. **角色引用**：事件触发者引用 [hr-manager](.trae/skills/hr-manager/SKILL.md) 分配的角色
5. **阻塞点引用**：阻塞点事件引用 [project-flow-manager](.trae/skills/project-flow-manager/SKILL.md) 管理
6. **术语一致**：所有描述必须使用 [terminology-standard](.trae/skills/terminology-standard/SKILL.md) 定义的标准术语

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.1 | 2024-02-20 | 重构：明确职责边界，统一引用格式 |
| v1.0 | 2024-02-19 | 初始版本，支持完整事件流管理 |
