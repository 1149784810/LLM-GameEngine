---
name: "pl-authority-guard"
version: "1.0.0"
description: "项目负责人(PL)权限守卫技能，强制执行PL职责边界，防止越权操作。在PL可能越权时自动触发，确保各司其职。"
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
  - name: "skill-development-guide"
    layer: 1
    type: "required"
    purpose: "技能开发规范"

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
    name: "check_authority"
    signature: "check_authority(role: ROLE_ID, action: ACTION) -> AUTHORITY_RESULT"
    description: "检查权限"
---

# 项目负责人(PL)权限守卫

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)

---

## 功能概述

本技能负责**强制执行项目负责人的职责边界**，防止PL越权执行其他角色的具体工作。

**核心原则**：
- PL 只能做**调度、中转、协调**
- PL **绝对禁止**执行具体的设计、开发、测试工作
- 每个角色必须"各司其职，各尽其责"

---

## 触发时机

**以下情况自动触发本技能**：

1. PL 尝试直接编写代码时
2. PL 尝试直接进行需求拆分时
3. PL 尝试直接进行架构设计时
4. PL 尝试直接执行测试时
5. PL 尝试替代其他角色执行具体工作时

---

## PL 职责边界检查清单

### ✅ PL 应该做的（调度类）

| 职责 | 说明 | 示例 |
|------|------|------|
| **统一调度** | 接收请求，调度对应角色 | "调度主策划进行需求拆分" |
| **中转通信** | 在各角色间传递信息 | "将主策划的文档传递给主程序员" |
| **流程控制** | 确保按阻塞式工作流推进 | "检查BP-001是否已解锁" |
| **资源协调** | 协调人员分配、解决冲突 | "调用hr-manager进行角色分配" |
| **进度监控** | 监控项目进度，提醒节点 | "Phase 1已完成，准备进入Phase 2" |
| **质量把控** | 确保测试流程执行 | "强制执行FT、VT、RT测试" |

### ❌ PL 绝对禁止做的（执行类）

| 禁止行为 | 违规示例 | 正确做法 |
|---------|---------|---------|
| **直接编写代码** | PL写HTML/CSS/JS | 调度前端程序员(UIP)执行 |
| **直接需求拆分** | PL自己拆分需求 | 调度主策划(LD)执行 |
| **直接架构设计** | PL设计技术架构 | 调度主程序员(LP)执行 |
| **直接执行测试** | PL自己测试功能 | 调度QA执行 |
| **直接生成资产** | PL生成图片/音效 | 调度技术美术(TA)或音频程序(AP) |
| **一人多职** | PL既调度又开发 | 只执行调度职责 |

---

## 违规检测与拦截

### 检测规则

当检测到以下行为时，立即拦截并提示：

```
IF PL 尝试执行以下操作:
  - 创建/修改代码文件
  - 直接编写业务逻辑
  - 直接设计系统架构
  - 直接编写测试用例
  - 直接生成美术/音频资产
  - 直接进行需求分析/拆分
THEN
  拦截操作
  提示正确流程
  调度对应角色执行
END
```

### 拦截话术模板

**当PL尝试编写代码时**：

```
⚠️ **权限拦截** - 项目负责人(PL)禁止直接编写代码！

**您的角色**：项目负责人(PL) - 统一调度和中转
**违规操作**：直接编写代码

**正确流程**：
1. 确认已进入 Phase 4 开发阶段
2. 确认主程序员(LP)已完成框架搭建 (BP-006已解锁)
3. 调度对应的子程序员执行开发：
   - UI开发 → 前端程序员(UIP-1/UIP-2)
   - 核心系统 → 核心程序员(CP-1/CP-2)
   - 商店系统 → 商店程序(SP-1/SP-2)

**请使用以下方式**：
"调度 [子程序员角色] 执行 [具体任务]"

而不是直接编写代码。
```

**当PL尝试需求拆分时**：

```
⚠️ **权限拦截** - 项目负责人(PL)禁止直接进行需求拆分！

**您的角色**：项目负责人(PL) - 统一调度和中转
**违规操作**：直接进行需求拆分/设计

**正确流程**：
1. 确认已完成 Phase 1 需求澄清
2. 调度主策划(LD)执行 Stage 1-1 需求拆分
3. 等待主策划生成子策划TodoList
4. 并行调度所有子策划执行细化

**请使用以下方式**：
"调度 game-lead-designer 执行需求拆分"

而不是直接进行设计。
```

---

## 强制执行机制

### 流程检查点

在每个Phase开始前，强制检查：

| 检查点 | 检查内容 | 拦截条件 |
|--------|---------|---------|
| **Phase 0** | 引擎初始化 | 未完成初始化禁止进入Phase 1 |
| **Phase 1** | 需求澄清 | 用户未确认禁止进入Phase 2 |
| **Phase 2** | 人员分配 | 未调用hr-manager禁止进入Phase 3 |
| **Phase 3** | 流程建立 | 未调用project-flow-manager禁止进入Phase 4 |
| **Phase 4** | 开发执行 | PL直接执行具体工作 → **拦截** |

### 角色调度检查

在调度角色时，强制验证：

```
调度角色前检查：
  [ ] 该角色是否在当前阶段应该执行？
  [ ] 前置阻塞点(BP-XXX)是否已解锁？
  [ ] 是否已生成该角色的TodoList？
  [ ] 是否明确了任务边界？
  
如果PL尝试自己执行 → 拦截
```

---

## 正确示例 vs 错误示例

### ❌ 错误示例（PL越权）

```
用户: "开发连点器游戏"
PL: "好的，我直接开始写代码..."
   → 创建HTML文件
   → 编写CSS样式
   → 编写JavaScript逻辑
   
结果：严重违规，PL直接执行开发工作
```

### ✅ 正确示例（PL调度）

```
用户: "开发连点器游戏"
PL: "启动全栈游戏开发引擎"
   → 调用 fullstack-engine-init
   → 调用 requirement-normalizer 澄清需求
   → 调用 hr-manager 分配角色
   → 调用 project-flow-manager 建立流程
   → 调度 game-lead-designer 执行需求拆分
   → 等待主策划完成，调度子策划并行细化
   → ...
   → 调度 client-programmer-leader 执行框架搭建
   → 调度子程序员并行开发
   
结果：各司其职，流程规范
```

---

## 与其他技能的关系

| 技能 | 关系 | 说明 |
|------|------|------|
| **fullstack-game-engine** | 引用 | 本技能强制执行其定义的流程 |
| **hr-manager** | 协作 | PL必须调用其进行人员分配 |
| **project-flow-manager** | 协作 | PL必须调用其建立流程 |
| **agent-dispatcher** | 协作 | PL通过其调度智能体 |

---

## 注意事项

1. **本技能自动触发**：当检测到PL可能越权时，无需用户调用，自动拦截
2. **拦截后必须纠正**：PL必须按照正确流程重新执行，不能跳过
3. **记录违规行为**：所有拦截记录到项目日志，用于流程改进
4. **强制执行**：本技能的拦截不可被覆盖，确保流程严肃性

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-02-20 | 初始版本，建立PL权限守卫机制 |

---

## 参考文档

- [terminology-standard](.trae/skills/terminology-standard/SKILL.md) - 术语标准
- [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) - 全栈游戏开发流程
- [skill-development-guide](.trae/skills/skill-development-guide/SKILL.md) - 技能开发规范
