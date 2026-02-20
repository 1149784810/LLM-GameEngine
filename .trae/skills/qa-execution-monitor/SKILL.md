---
name: "qa-execution-monitor"
version: "1.0.0"
description: "QA执行监督器，负责实时监控QA测试执行过程，强制验证工具调用和截图证据。作为qa-standards-manager的执行层补充，确保所有强制执行条款得到落实。"
author: "Jianle He"
created_at: "2026-02-21"
updated_at: "2026-02-21"

layer: 3
dependencies:
  - name: "contract-validator"
    layer: 2
    type: "required"
    purpose: "契约验证"
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "执行状态追踪"
  - name: "event-bus"
    layer: 2
    type: "required"
    purpose: "事件通知"
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "context-manager"
    layer: 2
    type: "required"
    purpose: "上下文缓冲区监控"

contracts:
  input:
    required_documents:
      - pattern: "docs/05-测试文档/QA-TEST-PLAN-.*\\.md"
        description: "QA测试计划"
  output:
    required_documents:
      - pattern: "docs/05-测试文档/QA-EXECUTION-AUDIT-.*\\.md"
        description: "QA执行审计报告"
      - pattern: "logs/qa-execution-.*\\.log"
        description: "执行监控日志"
    quality_gates:
      - metric: "mandatory_tool_calls"
        threshold: 1
        operator: ">="
        required: true
        description: "至少1个必需工具被调用"
      - metric: "screenshot_evidence_verified"
        threshold: 1
        operator: "=="
        required: true
        description: "截图证据已验证"

execution:
  mode: "blocking"
  preconditions:
    - type: "SKILL_CALLED"
      target: "qa-standards-manager"
      description: "QA标准管理器已被调用"
    - type: "CONTEXT_READ"
      target: "phase-context"
      description: "已读取阶段上下文文件"
  postconditions:
    - type: "AUDIT_COMPLETE"
      target: "output"
      description: "执行审计完成"
    - type: "CONTEXT_UPDATED"
      target: "phase-context"
      description: "已更新阶段上下文文件"
  rollback:
    supported: true
    conditions:
      - "必需工具调用缺失"
      - "截图证据未验证"
    actions:
      - "阻止生成测试报告"
      - "要求补充执行缺失步骤"
      - "记录违规行为"
  context_operations:
    read_at_start: true
    update_at_end: true
    monitor_context_integrity: true

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "所有必需工具调用已记录"
      metric: "tool_call_coverage"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "截图证据已验证"
      metric: "screenshot_verified"
      threshold: 1
      operator: "=="
      required: true
    - id: "AC-003"
      description: "无强制执行违规"
      metric: "violation_count"
      threshold: 0
      operator: "=="
      required: true

testing:
  required_tests:
    - "工具调用追踪测试"
    - "截图验证测试"
    - "强制执行拦截测试"
  evidence_required: true
  evidence_types:
    - "audit_log"
    - "violation_report"

tracking:
  execution_status:
    current: "PENDING"
    checkpoints:
      - "监控器初始化"
      - "工具调用追踪启动"
      - "截图验证完成"
      - "审计报告生成"
  error_codes:
    - code: "E001"
      name: "MISSING_SCREENSHOT_TOOL"
      severity: "CRITICAL"
      description: "未调用截图工具"
    - code: "E002"
      name: "MISSING_LS_VERIFICATION"
      severity: "CRITICAL"
      description: "未使用LS验证截图"
    - code: "E003"
      name: "SCREENSHOT_NOT_FOUND"
      severity: "CRITICAL"
      description: "截图文件不存在"
    - code: "E004"
      name: "ANTI_HALLUCINATION_VIOLATION"
      severity: "CRITICAL"
      description: "违反反幻觉原则"

