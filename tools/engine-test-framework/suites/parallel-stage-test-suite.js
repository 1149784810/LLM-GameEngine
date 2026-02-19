/**
 * Parallel Stage Test Suite
 * 并行阶段测试套件
 * 
 * 功能：
 * 1. 验证并行阶段定义完整性
 * 2. 验证并行角色数量要求
 * 3. 验证应上尽上原则
 * 4. 验证任务粒度要求
 */

const { BaseTestSuite } = require('../core/base-test-suite');

const PARALLEL_STAGES = {
    'Stage 1-2': {
        name: '子策划并行细化',
        phase: 'Phase 4',
        description: 'PL并行调度所有子策划（15人同时启动，禁止选择性启动）',
        minParallelCount: 5,
        targetParallelCount: 15,
        roles: [
            '系统策划-玩法(SD-1)', '系统策划-规则(SD-2)', 'UI策划(UID)',
            '数值策划-经济(BD-1)', '数值策划-战斗(BD-2)',
            '关卡策划-设计(LvD-1)', '关卡策划-地图(LvD-2)',
            '战斗策划-机制(CD-1)', '战斗策划-敌人(CD-2)',
            '3C策划-相机(3CD-1)', '3C策划-角色(3CD-2)',
            '文案策划-剧情(ND-1)', '文案策划-对话(ND-2)',
            '新手教程策划(TD)', '音频策划(AD)'
        ],
        requiredKeywords: ['并行', '同时启动', '禁止选择性启动'],
        taskGranularity: '每人负责1-2个小模块'
    },
    'Stage 2-2': {
        name: '子程序员并行开发',
        phase: 'Phase 4',
        description: 'PL并行调度所有子程序员（14人同时启动，禁止选择性启动）',
        minParallelCount: 5,
        targetParallelCount: 14,
        roles: [
            '技能系统程序-SkD-1', '技能系统程序-SkD-2',
            '后端程序-BkD-1', '后端程序-BkD-2',
            '技术美术-TA-1', '技术美术-TA-2',
            '3C程序-3CP-1', '3C程序-3CP-2',
            '关卡程序-LvP-1', '关卡程序-LvP-2',
            '前端程序-UIP-1', '前端程序-UIP-2',
            '新手教程程序(TDP)', '音频程序(AP)'
        ],
        requiredKeywords: ['并行', '同时启动', '禁止选择性启动'],
        taskGranularity: '每人负责1-2个小模块'
    },
    'Stage 3-2': {
        name: '子策划并行验收',
        phase: 'Phase 4',
        description: 'PL并行调度所有子策划（14人同时启动）',
        minParallelCount: 5,
        targetParallelCount: 14,
        roles: [
            '系统策划-玩法(SD-1)', '系统策划-规则(SD-2)', 'UI策划(UID)',
            '数值策划-经济(BD-1)', '数值策划-战斗(BD-2)',
            '关卡策划-设计(LvD-1)', '关卡策划-地图(LvD-2)',
            '战斗策划-机制(CD-1)', '战斗策划-敌人(CD-2)',
            '3C策划-相机(3CD-1)', '3C策划-角色(3CD-2)',
            '文案策划-剧情(ND-1)', '文案策划-对话(ND-2)',
            '新手教程策划(TD)'
        ],
        requiredKeywords: ['并行', '同时启动'],
        taskGranularity: '每人验收1-2个小模块'
    },
    'Step 3-3-2': {
        name: '子QA并行测试',
        phase: 'Phase 4',
        description: 'PL并行调度所有子QA（8人同时启动）',
        minParallelCount: 3,
        targetParallelCount: 8,
        roles: [
            '子QA-核心玩法(QA-1)', '子QA-技能系统(QA-2)', '子QA-UI系统(QA-3)',
            '子QA-关卡系统(QA-4)', '子QA-边界测试(QA-5)', '子QA-性能测试(QA-6)',
            '视觉验证-VV-1(VV-1)', '视觉验证-VV-2(VV-2)'
        ],
        requiredKeywords: ['并行', '同时启动'],
        taskGranularity: '每人最多2个测试领域'
    }
};

const PARALLEL_PRINCIPLES = {
    'MAX_PARALLEL': {
        name: '最大化并行原则',
        description: '在允许并行的阶段，必须最大化并行度',
        keywords: ['最大化并行', '应上尽上']
    },
    'ALL_ROLES_REQUIRED': {
        name: '应上尽上原则',
        description: '所有可用角色必须全上，禁止选择性启动',
        keywords: ['应上尽上', '禁止选择性启动', '全部启动']
    },
    'NO_ONE_MANY_ROLES': {
        name: '禁止一人多职',
        description: '每个角色只负责自己的专业领域',
        keywords: ['禁止一人多职', '各司其职', '专业领域']
    },
    'TASK_GRANULARITY': {
        name: '任务粒度控制',
        description: '每个角色负责1-2个模块，避免过载',
        keywords: ['1-2个模块', '任务粒度', '负载均衡']
    }
};

class ParallelStageTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('parallel', options);
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
                'fullstack-game-engine技能不存在，无法验证并行阶段定义'
            ));
            return this.aggregateResults(results);
        }
        
        const content = fullstackEngine.content;
        
        results.push(...this.testParallelStageDefinition(content));
        results.push(...this.testParallelRoleCount(content));
        results.push(...this.testParallelPrinciples(content));
        results.push(...this.testParallelTriggerCondition(content));
        results.push(...this.testParallelProhibitions(content));
        
        return this.aggregateResults(results);
    }
    
    testParallelStageDefinition(content) {
        const results = [];
        
        for (const [stageId, stageConfig] of Object.entries(PARALLEL_STAGES)) {
            const stagePattern = new RegExp(stageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const found = stagePattern.test(content);
            
            results.push(this.createResult(
                `PARALLEL_STAGE_DEFINED_${stageId.replace(/[\s-]/g, '_')}`,
                'fullstack-game-engine',
                found,
                found ? 'INFO' : 'ERROR',
                found
                    ? `${stageId}(${stageConfig.name})已定义为并行阶段`
                    : `${stageId}(${stageConfig.name})未定义为并行阶段`
            ));
            
            if (found) {
                const stageSection = this.extractStageSection(content, stageId);
                
                for (const keyword of stageConfig.requiredKeywords) {
                    const hasKeyword = stageSection && stageSection.includes(keyword);
                    
                    results.push(this.createResult(
                        `PARALLEL_KEYWORD_${stageId.replace(/[\s-]/g, '_')}_${keyword}`,
                        'fullstack-game-engine',
                        hasKeyword,
                        hasKeyword ? 'INFO' : 'WARNING',
                        hasKeyword
                            ? `${stageId}包含关键词"${keyword}"`
                            : `${stageId}缺少关键词"${keyword}"`
                    ));
                }
                
                const hasGranularity = stageSection && stageSection.includes(stageConfig.taskGranularity.split('每人')[0]);
                results.push(this.createResult(
                    `PARALLEL_GRANULARITY_${stageId.replace(/[\s-]/g, '_')}`,
                    'fullstack-game-engine',
                    hasGranularity || stageSection.includes('模块'),
                    hasGranularity ? 'INFO' : 'WARNING',
                    hasGranularity
                        ? `${stageId}定义了任务粒度要求`
                        : `${stageId}建议明确定义任务粒度要求`
                ));
            }
        }
        
        return results;
    }
    
    extractStageSection(content, stageId) {
        const pattern = new RegExp(`${stageId}[\\s\\S]{0,1000}`, 'i');
        const match = content.match(pattern);
        return match ? match[0] : '';
    }
    
    testParallelRoleCount(content) {
        const results = [];
        
        for (const [stageId, stageConfig] of Object.entries(PARALLEL_STAGES)) {
            const stageSection = this.extractStageSection(content, stageId);
            
            if (!stageSection) {
                results.push(this.createResult(
                    `PARALLEL_ROLE_COUNT_${stageId.replace(/[\s-]/g, '_')}`,
                    'fullstack-game-engine',
                    false,
                    'WARNING',
                    `${stageId}段落未找到，无法验证角色数量`
                ));
                continue;
            }
            
            const foundRoles = stageConfig.roles.filter(role => {
                const rolePattern = new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                return rolePattern.test(stageSection);
            });
            
            const roleCoverage = foundRoles.length / stageConfig.roles.length;
            const meetsMinimum = foundRoles.length >= stageConfig.minParallelCount;
            
            results.push(this.createResult(
                `PARALLEL_ROLE_COUNT_${stageId.replace(/[\s-]/g, '_')}`,
                'fullstack-game-engine',
                meetsMinimum,
                meetsMinimum ? 'INFO' : 'WARNING',
                meetsMinimum
                    ? `${stageId}定义了${foundRoles.length}/${stageConfig.roles.length}个角色（最少${stageConfig.minParallelCount}个）`
                    : `${stageId}角色数量不足: ${foundRoles.length}/${stageConfig.roles.length}（最少需要${stageConfig.minParallelCount}个）`
            ));
            
            results.push(this.createResult(
                `PARALLEL_ROLE_COVERAGE_${stageId.replace(/[\s-]/g, '_')}`,
                'fullstack-game-engine',
                roleCoverage >= 0.5,
                roleCoverage >= 0.8 ? 'INFO' : 'WARNING',
                `角色覆盖率: ${(roleCoverage * 100).toFixed(1)}%`
            ));
        }
        
        return results;
    }
    
    testParallelPrinciples(content) {
        const results = [];
        
        for (const [principleId, principleConfig] of Object.entries(PARALLEL_PRINCIPLES)) {
            const foundKeywords = principleConfig.keywords.filter(kw => 
                content.includes(kw)
            );
            
            const principleFound = foundKeywords.length > 0;
            
            results.push(this.createResult(
                `PARALLEL_PRINCIPLE_${principleId}`,
                'fullstack-game-engine',
                principleFound,
                principleFound ? 'INFO' : 'WARNING',
                principleFound
                    ? `${principleConfig.name}已定义（关键词: ${foundKeywords.join(', ')}）`
                    : `${principleConfig.name}未明确定义（建议添加: ${principleConfig.keywords.join(', ')}）`
            ));
        }
        
        const parallelSection = this.extractParallelSection(content);
        const hasMaxParallel = parallelSection.includes('最大化并行') || parallelSection.includes('应上尽上');
        
        results.push(this.createResult(
            'PARALLEL_MAXIMIZE_DEFINED',
            'fullstack-game-engine',
            hasMaxParallel,
            hasMaxParallel ? 'INFO' : 'WARNING',
            hasMaxParallel
                ? '最大化并行原则已明确定义'
                : '建议明确定义最大化并行原则'
        ));
        
        return results;
    }
    
    extractParallelSection(content) {
        const patterns = [
            /并行调度核心原则[\s\S]{0,3000}/i,
            /并行阶段定义[\s\S]{0,3000}/i,
            /最大化并行[\s\S]{0,2000}/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) return match[0];
        }
        
        return '';
    }
    
    testParallelTriggerCondition(content) {
        const results = [];
        
        const triggerPatterns = [
            { stage: 'Stage 1-2', trigger: 'BP-002', desc: 'BP-002解锁后启动' },
            { stage: 'Stage 2-2', trigger: 'BP-006', desc: 'BP-006解锁后启动' },
            { stage: 'Stage 3-2', trigger: 'BP-010', desc: 'BP-010解锁后启动' },
            { stage: 'Step 3-3-2', trigger: 'BP-012', desc: 'BP-012解锁后启动' }
        ];
        
        for (const pattern of triggerPatterns) {
            const stageSection = this.extractStageSection(content, pattern.stage);
            const hasTrigger = stageSection.includes(pattern.trigger) || 
                              content.includes(`${pattern.stage}.*${pattern.trigger}`);
            
            results.push(this.createResult(
                `PARALLEL_TRIGGER_${pattern.stage.replace(/[\s-]/g, '_')}`,
                'fullstack-game-engine',
                hasTrigger,
                hasTrigger ? 'INFO' : 'WARNING',
                hasTrigger
                    ? `${pattern.stage}触发条件已定义: ${pattern.desc}`
                    : `${pattern.stage}建议明确触发条件: ${pattern.desc}`
            ));
        }
        
        return results;
    }
    
    testParallelProhibitions(content) {
        const results = [];
        
        const prohibitions = [
            { keyword: '禁止串行等待', desc: '禁止串行等待' },
            { keyword: '禁止选择性启动', desc: '禁止选择性启动' },
            { keyword: '禁止一人多职', desc: '禁止一人多职' },
            { keyword: '禁止只启动', desc: '禁止只启动部分角色' }
        ];
        
        const parallelSection = this.extractParallelSection(content);
        
        for (const prohibition of prohibitions) {
            const hasProhibition = content.includes(prohibition.keyword);
            
            results.push(this.createResult(
                `PARALLEL_PROHIBITION_${prohibition.keyword.replace(/[\s]/g, '_')}`,
                'fullstack-game-engine',
                hasProhibition,
                hasProhibition ? 'INFO' : 'WARNING',
                hasProhibition
                    ? `已定义禁止行为: ${prohibition.desc}`
                    : `建议添加禁止行为: ${prohibition.desc}`
            ));
        }
        
        return results;
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = [];
        
        if (skillName !== 'fullstack-game-engine') {
            return {
                skill: skillName,
                passed: true,
                results: [{
                    test: 'PARALLEL_SKIP',
                    passed: true,
                    severity: 'INFO',
                    message: '并行阶段测试仅适用于fullstack-game-engine技能'
                }]
            };
        }
        
        const content = skillData.content;
        
        for (const [stageId, stageConfig] of Object.entries(PARALLEL_STAGES)) {
            const found = content.includes(stageId);
            results.push({
                test: `PARALLEL_STAGE_${stageId.replace(/[\s-]/g, '_')}`,
                passed: found,
                severity: found ? 'INFO' : 'ERROR',
                message: found
                    ? `${stageId}已定义为并行阶段`
                    : `${stageId}未定义为并行阶段`
            });
        }
        
        return {
            skill: skillName,
            passed: results.every(r => r.passed),
            results: results
        };
    }
}

module.exports = { ParallelStageTestSuite, PARALLEL_STAGES, PARALLEL_PRINCIPLES };
