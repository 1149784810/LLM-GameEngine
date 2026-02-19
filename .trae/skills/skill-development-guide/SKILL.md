---
name: "skill-development-guide"
description: "技能开发规范指南，定义创建新技能或更新现有技能时必须遵循的标准流程、引用规范和检查清单。确保技能库的一致性和无冗余。"
---

# 技能开发规范指南

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)

---

## 概述

本文档定义了创建新技能或更新现有技能时必须遵循的规范，确保：
- 技能库术语一致性
- 避免功能冗余和重复描述
- 清晰的职责边界
- 正确的引用关系

**适用范围**：
- 创建新技能
- 更新现有技能
- 技能库维护

---

## 一、开发前准备

### 1.1 必须查阅的文档

在创建或更新技能前，必须按顺序查阅以下文档：

| 顺序 | 文档 | 目的 | 位置 |
|------|------|------|------|
| 1 | **terminology-standard** | 确保使用标准术语 | `.trae/skills/terminology-standard/SKILL.md` |
| 2 | **skill-optimizer** | 检查是否有类似技能 | `.trae/skills/skill-optimizer/SKILL.md` |
| 3 | **fullstack-game-engine** | 了解整体流程（如相关） | `.trae/skills/fullstack-game-engine/SKILL.md` |
| 4 | **相关技能** | 检查引用关系 | `.trae/skills/{related-skill}/SKILL.md` |

### 1.2 重复检查清单

在创建新技能前，必须确认：

- [ ] **功能不重复**：没有现有技能已提供相同功能
- [ ] **流程不重复**：不重复描述其他技能已定义的流程
- [ ] **术语一致**：使用 terminology-standard 定义的标准术语
- [ ] **职责清晰**：明确本技能与相关技能的职责边界

**如果发现重复**：
1. 考虑扩展现有技能而非创建新技能
2. 或明确区分新旧技能的职责边界
3. 使用"引用"方式而非"重复描述"

---

## 二、技能文档结构

### 2.1 标准文件结构

```
.trae/skills/{skill-name}/
├── SKILL.md                    # 技能定义文件（必须）
├── experience-db.md            # 经验库（可选，如需要）
└── README.md                   # 补充说明（可选）
```

### 2.2 SKILL.md 标准格式

```markdown
---
name: "{skill-name}"
description: "{简洁描述，<200字符，包含功能和调用时机}"
---

# {技能标题}

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)（如相关）
> 
> **其他引用**：[{related-skill}](.trae/skills/{related-skill}/SKILL.md)（如相关）

---

## 功能概述

本技能负责{具体功能}。

> **注意**：{本技能不定义XX，只负责XX。XX定义参见 [相关技能]。}

---

## 调用时机

**{明确的调用条件和时机}**

调用流程：
```
{流程图或步骤说明}
```

---

## {技能主体内容}

{使用标准术语和符号}
{引用而非重复描述}
{清晰的职责边界}

---

## 注意事项

1. {注意事项1}
2. {注意事项2}
3. **术语一致**：所有描述必须使用 [terminology-standard](.trae/skills/terminology-standard/SKILL.md) 定义的标准术语
4. **引用优先**：相关定义优先使用引用而非重复描述
```

---

## 三、引用规范

### 3.1 必须使用的引用格式

#### 术语引用

在文档开头必须引用术语标准：

```markdown
> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> 本文档使用标准术语：项目负责人(PL)、主策划(LD)、Phase X、BP-XXX
```

#### 流程引用

如果涉及全栈游戏开发流程：

```markdown
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> 本阶段遵循标准开发流程 Phase X 第Y位
```

#### 其他技能引用

```markdown
> **引用**：[{skill-name}](.trae/skills/{skill-name}/SKILL.md)
> 
> {简要说明引用的内容}
> 
> 详细信息请参见 [{skill-name}](.trae/skills/{skill-name}/SKILL.md)
```

### 3.2 引用 vs 重复描述

**正确做法（引用）**：
```markdown
## 测试流程

> **引用**：[qa-standards-manager](.trae/skills/qa-standards-manager/SKILL.md)
> 
> 本技能执行回归测试(RT)，测试标准参见 qa-standards-manager。

执行步骤：
1. 准备测试环境
2. 调用 qa-standards-manager 获取测试标准
3. 执行回归测试(RT)
4. 输出结果
```

**错误做法（重复描述）**：
```markdown
## 测试流程

### 回归测试定义
回归测试是指在修改后重新运行所有测试用例...
（详细描述测试标准）

### 测试检查清单
- [ ] 重新运行所有测试用例
- [ ] 验证修复的问题已解决
...
（重复 qa-standards-manager 的内容）
```

---

## 四、术语使用规范

### 4.1 必须使用标准术语

