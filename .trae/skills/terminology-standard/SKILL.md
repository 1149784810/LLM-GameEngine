---
name: "terminology-standard"
version: "1.0.0"
description: "全栈游戏开发术语标准库，定义所有技能必须使用的一致术语、符号系统和命名规范。所有技能开发或更新时必须首先查阅此技能确保术语一致性。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

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
  error_codes: []
  checkpoints: []

functions:
  main:
    name: "get_term"
    signature: "get_term(term_id: STRING) -> TERM_DEFINITION"
    description: "获取术语定义"
  queries:
    - name: "validate_term"
      signature: "validate_term(term: STRING) -> { valid: BOOL, standard: STRING }"
      description: "验证术语是否符合标准"
---

# 全栈游戏开发术语标准 (Terminology Standard)

## 概述

本文档是全栈游戏开发技能库的**术语唯一权威来源**。所有技能在描述流程、角色、阶段时，必须使用本文档定义的标准术语。

**使用规则**：
- 创建新技能前，必须查阅本文档确保术语一致
- 更新现有技能时，必须对照本文档检查术语使用
- 禁止在本文档外定义新的标准术语

---

## 一、核心角色术语

### 1.1 项目管理层

| 标准术语 | 英文标识 | 定义 | 禁止使用 |
|---------|---------|------|---------|
| **项目负责人** | Project Leader (PL) | 当前AI助手，负责统一调度和中转 | "我"、"当前AI"、"调度器" |
| **主策划** | Lead Designer (LD) | 负责需求拆分、设计把控、文档整合 | "策划负责人"、"总策划" |
| **主程序员** | Lead Programmer (LP) | 负责架构设计、框架搭建、代码审查 | "程序负责人"、"技术负责人" |

### 1.2 策划团队（子策划）

| 标准术语 | 英文标识 | 职责范围 |
|---------|---------|---------|
| **系统策划** | System Designer (SD) | 玩法机制、系统规则设计 |
| **数值策划** | Balance Designer (BD) | 经济系统、战斗数值平衡 |
| **关卡策划** | Level Designer (LvD) | 关卡设计、地图布局、流程节奏 |
| **战斗策划** | Combat Designer (CD) | 战斗机制、敌人行为设计 |
| **3C策划** | 3C Designer (3CD) | Camera相机、Controller控制器、Character角色设计 |
| **UI策划** | UI Designer (UID) | 界面设计、交互流程 |
| **文案策划** | Narrative Designer (ND) | 剧情、对话、世界观构建 |
| **新手教程策划** | Tutorial Designer (TD) | 新手引导、教学流程 |
| **音频策划** | Audio Designer (AD) | 音效需求、音乐风格设计 |

### 1.3 程序团队（子程序员）

| 标准术语 | 英文标识 | 职责范围 |
|---------|---------|---------|
| **技能系统程序** | Skill Developer (SkD) | 技能系统、Buff/Debuff机制 |
| **后端程序** | Backend Developer (BkD) | 服务器、数据库、API |
| **技术美术** | Technical Artist (TA) | 渲染特性、着色器、粒子特效 |
| **3C程序** | 3C Developer (3CP) | 相机系统、角色控制器、移动系统 |
| **关卡程序** | Level Developer (LvP) | 关卡系统、关卡加载、场景管理 |
| **UI程序** | UI Developer (UIP) | 界面系统、HUD实现 |
| **新手教程程序** | Tutorial Developer (TDP) | 引导系统、教程流程控制 |
| **音频程序** | Audio Developer (AP) | 音效系统、音乐播放 |

### 1.4 QA团队

| 标准术语 | 英文标识 | 职责范围 |
|---------|---------|---------|
| **QA/功能测试** | QA Tester (QA) | 功能测试、测试用例执行 |
| **视觉验证** | Visual Validator (VV) | UI分析、视觉验证、截图分析 |

---

## 二、阶段与流程术语

### 2.1 开发阶段层级结构

为避免执行时的混淆和误解，开发流程采用**三级层级结构**：

```
Phase（阶段）→ Stage（子阶段）→ Step（步骤）
```

