/**
 * Dependency Validator
 * 依赖关系验证器
 * 
 * 功能：
 * 1. 循环依赖检测
 * 2. Layer层级约束验证
 * 3. 依赖存在性验证
 * 4. 依赖类型验证
 */

const { VALID_LAYERS } = require('./header-validator');

class DependencyValidator {
    
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    
    detectCircularDependencies(skills, dependencyGraph) {
        const cycles = [];
        const visited = new Set();
        const recStack = new Set();
        
        const dfs = (node, path) => {
            visited.add(node);
            recStack.add(node);
            
            const deps = dependencyGraph.get(node) || [];
            for (const dep of deps) {
                if (!skills.has(dep)) continue;
                
                if (!visited.has(dep)) {
                    const result = dfs(dep, [...path, node]);
                    if (result) return result;
                } else if (recStack.has(dep)) {
                    const cycleStart = path.indexOf(dep);
                    const cycle = [...path.slice(cycleStart), node, dep];
                    return cycle;
                }
            }
            
            recStack.delete(node);
            return null;
        };
        
        for (const skillName of skills.keys()) {
            if (!visited.has(skillName)) {
                const cycle = dfs(skillName, []);
                if (cycle) {
                    cycles.push(cycle);
                }
            }
        }
        
        return cycles;
    }
    
    validateLayerConstraints(skills) {
        const violations = [];
        
        for (const [skillName, skillData] of skills) {
            const skillLayer = skillData.header.layer;
            
            if (skillLayer === undefined) {
                continue;
            }
            
            const deps = skillData.header.dependencies || [];
            for (const dep of deps) {
                const depName = typeof dep === 'string' ? dep : dep.name;
                const depLayer = typeof dep === 'object' ? dep.layer : undefined;
                
                if (!depName) continue;
                
                const depSkill = skills.get(depName);
                const actualDepLayer = depLayer ?? depSkill?.header?.layer;
                
                if (actualDepLayer !== undefined && actualDepLayer > skillLayer) {
                    violations.push({
                        skill: skillName,
                        skillLayer: skillLayer,
                        dependency: depName,
                        dependencyLayer: actualDepLayer,
                        message: `Layer ${skillLayer} 技能依赖了 Layer ${actualDepLayer} 技能`
                    });
                }
            }
        }
        
        return violations;
    }
    
    validateDependencyExistence(skills) {
        const missing = [];
        
        for (const [skillName, skillData] of skills) {
            const deps = skillData.header.dependencies || [];
            
            for (const dep of deps) {
                const depName = typeof dep === 'string' ? dep : dep.name;
                const depType = typeof dep === 'object' ? dep.type : 'required';
                
                if (!depName) continue;
                
                if (!skills.has(depName)) {
                    missing.push({
                        skill: skillName,
                        dependency: depName,
                        type: depType,
                        message: `依赖的技能不存在: ${depName}`
                    });
                }
            }
        }
        
        return missing;
    }
    
    validateDependencyTypes(skills) {
        const issues = [];
        const validTypes = ['required', 'optional', 'conditional'];
        
        for (const [skillName, skillData] of skills) {
            const deps = skillData.header.dependencies || [];
            
            for (let i = 0; i < deps.length; i++) {
                const dep = deps[i];
                
                if (typeof dep === 'object') {
                    if (dep.type && !validTypes.includes(dep.type)) {
                        issues.push({
                            skill: skillName,
                            dependencyIndex: i,
                            invalidType: dep.type,
                            message: `依赖类型无效: ${dep.type}`
                        });
                    }
                }
            }
        }
        
        return issues;
    }
    
