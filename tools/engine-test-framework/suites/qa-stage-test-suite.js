/**
 * QA Stage Test Suite
 * QA测试阶段验证套件
 * 
 * 功能：
 * 1. 验证测试类型强制执行（FT/VT/FPT/RT）
 * 2. 验证反幻觉机制定义
 * 3. 验证测试证据要求
 * 4. 验证验收标准完整性
 * 5. 验证经验库集成流程
 * 6. 验证回归测试要求
 */

const { BaseTestSuite } = require('../core/base-test-suite');

const TEST_TYPES = {
    'FT': {
        name: '功能测试',
        fullName: 'Functional Test',
        priority: 'P0',
        skipable: false,
        description: '验证所有功能点是否正常工作'
    },
    'VT': {
        name: '视觉测试',
        fullName: 'Visual Test',
        priority: 'P0',
        skipable: false,
        description: '验证UI布局和视觉效果'
    },
    'FPT': {
        name: '完整路径测试',
        fullName: 'Full Path Test',
        priority: 'P0',
        skipable: false,
        description: '验证所有功能路径通畅'
    },
    'RT': {
        name: '回归测试',
        fullName: 'Regression Test',
        priority: 'P0',
        skipable: false,
        description: '验证修复后未引入新问题'
    },
    'PT': {
        name: '性能测试',
        fullName: 'Performance Test',
        priority: 'P1',
        skipable: true,
        description: '验证性能指标达标'
    }
};

const ANTI_HALLUCINATION_PRINCIPLES = {
    'EVIDENCE_FIRST': {
        name: '证据优先',
        description: '无证据 = 未测试',
        keywords: ['无证据', '未测试', '证据优先']
    },
    'PESSIMISTIC_ASSUMPTION': {
        name: '悲观假设',
        description: '代码存在 ≠ 功能正常，首次测试必有bug',
        keywords: ['悲观假设', '代码存在', '功能正常', '首次测试必有bug']
    },
    'EVIDENCE_AUTHENTICITY': {
        name: '证据真实性',
        description: '截图必须包含时间戳，禁止复用历史截图',
        keywords: ['证据真实性', '时间戳', '禁止复用']
    },
    'PROHIBITED_BEHAVIORS': {
        name: '禁止行为清单',
        description: '禁止仅凭代码推断、禁止虚构测试结果',
        keywords: ['禁止', '虚构', '推断', '复制粘贴']
    },
    'PASS_RATE_SANITY': {
        name: '通过率合理性',
        description: '100%通过 = 测试无效',
        keywords: ['100%通过', '测试无效', '测试不充分']
    }
};

const EVIDENCE_REQUIREMENTS = {
    'SCREENSHOT': {
        name: '截图证据',
        required: true,
        minCount: 1,
        path: 'tests/evidence/screenshots/',
        namingPattern: '{测试类型}_{测试项ID}_{时间戳}.png'
    },
    'LOG': {
        name: '日志证据',
        required: true,
        minCount: 1,
        path: 'tests/evidence/logs/',
        namingPattern: '{测试类型}_{时间戳}.log'
    },
    'OPERATION_RECORD': {
        name: '操作记录',
        required: true,
        description: '实际执行步骤可追溯'
    },
    'TIMESTAMP': {
        name: '时间戳',
        required: true,
        precision: 'minute',
        description: '精确到分钟的时间验证'
    }
};

const ACCEPTANCE_CRITERIA = {
    'P0_MUST_PASS': {
        name: 'P0级验收项必须通过',
        description: '所有P0级验收项必须100%通过',
        severity: 'CRITICAL'
    },
    'NO_P0_BUG': {
        name: '无P0级Bug遗留',
        description: '验收时不能有P0级Bug未修复',
        severity: 'CRITICAL'
    },
    'FT_COMPLETE': {
        name: '功能测试完成',
        description: '功能测试用例100%执行',
        severity: 'ERROR'
    },
    'VT_COMPLETE': {
        name: '视觉测试完成',
        description: '视觉测试100%执行',
        severity: 'ERROR'
    },
    'FPT_COMPLETE': {
        name: '完整路径测试完成',
        description: '完整路径测试100%通过',
        severity: 'ERROR'
    },
    'RT_COMPLETE': {
        name: '回归测试完成',
        description: '修改后必须执行回归测试',
        severity: 'ERROR'
    },
    'EVIDENCE_COMPLETE': {
        name: '测试证据完整',
        description: '所有测试必须有截图和日志证据',
        severity: 'ERROR'
    },
    'ANTI_HALLUCINATION_SIGNED': {
        name: '反幻觉自检签署',
        description: '测试人员必须签署反幻觉自检清单',
        severity: 'WARNING'
    }
};

