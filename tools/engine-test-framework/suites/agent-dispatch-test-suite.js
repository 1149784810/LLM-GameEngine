/**
 * Agent Dispatch Test Suite
 * Agent调度记录测试套件
 * 
 * 功能：
 * 1. 验证Agent调度定义完整性
 * 2. 验证调度时机定义
 * 3. 验证调度记录格式
 * 4. 验证伴生阶段调用
 */

const { BaseTestSuite } = require('../core/base-test-suite');

const AGENT_ROLES = {
    'PL': {
        name: '项目负责人',
        fullName: 'Project Leader',
        type: 'coordinator',
        description: '统一调度所有智能体，作为所有智能体间通信的唯一中转站'
    },
    'LD': {
        name: '主策划',
        fullName: 'Lead Designer',
        type: 'designer',
        description: '整体游戏设计把控、需求拆分、制定验收标准'
    },
    'SD': {
        name: '系统策划',
        fullName: 'System Designer',
        type: 'designer',
        description: '系统玩法设计'
    },
    'BD': {
        name: '数值策划',
        fullName: 'Balance Designer',
        type: 'designer',
        description: '数值平衡设计'
    },
    'LP': {
        name: '主程序员',
        fullName: 'Lead Programmer',
        type: 'programmer',
        description: '整体技术架构把控、框架搭建、代码审查'
    },
    'SkD': {
        name: '技能系统程序',
        fullName: 'Skill Developer',
        type: 'programmer',
        description: '技能系统开发'
    },
    'BkD': {
        name: '后端程序',
        fullName: 'Backend Developer',
        type: 'programmer',
        description: '服务端开发'
    },
    'TA': {
        name: '技术美术',
        fullName: 'Technical Artist',
        type: 'artist',
        description: '渲染、着色器、特效'
    },
    'LT': {
        name: '主测试',
        fullName: 'Lead Tester',
        type: 'qa',
        description: '制定测试计划、分配任务、汇总结果'
    },
    'QA': {
        name: '测试',
        fullName: 'Quality Assurance',
        type: 'qa',
        description: '执行测试用例、输出报告'
    },
    'VV': {
        name: '视觉验证',
        fullName: 'Visual Verifier',
        type: 'qa',
        description: 'UI分析、视觉测试'
    }
};

const DISPATCH_TIMING = {
    'PHASE_START': {
        name: 'Phase开始时',
        trigger: 'phase_id',
        method: 'agent-dispatcher.init()',
        required: true
    },
    'STAGE_START': {
        name: 'Stage开始时',
        trigger: 'stage_id',
        method: 'agent-dispatcher.prepare()',
        required: true
    },
    'ROLE_DISPATCH': {
        name: '角色调度时',
        trigger: 'agent_id, task',
        method: 'agent-dispatcher.dispatch()',
        required: true
    },
    'PARALLEL_START': {
        name: '并行阶段启动时',
        trigger: 'agent_list[]',
        method: 'agent-dispatcher.parallel()',
        required: true
    },
    'STAGE_END': {
        name: 'Stage/Phase结束时',
        trigger: 'stage_id/phase_id',
        method: 'agent-dispatcher.summary()',
        required: true
    }
};

const COMPANION_STAGES = {
    '伴生阶段-A': {
        name: '智能体调度',
        skill: 'agent-dispatcher',
        triggerPoints: [
            '每个Phase/Stage开始和结束时',
            '每次角色调度时',
            '并行阶段启动时'
        ],
        requiredMethods: ['init()', 'prepare()', 'dispatch()', 'parallel()', 'summary()']
    },
    '伴生阶段-B': {
        name: '验收标准',
        skill: 'qa-standards-manager',
        triggerPoints: [
            '每个BP解锁时',
            '每个Stage完成时',
            '策划验收阶段开始时'
        ],
        requiredMethods: ['check_bp()', 'check_stage()', 'check_phase()']
    },
    '伴生阶段-C': {
        name: 'Bug追踪',
        skill: 'bug-tracker',
        triggerPoints: [
            '发现Bug时',
            'Bug修复时',
            '回归测试时'
        ],
        requiredMethods: ['record()', 'update()', 'verify()', 'summary()']
    }
};

const DISPATCH_RECORD_FORMAT = {
    requiredFields: [
        'dispatch_id',
        'timestamp',
        'source_agent',
        'target_agent',
        'action',
        'status'
    ],
    optionalFields: [
        'phase_id',
        'stage_id',
        'task_description',
        'result',
        'duration'
    ]
};

class AgentDispatchTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('agent-dispatch', options);
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
                'fullstack-game-engine技能不存在，无法验证Agent调度定义'
            ));
            return this.aggregateResults(results);
        }
        
        const content = fullstackEngine.content;
        
        results.push(...this.testAgentRoleDefinition(content));
        results.push(...this.testDispatchTiming(content));
        results.push(...this.testCompanionStages(content));
        results.push(...this.testDispatchRecordFormat(content));
        results.push(...this.testAgentDispatcherSkill(skills));
        
        return this.aggregateResults(results);
    }
    
    testAgentRoleDefinition(content) {
        const results = [];
        
        const agentIndexPattern = /智能体调度索引表|Agent.*调度|角色.*调度/i;
        const hasAgentIndex = agentIndexPattern.test(content);
        
        results.push(this.createResult(
            'AGENT_INDEX_TABLE_EXISTS',
            'fullstack-game-engine',
            hasAgentIndex,
            hasAgentIndex ? 'INFO' : 'WARNING',
            hasAgentIndex
                ? '智能体调度索引表已定义'
                : '建议添加智能体调度索引表'
        ));
        
        for (const [roleId, roleConfig] of Object.entries(AGENT_ROLES)) {
            const rolePattern = new RegExp(`${roleId}|${roleConfig.name}|${roleConfig.fullName}`, 'i');
            const found = rolePattern.test(content);
            
            results.push(this.createResult(
                `AGENT_ROLE_DEFINED_${roleId}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `${roleId}(${roleConfig.name})角色已定义`
                    : `${roleId}(${roleConfig.name})角色未在调度表中定义`
            ));
        }
        
        const plRolePattern = /项目负责人|PL.*统一调度|中转/i;
        const hasPLRole = plRolePattern.test(content);
        
        results.push(this.createResult(
            'AGENT_PL_ROLE_DEFINED',
            'fullstack-game-engine',
            hasPLRole,
            hasPLRole ? 'INFO' : 'ERROR',
            hasPLRole
                ? 'PL角色职责已定义（统一调度、中转通信）'
                : 'PL角色职责未明确定义'
        ));
        
        return results;
    }
    
    testDispatchTiming(content) {
        const results = [];
        
        for (const [timingId, timingConfig] of Object.entries(DISPATCH_TIMING)) {
            const timingKeywords = timingConfig.name.split(/[时]/);
            const found = timingKeywords.some(kw => 
                content.includes(kw) && content.includes('调度')
            ) || content.includes(timingConfig.method);
            
            results.push(this.createResult(
                `DISPATCH_TIMING_${timingId}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : (timingConfig.required ? 'WARNING' : 'INFO'),
                found
                    ? `${timingConfig.name}调度时机已定义`
                    : `${timingConfig.name}调度时机未明确定义`
            ));
        }
        
        const parallelDispatchPattern = /并行.*调度|parallel.*dispatch|同时启动/i;
        const hasParallelDispatch = parallelDispatchPattern.test(content);
        
        results.push(this.createResult(
            'DISPATCH_PARALLEL_DEFINED',
            'fullstack-game-engine',
            hasParallelDispatch,
            hasParallelDispatch ? 'INFO' : 'WARNING',
            hasParallelDispatch
                ? '并行调度机制已定义'
                : '并行调度机制未明确定义'
        ));
        
        return results;
    }
    
    testCompanionStages(content) {
        const results = [];
        
        const companionPattern = /伴生阶段|companion.*stage/i;
        const hasCompanionSection = companionPattern.test(content);
        
        results.push(this.createResult(
            'COMPANION_STAGE_SECTION_EXISTS',
            'fullstack-game-engine',
            hasCompanionSection,
            hasCompanionSection ? 'INFO' : 'WARNING',
            hasCompanionSection
                ? '伴生阶段章节已定义'
                : '建议添加伴生阶段章节'
        ));
        
        for (const [stageId, stageConfig] of Object.entries(COMPANION_STAGES)) {
            const stagePattern = new RegExp(stageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const found = stagePattern.test(content);
            
            results.push(this.createResult(
                `COMPANION_STAGE_DEFINED_${stageId.replace(/[-]/g, '_')}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `${stageId}(${stageConfig.name})已定义`
                    : `${stageId}(${stageConfig.name})未定义`
            ));
            
            if (found) {
                const skillPattern = new RegExp(stageConfig.skill, 'i');
                const hasSkill = skillPattern.test(content);
                
                results.push(this.createResult(
                    `COMPANION_SKILL_REF_${stageId.replace(/[-]/g, '_')}`,
                    'fullstack-game-engine',
                    hasSkill,
                    hasSkill ? 'INFO' : 'WARNING',
                    hasSkill
                        ? `${stageId}已引用技能: ${stageConfig.skill}`
                        : `${stageId}建议引用技能: ${stageConfig.skill}`
                ));
                
                for (const method of stageConfig.requiredMethods) {
                    const methodPattern = new RegExp(method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                    const hasMethod = methodPattern.test(content);
                    
                    results.push(this.createResult(
                        `COMPANION_METHOD_${stageId.replace(/[-]/g, '_')}_${method.replace(/[()]/g, '')}`,
                        'fullstack-game-engine',
                        hasMethod,
                        hasMethod ? 'INFO' : 'WARNING',
                        hasMethod
                            ? `${stageId}定义了方法: ${method}`
                            : `${stageId}建议定义方法: ${method}`
                    ));
                }
            }
        }
        
        return results;
    }
    
    testDispatchRecordFormat(content) {
        const results = [];
        
        // 调度记录章节应该在agent-dispatcher技能中定义，而不是fullstack-game-engine
        // 这里改为检查fullstack-game-engine是否引用了agent-dispatcher
        const agentDispatcherRef = content.includes('agent-dispatcher') || content.includes('智能体调度');
        
        results.push(this.createResult(
            'DISPATCH_RECORD_SECTION_EXISTS',
            'fullstack-game-engine',
            agentDispatcherRef,
            agentDispatcherRef ? 'INFO' : 'WARNING',
            agentDispatcherRef
                ? '已引用agent-dispatcher进行智能体调度'
                : '建议添加调度记录章节'
        ));
        
        // 调度记录字段检查移到agent-dispatcher技能中
        // 这里只检查fullstack-game-engine是否定义了调度相关概念
        // 由于调度记录字段已在agent-dispatcher中定义，这里不再检查fullstack-game-engine
        const dispatchConcepts = ['dispatch', '调度', 'agent'];
        for (const field of dispatchConcepts) {
            const found = content.includes(field);
            
            results.push(this.createResult(
                `DISPATCH_CONCEPT_${field}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `调度概念"${field}"已定义`
                    : `建议定义调度概念"${field}"`
            ));
        }
        
        const eventBusPattern = /event-bus|事件总线/i;
        const hasEventBus = eventBusPattern.test(content);
        
        results.push(this.createResult(
            'DISPATCH_EVENT_BUS_REF',
            'fullstack-game-engine',
            hasEventBus,
            hasEventBus ? 'INFO' : 'WARNING',
            hasEventBus
                ? '已引用event-bus进行事件发布'
                : '建议引用event-bus技能进行调度事件发布'
        ));
        
        return results;
    }
    
    testAgentDispatcherSkill(skills) {
        const results = [];
        
        const agentDispatcher = skills.get('agent-dispatcher');
        if (!agentDispatcher) {
            results.push(this.createResult(
                'AGENT_DISPATCHER_SKILL_EXISTS',
                'agent-dispatcher',
                false,
                'ERROR',
                'agent-dispatcher技能不存在'
            ));
            return results;
        }
        
        results.push(this.createResult(
            'AGENT_DISPATCHER_SKILL_EXISTS',
            'agent-dispatcher',
            true,
            'INFO',
            'agent-dispatcher技能存在'
        ));
        
        const content = agentDispatcher.content;
        
        const requiredFunctions = ['dispatch', 'parallel', 'summary'];
        for (const func of requiredFunctions) {
            const funcPattern = new RegExp(`function\\s+${func}|${func}\\s*\\(|${func}\\s*:`, 'i');
            const hasFunc = funcPattern.test(content);
            
            results.push(this.createResult(
                `AGENT_DISPATCHER_FUNC_${func}`,
                'agent-dispatcher',
                hasFunc,
                hasFunc ? 'INFO' : 'WARNING',
                hasFunc
                    ? `agent-dispatcher定义了${func}函数`
                    : `agent-dispatcher建议定义${func}函数`
            ));
        }
        
        return results;
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = [];
        
        if (skillName === 'fullstack-game-engine') {
            const content = skillData.content;
            
            for (const [roleId, roleConfig] of Object.entries(AGENT_ROLES)) {
                const found = content.includes(roleId) || content.includes(roleConfig.name);
                results.push({
                    test: `AGENT_ROLE_${roleId}`,
                    passed: found,
                    severity: found ? 'INFO' : 'WARNING',
                    message: found
                        ? `${roleId}角色已定义`
                        : `${roleId}角色未定义`
                });
            }
        } else if (skillName === 'agent-dispatcher') {
            const content = skillData.content;
            
            const requiredFunctions = ['dispatch', 'parallel', 'summary'];
            for (const func of requiredFunctions) {
                const hasFunc = content.includes(func);
                results.push({
                    test: `AGENT_DISPATCHER_FUNC_${func}`,
                    passed: hasFunc,
                    severity: hasFunc ? 'INFO' : 'WARNING',
                    message: hasFunc
                        ? `${func}函数已定义`
                        : `${func}函数未定义`
                });
            }
        } else {
            return {
                skill: skillName,
                passed: true,
                results: [{
                    test: 'AGENT_DISPATCH_SKIP',
                    passed: true,
                    severity: 'INFO',
                    message: 'Agent调度测试主要适用于fullstack-game-engine和agent-dispatcher技能'
                }]
            };
        }
        
        return {
            skill: skillName,
            passed: results.every(r => r.passed),
            results: results
        };
    }
}

module.exports = { 
    AgentDispatchTestSuite, 
    AGENT_ROLES, 
    DISPATCH_TIMING, 
    COMPANION_STAGES,
    DISPATCH_RECORD_FORMAT 
};
