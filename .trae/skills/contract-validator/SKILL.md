---
name: "contract-validator"
version: "1.2.0"
description: "契约验证器，负责定义和验证每个角色的输入输出契约。确保文档格式正确、内容完整，防止不合格输出流入下一阶段。包含反幻觉验证规则，强制QA角色提供测试证据。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 2
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "状态管理集成"

contracts:
  input:
    required_documents:
      - pattern: "docs/01-需求文档/REQ-SPLIT-.*\\.md"
        schema: "requirement-split-schema.json"
        description: "需求拆分文档"
      - pattern: "docs/05-测试文档/LT-TODOLIST-.*\\.md"
        schema: "todolist-schema.json"
        description: "LT生成的TodoList"
    validation_rules:
      - type: "SCHEMA_VALIDATION"
        strict: true
      - type: "CONTENT_CHECK"
        pattern: "LD-TODOLIST|LT-TODOLIST"
        description: "必须使用正确的TodoList作为参考"
  output:
    required_documents:
      - pattern: "docs/05-测试文档/QA-TEST-REPORT-.*\\.md"
        schema: "qa-report-schema.json"
        min_size: 4096
        description: "QA测试报告"
    validation_rules:
      - type: "WORD_COUNT"
        min: 1000
      - type: "EVIDENCE_VALIDATION"
        evidence_type: "screenshot"
        min_count: 5
      - type: "ANTI_HALLUCINATION_CHECK"
        indicators: ["PERFECT_PASS_RATE", "INSUFFICIENT_EVIDENCE", "MISSING_SCREENSHOTS"]
    quality_gates:
      - metric: "contract_pass_rate"
        threshold: 1.0
        operator: "=="
        required: true

execution:
  mode: "blocking"
  preconditions:
    - type: "BP_UNLOCKED"
      target: "BP-009"
      description: "Phase 3开发完成"
    - type: "ROLE_COMPLETED"
      target: "ALL_PROGRAMMERS"
      description: "所有程序开发完成"
  postconditions:
    - type: "BP_UNLOCK"
      target: "BP-011"
      description: "解锁QA测试完成阻塞点"
  rollback:
    supported: true
    strategy: "checkpoint"
    rollback_point: "BP-009"
    side_effects:
      - "删除无效的测试报告"
      - "重置QA角色状态"
    recovery_actions:
      - action: "DELETE_ARTIFACTS"
        target: "docs/05-测试文档/QA-TEST-REPORT-*.md"
      - action: "RESET_ROLE_STATUS"
        target: "QA-*"
        value: "PENDING"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "契约验证通过率"
      metric: "contract_pass_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "证据覆盖率"
      metric: "evidence_coverage"
      threshold: 0.5
      operator: ">="
      required: true
  testing:
    required_tests:
      - type: "FT"
        description: "功能测试验证"
        required: true
      - type: "VT"
        description: "视觉测试验证"
        required: true
    evidence_required: true
    anti_hallucination:
      enabled: true
      level: "LEVEL_2"
      min_screenshots: 5
      max_pass_rate: 0.95
  review:
    required: true
    reviewer: "LT"
    checklist:
      - "测试证据完整性检查"
      - "反幻觉指标检查"
      - "TodoList引用正确性检查"

tracking:
  execution_status:
    current: "PENDING"
  error_codes:
    - code: "E301"
      name: "CONTRACT_VALIDATION_FAILED"
      severity: "HIGH"
      rollback_required: true
    - code: "E304"
      name: "ANTI_HALLUCINATION_FAILED"
      severity: "CRITICAL"
      rollback_required: true
    - code: "E305"
      name: "EVIDENCE_MISSING"
      severity: "HIGH"
      rollback_required: false
  checkpoints:
    - id: "CP-001"
      name: "输入契约验证完成"
      position: "after_input_validation"
      rollback_supported: true
    - id: "CP-002"
      name: "反幻觉检查完成"
      position: "after_anti_hallucination"
      rollback_supported: true

functions:
  main:
    name: "validate"
    signature: "validate(role_id: ROLE_ID, artifacts: [PATH]) -> VALIDATION_RESULT"
    description: "执行契约验证主逻辑"
  validators:
    - name: "validate_input"
      signature: "validate_input(role_id: ROLE_ID, artifacts: [PATH]) -> VALIDATION_RESULT"
      description: "验证输入契约"
    - name: "validate_output"
      signature: "validate_output(role_id: ROLE_ID, artifacts: [PATH], anti_hallucination: BOOL) -> VALIDATION_RESULT"
      description: "验证输出契约（含反幻觉检查）"
    - name: "validate_anti_hallucination"
      signature: "validate_anti_hallucination(qa_report: PATH, evidence_dir: PATH) -> ANTI_HALLUCINATION_RESULT"
      description: "执行反幻觉专项验证"
  queries:
    - name: "get_contract"
      signature: "get_contract(role_id: ROLE_ID) -> CONTRACT"
      description: "获取角色契约定义"
    - name: "get_validation_status"
      signature: "get_validation_status(role_id: ROLE_ID) -> VALIDATION_STATUS"
      description: "获取验证状态"
---

# 契约验证器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **状态引用**：[state-manager](.trae/skills/state-manager/SKILL.md)
> 
> **QA标准引用**：[qa-standards-manager](.trae/skills/qa-standards-manager/SKILL.md)

---

## 功能概述

本技能负责管理游戏开发流程中的**输入输出契约**，包括：
- 定义每个角色的输入契约（Input Contract）
- 定义每个角色的输出契约（Output Contract）
- 验证实际输入/输出是否符合契约
- 提供契约版本管理
- 生成验证报告
- **反幻觉验证** - 强制QA角色提供测试证据，防止虚构测试结果
- **TodoList验证** - 验证策划审核和QA测试时使用正确的TodoList文档

> **核心原则**：每个角色的交付物必须通过契约验证，否则阻止流程推进
> 
> **⭐ TodoList验证原则**：
> - 策划审核时必须验证使用 **LD-TODOLIST** 作为唯一参考
> - QA测试时必须验证使用 **LT-TODOLIST** 作为唯一参考

---

## TodoList契约验证 ⭐新增

### 核心原则

**策划审核和QA测试时必须使用正确的TodoList作为唯一参考标准。**

### 子策划验收契约 (LD-TODOLIST验证)

