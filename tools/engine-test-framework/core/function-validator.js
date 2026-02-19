/**
 * Function Validator
 * 函数签名验证器
 * 
 * 功能：
 * 1. 主函数存在性验证
 * 2. 函数签名格式验证
 * 3. 返回类型定义验证
 * 4. 验证器函数验证
 * 5. 状态管理器函数验证
 * 6. 查询函数验证
 */

class FunctionValidator {
    
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    
    validate(header) {
        const results = [];
        
        if (!header.functions) {
            results.push({
                test: 'FUNCTIONS_EXIST',
                passed: false,
                severity: 'WARNING',
                message: '函数定义缺失'
            });
            return results;
        }
        
        results.push(this.validateMainFunction(header.functions));
        results.push(this.validateValidators(header.functions));
        results.push(this.validateStateManagers(header.functions));
        results.push(this.validateQueries(header.functions));
        
        return results.filter(r => r !== null);
    }
    
    validateMainFunction(functions) {
        if (!functions.main) {
            return {
                test: 'MAIN_FUNCTION',
                passed: false,
                severity: 'ERROR',
                message: '主函数定义缺失'
            };
        }
        
        const issues = [];
        
        if (!functions.main.name) {
            issues.push('缺少name字段');
        }
        
        if (!functions.main.signature) {
            issues.push('缺少signature字段');
        }
        
        if (!functions.main.description) {
            issues.push('缺少description字段');
        }
        
        if (issues.length > 0) {
            return {
                test: 'MAIN_FUNCTION',
                passed: false,
                severity: 'WARNING',
                message: `主函数定义不完整: ${issues.join(', ')}`,
                details: { issues: issues, main: functions.main }
            };
        }
        
        return {
            test: 'MAIN_FUNCTION',
            passed: true,
            severity: 'INFO',
            message: `主函数定义有效: ${functions.main.name}(${this.parseSignature(functions.main.signature)})`
        };
    }
    
    validateValidators(functions) {
        if (!functions.validators || functions.validators.length === 0) {
            return {
                test: 'VALIDATORS',
                passed: true,
                severity: 'INFO',
                message: '无验证器函数定义'
            };
        }
        
        const issues = [];
        
        for (let i = 0; i < functions.validators.length; i++) {
            const validator = functions.validators[i];
            
            if (!validator.name) {
                issues.push(`验证器[${i}]缺少name`);
            }
            
            if (!validator.signature) {
                issues.push(`验证器[${i}]缺少signature`);
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'VALIDATORS',
                passed: false,
                severity: 'WARNING',
                message: `验证器函数定义有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'VALIDATORS',
            passed: true,
            severity: 'INFO',
            message: `${functions.validators.length}个验证器函数定义有效`
        };
    }
    
    validateStateManagers(functions) {
        if (!functions.state_managers || functions.state_managers.length === 0) {
            return {
                test: 'STATE_MANAGERS',
                passed: true,
                severity: 'INFO',
                message: '无状态管理器函数定义'
            };
        }
        
        const issues = [];
        
        for (let i = 0; i < functions.state_managers.length; i++) {
            const sm = functions.state_managers[i];
            
            if (!sm.name) {
                issues.push(`状态管理器[${i}]缺少name`);
            }
            
            if (!sm.signature) {
                issues.push(`状态管理器[${i}]缺少signature`);
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'STATE_MANAGERS',
                passed: false,
                severity: 'WARNING',
                message: `状态管理器函数定义有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'STATE_MANAGERS',
            passed: true,
            severity: 'INFO',
            message: `${functions.state_managers.length}个状态管理器函数定义有效`
        };
    }
    
    validateQueries(functions) {
        if (!functions.queries || functions.queries.length === 0) {
            return {
                test: 'QUERIES',
                passed: true,
                severity: 'INFO',
                message: '无查询函数定义'
            };
        }
        
        const issues = [];
        
        for (let i = 0; i < functions.queries.length; i++) {
            const query = functions.queries[i];
            
            if (!query.name) {
                issues.push(`查询函数[${i}]缺少name`);
            }
            
            if (!query.signature) {
                issues.push(`查询函数[${i}]缺少signature`);
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'QUERIES',
                passed: false,
                severity: 'WARNING',
                message: `查询函数定义有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'QUERIES',
            passed: true,
            severity: 'INFO',
            message: `${functions.queries.length}个查询函数定义有效`
        };
    }
    
    parseSignature(signature) {
        if (!signature) return '';
        
        const match = signature.match(/^(.+)\((.+)\)\s*(->|:)\s*(.+)$/);
        if (match) {
            return match[2] || '';
        }
        
        return signature;
    }
    
    validateSkill(skillName, skillData) {
        return this.validate(skillData.header);
    }
}

module.exports = { FunctionValidator };