**层级定义**：
- **Phase（阶段）**: 宏观开发阶段，共5个（Phase 0-4）
- **Stage（子阶段）**: Phase内的子阶段，格式为 `Stage X-Y`（Phase X的第Y个子阶段）
- **Step（步骤）**: Stage内的具体执行步骤，格式为 `Step X-Y-Z`（Stage X-Y的第Z个步骤）

### 2.2 开发阶段 (Phase)

| 标准术语 | 标识 | 定义 | 包含Stage |
|---------|------|------|----------|
| **Phase 0** | P0 | 引擎初始化阶段 | Stage 0-0 |
| **Phase 1** | P1 | 需求分析阶段 | Stage 1-1, 1-2, 1-3 |
| **Phase 2** | P2 | 技术实现阶段 | Stage 2-1, 2-2, 2-3 |
| **Phase 3** | P3 | 策划验收阶段 | Stage 3-1, 3-2, 3-3 |
| **Phase 4** | P4 | 最终交付阶段 | Stage 4-1 |

### 2.3 子阶段 (Stage)

**格式**：`Stage X-Y`（表示Phase X的第Y个子阶段）

| 标准术语 | 所属Phase | 定义 | 执行方式 | 关键产出 |
|---------|----------|------|---------|---------|
| **Stage 0-0** | Phase 0 | 引擎初始化 | 阻塞式 | 环境检查通过 |
| **Stage 1-1** | Phase 1 | 主策划需求拆分 | 阻塞式 | 需求拆分文档 |
| **Stage 1-2** | Phase 1 | 子策划并行细化 | 并行式（15人，每人≤2系统） | 子策划设计文档 |
| **Stage 1-3** | Phase 1 | 主策划文档整合 | 阻塞式 | 完整技术需求文档 |
| **Stage 2-1** | Phase 2 | 主程序员框架搭建 | 阻塞式 | 技术框架 |
| **Stage 2-2** | Phase 2 | 子程序员并行开发 | 并行式（14人，每人≤2模块） | 功能代码 |
| **Stage 2-3** | Phase 2 | 主程序员代码审查 | 阻塞式 | 审查通过报告 |
| **Stage 3-1** | Phase 3 | 主策划过审 | 阻塞式 | 过审决策 |
| **Stage 3-2** | Phase 3 | 子策划并行验收 | 并行式（14人） | 验收报告 |
| **Stage 3-3** | Phase 3 | QA测试阶段 | 混合式 | 测试报告 |
| **Stage 4-1** | Phase 4 | 项目交付 | 阻塞式 | 最终交付物 |

### 2.4 执行步骤 (Step)

**格式**：`Step X-Y-Z`（表示Stage X-Y的第Z个执行步骤）

仅在需要进一步细分的Stage中使用：

| 标准术语 | 所属Stage | 定义 | 执行方式 |
|---------|----------|------|---------|
| **Step 3-3-1** | Stage 3-3 | 主测试制定测试计划 | 阻塞式 |
| **Step 3-3-2** | Stage 3-3 | 子QA并行测试 | 并行式（8人，每人≤2测试领域） |
| **Step 3-3-3** | Stage 3-3 | 主测试汇总报告 | 阻塞式 |

### 2.5 阻塞点 (Blocking Point)

**格式**：`BP-XXX` (Blocking Point)

每个阻塞点对应一个Stage或Step的完成条件：

| 标准标识 | 名称 | 所属Stage/Step | 解锁条件 |
|---------|------|---------------|---------|
| **BP-001** | 引擎初始化完成 | Stage 0-0 | 环境检查通过 |
| **BP-002** | 需求拆分完成 | Stage 1-1 | 拆分文档完成 |
| **BP-003** | 子策划设计完成 | Stage 1-2 | 所有子策划完成 |
| **BP-004** | 文档整合完成 | Stage 1-3 | 整合文档输出 |
| **BP-005** | 框架搭建完成 | Stage 2-1 | 框架验收通过 |
| **BP-006** | 功能开发完成 | Stage 2-2 | 所有功能完成 |
| **BP-007** | 代码审查完成 | Stage 2-3 | 审查通过 |
| **BP-008** | 主策划过审 | Stage 3-1 | 过审决策通过 |
| **BP-009** | 子策划验收完成 | Stage 3-2 | 所有验收通过 |
| **BP-010** | 测试计划完成 | Step 3-3-1 | 计划制定完成 |
| **BP-011** | QA测试完成 | Step 3-3-2 | 所有测试通过 |
| **BP-012** | 测试汇总完成 | Step 3-3-3 | 报告输出完成 |
| **BP-013** | 项目交付完成 | Stage 4-1 | 交付验收通过 |