```json
{
  "role_id": "LD-VALIDATOR",
  "version": "1.0.0",
  "description": "验证子策划验收时使用正确的LD-TODOLIST",
  "input": {
    "required_documents": [
      {
        "name_pattern": "LD-TODOLIST-[子策划标识]-.*\\.md",
        "schema": "todolist-schema.json",
        "description": "主策划生成的子策划TodoList - 唯一参考标准",
        "required_sections": ["设计任务清单", "验收标准"]
      }
    ],
    "validation_rules": [
      {
        "type": "CONTENT_CHECK",
        "pattern": "LD-TODOLIST",
        "description": "必须使用LD-TODOLIST作为参考"
      },
      {
        "type": "CUSTOM_VALIDATION",
        "script": "check_no_other_checklist",
        "description": "禁止生成额外的检查清单"
      }
    ]
  },
  "output": {
    "validation_rules": [
      {
        "type": "CONTENT_CHECK",
        "pattern": "验收结论.*LD-TODOLIST",
        "description": "验收结论必须引用LD-TODOLIST"
      }
    ]
  }
}
```

### QA测试契约 (LT-TODOLIST验证)

```json
{
  "role_id": "LT-VALIDATOR",
  "version": "1.0.0",
  "description": "验证QA测试时使用正确的LT-TODOLIST",
  "input": {
    "required_documents": [
      {
        "name_pattern": "LT-TODOLIST-[子QA标识]-.*\\.md",
        "schema": "todolist-schema.json",
        "description": "主测试生成的子QATodoList - 唯一参考标准",
        "required_sections": ["测试任务清单", "测试用例"]
      }
    ],
    "validation_rules": [
      {
        "type": "CONTENT_CHECK",
        "pattern": "LT-TODOLIST",
        "description": "必须使用LT-TODOLIST作为参考"
      },
      {
        "type": "CUSTOM_VALIDATION",
        "script": "check_no_duplicate_test_list",
        "description": "禁止生成QA-Test-List等重复文档"
      }
    ]
  },
  "output": {
    "validation_rules": [
      {
        "type": "CONTENT_CHECK",
        "pattern": "测试结果.*LT-TODOLIST",
        "description": "测试结果必须引用LT-TODOLIST"
      },
      {
        "type": "CONTENT_CHECK",
        "pattern": "TEST-[0-9]+",
        "description": "测试结果必须引用LT-TODOLIST中的用例ID"
      }
    ]
  }
}
```

### TodoList验证规则

| 验证项 | 验证内容 | 失败处理 |
|--------|----------|----------|
| **文档命名验证** | 检查是否使用正确的命名格式 | 拒绝验证，要求重命名 |
| **文档位置验证** | 检查是否存放在正确目录 | 拒绝验证，要求移动 |
| **唯一性验证** | 检查是否生成重复文档 | 拒绝验证，删除重复文档 |
| **引用验证** | 检查结果是否引用正确的TodoList | 要求补充引用 |

---

## 反幻觉契约验证 ⭐新增

### QA角色特殊验证规则

QA角色的输出契约包含额外的反幻觉验证规则，确保测试结果真实可信：

```typescript
// QA角色输出契约中的反幻觉验证规则
ANTI_HALLUCINATION_RULES ::= {
  // 证据存在性验证
  evidence_existence: {
    screenshots: {
      required: true,
      min_count: 5,  // 至少5张截图
      path_pattern: "tests/evidence/screenshots/{test_type}/",
      naming_pattern: "{test_type}_{test_id}_{timestamp}.png"
    },
    logs: {
      required: true,
      min_count: 1,
      path_pattern: "tests/evidence/logs/",
      naming_pattern: "{test_type}_{timestamp}.log"
    }
  },
  
  // 内容真实性验证
  content_authenticity: {
    // 禁止100%通过的虚假报告
    max_pass_rate: 0.95,
    // 必须包含失败或未测试项
    require_failure_items: true,
    // 必须包含问题清单
    require_issue_list: true
  },
  
  // 时间戳验证
  timestamp_validation: {
    // 截图时间必须在测试时间范围内
    screenshot_timestamp_range: "test_duration",
    // 日志时间必须与测试时间匹配
    log_timestamp_match: true
  }
}
```

### 幻觉检测规则

```typescript
HALLUCINATION_DETECTION ::= {
  // 检测指标
  indicators: [
    {
      name: "perfect_pass_rate",
      description: "100%通过率检测",
      check: "pass_rate == 1.0",
      severity: "HIGH",
      action: "REJECT"
    },
    {
      name: "insufficient_evidence",
      description: "证据不足检测",
      check: "screenshot_count < test_item_count * 0.5",
      severity: "HIGH", 
      action: "REJECT"
    },
    {
      name: "missing_screenshots",
      description: "截图缺失检测",
      check: "!file_exists(screenshot_paths)",
      severity: "CRITICAL",
      action: "REJECT"
    },
    {
      name: "code_inference_only",
      description: "仅凭代码推断",
      check: "report.contains('代码看起来') || report.contains('应该正常')",
      severity: "MEDIUM",
      action: "WARNING"
    },
    {
      name: "template_copy_paste",
      description: "模板复制粘贴",
      check: "report_similarity > 0.9",
      severity: "MEDIUM",
      action: "WARNING"
    }
  ]
}
```

---

## 分级反幻觉机制 ⭐新增

### 机制概述

根据**项目规模**自动选择不同级别的反幻觉检查，避免一刀切导致的过度检查或检查不足。

```
┌─────────────────────────────────────────────────────────┐
│                  分级反幻觉检查机制                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   项目规模评估 → 选择检查级别 → 执行对应检查规则          │
│        ↓              ↓              ↓                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│   │小型项目 │    │中型项目 │    │大型项目 │           │
│   │<10功能点│    │10-30点 │    │>30功能点│           │
│   └────┬────┘    └────┬────┘    └────┬────┘           │
│        ↓              ↓              ↓                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│   │Level 1  │    │Level 2  │    │Level 3  │           │
│   │基础检查 │    │标准检查 │    │严格检查 │           │
│   └─────────┘    └─────────┘    └─────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 项目规模评估

```typescript
PROJECT_SIZE_CALCULATION ::= {
  // 功能点计算方法
  factors: [
    { name: "system_modules", weight: 1.0 },    // 系统模块数
    { name: "ui_screens", weight: 0.5 },        // UI界面数
    { name: "gameplay_features", weight: 1.5 }, // 玩法功能数
    { name: "integration_points", weight: 0.8 } // 集成点数
  ],
  
  // 规模分级
  classification: {
    small:  { max_points: 10,  level: "LEVEL_1" },
    medium: { max_points: 30,  level: "LEVEL_2" },
    large:  { min_points: 30,  level: "LEVEL_3" }
  }
}

