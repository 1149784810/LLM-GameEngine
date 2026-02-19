#!/usr/bin/env node
/**
 * Framework Operation Demo
 * 框架运作演示脚本
 * 
 * 演示场景：创建新技能 "game-save-manager"
 * 展示框架如何被调用和运作
 */

const fs = require('fs');
const path = require('path');
const { SkillHeaderParser } = require('./skill-header-parser');
const { SkillExecutionValidator } = require('./skill-execution-validator');
const { SkillQualityValidator } = require('./skill-quality-validator');

const COLORS = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    header: '\x1b[35m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    step: '\x1b[34m'
};

function log(message, type = 'info') {
    console.log(`${COLORS[type] || ''}${message}${COLORS.reset}`);
}

function printStep(stepNum, title) {
    console.log(`\n${COLORS.step}${COLORS.bold}━━━ Step ${stepNum}: ${title} ━━━${COLORS.reset}\n`);
}

function printBox(title, content) {
    const lines = content.split('\n');
    const width = Math.max(title.length + 4, ...lines.map(l => l.length + 4));
    const border = '─'.repeat(width);
    
    console.log(`\n${COLORS.header}┌${border}┐${COLORS.reset}`);
    console.log(`${COLORS.header}│  ${title}${' '.repeat(width - title.length - 2)}│${COLORS.reset}`);
    console.log(`${COLORS.header}├${border}┤${COLORS.reset}`);
    for (const line of lines) {
        console.log(`${COLORS.header}│  ${line}${' '.repeat(width - line.length - 2)}│${COLORS.reset}`);
    }
    console.log(`${COLORS.header}└${border}┘${COLORS.reset}`);
}

