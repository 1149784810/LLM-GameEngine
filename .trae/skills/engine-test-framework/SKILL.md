---
name: "engine-test-framework"
version: "2.3.0"
description: "引擎测试框架，快速验证全栈游戏开发引擎的全部流程和技能Header元数据，无需运行完整游戏开发周期。包含QA测试阶段验证，确保测试严格度。测试报告输出到归档文件夹：reports/etf-v{框架版本}-engine-v{引擎版本}-{日期}/"
author: "engine-team"
created_at: "2026-02-20"
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
  - name: "skill-development-guide"
    layer: 1
    type: "required"
    purpose: "技能开发规范引用"

contracts:
  input:
    required_documents:
      - pattern: ".trae/skills/*/SKILL.md"
        description: "待测试的技能文件"
    optional_documents:
      - pattern: "tools/engine-test-framework/config/*.yaml"
        description: "测试场景配置文件"
  output:
    required_documents:
      - pattern: "reports/etf-v.*-engine-v.*-\\d{8}/test-report-.*\\.md"
        description: "测试报告（归档格式：etf-v{框架版本}-engine-v{引擎版本}-{日期}）"
    validation_rules:
      - type: "PASS_RATE"
        threshold: 0.95
        description: "测试通过率应达到95%以上"
    quality_gates:
      - metric: "header_compliance_rate"
        threshold: 1.0
        operator: "=="
        required: true

execution:
  mode: "blocking"
  preconditions:
    - type: "ARTIFACT_EXISTS"
      target: ".trae/skills/*/SKILL.md"
      description: "至少存在一个技能文件"
    - type: "ARTIFACT_EXISTS"
      target: "tools/engine-test-framework/cli.js"
      description: "测试框架CLI存在"
  postconditions:
    - type: "ARTIFACT_CREATED"
      target: "reports/etf-v*-engine-v*-*/test-report-*.md"
      description: "生成测试报告到归档文件夹"
    - type: "STATE_UPDATE"
      target: "test_framework.last_run"
      value: "timestamp"
  rollback:
    supported: true
    strategy: "checkpoint"
    rollback_point: "TEST_START"
    side_effects:
      - "删除本次生成的测试报告及归档文件夹"
    recovery_actions:
      - action: "DELETE_ARTIFACTS"
        target: "reports/etf-v*-engine-v*-*/"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "Header验证通过率"
      metric: "header_pass_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "依赖验证通过率"
      metric: "dependency_pass_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-003"
      description: "函数签名验证通过率"
      metric: "function_pass_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-004"
      description: "阻塞点定义验证通过率"
      metric: "blockage_pass_rate"
      threshold: 0.9
      operator: ">="
      required: true
    - id: "AC-005"
      description: "并行阶段验证通过率"
      metric: "parallel_pass_rate"
      threshold: 0.9
      operator: ">="
      required: true
    - id: "AC-006"
      description: "Agent调度验证通过率"
      metric: "agent_dispatch_pass_rate"
      threshold: 0.9
      operator: ">="
      required: true
  testing:
    required_tests:
      - type: "FT"
        description: "框架功能测试"
        required: true
      - type: "VT"
        description: "验证规则测试"
        required: true
    evidence_required: true
    anti_hallucination:
      enabled: false
      level: "LEVEL_1"
  review:
    required: false
    reviewer: ""
    checklist: []

tracking:
  execution_status:
    current: "PENDING"
    started_at: null
    completed_at: null
    duration_ms: null
  error_codes:
    - code: "E001"
      name: "SKILL_NOT_FOUND"
      severity: "HIGH"
      rollback_required: false
    - code: "E002"
      name: "HEADER_VALIDATION_FAILED"
      severity: "HIGH"
      rollback_required: false
    - code: "E003"
      name: "CIRCULAR_DEPENDENCY"
      severity: "CRITICAL"
      rollback_required: true
    - code: "E004"
      name: "LAYER_VIOLATION"
      severity: "HIGH"
      rollback_required: false
    - code: "E005"
      name: "BLOCKAGE_UNDEFINED"
      severity: "HIGH"
      rollback_required: false
    - code: "E006"
      name: "PARALLEL_STAGE_INVALID"
      severity: "MEDIUM"
      rollback_required: false
    - code: "E007"
      name: "AGENT_DISPATCH_INCOMPLETE"
      severity: "MEDIUM"
      rollback_required: false
    - code: "E008"
      name: "QA_STAGE_INCOMPLETE"
      severity: "HIGH"
      rollback_required: false
    - code: "E009"
      name: "ANTI_HALLUCINATION_MISSING"
      severity: "CRITICAL"
      rollback_required: false
    - code: "E010"
      name: "EVIDENCE_REQUIREMENT_MISSING"
      severity: "HIGH"
      rollback_required: false
  checkpoints:
    - id: "CP-001"
      name: "技能扫描完成"
      position: "after_scan"
      rollback_supported: true
    - id: "CP-002"
      name: "测试套件执行完成"
      position: "after_test"
      rollback_supported: true
    - id: "CP-003"
      name: "报告生成完成"
      position: "after_report"
      rollback_supported: true