---

## 三、测试术语

### 3.1 测试类型

| 标准术语 | 英文标识 | 定义 | 优先级 |
|---------|---------|------|--------|
| **功能测试** | Functional Test (FT) | 验证功能是否符合需求 | P0 |
| **视觉测试** | Visual Test (VT) | 验证UI布局是否符合设计 | P0 |
| **完整路径测试** | Full Path Test (FPT) | 验证所有功能路径通畅 | P0 |
| **回归测试** | Regression Test (RT) | 验证修改未引入新问题 | P0 |
| **性能测试** | Performance Test (PT) | 验证性能指标达标 | P1 |
| **兼容性测试** | Compatibility Test (CT) | 验证多平台兼容性 | P1 |

### 3.2 问题优先级

| 标准术语 | 英文标识 | 定义 | 处理要求 |
|---------|---------|------|---------|
| **P0 - 阻塞** | Blocker | 导致系统无法运行 | 必须修复 |
| **P1 - 严重** | Critical | 严重影响用户体验 | 应该修复 |
| **P2 - 一般** | Major | 影响部分功能 | 建议修复 |
| **P3 - 轻微** | Minor | 轻微问题 | 可后续处理 |

---

## 四、符号系统

### 4.1 流程图符号

| 符号 | 含义 | 使用场景 |
|------|------|---------|
| `→` | 流程流转 | 阶段之间的流转 |
| `↓` | 步骤执行 | 步骤向下执行 |
| `├─→` | 并行分支 | 并行任务分支 |
| `└─→` | 并行结束 | 并行任务结束 |
| `↺` | 循环 | 迭代循环 |
| `⛔` | 阻塞点 | 阻塞等待 |
| `✅` | 完成/通过 | 任务完成或验收通过 |
| `❌` | 失败/不通过 | 任务失败或验收不通过 |

### 4.2 状态标识

| 符号 | 含义 | 使用场景 |
|------|------|---------|
| `[ ]` | 未开始 | 待办事项 |
| `[~]` | 进行中 | 正在执行 |
| `[x]` | 已完成 | 任务完成 |
| `[!]` | 阻塞中 | 等待阻塞点解锁 |
| `[?]` | 待确认 | 需要确认 |

### 4.3 角色标识符

| 符号 | 含义 |
|------|------|
| `PL` | 项目负责人 (Project Leader) |
| `LD` | 主策划 (Lead Designer) |
| `LP` | 主程序员 (Lead Programmer) |
| `SD` | 系统策划 (System Designer) |
| `BD` | 数值策划 (Balance Designer) |
| `QA` | 功能测试 (QA Tester) |
| `VV` | 视觉验证 (Visual Validator) |

---

## 五、文档命名规范

### 5.1 技能文档命名

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 技能定义 | `{skill-name}/SKILL.md` | `fullstack-game-engine/SKILL.md` |
| 术语标准 | `terminology-standard/SKILL.md` | 本文档 |
| 经验库 | `{skill-name}/experience-db.md` | `project-experience-summarizer/experience-db.md` |

### 5.2 项目文档命名

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 需求拆分 | `需求拆分文档.md` | `docs/需求拆分文档.md` |
| 功能路径 | `完整功能路径说明书.md` | `docs/系统策划/完整功能路径说明书.md` |
| UI布局 | `UI布局及验收说明.md` | `docs/UI策划/UI布局及验收说明.md` |
| Bug清单 | `bug-list.md` | `docs/QA/bug-list.md` |
| 验收报告 | `验收报告-YYYYMMDD.md` | `docs/QA/验收报告-20240219.md` |

---

## 六、引用规范

### 6.1 技能引用格式

当技能A需要引用技能B的内容时，使用以下格式：

```markdown
> **引用**：[skill-name]
> 
> [简要说明引用的内容]
> 
> 详细信息请参见 [skill-name](.trae/skills/{skill-name}/SKILL.md)
```