// 示例评估
// 点击游戏: 点击系统(1) + 商店系统(1) + 道具系统(1) + 存档系统(1) + 主界面(0.5) + 商店界面(0.5) = 4.5功能点
// 结果: small → Level 1
```

### 三级检查标准

#### Level 1 - 基础检查（小型项目 <10功能点）

| 检查项 | 要求 | 说明 |
|--------|------|------|
| **截图数量** | ≥3张 | 覆盖核心功能 |
| **测试报告** | 必须 | 包含测试项和结果 |
| **通过率** | 无强制限制 | 允许100%通过，但需说明测试覆盖度 |
| **控制台日志** | 可选 | 建议提供 |
| **视频录制** | 无 | 不需要 |
| **性能数据** | 无 | 不需要 |

**特殊规则：**
- ✅ 允许100%通过，但必须提供详细测试说明
- ✅ 截图数量可根据功能点调整（最少3张）
- ⚠️ 禁止"代码看起来正常"等推断性表述

#### Level 2 - 标准检查（中型项目 10-30功能点）

| 检查项 | 要求 | 说明 |
|--------|------|------|
| **截图数量** | ≥5张 或 ≥功能点×0.3 | 取较大值 |
| **测试报告** | 必须 | 详细测试用例和结果 |
| **通过率** | ≤95% 或 详细说明 | 100%通过需解释原因 |
| **控制台日志** | 必须 | 包含错误和警告 |
| **视频录制** | 可选 | 复杂流程建议提供 |
| **性能数据** | 可选 | 性能敏感功能需提供 |

**特殊规则：**
- 🟡 100%通过需提供详细说明（测试覆盖度、测试方法）
- 🟡 必须包含至少1个发现的问题或优化建议
- ⚠️ 禁止模板化测试报告

#### Level 3 - 严格检查（大型项目 >30功能点）

| 检查项 | 要求 | 说明 |
|--------|------|------|
| **截图数量** | ≥9张 或 ≥功能点×0.3 | 取较大值，关键路径全覆盖 |
| **测试报告** | 必须 | 完整测试计划、用例、结果 |
| **通过率** | ≤90% 或 详细说明 | 100%通过需充分理由 |
| **控制台日志** | 必须 | 完整日志分析 |
| **视频录制** | 建议 | 核心流程必须录制 |
| **性能数据** | 必须 | 性能指标和对比 |

**特殊规则：**
- 🔴 100%通过需充分理由（如回归测试、小规模修复）
- 🔴 必须包含至少2个发现的问题（Bug或优化点）
- 🔴 禁止仅凭代码推断测试结果
- 🔴 必须进行边界测试和异常测试

### 检查级别对比表

| 检查维度 | Level 1 (小型) | Level 2 (中型) | Level 3 (大型) |
|----------|----------------|----------------|----------------|
| **功能点范围** | <10 | 10-30 | >30 |
| **截图数量** | ≥3 | ≥5 | ≥9 |
| **截图公式** | 固定3张 | max(5, 功能点×0.3) | max(9, 功能点×0.3) |
| **通过率限制** | 无 | ≤95%或说明 | ≤90%或充分理由 |
| **必须问题数** | 0 | ≥1 | ≥2 |
| **控制台日志** | 可选 | 必须 | 必须+分析 |
| **视频录制** | 无 | 可选 | 建议 |
| **性能数据** | 无 | 可选 | 必须 |
| **边界测试** | 可选 | 建议 | 必须 |
| **回归测试** | 可选 | 可选 | 必须 |

### 自动级别选择

```typescript
// 自动选择检查级别
FUNCTION: select_anti_hallucination_level(
  project_info: PROJECT_INFO
) → CHECK_LEVEL

输入:
  - project_info: 项目信息

输出:
  - CHECK_LEVEL: 检查级别配置

实现:
  1. 计算功能点总数
  2. 根据功能点范围选择级别
  3. 返回对应级别的检查配置

示例:
  // 点击游戏项目
  project_info = {
    system_modules: ["点击系统", "商店系统", "道具系统", "存档系统"],
    ui_screens: ["主界面", "商店界面"],
    gameplay_features: ["点击获取金币", "自动产金", "道具效果", "成就解锁"],
    integration_points: ["存档读取", "存档写入"]
  }
  
  // 计算: 4×1.0 + 2×0.5 + 4×1.5 + 2×0.8 = 4 + 1 + 6 + 1.6 = 12.6功能点
  // 结果: medium → Level 2
  
  select_anti_hallucination_level(project_info)
  返回: {
    level: "LEVEL_2",
    min_screenshots: 5,
    max_pass_rate: 0.95,
    require_issues: 1,
    require_logs: true,
    require_video: false,
    require_performance: false
  }
```

### 使用示例

```
// 场景1: 小型项目（点击游戏）
PL → contract-validator.validate_qa_report({
  project_size: "small",  // 或自动计算
  report: qa_report,
  evidence: { screenshots, logs }
})
检查规则:
  - 截图 ≥3张 ✅
  - 测试报告完整 ✅
  - 通过率100%（接受，但需说明）🟡

// 场景2: 中型项目（RPG游戏）
PL → contract-validator.validate_qa_report({
  project_size: "medium",
  report: qa_report,
  evidence: { screenshots, logs }
})
检查规则:
  - 截图 ≥5张 ✅
  - 测试报告完整 ✅
  - 通过率100%（需详细说明原因）🟡
  - 至少1个问题或建议 ✅

// 场景3: 大型项目（MMO游戏）
PL → contract-validator.validate_qa_report({
  project_size: "large",
  report: qa_report,
  evidence: { screenshots, logs, video, performance_data }
})
检查规则:
  - 截图 ≥9张 ✅
  - 测试报告完整 ✅
  - 通过率 ≤90% 或充分理由 🔴
  - 至少2个问题或建议 ✅
  - 性能数据 ✅
  - 边界测试 ✅
```

### 配置示例

```typescript
// 项目配置中指定检查级别
PROJECT_CONFIG ::= {
  qa_validation: {
    // 自动计算或手动指定
    anti_hallucination_level: "AUTO" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3",
    
    // 自定义阈值（覆盖默认）
    custom_thresholds: {
      min_screenshots: null,      // null表示使用级别默认值
      max_pass_rate: null,
      require_issues: null
    }
  }
}
```

---

## 调用时机

**由 PL 在以下时机调用：**
- 角色分配前：验证输入文档是否满足契约
- 角色交付后：验证输出文档是否符合契约
- **QA测试报告提交后：执行反幻觉验证**
- 阻塞点解锁前：验证所有前置契约已满足
- 状态回滚后：重新验证相关契约

---

## 契约定义

### 契约结构 (CONTRACT)

```typescript
CONTRACT ::= {
  role_id: ROLE_ID,           // 角色标识
  version: SEMVER,            // 契约版本
  
  input: INPUT_CONTRACT,      // 输入契约
  output: OUTPUT_CONTRACT,    // 输出契约
  
  dependencies: [ROLE_ID],    // 依赖的其他角色
  
  metadata: {
    created_at: ISO8601,
    updated_at: ISO8601,
    author: STRING
  }
}

