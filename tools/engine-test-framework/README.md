# Engine Test Framework v2.0

## 概述

本测试框架专为全栈游戏开发引擎设计，能够快速测试引擎的全部流程，模拟真实的LLM生成环境，验证引擎中任何模块或技能的问题和不足。

## 核心特性

### 1. Header元数据验证
- 必填字段完整性检查
- Layer层级约束验证
- 版本号格式验证
- 描述长度限制

### 2. 依赖关系测试
- 循环依赖检测
- Layer层级约束（高层级不能依赖低层级）
- 依赖存在性验证
- 依赖类型验证（required/optional/conditional）

### 3. 函数签名验证
- 主函数存在性
- 验证器函数签名
- 状态管理器函数
- 查询函数

### 4. 契约验证
- 输入契约验证
- 输出契约验证
- 前置条件检查
- 后置条件检查

### 5. 执行模式验证
- blocking/parallel/conditional模式
- 回滚支持验证
- 检查点验证

### 6. 质量标准验证
- 验收标准验证
- 反幻觉配置验证
- 测试要求验证

## 目录结构

```
tools/engine-test-framework/
├── README.md                    # 本文档
├── config/
│   ├── test-scenarios.yaml      # 测试场景配置
│   ├── mock-outputs.yaml        # Mock输出配置
│   └── hallucination-patterns.yaml  # 幻觉模式配置
├── core/
│   ├── test-runner.js           # 测试运行器
│   ├── header-validator.js      # Header验证器
│   ├── dependency-validator.js  # 依赖验证器
│   ├── function-validator.js    # 函数验证器
│   ├── contract-validator.js    # 契约验证器
│   ├── execution-validator.js   # 执行验证器
│   └── quality-validator.js     # 质量验证器
├── suites/
│   ├── header-test-suite.js     # Header测试套件
│   ├── dependency-test-suite.js # 依赖测试套件
│   ├── function-test-suite.js   # 函数测试套件
│   ├── contract-test-suite.js   # 契约测试套件
│   ├── execution-test-suite.js  # 执行测试套件
│   └── quality-test-suite.js    # 质量测试套件
├── mock/
│   ├── mock-agent-factory.js    # Mock Agent工厂
│   ├── hallucination-injector.js # 幻觉注入器
│   └── context-compressor.js    # 上下文压缩器
├── reports/
│   └── .gitkeep                 # 报告输出目录
└── cli.js                       # 命令行入口
```

## 使用方法

### 验证所有技能

```bash
node cli.js test-all
```

### 验证单个技能

```bash
node cli.js test --skill=contract-validator
```

### 运行特定测试套件

```bash
node cli.js suite --name=header
node cli.js suite --name=dependency
node cli.js suite --name=function
```

### 生成报告

```bash
node cli.js report --output=reports/test-report.md
```

## 测试套件说明

### Header测试套件

验证技能Header元数据的完整性和正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| REQUIRED_FIELDS | 必填字段检查 | ERROR |
| LAYER_CONSTRAINT | Layer层级约束 | ERROR |
| VERSION_FORMAT | 版本号格式 | WARNING |
| DESCRIPTION_LENGTH | 描述长度限制 | WARNING |
| NAME_MATCH | 名称与目录匹配 | WARNING |

### 依赖测试套件

验证技能依赖关系的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| CIRCULAR_DEPENDENCY | 循环依赖检测 | CRITICAL |
| LAYER_VIOLATION | Layer层级违规 | ERROR |
| DEPENDENCY_EXISTS | 依赖存在性 | ERROR |
| DEPENDENCY_TYPE | 依赖类型有效性 | WARNING |

### 函数测试套件

验证技能函数签名的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| MAIN_FUNCTION | 主函数存在性 | ERROR |
| FUNCTION_SIGNATURE | 函数签名格式 | WARNING |
| RETURN_TYPE | 返回类型定义 | INFO |

### 契约测试套件

验证技能契约定义的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| INPUT_CONTRACT | 输入契约完整性 | ERROR |
| OUTPUT_CONTRACT | 输出契约完整性 | ERROR |
| PRECONDITIONS | 前置条件定义 | WARNING |
| POSTCONDITIONS | 后置条件定义 | WARNING |

### 执行测试套件

验证技能执行配置的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| EXECUTION_MODE | 执行模式有效性 | ERROR |
| ROLLBACK_SUPPORT | 回滚支持定义 | WARNING |
| CHECKPOINTS | 检查点定义 | INFO |

### 质量测试套件

验证技能质量配置的正确性：

| 测试项 | 说明 | 严重级别 |
|--------|------|----------|
| ACCEPTANCE_CRITERIA | 验收标准定义 | ERROR |
| ANTI_HALLUCINATION | 反幻觉配置 | WARNING |
| TEST_REQUIREMENTS | 测试要求 | WARNING |

## 输出示例

```
╔═══════════════════════════════════════════════════════════════╗
║              Engine Test Framework v2.0 - Report              ║
╠═══════════════════════════════════════════════════════════════╣
║ Test Run: 2026-02-20T10:30:00Z                                ║
║ Duration: 1.23s                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ SUMMARY                                                       ║
║ ───────────────────────────────────────────────────────────── ║
║ Total Skills:     25                                          ║
║ Total Tests:      150                                         ║
║ Passed:           142 (94.7%)                                 ║
║ Failed:           5 (3.3%)                                    ║
║ Warnings:         12 (8.0%)                                   ║
╠═══════════════════════════════════════════════════════════════╣
║ SUITE RESULTS                                                 ║
║ ───────────────────────────────────────────────────────────── ║
║ Header:       25/25 passed                                    ║
║ Dependency:   24/25 passed (1 circular detected)              ║
║ Function:     23/25 passed                                    ║
║ Contract:     25/25 passed                                    ║
║ Execution:    25/25 passed                                    ║
║ Quality:      20/25 passed                                    ║
╠═══════════════════════════════════════════════════════════════╣
║ FAILED TESTS                                                  ║
║ ───────────────────────────────────────────────────────────── ║
║ [ERROR] skill-a: CIRCULAR_DEPENDENCY                          ║
║   → Cycle detected: skill-a → skill-b → skill-a              ║
║ [ERROR] skill-b: LAYER_VIOLATION                              ║
║   → Layer 2 skill depends on Layer 3 skill                    ║
╚═══════════════════════════════════════════════════════════════╝
```

## 扩展指南

### 添加新的测试套件

1. 在 `suites/` 目录创建新的测试套件文件
2. 继承 `BaseTestSuite` 类
3. 实现 `run()` 方法
4. 在 `cli.js` 中注册新套件

### 添加新的Mock Agent

1. 在 `mock/mock-agent-factory.js` 中添加新的Agent类型
2. 定义Agent的行为和输出模式
3. 配置幻觉注入规则

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v2.0 | 2026-02-20 | 整合Header元数据验证和依赖测试框架 |
| v1.0 | 2024-02-19 | 初始版本 |