functions:
  main:
    name: "test_all"
    signature: "test_all(options: TEST_OPTIONS) -> TEST_RESULT"
    description: "执行所有测试套件"
  validators:
    - name: "validate_header"
      signature: "validate_header(skill: SKILL_DATA) -> VALIDATION_RESULT"
      description: "验证技能Header元数据"
    - name: "validate_dependency"
      signature: "validate_dependency(skills: SKILL_MAP, graph: DEP_GRAPH) -> VALIDATION_RESULT"
      description: "验证依赖关系"
    - name: "validate_function"
      signature: "validate_function(header: HEADER) -> VALIDATION_RESULT"
      description: "验证函数签名"
    - name: "validate_blockage"
      signature: "validate_blockage(content: STRING) -> VALIDATION_RESULT"
      description: "验证阻塞点定义"
    - name: "validate_parallel_stage"
      signature: "validate_parallel_stage(content: STRING) -> VALIDATION_RESULT"
      description: "验证并行阶段定义"
    - name: "validate_agent_dispatch"
      signature: "validate_agent_dispatch(content: STRING) -> VALIDATION_RESULT"
      description: "验证Agent调度记录"
    - name: "validate_qa_stage"
      signature: "validate_qa_stage(content: STRING) -> VALIDATION_RESULT"
      description: "验证QA测试阶段定义"
    - name: "validate_anti_hallucination"
      signature: "validate_anti_hallucination(content: STRING) -> VALIDATION_RESULT"
      description: "验证反幻觉机制定义"
    - name: "validate_evidence_requirements"
      signature: "validate_evidence_requirements(content: STRING) -> VALIDATION_RESULT"
      description: "验证测试证据要求"
  state_managers:
    - name: "save_checkpoint"
      signature: "save_checkpoint(state: STATE) -> CHECKPOINT_ID"
      description: "保存测试检查点"
    - name: "rollback_to"
      signature: "rollback_to(checkpoint_id: CHECKPOINT_ID) -> STATE"
      description: "回滚到指定检查点"
  queries:
    - name: "get_test_results"
      signature: "get_test_results() -> TEST_RESULT_MAP"
      description: "获取测试结果"
    - name: "get_skill_header"
      signature: "get_skill_header(skill_name: STRING) -> HEADER"
      description: "获取技能Header"
    - name: "get_dependency_graph"
      signature: "get_dependency_graph() -> DEP_GRAPH"
      description: "获取依赖图"
    - name: "get_blockage_points"
      signature: "get_blockage_points() -> BLOCKAGE_MAP"
      description: "获取阻塞点定义"
    - name: "get_parallel_stages"
      signature: "get_parallel_stages() -> PARALLEL_STAGE_MAP"
      description: "获取并行阶段定义"
    - name: "get_qa_test_types"
      signature: "get_qa_test_types() -> TEST_TYPE_MAP"
      description: "获取QA测试类型定义"
    - name: "get_anti_hallucination_rules"
      signature: "get_anti_hallucination_rules() -> ANTI_HALLUCINATION_RULE_MAP"
      description: "获取反幻觉验证规则"
    - name: "get_evidence_requirements"
      signature: "get_evidence_requirements() -> EVIDENCE_REQUIREMENT_MAP"
      description: "获取测试证据要求"
---

# 引擎测试框架 (Engine Test Framework)

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **技能规范**：[skill-development-guide](.trae/skills/skill-development-guide/SKILL.md)

---

## 功能概述

本技能是全栈游戏开发引擎的测试框架，能够：

