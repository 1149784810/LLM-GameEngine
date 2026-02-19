#!/usr/bin/env node
/**
 * Engine Test Framework CLI
 * 引擎测试框架命令行入口
 * 
 * 用法：
 *   node cli.js test-all
 *   node cli.js test --skill=<name>
 *   node cli.js suite --name=<suite>
 *   node cli.js report --output=<path>
 */

const path = require('path');
const { TestRunner, COLORS } = require('./core/test-runner');
const { HeaderTestSuite } = require('./suites/header-test-suite');
const { DependencyTestSuite } = require('./suites/dependency-test-suite');
const { FunctionTestSuite } = require('./suites/function-test-suite');
const { BlockageTestSuite } = require('./suites/blockage-test-suite');
const { ParallelStageTestSuite } = require('./suites/parallel-stage-test-suite');
const { AgentDispatchTestSuite } = require('./suites/agent-dispatch-test-suite');
const { QAStageTestSuite } = require('./suites/qa-stage-test-suite');

function printHelp() {
    console.log(`
${COLORS.HEADER}Engine Test Framework v2.0${COLORS.RESET}

Usage:
  node cli.js <command> [options]

Commands:
  test-all                  Run all tests on all skills
  test --skill=<name>       Run all tests on a single skill
  suite --name=<suite>      Run a specific test suite
  report --output=<path>    Generate markdown report

Suites:
  header        Header metadata validation
  dependency    Dependency relationship validation
  function      Function signature validation
  blockage      Blockage point definition validation
  parallel      Parallel stage definition validation
  agent-dispatch Agent dispatch record validation
  qa-stage      QA test stage validation (anti-hallucination, evidence, regression) ⭐新增
  flow          Run blockage + parallel + agent-dispatch (flow validation)
  qa            Run qa-stage (QA validation) ⭐新增
  all           Run all suites

Options:
  --verbose, -v    Enable verbose output
  --json           Output as JSON only

Examples:
  node cli.js test-all
  node cli.js test --skill=contract-validator
  node cli.js suite --name=header
  node cli.js suite --name=flow
  node cli.js test-all --json > results.json
`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        process.exit(0);
    }
    
    const command = args[0];
    const verbose = args.includes('--verbose') || args.includes('-v');
    const jsonOnly = args.includes('--json');
    
    const runner = new TestRunner({ verbose: verbose && !jsonOnly });
    
    runner.registerSuite('header', new HeaderTestSuite({ verbose }));
    runner.registerSuite('dependency', new DependencyTestSuite({ verbose }));
    runner.registerSuite('function', new FunctionTestSuite({ verbose }));
    runner.registerSuite('blockage', new BlockageTestSuite({ verbose }));
    runner.registerSuite('parallel', new ParallelStageTestSuite({ verbose }));
    runner.registerSuite('agent-dispatch', new AgentDispatchTestSuite({ verbose }));
    runner.registerSuite('qa-stage', new QAStageTestSuite({ verbose }));
    
    let exitCode = 0;
    
    switch (command) {
        case 'test-all': {
            const results = await runner.runAllSuites();
            
            if (jsonOnly) {
                console.log(JSON.stringify(results, null, 2));
            } else {
                runner.generateReport(results);
            }
            
            exitCode = results.failed > 0 ? 1 : 0;
            break;
        }
        
        case 'test': {
            const skillArg = args.find(a => a.startsWith('--skill='));
            if (!skillArg) {
                console.error('Error: --skill=<name> required');
                process.exit(1);
            }
            
            const skillName = skillArg.split('=')[1];
            const results = await runner.testSkill(skillName);
            
            if (jsonOnly) {
                console.log(JSON.stringify(results, null, 2));
            } else {
                console.log(`\nTest Results for ${skillName}:`);
                console.log(`  Passed: ${results.passed ? 'YES' : 'NO'}`);
                
                for (const r of results.results) {
                    const status = r.passed ? `${COLORS.SUCCESS}✓${COLORS.RESET}` : `${COLORS.ERROR}✗${COLORS.RESET}`;
                    console.log(`  ${status} ${r.suite}: ${r.passed}/${r.passed + r.failed}`);
                }
            }
            
            exitCode = results.passed ? 0 : 1;
            break;
        }
        
        case 'suite': {
            const suiteArg = args.find(a => a.startsWith('--name='));
            if (!suiteArg) {
                console.error('Error: --name=<suite> required');
                process.exit(1);
            }
            
            const suiteName = suiteArg.split('=')[1];
            let results;
            
            if (suiteName === 'all') {
                results = await runner.runAllSuites();
            } else if (suiteName === 'flow') {
                runner.suites.clear();
                runner.registerSuite('blockage', new BlockageTestSuite({ verbose }));
                runner.registerSuite('parallel', new ParallelStageTestSuite({ verbose }));
                runner.registerSuite('agent-dispatch', new AgentDispatchTestSuite({ verbose }));
                results = await runner.runAllSuites();
            } else if (suiteName === 'qa') {
                runner.suites.clear();
                runner.registerSuite('qa-stage', new QAStageTestSuite({ verbose }));
                results = await runner.runAllSuites();
            } else {
                results = await runner.runSuite(suiteName);
            }
            
            if (!results) {
                console.error(`Suite not found: ${suiteName}`);
                process.exit(1);
            }
            
            if (jsonOnly) {
                console.log(JSON.stringify(results, null, 2));
            } else {
                if (results.suites) {
                    console.log(`\nFlow Suite Results:`);
                    for (const [suiteName, suiteResult] of Object.entries(results.suites)) {
                        const status = suiteResult.failed > 0 ? COLORS.ERROR : COLORS.SUCCESS;
                        console.log(`  ${status}${suiteName}: ${suiteResult.passed}/${suiteResult.total} passed${COLORS.RESET}`);
                    }
                    console.log(`\nTotal: ${results.passed + results.failed}`);
                    console.log(`Passed: ${COLORS.SUCCESS}${results.passed}${COLORS.RESET}`);
                    console.log(`Failed: ${results.failed > 0 ? COLORS.ERROR : COLORS.SUCCESS}${results.failed}${COLORS.RESET}`);
                } else {
                    console.log(`\nSuite: ${suiteName}`);
                    console.log(`  Total: ${results.total}`);
                    console.log(`  Passed: ${results.passed}`);
                    console.log(`  Failed: ${results.failed}`);
                    
                    if (results.failures && results.failures.length > 0) {
                        console.log('\nFailures:');
                        for (const f of results.failures) {
                            console.log(`  ${COLORS.ERROR}[${f.severity}] ${f.skill}: ${f.test}${COLORS.RESET}`);
                            console.log(`    → ${f.message}`);
                        }
                    }
                }
            }
            
            exitCode = results.failed > 0 ? 1 : 0;
            break;
        }
        
        case 'report': {
            const outputArg = args.find(a => a.startsWith('--output='));
            const projectRoot = path.resolve(__dirname, '..', '..');
            const reportsDir = path.join(projectRoot, 'reports');
            const defaultOutputPath = path.join(reportsDir, `test-report-${Date.now()}.md`);
            const outputPath = outputArg ? outputArg.split('=')[1] : defaultOutputPath;
            
            const results = await runner.runAllSuites();
            runner.generateMarkdownReport(results, outputPath);
            
            console.log(`Report generated: ${outputPath}`);
            exitCode = results.failed > 0 ? 1 : 0;
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
    main().catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
}

module.exports = { main };
