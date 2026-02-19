/**
 * Header Validator
 * Header元数据验证器
 * 
 * 功能：
 * 1. 必填字段验证
 * 2. Layer层级约束验证
 * 3. 版本号格式验证
 * 4. 描述长度验证
 * 5. 名称匹配验证
 */

const REQUIRED_FIELDS = ['name', 'version', 'description', 'layer', 'dependencies'];

const VALID_LAYERS = [0, 1, 2, 3, 4];

const EXECUTION_MODES = ['blocking', 'parallel', 'conditional'];

const EXECUTION_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'];

const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ANTI_HALLUCINATION_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'];

const DEPENDENCY_TYPES = ['required', 'optional', 'conditional'];

class HeaderValidator {
    
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    
    validate(header, skillName) {
        const results = [];
        
        results.push(this.validateRequiredFields(header));
        results.push(this.validateLayer(header));
        results.push(this.validateVersion(header));
        results.push(this.validateDescription(header));
        results.push(this.validateNameMatch(header, skillName));
        results.push(this.validateDependencies(header));
        results.push(this.validateContracts(header));
        results.push(this.validateExecution(header));
        results.push(this.validateTracking(header));
        results.push(this.validateQuality(header));
        results.push(this.validateFunctions(header));
        
        return results.filter(r => r !== null);
    }
    