1. **快速验证引擎流程** - 无需运行完整游戏开发周期
2. **验证技能Header元数据** - 检查必填字段、Layer约束、版本格式
3. **验证依赖关系** - 检测循环依赖、Layer层级违规
4. **验证函数签名** - 检查主函数、验证器、状态管理器定义
5. **模拟LLM环境** - Mock Agent工厂和幻觉注入器

---

## 调用时机

**必须在以下场景调用：**

1. 创建新技能后 - 验证Header完整性
2. 更新现有技能时 - 验证变更不影响其他技能
3. 定期引擎维护 - 确保所有技能符合规范
4. CI/CD流程中 - 自动化测试验证
5. 用户执行"启动测试框架"命令时

---

## 目录结构

```
tools/engine-test-framework/
├── cli.js                       # 命令行入口
├── package.json                 # 依赖配置 (js-yaml)
├── README.md                    # 使用文档
├── config/
│   └── test-scenarios.yaml      # 测试场景配置
├── core/
│   ├── test-runner.js           # 测试运行器
│   ├── base-test-suite.js       # 测试套件基类
│   ├── header-validator.js      # Header验证器
│   ├── dependency-validator.js  # 依赖验证器
│   └── function-validator.js    # 函数验证器
├── suites/
│   ├── header-test-suite.js     # Header测试套件
│   ├── dependency-test-suite.js # 依赖测试套件
│   ├── function-test-suite.js   # 函数测试套件
│   ├── blockage-test-suite.js   # 阻塞点测试套件 ⭐新增
│   ├── parallel-stage-test-suite.js # 并行阶段测试套件 ⭐新增
│   ├── agent-dispatch-test-suite.js # Agent调度测试套件 ⭐新增
│   └── qa-stage-test-suite.js   # QA测试阶段验证套件 ⭐新增
└── mock/
    ├── mock-agent-factory.js    # Mock Agent工厂
    └── hallucination-injector.js # 幻觉注入器

reports/                                            # 测试报告输出目录（项目根目录）
└── etf-v2.3.0-engine-v1.0.0-20260220/              # 归档文件夹格式
    ├── test-report-1739876543210.md                # 测试报告（带时间戳）
    └── test-report-1739876543210-summary.md        # 可选：摘要报告
```

---

## 使用方法

### 命令行接口

```bash
# 测试所有技能
node tools/engine-test-framework/cli.js test-all

# 测试单个技能
node tools/engine-test-framework/cli.js test --skill=<skill-name>

# 运行特定测试套件
node tools/engine-test-framework/cli.js suite --name=header
node tools/engine-test-framework/cli.js suite --name=dependency
node tools/engine-test-framework/cli.js suite --name=function
node tools/engine-test-framework/cli.js suite --name=blockage      # 阻塞点测试 ⭐新增
node tools/engine-test-framework/cli.js suite --name=parallel     # 并行阶段测试 ⭐新增
node tools/engine-test-framework/cli.js suite --name=agent-dispatch # Agent调度测试 ⭐新增
node tools/engine-test-framework/cli.js suite --name=qa-stage     # QA测试阶段验证 ⭐新增
node tools/engine-test-framework/cli.js suite --name=flow         # 流程验证（blockage+parallel+agent-dispatch）⭐新增
node tools/engine-test-framework/cli.js suite --name=qa           # QA验证（qa-stage）⭐新增
node tools/engine-test-framework/cli.js suite --name=all          # 运行所有测试套件 ⭐新增

# 生成Markdown报告（自动输出到归档文件夹）
node tools/engine-test-framework/cli.js report

# 或指定自定义输出路径
node tools/engine-test-framework/cli.js report --output=reports/custom-report.md

# 详细输出模式
node tools/engine-test-framework/cli.js test-all --verbose

# JSON输出（用于管道处理）
node tools/engine-test-framework/cli.js test-all --json
```

### 技能调用方式

```
WHEN 用户执行"启动测试框架"命令:
    1. 调用 engine-test-framework 技能
    2. 执行 test_all() 主函数
    3. 运行所有测试套件
    4. 生成测试报告
    5. 返回测试结果
```

---

## 测试套件说明

### 1. Header测试套件