functions:
  main:
    name: "monitor_qa_execution"
    signature: "monitor_qa_execution(test_plan: TEST_PLAN, config: MONITOR_CONFIG) -> AUDIT_RESULT"
    description: "监控QA测试执行过程，验证工具调用和截图证据"
  validators:
    - name: "validate_tool_calls"
      signature: "validate_tool_calls(tool_calls: [TOOL_CALL], required_tools: [STRING]) -> TOOL_VALIDATION_RESULT"
      description: "验证必需工具是否被调用"
    - name: "validate_screenshot_evidence"
      signature: "validate_screenshot_evidence(screenshot_paths: [FILE_PATH]) -> SCREENSHOT_VALIDATION_RESULT"
      description: "验证截图证据是否完整"
    - name: "validate_anti_hallucination"
      signature: "validate_anti_hallucination(claims: [CLAIM], evidence: [EVIDENCE]) -> AH_VALIDATION_RESULT"
      description: "验证反幻觉原则是否被遵守"
  state_managers:
    - name: "create_execution_checkpoint"
      signature: "create_execution_checkpoint(execution_id: STRING) -> CHECKPOINT_ID"
      description: "创建执行检查点"
    - name: "restore_execution_state"
      signature: "restore_execution_state(checkpoint_id: STRING) -> EXECUTION_STATE"
      description: "恢复执行状态"
  queries:
    - name: "get_tool_call_history"
      signature: "get_tool_call_history(execution_id: STRING) -> [TOOL_CALL]"
      description: "获取工具调用历史"
    - name: "get_violation_report"
      signature: "get_violation_report(execution_id: STRING) -> VIOLATION_REPORT"
      description: "获取违规报告"
    - name: "get_audit_summary"
      signature: "get_audit_summary(execution_id: STRING) -> AUDIT_SUMMARY"
      description: "获取审计摘要"
---

# QA执行监督器 v1.0.0

> **核心职责**：实时监控QA测试执行，强制验证工具调用和截图证据
> 
> **监督原则**：**无证据 = 未执行**，任何声称都必须有对应的工具调用证据
> 
> **强制执行**：本监督器是**绝对强制**的，在生成任何QA报告前**必须**通过验证

---

## ⚠️ 强制执行架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     QA执行监督架构                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 1: 工具调用拦截层                                 │   │
│  │  ├── 拦截所有RunCommand调用                              │   │
│  │  ├── 识别必需工具（take_screenshot.ps1等）              │   │
│  │  └── 记录调用时间戳和参数                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 2: 截图验证层                                     │   │
│  │  ├── 检测LS工具调用                                      │   │
│  │  ├── 验证截图目录存在                                    │   │
│  │  ├── 验证截图文件数量 >= 1                              │   │
│  │  └── 验证截图文件大小 > 0                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 3: 报告生成拦截层                                 │   │
│  │  ├── 拦截Write工具（生成报告前）                         │   │
│  │  ├── 验证工具调用审计通过                                │   │
│  │  ├── 验证截图证据完整                                    │   │
│  │  └── 不通过则阻止报告生成                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 4: 违规处理层                                     │   │
│  │  ├── 记录违规行为                                        │   │
│  │  ├── 触发回滚机制                                        │   │
│  │  └── 要求重新执行测试                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 监督器工作流程

### 阶段1：初始化监控

**触发条件**：检测到QA测试相关操作

**执行步骤**：
1. 读取 `qa-standards-manager` 技能获取强制执行清单
2. 初始化工具调用追踪器
3. 设置监控模式为 "strict"
4. 订阅相关工具调用事件

### 阶段2：实时工具调用追踪

**追踪的工具类型**：

| 工具类别 | 工具名称 | 重要性 | 验证方式 |
|---------|---------|--------|---------|
| 截图工具 | `take_screenshot.ps1` | ⭐⭐⭐ CRITICAL | 必须调用至少1次 |
| 验证工具 | `LS screenshots/` | ⭐⭐⭐ CRITICAL | 必须调用至少1次 |
| 窗口工具 | `window-manager.ps1` | ⭐⭐ HIGH | 建议调用 |
| 服务器工具 | `python -m http.server` | ⭐⭐ HIGH | 建议调用 |
| 浏览器工具 | `start http://...` | ⭐⭐ HIGH | 建议调用 |

**追踪记录格式**：
```json
{
  "timestamp": "2026-02-21T12:00:00Z",
  "tool": "take_screenshot.ps1",
  "params": {
    "OutputDir": "projects/Clicker-Quest/screenshots",
    "FileName": "step1_startup_20260221_120000"
  },
  "status": "called",
  "verified": false
}
```

### 阶段3：截图验证

**验证触发时机**：
- 检测到 `Write` 工具生成QA报告时
- 检测到用户声称"测试完成"时
- 显式调用验证命令时

**验证检查清单**：