    validateRequiredFields(header) {
        const missing = [];
        
        for (const field of REQUIRED_FIELDS) {
            if (header[field] === undefined) {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            return {
                test: 'REQUIRED_FIELDS',
                passed: false,
                severity: 'ERROR',
                message: `缺少必填字段: ${missing.join(', ')}`,
                details: { missing: missing }
            };
        }
        
        return {
            test: 'REQUIRED_FIELDS',
            passed: true,
            severity: 'INFO',
            message: '所有必填字段存在'
        };
    }
    
    validateLayer(header) {
        if (header.layer === undefined) {
            return {
                test: 'LAYER_CONSTRAINT',
                passed: false,
                severity: 'ERROR',
                message: 'Layer字段缺失'
            };
        }
        
        if (!VALID_LAYERS.includes(header.layer)) {
            return {
                test: 'LAYER_CONSTRAINT',
                passed: false,
                severity: 'ERROR',
                message: `Layer值无效: ${header.layer}，必须是 0-4`,
                details: { actual: header.layer, valid: VALID_LAYERS }
            };
        }
        
        return {
            test: 'LAYER_CONSTRAINT',
            passed: true,
            severity: 'INFO',
            message: `Layer值有效: ${header.layer}`
        };
    }
    
    validateVersion(header) {
        if (!header.version) {
            return {
                test: 'VERSION_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: '版本号缺失'
            };
        }
        
        const versionPattern = /^v?\d+\.\d+(\.\d+)?$/;
        if (!versionPattern.test(header.version)) {
            return {
                test: 'VERSION_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `版本号格式无效: ${header.version}`,
                details: { actual: header.version, expected: 'v1.0.0 或 1.0.0' }
            };
        }
        
        return {
            test: 'VERSION_FORMAT',
            passed: true,
            severity: 'INFO',
            message: `版本号格式有效: ${header.version}`
        };
    }
    
    validateDescription(header) {
        if (!header.description) {
            return {
                test: 'DESCRIPTION_LENGTH',
                passed: false,
                severity: 'WARNING',
                message: '描述缺失'
            };
        }
        
        if (header.description.length > 200) {
            return {
                test: 'DESCRIPTION_LENGTH',
                passed: false,
                severity: 'WARNING',
                message: `描述过长: ${header.description.length}字符 (限制200)`,
                details: { length: header.description.length, limit: 200 }
            };
        }
        
        return {
            test: 'DESCRIPTION_LENGTH',
            passed: true,
            severity: 'INFO',
            message: `描述长度合适: ${header.description.length}字符`
        };
    }
    
    validateNameMatch(header, skillName) {
        if (!header.name) {
            return {
                test: 'NAME_MATCH',
                passed: false,
                severity: 'WARNING',
                message: '名称字段缺失'
            };
        }
        
        if (header.name !== skillName) {
            return {
                test: 'NAME_MATCH',
                passed: false,
                severity: 'WARNING',
                message: `名称不匹配: header='${header.name}', directory='${skillName}'`,
                details: { headerName: header.name, directoryName: skillName }
            };
        }
        
        return {
            test: 'NAME_MATCH',
            passed: true,
            severity: 'INFO',
            message: `名称匹配: ${header.name}`
        };
    }
    
    validateDependencies(header) {
        if (!header.dependencies) {
            return {
                test: 'DEPENDENCIES_FORMAT',
                passed: false,
                severity: 'ERROR',
                message: '依赖定义缺失'
            };
        }
        
        if (!Array.isArray(header.dependencies)) {
            return {
                test: 'DEPENDENCIES_FORMAT',
                passed: false,
                severity: 'ERROR',
                message: '依赖必须是数组'
            };
        }
        
        const issues = [];
        
        for (let i = 0; i < header.dependencies.length; i++) {
            const dep = header.dependencies[i];
            
            if (typeof dep === 'object') {
                if (!dep.name) {
                    issues.push(`依赖项[${i}]缺少name字段`);
                }
                
                if (dep.layer !== undefined && !VALID_LAYERS.includes(dep.layer)) {
                    issues.push(`依赖项[${i}]的layer无效: ${dep.layer}`);
                }
                
                if (dep.type && !DEPENDENCY_TYPES.includes(dep.type)) {
                    issues.push(`依赖项[${i}]的type无效: ${dep.type}`);
                }
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'DEPENDENCIES_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `依赖定义有问题: ${issues.join('; ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'DEPENDENCIES_FORMAT',
            passed: true,
            severity: 'INFO',
            message: `依赖定义有效: ${header.dependencies.length}个依赖`
        };
    }
    
    validateContracts(header) {
        if (!header.contracts) {
            return {
                test: 'CONTRACTS_FORMAT',
                passed: false,
                severity: 'ERROR',
                message: '契约定义缺失'
            };
        }
        
        const issues = [];
        
        if (!header.contracts.input) {
            issues.push('输入契约缺失');
        }
        
        if (!header.contracts.output) {
            issues.push('输出契约缺失');
        }
        
        if (issues.length > 0) {
            return {
                test: 'CONTRACTS_FORMAT',
                passed: false,
                severity: 'ERROR',
                message: `契约定义不完整: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'CONTRACTS_FORMAT',
            passed: true,
            severity: 'INFO',
            message: '契约定义完整'
        };
    }
    
    validateExecution(header) {
        if (!header.execution) {
            return {
                test: 'EXECUTION_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: '执行配置缺失'
            };
        }
        
        const issues = [];
        
        if (header.execution.mode && !EXECUTION_MODES.includes(header.execution.mode)) {
            issues.push(`执行模式无效: ${header.execution.mode}`);
        }
        
        if (header.execution.rollback && header.execution.rollback.supported === undefined) {
            issues.push('回滚支持状态未定义');
        }
        
        if (issues.length > 0) {
            return {
                test: 'EXECUTION_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `执行配置有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'EXECUTION_FORMAT',
            passed: true,
            severity: 'INFO',
            message: `执行配置有效: mode=${header.execution.mode || 'default'}`
        };
    }
    
    validateTracking(header) {
        if (!header.tracking) {
            return {
                test: 'TRACKING_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: '状态追踪配置缺失'
            };
        }
        
        const issues = [];
        
        if (header.tracking.execution_status) {
            const current = header.tracking.execution_status.current;
            if (current && !EXECUTION_STATUS_VALUES.includes(current)) {
                issues.push(`执行状态无效: ${current}`);
            }
        }
        
        if (header.tracking.error_codes && Array.isArray(header.tracking.error_codes)) {
            for (let i = 0; i < header.tracking.error_codes.length; i++) {
                const ec = header.tracking.error_codes[i];
                if (ec.severity && !SEVERITY_LEVELS.includes(ec.severity)) {
                    issues.push(`错误码[${i}]的severity无效: ${ec.severity}`);
                }
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'TRACKING_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `状态追踪配置有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'TRACKING_FORMAT',
            passed: true,
            severity: 'INFO',
            message: '状态追踪配置有效'
        };
    }
    
    validateQuality(header) {
        if (!header.quality) {
            return null;
        }
        
        const issues = [];
        
        if (header.quality.testing && header.quality.testing.anti_hallucination) {
            const ah = header.quality.testing.anti_hallucination;
            if (ah.level && !ANTI_HALLUCINATION_LEVELS.includes(ah.level)) {
                issues.push(`反幻觉级别无效: ${ah.level}`);
            }
        }
        
        if (header.quality.acceptance_criteria && Array.isArray(header.quality.acceptance_criteria)) {
            for (let i = 0; i < header.quality.acceptance_criteria.length; i++) {
                const ac = header.quality.acceptance_criteria[i];
                if (!ac.id) {
                    issues.push(`验收标准[${i}]缺少id`);
                }
                if (!ac.metric) {
                    issues.push(`验收标准[${i}]缺少metric`);
                }
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'QUALITY_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `质量配置有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'QUALITY_FORMAT',
            passed: true,
            severity: 'INFO',
            message: '质量配置有效'
        };
    }
    
    validateFunctions(header) {
        if (!header.functions) {
            return null;
        }
        
        const issues = [];
        
        if (!header.functions.main) {
            issues.push('缺少主函数定义');
        } else {
            if (!header.functions.main.name) {
                issues.push('主函数缺少name');
            }
            if (!header.functions.main.signature) {
                issues.push('主函数缺少signature');
            }
        }
        
        if (issues.length > 0) {
            return {
                test: 'FUNCTIONS_FORMAT',
                passed: false,
                severity: 'WARNING',
                message: `函数定义有问题: ${issues.join(', ')}`,
                details: { issues: issues }
            };
        }
        
        return {
            test: 'FUNCTIONS_FORMAT',
            passed: true,
            severity: 'INFO',
            message: `函数定义有效: main=${header.functions.main?.name || 'N/A'}`
        };
    }
}

module.exports = { HeaderValidator, REQUIRED_FIELDS, VALID_LAYERS };
