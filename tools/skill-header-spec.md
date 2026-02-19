# 技能头部元数据规范 (Skill Header Metadata Specification)

> **版本**: v1.0.0  
> **创建日期**: 2026-02-20  
> **状态**: 正式规范

---

## 一、概述

### 1.1 目的

本规范定义了全栈游戏开发引擎中所有技能文件(SKILL.md)的头部元数据结构，实现：

- **自描述性**: 技能能被自动化脚本解析和理解
- **可验证性**: 输入输出、前置后置条件可自动验证
- **可追溯性**: 执行状态可追踪，支持回滚决策
- **可组合性**: 技能间依赖关系清晰，支持自动化调度
- **质量把关**: 审核和测试环节有明确的验证标准

### 1.2 适用范围

- 所有 `.trae/skills/*/SKILL.md` 文件
- 新建技能必须遵循本规范
- 现有技能应逐步迁移至本规范

---

## 二、头部元数据结构

### 2.1 完整结构

```yaml
---
# ==================== 元数据块 ====================
name: "skill-name"
version: "1.0.0"
description: "技能描述，<200字符"
author: "engine-team"
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"

# ==================== 依赖定义 ====================
layer: 0-4
dependencies:
  - name: "dependency-skill"
    layer: 0
    type: "required"          # required | optional | conditional
    purpose: "依赖目的说明"

# ==================== 契约定义块 ====================
contracts:
  input:
    required_documents:
      - pattern: "REGEX_PATTERN"
        schema: "schema-file.json"
        description: "文档描述"
    optional_documents: []
    validation_rules: []
    
  output:
    required_documents: []
    validation_rules: []
    quality_gates: []

# ==================== 执行定义块 ====================
execution:
  mode: "blocking"             # blocking | parallel | conditional
  preconditions: []
  postconditions: []
  rollback:
    supported: true
    strategy: "checkpoint"     # checkpoint | snapshot | none
    rollback_point: "BP-XXX"
    side_effects: []
    recovery_actions: []

# ==================== 质量定义块 ====================
quality:
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false
    anti_hallucination:
      enabled: false
      level: "LEVEL_1"         # LEVEL_1 | LEVEL_2 | LEVEL_3
      min_screenshots: 3
      max_pass_rate: 1.0
  review:
    required: false
    reviewer: ""
    checklist: []

# ==================== 状态追踪块 ====================
tracking:
  execution_status:
    current: "PENDING"         # PENDING | IN_PROGRESS | COMPLETED | FAILED | ROLLED_BACK
    started_at: null
    completed_at: null
    duration_ms: null
  error_codes: []
  checkpoints: []
  state_transitions: []

# ==================== 伪函数定义块 ====================
functions:
  main: {}
  validators: []
  state_managers: []
  queries: []
---
```

---

## 三、字段详细定义

### 3.1 元数据块 (Metadata Block)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 技能唯一标识符，与目录名一致 |
| `version` | string | ✅ | 语义化版本号，格式：`vX.Y.Z` |
| `description` | string | ✅ | 简短描述，<200字符，包含功能和调用时机 |
| `author` | string | ⬜ | 作者/团队 |
| `created_at` | date | ⬜ | 创建日期，格式：`YYYY-MM-DD` |
| `updated_at` | date | ⬜ | 最后更新日期 |

### 3.2 依赖定义 (Dependencies Block)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `layer` | number | ✅ | 技能层级 (0-4)，参见 skill-development-guide |
| `dependencies` | array | ✅ | 依赖列表（可为空数组） |

**依赖项结构**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 依赖技能名称 |
| `layer` | number | ✅ | 依赖技能层级 |
| `type` | string | ✅ | 依赖类型：`required`/`optional`/`conditional` |
| `purpose` | string | ⬜ | 依赖目的说明 |

**层级规则**：
- Layer 0: 基础设施层（无依赖）
- Layer 1: 核心定义层（依赖Layer 0）
- Layer 2: 管理工具层（依赖Layer 0-1）
- Layer 3: 业务逻辑层（依赖Layer 0-2）
- Layer 4: 辅助工具层（依赖Layer 0-3）

**约束**：
- 只能依赖同层或下层技能
- 禁止循环依赖

### 3.3 契约定义块 (Contracts Block)