INPUT_CONTRACT ::= {
  required_documents: [DOCUMENT_SPEC],  // 必需文档
  optional_documents: [DOCUMENT_SPEC],  // 可选文档
  
  preconditions: [PRECONDITION],        // 前置条件
  
  validation_rules: [VALIDATION_RULE]   // 验证规则
}

OUTPUT_CONTRACT ::= {
  required_documents: [DOCUMENT_SPEC],  // 必需输出
  optional_documents: [DOCUMENT_SPEC],  // 可选输出
  
  postconditions: [POSTCONDITION],      // 后置条件
  
  validation_rules: [VALIDATION_RULE],  // 验证规则
  
  quality_gates: [QUALITY_GATE],        // 质量门槛
  
  anti_hallucination: ANTI_HALLUCINATION_RULES  // ⭐反幻觉规则（QA角色）
}

DOCUMENT_SPEC ::= {
  name_pattern: REGEX,        // 文件名模式
  schema: SCHEMA_REF,         // Schema引用
  min_size: INT|null,         // 最小大小（字节）
  max_size: INT|null,         // 最大大小（字节）
  required_sections: [STRING] // 必需章节
}

VALIDATION_RULE ::= 
  | SCHEMA_VALIDATION { schema: SCHEMA_REF }
  | CONTENT_CHECK { pattern: REGEX, description: STRING }
  | WORD_COUNT { min: INT, max: INT|null }
  | FILE_COUNT { min: INT, max: INT|null }
  | CHECKSUM_VALIDATION { algorithm: "SHA256" }
  | CUSTOM_VALIDATION { script: STRING }
  | EVIDENCE_VALIDATION { type: "screenshot" | "log" | "video" }  // ⭐证据验证
  | ANTI_HALLUCINATION_CHECK { indicators: [STRING] }  // ⭐反幻觉检查

QUALITY_GATE ::= {
  metric: STRING,
  threshold: NUMBER,
  operator: ">=" | "<=" | "==" | ">" | "<"
}

PRECONDITION ::= {
  type: "BP_UNLOCKED" | "ROLE_COMPLETED" | "ARTIFACT_EXISTS",
  target: STRING,
  description: STRING
}
```

---

## 核心接口

### 1. 获取角色契约

```
FUNCTION: get_contract(role_id: ROLE_ID) → CONTRACT

输入:
  - role_id: 角色标识符

输出:
  - CONTRACT: 契约定义

错误:
  - ContractNotFoundError: 契约不存在

示例:
  PL → contract-validator.get_contract("SD-1")
  返回: CONTRACT { role_id: "SD-1", input: {...}, output: {...}, ... }
```

### 2. 验证输入契约

```
FUNCTION: validate_input(
  role_id: ROLE_ID,
  artifacts: [ARTIFACT_PATH]
) → VALIDATION_RESULT

VALIDATION_RESULT ::= {
  valid: BOOL,
  passed_checks: [CHECK_RESULT],
  failed_checks: [CHECK_RESULT],
  warnings: [CHECK_RESULT],
  summary: STRING
}

CHECK_RESULT ::= {
  check_type: STRING,
  description: STRING,
  status: "PASSED" | "FAILED" | "WARNING",
  details: ANY,
  suggestion: STRING|null
}

示例:
  PL → contract-validator.validate_input("SD-1", [
    "docs/01-需求文档/REQ-SPLIT-20240219-v1.0.md",
    "docs/01-需求文档/LD-TODOLIST-SD-1-v1.0-20240219.md"
  ])
  返回: {
    valid: true,
    passed_checks: [
      { check_type: "FILE_EXISTS", description: "需求拆分文档存在", status: "PASSED" },
      { check_type: "SCHEMA_VALID", description: "文档格式正确", status: "PASSED" }
    ],
    failed_checks: [],
    warnings: [],
    summary: "输入契约验证通过，共2项检查全部通过"
  }
```

### 3. 验证输出契约（含反幻觉检查）⭐增强

```
FUNCTION: validate_output(
  role_id: ROLE_ID,
  artifacts: [ARTIFACT_PATH],
  strict_mode: BOOL = true,
  anti_hallucination_check: BOOL = true  // ⭐新增：启用反幻觉检查
) → VALIDATION_RESULT

输入:
  - role_id: 角色标识符
  - artifacts: 产出物路径列表
  - strict_mode: 是否严格模式（false时警告不阻止流程）
  - anti_hallucination_check: 是否执行反幻觉检查（QA角色强制启用）

输出:
  - VALIDATION_RESULT: 验证结果（包含反幻觉检查结果）

示例:
  PL → contract-validator.validate_output("QA-TESTER", [
    "docs/05-测试文档/QA-TEST-REPORT-v1.0.md",
    "tests/evidence/screenshots/ft/",
    "tests/evidence/logs/"
  ], strict_mode=true, anti_hallucination_check=true)
  
  返回: {
    valid: false,
    passed_checks: [
      { check_type: "FILE_EXISTS", status: "PASSED" },
      { check_type: "SCHEMA_VALID", status: "PASSED" }
    ],
    failed_checks: [
      { 
        check_type: "ANTI_HALLUCINATION",  // ⭐反幻觉检查
        description: "100%通过率检测",
        status: "FAILED",
        details: { 
          pass_rate: 1.0, 
          test_items: 30,
          suspicious: "首次测试不可能100%通过，可能存在幻觉"
        },
        suggestion: "重新执行测试，记录真实测试结果，包括失败项"
      },
      {
        check_type: "EVIDENCE_VALIDATION",  // ⭐证据验证
        description: "截图证据存在性检查",
        status: "FAILED",
        details: { 
          required: 15, 
          actual: 3,
          missing_paths: ["tests/evidence/screenshots/ft/ft_001_*.png", ...]
        },
        suggestion: "为每个测试项提供截图证据，保存到指定目录"
      }
    ],
    warnings: [
      {
        check_type: "HALLUCINATION_INDICATOR",
        description: "模板复制粘贴检测",
        status: "WARNING",
        details: { similarity: 0.92 },
        suggestion: "避免直接复制模板内容，根据实际测试填写"
      }
    ],
    summary: "输出契约验证失败，反幻觉检查发现异常：100%通过率且证据不足"
  }
```

### 4. 批量验证

```
FUNCTION: validate_batch(
  validations: [{ role_id: ROLE_ID, artifacts: [ARTIFACT_PATH], type: "INPUT" | "OUTPUT" }]
) → BATCH_VALIDATION_RESULT

