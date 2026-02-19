#!/usr/bin/env node
/**
 * Skill Validator CLI
 * 技能验证统一命令行工具
 * 
 * 功能：
 * 1. 解析技能头部
 * 2. 验证技能完整性
 * 3. 检查执行条件
 * 4. 验证质量标准
 * 5. 生成综合报告
 * 
 * 用法：
 *   node skill-validator-cli.js parse --skill=<name>
 *   node skill-validator-cli.js validate --skill=<name>
 *   node skill-validator-cli.js validate-all
 *   node skill-validator-cli.js check --skill=<name>
 *   node skill-validator-cli.js report --skill=<name>
 *   node skill-validator-cli.js test-all
 */

const fs = require('fs');
const path = require('path');
const { SkillHeaderParser } = require('./skill-header-parser');
const { SkillExecutionValidator } = require('./skill-execution-validator');
const { SkillRollbackDecider } = require('./skill-rollback-decider');
const { SkillQualityValidator } = require('./skill-quality-validator');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.trae', 'skills');

const COLORS = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    header: '\x1b[35m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
    dim: '\x1b[2m'
};

class SkillValidatorCLI {
    
    constructor(verbose = false) {
        this.verbose = verbose;
        this.headerParser = new SkillHeaderParser(verbose);
        this.executionValidator = new SkillExecutionValidator(verbose);
        this.rollbackDecider = new SkillRollbackDecider(verbose);
        this.qualityValidator = new SkillQualityValidator(verbose);
    }
    
    log(message, type = 'info') {
        if (this.verbose || type !== 'info') {
            console.log(`${COLORS[type] || ''}${message}${COLORS.reset}`);
        }
    }
    
    printHeader(title) {
        console.log(`\n${COLORS.header}${COLORS.bold}========================================`);
        console.log(`  ${title}`);
        console.log(`========================================${COLORS.reset}\n`);
    }
    
    printSkillStatus(skillName, status, details = '') {
        const statusColors = {
            'PENDING': COLORS.warning,
            'IN_PROGRESS': COLORS.info,
            'COMPLETED': COLORS.success,
            'FAILED': COLORS.error,
            'ROLLED_BACK': COLORS.warning
        };
        const color = statusColors[status] || COLORS.info;
        console.log(`  ${color}[${status}]${COLORS.reset} ${skillName} ${details}`);
    }
    
    parse(skillName) {
        this.printHeader(`Parsing Skill: ${skillName}`);
        
        const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
        const result = this.headerParser.parseSkillFile(skillPath);
        
        if (result.success) {
            this.log('✅ Parse successful\n', 'success');
            console.log(JSON.stringify(result.header, null, 2));
            return 0;
        } else {
            this.log(`❌ Parse failed: ${result.error}`, 'error');
            return 1;
        }
    }
    
    validate(skillName) {
        this.printHeader(`Validating Skill: ${skillName}`);
        
        this.headerParser.scanAllSkills();
        const result = this.headerParser.validateSkill(skillName);
        
        if (result.found) {
            this.log(`Layer: ${result.header?.layer ?? '?'}`, 'info');
            this.log(`Version: ${result.header?.version ?? '?'}`, 'info');
            this.log(`Description: ${result.header?.description?.substring(0, 60) ?? '?'}...`, 'info');
            
            if (result.valid) {
                this.log('\n✅ Validation passed', 'success');
            } else {
                this.log('\n❌ Validation failed', 'error');
            }
            
            if (result.errors.length > 0) {
                this.log('\nErrors:', 'error');
                for (const err of result.errors) {
                    this.log(`  - ${err.field}: ${err.message}`, 'error');
                }
            }
            
            if (result.warnings.length > 0) {
                this.log('\nWarnings:', 'warning');
                for (const warn of result.warnings) {
                    this.log(`  - ${warn.field}: ${warn.message}`, 'warning');
                }
            }
        } else {
            this.log('❌ Skill not found', 'error');
        }
        
        console.log('\n' + JSON.stringify(result, null, 2));
        return result.valid ? 0 : 1;
    }
    
    validateAll() {
        this.printHeader('Validating All Skills');
        
        const results = this.headerParser.validateAll();
        
        this.log(`Total: ${results.total}`, 'info');
        this.log(`Passed: ${results.passed}`, 'success');
        this.log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
        this.log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'warning' : 'success');
        
        if (results.failed > 0) {
            this.log('\nFailed Skills:', 'error');
            for (const detail of results.details) {
                if (!detail.valid) {
                    this.log(`\n  [${detail.layer ?? '?'}] ${detail.skill}:`, 'error');
                    for (const err of detail.errors) {
                        this.log(`    - ${err.field}: ${err.message}`, 'error');
                    }
                }
            }
        }
        
