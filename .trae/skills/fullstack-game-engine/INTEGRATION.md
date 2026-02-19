# 全栈游戏开发引擎 - 新架构集成指南

> **状态管理**：[state-manager](.trae/skills/state-manager/SKILL.md)
> **契约验证**：[contract-validator](.trae/skills/contract-validator/SKILL.md)
> **事件总线**：[event-bus](.trae/skills/event-bus/SKILL.md)
> **流程策略**：[flow-strategy](.trae/skills/flow-strategy/SKILL.md)
> **命令管理**：[command-manager](.trae/skills/command-manager/SKILL.md)

---

## 架构概述

新架构采用**事件驱动 + 状态管理 + 契约验证**的设计模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                         项目负责人 (PL)                          │
│                     (统一调度和中转层)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  state-manager │    │  event-bus    │    │command-manager│
│   (状态管理)   │    │   (事件总线)   │    │   (命令管理)  │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    contract-validator                            │
│                      (契约验证层)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  flow-strategy │    │   hr-manager  │    │   bug-tracker │
│   (流程策略)   │    │   (人员管理)   │    │   (问题追踪)  │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 核心流程（PL调用序列）

### 1. 流程初始化

```typescript
// Step 1: 初始化状态
const state = await state_manager.initialize_state("clicker-game");

// Step 2: 应用流程策略
const strategy = await flow_strategy.get_strategy("RPG");
await flow_strategy.apply_strategy(strategy.strategy_id);

// Step 3: 订阅关键事件
await event_bus.subscribe(["BP_UNLOCKED", "ROLE_COMPLETED"], handle_flow_event);

// Step 4: 发布初始化完成事件
await event_bus.publish({
  event_type: "FLOW_INITIALIZED",
  payload: { project_name: "clicker-game", strategy: strategy.strategy_id },
  context: { project_name: "clicker-game", state_id: state.state_id, triggered_by: "PL" }
});
```

### 2. 阻塞点解锁流程

```typescript
// 当满足解锁条件时
async function unlock_bp(bp_id: BP_ID, current_state: STATE) {
  // Step 1: 验证前置契约
  const preconditions = await contract_validator.check_preconditions_for_bp(bp_id, current_state);
  if (!preconditions.all_satisfied) {
    throw new Error(`BP ${bp_id} 前置条件未满足: ${preconditions.blockers}`);
  }
  
  // Step 2: 创建解锁命令
  const unlock_cmd = {
    command_type: "UNLOCK_BP",
    payload: { bp_id },
    context: { project_name, state_id: current_state.state_id, executed_by: "PL" }
  };
  
  // Step 3: 执行命令
  const result = await command_manager.execute(unlock_cmd);
  
  // Step 4: 保存状态检查点
  const new_state = await state_manager.save_checkpoint(
    result.new_state, 
    `${bp_id}-unlocked`, 
    true
  );
  
  // Step 5: 发布事件
  await event_bus.publish({
    event_type: "BP_UNLOCKED",
    payload: { bp_id, state_id: new_state.state_id },
    context: { project_name, state_id: new_state.state_id, triggered_by: "PL" }
  });
  
  return new_state;
}
```

### 3. 角色分配流程

```typescript
// 分配角色执行任务
async function assign_role(role_id: ROLE_ID, task: TASK, current_state: STATE) {
  // Step 1: 验证输入契约
  const input_validation = await contract_validator.validate_input(role_id, task.input_artifacts);
  if (!input_validation.valid) {
    throw new Error(`角色 ${role_id} 输入验证失败: ${input_validation.failed_checks}`);
  }
  
  // Step 2: 创建分配命令
  const assign_cmd = {
    command_type: "ASSIGN_ROLE",
    payload: { role_id, task },
    context: { project_name, state_id: current_state.state_id, executed_by: "PL" }
  };
  
  // Step 3: 执行命令
  const result = await command_manager.execute(assign_cmd);
  
  // Step 4: 保存状态
  const new_state = await state_manager.save_checkpoint(
    result.new_state,
    `${role_id}-assigned`,
    false  // 角色分配不是关键检查点
  );
  
  // Step 5: 发布事件
  await event_bus.publish({
    event_type: "ROLE_ASSIGNED",
    payload: { role_id, task_id: task.id },
    context: { project_name, state_id: new_state.state_id, triggered_by: "PL" }
  });
  
  return new_state;
}
```

### 4. 角色完成验收流程