BATCH_VALIDATION_RESULT ::= {
  overall_valid: BOOL,
  results: [{ role_id: ROLE_ID, result: VALIDATION_RESULT }],
  failed_roles: [ROLE_ID],
  summary: STRING
}

示例:
  PL → contract-validator.validate_batch([
    { role_id: "SD-1", artifacts: [...], type: "OUTPUT" },
    { role_id: "SD-2", artifacts: [...], type: "OUTPUT" },
    { role_id: "QA-TESTER", artifacts: [...], type: "OUTPUT" }  // 包含反幻觉检查
  ])
  返回: {
    overall_valid: false,
    results: [...],
    failed_roles: ["QA-TESTER"],  // QA角色因反幻觉检查失败
    summary: "批量验证完成，3个角色中1个验证失败（QA-TESTER：反幻觉检查未通过）"
  }
```

### 5. 检查前置条件

```
FUNCTION: check_preconditions(
  role_id: ROLE_ID,
  current_state: STATE
) → PRECONDITION_CHECK_RESULT

PRECONDITION_CHECK_RESULT ::= {
  all_satisfied: BOOL,
  preconditions: [{
    condition: PRECONDITION,
    satisfied: BOOL,
    reason: STRING|null
  }],
  blockers: [STRING]
}

示例:
  PL → contract-validator.check_preconditions("SD-1", current_state)
  返回: {
    all_satisfied: true,
    preconditions: [
      { 
        condition: { type: "BP_UNLOCKED", target: "BP-003", description: "BP-003已解锁" },
        satisfied: true,
        reason: null
      },
      {
        condition: { type: "ROLE_COMPLETED", target: "LD", description: "主策划需求拆分完成" },
        satisfied: true,
        reason: null
      }
    ],
    blockers: []
  }
```

### 6. 注册契约

```
FUNCTION: register_contract(contract: CONTRACT) → { success: BOOL, contract_id: UUID }

用于动态注册新角色的契约

示例:
  PL → contract-validator.register_contract({
    role_id: "SD-1",
    version: "1.0.0",
    input: {...},
    output: {...}
  })
  返回: { success: true, contract_id: "uuid-123" }
```

### 7. 更新契约

```
FUNCTION: update_contract(
  role_id: ROLE_ID, 
  updates: PARTIAL_CONTRACT,
  new_version: SEMVER
) → { success: BOOL, contract: CONTRACT }

更新契约版本，旧版本仍然保留用于历史验证

示例:
  PL → contract-validator.update_contract("SD-1", { output: {...} }, "1.1.0")
  返回: { success: true, contract: CONTRACT { version: "1.1.0", ... } }
```

### 8. 反幻觉专项验证 ⭐新增

```
FUNCTION: validate_anti_hallucination(
  qa_report_path: PATH,
  evidence_dir: PATH
) → ANTI_HALLUCINATION_RESULT

ANTI_HALLUCINATION_RESULT ::= {
  valid: BOOL,
  hallucination_detected: BOOL,
  indicators: [HALLUCINATION_INDICATOR],
  evidence_status: EVIDENCE_STATUS,
  recommendations: [STRING]
}

HALLUCINATION_INDICATOR ::= {
  type: STRING,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  description: STRING,
  details: ANY
}

EVIDENCE_STATUS ::= {
  screenshots: { required: INT, actual: INT, valid: BOOL },
  logs: { required: INT, actual: INT, valid: BOOL },
  coverage: FLOAT  // 证据覆盖率
}

示例:
  PL → contract-validator.validate_anti_hallucination(
    "docs/05-测试文档/QA-TEST-REPORT-v1.0.md",
    "tests/evidence/"
  )
  返回: {
    valid: false,
    hallucination_detected: true,
    indicators: [
      {
        type: "PERFECT_PASS_RATE",
        severity: "HIGH",
        description: "测试报告显示100%通过率",
        details: { pass_rate: 1.0, test_count: 30 }
      },
      {
        type: "INSUFFICIENT_EVIDENCE",
        severity: "CRITICAL",
        description: "截图证据严重不足",
        details: { required: 15, actual: 2 }
      }
    ],
    evidence_status: {
      screenshots: { required: 15, actual: 2, valid: false },
      logs: { required: 1, actual: 0, valid: false },
      coverage: 0.13
    },
    recommendations: [
      "重新执行实际测试，记录真实结果",
      "为每个测试项提供截图证据",
      "记录控制台日志",
      "避免仅凭代码推断填写测试结果"
    ]
  }
