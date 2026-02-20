---
name: "context-manager"
version: "1.0.0"
description: "上下文缓冲区管理器，负责创建、读取、更新和验证项目上下文文件。确保所有智能体都能获取最新的执行状态、约束条件和阶段要求。"
author: "Jianle He"
created_at: "2026-02-21"
updated_at: "2026-02-21"

layer: 2
dependencies:
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "状态检查点管理"
  - name: "contract-validator"
    layer: 2
    type: "required"
    purpose: "上下文契约验证"
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"

contracts:
  input:
    required_documents:
      - pattern: "projects/.*/context/current/CONTEXT-CURRENT.md"
        description: "当前上下文文件"
  output:
    required_documents:
      - pattern: "projects/.*/context/history/PHASE-.*-.*-.*-.*.md"
        description: "历史上下文文件"
      - pattern: "projects/.*/context/current/CONTEXT-CURRENT.md"
        description: "当前上下文软链接"

execution:
  mode: "blocking"
  preconditions:
    - type: "PROJECT_INITIALIZED"
      description: "项目已初始化，目录结构已创建"
    - type: "STATE_MANAGER_ACTIVE"
      description: "state-manager技能已激活"
  postconditions:
    - type: "CONTEXT_FILE_VALID"
      description: "上下文文件格式正确且完整"
    - type: "SYMLINK_UPDATED"
      description: "CONTEXT-CURRENT软链接已更新"
  rollback:
    supported: true
    rollback_action: "恢复上一个有效的上下文文件"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "上下文文件必须包含所有必填字段"
      metric: "field_completeness"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "上下文文件必须可读且格式正确"
      metric: "file_validity"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-003"
      description: "软链接必须指向最新的上下文文件"
      metric: "symlink_correctness"
      threshold: 1.0
      operator: "=="
      required: true
  testing:
    required_tests: ["CONTEXT_CREATE", "CONTEXT_READ", "CONTEXT_UPDATE", "CONTEXT_VALIDATE"]
    evidence_required: true

tracking:
  execution_status:
    current: "PENDING"
---

# 上下文缓冲区管理器 (Context Manager)

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **状态管理**：[state-manager](.trae/skills/state-manager/SKILL.md)
> 
> **契约验证**：[contract-validator](.trae/skills/contract-validator/SKILL.md)

---

## 🎯 核心职责

上下文缓冲区管理器负责管理游戏开发流程中的**项目级状态同步**，确保：

1. **所有智能体都能看到最新的执行状态**
2. **每个阶段的要求和约束都被明确记录**
3. **阶段切换时信息不丢失**
4. **强制执行条款被持续传递**

---

## 📁 上下文文件结构

### 目录结构

```
projects/[项目名称]/context/
├── current/
│   └── CONTEXT-CURRENT.md          # 当前上下文（软链接到最新）
├── history/                        # 历史上下文记录
│   ├── PHASE-0-0-INIT-20260221-143000.md
│   ├── PHASE-1-0-REQ-20260221-143500.md
│   ├── PHASE-2-0-HR-20260221-150000.md
│   ├── PHASE-3-0-FLOW-20260221-153000.md
│   ├── PHASE-4-1-LD-SPLIT-20260221-160000.md
│   ├── PHASE-4-2-SD-DESIGN-20260221-163000.md
│   ├── PHASE-4-3-LD-INTEGRATE-20260221-170000.md
│   ├── PHASE-4-4-LP-FRAMEWORK-20260221-173000.md
│   ├── PHASE-4-5-CP-DEV-20260221-180000.md
│   ├── PHASE-4-6-LP-INTEGRATE-20260221-183000.md
│   ├── PHASE-4-7-LP-REVIEW-20260221-190000.md
│   ├── PHASE-4-8-LD-APPROVE-20260221-193000.md
│   ├── PHASE-4-9-SD-ACCEPT-20260221-200000.md
│   ├── PHASE-4-10-1-LT-PLAN-20260221-203000.md
│   ├── PHASE-4-10-2-QA-TEST-20260221-210000.md
│   ├── PHASE-4-10-3-LT-FINAL-VT-20260221-213000.md
│   ├── PHASE-4-10-4-LT-SUMMARY-20260221-220000.md
│   ├── PHASE-5-1-DELIVERY-20260221-223000.md
│   └── PHASE-6-1-EXPERIENCE-20260221-230000.md
│
└── checkpoints/                    # 关键检查点上下文
    ├── BP-001-CONTEXT.md
    ├── BP-001.5-CONTEXT.md
    ├── BP-001.6-CONTEXT.md
    ├── BP-001.7-CONTEXT.md
    ├── BP-002-CONTEXT.md
    ├── ...
    ├── BP-013.5-CONTEXT.md
    └── BP-016-CONTEXT.md
```

