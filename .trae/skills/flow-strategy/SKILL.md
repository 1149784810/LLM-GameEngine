---
name: "flow-strategy"
version: "1.0.0"
description: "流程策略管理器，定义不同项目类型的流程策略，支持策略切换和动态调整。实现开闭原则，新增项目类型无需修改核心流程。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 4
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
    required_documents:
      - pattern: "strategies/.*-strategy\\.json"
        description: "流程策略配置"

execution:
  mode: "blocking"
  preconditions: []
  postconditions: []
  rollback:
    supported: false

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
    name: "get_strategy"
    signature: "get_strategy(project_type: STRING) -> STRATEGY"
    description: "获取流程策略"
  queries:
    - name: "list_strategies"
      signature: "list_strategies() -> [STRATEGY_INFO]"
      description: "列出所有可用策略"
---

# 流程策略管理器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程的**策略变体**，包括：
- 定义不同项目类型的流程策略
- 支持策略切换和动态调整
- 提供策略验证和推荐

> **核心原则**：新增项目类型只需添加策略，无需修改核心流程（开闭原则）

---

## 策略定义

### 策略结构 (STRATEGY)

```typescript
STRATEGY ::= {
  strategy_id: STRING,          // 策略标识
  project_type: PROJECT_TYPE,   // 项目类型
  
  // 阶段配置
  stages: {
    [stage_id: STRING]: STAGE_CONFIG
  },
  
  // 角色配置
  roles: {
    design: [ROLE_ID],          // 策划角色
    development: [ROLE_ID],     // 程序角色
    qa: [ROLE_ID]               // QA角色
  },
  
  // 跳过阶段
  skip_stages: [STAGE_ID],
  
  // 额外验证
  extra_validations: [VALIDATION_RULE],
  
  // 质量门槛调整
  quality_gates_adjustment: {
    [metric: STRING]: { threshold: NUMBER, operator: STRING }
  },
  
  metadata: {
    version: SEMVER,
    description: STRING,
    recommended_for: [STRING]
  }
}

PROJECT_TYPE ::=
  | "RPG"
  | "ACTION"
  | "STRATEGY"
  | "CASUAL"
  | "PUZZLE"
  | "SIMULATION"
  | "CUSTOM" { name: STRING }

STAGE_CONFIG ::= {
  required: BOOL,               // 是否必需
  parallel_count: INT,          // 并行角色数
  timeout_hours: INT,           // 超时时间
  auto_skip_condition: STRING|null  // 自动跳过条件
}
```

---

## 内置策略

### RPG游戏策略

```json
{
  "strategy_id": "rpg-standard",
  "project_type": "RPG",
  "stages": {
    "Stage 1-2": { "required": true, "parallel_count": 15, "timeout_hours": 72 },
    "Stage 2-2": { "required": true, "parallel_count": 14, "timeout_hours": 120 },
    "Stage 3-2": { "required": true, "parallel_count": 14, "timeout_hours": 48 }
  },
  "roles": {
    "design": ["SD-1", "SD-2", "UID", "BD-1", "BD-2", "LvD-1", "LvD-2", "CD-1", "CD-2", "3CD-1", "3CD-2", "ND-1", "ND-2", "TD", "AD"],
    "development": ["SkD-1", "SkD-2", "BkD-1", "BkD-2", "TA-1", "TA-2", "3CP-1", "3CP-2", "LvP-1", "LvP-2", "TDP", "AP", "UIP-1", "UIP-2"],
    "qa": ["QA-1", "QA-2", "QA-3", "QA-4", "QA-5", "QA-6", "VV-1", "VV-2"]
  },
  "skip_stages": [],
  "extra_validations": [
    { "type": "combat_balance_check" },
    { "type": "narrative_consistency_check" }
  ],
  "quality_gates_adjustment": {
    "completeness": { "threshold": 0.85, "operator": ">=" }
  }
}
```

### 休闲游戏策略

```json
{
  "strategy_id": "casual-minimal",
  "project_type": "CASUAL",
  "stages": {
    "Stage 1-2": { "required": true, "parallel_count": 6, "timeout_hours": 24 },
    "Stage 2-2": { "required": true, "parallel_count": 6, "timeout_hours": 48 },
    "Stage 3-2": { "required": false, "parallel_count": 0, "timeout_hours": 0 }
  },
  "roles": {
    "design": ["SD-1", "UID", "BD-1", "LvD-1", "TD", "AD"],
    "development": ["SkD-1", "TA-1", "LvP-1", "TDP", "AP", "UIP-1"],
    "qa": ["QA-1", "QA-3", "QA-5", "VV-1"]
  },
  "skip_stages": ["Stage 3-2"],
  "extra_validations": [],
  "quality_gates_adjustment": {
    "completeness": { "threshold": 0.7, "operator": ">=" }
  }
}
```

---

## 核心接口

### 1. 获取策略

```
FUNCTION: get_strategy(project_type: PROJECT_TYPE) → STRATEGY

输入:
  - project_type: 项目类型

输出:
  - STRATEGY: 策略定义

示例:
  PL → flow-strategy.get_strategy("RPG")
  返回: STRATEGY { ... }
```

### 2. 应用策略

```
FUNCTION: apply_strategy(strategy_id: STRING) → { success: BOOL, applied_strategy: STRATEGY }

输入:
  - strategy_id: 策略标识

输出:
  - success: 是否成功
  - applied_strategy: 应用的策略

示例:
  PL → flow-strategy.apply_strategy("rpg-standard")
  返回: { success: true, applied_strategy: STRATEGY { ... } }
```

### 3. 验证策略

```
FUNCTION: validate_strategy(strategy: STRATEGY) → { valid: BOOL, errors: [STRING] }

输入:
  - strategy: 策略定义

输出:
  - valid: 是否有效
  - errors: 错误列表

示例:
  PL → flow-strategy.validate_strategy(custom_strategy)
  返回: { valid: false, errors: ["Stage 1-2 parallel_count exceeds maximum"] }
```

### 4. 注册自定义策略

```
FUNCTION: register_strategy(strategy: STRATEGY) → { success: BOOL, strategy_id: STRING }

输入:
  - strategy: 策略定义

输出:
  - success: 是否成功
  - strategy_id: 策略标识

示例:
  PL → flow-strategy.register_strategy({
    project_type: "CUSTOM",
    stages: { ... },
    roles: { ... }
  })
  返回: { success: true, strategy_id: "custom-001" }
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，支持策略管理 |
