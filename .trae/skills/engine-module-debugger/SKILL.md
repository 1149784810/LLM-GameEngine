---
name: "engine-module-debugger"
version: "1.0.0"
description: "追踪和记录全栈游戏开发引擎中所有技能模块的调用情况，包括调用节点、调用目的和调用频次。在游戏开发完成时输出详细的模块使用报告，帮助用户优化和迭代引擎。在引擎初始化时自动激活，贯穿整个开发流程。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 3
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"

contracts:
  input:
    required_documents: []
  output:
    required_documents:
      - pattern: "reports/module-usage-report-.*\\.json"
        description: "模块使用报告"

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
    name: "track_module_call"
    signature: "track_module_call(module: STRING, purpose: STRING) -> void"
    description: "追踪模块调用"
  queries:
    - name: "generate_report"
      signature: "generate_report() -> MODULE_REPORT"
      description: "生成模块使用报告"
---

# 引擎模块调试器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **引用**：[fullstack-engine-init](.trae/skills/fullstack-engine-init/SKILL.md)

---

## 功能概述

本技能负责**全栈游戏开发引擎的模块调用追踪与调试**，包括：

- **调用记录**：记录每个引擎模块（技能）被调用的详细信息
- **调用追踪**：追踪技能调用的来源节点和调用链
- **目的分析**：记录每次调用的目的和上下文
- **统计分析**：汇总各模块的使用频次和调用模式
- **报告生成**：在游戏开发完成时输出详细的模块使用报告

> **注意**：本技能不定义开发流程，只负责追踪和记录流程中各模块的调用情况。流程定义参见 [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)。

---

## 调用时机

**在引擎初始化时自动激活，贯穿整个游戏开发流程。**

### 激活流程

```
用户请求游戏开发
    ↓
调用 fullstack-engine-init 进行初始化
    ↓
激活 engine-module-debugger
    ↓
开始记录所有技能调用
    ↓
开发流程进行中...
    ↓
游戏开发完成
    ↓
输出模块使用报告
```

---

## 记录数据结构

### 单次调用记录 (CallRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | string | 调用时间戳 (ISO 8601格式) |
| `skill_name` | string | 被调用的技能名称 |
| `caller_node` | string | 调用节点标识 (Stage X-Y / Step X-Y-Z 或 技能名称) |
| `caller_skill` | string | 发起调用的技能名称 |
| `purpose` | string | 调用目的描述 |
| `context` | object | 调用上下文信息 |
| `duration_ms` | number | 调用持续时间（毫秒）|

### 调用统计 (CallStatistics)

| 字段 | 类型 | 说明 |
|------|------|------|
| `skill_name` | string | 技能名称 |
| `total_calls` | number | 总调用次数 |
| `unique_callers` | array | 调用者列表 |
| `call_purposes` | array | 调用目的分类统计 |
| `avg_duration_ms` | number | 平均调用时长 |
| `first_call_at` | string | 首次调用时间 |
| `last_call_at` | string | 最后调用时间 |

---

## 记录规则

### 1. 记录触发条件

**必须记录的情况**：
- 任何技能被调用时
- 技能间发生调用关系时
- 流程阶段切换时
- 阻塞点 (BP-XXX) 被触发时

**记录格式**：
```
[时间戳] [调用者] → [被调用技能] | 目的: [调用目的] | 节点: [流程节点]
```

### 2. 调用节点标识

| 节点类型 | 标识格式 | 示例 |
|----------|----------|------|
| 阶段 | `Phase X` | `Phase 1` |
| 子阶段 | `Stage X-Y` | `Stage 1-2` |
| 步骤 | `Step X-Y-Z` | `Step 3-3-2` |
| 阻塞点 | `BP-XXX` | `BP-001` |
| 技能内部 | `[skill-name]` | `[hr-manager]` |

### 3. 调用目的分类

| 分类代码 | 说明 | 示例 |
|----------|------|------|
| `INIT` | 初始化操作 | 引擎初始化、环境检查 |
| `REQ` | 需求处理 | 需求澄清、需求变更 |
| `ALLOC` | 资源分配 | 人员分配、角色指派 |
| `EXEC` | 执行操作 | 执行具体开发任务 |
| `CHECK` | 检查验证 | 验收、测试、审查 |
| `COORD` | 协调调度 | 智能体调度、流程协调 |
| `REPORT` | 报告输出 | 生成报告、输出结果 |
| `OTHER` | 其他操作 | 不属于以上分类 |