### 文件命名规范

```
格式: PHASE-[阶段号]-[步骤号]-[行为描述]-[时间戳].md

示例:
- PHASE-0-0-INIT-20260221-143000.md          # Phase 0, Stage 0, 初始化
- PHASE-4-10-2-QA-TEST-20260221-210000.md    # Phase 4, Step 10-2, QA测试
- PHASE-4-10-3-LT-FINAL-VT-20260221-213000.md # Phase 4, Step 10-3, 最终视觉测试
```

---

## 📝 上下文文件内容模板

### 完整模板

```markdown
---
# 上下文元数据
context_id: "PHASE-4-10-2-QA-TEST-20260221-210000"
project: "Clicker-Quest"
phase: "Phase 4"
stage: "Step 4-10-2"
role: "子QA并行测试"
timestamp_start: "2026-02-21 21:00:00"
timestamp_end: "2026-02-21 22:00:00"
status: "COMPLETED"  # IN_PROGRESS / COMPLETED / BLOCKED
previous_context: "PHASE-4-10-1-LT-PLAN-20260221-203000"
next_context: "PHASE-4-10-3-LT-FINAL-VT-20260221-213000"
---

# 项目上下文缓冲区

## 🔒 强制执行声明
> **本文件是强制执行机制的一部分，所有智能体必须遵守以下内容**
> 
> **读取要求**：执行任何操作前必须读取本文件
> **更新要求**：阶段完成后必须更新本文件
> **诚实原则**：所有记录必须真实，禁止虚构
> **反幻觉**：所有声明必须有证据支持

---

## 📋 当前阶段信息

### 阶段标识
- **阶段ID**: PHASE-4-10-2
- **阶段名称**: 子QA并行测试
- **执行角色**: QA-1, QA-2, QA-3, QA-4, QA-5, QA-6, VV-1, VV-2
- **阻塞点**: BP-013

### 阶段目标
完成所有子QA的并行测试，包括功能测试、视觉测试、边界测试等。

---

## ✅ 当前阶段已做的事情（必须诚实记录）

### 已完成任务清单
| 任务ID | 任务描述 | 执行者 | 完成时间 | 证据文件 | 状态 |
|--------|----------|--------|----------|----------|------|
| QA-1-001 | 核心玩法功能测试 | QA-1 | 21:15:00 | qa1-report.md, screenshots/qa1/ | ✅ |
| QA-2-001 | UI/UX功能测试 | QA-2 | 21:20:00 | qa2-report.md, screenshots/qa2/ | ✅ |
| ... | ... | ... | ... | ... | ... |

### 工具调用记录
| 工具 | 调用次数 | 最后调用时间 | 验证状态 |
|------|----------|--------------|----------|
| take_screenshot.ps1 | 24 | 21:55:00 | ✅ 已验证 |
| window-manager.ps1 | 48 | 21:55:00 | ✅ 已验证 |
| LS | 8 | 21:55:00 | ✅ 已验证 |

### 发现的问题清单
| 问题ID | 问题描述 | 优先级 | 状态 | 截图证据 |
|--------|----------|--------|------|----------|
| BUG-001 | 商店按钮点击无响应 | P1 | 已记录 | bug-001-screenshot.png |
| BUG-002 | 金币显示延迟 | P2 | 已记录 | bug-002-screenshot.png |

---

## 🎯 当前阶段最终执行情况（诚实 + 反幻觉）

### 执行结果
- **总体状态**: ✅ 已完成
- **通过率**: 85%
- **问题数量**: 3个 (P0: 0, P1: 1, P2: 2)
- **测试覆盖率**: 90%

### 反幻觉自检
> **以下检查必须真实回答，禁止虚构**

| 检查项 | 实际结果 | 证据 | 自检结果 |
|--------|----------|------|----------|
| 截图数量是否真实？ | 24张 | screenshots/目录 | ✅ 真实 |
| 测试是否实际执行？ | 是 | command_id记录 | ✅ 真实 |
| 是否有100%通过率？ | 否 (85%) | - | ✅ 真实 |
| 是否仅凭代码推断？ | 否 | 截图证据 | ✅ 真实 |
| 问题是否真实存在？ | 是 | 截图证据 | ✅ 真实 |

### 执行总结
```
本阶段由8个子QA并行执行，共完成20项测试任务。
实际发现3个问题，其中1个P1优先级问题需要修复。
所有测试均有截图证据支持，反幻觉检查通过。
```

---

## 📌 下个阶段必须要做的事情（强制执行）

### 下一阶段信息
- **阶段ID**: PHASE-4-10-3
- **阶段名称**: 最终视觉测试
- **执行角色**: 主测试(LT)
- **阻塞点**: BP-013.5

### 必须执行的任务清单
> **以下任务必须完成，禁止跳过**

| 优先级 | 任务ID | 任务描述 | 验收标准 | 强制工具 |
|--------|--------|----------|----------|----------|
| P0 | FVT-001 | 环境准备 | 服务器运行、浏览器全屏 | RunCommand, LS |
| P0 | FVT-002 | 读取测试路径 | 已读取功能路径文档 | Read |
| P0 | FVT-003 | 阻塞式视觉测试 | 每步截图、分析、验证 | take_screenshot.ps1, window-manager.ps1 |
| P0 | FVT-004 | 输出测试报告 | 报告含截图证据、问题清单 | Write |
| P0 | FVT-005 | 更新上下文文件 | 本文件已更新 | Write |

### 强制执行检查点
- [ ] **qa-standards-manager** 已调用
- [ ] **qa-execution-monitor** 已激活
- [ ] 前置技能已调用
- [ ] 工具调用审计通过
- [ ] 截图证据已验证
- [ ] 反幻觉检查通过

---

## 🚫 下个阶段绝对禁止做的事情（强制执行）

### 禁止行为清单
> **以下行为绝对禁止，违反将导致流程阻断**

| 禁止行为 | 后果 | 检测方式 |
|----------|------|----------|
| ❌ 跳过截图直接声称测试通过 | 流程阻断，报告标记为不可信 | 截图数量检查 |
| ❌ 使用OpenPreview代替浏览器全屏 | 流程阻断，测试无效 | 工具调用审计 |
| ❌ 虚构测试结果 | 流程阻断，记录到审计日志 | 反幻觉检查 |
| ❌ 仅凭代码推断声称功能正常 | 流程阻断，要求提供截图 | 报告内容分析 |
| ❌ 100%通过率（首次测试） | 自动标记为可疑，要求重新测试 | 通过率检查 |
| ❌ 跳过反幻觉检查 | 流程阻断，无法进入下一阶段 | 检查点验证 |
| ❌ 不更新上下文文件 | 流程阻断，状态无法同步 | 文件存在检查 |
| ❌ 关闭或忽略伴生技能 | 流程阻断，监控必须持续 | 伴生技能状态检查 |

### 违规处理流程
```
检测到禁止行为
    ↓