验证技能Header元数据的完整性和正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| REQUIRED_FIELDS | name, version, description, layer, dependencies | ERROR |
| LAYER_CONSTRAINT | Layer 必须是 0-4 | ERROR |
| VERSION_FORMAT | 格式: v1.0.0 或 1.0.0 | WARNING |
| DESCRIPTION_LENGTH | 限制 200 字符 | WARNING |
| NAME_MATCH | header.name == 目录名 | WARNING |
| DEPENDENCIES_FORMAT | 数组格式，每项有 name/layer/type | WARNING |
| CONTRACTS_FORMAT | input/output 契约存在 | ERROR |
| EXECUTION_FORMAT | mode/rollback 配置 | WARNING |
| TRACKING_FORMAT | execution_status/error_codes | WARNING |
| QUALITY_FORMAT | acceptance_criteria/anti_hallucination | WARNING |
| FUNCTIONS_FORMAT | main/validators/queries 定义 | WARNING |

### 2. Dependency测试套件

验证技能依赖关系的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| CIRCULAR_DEPENDENCY | DFS 检测循环依赖 | CRITICAL |
| LAYER_VIOLATION | 高层级不能依赖低层级 | ERROR |
| DEPENDENCY_EXISTS | 依赖的技能必须存在 | ERROR |
| DEPENDENCY_TYPE | required/optional/conditional | WARNING |

### 3. Function测试套件

验证技能函数签名的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| MAIN_FUNCTION | name/signature/description | ERROR |
| VALIDATORS | 验证器函数签名 | WARNING |
| STATE_MANAGERS | 状态管理器函数签名 | WARNING |
| QUERIES | 查询函数签名 | WARNING |

### 4. Blockage测试套件 ⭐新增

验证阻塞点定义的完整性和正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| BLOCKAGE_DEFINED | BP-001至BP-016是否定义 | ERROR |
| BLOCKAGE_SEQUENCE | 阻塞点顺序是否正确 | WARNING |
| BLOCKAGE_UNLOCK_CONDITION | 解锁条件是否明确 | WARNING |
| BLOCKAGE_IN_FLOW | 是否嵌入流程图 | ERROR |
| BLOCKAGE_TRACKING | 状态追踪机制 | WARNING |
| BLOCKAGE_STATE_MANAGER_REF | state-manager引用 | WARNING |

**阻塞点定义**：
- BP-001: 需求澄清完成
- BP-002: 主策划需求拆分完成
- BP-003: 子策划并行设计完成
- BP-004: 主策划文档整合完成
- BP-005: UI布局验收说明完成
- BP-006: 主程序员框架搭建完成
- BP-007: 子程序员并行开发完成
- BP-008: 主程序员代码整合完成
- BP-009: 主程序员代码审查完成
- BP-010: 主策划过审完成
- BP-011: 子策划并行验收完成
- BP-012: 主测试计划制定完成
- BP-013: 子QA并行测试完成
- BP-014: 主测试汇总完成
- BP-015: 项目交付完成
- BP-016: 项目经验总结完成

### 5. Parallel Stage测试套件 ⭐新增

验证并行阶段定义的完整性和正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| PARALLEL_STAGE_DEFINED | 并行阶段是否定义 | ERROR |
| PARALLEL_ROLE_COUNT | 角色数量是否达标 | WARNING |
| PARALLEL_PRINCIPLES | 并行原则是否定义 | WARNING |
| PARALLEL_TRIGGER | 触发条件是否明确 | WARNING |
| PARALLEL_PROHIBITIONS | 禁止行为是否定义 | WARNING |

**并行阶段定义**：
- Stage 1-2: 子策划并行细化（最少5人，目标15人）
- Stage 2-2: 子程序员并行开发（最少5人，目标14人）
- Stage 3-2: 子策划并行验收（最少5人，目标14人）
- Step 3-3-2: 子QA并行测试（最少3人，目标8人）

**并行原则**：
- 最大化并行原则
- 应上尽上原则
- 禁止一人多职
- 任务粒度控制

### 6. Agent Dispatch测试套件 ⭐新增

验证Agent调度记录的完整性和正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| AGENT_ROLE_DEFINED | 角色定义完整性 | WARNING |
| DISPATCH_TIMING | 调度时机定义 | WARNING |
| COMPANION_STAGES | 伴生阶段定义 | WARNING |
| DISPATCH_RECORD_FORMAT | 调度记录格式 | WARNING |
| AGENT_DISPATCHER_SKILL | agent-dispatcher技能 | ERROR |

**Agent角色定义**：
- PL: 项目负责人（调度中转）
- LD: 主策划
- SD/BD/LvD/CD/3CD/ND/TD/AD: 子策划
- LP: 主程序员
- SkD/BkD/TA/3CP/LvP/UIP/TDP/AP: 子程序员
- LT: 主测试
- QA/VV: 测试人员

