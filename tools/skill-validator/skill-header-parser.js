/**
 * Skill Header Parser
 * 技能头部元数据解析器
 * 
 * 功能：
 * 1. 解析SKILL.md文件的YAML frontmatter
 * 2. 验证头部元数据完整性
 * 3. 检查依赖层级关系
 * 4. 检测循环依赖
 * 
 * 用法：
 *   node skill-header-parser.js parse --skill=<skill-name>
 *   node skill-header-parser.js validate --skill=<skill-name>
 *   node skill-header-parser.js validate-all
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.trae', 'skills');

const REQUIRED_FIELDS = [
    'name',
    'version', 
    'description',
    'layer',
    'dependencies'
];

const VALID_LAYERS = [0, 1, 2, 3, 4];

const EXECUTION_MODES = ['blocking', 'parallel', 'conditional'];

const EXECUTION_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK'];

const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ANTI_HALLUCINATION_LEVELS = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'];

const DEPENDENCY_TYPES = ['required', 'optional', 'conditional'];

class SkillHeaderParser {
    
    constructor(verbose = false) {
        this.verbose = verbose;
        this.skills = new Map();
        this.dependencyGraph = new Map();
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
    
    parseYamlFrontmatter(content) {
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            return null;
        }
        
        const frontmatter = frontmatterMatch[1];
        const result = {};
        
        const lines = frontmatter.split('\n');
        let currentKey = null;
        let currentArray = null;
        let arrayDepth = 0;
        let inNestedObject = false;
        let nestedKey = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            
            const indent = line.search(/\S/);
            
            if (trimmedLine.includes(':') && !trimmedLine.startsWith('-')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(0, colonIndex).trim();
                let value = trimmedLine.substring(colonIndex + 1).trim();
                
                if (value === '' || value.startsWith('[')) {
                    if (value === '') {
                        if (indent === 0) {
                            currentKey = key;
                            result[key] = [];
                            currentArray = result[key];
                            arrayDepth = 0;
                        } else {
                            if (!result[currentKey]) {
                                result[currentKey] = {};
                            }
                            result[currentKey][key] = [];
                            nestedKey = key;
                            currentArray = result[currentKey][key];
                            inNestedObject = true;
                        }
                    } else if (value === '[]') {
                        if (indent === 0) {
                            result[key] = [];
                        } else if (inNestedObject && currentKey) {
                            if (!result[currentKey]) result[currentKey] = {};
                            result[currentKey][key] = [];
                        }
                    }
                } else {
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.slice(1, -1);
                    }
                    
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (value === 'null') value = null;
                    else if (!isNaN(value) && value !== '') {
                        value = Number(value);
                    }
                    
                    if (indent === 0) {
                        result[key] = value;
                        currentKey = key;
                        inNestedObject = false;
                    } else if (inNestedObject && currentKey) {
                        if (!result[currentKey]) result[currentKey] = {};
                        result[currentKey][key] = value;
                    }
                }
            } else if (trimmedLine.startsWith('- ')) {
                const item = trimmedLine.substring(2).trim();
                
                if (currentArray && Array.isArray(currentArray)) {
                    if (item.includes(':')) {
                        const obj = {};
                        const pairs = item.split(',').map(p => p.trim());
                        let firstKey = null;
                        
                        for (const pair of pairs) {
                            const [k, v] = pair.split(':').map(s => s.trim());
                            if (k && v !== undefined) {
                                let cleanValue = v;
                                if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
                                    cleanValue = cleanValue.slice(1, -1);
                                }
                                obj[k] = cleanValue;
                                if (!firstKey) firstKey = k;
                            }
                        }
                        
                        if (Object.keys(obj).length > 0) {
                            currentArray.push(obj);
                        }
                    } else {
                        let cleanItem = item;
                        if (cleanItem.startsWith('"') && cleanItem.endsWith('"')) {
                            cleanItem = cleanItem.slice(1, -1);
                        } else if (cleanItem.startsWith("'") && cleanItem.endsWith("'")) {
                            cleanItem = cleanItem.slice(1, -1);
                        }
                        currentArray.push(cleanItem);
                    }
                }
            }
        }
        
        return result;
    }
    
    parseSkillFile(skillPath) {
        try {
            const content = fs.readFileSync(skillPath, 'utf8');
            const header = this.parseYamlFrontmatter(content);
            
            if (!header) {
                return {
                    success: false,
                    error: 'No YAML frontmatter found',
                    path: skillPath
                };
            }
            
            return {
                success: true,
                header: header,
                path: skillPath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                path: skillPath
            };
        }
    }
    
    validateHeader(header, skillName) {
        const errors = [];
        const warnings = [];
        
        for (const field of REQUIRED_FIELDS) {
            if (header[field] === undefined) {
                errors.push({
                    field: field,
                    error: 'REQUIRED_FIELD_MISSING',
                    message: `必需字段 '${field}' 缺失`
                });
            }
        }
        
        if (header.name && header.name !== skillName) {
            warnings.push({
                field: 'name',
                warning: 'NAME_MISMATCH',
                message: `技能名称 '${header.name}' 与目录名 '${skillName}' 不一致`
            });
        }
        
        if (header.layer !== undefined) {
            if (!VALID_LAYERS.includes(header.layer)) {
                errors.push({
                    field: 'layer',
                    error: 'INVALID_LAYER',
                    message: `层级 '${header.layer}' 无效，必须是 0-4`
                });
            }
        }
        
        if (header.version) {
            const versionPattern = /^v?\d+\.\d+(\.\d+)?$/;
            if (!versionPattern.test(header.version)) {
                warnings.push({
                    field: 'version',
                    warning: 'INVALID_VERSION_FORMAT',
                    message: `版本号 '${header.version}' 格式不符合语义化版本规范`
                });
            }
        }
        
        if (header.description && header.description.length > 200) {
            warnings.push({
                field: 'description',
                warning: 'DESCRIPTION_TOO_LONG',
                message: `描述长度 ${header.description.length} 超过200字符`
            });
        }
        
        if (header.dependencies) {
            if (!Array.isArray(header.dependencies)) {
                errors.push({
                    field: 'dependencies',
                    error: 'INVALID_TYPE',
                    message: 'dependencies 必须是数组'
                });
            } else {
                for (let i = 0; i < header.dependencies.length; i++) {
                    const dep = header.dependencies[i];
                    if (typeof dep === 'object') {
                        if (!dep.name) {
                            errors.push({
                                field: `dependencies[${i}]`,
                                error: 'DEPENDENCY_NAME_MISSING',
                                message: `依赖项 ${i} 缺少 name 字段`
                            });
                        }
                        if (dep.layer !== undefined && !VALID_LAYERS.includes(dep.layer)) {
                            errors.push({
                                field: `dependencies[${i}].layer`,
                                error: 'INVALID_LAYER',
                                message: `依赖项 ${i} 的层级 '${dep.layer}' 无效`
                            });
                        }
                        if (dep.type && !DEPENDENCY_TYPES.includes(dep.type)) {
                            warnings.push({
                                field: `dependencies[${i}].type`,
                                warning: 'INVALID_DEPENDENCY_TYPE',
                                message: `依赖项 ${i} 的类型 '${dep.type}' 无效`
                            });
                        }
                    }
                }
            }
        }
        
        if (header.contracts) {
            if (!header.contracts.input) {
                errors.push({
                    field: 'contracts.input',
                    error: 'REQUIRED_FIELD_MISSING',
                    message: '输入契约缺失'
                });
            }
            if (!header.contracts.output) {
                errors.push({
                    field: 'contracts.output',
                    error: 'REQUIRED_FIELD_MISSING',
                    message: '输出契约缺失'
                });
            }
        } else {
            errors.push({
                field: 'contracts',
                error: 'REQUIRED_FIELD_MISSING',
                message: '契约定义缺失'
            });
        }
        
        if (header.execution) {
            if (header.execution.mode && !EXECUTION_MODES.includes(header.execution.mode)) {
                errors.push({
                    field: 'execution.mode',
                    error: 'INVALID_EXECUTION_MODE',
                    message: `执行模式 '${header.execution.mode}' 无效`
                });
            }
            
            if (header.execution.rollback && header.execution.rollback.supported === undefined) {
                warnings.push({
                    field: 'execution.rollback.supported',
                    warning: 'ROLLBACK_SUPPORT_UNDEFINED',
                    message: '回滚支持状态未定义'
                });
            }
        }
        
        if (header.tracking && header.tracking.execution_status) {
            if (header.tracking.execution_status.current && 
                !EXECUTION_STATUS_VALUES.includes(header.tracking.execution_status.current)) {
                errors.push({
                    field: 'tracking.execution_status.current',
                    error: 'INVALID_STATUS',
                    message: `执行状态 '${header.tracking.execution_status.current}' 无效`
                });
            }
        }
        
        if (header.quality && header.quality.testing && header.quality.testing.anti_hallucination) {
            const ah = header.quality.testing.anti_hallucination;
            if (ah.level && !ANTI_HALLUCINATION_LEVELS.includes(ah.level)) {
                warnings.push({
                    field: 'quality.testing.anti_hallucination.level',
                    warning: 'INVALID_ANTI_HALLUCINATION_LEVEL',
                    message: `反幻觉级别 '${ah.level}' 无效`
                });
            }
        }
        
        if (header.error_codes && Array.isArray(header.error_codes)) {
            for (let i = 0; i < header.error_codes.length; i++) {
                const ec = header.error_codes[i];
                if (ec.severity && !SEVERITY_LEVELS.includes(ec.severity)) {
                    warnings.push({
                        field: `error_codes[${i}].severity`,
                        warning: 'INVALID_SEVERITY',
                        message: `错误码 ${i} 的严重程度 '${ec.severity}' 无效`
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
    
    scanAllSkills() {
        this.log('\n========================================', 'header');
        this.log('  Skill Header Parser v1.0', 'header');
        this.log('========================================\n', 'header');
        
        this.log('[1/3] Scanning skill files...', 'info');
        
        const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const skillName of skillDirs) {
            const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
            
            if (fs.existsSync(skillPath)) {
                const result = this.parseSkillFile(skillPath);
                
                if (result.success) {
                    this.skills.set(skillName, {
                        path: skillPath,
                        header: result.header
                    });
                    
                    const deps = result.header.dependencies || [];
                    const depNames = deps.map(d => typeof d === 'string' ? d : d.name).filter(n => n);
                    this.dependencyGraph.set(skillName, depNames);
                    
                    this.log(`  Found: ${skillName} (Layer: ${result.header.layer ?? '?'}, Deps: ${depNames.length})`, 'info');
                } else {
                    this.log(`  Error: ${skillName} - ${result.error}`, 'error');
                }
            }
        }
        
        this.log(`\n  Scan complete: ${this.skills.size} skills found\n`, 'success');
        
        return this.skills;
    }
    
    detectCircularDependencies() {
        this.log('[2/3] Detecting circular dependencies...', 'info');
        
        const visited = new Set();
        const recStack = new Set();
        const cycles = [];
        
        const dfs = (node, path) => {
            visited.add(node);
            recStack.add(node);
            
            const deps = this.dependencyGraph.get(node) || [];
            for (const dep of deps) {
                if (!this.skills.has(dep)) continue;
                
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
        
        for (const skillName of this.skills.keys()) {
            if (!visited.has(skillName)) {
                const cycle = dfs(skillName, []);
                if (cycle) {
                    cycles.push(cycle);
                }
            }
        }
        
        if (cycles.length === 0) {
            this.log('  No circular dependencies found\n', 'success');
        } else {
            this.log(`  Found ${cycles.length} circular dependencies!\n`, 'error');
            for (const cycle of cycles) {
                this.log(`    Cycle: ${cycle.join(' -> ')}`, 'error');
            }
        }
        
        return cycles;
    }
    
    validateLayerConstraints() {
        this.log('[3/3] Validating layer constraints...', 'info');
        
        const violations = [];
        
        for (const [skillName, skillData] of this.skills) {
            const skillLayer = skillData.header.layer;
            
            if (skillLayer === undefined) {
                continue;
            }
            
            const deps = skillData.header.dependencies || [];
            for (const dep of deps) {
                const depName = typeof dep === 'string' ? dep : dep.name;
                const depLayer = typeof dep === 'object' ? dep.layer : undefined;
                
                if (!depName) continue;
                
                const depSkill = this.skills.get(depName);
                const actualDepLayer = depLayer ?? depSkill?.header?.layer;
                
                if (actualDepLayer !== undefined && actualDepLayer > skillLayer) {
                    violations.push({
                        skill: skillName,
                        skillLayer: skillLayer,
                        dependency: depName,
                        dependencyLayer: actualDepLayer
                    });
                }
            }
        }
        
        if (violations.length === 0) {
            this.log('  No layer violations found\n', 'success');
        } else {
            this.log(`  Found ${violations.length} layer violations!\n`, 'error');
            for (const v of violations) {
                this.log(`    ${v.skill} (Layer ${v.skillLayer}) -> ${v.dependency} (Layer ${v.dependencyLayer})`, 'error');
            }
        }
        
        return violations;
    }
    
    validateSkill(skillName) {
        const skillData = this.skills.get(skillName);
        
        if (!skillData) {
            return {
                skill: skillName,
                found: false,
                valid: false,
                errors: [{ error: 'SKILL_NOT_FOUND', message: `技能 '${skillName}' 不存在` }],
                warnings: []
            };
        }
        
        const validation = this.validateHeader(skillData.header, skillName);
        
        return {
            skill: skillName,
            found: true,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            header: skillData.header
        };
    }
    
    validateAll() {
        this.scanAllSkills();
        this.detectCircularDependencies();
        this.validateLayerConstraints();
        
        const results = {
            total: this.skills.size,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        
        for (const [skillName, skillData] of this.skills) {
            const validation = this.validateHeader(skillData.header, skillName);
            
            const detail = {
                skill: skillName,
                layer: skillData.header.layer,
                valid: validation.valid,
                errorCount: validation.errors.length,
                warningCount: validation.warnings.length,
                errors: validation.errors,
                warnings: validation.warnings
            };
            
            results.details.push(detail);
            
            if (validation.valid) {
                results.passed++;
            } else {
                results.failed++;
            }
            results.warnings += validation.warnings.length;
        }
        
        return results;
    }
    
    generateReport(results) {
        this.log('\n========================================', 'header');
        this.log('  Validation Summary', 'header');
        this.log('========================================\n', 'header');
        
        this.log(`Total skills: ${results.total}`, 'info');
        this.log(`Passed: ${results.passed}`, 'success');
        this.log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
        this.log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'warning' : 'success');
        
        if (results.failed > 0) {
            this.log('\nFailed Skills:', 'error');
            for (const detail of results.details) {
                if (!detail.valid) {
                    this.log(`\n  [${detail.layer ?? '?'}] ${detail.skill}`, 'error');
                    for (const err of detail.errors) {
                        this.log(`    - ${err.field}: ${err.message}`, 'error');
                    }
                }
            }
        }
        
        if (results.warnings > 0) {
            this.log('\nWarnings:', 'warning');
            for (const detail of results.details) {
                if (detail.warningCount > 0) {
                    this.log(`\n  ${detail.skill}:`, 'warning');
                    for (const warn of detail.warnings) {
                        this.log(`    - ${warn.field}: ${warn.message}`, 'warning');
                    }
                }
            }
        }
        
        this.log('\n========================================', 'header');
        this.log('  Dependency Graph', 'header');
        this.log('========================================\n', 'header');
        
        for (const [skillName, skillData] of this.skills) {
            const layer = skillData.header.layer ?? '?';
            const deps = this.dependencyGraph.get(skillName) || [];
            
            if (deps.length > 0) {
                this.log(`[${layer}] ${skillName} -> (${deps.join(', ')})`, 'info');
            } else {
                this.log(`[${layer}] ${skillName} (no deps)`, 'info');
            }
        }
        
        this.log('\nValidation complete!\n', 'success');
        
        return results;
    }
    
    getSkillHeader(skillName) {
        const skillData = this.skills.get(skillName);
        return skillData ? skillData.header : null;
    }
    
    getDependencyGraph() {
        return Object.fromEntries(this.dependencyGraph);
    }
}

function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const verbose = args.includes('--verbose') || args.includes('-v');
    
    const parser = new SkillHeaderParser(verbose);
    
    switch (command) {
        case 'parse': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Usage: node skill-header-parser.js parse --skill=<skill-name>');
                process.exit(1);
            }
            const skillName = skillArg.split('=')[1];
            const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
            
            const result = parser.parseSkillFile(skillPath);
            if (result.success) {
                console.log(JSON.stringify(result.header, null, 2));
            } else {
                console.error(`Error: ${result.error}`);
                process.exit(1);
            }
            break;
        }
        
        case 'validate': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Usage: node skill-header-parser.js validate --skill=<skill-name>');
                process.exit(1);
            }
            const skillName = skillArg.split('=')[1];
            
            parser.scanAllSkills();
            const result = parser.validateSkill(skillName);
            
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.valid ? 0 : 1);
            break;
        }
        
        case 'validate-all': {
            const results = parser.validateAll();
            parser.generateReport(results);
            process.exit(results.failed > 0 ? 1 : 0);
            break;
        }
        
        case 'graph': {
            parser.scanAllSkills();
            const graph = parser.getDependencyGraph();
            console.log(JSON.stringify(graph, null, 2));
            break;
        }
        
        default:
            console.log(`
Skill Header Parser v1.0

Usage:
  node skill-header-parser.js parse --skill=<name>     Parse a single skill header
  node skill-header-parser.js validate --skill=<name>  Validate a single skill
  node skill-header-parser.js validate-all             Validate all skills
  node skill-header-parser.js graph                    Output dependency graph

Options:
  --verbose, -v    Enable verbose output
`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { SkillHeaderParser };