立即阻断当前流程
    ↓
记录违规到审计日志
    ↓
要求重新执行
    ↓
只有整改完成后才能继续
```

---

## 🔄 伴生技能持续运行要求（强制执行）

### 必须持续运行的伴生技能
> **以下伴生技能在当前阶段和下个阶段都必须保持运行**

| 伴生技能 | 运行状态 | 检查频率 | 缺失处理 |
|----------|----------|----------|----------|
| **enforcement-guard** (强制执行监督) | 🟢 必须运行 | 每5分钟 | 立即重启，流程暂停 |
| **contract-validator** (契约验证) | 🟢 必须运行 | 每个检查点 | 流程阻断 |
| **qa-standards-manager** (QA标准) | 🟢 必须运行 | QA阶段全程 | 流程阻断 |
| **qa-execution-monitor** (QA执行监督) | 🟢 必须运行 | QA阶段全程 | 流程阻断 |
| **state-manager** (状态管理) | 🟢 必须运行 | 每个BP解锁 | 流程阻断 |
| **bug-tracker** (Bug追踪) | 🟢 必须运行 | Bug发现时 | 流程阻断 |
| **event-bus** (事件总线) | 🟢 必须运行 | 每个事件 | 流程阻断 |

### 伴生技能运行检查
```
每个阶段开始前检查：
    ├─ enforcement-guard 运行中？ → 否 → 立即启动
    ├─ contract-validator 运行中？ → 否 → 立即启动
    ├─ qa-standards-manager 运行中？ → 否 → 立即启动
    ├─ qa-execution-monitor 运行中？ → 否 → 立即启动
    ├─ state-manager 运行中？ → 否 → 立即启动
    └─ 其他伴生技能运行中？ → 否 → 立即启动