```

---

## 契约定义库

### 系统策划-玩法 (SD-1)

```json
{
  "role_id": "SD-1",
  "version": "1.0.0",
  "input": {
    "required_documents": [
      {
        "name_pattern": "REQ-SPLIT-.*-v\\d+\\.\\d+\\.md",
        "schema": "requirement-split-schema.json",
        "required_sections": ["需求概述", "模块拆分"]
      },
      {
        "name_pattern": "LD-TODOLIST-SD-1-.*\\.md",
        "schema": "todolist-schema.json"
      }
    ],
    "preconditions": [
      { "type": "BP_UNLOCKED", "target": "BP-003", "description": "需求拆分已完成" }
    ]
  },
  "output": {
    "required_documents": [
      {
        "name_pattern": "SD-GAMEPLAY-.*\\.md",
        "schema": "gameplay-design-schema.json",
        "min_size": 2048,
        "required_sections": ["核心战斗循环", "玩法规则"]
      }
    ],
    "validation_rules": [
      { "type": "WORD_COUNT", "min": 500 },
      { "type": "CONTENT_CHECK", "pattern": "核心战斗循环", "description": "必须包含核心战斗循环描述" },
      { "type": "CONTENT_CHECK", "pattern": "回合制规则", "description": "必须包含回合制规则" }
    ],
    "quality_gates": [
      { "metric": "completeness", "threshold": 0.8, "operator": ">=" }
    ]
  },
  "dependencies": ["LD"]
}
```

### 技能系统程序-1 (SkD-1)

```json
{
  "role_id": "SkD-1",
  "version": "1.0.0",
  "input": {
    "required_documents": [
      {
        "name_pattern": "LD-TECH-REQ-.*\\.md",
        "schema": "tech-req-schema.json"
      },
      {
        "name_pattern": "LP-TODOLIST-SkD-1-.*\\.md",
        "schema": "todolist-schema.json"
      }
    ],
    "preconditions": [
      { "type": "BP_UNLOCKED", "target": "BP-006", "description": "技术框架已搭建" }
    ]
  },
  "output": {
    "required_documents": [
      {
        "name_pattern": "src/systems/SkillSystem\\.ts",
        "schema": "typescript-source-schema.json"
      }
    ],
    "validation_rules": [
      { "type": "FILE_EXISTS", "description": "技能系统源代码存在" },
      { "type": "CONTENT_CHECK", "pattern": "class SkillSystem|export.*SkillSystem", "description": "必须包含SkillSystem类定义" },
      { "type": "CUSTOM_VALIDATION", "script": "lint_check" }
    ]
  },
  "dependencies": ["LP", "SD-1"]
}
```

### QA测试人员 (QA-TESTER) ⭐新增

```json
{
  "role_id": "QA-TESTER",
  "version": "1.0.0",
  "description": "QA测试人员，执行功能测试、视觉测试、路径测试等",
  "input": {
    "required_documents": [
      {
        "name_pattern": "LD-TECH-REQ-.*\\.md",
        "schema": "tech-req-schema.json",
        "description": "技术需求文档"
      },
      {
        "name_pattern": "UID-LAYOUT-.*\\.md",
        "schema": "ui-layout-schema.json",
        "description": "UI布局文档"
      },
      {
        "name_pattern": ".*-PATH-.*\\.md",
        "schema": "path-doc-schema.json",
        "description": "功能路径文档"
      }
    ],
    "preconditions": [
      { "type": "BP_UNLOCKED", "target": "BP-009", "description": "Phase 3开发完成" },
      { "type": "ROLE_COMPLETED", "target": "ALL_PROGRAMMERS", "description": "所有程序开发完成" }
    ]
  },
  "output": {
    "required_documents": [
      {
        "name_pattern": "QA-TEST-REPORT-.*-v\\d+\\.\\d+.*\\.md",
        "schema": "qa-report-schema.json",
        "min_size": 4096,
        "required_sections": [
          "测试概述",
          "功能测试结果",
          "视觉测试结果",
          "完整路径测试结果",
          "问题清单",
          "测试证据清单",
          "反幻觉自检确认"
        ]
      }
    ],
    "optional_documents": [
      {
        "name_pattern": "tests/evidence/screenshots/.*",
        "description": "测试截图证据"
      },
      {
        "name_pattern": "tests/evidence/logs/.*",
        "description": "测试日志证据"
      }
    ],
    "validation_rules": [
      { 
        "type": "WORD_COUNT", 
        "min": 1000,
        "description": "测试报告至少1000字"
      },
      { 
        "type": "CONTENT_CHECK", 
        "pattern": "测试证据清单", 
        "description": "必须包含测试证据清单章节" 
      },
      { 
        "type": "CONTENT_CHECK", 
        "pattern": "反幻觉自检", 
        "description": "必须包含反幻觉自检确认" 
      },
      { 
        "type": "CONTENT_CHECK", 
        "pattern": "❌|不通过|失败|未测试", 
        "description": "必须包含失败或未测试项（禁止100%通过）" 
      },
      { 
        "type": "EVIDENCE_VALIDATION", 
        "evidence_type": "screenshot",
        "min_count": 5,
        "path_pattern": "tests/evidence/screenshots/",
        "description": "必须提供至少5张测试截图"
      },
      { 
        "type": "EVIDENCE_VALIDATION", 
        "evidence_type": "log",
        "min_count": 1,
        "path_pattern": "tests/evidence/logs/",
        "description": "必须提供测试日志"
      },
      { 
        "type": "ANTI_HALLUCINATION_CHECK",
        "indicators": ["PERFECT_PASS_RATE", "INSUFFICIENT_EVIDENCE", "MISSING_SCREENSHOTS"],
        "description": "执行反幻觉检查"
      }
    ],
    "quality_gates": [
      { "metric": "evidence_coverage", "threshold": 0.5, "operator": ">=" },
      { "metric": "test_authenticity", "threshold": 0.8, "operator": ">=" }
    ],
    "anti_hallucination": {
      "evidence_requirements": {
        "screenshots": {
          "required": true,
          "min_count_formula": "max(5, test_item_count * 0.3)",
          "path": "tests/evidence/screenshots/",
          "naming_pattern": "{test_type}_{test_id}_{timestamp}.png"
        },
        "logs": {
          "required": true,
          "min_count": 1,
          "path": "tests/evidence/logs/",
          "naming_pattern": "{test_type}_{timestamp}.log"
        }
      },
      "content_restrictions": {
        "max_pass_rate": 0.95,
        "require_failure_items": true,
        "require_issue_list": true,
        "prohibited_phrases": [
          "代码看起来正常",
          "应该没问题",
          "理论上可行",
          "推测可以运行"
        ]
      },
      "detection_rules": [
        {
          "name": "PERFECT_PASS_RATE",
          "condition": "pass_rate == 1.0",
          "severity": "HIGH",
          "message": "首次测试不可能100%通过，请提供真实测试结果"
        },
        {
          "name": "INSUFFICIENT_SCREENSHOTS",
          "condition": "screenshot_count < max(5, test_items * 0.3)",
          "severity": "CRITICAL",
          "message": "截图证据不足，无法证明测试实际执行"
        },
        {
          "name": "MISSING_LOGS",
          "condition": "log_count < 1",
          "severity": "HIGH",
          "message": "缺少控制台日志，无法验证测试过程"
        },
        {
          "name": "CODE_INFERENCE",
          "condition": "report.contains_any(prohibited_phrases)",
          "severity": "MEDIUM",
          "message": "检测到仅凭代码推断的表述，请提供实际测试证据"
        }
      ]
    }
  },
  "dependencies": ["ALL_PROGRAMMERS", "UID"]
}
```

---

## 验证规则详解

### SCHEMA_VALIDATION

```
验证文档是否符合JSON Schema

示例 Schema (gameplay-design-schema.json):
{
  "type": "object",
  "required": ["title", "sections"],
  "properties": {
    "title": { "type": "string", "minLength": 5 },
    "sections": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "required": ["heading", "content"]
      }
    }
  }
}
```

### CONTENT_CHECK

```
验证文档内容是否包含特定模式

示例:
{ 
  "type": "CONTENT_CHECK", 
  "pattern": "核心战斗循环", 
  "description": "必须包含核心战斗循环描述" 
}

支持正则表达式:
{
  "type": "CONTENT_CHECK",
  "pattern": "##?\\s*核心.*循环",
  "description": "必须包含核心循环章节"
}
```

### WORD_COUNT

```
验证文档字数

示例:
{ "type": "WORD_COUNT", "min": 500, "max": 5000 }

计数规则:
- 中文字符：每个字算1个词
- 英文单词：按空格分隔
- 代码块：不计入
- 标点符号：不计入
```

### CUSTOM_VALIDATION

```
调用自定义验证脚本

示例:
{
  "type": "CUSTOM_VALIDATION",
  "script": "lint_check",
  "params": { "rules": "eslint-config-standard" }
}