**伴生阶段定义**：
- 伴生阶段-A: agent-dispatcher（智能体调度）
- 伴生阶段-B: qa-standards-manager（验收标准）
- 伴生阶段-C: bug-tracker（Bug追踪）

### 7. QA Stage测试套件 ⭐新增

验证QA测试阶段的严格度和精确度，确保QA阶段不会流于形式：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| TEST_TYPES_DEFINED | FT/VT/FPT/RT测试类型定义 | ERROR |
| ANTI_HALLUCINATION | 反幻觉机制定义 | CRITICAL |
| EVIDENCE_REQUIREMENTS | 测试证据要求 | ERROR |
| ACCEPTANCE_CRITERIA | 验收标准完整性 | ERROR |
| EXPERIENCE_INTEGRATION | 经验库集成流程 | WARNING |
| REGRESSION_REQUIREMENTS | 回归测试要求 | ERROR |
| QA_EXECUTION_CHECKLIST | QA执行清单 | WARNING |
| PROHIBITED_BEHAVIORS | 禁止行为定义 | WARNING |

**测试类型定义**：
- FT: 功能测试（P0，不可跳过）
- VT: 视觉测试（P0，不可跳过）
- FPT: 完整路径测试（P0，不可跳过）
- RT: 回归测试（P0，不可跳过）
- PT: 性能测试（P1，可跳过）

**反幻觉验证规则**：
- 证据优先：无证据 = 未测试
- 悲观假设：代码存在 ≠ 功能正常
- 通过率合理性：100%通过 = 测试无效
- 证据真实性：截图必须包含时间戳
- 禁止行为：禁止虚构测试结果

**测试证据要求**：
- 截图证据：每项测试至少1张截图
- 日志证据：控制台输出记录
- 操作记录：实际执行步骤可追溯
- 时间戳：精确到分钟

**回归测试要求**：
- 修复后必须执行回归测试
- 覆盖所有测试用例
- 验证修复的问题已解决
- 确认未引入新问题

---

## 验证规则详解

### Header验证流程

```
FUNCTION validate_header(skill_data) -> VALIDATION_RESULT:
    errors = []
    warnings = []
    
    // 1. 必填字段检查
    for field in [name, version, description, layer, dependencies]:
        if skill_data.header[field] is undefined:
            errors.append(REQUIRED_FIELD_MISSING, field)
    
    // 2. Layer约束检查
    if skill_data.header.layer not in [0, 1, 2, 3, 4]:
        errors.append(INVALID_LAYER, skill_data.header.layer)
    
    // 3. 版本格式检查
    if not match(skill_data.header.version, /^v?\d+\.\d+(\.\d+)?$/):
        warnings.append(INVALID_VERSION_FORMAT)
    
    // 4. 描述长度检查
    if skill_data.header.description.length > 200:
        warnings.append(DESCRIPTION_TOO_LONG)
    
    // 5. 名称匹配检查
    if skill_data.header.name != skill_data.directory_name:
        warnings.append(NAME_MISMATCH)
    
    // 6. 契约完整性检查
    if not skill_data.header.contracts.input:
        errors.append(INPUT_CONTRACT_MISSING)
    if not skill_data.header.contracts.output:
        errors.append(OUTPUT_CONTRACT_MISSING)
    
    return {
        valid: errors.length == 0,
        errors: errors,
        warnings: warnings
    }
```

### 依赖验证流程

```
FUNCTION validate_dependency(skills, dependency_graph) -> VALIDATION_RESULT:
    errors = []
    
    // 1. 循环依赖检测 (DFS)
    for skill_name in skills:
        cycle = detect_cycle_dfs(skill_name, dependency_graph)
        if cycle:
            errors.append(CIRCULAR_DEPENDENCY, cycle)
    
    // 2. Layer层级违规检测
    for skill_name, skill_data in skills:
        for dep in skill_data.header.dependencies:
            if dep.layer > skill_data.header.layer:
                errors.append(LAYER_VIOLATION, {
                    skill: skill_name,
                    skill_layer: skill_data.header.layer,
                    dependency: dep.name,
                    dependency_layer: dep.layer
                })
    
    // 3. 依赖存在性检查
    for skill_name, skill_data in skills:
        for dep in skill_data.header.dependencies:
            if dep.name not in skills:
                errors.append(DEPENDENCY_NOT_FOUND, dep.name)
    
    return {
        valid: errors.length == 0,
        errors: errors
    }
```

