/**
 * Skill Rollback Decider
 * 技能回滚决策器
 * 
 * 功能：
 * 1. 分析错误并决定是否需要回滚
 * 2. 生成回滚计划
 * 3. 查找最近的检查点
 * 4. 执行回滚操作
 * 
 * 用法：
 *   node skill-rollback-decider.js analyze --skill=<name> --error=<code>
 *   node skill-rollback-decider.js plan --skill=<name> --checkpoint=<id>
 *   node skill-rollback-decider.js checkpoints --skill=<name>
 */

const fs = require('fs');
const path = require('path');
const { SkillHeaderParser } = require('./skill-header-parser');

const SEVERITY_ORDER = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };

class SkillRollbackDecider {
    
    constructor(verbose = false) {
        this.verbose = verbose;
        this.parser = new SkillHeaderParser(verbose);
        this.parser.scanAllSkills();
    }
    
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            header: '\x1b[35m',
            reset: '\x1b[0m'
        };
        if (this.verbose || type !== 'info') {
            console.log(`${colors[type] || ''}${message}${colors.reset}`);
        }
    }
    
    analyzeErrorForRollback(skillName, error, state = {}) {
        const skillData = this.parser.skills.get(skillName);
        
        if (!skillData) {
            return {
                requiresRollback: false,
                reason: '技能不存在，无法分析回滚',
                confidence: 0
            };
        }
        
        const header = skillData.header;
        const errorCodes = header.tracking?.error_codes || [];
        const rollbackConfig = header.execution?.rollback || {};
        
        const errorDef = errorCodes.find(e => e.code === error.code || e.name === error.name);
        
        if (!errorDef) {
            if (error.severity === 'CRITICAL' || SEVERITY_ORDER[error.severity] >= 4) {
                return {
                    requiresRollback: true,
                    reason: '严重错误，保守回滚',
                    confidence: 0.7,
                    rollbackPoint: this.findNearestCheckpoint(skillName, state)
                };
            }
            
            return {
                requiresRollback: false,
                reason: '未知错误，无回滚定义',
                confidence: 0.3,
                alternativeActions: ['人工审核', '重试执行']
            };
        }
        
        if (errorDef.severity === 'CRITICAL') {
            return {
                requiresRollback: true,
                reason: '严重错误，必须回滚',
                confidence: 1.0,
                errorDefinition: errorDef,
                rollbackPoint: this.findNearestCheckpoint(skillName, state)
            };
        }
        
        if (errorDef.severity === 'HIGH' && errorDef.rollback_required) {
            return {
                requiresRollback: true,
                reason: '高级别错误，定义要求回滚',
                confidence: 0.9,
                errorDefinition: errorDef,
                rollbackPoint: this.findNearestCheckpoint(skillName, state)
            };
        }
        
        if (rollbackConfig.supported) {
            const checkpoint = this.findNearestCheckpoint(skillName, state);
            if (checkpoint) {
                if (errorDef.rollback_required) {
                    return {
                        requiresRollback: true,
                        reason: '错误定义要求回滚',
                        confidence: 0.85,
                        errorDefinition: errorDef,
                        rollbackPoint: checkpoint
                    };
                }
                
                return {
                    requiresRollback: true,
                    reason: '支持回滚且有可用检查点',
                    confidence: 0.6,
                    errorDefinition: errorDef,
                    rollbackPoint: checkpoint,
                    alternativeActions: ['重试', '跳过', '人工干预']
                };
            }
        }
        
        return {
            requiresRollback: false,
            reason: '错误可恢复或回滚不支持',
            confidence: 0.7,
            errorDefinition: errorDef,
            alternativeActions: ['重试', '跳过', '人工干预']
        };
    }
    
    findNearestCheckpoint(skillName, state = {}) {
        const skillData = this.parser.skills.get(skillName);
        
        if (!skillData) return null;
        
        const checkpoints = skillData.header.tracking?.checkpoints || [];
        const rollbackConfig = skillData.header.execution?.rollback || {};
        
        if (checkpoints.length === 0) {
            if (rollbackConfig.rollback_point) {
                return {
                    id: rollbackConfig.rollback_point,
                    name: '配置的回滚点',
                    type: 'configured'
                };
            }
            return null;
        }
        
        const passedCheckpoints = checkpoints.filter(cp => {
            return cp.rollback_supported !== false;
        });
        
        if (passedCheckpoints.length === 0) return null;
        
        return passedCheckpoints[passedCheckpoints.length - 1];
    }
    
    generateRollbackPlan(skillName, targetCheckpoint, state = {}) {
        const skillData = this.parser.skills.get(skillName);
        
        if (!skillData) {
            return {
                success: false,
                error: '技能不存在'
            };
        }
        
        const header = skillData.header;
        const rollbackConfig = header.execution?.rollback || {};
        
        const plan = {
            skill: skillName,
            targetCheckpoint: targetCheckpoint,
            actions: [],
            sideEffects: [],
            warnings: [],
            estimatedImpact: {}
        };
        
        const recoveryActions = rollbackConfig.recovery_actions || [];
        for (const action of recoveryActions) {
            plan.actions.push({
                type: action.action,
                target: action.target,
                value: action.value,
                description: this.describeRecoveryAction(action)
            });
        }
        
        plan.sideEffects = rollbackConfig.side_effects || [];
        
        if (header.execution?.mode === 'parallel') {
            plan.warnings.push('并行执行模式，回滚可能影响其他正在执行的任务');
        }
        
        const deps = header.dependencies || [];
        for (const dep of deps) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            plan.warnings.push(`依赖技能 '${depName}' 可能需要重新验证`);
        }
        
        plan.estimatedImpact = {
            artifactsAffected: recoveryActions.filter(a => a.action === 'DELETE_ARTIFACTS').length,
            rolesAffected: recoveryActions.filter(a => a.action === 'RESET_ROLE_STATUS').length,
            blockingPointsReset: recoveryActions.filter(a => a.action === 'RESET_BP').length
        };
        
        return {
            success: true,
            plan: plan
        };
    }
    
    describeRecoveryAction(action) {
        const descriptions = {
            'DELETE_ARTIFACTS': `删除产出物: ${action.target}`,
            'RESET_ROLE_STATUS': `重置角色 ${action.target} 状态为 ${action.value}`,
            'RESET_BP': `重置阻塞点 ${action.target} 为锁定状态`,
            'RESTORE_ARTIFACTS': `恢复产出物: ${action.target}`,
            'NOTIFY_DEPENDENTS': `通知依赖技能重新验证`
        };
        
        return descriptions[action.action] || `执行动作: ${action.action}`;
    }
    
    getCheckpoints(skillName) {
        const skillData = this.parser.skills.get(skillName);
        
        if (!skillData) {
            return {
                skill: skillName,
                found: false,
                checkpoints: []
            };
        }
        
        const checkpoints = skillData.header.tracking?.checkpoints || [];
        const rollbackConfig = skillData.header.execution?.rollback || {};
        
        return {
            skill: skillName,
            found: true,
            supportsRollback: rollbackConfig.supported || false,
            defaultRollbackPoint: rollbackConfig.rollback_point || null,
            checkpoints: checkpoints.map(cp => ({
                id: cp.id,
                name: cp.name,
                position: cp.position,
                rollbackSupported: cp.rollback_supported !== false
            }))
        };
    }
    
    executeRollback(skillName, plan, state = {}) {
        const results = {
            skill: skillName,
            timestamp: new Date().toISOString(),
            success: true,
            actions: [],
            errors: []
        };
        
        for (const action of plan.actions) {
            const actionResult = {
                type: action.type,
                target: action.target,
                executed: false,
                error: null
            };
            
            switch (action.type) {
                case 'DELETE_ARTIFACTS': {
                    try {
                        const pattern = action.target;
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                        const baseDir = process.cwd();
                        
                        const deleteMatching = (dir) => {
                            const entries = fs.readdirSync(dir, { withFileTypes: true });
                            for (const entry of entries) {
                                const fullPath = path.join(dir, entry.name);
                                if (entry.isDirectory()) {
                                    deleteMatching(fullPath);
                                } else {
                                    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                                    if (regex.test(relativePath)) {
                                        fs.unlinkSync(fullPath);
                                        results.actions.push({
                                            type: 'DELETE_FILE',
                                            path: relativePath,
                                            executed: true
                                        });
                                    }
                                }
                            }
                        };
                        
                        deleteMatching(baseDir);
                        actionResult.executed = true;
                    } catch (e) {
                        actionResult.error = e.message;
                        results.errors.push(actionResult);
                    }
                    break;
                }
                
                case 'RESET_ROLE_STATUS': {
                    actionResult.executed = true;
                    actionResult.note = '角色状态重置需要状态管理器配合';
                    break;
                }
                
                case 'RESET_BP': {
                    actionResult.executed = true;
                    actionResult.note = '阻塞点重置需要流程管理器配合';
                    break;
                }
                
                default:
                    actionResult.executed = true;
                    actionResult.note = '模拟执行';
            }
            
            results.actions.push(actionResult);
        }
        
        results.success = results.errors.length === 0;
        
        return results;
    }
    
    generateRollbackReport(skillName, error, state = {}) {
        const analysis = this.analyzeErrorForRollback(skillName, error, state);
        
        const report = {
            skill: skillName,
            timestamp: new Date().toISOString(),
            error: error,
            analysis: analysis,
            plan: null,
            recommendation: ''
        };
        
        if (analysis.requiresRollback && analysis.rollbackPoint) {
            const planResult = this.generateRollbackPlan(skillName, analysis.rollbackPoint, state);
            report.plan = planResult.plan;
        }
        
        if (analysis.requiresRollback) {
            report.recommendation = `建议执行回滚到检查点 ${analysis.rollbackPoint?.id || '初始状态'}`;
        } else {
            report.recommendation = `建议尝试: ${analysis.alternativeActions?.join(', ') || '重试'}`;
        }
        
        return report;
    }
}