| 标准术语 | 英文标识 | 禁止使用 |
|---------|---------|---------|
| **项目负责人** | PL | "我"、"当前AI" |
| **主策划** | LD | "总策划"、"策划负责人" |
| **主程序员** | LP | "技术负责人" |
| **Phase 1** | P1 | "第一阶段" |
| **Phase 1 第2位** | - | "第二步" |
| **阻塞点** | BP-XXX | "检查点"、"Gate" |
| **功能测试** | FT | "功能验证" |
| **回归测试** | RT | "回退测试" |

### 4.2 首次使用标注

标准术语首次出现时，应标注英文标识：

```markdown
**项目负责人** (Project Leader, PL)：负责统一调度和中转
```

后续可直接使用：
```markdown
PL 调用 requirement-normalizer 进行需求澄清
```

---

## 五、职责边界定义

### 5.1 职责边界声明

每个技能必须明确声明：

1. **本技能负责**：明确的功能范围
2. **本技能不负责**：排除其他技能的功能
3. **引用来源**：相关定义来自哪个技能

示例：
```markdown
## 功能概述

本技能负责**阶段门控机制的具体实现**，包括：
- 管理阻塞点 (BP-XXX) 的状态
- 控制流程流转和阶段切换

> **注意**：完整的开发流程定义参见 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)，本技能专注于门控机制的执行。
```

### 5.2 避免职责重叠

**检查清单**：
- [ ] 本技能的功能是否与其他技能重叠？
- [ ] 本技能是否重复描述了其他技能的流程？
- [ ] 本技能是否使用了其他技能已定义的术语？

**处理原则**：
- 如果发现重叠，使用"引用"而非"重复"
- 如果必须重复，说明原因并标注来源
- 保持每个技能的功能单一和清晰

---

## 六、技能依赖层级图 ⭐新增

### 6.1 层级架构

为避免技能间循环依赖，所有技能必须遵循以下层级结构：

```
┌─────────────────────────────────────────────────────────────────┐
│                     技能依赖层级架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 0: 基础设施层（无依赖）                                   │
│  ├── terminology-standard      # 术语标准（最底层）              │
│  ├── security-guard            # 安全检测                        │
│  └── output-normalizer         # 输出规范                        │
│                                                                 │
│  Layer 1: 核心定义层（依赖Layer 0）                              │
│  ├── fullstack-game-engine     # 全栈游戏引擎流程定义            │
│  └── skill-development-guide   # 技能开发规范（本文档）          │
│                                                                 │
│  Layer 2: 管理工具层（依赖Layer 0-1）                            │
│  ├── state-manager             # 状态管理                        │
│  ├── event-bus                 # 事件总线                        │
│  ├── command-manager           # 命令管理                        │
│  ├── contract-validator        # 契约验证                        │
│  └── project-flow-manager      # 流程管理                        │
│                                                                 │
│  Layer 3: 业务逻辑层（依赖Layer 0-2）                            │
│  ├── fullstack-engine-init     # 引擎初始化                      │
│  ├── hr-manager                # 人力资源管理                    │
│  ├── agent-dispatcher          # 智能体调度                      │
│  ├── qa-standards-manager      # QA标准管理                      │
│  └── project-optimizer         # 项目优化                        │
│                                                                 │
│  Layer 4: 辅助工具层（依赖Layer 0-3）                            │
│  ├── project-experience-summarizer  # 经验总结                   │
│  ├── skill-optimizer           # 技能优化                        │
│  ├── git-version-control       # Git版本控制                     │
│  ├── bug-tracker               # Bug追踪                        │
│  ├── asset-generation-manager  # 资产生成                        │
│  ├── engine-module-debugger    # 引擎调试                        │
│  ├── pl-authority-guard        # PL权限守卫                      │
│  └── flow-strategy             # 流程策略                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 依赖规则

| 规则 | 说明 | 违规后果 |
|------|------|----------|
| **禁止跨层级引用** | Layer 3 不能直接引用 Layer 0 | 架构混乱，难以维护 |
| **只允许引用同层或下层** | Layer 2 可以引用 Layer 0-1 | 确保依赖单向性 |
| **禁止循环依赖** | A引用B，B不能引用A | 初始化死锁，逻辑混乱 |
| **优先引用相邻层** | Layer 3 优先引用 Layer 2 | 减少耦合度 |

### 6.3 依赖检查清单

创建或更新技能时，必须检查：

- [ ] **确认本技能所属层级**（参考6.1层级架构）
- [ ] **检查所有引用技能层级**（被引用技能必须在同层或下层）
- [ ] **验证无跨层级引用**（如Layer 3直接引用Layer 0）
- [ ] **验证无循环依赖**（使用工具检查依赖图）
- [ ] **记录依赖关系到技能文档**（在SKILL.md中声明）

### 6.4 依赖声明格式

每个技能必须在文档开头声明依赖关系：

```markdown
---
name: "example-skill"
description: "示例技能"
dependencies:
  - terminology-standard    # Layer 0
  - fullstack-game-engine   # Layer 1
  - state-manager           # Layer 2
layer: 3  # 本技能所属层级
---

# 示例技能