#### 3.3.1 输入契约 (Input Contract)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `required_documents` | array | ✅ | 必需输入文档列表 |
| `optional_documents` | array | ⬜ | 可选输入文档列表 |
| `validation_rules` | array | ⬜ | 输入验证规则 |

**文档规范结构**：

```yaml
- pattern: "REQ-SPLIT-.*\\.md"    # 文件名正则模式
  schema: "schema-file.json"       # JSON Schema引用
  description: "文档描述"          # 说明
  min_size: 1024                   # 最小文件大小（字节）
  required_sections:               # 必需章节
    - "概述"
    - "详细内容"
```

#### 3.3.2 输出契约 (Output Contract)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `required_documents` | array | ✅ | 必需输出文档列表 |
| `validation_rules` | array | ⬜ | 输出验证规则 |
| `quality_gates` | array | ⬜ | 质量门槛 |

**验证规则类型**：

| 类型 | 说明 | 示例 |
|------|------|------|
| `SCHEMA_VALIDATION` | JSON Schema验证 | `{ type: "SCHEMA_VALIDATION", strict: true }` |
| `CONTENT_CHECK` | 内容模式检查 | `{ type: "CONTENT_CHECK", pattern: "核心.*循环" }` |
| `WORD_COUNT` | 字数检查 | `{ type: "WORD_COUNT", min: 500, max: 5000 }` |
| `FILE_EXISTS` | 文件存在检查 | `{ type: "FILE_EXISTS", path: "..." }` |
| `EVIDENCE_VALIDATION` | 证据验证 | `{ type: "EVIDENCE_VALIDATION", evidence_type: "screenshot", min_count: 5 }` |
| `ANTI_HALLUCINATION_CHECK` | 反幻觉检查 | `{ type: "ANTI_HALLUCINATION_CHECK", indicators: [...] }` |

**质量门槛结构**：

```yaml
quality_gates:
  - metric: "completeness"        # 指标名称
    threshold: 0.8                # 阈值
    operator: ">="                # 比较运算符
    required: true                # 是否必需
```

### 3.4 执行定义块 (Execution Block)

#### 3.4.1 执行模式

| 模式 | 说明 | 示例技能 |
|------|------|---------|
| `blocking` | 阻塞式执行，必须完成后才能继续 | fullstack-engine-init |
| `parallel` | 并行执行，可多人同时进行 | hr-manager |
| `conditional` | 条件执行，根据条件决定 | project-optimizer |

#### 3.4.2 前置条件 (Preconditions)

```yaml
preconditions:
  - type: "BP_UNLOCKED"           # 阻塞点已解锁
    target: "BP-003"
    description: "阻塞点BP-003已解锁"
    
  - type: "ROLE_COMPLETED"        # 角色已完成
    target: "LD"
    description: "主策划需求拆分完成"
    
  - type: "ARTIFACT_EXISTS"       # 产出物存在
    target: "docs/01-需求文档/REQ-SPLIT-*.md"
    description: "需求拆分文档存在"
```

#### 3.4.3 后置条件 (Postconditions)

```yaml
postconditions:
  - type: "BP_UNLOCK"             # 解锁阻塞点
    target: "BP-004"
    description: "解锁阻塞点BP-004"
    
  - type: "ARTIFACT_CREATED"      # 创建产出物
    target: "docs/02-策划文档/SD-*.md"
    description: "创建策划设计文档"
    
  - type: "STATE_UPDATE"          # 状态更新
    target: "current_position.stage"
    value: "Stage-1-2"
```

#### 3.4.4 回滚策略 (Rollback)

```yaml
rollback:
  supported: true                 # 是否支持回滚
  strategy: "checkpoint"          # 回滚策略
  rollback_point: "BP-003"        # 回滚点
  side_effects:                   # 副作用说明
    - "删除已创建的策划文档"
    - "重置角色状态为PENDING"
  recovery_actions:               # 恢复动作
    - action: "DELETE_ARTIFACTS"
      target: "docs/02-策划文档/SD-*.md"
    - action: "RESET_ROLE_STATUS"
      target: "SD-1"
      value: "PENDING"
```

### 3.5 质量定义块 (Quality Block)

#### 3.5.1 验收标准

