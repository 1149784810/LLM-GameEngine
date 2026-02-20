---
name: "skill-optimizer"
version: "2.2.0"
description: "分析和优化技能定义，消除冗余和冲突。指导新技能创建时拥有正确的Header元数据。自动更新测试框架覆盖新引擎模块。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-21"

layer: 4
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "skill-development-guide"
    layer: 1
    type: "required"
    purpose: "技能开发规范"

contracts:
  input:
    required_documents:
      - pattern: ".trae/skills/*/SKILL.md"
        description: "待优化的技能文件"
  output:
    required_documents:
      - pattern: "reports/skill-optimization-report-.*\\.md"
        description: "技能优化报告"

execution:
  mode: "blocking"
  preconditions:
    - type: "ARTIFACT_EXISTS"
      target: ".trae/skills/*/SKILL.md"
      description: "至少存在一个技能文件"
  postconditions:
    - type: "STATE_UPDATE"
      target: "skill_library.optimized"
      value: true
  rollback:
    supported: true
    strategy: "checkpoint"
    side_effects:
      - "恢复技能文件到优化前状态"
    recovery_actions:
      - action: "RESTORE_ARTIFACTS"
        target: ".trae/skills/*/SKILL.md"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "所有技能Header符合规范"
      metric: "header_compliance_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "无循环依赖"
      metric: "circular_dependency_count"
      threshold: 0
      operator: "=="
      required: true
    - id: "AC-003"
      description: "测试覆盖率"
      metric: "test_coverage_rate"
      threshold: 1.0
      operator: "=="
      required: true
  testing:
    required_tests:
      - type: "FT"
        description: "功能测试"
        required: true
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
  error_codes:
    - code: "E001"
      name: "REDUNDANCY_DETECTED"
      severity: "MEDIUM"
      rollback_required: false
    - code: "E002"
      name: "CONFLICT_DETECTED"
      severity: "HIGH"
      rollback_required: false
    - code: "E003"
      name: "HEADER_INVALID"
      severity: "HIGH"
      rollback_required: true
    - code: "E004"
      name: "CIRCULAR_DEPENDENCY"
      severity: "CRITICAL"
      rollback_required: true
  checkpoints:
    - id: "CP-001"
      name: "冗余检测完成"
      position: "after_redundancy_check"
      rollback_supported: true
    - id: "CP-002"
      name: "Header验证完成"
      position: "after_header_validation"
      rollback_supported: true
    - id: "CP-003"
      name: "测试框架更新完成"
      position: "after_test_update"
      rollback_supported: true

functions:
  main:
    name: "optimize_skills"
    signature: "optimize_skills(skills: [SKILL]) -> OPTIMIZATION_RESULT"
    description: "优化技能定义"
  validators:
    - name: "validate_new_skill_header"
      signature: "validate_new_skill_header(skill_path: PATH) -> HEADER_VALIDATION_RESULT"
      description: "验证新技能Header是否符合规范"
    - name: "check_header_completeness"
      signature: "check_header_completeness(header: HEADER) -> COMPLETENESS_REPORT"
      description: "检查Header完整性"
  queries:
    - name: "detect_redundancy"
      signature: "detect_redundancy() -> [REDUNDANCY_REPORT]"
      description: "检测冗余"
    - name: "get_header_template"
      signature: "get_header_template(skill_type: STRING, layer: NUMBER) -> HEADER_TEMPLATE"
      description: "获取Header模板"
    - name: "list_missing_tests"
      signature: "list_missing_tests() -> [MISSING_TEST_REPORT]"
      description: "列出缺失的测试覆盖"
  state_managers:
    - name: "update_test_framework"
      signature: "update_test_framework(new_skill: SKILL) -> UPDATE_RESULT"
      description: "更新测试框架以覆盖新技能"
    - name: "sync_validator_tools"
      signature: "sync_validator_tools() -> SYNC_RESULT"
      description: "同步验证工具配置"
---

# 技能优化器 (Skill Optimizer)

## 用途

技能优化器负责维护技能库的一致性和高效性，防止技能之间的冗余描述和冲突定义。同时负责指导新技能创建时拥有正确的Header元数据，并自动更新测试框架确保新引擎模块和流程被测试覆盖。

## 调用时机

**必须在以下场景调用：**
1. 创建新技能之前 - 检查是否已有类似技能，指导Header创建
2. 更新现有技能时 - 确保不与其他技能产生冲突
3. 发现技能行为不稳定时 - 检查是否存在重复或矛盾的定义
4. 定期技能库维护 - 审查技能间的依赖关系
5. 新增引擎模块或流程后 - 确保测试框架覆盖

## 核心职责

### 1. 冗余检测
- 扫描现有技能库，识别功能重叠的技能
- 标记描述相似但实现不同的流程定义
- 发现重复的工具调用模式

### 2. 冲突解决
- 对比技能间的描述差异
- 识别相互矛盾的操作指令
- 提供统一化建议

