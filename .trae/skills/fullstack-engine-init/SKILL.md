---
name: "fullstack-engine-init"
version: "1.0.0"
description: "初始化全栈游戏开发引擎环境，检查必要技能依赖。在用户发出制作游戏需求时调用，验证全栈游戏开发引擎和需求规范器技能是否存在，自动扫描和加载所有游戏开发相关技能，并激活引擎模块调试器进行调用追踪。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 3
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "engine-module-debugger"
    layer: 3
    type: "required"
    purpose: "模块调试器"

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
  acceptance_criteria:
    - id: "AC-001"
      description: "所有必需技能存在"
      metric: "required_skills_exist"
      threshold: 1.0
      operator: "=="
      required: true
  testing:
    required_tests: []
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
  error_codes:
    - code: "E001"
      name: "SKILL_NOT_FOUND"
      severity: "CRITICAL"
      rollback_required: false
  checkpoints: []

functions:
  main:
    name: "initialize"
    signature: "initialize() -> INIT_RESULT"
    description: "初始化引擎环境"
  queries:
    - name: "check_dependencies"
      signature: "check_dependencies() -> DEPENDENCY_CHECK_RESULT"
      description: "检查依赖技能"
---

# 全栈引擎初始化

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **引用**：[engine-module-debugger](.trae/skills/engine-module-debugger/SKILL.md)

## 功能概述

本技能用于在用户发出制作游戏的需求时，进行全栈游戏开发引擎的环境初始化和依赖检查。

> **注意**：本技能在初始化过程中会自动激活 [engine-module-debugger](.trae/skills/engine-module-debugger/SKILL.md) 以追踪所有技能调用情况。

## 调用时机

**当用户发出制作游戏的需求时，立即调用此技能。**

例如：
- "我想做一个RPG游戏"
- "帮我开发一个塔防游戏"
- "制作一个多人在线对战游戏"
- 任何涉及游戏开发的请求

## 自动扫描机制

**CRITICAL**: 本技能会自动扫描 `.trae/skills/` 目录下的所有技能，并将除 `fullstack-game-engine` 之外的所有技能自动纳入初始化检查列表。

### 扫描规则

1. **扫描路径**: `.trae/skills/*/`
2. **排除项**: `fullstack-game-engine`（引擎本身不需要检查自己）
3. **包含项**: 所有其他技能，包括：
   - 现有技能：security-guard, requirement-normalizer, hr-manager 等
   - **未来新增的游戏开发相关技能**

### 动态加载机制

```
用户请求游戏开发
    ↓
扫描 .trae/skills/ 目录
    ↓
读取所有技能目录（排除 fullstack-game-engine）
    ↓
自动构建依赖检查列表
    ↓
逐一检查所有技能是否存在
    ↓
记录检查结果到索引表
```

## 依赖检查清单

执行以下检查，确保必要技能已安装：

### 核心依赖（必须）

| 序号 | 技能名称 | 技能目录 | 用途说明 |
|------|----------|----------|----------|
| 1 | security-guard | `.trae/skills/security-guard/` | 审查危险操作，保护系统安全 |
| 2 | requirement-normalizer | `.trae/skills/requirement-normalizer/` | 澄清和规范化用户需求 |

### 流程管理依赖（必须）

| 序号 | 技能名称 | 技能目录 | 用途说明 |
|------|----------|----------|----------|
| 3 | hr-manager | `.trae/skills/hr-manager/` | 人力资源管理，团队角色分配 |
| 4 | project-flow-manager | `.trae/skills/project-flow-manager/` | 项目流程管理，阶段控制 |
| 5 | agent-dispatcher | `.trae/skills/agent-dispatcher/` | 智能体调度器，统一中转 |
| 6 | qa-standards-manager | `.trae/skills/qa-standards-manager/` | 验收标准管理，质量门槛 |

### 经验总结依赖（必须）

| 序号 | 技能名称 | 技能目录 | 用途说明 |
|------|----------|----------|----------|
| 7 | project-experience-summarizer | `.trae/skills/project-experience-summarizer/` | 项目开发经验总结，bug收集与经验沉淀 |

### 调试监控依赖（必须）

| 序号 | 技能名称 | 技能目录 | 用途说明 |
|------|----------|----------|----------|
| 8 | engine-module-debugger | `.trae/skills/engine-module-debugger/` | 引擎模块调用追踪与调试，生成模块使用报告 |

### 流程阶段守卫依赖（必须）⭐新增

| 序号 | 技能名称 | 技能目录 | 用途说明 |
|------|----------|----------|----------|
| 9 | phase-stage-guard | `.trae/skills/phase-stage-guard/` | 流程阶段守卫，强制执行Stage顺序检查，防止跳过阶段 |

### 自动扫描的其他技能

**重要**: 以下列表会根据 `.trae/skills/` 目录的实际内容动态生成：

| 序号 | 技能名称 | 技能目录 | 用途说明 | 状态 |
|------|----------|----------|----------|------|
| 8+ | [自动扫描填充] | [自动检测] | [从SKILL.md读取] | [ ] 存在 [ ] 缺失 |