---

## Mock Agent模拟

用于模拟真实LLM环境的Agent行为：

### Agent类型

| 类型 | 角色 | 输出类型 |
|------|------|---------|
| designer | 策划 | markdown |
| programmer | 程序 | code |
| qa | 测试 | report |
| pl | 项目负责人 | plan |

### 幻觉注入模式

| 模式 | 说明 | 默认概率 |
|------|------|---------|
| PERFECT_PASS_RATE | 100%通过率幻觉 | 15% |
| INSUFFICIENT_EVIDENCE | 证据不足 | 20% |
| MISSING_SCREENSHOTS | 截图缺失 | 10% |
| CODE_INFERENCE | 仅凭代码推断 | 25% |
| TEMPLATE_COPY | 模板复制粘贴 | 10% |
| FABRICATED_DATA | 虚构数据 | 15% |
| CONTEXT_COMPRESSION | 上下文压缩信息丢失 | 20% |

### 使用示例

```javascript
const { MockAgentFactory } = require('./mock/mock-agent-factory');

const factory = new MockAgentFactory({
    enableHallucination: true,
    hallucinationIntensity: 'medium'
});

const designer = factory.createAgent('designer', { id: 'designer-1' });
const result = await designer.execute({
    moduleName: 'Combat System',
    description: '战斗系统设计'
});
```

---

## 与其他技能的关系

### 被以下技能调用

- `fullstack-engine-init` - 引擎初始化时验证技能完整性
- `skill-optimizer` - 技能优化后验证变更
- `skill-development-guide` - 新技能创建后验证

### 调用以下技能

- `terminology-standard` - 获取术语定义
- `state-manager` - 保存测试状态和检查点
- `event-bus` - 发布测试完成事件

---

## 输出格式

### 控制台输出

```
═══════════════════════════════════════════════════════════════
  Engine Test Framework v2.0
═══════════════════════════════════════════════════════════════

[1/3] Scanning skill files...
  Found: contract-validator (Layer: 2, Deps: 3)
  ...
  Scan complete: 25 skills found

[2/3] Running test suites...
  Running suite: header...
    header: 275/275 passed
  Running suite: dependency...
    dependency: 4/4 passed
  Running suite: function...
    function: 100/100 passed

[3/3] Generating report...

═══════════════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════════════

Total Skills:     25
Duration:         0.03s
Passed:           379
Failed:           0
Warnings:         0

Pass Rate:        100.0% ✅
```

### Markdown报告

```markdown
# Engine Test Framework Report

## Summary

| Metric | Value |
|--------|-------|
| Total Skills | 25 |
| Duration | 0.03s |
| Passed | 379 |
| Failed | 0 |
| Pass Rate | 100.0% |

## Suite Results

| Suite | Passed | Failed |
|-------|--------|--------|
| header | 275 | 0 |
| dependency | 4 | 0 |
| function | 100 | 0 |

## Failed Tests

[如有失败，列出详细信息]
```

---

## 错误处理

### 错误码映射

| 错误码 | 名称 | 严重程度 | 处理方式 |
|--------|------|----------|---------|
| E001 | SKILL_NOT_FOUND | HIGH | 返回技能不存在错误 |
| E002 | HEADER_VALIDATION_FAILED | HIGH | 列出具体验证失败项 |
| E003 | CIRCULAR_DEPENDENCY | CRITICAL | 触发回滚，阻止流程 |
| E004 | LAYER_VIOLATION | HIGH | 列出层级违规详情 |

### 回滚策略

当检测到CRITICAL级别错误时：

1. 保存当前测试状态到检查点
2. 停止后续测试执行
3. 生成部分测试报告
4. 返回错误详情给调用者

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0.0 | 2026-02-20 | 初始版本，包含Header/Dependency/Function三大测试套件 |
| v2.0.0 | 2026-02-20 | 新增Blockage/Parallel/Agent-Dispatch三大测试套件，支持流程验证 |
| v2.1.0 | 2026-02-20 | 新增QA Stage测试套件，验证QA测试严格度、反幻觉机制、测试证据要求 |
| v2.2.0 | 2026-02-20 | 测试报告输出路径改为项目根目录reports文件夹，便于统一管理测试文档 |
| v2.3.0 | 2026-02-20 | 报告归档机制：自动创建etf-v{框架版本}-engine-v{引擎版本}-{日期}归档文件夹 |
