/**
 * Engine Test Runner
 * 引擎测试运行器
 * 
 * 功能：
 * 1. 扫描所有技能文件
 * 2. 运行所有测试套件
 * 3. 收集测试结果
 * 4. 生成测试报告
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '..', '..', '..', '.trae', 'skills');

const SEVERITY_LEVELS = {
    CRITICAL: 4,
    ERROR: 3,
    WARNING: 2,
    INFO: 1
};

const COLORS = {
    CRITICAL: '\x1b[41m\x1b[37m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    HEADER: '\x1b[35m\x1b[1m',
    RESET: '\x1b[0m',
    DIM: '\x1b[2m'
};

class TestRunner {
    
    constructor(options = {}) {
        this.verbose = options.verbose || false;
        this.skills = new Map();
        this.dependencyGraph = new Map();
        this.testResults = [];
        this.suites = new Map();
        this.startTime = null;
        this.endTime = null;
    }
    
    log(message, type = 'INFO') {
        if (this.verbose || SEVERITY_LEVELS[type] >= SEVERITY_LEVELS.WARNING) {
            const color = COLORS[type] || '';
            console.log(`${color}${message}${COLORS.RESET}`);
        }
    }
    
    printHeader(title) {
        console.log(`\n${COLORS.HEADER}═══════════════════════════════════════════════════════════════`);
        console.log(`  ${title}`);
        console.log(`═══════════════════════════════════════════════════════════════${COLORS.RESET}\n`);
    }
    
    scanSkills() {
        this.log('[1/3] Scanning skill files...', 'INFO');
        
        const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const skillName of skillDirs) {
            const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
            
            if (fs.existsSync(skillPath)) {
                try {
                    const content = fs.readFileSync(skillPath, 'utf8');
                    const header = this.parseYamlFrontmatter(content);
                    
                    if (header) {
                        this.skills.set(skillName, {
                            path: skillPath,
                            header: header,
                            content: content
                        });
                        
                        const deps = header.dependencies || [];
                        const depNames = deps.map(d => typeof d === 'string' ? d : d.name).filter(n => n);
                        this.dependencyGraph.set(skillName, depNames);
                        
                        this.log(`  Found: ${skillName} (Layer: ${header.layer ?? '?'}, Deps: ${depNames.length})`, 'INFO');
                    }
                } catch (error) {
                    this.log(`  Error reading ${skillName}: ${error.message}`, 'ERROR');
                }
            }
        }
        
        this.log(`\n  Scan complete: ${this.skills.size} skills found\n`, 'SUCCESS');
        return this.skills;
    }
    
    parseYamlFrontmatter(content) {
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            return null;
        }
        
        const frontmatter = frontmatterMatch[1];
        
        try {
            const result = yaml.load(frontmatter);
            return result;
        } catch (error) {
            this.log(`  YAML parse error: ${error.message}`, 'ERROR');
            return null;
        }
    }
    
    registerSuite(name, suite) {
        this.suites.set(name, suite);
    }
    
    async runAllSuites() {
        this.startTime = Date.now();
        
        this.printHeader('Engine Test Framework v2.0');
        
        this.scanSkills();
        
        this.log('[2/3] Running test suites...', 'INFO');
        
        const results = {
            total: this.skills.size,
            passed: 0,
            failed: 0,
            warnings: 0,
            suites: {}
        };
        
        for (const [suiteName, suite] of this.suites) {
            this.log(`\n  Running suite: ${suiteName}...`, 'INFO');
            
            const suiteResult = await suite.run(this.skills, this.dependencyGraph);
            results.suites[suiteName] = suiteResult;
            
            results.passed += suiteResult.passed;
            results.failed += suiteResult.failed;
            results.warnings += suiteResult.warnings;
            
            this.log(`    ${suiteName}: ${suiteResult.passed}/${suiteResult.total} passed`, 
                suiteResult.failed > 0 ? 'WARNING' : 'SUCCESS');
        }
        
        this.endTime = Date.now();
        results.duration = this.endTime - this.startTime;
        
        this.log('\n[3/3] Generating report...', 'INFO');
        
        return results;
    }
    
    async runSuite(suiteName) {
        const suite = this.suites.get(suiteName);
        if (!suite) {
            this.log(`Suite not found: ${suiteName}`, 'ERROR');
            return null;
        }
        
        this.scanSkills();
        return await suite.run(this.skills, this.dependencyGraph);
    }
    
    async testSkill(skillName) {
        this.scanSkills();
        
        const skillData = this.skills.get(skillName);
        if (!skillData) {
            return {
                skill: skillName,
                found: false,
                passed: false,
                results: []
            };
        }
        
        const results = {
            skill: skillName,
            found: true,
            passed: true,
            results: []
        };
        
        for (const [suiteName, suite] of this.suites) {
            const suiteResult = await suite.testSkill(skillName, skillData, this.skills, this.dependencyGraph);
            results.results.push({
                suite: suiteName,
                ...suiteResult
            });
            
            if (!suiteResult.passed) {
                results.passed = false;
            }
        }
        
        return results;
    }
    
    generateReport(results) {
        this.printHeader('Test Summary');
        
        const duration = ((results.duration || 0) / 1000).toFixed(2);
        
        console.log(`Total Skills:     ${results.total}`);
        console.log(`Duration:         ${duration}s`);
        console.log(`Passed:           ${COLORS.SUCCESS}${results.passed}${COLORS.RESET}`);
        console.log(`Failed:           ${results.failed > 0 ? COLORS.ERROR : COLORS.SUCCESS}${results.failed}${COLORS.RESET}`);
        console.log(`Warnings:         ${results.warnings > 0 ? COLORS.WARNING : COLORS.SUCCESS}${results.warnings}${COLORS.RESET}`);
        
        const totalTests = results.passed + results.failed;
        const passRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;
        console.log(`\nPass Rate:        ${passRate}% ${parseFloat(passRate) >= 80 ? '✅' : '⚠️'}`);
        
        if (results.suites) {
            console.log('\nSuite Results:');
            for (const [suiteName, suiteResult] of Object.entries(results.suites)) {
                const status = suiteResult.failed > 0 ? COLORS.WARNING : COLORS.SUCCESS;
                console.log(`  ${status}${suiteName}: ${suiteResult.passed}/${suiteResult.total} passed${COLORS.RESET}`);
            }
        }
        
        if (results.failed > 0) {
            console.log('\nFailed Tests:');
            for (const [suiteName, suiteResult] of Object.entries(results.suites || {})) {
                if (suiteResult.failures && suiteResult.failures.length > 0) {
                    for (const failure of suiteResult.failures) {
                        console.log(`  ${COLORS.ERROR}[${failure.severity}] ${failure.skill}: ${failure.test}${COLORS.RESET}`);
                        console.log(`    → ${failure.message}`);
                    }
                }
            }
        }
        
        console.log('\n');
        return results;
    }
    
    generateMarkdownReport(results, outputPath) {
        const duration = ((results.duration || 0) / 1000).toFixed(2);
        const totalTests = results.passed + results.failed;
        const passRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;
        
        let md = `# Engine Test Framework Report

## Summary

| Metric | Value |
|--------|-------|
| Total Skills | ${results.total} |
| Duration | ${duration}s |
| Passed | ${results.passed} |
| Failed | ${results.failed} |
| Warnings | ${results.warnings} |
| Pass Rate | ${passRate}% |

## Suite Results

| Suite | Passed | Failed | Warnings |
|-------|--------|--------|----------|
`;
        
        for (const [suiteName, suiteResult] of Object.entries(results.suites || {})) {
            md += `| ${suiteName} | ${suiteResult.passed} | ${suiteResult.failed} | ${suiteResult.warnings} |\n`;
        }
        
        if (results.failed > 0) {
            md += `\n## Failed Tests\n\n`;
            for (const [suiteName, suiteResult] of Object.entries(results.suites || {})) {
                if (suiteResult.failures && suiteResult.failures.length > 0) {
                    md += `### ${suiteName}\n\n`;
                    for (const failure of suiteResult.failures) {
                        md += `- **[${failure.severity}]** ${failure.skill}: ${failure.test}\n`;
                        md += `  - ${failure.message}\n`;
                    }
                }
            }
        }
        
        md += `\n---\nGenerated at: ${new Date().toISOString()}\n`;
        
        if (outputPath) {
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outputPath, md);
            this.log(`Report saved to: ${outputPath}`, 'SUCCESS');
        }
        
        return md;
    }
}

module.exports = { TestRunner, SEVERITY_LEVELS, COLORS };
