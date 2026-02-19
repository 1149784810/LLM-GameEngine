---
name: "event-bus"
description: "事件总线，负责接收和分发游戏开发流程事件，实现流程推进和角色调度的解耦。支持事件订阅、历史查询和回放。"
---

# 事件总线

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **状态引用**：[state-manager](.trae/skills/state-manager/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程中的**事件流**，包括：
- 接收和分发流程事件
- 维护事件队列和历史
- 支持事件订阅和监听
- 事件回放和重放

> **核心原则**：流程推进由事件驱动，各技能只关注自己关心的事件

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
    state_id: UUID,           // 关联的状态ID
    triggered_by: ROLE_ID     // 触发者
  },
  
  metadata: {
    version: "1.0",
    priority: "HIGH" | "NORMAL" | "LOW",
    correlation_id: UUID|null // 关联事件链
  }
}

EVENT_TYPE ::=
  // 流程事件
  | "FLOW_INITIALIZED"        // 流程初始化
  | "PHASE_STARTED"           // 阶段开始
  | "PHASE_COMPLETED"         // 阶段完成
  | "STAGE_STARTED"           // 子阶段开始
  | "STAGE_COMPLETED"         // 子阶段完成
  
  // 阻塞点事件
  | "BP_LOCKED"               // 阻塞点锁定
  | "BP_UNLOCKED"             // 阻塞点解锁
  | "BP_BLOCKED"              // 阻塞点阻塞
  
  // 角色事件
  | "ROLE_ASSIGNED"           // 角色分配
  | "ROLE_STARTED"            // 角色开始工作
  | "ROLE_COMPLETED"          // 角色完成
  | "ROLE_FAILED"             // 角色失败
  
  // 产出物事件
  | "ARTIFACT_CREATED"        // 产出物创建
  | "ARTIFACT_MODIFIED"       // 产出物修改
  | "ARTIFACT_VALIDATED"      // 产出物验证
  
  // 验证事件
  | "VALIDATION_PASSED"       // 验证通过
  | "VALIDATION_FAILED"       // 验证失败
  
  // 状态事件
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

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，支持完整事件流管理 |