任何伴生技能缺失 → 流程暂停 → 启动技能 → 继续
```

---

## 📝 上下文文件更新记录

| 更新时间 | 更新者 | 更新内容 | 版本 |
|----------|--------|----------|------|
| 2026-02-21 21:00:00 | PL | 创建上下文文件 | v1.0 |
| 2026-02-21 22:00:00 | QA-1 | 更新已完成任务 | v1.1 |
| ... | ... | ... | ... |

---

## 🔐 强制执行确认

> **本文件由以下角色确认**

- [ ] **执行者确认**: 我已阅读并理解本文件内容，将严格遵守执行
- [ ] **监督者确认**: enforcement-guard 已验证本文件完整性
- [ ] **状态确认**: state-manager 已保存本上下文状态

**确认签名**:
- 执行者: _______________
- 监督者: enforcement-guard
- 时间: _______________

---

**⚠️ 重要提醒**: 
1. 执行任何操作前必须重新读取本文件
2. 阶段完成后必须更新本文件
3. 所有记录必须真实，禁止虚构
4. 伴生技能必须持续运行
```

---

## 🔧 核心接口

### 1. 创建上下文文件

```typescript
FUNCTION create_context_file(project_name, phase_id, stage_id, role, context_data) -> CONTEXT_FILE_PATH {
  // 构建文件路径
  timestamp = get_current_timestamp()
  filename = `PHASE-${phase_id}-${stage_id}-${role}-${timestamp}.md`
  filepath = `projects/${project_name}/context/history/${filename}`
  
  // 生成文件内容
  content = generate_context_template({
    context_id: filename.replace('.md', ''),
    project: project_name,
    phase: phase_id,
    stage: stage_id,
    role: role,
    timestamp_start: timestamp,
    status: "IN_PROGRESS",
    previous_context: get_previous_context(project_name),
    must_do: context_data.must_do,
    must_not_do: context_data.must_not_do,
    companion_skills: context_data.companion_skills
  })
  
  // 写入文件
  Write(filepath, content)
  
  // 验证文件创建成功
  if (!file_exists(filepath)) {
    throw ERROR("上下文文件创建失败")
  }
  
  return filepath
}
```

### 2. 读取上下文文件

```typescript
FUNCTION read_context_file(project_name) -> CONTEXT_DATA {
  // 构建文件路径
  context_path = `projects/${project_name}/context/current/CONTEXT-CURRENT.md`
  
  // 强制读取上下文文件
  context_content = Read(context_path)
  
  // 解析上下文内容
  context = parse_context(context_content)
  
  // 验证上下文完整性
  if (!validate_context_integrity(context)) {
    BLOCK("上下文文件不完整或损坏")
  }
  
  // 检查伴生技能运行状态
  companion_status = check_companion_skills_running(context.companion_skills)
  if (!companion_status.all_running) {
    BLOCK("伴生技能未全部运行: " + companion_status.missing_skills)
  }
  
  return {
    must_do: context.next_stage.must_do,
    must_not_do: context.next_stage.must_not_do,
    companion_skills: context.companion_skills,
    current_status: context.current_stage.status,
    previous_results: context.current_stage.execution_results
  }
}
```

### 3. 更新上下文文件

