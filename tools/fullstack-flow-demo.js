/**
 * 全栈游戏开发流程 - Header元数据框架集成演示
 * 
 * 本脚本演示header元数据框架如何在完整游戏开发流程(Phase 0-5)中生效和调用
 * 
 * 流程阶段:
 * - Phase 0: 引擎初始化
 * - Phase 1: 需求澄清
 * - Phase 2: 人员分配
 * - Phase 3: 流程建立
 * - Phase 4: 正式开发 (含设计/编程/验收/QA子阶段)
 * - Phase 5: 项目经验总结
 * - 伴生阶段: agent-dispatcher, qa-standards-manager, bug-tracker
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 核心框架模块 (模拟)
// ============================================

class SkillHeaderParser {
    static parse(skillPath) {
        const content = fs.readFileSync(skillPath, 'utf-8');
        const headerMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!headerMatch) return null;
        
        const yaml = headerMatch[1];
        const header = {};
        
        yaml.split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2];
                if (value.startsWith('[')) {
                    value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
                } else if (value.startsWith('"') || value.startsWith("'")) {
                    value = value.slice(1, -1);
                }
                header[key] = value;
            }
        });
        
        return header;
    }
    
    static getDependencies(header) {
        return header.dependencies || [];
    }
    
    static getLayer(header) {
        return header.layer || 0;
    }
    
    static getContracts(header) {
        const content = fs.readFileSync(path.join(__dirname, '..', '.trae', 'skills', header.name, 'SKILL.md'), 'utf-8');
        const contractsMatch = content.match(/contracts:\s*\n([\s\S]*?)(?=\n\w+:|\n---|$)/);
        if (!contractsMatch) return { input: [], output: [] };
        
        const contractsYaml = contractsMatch[1];
        const contracts = { input: [], output: [] };
        
        let currentSection = null;
        contractsYaml.split('\n').forEach(line => {
            if (line.includes('input:')) currentSection = 'input';
            else if (line.includes('output:')) currentSection = 'output';
            else if (line.trim().startsWith('- ') && currentSection) {
                contracts[currentSection].push(line.trim().slice(2));
            }
        });
        
        return contracts;
    }
}

class ExecutionValidator {
    static validatePreconditions(header, context) {
        const errors = [];
        const deps = SkillHeaderParser.getDependencies(header);
        
        deps.forEach(dep => {
            if (!context.completedSkills.includes(dep)) {
                errors.push(`依赖技能 ${dep} 尚未完成`);
            }
        });
        
        return { valid: errors.length === 0, errors };
    }
    
    static validateContract(header, input, expectedOutput) {
        const contracts = SkillHeaderParser.getContracts(header);
        const errors = [];
        
        contracts.input.forEach(req => {
            if (!input[req]) {
                errors.push(`缺少必需输入: ${req}`);
            }
        });
        
        return { valid: errors.length === 0, errors };
    }
}

class RollbackDecider {
    static analyze(error, context) {
        const errorPatterns = {
            'DEPENDENCY_NOT_MET': { action: 'ROLLBACK', target: 'PREVIOUS_SKILL' },
            'CONTRACT_VIOLATION': { action: 'ROLLBACK', target: 'CURRENT_SKILL' },
            'QUALITY_FAILED': { action: 'RETRY', target: 'CURRENT_SKILL', maxRetries: 3 },
            'CRITICAL_ERROR': { action: 'ROLLBACK_FULL', target: 'PHASE_START' }
        };
        
        const pattern = errorPatterns[error.code] || { action: 'HALT', target: 'CURRENT' };
        
        return {
            action: pattern.action,
            target: pattern.target,
            checkpoint: context.currentCheckpoint,
            reason: error.message
        };
    }
}

class QualityValidator {
    static validate(header, deliverables) {
        const results = [];
        const verifications = header.verification_level || 'LEVEL_1';
        
        if (verifications.includes('LEVEL_1')) {
            results.push(this.level1Validation(deliverables));
        }
        if (verifications.includes('LEVEL_2')) {
            results.push(this.level2Validation(deliverables));
        }
        if (verifications.includes('LEVEL_3')) {
            results.push(this.level3Validation(deliverables));
        }
        
        return {
            passed: results.every(r => r.passed),
            levels: results
        };
    }
    
    static level1Validation(deliverables) {
        return {
            level: 'LEVEL_1',
            passed: deliverables.files && deliverables.files.length > 0,
            checks: ['文件存在性验证']
        };
    }
    
    static level2Validation(deliverables) {
        return {
            level: 'LEVEL_2',
            passed: deliverables.content && deliverables.content.length > 100,
            checks: ['内容完整性验证', '格式规范性验证']
        };
    }
    
    static level3Validation(deliverables) {
        return {
            level: 'LEVEL_3',
            passed: deliverables.evidence && deliverables.evidence.length > 0,
            checks: ['测试证据验证', '反幻觉验证', '可追溯性验证']
        };
    }
}

// ============================================
// 流程状态管理器
// ============================================

class FlowStateManager {
    constructor() {
        this.currentPhase = 0;
        this.currentStage = '';
        this.completedSkills = [];
        this.checkpoints = [];
        this.errors = [];
        this.blockingPoints = [];
    }
    
    addCheckpoint(name, data) {
        this.checkpoints.push({
            name,
            timestamp: new Date().toISOString(),
            data,
            phase: this.currentPhase,
            stage: this.currentStage
        });
    }
    
    completeSkill(skillName) {
        this.completedSkills.push(skillName);
    }
    
    addError(code, message, skill) {
        this.errors.push({
            code,
            message,
            skill,
            timestamp: new Date().toISOString()
        });
    }
    
    addBlockingPoint(bpId, status, reason) {
        this.blockingPoints.push({
            id: bpId,
            status,
            reason,
            timestamp: new Date().toISOString()
        });
    }
}

// ============================================
// 阻塞点验证器
// ============================================

class BlockingPointValidator {
    static BLOCKING_POINTS = {
        'BP-001': { phase: 0, name: '引擎初始化完成', requiredSkills: ['fullstack-engine-init'] },
        'BP-002': { phase: 1, name: '需求澄清完成', requiredSkills: ['requirement-normalizer'] },
        'BP-003': { phase: 2, name: '人员分配完成', requiredSkills: ['hr-manager'] },
        'BP-004': { phase: 3, name: '流程建立完成', requiredSkills: ['flow-strategy', 'event-bus'] },
        'BP-005': { phase: 4, name: '设计阶段开始', requiredSkills: [] },
        'BP-006': { phase: 4, name: '设计文档完成', requiredSkills: ['game-lead-designer'] },
        'BP-007': { phase: 4, name: '编程阶段开始', requiredSkills: [] },
        'BP-008': { phase: 4, name: '客户端编程完成', requiredSkills: ['client-programmer-leader'] },
        'BP-009': { phase: 4, name: '服务端编程完成', requiredSkills: ['serve-programmer-leader'] },
        'BP-010': { phase: 4, name: '验收阶段开始', requiredSkills: [] },
        'BP-011': { phase: 4, name: '验收完成', requiredSkills: ['game-requirement-verifier'] },
        'BP-012': { phase: 4, name: 'QA测试开始', requiredSkills: [] },
        'BP-013': { phase: 4, name: 'QA测试完成', requiredSkills: ['qa-standards-manager'] },
        'BP-014': { phase: 5, name: '项目总结完成', requiredSkills: ['project-experience-summarizer'] },
        'BP-015': { name: '项目完成', requiredSkills: [] }
    };
    
    static validate(bpId, state) {
        const bp = this.BLOCKING_POINTS[bpId];
        if (!bp) return { passed: false, reason: '未知阻塞点' };
        
        const missingSkills = bp.requiredSkills.filter(s => !state.completedSkills.includes(s));
        
        return {
            passed: missingSkills.length === 0,
            missingSkills,
            bpInfo: bp
        };
    }
}

// ============================================
// 完整流程演示
// ============================================

class FullstackFlowDemo {
    constructor() {
        this.state = new FlowStateManager();
        this.skillsDir = path.join(__dirname, '..', '.trae', 'skills');
    }
    
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            phase: '\x1b[35m',
            checkpoint: '\x1b[34m'
        };
        const reset = '\x1b[0m';
        console.log(`${colors[type]}${message}${reset}`);
    }
    
    loadSkill(skillName) {
        const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
        if (!fs.existsSync(skillPath)) return null;
        return SkillHeaderParser.parse(skillPath);
    }
    
    async executeSkill(skillName, input = {}) {
        this.log(`\n▶ 执行技能: ${skillName}`, 'info');
        
        const header = this.loadSkill(skillName);
        if (!header) {
            this.log(`  ✗ 技能文件不存在`, 'error');
            return { success: false, error: 'SKILL_NOT_FOUND' };
        }
        
        // 1. 解析Header元数据
        this.log(`  ├─ Layer: ${header.layer}`, 'info');
        this.log(`  ├─ Dependencies: ${JSON.stringify(header.dependencies || [])}`, 'info');
        this.log(`  ├─ Version: ${header.version}`, 'info');
        
        // 2. 验证前置条件
        const preValidation = ExecutionValidator.validatePreconditions(header, this.state);
        if (!preValidation.valid) {
            this.log(`  ✗ 前置条件验证失败:`, 'error');
            preValidation.errors.forEach(e => this.log(`    - ${e}`, 'error'));
            
            // 触发回滚决策
            const rollback = RollbackDecider.analyze(
                { code: 'DEPENDENCY_NOT_MET', message: preValidation.errors.join(', ') },
                { currentCheckpoint: this.state.checkpoints[this.state.checkpoints.length - 1] }
            );
            this.log(`  ↩ 回滚决策: ${rollback.action} -> ${rollback.target}`, 'warning');
            
            return { success: false, rollback };
        }
        this.log(`  ✓ 前置条件验证通过`, 'success');
        
        // 3. 验证输入契约
        const contractValidation = ExecutionValidator.validateContract(header, input, {});
        if (!contractValidation.valid) {
            this.log(`  ✗ 输入契约验证失败:`, 'error');
            contractValidation.errors.forEach(e => this.log(`    - ${e}`, 'error'));
            return { success: false, error: 'CONTRACT_VIOLATION' };
        }
        this.log(`  ✓ 输入契约验证通过`, 'success');
        
        // 4. 创建检查点
        const checkpointName = `CP_${skillName}_${Date.now()}`;
        this.state.addCheckpoint(checkpointName, { skill: skillName, input });
        this.log(`  ✓ 检查点已创建: ${checkpointName}`, 'checkpoint');
        
        // 5. 模拟执行
        this.log(`  ⟳ 执行中...`, 'info');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 6. 质量验证
        const deliverables = {
            files: [`${skillName}_output.md`],
            content: '模拟输出内容，长度超过100字符以确保通过LEVEL_2验证...',
            evidence: ['test_evidence_1.txt', 'screenshot.png']
        };
        
        const qualityResult = QualityValidator.validate(header, deliverables);
        if (qualityResult.passed) {
            this.log(`  ✓ 质量验证通过`, 'success');
            qualityResult.levels.forEach(l => {
                this.log(`    - ${l.level}: ${l.passed ? '✓' : '✗'} (${l.checks.join(', ')})`, 'info');
            });
        } else {
            this.log(`  ✗ 质量验证失败`, 'error');
        }
        
        // 7. 标记完成
        this.state.completeSkill(skillName);
        this.log(`  ✓ 技能执行完成`, 'success');
        
        return { success: true, qualityResult };
    }
    
    async validateBlockingPoint(bpId) {
        this.log(`\n⬡ 验证阻塞点: ${bpId}`, 'checkpoint');
        
        const result = BlockingPointValidator.validate(bpId, this.state);
        const bp = BlockingPointValidator.BLOCKING_POINTS[bpId];
        
        this.log(`  ├─ 名称: ${bp.name}`, 'info');
        this.log(`  ├─ 阶段: Phase ${bp.phase || 'N/A'}`, 'info');
        this.log(`  ├─ 必需技能: ${JSON.stringify(bp.requiredSkills)}`, 'info');
        
        if (result.passed) {
            this.log(`  ✓ 阻塞点通过`, 'success');
            this.state.addBlockingPoint(bpId, 'PASSED', '所有条件满足');
        } else {
            this.log(`  ✗ 阻塞点阻塞`, 'warning');
            this.log(`    缺少技能: ${result.missingSkills.join(', ')}`, 'warning');
            this.state.addBlockingPoint(bpId, 'BLOCKED', `缺少: ${result.missingSkills.join(', ')}`);
        }
        
        return result;
    }
    
    async runPhase0() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 0: 引擎初始化', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 0;
        this.state.currentStage = 'ENGINE_INIT';
        
        // 执行引擎初始化技能
        await this.executeSkill('fullstack-engine-init', {
            projectType: 'RPG',
            engineVersion: '2.0'
        });
        
        // 验证阻塞点 BP-001
        await this.validateBlockingPoint('BP-001');
    }
    
    async runPhase1() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 1: 需求澄清', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 1;
        this.state.currentStage = 'REQUIREMENT_CLARIFICATION';
        
        // 执行需求规范化技能
        await this.executeSkill('requirement-normalizer', {
            rawRequirement: '制作一个RPG游戏',
            platform: 'Mobile'
        });
        
        // 验证阻塞点 BP-002
        await this.validateBlockingPoint('BP-002');
    }
    
    async runPhase2() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 2: 人员分配', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 2;
        this.state.currentStage = 'HR_ALLOCATION';
        
        // 执行HR管理技能
        await this.executeSkill('hr-manager', {
            projectType: 'RPG',
            teamSize: 10
        });
        
        // 验证阻塞点 BP-003
        await this.validateBlockingPoint('BP-003');
    }
    
    async runPhase3() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 3: 流程建立', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 3;
        this.state.currentStage = 'FLOW_ESTABLISHMENT';
        
        // 执行流程策略技能
        await this.executeSkill('flow-strategy', {
            projectType: 'RPG',
            strategy: 'AGILE'
        });
        
        // 执行事件总线技能
        await this.executeSkill('event-bus', {
            channels: ['design', 'programming', 'qa']
        });
        
        // 验证阻塞点 BP-004
        await this.validateBlockingPoint('BP-004');
    }
    
    async runPhase4() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 4: 正式开发', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 4;
        
        // 子阶段: 设计
        this.log('\n--- 子阶段: 设计 ---', 'phase');
        this.state.currentStage = 'DESIGN';
        await this.validateBlockingPoint('BP-005');
        
        await this.executeSkill('game-lead-designer', {
            gameType: 'RPG',
            features: ['战斗系统', '任务系统', '装备系统']
        });
        
        await this.validateBlockingPoint('BP-006');
        
        // 子阶段: 编程
        this.log('\n--- 子阶段: 编程 ---', 'phase');
        this.state.currentStage = 'PROGRAMMING';
        await this.validateBlockingPoint('BP-007');
        
        // 并行执行客户端和服务端编程
        this.log('\n⟫ 并行执行客户端和服务端编程...', 'info');
        await Promise.all([
            this.executeSkill('client-programmer-leader', { module: 'Combat' }),
            this.executeSkill('serve-programmer-leader', { module: 'Matchmaking' })
        ]);
        
        await this.validateBlockingPoint('BP-008');
        await this.validateBlockingPoint('BP-009');
        
        // 子阶段: 验收
        this.log('\n--- 子阶段: 验收 ---', 'phase');
        this.state.currentStage = 'ACCEPTANCE';
        await this.validateBlockingPoint('BP-010');
        
        await this.executeSkill('game-requirement-verifier', {
            requirements: ['战斗系统', '任务系统'],
            implementation: '完成'
        });
        
        await this.validateBlockingPoint('BP-011');
        
        // 子阶段: QA测试
        this.log('\n--- 子阶段: QA测试 ---', 'phase');
        this.state.currentStage = 'QA_TESTING';
        await this.validateBlockingPoint('BP-012');
        
        await this.executeSkill('qa-standards-manager', {
            testTypes: ['FT', 'VT', 'RT'],
            coverage: 80
        });
        
        await this.validateBlockingPoint('BP-013');
    }
    
    async runPhase5() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('Phase 5: 项目经验总结', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.state.currentPhase = 5;
        this.state.currentStage = 'SUMMARY';
        
        await this.executeSkill('project-experience-summarizer', {
            projectDuration: '6个月',
            teamSize: 10
        });
        
        await this.validateBlockingPoint('BP-014');
    }
    
    printSummary() {
        this.log('\n' + '='.repeat(60), 'phase');
        this.log('流程执行总结', 'phase');
        this.log('='.repeat(60), 'phase');
        
        this.log(`\n📊 统计信息:`, 'info');
        this.log(`  ├─ 已完成技能: ${this.state.completedSkills.length}`, 'info');
        this.log(`  ├─ 检查点数量: ${this.state.checkpoints.length}`, 'info');
        this.log(`  ├─ 阻塞点状态: ${this.state.blockingPoints.length}`, 'info');
        this.log(`  └─ 错误数量: ${this.state.errors.length}`, 'info');
        
        this.log(`\n✓ 已完成技能列表:`, 'success');
        this.state.completedSkills.forEach((s, i) => {
            this.log(`  ${i + 1}. ${s}`, 'success');
        });
        
        this.log(`\n⬡ 阻塞点通过情况:`, 'checkpoint');
        const passed = this.state.blockingPoints.filter(bp => bp.status === 'PASSED').length;
        const blocked = this.state.blockingPoints.filter(bp => bp.status === 'BLOCKED').length;
        this.log(`  ├─ 通过: ${passed}`, 'success');
        this.log(`  └─ 阻塞: ${blocked}`, blocked > 0 ? 'warning' : 'success');
        
        this.log(`\n🎯 Header元数据框架生效点:`, 'info');
        this.log(`  1. 技能执行前: 解析Header获取Layer和Dependencies`, 'info');
        this.log(`  2. 前置验证: 检查依赖是否满足，不满足则触发回滚决策`, 'info');
        this.log(`  3. 契约验证: 验证输入输出是否符合定义的契约`, 'info');
        this.log(`  4. 检查点创建: 每个技能执行前创建可回滚的检查点`, 'info');
        this.log(`  5. 质量验证: 根据verification_level执行多级质量验证`, 'info');
        this.log(`  6. 阻塞点验证: 在关键节点验证必需技能是否完成`, 'info');
    }
    
    async run() {
        this.log('\n╔══════════════════════════════════════════════════════════╗', 'phase');
        this.log('║     全栈游戏开发流程 - Header元数据框架集成演示         ║', 'phase');
        this.log('╚══════════════════════════════════════════════════════════╝', 'phase');
        
        try {
            await this.runPhase0();
            await this.runPhase1();
            await this.runPhase2();
            await this.runPhase3();
            await this.runPhase4();
            await this.runPhase5();
            
            // 最终阻塞点验证
            await this.validateBlockingPoint('BP-015');
            
            this.printSummary();
            
        } catch (error) {
            this.log(`\n✗ 流程执行错误: ${error.message}`, 'error');
        }
    }
}

// 运行演示
const demo = new FullstackFlowDemo();
demo.run();