### 6.2 流程引用格式

当需要引用标准流程时：

```markdown
> **流程引用**：fullstack-game-engine
> 
> 本阶段遵循标准开发流程 Phase X 第Y位
> 
> 完整流程参见 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
```

### 6.3 术语引用格式

当使用标准术语时，首次出现应标注：

```markdown
**项目负责人** (Project Leader, PL)：负责统一调度和中转
```

---

## 七、禁止使用的术语

### 7.1 角色相关

| 禁止使用 | 标准替代 |
|---------|---------|
| "我"、"当前AI" | 项目负责人 (PL) |
| "总策划" | 主策划 (LD) |
| "技术负责人" | 主程序员 (LP) |
| "策划团队"（泛指） | 明确指定：系统策划(SD)、数值策划(BD)等 |
| "程序团队"（泛指） | 明确指定：技能系统程序(SkD)、后端程序(BkD)等 |

### 7.2 流程相关

| 禁止使用 | 标准替代 |
|---------|---------|
| "第一阶段" | Phase 1 |
| "第二步" | Phase X 第2位 |
| "等待" | 阻塞点 (BP-XXX) |
| "检查点" | 阻塞点 (BP-XXX) |
| "Gate" | 阻塞点 (BP-XXX) |

### 7.3 测试相关

| 禁止使用 | 标准替代 |
|---------|---------|
| "功能验证" | 功能测试 (FT) |
| "UI检查" | 视觉测试 (VT) |
| "全流程测试" | 完整路径测试 (FPT) |
| "回退测试" | 回归测试 (RT) |

---

## 八、错误码规范 ⭐新增

### 8.1 错误码结构

错误码格式：`E[分类][序号]`

```
E[分类][序号]
 │  │
 │  └─ 序号：001-999
 └──── 分类：0-9
```

### 8.2 错误码分类

| 分类 | 范围 | 说明 |
|------|------|------|
| E0xx | E001-E099 | 系统级错误 |
| E1xx | E100-E199 | 技能调用错误 |
| E2xx | E200-E299 | 流程执行错误 |
| E3xx | E300-E399 | 验证失败错误 |
| E4xx | E400-E499 | 文档处理错误 |
| E5xx | E500-E599 | 测试相关错误 |
| E6xx | E600-E699 | 安全相关错误 |
| E7xx | E700-E799 | 网络通信错误 |
| E8xx | E800-E899 | 资源相关错误 |
| E9xx | E900-E999 | 用户输入错误 |

### 8.3 详细错误码定义

#### E0xx - 系统级错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E001 | SYSTEM_INIT_FAILED | 系统初始化失败 | 检查配置文件 |
| E002 | SKILL_LOAD_FAILED | 技能加载失败 | 检查技能文件完整性 |
| E003 | STATE_RESTORE_FAILED | 状态恢复失败 | 检查状态文件 |
| E004 | CONFIG_MISSING | 配置缺失 | 补充必要配置 |
| E005 | PERMISSION_DENIED | 权限不足 | 检查用户权限 |

#### E1xx - 技能调用错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E101 | SKILL_NOT_FOUND | 技能不存在 | 检查技能名称 |
| E102 | SKILL_DEPENDENCY_ERROR | 技能依赖错误 | 检查依赖关系 |
| E103 | SKILL_VERSION_MISMATCH | 技能版本不匹配 | 更新技能版本 |
| E104 | SKILL_EXECUTION_FAILED | 技能执行失败 | 查看详细日志 |
| E105 | SKILL_TIMEOUT | 技能执行超时 | 优化执行效率 |

#### E2xx - 流程执行错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E201 | PHASE_TRANSITION_FAILED | 阶段转换失败 | 检查阻塞点条件 |
| E202 | BLOCKING_POINT_LOCKED | 阻塞点未解锁 | 完成前置条件 |
| E203 | ROLE_ASSIGNMENT_FAILED | 角色分配失败 | 检查团队配置 |
| E204 | PARALLEL_EXECUTION_ERROR | 并行执行错误 | 检查任务依赖 |
| E205 | WORKFLOW_INTERRUPTED | 流程被中断 | 恢复或重启流程 |