```typescript
FUNCTION update_context_file(project_name, phase_id, stage_id, role, execution_result) -> UPDATE_RESULT {
  // 构建新的上下文文件名
  timestamp = get_current_timestamp()
  new_filename = `PHASE-${phase_id}-${stage_id}-${role}-${timestamp}.md`
  new_filepath = `projects/${project_name}/context/history/${new_filename}`
  
  // 获取当前上下文
  current_context = read_current_context(project_name)
  
  // 生成新的上下文内容
  new_context_content = generate_context_content({
    previous_context: current_context,
    execution_result: execution_result,
    timestamp_end: timestamp,
    status: execution_result.status,
    must_do: get_next_stage_must_do(phase_id, stage_id),
    must_not_do: get_next_stage_must_not_do(phase_id, stage_id),
    companion_skills: get_companion_skills_requirements()
  })
  
  // 写入新的上下文文件
  Write(new_filepath, new_context_content)
  
  // 更新 CURRENT 软链接
  update_current_symlink(project_name, new_filepath)
  
  // 验证更新成功
  if (!file_exists(new_filepath)) {
    BLOCK("上下文文件更新失败")
  }
  
  return {
    success: true,
    new_context_path: new_filepath,
    timestamp: timestamp
  }
}
```

### 4. 验证上下文文件

```typescript
FUNCTION validate_context_file(filepath) -> VALIDATION_RESULT {
  // 检查文件存在
  if (!file_exists(filepath)) {
    return { valid: false, error: "文件不存在" }
  }
  
  // 读取文件内容
  content = Read(filepath)
  
  // 检查必填字段
  required_fields = [
    "context_id",
    "project",
    "phase",
    "stage",
    "role",
    "timestamp_start",
    "status"
  ]
  
  for (field in required_fields) {
    if (!content.contains(field)) {
      return { valid: false, error: `缺少必填字段: ${field}` }
    }
  }
  
  // 检查格式
  if (!content.starts_with("---") || !content.contains("# 项目上下文缓冲区")) {
    return { valid: false, error: "文件格式不正确" }
  }
  
  return { valid: true }
}
```

---

## 🚀 使用流程

### 阶段开始前（第一个操作）

```
【新智能体/角色开始工作】
    ↓
【强制】调用 context-manager.read_context_file(project_name)
    ↓
解析上下文内容：
- 了解上个阶段的执行情况
- 了解当前阶段必须做的事情
- 了解当前阶段禁止做的事情
- 了解伴生技能运行要求
    ↓
只有读取成功，才能开始执行
```

### 阶段完成后（最后一个操作）

```
【完成最后一个任务】
    ↓
【强制】调用 context-manager.update_context_file(
  project_name,
  phase_id,
  stage_id,
  role,
  execution_result
)
    ↓
生成新的上下文文件
更新 CONTEXT-CURRENT 软链接
    ↓
只有更新成功，阶段才算真正完成
```

---

## ⚠️ 强制执行规则

### 绝对禁止行为

| 禁止行为 | 后果 | 检测方式 |
|----------|------|----------|
| ❌ 不读取上下文文件就开始工作 | 流程阻断 | 操作顺序审计 |
| ❌ 不更新上下文文件就结束阶段 | 流程阻断 | 文件存在检查 |
| ❌ 虚构上下文内容 | 严重违规 | 反幻觉检查 |
| ❌ 跳过伴生技能检查 | 流程阻断 | 状态检查 |

### 强制执行检查清单

```markdown
## 阶段执行强制检查清单

### 阶段开始前
- [ ] 读取上下文文件（第一个操作）
- [ ] 确认伴生技能运行状态
- [ ] 验证前置阻塞点已解锁

### 阶段执行中
- [ ] 遵循"必须做"清单
- [ ] 避免"禁止做"清单
- [ ] 伴生技能持续运行

### 阶段完成后
- [ ] 更新上下文文件（最后一个操作）
- [ ] 执行反幻觉自检
- [ ] 保存状态检查点
```

---

## 📊 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2026-02-21 | 初始版本，创建上下文缓冲区管理器 |

---

**注意**: 本技能是强制执行机制的核心组成部分，所有智能体必须严格遵守。