```markdown
## 截图证据验证清单

### 1. 目录验证
- [ ] screenshots/ 目录存在
- [ ] 目录中有PNG文件
- [ ] PNG文件数量 >= 1

### 2. 文件验证
- [ ] 每个PNG文件大小 > 0
- [ ] 每个PNG文件大小 > 200KB（全屏截图标准）
- [ ] 文件名符合命名规范

### 3. 工具调用验证
- [ ] `take_screenshot.ps1` 被调用至少1次
- [ ] `LS` 工具被调用验证截图
- [ ] 工具调用时间戳在测试时间范围内

### 4. 反幻觉验证
- [ ] 没有仅凭代码推断的证据
- [ ] 没有虚构的截图文件名
- [ ] 所有声称都有对应的工具调用
```

### 阶段4：报告生成拦截

**拦截逻辑**：

```
IF 用户尝试生成QA报告:
  ├─ 检查工具调用审计记录
  │   ├─ take_screenshot.ps1 调用次数 >= 1 ?
  │   └─ LS 验证调用次数 >= 1 ?
  │
  ├─ 检查截图证据
  │   ├─ screenshots/ 目录存在 ?
  │   ├─ PNG文件数量 >= 1 ?
  │   └─ 所有PNG文件大小 > 0 ?
  │
  ├─ IF 所有检查通过:
  │   └─ 允许生成报告
  │
  └─ ELSE:
      ├─ 阻止生成报告
      ├─ 输出违规清单
      └─ 要求补充执行缺失步骤
```

**违规输出示例**：
```
❌ QA执行监督器拦截报告生成

违规清单：
1. [CRITICAL] 未调用 take_screenshot.ps1
   → 必须执行截图才能声称视觉测试通过

2. [CRITICAL] 未使用 LS 验证截图存在
   → 必须验证截图文件真实存在

3. [CRITICAL] 无截图证据
   → screenshots/ 目录不存在或为空

必须执行以下操作后才能生成报告：
1. 调用 take_screenshot.ps1 进行截图
2. 使用 LS 验证截图文件存在
3. 重新请求生成报告
```

---

## 强制执行检查点

### 检查点1：前置验证

**触发时机**：QA测试开始时

**检查内容**：
- [ ] `qa-standards-manager` 技能已被调用
- [ ] 监控器初始化成功
- [ ] 工具调用追踪器已启动

**失败处理**：
- 阻止继续执行
- 提示必须先调用 `qa-standards-manager`

### 检查点2：工具调用验证

**触发时机**：每个测试步骤后

**检查内容**：
- [ ] 必需工具已被调用
- [ ] 工具调用参数正确
- [ ] 工具调用时间戳合理

### 检查点3：截图验证

**触发时机**：声称VT完成时

**检查内容**：
- [ ] `take_screenshot.ps1` 被调用
- [ ] `LS` 验证截图存在
- [ ] 截图文件有效

### 检查点4：报告生成验证

**触发时机**：生成QA报告前

**检查内容**：
- [ ] 所有必需工具调用已记录
- [ ] 截图证据已验证
- [ ] 无强制执行违规

---

## 违规处理机制

### 违规等级

| 等级 | 描述 | 处理方式 |
|------|------|---------|
| CRITICAL | 缺少必需工具调用 | 阻止报告生成，要求重新执行 |
| HIGH | 缺少建议工具调用 | 警告，允许继续但记录 |
| MEDIUM | 工具调用参数异常 | 警告，要求确认 |
| LOW | 非关键偏差 | 记录，不阻止 |

### 回滚机制

**触发条件**：
- 检测到CRITICAL级别违规
- 用户声称测试通过但无截图证据
- 反幻觉自检未通过

**回滚操作**：
1. 阻止生成测试报告
2. 删除已生成的临时报告
3. 重置测试状态为"未完成"
4. 输出详细的违规清单
5. 要求补充执行缺失步骤

---

## 使用方式

### 自动模式（推荐）

监督器自动在以下场景激活：
- 检测到QA测试相关关键词
- 检测到 `qa-standards-manager` 被调用
- 检测到生成测试报告的意图

### 手动模式

显式调用监督器：
```
Skill: qa-execution-monitor
Action: start-monitoring
Target: [项目名称]
```

显式验证：
```
Skill: qa-execution-monitor
Action: verify-execution
Target: [项目名称]
```

---

## 与其他技能的关系

### 依赖技能
- `qa-standards-manager` - 获取强制执行标准
- `contract-validator` - 验证契约完整性
- `state-manager` - 追踪执行状态
- `event-bus` - 接收工具调用事件

### 被调用场景
- QA测试执行前（自动）
- 生成QA报告前（自动拦截）
- 用户声称测试完成时（自动验证）

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0.0 | 2026-02-21 | 初始版本，实现QA执行实时监控和强制执行验证 |

---

**文档结束**