```typescript
// 角色完成任务后的验收
async function complete_role(role_id: ROLE_ID, artifacts: [ARTIFACT_PATH], current_state: STATE) {
  // Step 1: 验证输出契约
  const output_validation = await contract_validator.validate_output(role_id, artifacts);
  
  if (!output_validation.valid) {
    // 验证失败，决策路径
    const decision = await handle_validation_failure(role_id, output_validation);
    
    switch (decision.action) {
      case "RETRY":
        // 要求角色修复
        return await request_role_retry(role_id, output_validation.failed_checks);
        
      case "EXCEPTION":
        // 授权例外
        await contract_validator.grant_exception(role_id, output_validation.failed_checks, decision.reason, "PL");
        break;
        
      case "ROLLBACK":
        // 回滚流程
        return await rollback_to_previous_checkpoint(current_state);
        
      default:
        throw new Error(`未处理的验证失败决策: ${decision.action}`);
    }
  }
  
  // Step 2: 创建完成命令
  const complete_cmd = {
    command_type: "COMPLETE_ROLE",
    payload: { role_id, artifacts },
    context: { project_name, state_id: current_state.state_id, executed_by: "PL" }
  };
  
  // Step 3: 执行命令
  const result = await command_manager.execute(complete_cmd);
  
  // Step 4: 保存检查点（角色完成是关键节点）
  const new_state = await state_manager.save_checkpoint(
    result.new_state,
    `${role_id}-completed`,
    true
  );
  
  // Step 5: 发布事件
  await event_bus.publish({
    event_type: "ROLE_COMPLETED",
    payload: { role_id, artifacts },
    context: { project_name, state_id: new_state.state_id, triggered_by: "PL" }
  });
  
  return new_state;
}
```

### 5. 状态回滚流程

```typescript
// 回滚到指定检查点
async function rollback_to(target_state_id: UUID, current_state: STATE) {
  // Step 1: 验证目标状态
  const target_state = await state_manager.load_state(target_state_id);
  if (!target_state.metadata.is_checkpoint) {
    throw new Error(`状态 ${target_state_id} 不是检查点，无法回滚`);
  }
  
  // Step 2: 生成回滚计划
  const rollback_plan = await state_manager.generate_rollback_plan(target_state_id);
  
  // Step 3: PL确认（关键！）
  const confirmed = await confirm_rollback_with_pl(rollback_plan);
  if (!confirmed) {
    return { success: false, reason: "PL取消回滚" };
  }
  
  // Step 4: 创建回滚命令
  const rollback_cmd = {
    command_type: "ROLLBACK_TO",
    payload: { target_state_id },
    context: { project_name, state_id: current_state.state_id, executed_by: "PL" }
  };
  
  // Step 5: 执行回滚命令
  const result = await command_manager.execute(rollback_cmd);
  
  // Step 6: 保存回滚后的新状态
  const new_state = await state_manager.save_checkpoint(
    result.new_state,
    `rollback-to-${target_state_id}`,
    true
  );
  
  // Step 7: 发布回滚完成事件
  await event_bus.publish({
    event_type: "ROLLBACK_COMPLETED",
    payload: { 
      from_state: current_state.state_id,
      to_state: target_state_id,
      rollback_plan: rollback_plan
    },
    context: { project_name, state_id: new_state.state_id, triggered_by: "PL" }
  });
  
  return { success: true, new_state };
}
```

---

## 数据一致性保证

### 1. 原子性操作

所有关键操作都通过 `command_manager.execute()` 执行，确保：
- 操作要么完全成功，要么完全失败
- 失败时自动回滚到操作前状态
- 操作结果立即保存到新状态

### 2. 状态链完整性

```
STATE_A (checkpoint) 
    ↓ parent_state_id
STATE_B (checkpoint)
    ↓ parent_state_id
STATE_C (temp)
    ↓ parent_state_id
STATE_D (checkpoint)
```

- 每个状态都记录 `parent_state_id`
- 检查点状态标记 `is_checkpoint=true`
- 回滚只能到检查点状态

### 3. 契约验证拦截

```
角色输出 → contract_validator.validate_output() 
    ↓
验证通过 → 继续流程
验证失败 → 拦截并决策
    ├─ 修复 → 重新验证
    ├─ 例外 → 记录并继续
    └─ 回滚 → 调用 rollback_to()
```

### 4. 事件溯源

所有状态变更都通过事件记录：
- 事件不可变，追加写入
- 状态可由事件流重建
- 支持事件回放调试

---

## 错误排查指南

### 场景1：角色输出验证失败