### 3. 技能规范化
- 确保技能描述遵循统一格式
- 验证 frontmatter 完整性
- 检查技能命名的唯一性

### 4. Header规范指导 ⭐新增
- 为新技能生成符合规范的Header模板
- 验证Header元数据完整性
- 检查依赖层级约束
- 确保契约定义正确

### 5. 测试框架自动更新 ⭐新增
- 检测新增技能是否被测试覆盖
- 自动更新skill-validator-cli配置
- 同步skill-header-parser解析规则
- 确保新引擎模块纳入测试范围

## 工作流程

### 创建新技能前（完整流程）
```
1. 读取 .trae/skills/ 目录下所有 SKILL.md
2. 分析新技能的功能描述
3. 对比现有技能，识别重叠区域
4. 如果存在重叠：
   - 建议扩展现有技能而非创建新技能
   - 或明确区分新旧技能的职责边界
5. 生成符合规范的Header模板：
   a. 根据技能类型确定Layer
   b. 分析依赖关系
   c. 定义输入输出契约
   d. 设置执行模式和回滚策略
   e. 配置质量验证标准
   f. 定义错误码和检查点
6. 验证Header完整性
7. 更新测试框架配置
8. 确认无冲突后，才允许创建
```

### 更新技能时
```
1. 读取待更新技能的内容
2. 识别变更范围（描述、工具、流程、Header）
3. 扫描其他技能，检查是否引用或依赖被变更的内容
4. 评估变更对其他技能的影响
5. 验证Header变更是否符合规范
6. 提供兼容性建议或同步更新方案
7. 更新测试框架（如有必要）
```

## Header规范指导

### Header必填字段清单

创建新技能时，必须包含以下字段：

```yaml
---
# === 元数据块 (必填) ===
name: "skill-name"              # 技能唯一标识符
version: "1.0.0"                # 语义化版本号
description: "描述"             # <200字符
author: "Jianle He"             # 作者名称（固定值）
created_at: "YYYY-MM-DD"        # 创建日期
updated_at: "YYYY-MM-DD"        # 更新日期
layer: 0-4                      # 技能层级

# === 依赖定义 (必填) ===
dependencies:
  - name: "dependency-name"
    layer: 0
    type: "required"            # required | optional | conditional
    purpose: "依赖目的"

# === 契约定义 (必填) ===
contracts:
  input:
    required_documents: []
  output:
    required_documents: []

# === 执行定义 (必填) ===
execution:
  mode: "blocking"              # blocking | parallel | conditional
  preconditions: []
  postconditions: []
  rollback:
    supported: true | false

# === 质量定义 (必填) ===
quality:
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false

# === 状态追踪 (必填) ===
tracking:
  execution_status:
    current: "PENDING"
---
```

### Layer分配规则

| Layer | 类型 | 依赖限制 | 示例 |
|-------|------|---------|------|
| 0 | 基础设施层 | 无依赖 | terminology-standard, security-guard |
| 1 | 核心定义层 | 仅依赖Layer 0 | fullstack-game-engine, skill-development-guide |
| 2 | 管理工具层 | 依赖Layer 0-1 | state-manager, contract-validator, event-bus |
| 3 | 业务逻辑层 | 依赖Layer 0-2 | hr-manager, requirement-normalizer, qa-standards-manager |
| 4 | 辅助工具层 | 依赖Layer 0-3 | git-version-control, bug-tracker, skill-optimizer |

### Header生成函数

```
FUNCTION generate_header_template(skill_name, skill_type, description) -> HEADER_TEMPLATE:
    1. 确定 layer = determine_layer(skill_type)
    2. 分析 dependencies = analyze_dependencies(skill_type)
    3. 生成 contracts = generate_contracts(skill_type)
    4. 设置 execution = get_default_execution(skill_type)
    5. 配置 quality = get_default_quality(layer)
    6. 初始化 tracking = get_default_tracking()
    7. 设置 author = "Jianle He"  # 固定作者名称
    8. 设置 created_at = 当前日期
    9. 设置 updated_at = 当前日期
    10. 返回完整Header模板
```

### 作者规范

- **所有技能的 author 字段必须设置为 "Jianle He"**
- 创建新技能时自动填充，禁止修改
- 更新技能时保持 author 不变，仅更新 updated_at

## 测试框架自动更新

### 检测逻辑

```
FUNCTION check_test_coverage() -> COVERAGE_REPORT:
    skills = scan_all_skills()
    test_config = load_test_config()
    
    missing = []
    for skill in skills:
        if skill.name not in test_config.covered_skills:
            missing.append({
                skill: skill.name,
                layer: skill.layer,
                reason: "未纳入测试范围"
            })
    
    return {
        total: len(skills),
        covered: len(skills) - len(missing),
        missing: missing,
        coverage_rate: (len(skills) - len(missing)) / len(skills)
    }
```

### 自动更新流程