---

## 执行流程

### 阶段一：初始化记录 (Initialization)

**触发**：引擎初始化完成时

**操作**：
1. 创建新的调用记录会话
2. 初始化记录存储结构
3. 记录调试器自身启动事件

**输出**：
```
[engine-module-debugger] 调试会话已启动
会话ID: [uuid]
开始时间: [timestamp]
```

### 阶段二：运行时记录 (Runtime)

**触发**：任何技能被调用时

**操作**：
1. 拦截技能调用事件
2. 提取调用信息（调用者、被调用者、目的）
3. 确定当前流程节点位置
4. 写入调用记录

**记录示例**：
```
[2024-02-19T10:30:00Z] [fullstack-engine-init] → [security-guard] 
| 目的: [INIT] 启动安全监控机制 
| 节点: [Phase 0 第1位]
```

### 阶段三：报告生成 (Reporting)

**触发**：游戏开发完成时

**操作**：
1. 汇总所有调用记录
2. 生成统计数据分析
3. 识别高频调用模块
4. 分析调用链依赖关系
5. 输出模块使用报告

---

## 模块使用报告

### 报告结构

```markdown
# 引擎模块使用报告

## 执行摘要
- 项目执行时间: [总时长]
- 总调用次数: [次数]
- 涉及技能数: [数量]
- 流程阶段覆盖: [Phase列表]

## 模块调用统计

### 高频使用模块 (Top 5)
| 排名 | 技能名称 | 调用次数 | 占比 | 主要调用者 |
|------|----------|----------|------|------------|
| 1 | [skill-name] | [count] | [%] | [callers] |
| ... | ... | ... | ... | ... |

### 模块详细统计
| 技能名称 | 总调用 | 唯一调用者 | 平均耗时 | 首次调用 | 最后调用 |
|----------|--------|------------|----------|----------|----------|
| [name] | [count] | [count] | [ms] | [time] | [time] |

## 调用链分析

### 核心调用路径
```
[起始技能] → [中间技能1] → [中间技能2] → [目标技能]
调用频次: [count]
```

### 循环依赖检测
| 循环路径 | 检测次数 | 建议 |
|----------|----------|------|
| [skill-a] ↔ [skill-b] | [count] | [建议] |

## 流程覆盖分析

### 各Phase技能调用分布
| Phase | 调用次数 | 主要技能 | 覆盖率 |
|-------|----------|----------|--------|
| Phase 0 | [count] | [skills] | [%] |
| Phase 1 | [count] | [skills] | [%] |
| ... | ... | ... | ... |

## 优化建议

### 高频模块优化
- [skill-name]: 建议缓存或优化调用逻辑

### 未充分利用模块
- [skill-name]: 建议检查是否需要增强集成

### 调用链优化
- 建议合并 [skill-a] 和 [skill-b] 的调用

## 附录

### 完整调用日志
[详细日志文件路径]

### 原始数据
[JSON数据文件路径]
```

---

## 集成方式

### 与 fullstack-engine-init 集成

**修改位置**：`.trae/skills/fullstack-engine-init/SKILL.md`

**集成点**：
1. 在依赖检查完成后激活调试器
2. 将调试器纳入自动扫描的技能列表
3. 在开发完成时触发报告生成

### 与其他技能集成

**调用记录API**：
```
engine-module-debugger.record_call(
    skill_name: string,      // 被调用技能
    caller: string,          // 调用者
    purpose: string,         // 调用目的
    context: object          // 上下文
)
```

---

## 注意事项

1. **性能影响**：记录操作对性能影响极小，但高频调用场景下可考虑采样记录
2. **存储管理**：长期项目可能产生大量记录，定期归档历史数据
3. **隐私保护**：记录中不包含敏感信息，仅记录技能调用关系
4. **术语一致**：所有描述必须使用 [terminology-standard](.trae/skills/terminology-standard/SKILL.md) 定义的标准术语
5. **引用优先**：相关定义优先使用引用而非重复描述

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，建立引擎模块调试功能 |

---

## 参考文档

- [terminology-standard](.trae/skills/terminology-standard/SKILL.md) - 术语标准
- [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) - 全栈游戏开发流程
- [fullstack-engine-init](.trae/skills/fullstack-engine-init/SKILL.md) - 引擎初始化