内置脚本:
- lint_check: 代码规范检查
- link_check: 文档链接有效性检查
- image_check: 图片引用检查
- duplicate_check: 重复内容检查
- screenshot_exists_check: 截图文件存在性检查 ⭐新增
- log_exists_check: 日志文件存在性检查 ⭐新增
- anti_hallucination_check: 反幻觉综合检查 ⭐新增
```

### EVIDENCE_VALIDATION ⭐新增

```
验证测试证据的存在性和有效性

示例:
{
  "type": "EVIDENCE_VALIDATION",
  "evidence_type": "screenshot",
  "min_count": 5,
  "path_pattern": "tests/evidence/screenshots/",
  "naming_pattern": "{test_type}_{test_id}_{timestamp}.png"
}

验证内容:
1. 证据目录是否存在
2. 证据文件数量是否达标
3. 文件命名是否符合规范
4. 文件时间戳是否合理
5. 文件内容是否有效（非空、可读取）
```

### ANTI_HALLUCINATION_CHECK ⭐新增

```
执行反幻觉检查，检测虚构测试结果

示例:
{
  "type": "ANTI_HALLUCINATION_CHECK",
  "indicators": [
    "PERFECT_PASS_RATE",
    "INSUFFICIENT_EVIDENCE", 
    "MISSING_SCREENSHOTS",
    "CODE_INFERENCE"
  ]
}

检测指标:
- PERFECT_PASS_RATE: 100%通过率（首次测试不可能）
- INSUFFICIENT_EVIDENCE: 证据覆盖率不足
- MISSING_SCREENSHOTS: 截图缺失
- MISSING_LOGS: 日志缺失
- CODE_INFERENCE: 仅凭代码推断
- TEMPLATE_COPY: 模板复制粘贴
- TIMESTAMP_MISMATCH: 时间戳不匹配
```

---

## 质量门槛 (Quality Gates)

### 定义

```
QUALITY_GATE ::= {
  metric: STRING,           // 指标名称
  threshold: NUMBER,        // 阈值
  operator: ">=" | "<=" | "==" | ">" | "<"
}

内置指标:
- completeness: 内容完整度 (0-1)
- consistency: 术语一致性 (0-1)
- readability: 可读性评分 (0-1)
- coverage: 需求覆盖率 (0-1)
- evidence_coverage: 证据覆盖率 (0-1) ⭐新增
- test_authenticity: 测试真实性评分 (0-1) ⭐新增
```

### 计算方式

```
completeness = 实际章节数 / 必需章节数
consistency = 术语一致性检查通过数 / 总术语数
readability = 基于Flesch阅读 ease分数
coverage = 已实现需求数 / 总需求数
evidence_coverage = 实际证据数 / 要求证据数 ⭐新增
test_authenticity = 1 - (幻觉指标数 / 总检测指标数) ⭐新增
```

---

## 错误处理

### 验证失败处理流程

```
契约验证失败
    ↓
生成详细错误报告
    ↓
返回给 PL
    ↓
PL 决策:
  ├─ 选项1: 要求角色修复 → 重新验证
  ├─ 选项2: 降低质量门槛 → 更新契约
  ├─ 选项3: 强制通过 → 记录例外
  └─ 选项4: 回滚流程 → 调用 state-manager.rollback_to
```

### 反幻觉验证失败特殊处理 ⭐新增

```
反幻觉验证失败（检测到幻觉）
    ↓
生成幻觉检测报告
    ↓
标记测试报告为"不可信"
    ↓
返回给 PL
    ↓
PL 必须执行:
  ├─ 要求QA重新执行实际测试
  ├─ 要求提供真实截图和日志
  ├─ 验证证据真实性
  └─ 重新提交测试报告
    ↓
重新验证（反幻觉检查强制启用）
```

### 例外处理

```
FUNCTION: grant_exception(
  role_id: ROLE_ID,
  failed_checks: [CHECK_RESULT],
  reason: STRING,
  approved_by: STRING
) → EXCEPTION_GRANT

EXCEPTION_GRANT ::= {
  grant_id: UUID,
  role_id: ROLE_ID,
  waived_checks: [CHECK_TYPE],
  reason: STRING,
  approved_by: STRING,
  expires_at: ISO8601|null,
  audit_log: [STRING]
}

注意：
- 反幻觉检查例外需要更高级别审批
- 例外必须记录详细审计日志
- 可设置例外过期时间
- 同一QA角色的多次例外将触发警告
```

---

## 与状态管理器集成

### 契约验证触发状态保存

```
当契约验证通过时:
  1. contract-validator 返回 VALIDATION_RESULT
  2. PL 调用 state-manager.save_checkpoint()
  3. 新状态中记录 validation_passed=true

当契约验证失败时:
  1. contract-validator 返回失败的 VALIDATION_RESULT
  2. PL 决策是否回滚
  3. 如果回滚，调用 state-manager.rollback_to()

当反幻觉验证失败时: ⭐新增
  1. 记录幻觉检测结果到状态
  2. 标记相关测试报告为"不可信"
  3. 触发强制重测流程