function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const verbose = args.includes('--verbose') || args.includes('-v');
    
    const decider = new SkillRollbackDecider(verbose);
    
    switch (command) {
        case 'analyze': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            const errorArg = args.find(a => a.startsWith('--error='));
            
            if (!skillArg || !errorArg) {
                console.error('Usage: node skill-rollback-decider.js analyze --skill=<name> --error=<code>');
                process.exit(1);
            }
            
            const skillName = skillArg.split('=')[1];
            const errorCode = errorArg.split('=')[1];
            
            const error = { code: errorCode, severity: 'HIGH' };
            const result = decider.analyzeErrorForRollback(skillName, error);
            console.log(JSON.stringify(result, null, 2));
            break;
        }
        
        case 'plan': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            const checkpointArg = args.find(a => a.startsWith('--checkpoint='));
            
            if (!skillArg) {
                console.error('Usage: node skill-rollback-decider.js plan --skill=<name> [--checkpoint=<id>]');
                process.exit(1);
            }
            
            const skillName = skillArg.split('=')[1];
            const checkpointId = checkpointArg ? checkpointArg.split('=')[1] : null;
            
            const checkpoint = checkpointId ? { id: checkpointId } : decider.findNearestCheckpoint(skillName);
            const result = decider.generateRollbackPlan(skillName, checkpoint);
            console.log(JSON.stringify(result, null, 2));
            break;
        }
        
        case 'checkpoints': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Usage: node skill-rollback-decider.js checkpoints --skill=<name>');
                process.exit(1);
            }
            
            const skillName = skillArg.split('=')[1];
            const result = decider.getCheckpoints(skillName);
            console.log(JSON.stringify(result, null, 2));
            break;
        }
        
        case 'report': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            const errorArg = args.find(a => a.startsWith('--error='));
            
            if (!skillArg) {
                console.error('Usage: node skill-rollback-decider.js report --skill=<name> [--error=<code>]');
                process.exit(1);
            }
            
            const skillName = skillArg.split('=')[1];
            const errorCode = errorArg ? errorArg.split('=')[1] : 'E001';
            
            const error = { code: errorCode, name: 'EXECUTION_ERROR', severity: 'HIGH' };
            const result = decider.generateRollbackReport(skillName, error);
            console.log(JSON.stringify(result, null, 2));
            break;
        }
        
        default:
            console.log(`
Skill Rollback Decider v1.0

Usage:
  node skill-rollback-decider.js analyze --skill=<name> --error=<code>
  node skill-rollback-decider.js plan --skill=<name> [--checkpoint=<id>]
  node skill-rollback-decider.js checkpoints --skill=<name>
  node skill-rollback-decider.js report --skill=<name> [--error=<code>]

Options:
  --verbose, -v    Enable verbose output
`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { SkillRollbackDecider };