```
症状：contract_validator.validate_output() 返回 valid=false

排查步骤：
1. 查看 VALIDATION_RESULT.failed_checks
2. 检查失败的具体检查项
3. 对比契约定义和实际输出
4. 决策：修复/例外/回滚

PL操作：
- 调用 contract_validator.get_contract(role_id) 查看契约
- 调用 state_manager.diff_states() 对比状态差异
- 决策后执行相应命令
```

### 场景2：状态回滚失败

```
症状：state_manager.rollback_to() 返回 success=false

排查步骤：
1. 检查目标状态是否存在
2. 检查目标状态是否为检查点
3. 检查当前状态是否有未完成的操作
4. 查看状态链是否完整

PL操作：
- 调用 state_manager.get_state_history() 查看历史
- 调用 state_manager.validate_state_consistency() 验证状态
- 尝试回滚到更早的检查点
```

### 场景3：流程卡住

```
症状：某个阻塞点长时间未解锁

排查步骤：
1. 查看 event_bus.get_event_log() 最近事件
2. 检查 contract_validator.check_preconditions() 结果
3. 查看活跃角色状态
4. 检查是否有角色失败未处理

PL操作：
- 调用 state_manager.load_state() 查看当前状态
- 检查 active_roles 和 completed_roles
- 手动触发事件或回滚
```

---

## 完整调用示例

```typescript
// 完整的 RPG 游戏开发流程

async function develop_rpg_game(project_name: string) {
  // ========== Phase 0: 初始化 ==========
  const state_0 = await state_manager.initialize_state(project_name);
  const strategy = await flow_strategy.get_strategy("RPG");
  await flow_strategy.apply_strategy(strategy.strategy_id);
  
  // ========== Phase 1: 需求分析 ==========
  // BP-001: 引擎初始化完成
  const state_1 = await unlock_bp("BP-001", state_0);
  
  // BP-002: 需求拆分完成
  const state_2 = await unlock_bp("BP-002", state_1);
  
  // BP-003: 子策划设计完成（并行15人）
  const state_3 = await execute_stage_1_2(strategy.roles.design, state_2);
  
  // BP-004: 文档整合完成
  const state_4 = await unlock_bp("BP-004", state_3);
  
  // ========== Phase 2: 技术实现 ==========
  // BP-005: 框架搭建完成
  const state_5 = await unlock_bp("BP-005", state_4);
  
  // BP-006: 功能开发完成（并行14人）
  const state_6 = await execute_stage_2_2(strategy.roles.development, state_5);
  
  // BP-007: 代码审查完成
  const state_7 = await unlock_bp("BP-007", state_6);
  
  // ========== Phase 3: 策划验收 ==========
  // BP-008: 主策划过审
  const state_8 = await unlock_bp("BP-008", state_7);
  
  // BP-009: 子策划验收完成（并行14人）
  const state_9 = await execute_stage_3_2(strategy.roles.design, state_8);
  
  // BP-010 ~ BP-012: QA测试
  const state_10 = await execute_stage_3_3(strategy.roles.qa, state_9);
  
  // ========== Phase 4: 交付 ==========
  // BP-013: 项目交付完成
  const state_final = await unlock_bp("BP-013", state_10);
  
  return state_final;
}

// 执行并行阶段
async function execute_stage_1_2(roles: [ROLE_ID], current_state: STATE) {
  // 批量分配角色
  const assign_commands = roles.map(role_id => ({
    command_type: "ASSIGN_ROLE",
    payload: { role_id, task: get_task_for_role(role_id) },
    context: { project_name, state_id: current_state.state_id, executed_by: "PL" }
  }));
  
  const batch_result = await command_manager.execute_batch(assign_commands, { atomic: false });
  
  // 等待所有角色完成（实际中通过事件监听）
  for (const role_id of roles) {
    await wait_for_role_completion(role_id);
  }
  
  // 批量验证
  const validations = roles.map(role_id => ({
    role_id,
    artifacts: get_role_artifacts(role_id),
    type: "OUTPUT"
  }));
  
  const validation_result = await contract_validator.validate_batch(validations);
  
  if (!validation_result.overall_valid) {
    // 处理验证失败
    for (const failed_role of validation_result.failed_roles) {
      await handle_validation_failure(failed_role);
    }
  }
  
  // 保存检查点
  return await state_manager.save_checkpoint(
    batch_result.final_state,
    "Stage-1-2-complete",
    true
  );
}
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 新架构集成指南，支持完整状态管理和回滚 |