```

### 状态中的契约信息

```
STATE.artifacts[artifact_path].validation = {
  validated: BOOL,
  validated_at: ISO8601,
  validator: "contract-validator",
  result: VALIDATION_RESULT,
  exception_grant: EXCEPTION_GRANT|null,
  anti_hallucination: {  // ⭐新增
    checked: BOOL,
    hallucination_detected: BOOL,
    indicators: [HALLUCINATION_INDICATOR],
    evidence_status: EVIDENCE_STATUS
  }
}
```

---

## 接口汇总

| 接口 | 输入 | 输出 | 调用方 |
|------|------|------|--------|
| `get_contract` | role_id | CONTRACT | PL |
| `validate_input` | role_id, artifacts | VALIDATION_RESULT | PL |
| `validate_output` | role_id, artifacts, strict_mode, anti_hallucination_check | VALIDATION_RESULT | PL |
| `validate_batch` | validations[] | BATCH_VALIDATION_RESULT | PL |
| `check_preconditions` | role_id, current_state | PRECONDITION_CHECK_RESULT | PL |
| `register_contract` | CONTRACT | {success, contract_id} | PL |
| `update_contract` | role_id, updates, new_version | {success, contract} | PL |
| `grant_exception` | role_id, failed_checks, reason, approved_by | EXCEPTION_GRANT | PL |
| `validate_anti_hallucination` | qa_report_path, evidence_dir | ANTI_HALLUCINATION_RESULT | PL ⭐新增 |

---

## 输入验证规范 ⭐新增

### 验证类型

| 验证类型 | 说明 | 示例 |
|---------|------|------|
| **路径验证** | 防止路径遍历攻击 | `../../../etc/passwd` |
| **命令验证** | 防止命令注入 | `; rm -rf /` |
| **长度验证** | 防止DoS攻击 | 超长字符串 |
| **格式验证** | 确保数据格式正确 | 文件名、日期格式 |
| **内容验证** | 防止恶意内容 | XSS、SQL注入 |

### 路径验证规则

```typescript
PATH_VALIDATION ::= {
  // 允许的路径模式
  allowed_patterns: [
    "projects/*",           // 项目目录
    ".trae/*",              // 引擎目录
    "tools/*",              // 工具目录
    "output/*",             // 输出目录
    "temp/*"                // 临时目录
  ],
  
  // 禁止的路径模式
  blocked_patterns: [
    "../",                  // 路径遍历
    "..\\",                 // Windows路径遍历
    "/etc/*",               // 系统目录
    "C:/Windows/*",         // Windows系统目录
    "~/*",                  // 用户目录
    "${*",                  // 环境变量注入
    "%*"                    // Windows环境变量
  ],
  
  // 验证函数
  validate_path(path: STRING) → VALIDATION_RESULT {
    // 1. 检查路径遍历
    if (path.contains("../") || path.contains("..\\")) {
      return { valid: false, error: "PATH_TRAVERSAL_DETECTED" }
    }
    
    // 2. 规范化路径
    normalized = path.normalize()
    
    // 3. 检查是否在允许范围内
    if (!normalized.starts_with(allowed_patterns)) {
      return { valid: false, error: "PATH_NOT_ALLOWED" }
    }
    
    return { valid: true }
  }
}
```

### 命令验证规则

```typescript
COMMAND_VALIDATION ::= {
  // 危险命令模式
  dangerous_patterns: [
    ";",                    // 命令分隔
    "|",                    // 管道
    "&",                    // 后台执行
    "$(",                   // 命令替换
    "`",                    // 反引号执行
    ">",                    // 输出重定向
    ">>",                   // 追加重定向
    "<",                    // 输入重定向
    "&&",                   // 逻辑与
    "||"                    // 逻辑或
  ],
  
  // 允许的命令白名单
  allowed_commands: [
    "npm", "yarn", "pnpm", "npx",
    "git", "node", "python",
    "tsc", "webpack", "vite",
    "mkdir", "copy", "move"
  ],
  
  // 验证函数
  validate_command(cmd: STRING) → VALIDATION_RESULT {
    // 1. 检查危险模式
    for (pattern in dangerous_patterns) {
      if (cmd.contains(pattern)) {
        return { valid: false, error: "DANGEROUS_PATTERN_DETECTED", pattern }
      }
    }
    
    // 2. 提取命令名
    cmd_name = cmd.split(" ")[0]
    
    // 3. 检查白名单
    if (cmd_name not in allowed_commands) {
      return { valid: false, error: "COMMAND_NOT_IN_WHITELIST", cmd_name }
    }
    
    return { valid: true }
  }
}
```

### 长度验证规则

```typescript
LENGTH_VALIDATION ::= {
  // 各类输入的最大长度
  max_lengths: {
    file_name: 255,         // 文件名
    file_path: 4096,        // 文件路径
    document_content: 1000000,  // 文档内容（1MB）
    command_args: 8192,     // 命令参数
    user_input: 10000,      // 用户输入
    skill_description: 200  // 技能描述
  },
  
  // 验证函数
  validate_length(input: STRING, type: STRING) → VALIDATION_RESULT {
    max = max_lengths[type]
    if (input.length > max) {
      return { 
        valid: false, 
        error: "INPUT_TOO_LONG",
        actual: input.length,
        max: max
      }
    }
    return { valid: true }
  }
}
```

### 格式验证规则

```typescript
FORMAT_VALIDATION ::= {
  // 文档命名格式
  document_naming: {
    pattern: "^[A-Z]+-[A-Z0-9-]+-v\\d+\\.\\d+-\\d{8}\\.md$",
    example: "SD-GAMEPLAY-v1.0-20240219.md"
  },
  
  // 日期格式
  date_format: {
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    example: "2024-02-19"
  },
  
  // 版本格式
  version_format: {
    pattern: "^v\\d+\\.\\d+$",
    example: "v1.0"
  },
  
  // 角色ID格式
  role_id_format: {
    pattern: "^[A-Z]+-?\\d*$",
    examples: ["PL", "LD", "SD-1", "QA-3"]
  }
}
```

### 内容验证规则

```typescript
CONTENT_VALIDATION ::= {
  // XSS防护
  xss_patterns: [
    "<script",
    "javascript:",
    "onerror=",
    "onload=",
    "<iframe"
  ],
  
  // SQL注入防护
  sql_injection_patterns: [
    "' OR '1'='1",
    "'; DROP TABLE",
    "--",
    "/*",
    "*/"
  ],
  
  // 验证函数
  validate_content(content: STRING) → VALIDATION_RESULT {
    // 1. XSS检查
    for (pattern in xss_patterns) {
      if (content.lower().contains(pattern)) {
        return { valid: false, error: "XSS_PATTERN_DETECTED", pattern }
      }
    }
    
    // 2. SQL注入检查
    for (pattern in sql_injection_patterns) {
      if (content.contains(pattern)) {
        return { valid: false, error: "SQL_INJECTION_DETECTED", pattern }
      }
    }
    
    return { valid: true }
  }
}
```

### 综合验证接口

```typescript
FUNCTION: validate_all_inputs(
  inputs: {
    paths: [STRING],
    commands: [STRING],
    content: STRING,
    metadata: OBJECT
  }
) → COMPREHENSIVE_VALIDATION_RESULT

COMPREHENSIVE_VALIDATION_RESULT ::= {
  valid: BOOL,
  path_validation: VALIDATION_RESULT,
  command_validation: VALIDATION_RESULT,
  length_validation: VALIDATION_RESULT,
  format_validation: VALIDATION_RESULT,
  content_validation: VALIDATION_RESULT,
  errors: [VALIDATION_ERROR],
  warnings: [VALIDATION_WARNING]
}

示例:
  PL → contract-validator.validate_all_inputs({
    paths: ["projects/game/docs/test.md"],
    commands: ["npm run build"],
    content: "# Game Design Document",
    metadata: { version: "v1.0", date: "2024-02-19" }
  })
  
  返回: {
    valid: true,
    path_validation: { valid: true },
    command_validation: { valid: true },
    length_validation: { valid: true },
    format_validation: { valid: true },
    content_validation: { valid: true },
    errors: [],
    warnings: []
  }
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，支持完整契约验证 |
| v1.1 | 2026-02-19 | 增加反幻觉验证机制，新增QA-TESTER角色契约 |
| v1.2 | 2026-02-20 | 增加输入验证规范（路径、命令、长度、格式、内容验证） |