## 执行流程

1. **扫描技能目录**
   - 遍历 `.trae/skills/` 下的所有子目录
   - 排除 `fullstack-game-engine` 目录
   - 读取每个技能的 `SKILL.md` 文件获取描述

2. **构建检查列表**
   - 将核心依赖标记为"必须"
   - 将其他技能标记为"自动扫描"
   - 生成完整的依赖检查清单

3. **检查依赖技能是否存在**
   - 检查 `security-guard` 是否存在
   - 检查 `requirement-normalizer` 是否存在
   - 检查 `hr-manager` 是否存在
   - 检查 `project-flow-manager` 是否存在
   - 检查 `agent-dispatcher` 是否存在
   - 检查 `qa-standards-manager` 是否存在
   - 检查 `project-experience-summarizer` 是否存在
   - 检查 `engine-module-debugger` 是否存在
   - **检查所有自动扫描到的其他技能**

4. **处理检查结果**
   - 如果所有技能都存在 → 启动安全检测器并继续执行游戏开发流程
   - 如果有技能缺失 → 提示用户安装缺失的技能

5. **启动安全检测器**
   - 激活 `security-guard` 技能
   - 建立安全监控机制，保护后续所有开发流程

6. **激活引擎模块调试器**
   - 激活 `engine-module-debugger` 技能
   - 开始记录所有技能调用情况
   - 建立调用追踪会话

7. **记录检查结果**
   - 在索引表中记录检查状态
   - 为后续流程化检测提供数据支持

## 索引表结构

```markdown
# 全栈引擎技能依赖索引表

## 核心依赖（必须）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 1 | security-guard | .trae/skills/security-guard/ | [ ] 存在 [ ] 缺失 | - |
| 2 | requirement-normalizer | .trae/skills/requirement-normalizer/ | [ ] 存在 [ ] 缺失 | - |

## 流程管理依赖（必须）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 3 | hr-manager | .trae/skills/hr-manager/ | [ ] 存在 [ ] 缺失 | - |
| 4 | project-flow-manager | .trae/skills/project-flow-manager/ | [ ] 存在 [ ] 缺失 | - |
| 5 | agent-dispatcher | .trae/skills/agent-dispatcher/ | [ ] 存在 [ ] 缺失 | - |
| 6 | qa-standards-manager | .trae/skills/qa-standards-manager/ | [ ] 存在 [ ] 缺失 | - |

## 经验总结依赖（必须）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 7 | project-experience-summarizer | .trae/skills/project-experience-summarizer/ | [ ] 存在 [ ] 缺失 | - |

## 调试监控依赖（必须）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 8 | engine-module-debugger | .trae/skills/engine-module-debugger/ | [ ] 存在 [ ] 缺失 | - |

## 自动扫描技能（动态生成）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 8+ | [自动扫描] | [自动检测] | [ ] 存在 [ ] 缺失 | - |

## 检查日志
| 时间 | 检查结果 | 操作 |
|------|----------|------|
| - | - | - |
```

## 未来技能自动集成

### 新增技能自动检测

当在 `.trae/skills/` 目录下新增技能时：

1. **自动识别**: 下次初始化时自动扫描到新技能
2. **自动检查**: 将新技能纳入依赖检查列表
3. **自动记录**: 在索引表中记录新技能的状态
4. **无需修改**: 不需要修改 `fullstack-engine-init` 的代码

### 示例：新增技能自动集成

```
新增技能: .trae/skills/combat-designer/
    ↓
下次初始化时自动扫描
    ↓
检测到 combat-designer 技能
    ↓
读取 SKILL.md 获取描述
    ↓
添加到依赖检查列表
    ↓
检查技能是否存在
    ↓
记录到索引表
```

## 使用示例

当用户说："我想做一个冒险游戏"

执行步骤：
1. 调用本技能进行初始化检查
2. **扫描 `.trae/skills/` 目录，获取所有技能列表**
3. 检查 `security-guard` 是否存在
4. 检查 `requirement-normalizer` 是否存在
5. 检查 `hr-manager` 是否存在
6. 检查 `project-flow-manager` 是否存在
7. 检查 `agent-dispatcher` 是否存在
8. 检查 `qa-standards-manager` 是否存在
 9. 检查 `project-experience-summarizer` 是否存在
 10. 检查 `engine-module-debugger` 是否存在
 11. **检查所有其他扫描到的技能**
 12. 如果都存在，启动 `security-guard` 建立安全监控
 13. 激活 `engine-module-debugger` 开始调用追踪
 14. 返回检查结果
 15. 调用 `requirement-normalizer` 技能澄清需求
 16. 然后调用 `fullstack-game-engine` 技能启动开发

## 注意事项

- 此技能是游戏开发流程的入口点
- 每次用户提出游戏制作需求时都应调用
- **自动扫描机制确保未来新增的技能会被自动纳入检查**
- 索引表用于追踪依赖状态，包括自动扫描的技能
- 核心依赖缺失会阻止开发流程，自动扫描的技能缺失会警告但可继续