async function runDemo() {
    console.log(`\n${COLORS.header}${COLORS.bold}╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║          全栈游戏开发引擎 - 框架运作演示                        ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

    log('场景: 用户想创建新技能 "game-save-manager" 来管理游戏存档功能', 'info');
    log('用户输入: "我想创建一个新技能 game-save-manager 来管理游戏存档功能"', 'dim');

    // Step 1: skill-optimizer 拦截请求
    printStep(1, 'skill-optimizer 拦截请求');
    
    log('根据 project_rules.md 规则:', 'info');
    log('  "每当创建游戏开发相关或者引擎流程相关的技能时，都需要先调用技能优化器的技能"', 'dim');
    log('\n系统自动调用 skill-optimizer 技能...', 'success');

    printBox('skill-optimizer 职责', 
`1. 检查是否已有类似技能 (冗余检测)
2. 确定技能层级 (Layer分配)
3. 分析依赖关系
4. 生成Header模板
5. 更新测试框架`);

    // Step 2: 冗余检测
    printStep(2, '冗余检测 - 扫描现有技能库');
    
    const parser = new SkillHeaderParser(false);
    parser.scanAllSkills();
    
    log('扫描现有技能库...', 'info');
    log(`发现 ${parser.skills.size} 个现有技能`, 'info');
    
    // 检查与 state-manager 的关系
    const stateManager = parser.skills.get('state-manager');
    if (stateManager) {
        log('\n发现相关技能: state-manager', 'warning');
        log(`  Layer: ${stateManager.header.layer}`, 'dim');
        log(`  描述: ${stateManager.header.description?.substring(0, 50)}...`, 'dim');
        
        log('\n分析职责边界:', 'info');
        log('  state-manager: 负责整体流程状态管理', 'dim');
        log('  game-save-manager: 负责游戏存档功能 (业务逻辑)', 'dim');
        log('  结论: 职责不重叠，可以创建新技能', 'success');
    }

    // Step 3: 生成Header模板
    printStep(3, '生成Header模板');
    
    const headerTemplate = `---
name: "game-save-manager"
version: "1.0.0"
description: "游戏存档管理器，负责游戏存档的创建、加载、删除和同步功能。支持多存档槽位、自动存档和云存档同步。"
author: "engine-team"
created_at: "2026-02-20"
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
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "状态管理集成"

contracts:
  input:
    required_documents:
      - pattern: "docs/02-策划文档/SAVE-SYSTEM-.*\\.md"
        description: "存档系统设计文档"
  output:
    required_documents:
      - pattern: "scripts/SaveSystem/.*\\.cs"
        description: "存档系统脚本"
      - pattern: "docs/04-开发文档/SAVE-API-.*\\.md"
        description: "存档API文档"

execution:
  mode: "blocking"
  preconditions:
    - type: "BP_UNLOCKED"
      target: "BP-005"
      description: "核心系统开发阶段"
  postconditions:
    - type: "ARTIFACT_CREATED"
      target: "scripts/SaveSystem/SaveManager.cs"
      description: "创建存档管理器脚本"
  rollback:
    supported: true
    strategy: "checkpoint"
    side_effects:
      - "删除已创建的存档脚本"
    recovery_actions:
      - action: "DELETE_ARTIFACTS"
        target: "scripts/SaveSystem/*"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "存档功能完整"
      metric: "save_feature_completeness"
      threshold: 1.0
      operator: "=="
      required: true
  testing:
    required_tests:
      - type: "FT"
        description: "存档功能测试"
        required: true
    evidence_required: true
    anti_hallucination:
      enabled: true
      level: "LEVEL_2"
      min_screenshots: 3

tracking:
  execution_status:
    current: "PENDING"
  error_codes:
    - code: "E001"
      name: "SAVE_FAILED"
      severity: "HIGH"
      rollback_required: true
  checkpoints:
    - id: "CP-001"
      name: "核心逻辑完成"
      position: "after_core_logic"
      rollback_supported: true

functions:
  main:
    name: "implement_save_system"
    signature: "implement_save_system(design_doc: PATH) -> IMPLEMENTATION_RESULT"
    description: "实现存档系统"
---`;

    log('根据技能类型 "业务逻辑" 确定:', 'info');
    log('  Layer: 3 (业务逻辑层)', 'dim');
    log('  Dependencies:', 'dim');
    log('    - terminology-standard (Layer 0)', 'dim');
    log('    - fullstack-game-engine (Layer 1)', 'dim');
    log('    - state-manager (Layer 2)', 'dim');
    
    printBox('生成的Header模板', headerTemplate);

    // Step 4: Header验证
    printStep(4, 'Header验证');
    
    log('运行验证命令:', 'info');
    log('  $ node tools/skill-validator-cli.js validate --skill=game-save-manager', 'dim');
    
    log('\n验证结果:', 'info');
    log('  ✅ 必填字段完整', 'success');
    log('  ✅ Layer层级合规 (Layer 3 依赖 Layer 0,1,2)', 'success');
    log('  ✅ 无循环依赖', 'success');
    log('  ✅ 契约定义清晰', 'success');
    log('  ✅ 执行模式正确', 'success');
    log('  ✅ 质量标准完整', 'success');

    // Step 5: 测试框架自动更新
    printStep(5, '测试框架自动更新');
    
    log('skill-optimizer 自动执行以下更新:', 'info');
    
    log('\n1. 更新 skill-header-parser.js:', 'info');
    log('   // 新技能自动纳入扫描范围', 'dim');
    log('   skills.set("game-save-manager", {...})', 'dim');
    
    log('\n2. 更新依赖图:', 'info');
    log('   dependencyGraph.set("game-save-manager", [', 'dim');
    log('     "terminology-standard",', 'dim');
    log('     "fullstack-game-engine",', 'dim');
    log('     "state-manager"', 'dim');
    log('   ])', 'dim');
    
    log('\n3. 运行验证测试:', 'info');
    log('   $ node tools/skill-validator-cli.js test-all', 'dim');
    log('   Total: 26 skills', 'dim');
    log('   Passed: 26', 'dim');
    log('   Failed: 0', 'dim');
    log('   Pass Rate: 100.0%', 'dim');

    // Step 6: 输出优化报告
    printStep(6, '输出优化报告');
    
    const report = `## 技能优化报告

### 检测项目：game-save-manager

### 冗余检测结果
- 与 state-manager 功能不重叠
- 职责边界清晰
- 允许创建新技能

### Header验证结果
- ✅ 所有必填字段完整
- ✅ Layer层级合规
- ✅ 依赖关系正确
- ✅ 契约定义清晰

### 测试框架更新
- ✅ skill-header-parser.js 已更新
- ✅ 依赖图已更新
- ✅ 验证测试通过

### 最终结论
- [x] 允许创建/更新
- [ ] 需要修改后重新审查
- [ ] 建议合并到现有技能`;

    printBox('优化报告', report);

    // 完成
    console.log(`\n${COLORS.success}${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
    log('\n✅ 框架运作演示完成！', 'success');
    log('\n总结:', 'header');
    log('  1. skill-optimizer 拦截新技能创建请求', 'info');
    log('  2. 执行冗余检测，确保无功能重叠', 'info');
    log('  3. 根据技能类型生成符合规范的Header模板', 'info');
    log('  4. 验证Header完整性和层级合规性', 'info');
    log('  5. 自动更新测试框架配置', 'info');
    log('  6. 输出优化报告，批准技能创建', 'info');
    
    log('\n这套框架确保了:', 'header');
    log('  • 所有技能都有完整、规范的Header元数据', 'success');
    log('  • 技能间无冗余、无冲突', 'success');
    log('  • 新技能自动纳入测试范围', 'success');
    log('  • 流程可追溯、可回滚', 'success');
    log('  • 质量标准自动验证', 'success');
    console.log(`${COLORS.success}${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

runDemo().catch(console.error);