        this.printHeader('Dependency Graph');
        for (const [skillName, skillData] of this.headerParser.skills) {
            const layer = skillData.header.layer ?? '?';
            const deps = this.headerParser.dependencyGraph.get(skillName) || [];
            
            if (deps.length > 0) {
                console.log(`  [${layer}] ${skillName} -> (${deps.join(', ')})`);
            } else {
                console.log(`${COLORS.dim}  [${layer}] ${skillName} (no deps)${COLORS.reset}`);
            }
        }
        
        this.log('\n✅ Validation complete!', 'success');
        return results.failed > 0 ? 1 : 0;
    }
    
    check(skillName) {
        this.printHeader(`Checking Execution: ${skillName}`);
        
        const result = this.executionValidator.canExecute(skillName);
        
        this.log(`Skill: ${skillName}`, 'info');
        this.log(`Found: ${result.found}`, 'info');
        this.log(`Layer: ${result.layer ?? '?'}`, 'info');
        this.log(`Mode: ${result.mode ?? '?'}`, 'info');
        
        if (result.allowed) {
            this.log('\n✅ Can execute', 'success');
        } else {
            this.log('\n❌ Cannot execute', 'error');
            
            if (result.blockers.length > 0) {
                this.log('\nBlockers:', 'error');
                for (const blocker of result.blockers) {
                    this.log(`  - [${blocker.type}] ${blocker.reason}`, 'error');
                }
            }
            
            if (result.requiredActions.length > 0) {
                this.log('\nRequired Actions:', 'warning');
                for (const action of result.requiredActions) {
                    this.log(`  - ${action}`, 'warning');
                }
            }
        }
        
        console.log('\n' + JSON.stringify(result, null, 2));
        return result.allowed ? 0 : 1;
    }
    
    report(skillName) {
        this.printHeader(`Comprehensive Report: ${skillName}`);
        
        const headerResult = this.headerParser.validateSkill(skillName);
        const execResult = this.executionValidator.canExecute(skillName);
        const qualityResult = this.qualityValidator.validateQuality(skillName, {});
        const rollbackResult = this.rollbackDecider.getCheckpoints(skillName);
        
        const report = {
            skill: skillName,
            timestamp: new Date().toISOString(),
            header: {
                valid: headerResult.valid,
                layer: headerResult.header?.layer,
                version: headerResult.header?.version,
                errorCount: headerResult.errors?.length || 0,
                warningCount: headerResult.warnings?.length || 0
            },
            execution: {
                canExecute: execResult.allowed,
                mode: execResult.mode,
                blockerCount: execResult.blockers?.length || 0
            },
            quality: {
                passed: qualityResult.passed,
                criteriaCount: qualityResult.criteriaResults?.length || 0,
                antiHallucination: qualityResult.antiHallucinationResult?.passed ?? null
            },
            rollback: {
                supported: rollbackResult.supportsRollback,
                checkpointCount: rollbackResult.checkpoints?.length || 0
            },
            overall: {
                valid: headerResult.valid && qualityResult.passed,
                ready: headerResult.valid && execResult.allowed && qualityResult.passed
            }
        };
        
        console.log(JSON.stringify(report, null, 2));
        
        this.log('\n--- Summary ---', 'header');
        this.log(`Header Valid: ${report.header.valid ? '✅' : '❌'}`, report.header.valid ? 'success' : 'error');
        this.log(`Can Execute: ${report.execution.canExecute ? '✅' : '❌'}`, report.execution.canExecute ? 'success' : 'error');
        this.log(`Quality Passed: ${report.quality.passed ? '✅' : '❌'}`, report.quality.passed ? 'success' : 'error');
        this.log(`Rollback Supported: ${report.rollback.supported ? '✅' : '❌'}`, report.rollback.supported ? 'success' : 'warning');
        
        this.log(`\nOverall Ready: ${report.overall.ready ? '✅ YES' : '❌ NO'}`, report.overall.ready ? 'success' : 'error');
        
        return report.overall.valid ? 0 : 1;
    }
    
    testAll() {
        this.printHeader('Testing All Skills');
        
        this.headerParser.scanAllSkills();
        
        const results = {
            total: this.headerParser.skills.size,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        
        for (const [skillName, skillData] of this.headerParser.skills) {
            const headerResult = this.headerParser.validateSkill(skillName);
            const qualityResult = this.qualityValidator.validateQuality(skillName, {});
            
            const passed = headerResult.valid && qualityResult.passed;
            
            if (passed) {
                results.passed++;
                this.printSkillStatus(skillName, 'COMPLETED');
            } else {
                results.failed++;
                this.printSkillStatus(skillName, 'FAILED', 
                    `errors: ${headerResult.errors?.length || 0}`);
            }
            
            results.warnings += headerResult.warnings?.length || 0;
            
            results.details.push({
                skill: skillName,
                layer: skillData.header.layer,
                passed: passed,
                headerValid: headerResult.valid,
                qualityPassed: qualityResult.passed,
                errors: headerResult.errors?.length || 0,
                warnings: headerResult.warnings?.length || 0
            });
        }
        
        this.printHeader('Test Summary');
        this.log(`Total: ${results.total}`, 'info');
        this.log(`Passed: ${results.passed}`, 'success');
        this.log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
        this.log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'warning' : 'success');
        
        const passRate = ((results.passed / results.total) * 100).toFixed(1);
        this.log(`\nPass Rate: ${passRate}%`, parseFloat(passRate) >= 80 ? 'success' : 'warning');
        
        if (results.failed > 0) {
            this.log('\nFailed Skills:', 'error');
            for (const detail of results.details.filter(d => !d.passed)) {
                this.log(`  - [${detail.layer ?? '?'}] ${detail.skill}`, 'error');
            }
        }
        
        this.log('\n✅ Test complete!', 'success');
        return results.failed > 0 ? 1 : 0;
    }
    
    generateMigrationTemplate(skillName) {
        this.printHeader(`Generating Migration Template: ${skillName}`);
        
        const skillData = this.headerParser.skills.get(skillName);
        if (!skillData) {
            this.log('Skill not found', 'error');
            return 1;
        }
        
        const header = skillData.header;
        
        const template = `---
name: "${skillName}"
version: "${header.version || '1.0.0'}"
description: "${(header.description || '').replace(/"/g, '\\"').substring(0, 200)}"
author: "engine-team"
created_at: "${new Date().toISOString().split('T')[0]}"
updated_at: "${new Date().toISOString().split('T')[0]}"

layer: ${header.layer ?? 0}
dependencies:
${(header.dependencies || []).map(d => {
    const name = typeof d === 'string' ? d : d.name;
    const layer = typeof d === 'object' ? d.layer : '??';
    const type = typeof d === 'object' ? d.type : 'required';
    return `  - name: "${name}"
    layer: ${layer}
    type: "${type}"
    purpose: ""`;
}).join('\n') || '  []'}

contracts:
  input:
    required_documents: []
    optional_documents: []
    validation_rules: []
  output:
    required_documents: []
    validation_rules: []
    quality_gates: []

execution:
  mode: "blocking"
  preconditions: []
  postconditions: []
  rollback:
    supported: false
    strategy: "none"
    rollback_point: null
    side_effects: []
    recovery_actions: []

quality:
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false
    anti_hallucination:
      enabled: false
      level: "LEVEL_1"
      min_screenshots: 3
      max_pass_rate: 1.0
  review:
    required: false
    reviewer: ""
    checklist: []

tracking:
  execution_status:
    current: "PENDING"
    started_at: null
    completed_at: null
    duration_ms: null
  error_codes: []
  checkpoints: []
  state_transitions: []

functions:
  main:
    name: "execute"
    signature: "execute(input: any) -> any"
    description: "执行技能主逻辑"
  validators: []
  state_managers: []
  queries: []
---`;
        
        console.log(template);
        return 0;
    }
}