> **依赖声明**：
> - Layer 0: [terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> - Layer 1: [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> - Layer 2: [state-manager](.trae/skills/state-manager/SKILL.md)
> 
> **本技能层级**: Layer 3
```

### 6.5 循环依赖检测

使用以下方法检测循环依赖：

```bash
# 运行依赖检测脚本
node tools/skill-dependency-checker.js

# 输出示例
✅ terminology-standard: 无依赖
✅ security-guard: 无依赖
✅ fullstack-game-engine: 依赖 [terminology-standard] ✅
✅ state-manager: 依赖 [terminology-standard, event-bus] ✅
❌ bad-skill: 检测到循环依赖!
   state-manager → event-bus → state-manager
```

---

## 七、技能开发检查清单

### 7.1 创建新技能时

- [ ] 已查阅 terminology-standard，使用标准术语
- [ ] 已使用 skill-optimizer 检查重复
- [ ] 已确认没有功能重叠的技能
- [ ] 已确定正确的引用关系
- [ ] 已定义清晰的职责边界
- [ ] 已使用正确的文档结构
- [ ] 已添加术语引用声明
- [ ] 已添加相关技能引用
- [ ] description 字段 < 200字符，包含功能和调用时机

### 6.2 更新现有技能时

- [ ] 已查阅 terminology-standard，确保术语一致
- [ ] 已检查更新是否影响其他技能
- [ ] 已确认没有引入重复描述
- [ ] 已更新引用关系（如需要）
- [ ] 已检查职责边界是否仍然清晰
- [ ] 已验证术语使用符合标准

### 6.3 技能审查清单

**自我审查**：
- [ ] 所有角色术语符合 terminology-standard 第1节
- [ ] 所有阶段术语符合 terminology-standard 第2节
- [ ] 所有测试术语符合 terminology-standard 第3节
- [ ] 使用了正确的符号系统（terminology-standard 第4节）
- [ ] 文档命名符合 terminology-standard 第5节
- [ ] 引用了相关技能的权威定义
- [ ] 没有使用 terminology-standard 第7节禁止的术语

**交叉审查**：
- [ ] 与其他技能没有功能重叠
- [ ] 与其他技能没有流程重复
- [ ] 与其他技能没有术语冲突
- [ ] 引用关系正确且完整

---

## 七、技能关系图

### 7.1 权威来源技能（被引用）

| 技能 | 权威定义 | 被以下技能引用 |
|------|---------|---------------|
| **terminology-standard** | 术语标准 | 所有技能 |
| **fullstack-game-engine** | 开发流程 | project-flow-manager, hr-manager, qa-standards-manager, ... |
| **qa-standards-manager** | 测试标准 | bug-tracker, project-flow-manager, ... |
| **project-flow-manager** | 门控机制 | fullstack-game-engine（协调） |

### 7.2 执行技能（引用权威）

| 技能 | 引用来源 | 执行职责 |
|------|---------|---------|
| **project-flow-manager** | fullstack-game-engine | 门控机制执行 |
| **hr-manager** | fullstack-game-engine, terminology-standard | 人员分配执行 |
| **bug-tracker** | qa-standards-manager, terminology-standard | Bug生命周期管理 |
| **agent-dispatcher** | fullstack-game-engine, terminology-standard | 智能体调度执行 |

---

## 八、常见问题

### Q1: 如何确定是否需要创建新技能？

**检查流程**：
1. 使用 skill-optimizer 检查现有技能库
2. 确认现有技能无法通过扩展满足需求
3. 确认新技能有明确的独特职责
4. 确认新技能与现有技能有清晰的边界

**如果现有技能可以扩展，不要创建新技能。**

### Q2: 如何处理技能间的依赖关系？

**原则**：
- 使用"引用"而非"重复描述"
- 明确声明依赖关系
- 避免循环依赖

**示例**：
```markdown
> **引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> 本技能执行 Phase 3 第3位的测试任务，测试标准参见 qa-standards-manager。
```

### Q3: 如何更新被多个技能引用的内容？

**原则**：
- 在权威来源技能中更新
- 检查引用该技能的所有技能
- 确保更新不会破坏引用关系
- 必要时同步更新引用方

**流程**：
1. 更新权威来源技能
2. 检查所有引用该技能的技能
3. 验证引用仍然有效
4. 如有必要，更新引用方的描述

### Q4: 术语冲突时如何处理？

**原则**：以 terminology-standard 为准

**流程**：
1. 检查 terminology-standard 中的标准术语
2. 如果存在，使用标准术语
3. 如果不存在，考虑是否需要在 terminology-standard 中添加
4. 不要在本技能中定义新的标准术语

---

## 九、版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，建立技能开发规范 |

---

## 十、参考文档

- [terminology-standard](.trae/skills/terminology-standard/SKILL.md) - 术语标准
- [skill-optimizer](.trae/skills/skill-optimizer/SKILL.md) - 技能优化器
- [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) - 全栈游戏开发引擎

---

**注意**：本文档是技能开发的基础规范，任何技能都必须遵循。如有规范冲突，以本文档为准。