#### E3xx - 验证失败错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E301 | CONTRACT_VALIDATION_FAILED | 契约验证失败 | 检查输入输出格式 |
| E302 | INPUT_VALIDATION_FAILED | 输入验证失败 | 检查输入内容 |
| E303 | OUTPUT_VALIDATION_FAILED | 输出验证失败 | 检查输出格式 |
| E304 | ANTI_HALLUCINATION_FAILED | 反幻觉验证失败 | 提供真实证据 |
| E305 | EVIDENCE_MISSING | 证据缺失 | 补充测试证据 |

#### E4xx - 文档处理错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E401 | DOCUMENT_NOT_FOUND | 文档不存在 | 创建必要文档 |
| E402 | DOCUMENT_FORMAT_ERROR | 文档格式错误 | 修正文档格式 |
| E403 | DOCUMENT_NAMING_ERROR | 文档命名错误 | 使用标准命名 |
| E404 | DOCUMENT_VERSION_ERROR | 文档版本错误 | 更新文档版本 |
| E405 | DOCUMENT_PARSE_FAILED | 文档解析失败 | 检查文档内容 |

#### E5xx - 测试相关错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E501 | TEST_CASE_FAILED | 测试用例失败 | 修复被测功能 |
| E502 | SCREENSHOT_MISMATCH | 截图对比失败 | 检查UI变化 |
| E503 | REGRESSION_FAILED | 回归测试失败 | 修复引入问题 |
| E504 | TEST_EVIDENCE_INVALID | 测试证据无效 | 重新提供证据 |
| E505 | COVERAGE_INSUFFICIENT | 测试覆盖不足 | 补充测试用例 |

#### E6xx - 安全相关错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E601 | SECURITY_VIOLATION | 安全违规 | 检查操作合法性 |
| E602 | SENSITIVE_DATA_EXPOSED | 敏感信息泄露 | 脱敏处理 |
| E603 | UNAUTHORIZED_ACCESS | 未授权访问 | 检查权限 |
| E604 | PATH_TRAVERSAL_DETECTED | 路径遍历检测 | 使用合法路径 |
| E605 | COMMAND_INJECTION_DETECTED | 命令注入检测 | 过滤危险字符 |

#### E9xx - 用户输入错误

| 错误码 | 名称 | 描述 | 处理建议 |
|--------|------|------|---------|
| E901 | INVALID_INPUT | 无效输入 | 检查输入格式 |
| E902 | INPUT_TOO_LONG | 输入过长 | 缩短输入内容 |
| E903 | REQUIRED_FIELD_MISSING | 必填字段缺失 | 补充必填信息 |
| E904 | INVALID_FILE_TYPE | 无效文件类型 | 使用正确格式 |
| E905 | INVALID_OPERATION | 无效操作 | 检查操作合法性 |

### 8.4 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "E301",
    "name": "CONTRACT_VALIDATION_FAILED",
    "message": "契约验证失败：缺少必填字段 'version'",
    "details": {
      "field": "version",
      "expected": "版本号格式：vX.Y",
      "actual": null
    },
    "timestamp": "2024-02-19T10:30:00Z",
    "traceId": "trace-xxx-xxx"
  }
}
```

### 8.5 错误处理最佳实践

1. **错误记录**：所有错误必须记录到日志
2. **错误传递**：错误应向上传递，不应被静默吞掉
3. **错误恢复**：尽可能提供恢复建议
4. **错误分类**：根据严重程度采取不同处理策略
5. **错误追踪**：使用traceId追踪错误链路

---

## 九、技能开发检查清单

创建或更新技能时，必须检查：

- [ ] 所有角色术语符合第1节标准
- [ ] 所有阶段术语符合第2节标准
- [ ] 所有测试术语符合第3节标准
- [ ] 使用了正确的符号系统（第4节）
- [ ] 文档命名符合第5节规范
- [ ] 引用了相关技能的权威定义（第6节）
- [ ] 没有使用第7节禁止的术语

---

## 九、版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，建立完整术语体系 |

---

**注意**：本文档是全栈游戏开发技能库的基础规范，任何技能都必须遵循。如有术语冲突，以本文档为准。
