# Engine Test Framework Report

## Summary

| Metric | Value |
|--------|-------|
| Total Skills | 26 |
| Duration | 0.05s |
| Passed | 629 |
| Failed | 27 |
| Warnings | 26 |
| Pass Rate | 95.9% |

## Suite Results

| Suite | Passed | Failed | Warnings |
|-------|--------|--------|----------|
| header | 286 | 0 | 0 |
| dependency | 4 | 0 | 0 |
| function | 104 | 0 | 0 |
| blockage | 98 | 13 | 12 |
| parallel | 38 | 1 | 1 |
| agent-dispatch | 43 | 7 | 7 |
| qa-stage | 56 | 6 | 6 |

## Failed Tests

### blockage

- **[ERROR]** fullstack-game-engine: BLOCKAGE_DEFINED_BP-016
  - BP-016(项目经验总结完成)未在流程中定义
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-001
  - BP-001缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-003
  - BP-003缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-004
  - BP-004缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-006
  - BP-006缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-007
  - BP-007缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-010
  - BP-010缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-011
  - BP-011缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-012
  - BP-012缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-013
  - BP-013缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-014
  - BP-014缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-015
  - BP-015缺少明确的解锁条件描述
- **[WARNING]** fullstack-game-engine: BLOCKAGE_UNLOCK_CONDITION_BP-016
  - BP-016解锁条件段落未找到
### parallel

- **[WARNING]** fullstack-game-engine: PARALLEL_TRIGGER_Stage_1_2
  - Stage 1-2建议明确触发条件: BP-002解锁后启动
### agent-dispatch

- **[WARNING]** fullstack-game-engine: DISPATCH_RECORD_SECTION_EXISTS
  - 建议添加调度记录章节
- **[WARNING]** fullstack-game-engine: DISPATCH_RECORD_FIELD_dispatch_id
  - 建议定义调度记录字段"dispatch_id"
- **[WARNING]** fullstack-game-engine: DISPATCH_RECORD_FIELD_timestamp
  - 建议定义调度记录字段"timestamp"
- **[WARNING]** fullstack-game-engine: DISPATCH_RECORD_FIELD_source_agent
  - 建议定义调度记录字段"source_agent"
- **[WARNING]** fullstack-game-engine: DISPATCH_RECORD_FIELD_target_agent
  - 建议定义调度记录字段"target_agent"
- **[WARNING]** agent-dispatcher: AGENT_DISPATCHER_FUNC_parallel
  - agent-dispatcher建议定义parallel函数
- **[WARNING]** agent-dispatcher: AGENT_DISPATCHER_FUNC_summary
  - agent-dispatcher建议定义summary函数
### qa-stage

- **[WARNING]** qa-standards-manager: ACCEPTANCE_CRITERIA_FPT_COMPLETE
  - 验收标准"完整路径测试完成"未明确定义
- **[WARNING]** qa-standards-manager: ACCEPTANCE_CRITERIA_ANTI_HALLUCINATION_SIGNED
  - 验收标准"反幻觉自检签署"未明确定义
- **[WARNING]** qa-standards-manager: REGRESSION_REQUIREMENT_AFTER_FIX
  - 回归测试要求"修复后执行"未明确定义
- **[WARNING]** qa-standards-manager: REGRESSION_REQUIREMENT_ALL_TEST_CASES
  - 回归测试要求"覆盖所有用例"未明确定义
- **[WARNING]** qa-standards-manager: PROHIBITED_BEHAVIOR_禁止仅凭代码
  - 建议定义禁止行为"禁止仅凭代码推断"
- **[WARNING]** qa-standards-manager: PROHIBITED_BEHAVIOR_禁止复制粘贴
  - 建议定义禁止行为"禁止复制粘贴测试结果"

---
Generated at: 2026-02-19T21:21:43.469Z