```yaml
acceptance_criteria:
  - id: "AC-001"
    description: "文档完整性"
    metric: "completeness"
    threshold: 0.8
    operator: ">="
    required: true
```

#### 3.5.2 测试要求

```yaml
testing:
  required_tests:
    - type: "FT"                  # 功能测试
      description: "功能测试"
      required: true
    - type: "VT"                  # 视觉测试
      description: "视觉测试"
      required: true
  evidence_required: true         # 是否需要证据
  anti_hallucination:
    enabled: true
    level: "LEVEL_2"              # 反幻觉级别
    min_screenshots: 5
    max_pass_rate: 0.95
```

**反幻觉级别**：

| 级别 | 适用项目 | 截图要求 | 通过率限制 |
|------|---------|---------|-----------|
| LEVEL_1 | 小型(<10功能点) | ≥3张 | 无限制 |
| LEVEL_2 | 中型(10-30功能点) | ≥5张 | ≤95% |
| LEVEL_3 | 大型(>30功能点) | ≥9张 | ≤90% |

#### 3.5.3 审核要求

```yaml
review:
  required: true
  reviewer: "LD"                  # 审核角色
  checklist:
    - "需求符合度检查"
    - "设计完整性检查"
    - "术语一致性检查"
```

### 3.6 状态追踪块 (Tracking Block)

#### 3.6.1 执行状态

```yaml
execution_status:
  current: "PENDING"              # 当前状态
  started_at: null                # 开始时间
  completed_at: null              # 完成时间
  duration_ms: null               # 执行时长(毫秒)
```

**状态值**：

| 状态 | 说明 |
|------|------|
| `PENDING` | 待执行 |
| `IN_PROGRESS` | 执行中 |
| `COMPLETED` | 已完成 |
| `FAILED` | 执行失败 |
| `ROLLED_BACK` | 已回滚 |

#### 3.6.2 错误码映射

```yaml
error_codes:
  - code: "E301"
    name: "CONTRACT_VALIDATION_FAILED"
    severity: "HIGH"              # LOW | MEDIUM | HIGH | CRITICAL
    rollback_required: true       # 是否需要回滚
```

#### 3.6.3 检查点定义

```yaml
checkpoints:
  - id: "CP-001"
    name: "输入验证完成"
    position: "after_input_validation"
    rollback_supported: true
```

#### 3.6.4 状态转换

```yaml
state_transitions:
  - from: "PENDING"
    to: "IN_PROGRESS"
    trigger: "start_execution"
  - from: "IN_PROGRESS"
    to: "COMPLETED"
    trigger: "execution_success"
```

### 3.7 伪函数定义块 (Functions Block)

```yaml
functions:
  main:
    name: "execute"
    signature: "execute(input: INPUT) → OUTPUT"
    description: "执行技能主逻辑"
    
  validators:
    - name: "validate_input"
      signature: "validate_input(artifacts: [PATH]) → RESULT"
      description: "验证输入契约"
      
  state_managers:
    - name: "save_checkpoint"
      signature: "save_checkpoint(state: STATE) → STATE"
      description: "保存状态检查点"
      
  queries:
    - name: "get_status"
      signature: "get_status() → STATUS"
      description: "获取当前执行状态"
```

---

## 四、简化模板

对于简单技能，可使用简化模板：

```yaml
---
name: "simple-skill"
version: "1.0.0"
description: "简单技能描述"
layer: 0
dependencies: []

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
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
---
```

---

## 五、验证规则

### 5.1 必需字段验证

解析器必须验证以下字段存在：

- `name`
- `version`
- `description`
- `layer`
- `dependencies`
- `contracts.input`
- `contracts.output`
- `execution.mode`
- `execution.rollback.supported`

### 5.2 类型验证

| 字段 | 期望类型 |
|------|---------|
| `name` | string |
| `version` | string (匹配 `v?\d+\.\d+(\.\d+)?`) |
| `layer` | number (0-4) |
| `dependencies` | array |
| `contracts` | object |

### 5.3 逻辑验证

1. **层级验证**: 所有依赖的layer <= 当前技能的layer
2. **循环依赖验证**: 依赖图中无环
3. **契约完整性**: input/output至少定义required_documents

---

## 六、版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0.0 | 2026-02-20 | 初始版本，定义完整头部元数据规范 |