function printHelp() {
    console.log(`
${COLORS.header}${COLORS.bold}Skill Validator CLI v1.0${COLORS.reset}

Usage:
  node skill-validator-cli.js <command> [options]

Commands:
  parse --skill=<name>           Parse a single skill header
  validate --skill=<name>        Validate a single skill
  validate-all                   Validate all skills
  check --skill=<name>           Check if skill can execute
  report --skill=<name>          Generate comprehensive report
  test-all                       Test all skills
  template --skill=<name>        Generate migration template

Options:
  --verbose, -v                  Enable verbose output
  --json                         Output as JSON only

Examples:
  node skill-validator-cli.js validate --skill=contract-validator
  node skill-validator-cli.js validate-all --verbose
  node skill-validator-cli.js report --skill=state-manager
  node skill-validator-cli.js test-all
`);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        process.exit(0);
    }
    
    const command = args[0];
    const verbose = args.includes('--verbose') || args.includes('-v');
    const jsonOnly = args.includes('--json');
    
    const cli = new SkillValidatorCLI(verbose && !jsonOnly);
    
    let exitCode = 0;
    
    switch (command) {
        case 'parse': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            exitCode = cli.parse(skillArg.split('=')[1]);
            break;
        }
        
        case 'validate': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            exitCode = cli.validate(skillArg.split('=')[1]);
            break;
        }
        
        case 'validate-all':
            exitCode = cli.validateAll();
            break;
            
        case 'check': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            exitCode = cli.check(skillArg.split('=')[1]);
            break;
        }
        
        case 'report': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            exitCode = cli.report(skillArg.split('=')[1]);
            break;
        }
        
        case 'test-all':
            exitCode = cli.testAll();
            break;
            
        case 'template': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            exitCode = cli.generateMigrationTemplate(skillArg.split('=')[1]);
            break;
        }
        
        default:
            console.error(`Unknown command: ${command}`);
            printHelp();
            exitCode = 1;
    }
    
    process.exit(exitCode);
}

if (require.main === module) {
    main();
}

module.exports = { SkillValidatorCLI };
