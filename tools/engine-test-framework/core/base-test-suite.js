/**
 * Base Test Suite
 * 测试套件基类
 */

const { SEVERITY_LEVELS, COLORS } = require('./test-runner');

class BaseTestSuite {
    
    constructor(name, options = {}) {
        this.name = name;
        this.verbose = options.verbose || false;
    }
    
    log(message, type = 'INFO') {
        if (this.verbose || SEVERITY_LEVELS[type] >= SEVERITY_LEVELS.WARNING) {
            const color = COLORS[type] || '';
            console.log(`${color}${message}${COLORS.RESET}`);
        }
    }
    
    createResult(test, skill, passed, severity, message, details = null) {
        return {
            test: test,
            skill: skill,
            passed: passed,
            severity: severity,
            message: message,
            details: details
        };
    }
    
    async run(skills, dependencyGraph) {
        throw new Error('run() must be implemented by subclass');
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        throw new Error('testSkill() must be implemented by subclass');
    }
    
    aggregateResults(results) {
        const summary = {
            total: results.length,
            passed: 0,
            failed: 0,
            warnings: 0,
            failures: []
        };
        
        for (const result of results) {
            if (result.passed) {
                summary.passed++;
            } else {
                summary.failed++;
                summary.failures.push(result);
            }
            
            if (result.severity === 'WARNING' && !result.passed) {
                summary.warnings++;
            }
        }
        
        return summary;
    }
}

module.exports = { BaseTestSuite };
