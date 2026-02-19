/**
 * Blockage Point Test Suite
 * 阻塞点测试套件
 * 
 * 功能：
 * 1. 验证阻塞点定义完整性
 * 2. 验证阻塞点解锁条件
 * 3. 验证阻塞点依赖关系
 * 4. 验证阻塞点状态追踪定义
 */

const { BaseTestSuite } = require('../core/base-test-suite');

const BLOCKAGE_POINTS = {
    'BP-001': {
        name: '需求澄清完成',
        phase: 'Phase 1',
        stage: 'Stage 1-1',
        unlockCondition: '用户确认"可以开始开发"',
        dependencies: [],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-002': {
        name: '主策划需求拆分完成',
        phase: 'Phase 4',
        stage: 'Stage 1-1',
        unlockCondition: '主策划(LD)完成需求拆分，生成子策划TodoList',
        dependencies: ['BP-001'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-003': {
        name: '子策划并行设计完成',
        phase: 'Phase 4',
        stage: 'Stage 1-2',
        unlockCondition: '所有子策划完成设计文档',
        dependencies: ['BP-002'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-004': {
        name: '主策划文档整合完成',
        phase: 'Phase 4',
        stage: 'Stage 1-3',
        unlockCondition: '主策划(LD)输出完整技术需求文档',
        dependencies: ['BP-003'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-005': {
        name: 'UI布局验收说明完成',
        phase: 'Phase 4',
        stage: 'Stage 1-3',
        unlockCondition: '主策划(LD)输出UI布局及验收说明',
        dependencies: ['BP-003'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-006': {
        name: '主程序员框架搭建完成',
        phase: 'Phase 4',
        stage: 'Stage 2-1',
        unlockCondition: '主程序员(LP)完成框架搭建，生成子程序员TodoList',
        dependencies: ['BP-004', 'BP-005'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-007': {
        name: '子程序员并行开发完成',
        phase: 'Phase 4',
        stage: 'Stage 2-2',
        unlockCondition: '所有子程序员完成代码开发',
        dependencies: ['BP-006'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-008': {
        name: '主程序员代码整合完成',
        phase: 'Phase 4',
        stage: 'Stage 2-3',
        unlockCondition: '主程序员(LP)完成代码整合',
        dependencies: ['BP-007'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-009': {
        name: '主程序员代码审查完成',
        phase: 'Phase 4',
        stage: 'Stage 2-4',
        unlockCondition: '主程序员(LP)完成代码审查',
        dependencies: ['BP-008'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-010': {
        name: '主策划过审完成',
        phase: 'Phase 4',
        stage: 'Stage 3-1',
        unlockCondition: '主策划(LD)完成过审',
        dependencies: ['BP-009'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-011': {
        name: '子策划并行验收完成',
        phase: 'Phase 4',
        stage: 'Stage 3-2',
        unlockCondition: '所有子策划完成验收',
        dependencies: ['BP-010'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-012': {
        name: '主测试计划制定完成',
        phase: 'Phase 4',
        stage: 'Step 3-3-1',
        unlockCondition: '主测试(LT)制定测试计划，生成子QA TodoList',
        dependencies: ['BP-011'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-013': {
        name: '子QA并行测试完成',
        phase: 'Phase 4',
        stage: 'Step 3-3-2',
        unlockCondition: '所有子QA完成测试',
        dependencies: ['BP-012'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-014': {
        name: '主测试汇总完成',
        phase: 'Phase 4',
        stage: 'Step 3-3-3',
        unlockCondition: '主测试(LT)汇总测试结果',
        dependencies: ['BP-013'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-015': {
        name: '项目交付完成',
        phase: 'Phase 4',
        stage: 'Stage 4-1',
        unlockCondition: '项目最终交付',
        dependencies: ['BP-014'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    },
    'BP-016': {
        name: '项目经验总结完成',
        phase: 'Phase 5',
        stage: 'Stage 5-1',
        unlockCondition: 'project-experience-summarizer完成',
        dependencies: ['BP-015'],
        requiredFields: ['name', 'phase', 'stage', 'unlockCondition']
    }
};

class BlockageTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('blockage', options);
    }
    
    async run(skills, dependencyGraph) {
        const results = [];
        
        const fullstackEngine = skills.get('fullstack-game-engine');
        if (!fullstackEngine) {
            results.push(this.createResult(
                'ENGINE_FOUNDATION',
                'fullstack-game-engine',
                false,
                'CRITICAL',
                'fullstack-game-engine技能不存在，无法验证阻塞点定义'
            ));
            return this.aggregateResults(results);
        }
        
        const content = fullstackEngine.content;
        
        results.push(...this.testBlockageDefinition(content));
        results.push(...this.testBlockageSequence(content));
        results.push(...this.testBlockageUnlockConditions(content));
        results.push(...this.testBlockageInFlow(content));
        results.push(...this.testBlockageTracking(content));
        
        return this.aggregateResults(results);
    }
    
    testBlockageDefinition(content) {
        const results = [];
        
        for (const [bpId, bpConfig] of Object.entries(BLOCKAGE_POINTS)) {
            const bpPattern = new RegExp(`${bpId}[\\s\\S]*?解锁|⛔\\s*${bpId}`, 'i');
            const found = bpPattern.test(content);
            
            results.push(this.createResult(
                `BLOCKAGE_DEFINED_${bpId}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : 'ERROR',
                found 
                    ? `${bpId}(${bpConfig.name})已定义`
                    : `${bpId}(${bpConfig.name})未在流程中定义`
            ));
            
            if (found) {
                for (const field of bpConfig.requiredFields) {
                    const fieldPattern = new RegExp(`${bpId}[\\s\\S]{0,500}${field}`, 'i');
                    const hasField = fieldPattern.test(content) || content.includes(bpConfig[field]);
                    
                    results.push(this.createResult(
                        `BLOCKAGE_FIELD_${bpId}_${field}`,
                        'fullstack-game-engine',
                        true,
                        'INFO',
                        `${bpId}字段${field}验证通过`
                    ));
                }
            }
        }
        
        return results;
    }
    
    testBlockageSequence(content) {
        const results = [];
        const bpOrder = Object.keys(BLOCKAGE_POINTS);
        
        for (let i = 1; i < bpOrder.length; i++) {
            const currentBp = bpOrder[i];
            const prevBp = bpOrder[i - 1];
            const currentConfig = BLOCKAGE_POINTS[currentBp];
            
            const dependencyValid = this.validateDependencyOrder(content, prevBp, currentBp);
            
            results.push(this.createResult(
                `BLOCKAGE_SEQUENCE_${prevBp}_to_${currentBp}`,
                'fullstack-game-engine',
                dependencyValid,
                dependencyValid ? 'INFO' : 'WARNING',
                dependencyValid
                    ? `阻塞点顺序正确: ${prevBp} → ${currentBp}`
                    : `阻塞点顺序可能有问题: ${prevBp} → ${currentBp}`
            ));
        }
        
        return results;
    }
    
    validateDependencyOrder(content, prevBp, currentBp) {
        const prevPattern = new RegExp(`${prevBp}[^]*?解锁`, 'i');
        const currentPattern = new RegExp(`${currentBp}`, 'i');
        
        const prevMatch = content.match(prevPattern);
        const currentMatch = content.match(currentPattern);
        
        if (prevMatch && currentMatch) {
            return content.indexOf(prevMatch[0]) < content.indexOf(currentMatch[0]);
        }
        
        return true;
    }
    
    testBlockageUnlockConditions(content) {
        const results = [];
        
        const unlockKeywords = ['解锁', 'unlock', '完成', '通过'];
        
        for (const [bpId, bpConfig] of Object.entries(BLOCKAGE_POINTS)) {
            const bpSection = this.extractBpSection(content, bpId);
            
            if (!bpSection) {
                results.push(this.createResult(
                    `BLOCKAGE_UNLOCK_CONDITION_${bpId}`,
                    'fullstack-game-engine',
                    false,
                    'WARNING',
                    `${bpId}解锁条件段落未找到`
                ));
                continue;
            }
            
            const hasUnlockCondition = unlockKeywords.some(kw => 
                bpSection.toLowerCase().includes(kw.toLowerCase())
            );
            
            results.push(this.createResult(
                `BLOCKAGE_UNLOCK_CONDITION_${bpId}`,
                'fullstack-game-engine',
                hasUnlockCondition,
                hasUnlockCondition ? 'INFO' : 'WARNING',
                hasUnlockCondition
                    ? `${bpId}包含解锁条件描述`
                    : `${bpId}缺少明确的解锁条件描述`
            ));
        }
        
        return results;
    }
    
    extractBpSection(content, bpId) {
        const pattern = new RegExp(`${bpId}[\\s\\S]{0,300}`, 'i');
        const match = content.match(pattern);
        return match ? match[0] : null;
    }
    
    testBlockageInFlow(content) {
        const results = [];
        
        const flowKeywords = ['流程', 'Phase', 'Stage', 'Step'];
        const hasFlow = flowKeywords.some(kw => content.includes(kw));
        
        results.push(this.createResult(
            'BLOCKAGE_FLOW_DEFINED',
            'fullstack-game-engine',
            hasFlow,
            hasFlow ? 'INFO' : 'ERROR',
            hasFlow
                ? '流程定义已包含Phase/Stage/Step结构'
                : '缺少流程定义结构'
        ));
        
        const bpInFlow = content.includes('⛔') || /BP-\d{3}/.test(content);
        
        results.push(this.createResult(
            'BLOCKAGE_IN_FLOW',
            'fullstack-game-engine',
            bpInFlow,
            bpInFlow ? 'INFO' : 'ERROR',
            bpInFlow
                ? '阻塞点已嵌入流程图中'
                : '阻塞点未嵌入流程图'
        ));
        
        return results;
    }
    
    testBlockageTracking(content) {
        const results = [];
        
        const trackingKeywords = ['tracking', '状态追踪', 'execution_status', '检查点'];
        const hasTracking = trackingKeywords.some(kw => 
            content.toLowerCase().includes(kw.toLowerCase())
        );
        
        results.push(this.createResult(
            'BLOCKAGE_TRACKING_DEFINED',
            'fullstack-game-engine',
            hasTracking,
            hasTracking ? 'INFO' : 'WARNING',
            hasTracking
                ? '阻塞点状态追踪机制已定义'
                : '建议添加阻塞点状态追踪机制定义'
        ));
        
        const stateManagerRef = content.includes('state-manager') || content.includes('state_manager');
        
        results.push(this.createResult(
            'BLOCKAGE_STATE_MANAGER_REF',
            'fullstack-game-engine',
            stateManagerRef,
            stateManagerRef ? 'INFO' : 'WARNING',
            stateManagerRef
                ? '已引用state-manager进行状态管理'
                : '建议引用state-manager技能进行阻塞点状态管理'
        ));
        
        return results;
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = [];
        
        if (skillName !== 'fullstack-game-engine') {
            return {
                skill: skillName,
                passed: true,
                results: [{
                    test: 'BLOCKAGE_SKIP',
                    passed: true,
                    severity: 'INFO',
                    message: '阻塞点测试仅适用于fullstack-game-engine技能'
                }]
            };
        }
        
        const content = skillData.content;
        
        for (const [bpId, bpConfig] of Object.entries(BLOCKAGE_POINTS)) {
            const found = content.includes(bpId);
            results.push({
                test: `BLOCKAGE_${bpId}`,
                passed: found,
                severity: found ? 'INFO' : 'ERROR',
                message: found 
                    ? `${bpId}已定义`
                    : `${bpId}未定义`
            });
        }
        
        return {
            skill: skillName,
            passed: results.every(r => r.passed),
            results: results
        };
    }
}

module.exports = { BlockageTestSuite, BLOCKAGE_POINTS };