const EXPERIENCE_INTEGRATION = {
    'READ_BEFORE_TEST': {
        name: '测试前读取经验库',
        description: '主测试(LT)和子QA测试前必须读取经验库',
        keywords: ['读取经验库', '经验库', '历史问题']
    },
    'UPDATE_AFTER_TEST': {
        name: '测试后更新经验库',
        description: '发现新问题后必须更新经验库',
        keywords: ['更新经验库', '记录问题', '经验记录']
    },
    'CACHE_QUERY': {
        name: '缓存查询',
        description: '测试前必须查询经验缓存',
        keywords: ['缓存查询', 'experience-cache-manager', 'L0缓存']
    },
    'BUG_EXPERIENCE_RECORD': {
        name: 'Bug修复经验记录',
        description: 'Bug修复后必须记录经验',
        keywords: ['bug-experience-recorder', 'Bug修复', '经验记录']
    }
};

const REGRESSION_REQUIREMENTS = {
    'AFTER_FIX': {
        name: '修复后执行',
        description: '每次Bug修复后必须执行回归测试',
        timing: 'after_fix'
    },
    'ALL_TEST_CASES': {
        name: '覆盖所有用例',
        description: '回归测试必须覆盖所有测试用例',
        coverage: '100%'
    },
    'VERIFY_FIX': {
        name: '验证修复',
        description: '验证修复的问题已解决'
    },
    'NO_NEW_ISSUES': {
        name: '无新问题',
        description: '确认未引入新问题'
    },
    'KEY_FLOW_PASS': {
        name: '关键流程通过',
        description: '关键流程必须100%通过'
    }
};

class QAStageTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('qa-stage', options);
    }
    
    async run(skills, dependencyGraph) {
        const results = [];
        
        const qaStandards = skills.get('qa-standards-manager');
        if (!qaStandards) {
            results.push(this.createResult(
                'QA_STANDARDS_EXISTS',
                'qa-standards-manager',
                false,
                'CRITICAL',
                'qa-standards-manager技能不存在，无法验证QA测试标准'
            ));
            return this.aggregateResults(results);
        }
        
        const content = qaStandards.content;
        
        results.push(...this.testTestTypesDefinition(content));
        results.push(...this.testAntiHallucinationMechanism(content));
        results.push(...this.testEvidenceRequirements(content));
        results.push(...this.testAcceptanceCriteria(content));
        results.push(...this.testExperienceIntegration(content));
        results.push(...this.testRegressionRequirements(content));
        results.push(...this.testQAExecutionChecklist(content));
        results.push(...this.testProhibitedBehaviors(content));
        
        const fullstackEngine = skills.get('fullstack-game-engine');
        if (fullstackEngine) {
            results.push(...this.testQAStageInFlow(fullstackEngine.content));
        }
        
        return this.aggregateResults(results);
    }
    
    testTestTypesDefinition(content) {
        const results = [];
        
        for (const [typeId, typeConfig] of Object.entries(TEST_TYPES)) {
            const typePattern = new RegExp(`${typeId}|${typeConfig.name}|${typeConfig.fullName}`, 'i');
            const found = typePattern.test(content);
            
            results.push(this.createResult(
                `TEST_TYPE_DEFINED_${typeId}`,
                'qa-standards-manager',
                found,
                found ? 'INFO' : 'ERROR',
                found
                    ? `${typeId}(${typeConfig.name})测试类型已定义`
                    : `${typeId}(${typeConfig.name})测试类型未定义`
            ));
            
            if (found && !typeConfig.skipable) {
                const skipablePattern = new RegExp(`${typeId}.*禁止跳过|${typeId}.*不可跳过|${typeConfig.name}.*禁止`, 'i');
                const hasSkipableCheck = skipablePattern.test(content) || 
                    content.includes('绝对禁止跳过') ||
                    content.includes('测试不可跳过');
                
                results.push(this.createResult(
                    `TEST_TYPE_SKIPABLE_${typeId}`,
                    'qa-standards-manager',
                    hasSkipableCheck,
                    hasSkipableCheck ? 'INFO' : 'WARNING',
                    hasSkipableCheck
                        ? `${typeId}已标记为不可跳过`
                        : `${typeId}建议明确标记为不可跳过`
                ));
            }
        }
        
        const allTypesPattern = /FT.*VT.*FPT.*RT|功能测试.*视觉测试.*完整路径测试.*回归测试/i;
        const hasAllTypes = allTypesPattern.test(content);
        
        results.push(this.createResult(
            'TEST_TYPES_ALL_DEFINED',
            'qa-standards-manager',
            hasAllTypes,
            hasAllTypes ? 'INFO' : 'WARNING',
            hasAllTypes
                ? '所有核心测试类型已完整定义'
                : '建议完整定义FT/VT/FPT/RT四种核心测试类型'
        ));
        
        return results;
    }
    
    testAntiHallucinationMechanism(content) {
        const results = [];
        
        const antiHallucinationPattern = /反幻觉|Anti-Hallucination|anti.hallucination/i;
        const hasAntiHallucination = antiHallucinationPattern.test(content);
        
        results.push(this.createResult(
            'ANTI_HALLUCINATION_SECTION_EXISTS',
            'qa-standards-manager',
            hasAntiHallucination,
            hasAntiHallucination ? 'INFO' : 'ERROR',
            hasAntiHallucination
                ? '反幻觉机制章节已定义'
                : '反幻觉机制章节未定义，这是QA测试的关键机制'
        ));
        
        for (const [principleId, principleConfig] of Object.entries(ANTI_HALLUCINATION_PRINCIPLES)) {
            const foundKeywords = principleConfig.keywords.filter(kw => 
                content.includes(kw)
            );
            
            const principleFound = foundKeywords.length > 0;
            
            results.push(this.createResult(
                `ANTI_HALLUCINATION_${principleId}`,
                'qa-standards-manager',
                principleFound,
                principleFound ? 'INFO' : 'WARNING',
                principleFound
                    ? `反幻觉原则"${principleConfig.name}"已定义（关键词: ${foundKeywords.join(', ')}）`
                    : `反幻觉原则"${principleConfig.name}"未明确定义（建议添加: ${principleConfig.keywords.join(', ')}）`
            ));
        }
        
        const evidenceFirstPattern = /无证据.*未测试|未测试.*无证据|无证据.*=.*未测试/i;
        const hasEvidenceFirst = evidenceFirstPattern.test(content);
        
        results.push(this.createResult(
            'ANTI_HALLUCINATION_EVIDENCE_FIRST',
            'qa-standards-manager',
            hasEvidenceFirst,
            hasEvidenceFirst ? 'INFO' : 'WARNING',
            hasEvidenceFirst
                ? '"无证据=未测试"核心原则已明确定义'
                : '建议明确定义"无证据=未测试"核心原则'
        ));
        
        const passRatePattern = /100%通过.*测试无效|测试无效.*100%通过|首次测试必有bug/i;
        const hasPassRateCheck = passRatePattern.test(content);
        
        results.push(this.createResult(
            'ANTI_HALLUCINATION_PASS_RATE_CHECK',
            'qa-standards-manager',
            hasPassRateCheck,
            hasPassRateCheck ? 'INFO' : 'WARNING',
            hasPassRateCheck
                ? '"100%通过=测试无效"合理性检查已定义'
                : '建议定义"100%通过=测试无效"合理性检查机制'
        ));
        
        return results;
    }
    
    testEvidenceRequirements(content) {
        const results = [];
        
        const evidencePattern = /测试证据|证据要求|截图证据|日志证据/i;
        const hasEvidenceSection = evidencePattern.test(content);
        
        results.push(this.createResult(
            'EVIDENCE_SECTION_EXISTS',
            'qa-standards-manager',
            hasEvidenceSection,
            hasEvidenceSection ? 'INFO' : 'ERROR',
            hasEvidenceSection
                ? '测试证据要求章节已定义'
                : '测试证据要求章节未定义'
        ));
        
        for (const [evidenceId, evidenceConfig] of Object.entries(EVIDENCE_REQUIREMENTS)) {
            const evidencePattern = new RegExp(evidenceConfig.name, 'i');
            const found = evidencePattern.test(content);
            
            results.push(this.createResult(
                `EVIDENCE_TYPE_${evidenceId}`,
                'qa-standards-manager',
                found,
                found ? 'INFO' : (evidenceConfig.required ? 'WARNING' : 'INFO'),
                found
                    ? `${evidenceConfig.name}证据要求已定义`
                    : `${evidenceConfig.name}证据要求未定义`
            ));
        }
        
        const screenshotPathPattern = /tests\/evidence\/screenshots|screenshots\/ft|screenshots\/vt/i;
        const hasScreenshotPath = screenshotPathPattern.test(content);
        
        results.push(this.createResult(
            'EVIDENCE_SCREENSHOT_PATH',
            'qa-standards-manager',
            hasScreenshotPath,
            hasScreenshotPath ? 'INFO' : 'WARNING',
            hasScreenshotPath
                ? '截图证据目录结构已定义'
                : '建议定义截图证据目录结构'
        ));
        
        const timestampPattern = /时间戳|timestamp|精确到分钟/i;
        const hasTimestamp = timestampPattern.test(content);
        
        results.push(this.createResult(
            'EVIDENCE_TIMESTAMP_REQUIRED',
            'qa-standards-manager',
            hasTimestamp,
            hasTimestamp ? 'INFO' : 'WARNING',
            hasTimestamp
                ? '证据时间戳要求已定义'
                : '建议定义证据时间戳要求'
        ));
        
        return results;
    }
    
    testAcceptanceCriteria(content) {
        const results = [];
        
        const acceptancePattern = /验收标准|验收检查清单|通过准则/i;
        const hasAcceptanceSection = acceptancePattern.test(content);
        
        results.push(this.createResult(
            'ACCEPTANCE_SECTION_EXISTS',
            'qa-standards-manager',
            hasAcceptanceSection,
            hasAcceptanceSection ? 'INFO' : 'ERROR',
            hasAcceptanceSection
                ? '验收标准章节已定义'
                : '验收标准章节未定义'
        ));
        
        for (const [criteriaId, criteriaConfig] of Object.entries(ACCEPTANCE_CRITERIA)) {
            const criteriaPattern = new RegExp(criteriaConfig.name.replace(/[()]/g, ''), 'i');
            const found = criteriaPattern.test(content) || 
                content.includes(criteriaId) ||
                content.includes(criteriaConfig.description.substring(0, 10));
            
            results.push(this.createResult(
                `ACCEPTANCE_CRITERIA_${criteriaId}`,
                'qa-standards-manager',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `验收标准"${criteriaConfig.name}"已定义`
                    : `验收标准"${criteriaConfig.name}"未明确定义`
            ));
        }
        
        const p0MustPassPattern = /P0.*必须.*通过|P0级.*必须|所有P0级/i;
        const hasP0MustPass = p0MustPassPattern.test(content);
        
        results.push(this.createResult(
            'ACCEPTANCE_P0_MUST_PASS',
            'qa-standards-manager',
            hasP0MustPass,
            hasP0MustPass ? 'INFO' : 'WARNING',
            hasP0MustPass
                ? 'P0级验收项必须通过的要求已明确'
                : '建议明确P0级验收项必须通过的要求'
        ));
        
        return results;
    }
    
    testExperienceIntegration(content) {
        const results = [];
        
        const experiencePattern = /经验库|experience-db|project-experience-summarizer/i;
        const hasExperienceSection = experiencePattern.test(content);
        
        results.push(this.createResult(
            'EXPERIENCE_INTEGRATION_EXISTS',
            'qa-standards-manager',
            hasExperienceSection,
            hasExperienceSection ? 'INFO' : 'WARNING',
            hasExperienceSection
                ? '经验库集成章节已定义'
                : '建议添加经验库集成章节'
        ));
        
        for (const [integrationId, integrationConfig] of Object.entries(EXPERIENCE_INTEGRATION)) {
            const foundKeywords = integrationConfig.keywords.filter(kw => 
                content.includes(kw)
            );
            
            const integrationFound = foundKeywords.length > 0;
            
            results.push(this.createResult(
                `EXPERIENCE_INTEGRATION_${integrationId}`,
                'qa-standards-manager',
                integrationFound,
                integrationFound ? 'INFO' : 'WARNING',
                integrationFound
                    ? `${integrationConfig.name}已定义`
                    : `${integrationConfig.name}未明确定义`
            ));
        }
        
        const cacheManagerPattern = /experience-cache-manager|缓存查询|L0缓存/i;
        const hasCacheManager = cacheManagerPattern.test(content);
        
        results.push(this.createResult(
            'EXPERIENCE_CACHE_MANAGER',
            'qa-standards-manager',
            hasCacheManager,
            hasCacheManager ? 'INFO' : 'WARNING',
            hasCacheManager
                ? '经验缓存管理器已引用'
                : '建议引用experience-cache-manager进行缓存查询'
        ));
        
        return results;
    }
    
    testRegressionRequirements(content) {
        const results = [];
        
        const regressionPattern = /回归测试|RT|Regression/i;
        const hasRegressionSection = regressionPattern.test(content);
        
        results.push(this.createResult(
            'REGRESSION_SECTION_EXISTS',
            'qa-standards-manager',
            hasRegressionSection,
            hasRegressionSection ? 'INFO' : 'ERROR',
            hasRegressionSection
                ? '回归测试章节已定义'
                : '回归测试章节未定义'
        ));
        
        for (const [reqId, reqConfig] of Object.entries(REGRESSION_REQUIREMENTS)) {
            const reqPattern = new RegExp(reqConfig.name, 'i');
            const found = reqPattern.test(content) || 
                content.includes(reqConfig.description.substring(0, 10));
            
            results.push(this.createResult(
                `REGRESSION_REQUIREMENT_${reqId}`,
                'qa-standards-manager',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `回归测试要求"${reqConfig.name}"已定义`
                    : `回归测试要求"${reqConfig.name}"未明确定义`
            ));
        }
        
        const afterFixPattern = /修复后.*回归|Bug修复后.*测试|修改后.*回归/i;
        const hasAfterFix = afterFixPattern.test(content);
        
        results.push(this.createResult(
            'REGRESSION_AFTER_FIX',
            'qa-standards-manager',
            hasAfterFix,
            hasAfterFix ? 'INFO' : 'WARNING',
            hasAfterFix
                ? '"修复后必须执行回归测试"要求已明确'
                : '建议明确"修复后必须执行回归测试"要求'
        ));
        
        return results;
    }
    
    testQAExecutionChecklist(content) {
        const results = [];
        
        const checklistPattern = /测试执行清单|测试检查清单|QA.*清单/i;
        const hasChecklist = checklistPattern.test(content);
        
        results.push(this.createResult(
            'QA_CHECKLIST_EXISTS',
            'qa-standards-manager',
            hasChecklist,
            hasChecklist ? 'INFO' : 'WARNING',
            hasChecklist
                ? 'QA测试执行清单已定义'
                : '建议定义QA测试执行清单'
        ));
        
        const startupPattern = /启动验证|阶段0|游戏.*启动|应用.*启动/i;
        const hasStartup = startupPattern.test(content);
        
        results.push(this.createResult(
            'QA_STARTUP_VERIFICATION',
            'qa-standards-manager',
            hasStartup,
            hasStartup ? 'INFO' : 'WARNING',
            hasStartup
                ? '启动验证阶段已定义'
                : '建议添加启动验证阶段（最高优先级）'
        ));
        
        const consolePattern = /控制台.*检查|控制台.*错误|console.*error/i;
        const hasConsoleCheck = consolePattern.test(content);
        
        results.push(this.createResult(
            'QA_CONSOLE_CHECK',
            'qa-standards-manager',
            hasConsoleCheck,
            hasConsoleCheck ? 'INFO' : 'WARNING',
            hasConsoleCheck
                ? '控制台错误检查已定义'
                : '建议添加控制台错误检查要求'
        ));
        
        const actualRunPattern = /实际运行|实际点击|实际执行|强制.*运行/i;
        const hasActualRun = actualRunPattern.test(content);
        
        results.push(this.createResult(
            'QA_ACTUAL_RUN_REQUIRED',
            'qa-standards-manager',
            hasActualRun,
            hasActualRun ? 'INFO' : 'WARNING',
            hasActualRun
                ? '强制实际运行验证已定义'
                : '建议添加强制实际运行验证要求'
        ));
        
        const selfCheckPattern = /反幻觉自检|自检清单|签署/i;
        const hasSelfCheck = selfCheckPattern.test(content);
        
        results.push(this.createResult(
            'QA_SELF_CHECK_REQUIRED',
            'qa-standards-manager',
            hasSelfCheck,
            hasSelfCheck ? 'INFO' : 'WARNING',
            hasSelfCheck
                ? '反幻觉自检签署要求已定义'
                : '建议添加反幻觉自检签署要求'
        ));
        
        return results;
    }
    
    testProhibitedBehaviors(content) {
        const results = [];
        
        const prohibitedBehaviors = [
            { keyword: '禁止自测', desc: '禁止程序员自测' },
            { keyword: '禁止跳过', desc: '禁止跳过测试环节' },
            { keyword: '禁止虚构', desc: '禁止虚构测试结果' },
            { keyword: '禁止仅凭代码', desc: '禁止仅凭代码推断' },
            { keyword: '禁止复制粘贴', desc: '禁止复制粘贴测试结果' }
        ];
        
        for (const behavior of prohibitedBehaviors) {
            const found = content.includes(behavior.keyword);
            
            results.push(this.createResult(
                `PROHIBITED_BEHAVIOR_${behavior.keyword.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '_')}`,
                'qa-standards-manager',
                found,
                found ? 'INFO' : 'WARNING',
                found
                    ? `禁止行为"${behavior.desc}"已定义`
                    : `建议定义禁止行为"${behavior.desc}"`
            ));
        }
        
        const noSelfTestPattern = /禁止自测|程序.*不.*测试|程序.*禁止.*测试/i;
        const hasNoSelfTest = noSelfTestPattern.test(content);
        
        results.push(this.createResult(
            'PROHIBITED_SELF_TEST',
            'qa-standards-manager',
            hasNoSelfTest,
            hasNoSelfTest ? 'INFO' : 'WARNING',
            hasNoSelfTest
                ? '禁止程序员自测已明确定义'
                : '建议明确禁止程序员自测'
        ));
        
        return results;
    }
    
    testQAStageInFlow(content) {
        const results = [];
        
        const qaStagePattern = /Step 3-3|QA测试阶段|测试阶段|子QA并行/i;
        const hasQAStage = qaStagePattern.test(content);
        
        results.push(this.createResult(
            'QA_STAGE_IN_FLOW',
            'fullstack-game-engine',
            hasQAStage,
            hasQAStage ? 'INFO' : 'WARNING',
            hasQAStage
                ? 'QA测试阶段已嵌入流程'
                : '建议在流程中明确定义QA测试阶段'
        ));
        
        const qaRolePattern = /主测试|LT|子QA|QA-/i;
        const hasQARole = qaRolePattern.test(content);
        
        results.push(this.createResult(
            'QA_ROLE_DEFINED',
            'fullstack-game-engine',
            hasQARole,
            hasQARole ? 'INFO' : 'WARNING',
            hasQARole
                ? 'QA角色已定义'
                : '建议定义QA角色（主测试LT、子QA）'
        ));
        
        const qaParallelPattern = /子QA.*并行|QA.*并行|测试.*并行/i;
        const hasQAParallel = qaParallelPattern.test(content);
        
        results.push(this.createResult(
            'QA_PARALLEL_DEFINED',
            'fullstack-game-engine',
            hasQAParallel,
            hasQAParallel ? 'INFO' : 'WARNING',
            hasQAParallel
                ? 'QA并行测试已定义'
                : '建议定义QA并行测试机制'
        ));
        
        return results;
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = [];
        
        if (skillName === 'qa-standards-manager') {
            const content = skillData.content;
            
            for (const [typeId, typeConfig] of Object.entries(TEST_TYPES)) {
                const found = content.includes(typeId) || content.includes(typeConfig.name);
                results.push({
                    test: `TEST_TYPE_${typeId}`,
                    passed: found,
                    severity: found ? 'INFO' : 'ERROR',
                    message: found
                        ? `${typeId}已定义`
                        : `${typeId}未定义`
                });
            }
            
            const hasAntiHallucination = content.includes('反幻觉');
            results.push({
                test: 'ANTI_HALLUCINATION_DEFINED',
                passed: hasAntiHallucination,
                severity: hasAntiHallucination ? 'INFO' : 'ERROR',
                message: hasAntiHallucination
                    ? '反幻觉机制已定义'
                    : '反幻觉机制未定义'
            });
        } else if (skillName === 'fullstack-game-engine') {
            const content = skillData.content;
            
            const hasQAStage = content.includes('QA测试') || content.includes('Step 3-3');
            results.push({
                test: 'QA_STAGE_IN_FLOW',
                passed: hasQAStage,
                severity: hasQAStage ? 'INFO' : 'WARNING',
                message: hasQAStage
                    ? 'QA测试阶段已嵌入流程'
                    : 'QA测试阶段未嵌入流程'
            });
        } else {
            return {
                skill: skillName,
                passed: true,
                results: [{
                    test: 'QA_STAGE_SKIP',
                    passed: true,
                    severity: 'INFO',
                    message: 'QA测试阶段验证主要适用于qa-standards-manager和fullstack-game-engine技能'
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
    QAStageTestSuite, 
    TEST_TYPES, 
    ANTI_HALLUCINATION_PRINCIPLES, 
    EVIDENCE_REQUIREMENTS,
    ACCEPTANCE_CRITERIA,
    EXPERIENCE_INTEGRATION,
    REGRESSION_REQUIREMENTS
};