    validate(skills, dependencyGraph) {
        const results = [];
        
        const cycles = this.detectCircularDependencies(skills, dependencyGraph);
        if (cycles.length > 0) {
            for (const cycle of cycles) {
                results.push({
                    test: 'CIRCULAR_DEPENDENCY',
                    passed: false,
                    severity: 'CRITICAL',
                    message: `检测到循环依赖: ${cycle.join(' → ')}`,
                    details: { cycle: cycle }
                });
            }
        } else {
            results.push({
                test: 'CIRCULAR_DEPENDENCY',
                passed: true,
                severity: 'INFO',
                message: '无循环依赖'
            });
        }
        
        const layerViolations = this.validateLayerConstraints(skills);
        if (layerViolations.length > 0) {
            for (const violation of layerViolations) {
                results.push({
                    test: 'LAYER_VIOLATION',
                    passed: false,
                    severity: 'ERROR',
                    skill: violation.skill,
                    message: violation.message,
                    details: violation
                });
            }
        } else {
            results.push({
                test: 'LAYER_VIOLATION',
                passed: true,
                severity: 'INFO',
                message: 'Layer层级约束满足'
            });
        }
        
        const missingDeps = this.validateDependencyExistence(skills);
        if (missingDeps.length > 0) {
            for (const missing of missingDeps) {
                results.push({
                    test: 'DEPENDENCY_EXISTS',
                    passed: false,
                    severity: missing.type === 'required' ? 'ERROR' : 'WARNING',
                    skill: missing.skill,
                    message: missing.message,
                    details: missing
                });
            }
        } else {
            results.push({
                test: 'DEPENDENCY_EXISTS',
                passed: true,
                severity: 'INFO',
                message: '所有依赖存在'
            });
        }
        
        const typeIssues = this.validateDependencyTypes(skills);
        if (typeIssues.length > 0) {
            for (const issue of typeIssues) {
                results.push({
                    test: 'DEPENDENCY_TYPE',
                    passed: false,
                    severity: 'WARNING',
                    skill: issue.skill,
                    message: issue.message,
                    details: issue
                });
            }
        } else {
            results.push({
                test: 'DEPENDENCY_TYPE',
                passed: true,
                severity: 'INFO',
                message: '所有依赖类型有效'
            });
        }
        
        return results;
    }
    
    validateSkill(skillName, skillData, skills, dependencyGraph) {
        const results = [];
        
        const deps = skillData.header.dependencies || [];
        const skillLayer = skillData.header.layer;
        
        for (const dep of deps) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            const depLayer = typeof dep === 'object' ? dep.layer : undefined;
            const depType = typeof dep === 'object' ? dep.type : 'required';
            
            if (!depName) continue;
            
            const depSkill = skills.get(depName);
            
            if (!depSkill) {
                results.push({
                    test: 'DEPENDENCY_EXISTS',
                    passed: false,
                    severity: depType === 'required' ? 'ERROR' : 'WARNING',
                    message: `依赖不存在: ${depName}`
                });
                continue;
            }
            
            const actualDepLayer = depLayer ?? depSkill.header?.layer;
            if (actualDepLayer !== undefined && skillLayer !== undefined && actualDepLayer > skillLayer) {
                results.push({
                    test: 'LAYER_VIOLATION',
                    passed: false,
                    severity: 'ERROR',
                    message: `Layer违规: 依赖 ${depName} (Layer ${actualDepLayer}) > 当前 (Layer ${skillLayer})`
                });
            }
        }
        
        const cycles = this.detectCircularDependenciesForSkill(skillName, skills, dependencyGraph);
        if (cycles.length > 0) {
            results.push({
                test: 'CIRCULAR_DEPENDENCY',
                passed: false,
                severity: 'CRITICAL',
                message: `检测到循环依赖: ${cycles.map(c => c.join(' → ')).join(', ')}`
            });
        }
        
        if (results.length === 0) {
            results.push({
                test: 'DEPENDENCY_VALIDATION',
                passed: true,
                severity: 'INFO',
                message: '依赖验证通过'
            });
        }
        
        return results;
    }
    
    detectCircularDependenciesForSkill(startSkill, skills, dependencyGraph) {
        const cycles = [];
        const visited = new Set();
        const recStack = new Set();
        
        const dfs = (node, path) => {
            visited.add(node);
            recStack.add(node);
            
            const deps = dependencyGraph.get(node) || [];
            for (const dep of deps) {
                if (!skills.has(dep)) continue;
                
                if (!visited.has(dep)) {
                    const result = dfs(dep, [...path, node]);
                    if (result) return result;
                } else if (recStack.has(dep)) {
                    const cycleStart = path.indexOf(dep);
                    const cycle = [...path.slice(cycleStart), node, dep];
                    return cycle;
                }
            }
            
            recStack.delete(node);
            return null;
        };
        
        const cycle = dfs(startSkill, []);
        if (cycle) {
            cycles.push(cycle);
        }
        
        return cycles;
    }
}

module.exports = { DependencyValidator };