```
FUNCTION update_test_framework(new_skill) -> UPDATE_RESULT:
    1. 更新 skill-header-parser.js:
       - 添加新技能到扫描列表
       - 更新依赖图
    
    2. 更新 skill-validator-cli.js:
       - 添加新技能测试用例
       - 更新验证规则（如有新规则）
    
    3. 更新 skill-header-spec.md:
       - 添加新技能类型示例（如适用）
       - 更新Layer分配表（如适用）
    
    4. 运行验证测试:
       - node tools/skill-validator-cli.js validate --skill=<new_skill>
       - node tools/skill-validator-cli.js test-all
    
    5. 返回更新结果
```

## 优化原则

### DRY原则 (Don't Repeat Yourself)
- 同一流程只应在**一个**技能中详细描述
- 其他技能需要引用时，使用"调用XX技能"而非重复描述
- 通用操作（如代码审查）应集中在专门技能中

### 单一职责原则
- 每个技能只负责**一类**任务
- 避免"万能技能"的出现
- 技能间通过明确的接口协作

### 一致性原则
- 相似功能使用相似的描述方式
- 工具调用模式保持统一
- 术语和概念定义全库一致

### Header规范原则 ⭐新增
- 所有技能必须包含完整的Header元数据
- Layer分配必须遵循层级规则
- 依赖关系必须明确声明
- 契约定义必须清晰可验证

## 冲突检测清单

在批准技能创建/更新前，检查：

- [ ] 功能重叠：是否有技能已提供相同功能？
- [ ] 流程冲突：是否描述了与其他技能矛盾的流程？
- [ ] 工具重复：是否重复定义了其他技能已封装的操作？
- [ ] 命名冲突：名称是否与现有技能过于相似？
- [ ] 依赖循环：技能间是否存在循环依赖风险？
- [ ] Header完整性：是否包含所有必填字段？ ⭐新增
- [ ] **作者规范**：author 是否为 "Jianle He"？ ⭐新增
- [ ] Layer合规性：依赖是否只引用同层或下层？ ⭐新增
- [ ] 测试覆盖：新技能是否已纳入测试框架？ ⭐新增

## 输出格式

检测到问题时，输出：

```markdown
## 技能优化报告

### 检测项目：[新技能名/更新技能名]

### 发现的问题
1. **冗余检测**：与 [现有技能A] 功能重叠
   - 重叠区域：[具体描述]
   - 建议：[合并/区分/扩展]

2. **潜在冲突**：与 [现有技能B] 流程矛盾
   - 冲突点：[具体描述]
   - 建议：[统一方案]

3. **Header问题** ⭐新增：
   - 缺失字段：[字段列表]
   - Layer违规：[具体描述]
   - 建议：[修复方案]

### 优化建议
- [具体操作建议]

### Header模板 ⭐新增
```yaml
---
name: "{skill-name}"
version: "1.0.0"
description: "{description}"
author: "Jianle He"              # 固定值，禁止修改
created_at: "{current_date}"
updated_at: "{current_date}"
layer: {layer}
dependencies:
  - name: "{dependency}"
    layer: {dep_layer}
    type: "required"
    purpose: "{purpose}"
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

### 测试更新建议 ⭐新增
- [ ] 更新 skill-header-parser.js
- [ ] 更新 skill-validator-cli.js
- [ ] 运行验证测试

### 最终结论
- [ ] 允许创建/更新
- [ ] 需要修改后重新审查
- [ ] 建议合并到现有技能
```

## 示例场景

### 场景1：创建新技能
**输入**：用户想创建一个新技能 "game-save-manager"
**处理**：
1. 扫描现有技能，确认无功能重叠
2. 确定Layer=3（业务逻辑层）
3. 分析依赖：terminology-standard, fullstack-game-engine, state-manager
4. 生成Header模板
5. 验证Header完整性
6. 更新测试框架配置
7. 输出优化报告和Header模板

### 场景2：重复描述
**问题**：技能A描述了"代码审查流程"，技能B又描述了一次且细节不同
**处理**：
1. 保留技能A作为"代码审查"的权威定义
2. 技能B改为："调用 code-reviewer 技能执行审查"

### 场景3：工具调用冗余
**问题**：多个技能都包含"运行测试"的详细步骤
**处理**：
1. 创建专门的 test-runner 技能
2. 其他技能统一调用 test-runner

### 场景4：流程矛盾
**问题**：技能A说"先保存再提交"，技能B说"先提交再保存"
**处理**：
1. 标记为冲突
2. 分析哪个流程更合理
3. 统一所有技能使用相同流程

### 场景5：Header不完整 ⭐新增
**问题**：新技能缺少version字段和contracts定义
**处理**：
1. 检测到Header不完整
2. 生成补充模板
3. 提供修复建议
4. 验证修复后重新检查

### 场景6：测试覆盖缺失 ⭐新增
**问题**：新增技能未被测试框架覆盖
**处理**：
1. 检测到测试覆盖缺失
2. 自动更新skill-validator-cli.js
3. 添加新技能到测试列表
4. 运行验证确认覆盖
