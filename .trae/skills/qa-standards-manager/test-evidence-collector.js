/**
 * 测试证据收集工具 (Test Evidence Collector)
 * 
 * 功能：自动化收集和验证QA测试证据，防止AI幻觉
 * 包括：截图收集、日志收集、证据验证、幻觉检测
 * 
 * 引用：[qa-standards-manager](SKILL.md) | [contract-validator](../contract-validator/SKILL.md)
 * 版本：v1.0
 * 日期：2026-02-19
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== 配置 ====================

const CONFIG = {
  // 证据目录配置
  evidenceDir: 'tests/evidence',
  screenshotDir: 'tests/evidence/screenshots',
  logDir: 'tests/evidence/logs',
  
  // 截图子目录
  screenshotSubdirs: ['ft', 'vt', 'fpt', 'rt'],
  
  // 命名规范
  namingPatterns: {
    screenshot: '{testType}_{testId}_{timestamp}.png',
    log: '{testType}_{timestamp}.log'
  },
  
  // 最小证据要求
  minRequirements: {
    screenshots: 5,
    logs: 1,
    coverageRatio: 0.5  // 截图数量 / 测试项数量
  },
  
  // 幻觉检测阈值
  hallucinationThresholds: {
    maxPassRate: 0.95,  // 禁止100%通过
    minScreenshotRatio: 0.3,
    suspiciousPhrases: [
      '代码看起来正常',
      '应该没问题',
      '理论上可行',
      '推测可以运行',
      '预计能工作'
    ]
  }
};

// ==================== 证据收集类 ====================

class TestEvidenceCollector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.evidenceDir = path.join(this.projectRoot, CONFIG.evidenceDir);
    this.screenshotDir = path.join(this.projectRoot, CONFIG.screenshotDir);
    this.logDir = path.join(this.projectRoot, CONFIG.logDir);
    
    this.collectedEvidence = {
      screenshots: [],
      logs: [],
      metadata: {
        collectionStartTime: null,
        collectionEndTime: null,
        testItems: 0
      }
    };
  }

  // ==================== 目录管理 ====================
  
  /**
   * 初始化证据目录结构
   */
  initializeDirectories() {
    console.log('🗂️  初始化证据目录结构...');
    
    // 创建主目录
    this._ensureDir(this.evidenceDir);
    this._ensureDir(this.screenshotDir);
    this._ensureDir(this.logDir);
    
    // 创建截图子目录
    CONFIG.screenshotSubdirs.forEach(subdir => {
      this._ensureDir(path.join(this.screenshotDir, subdir));
    });
    
    // 创建日志子目录
    this._ensureDir(path.join(this.logDir, 'console'));
    this._ensureDir(path.join(this.logDir, 'network'));
    
    console.log('✅ 目录结构初始化完成');
    return true;
  }

  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  📁 创建目录: ${dirPath}`);
    }
  }

  // ==================== 截图收集 ====================
  
  /**
   * 收集截图证据
   * @param {string} testType - 测试类型 (ft/vt/fpt/rt)
   * @param {string} testId - 测试项ID
   * @param {string} sourcePath - 截图源文件路径
   */
  collectScreenshot(testType, testId, sourcePath) {
    const timestamp = this._getTimestamp();
    const filename = `${testType}_${testId}_${timestamp}.png`;
    const targetDir = path.join(this.screenshotDir, testType);
    const targetPath = path.join(targetDir, filename);
    
    // 确保目录存在
    this._ensureDir(targetDir);
    
    // 复制截图到证据目录
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      
      const evidence = {
        type: 'screenshot',
        testType,
        testId,
        filename,
        path: targetPath,
        timestamp,
        size: fs.statSync(targetPath).size
      };
      
      this.collectedEvidence.screenshots.push(evidence);
      console.log(`📸 收集截图: ${filename}`);
      
      return evidence;
    } else {
      console.error(`❌ 截图源文件不存在: ${sourcePath}`);
      return null;
    }
  }

  /**
   * 扫描并收集现有截图
   */
  scanExistingScreenshots() {
    console.log('🔍 扫描现有截图...');
    
    CONFIG.screenshotSubdirs.forEach(subdir => {
      const dirPath = path.join(this.screenshotDir, subdir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
          .filter(f => f.endsWith('.png'))
          .map(f => {
            const filePath = path.join(dirPath, f);
            const stat = fs.statSync(filePath);
            
            // 解析文件名
            const parts = f.replace('.png', '').split('_');
            
            return {
              type: 'screenshot',
              testType: parts[0] || subdir,
              testId: parts[1] || 'unknown',
              filename: f,
              path: filePath,
              timestamp: parts[2] || '',
              size: stat.size,
              modified: stat.mtime
            };
          });
        
        this.collectedEvidence.screenshots.push(...files);
        console.log(`  📸 ${subdir}: 找到 ${files.length} 张截图`);
      }
    });
    
    return this.collectedEvidence.screenshots.length;
  }

  // ==================== 日志收集 ====================
  
  /**
   * 收集控制台日志
   * @param {string} testType - 测试类型
   * @param {string} logContent - 日志内容
   */
  collectConsoleLog(testType, logContent) {
    const timestamp = this._getTimestamp();
    const filename = `${testType}_${timestamp}.log`;
    const targetPath = path.join(this.logDir, 'console', filename);
    
    // 确保目录存在
    this._ensureDir(path.join(this.logDir, 'console'));
    
    // 写入日志文件
    fs.writeFileSync(targetPath, logContent, 'utf8');
    
    const evidence = {
      type: 'log',
      logType: 'console',
      testType,
      filename,
      path: targetPath,
      timestamp,
      size: fs.statSync(targetPath).size,
      lineCount: logContent.split('\n').length
    };
    
    this.collectedEvidence.logs.push(evidence);
    console.log(`📝 收集日志: ${filename} (${evidence.lineCount} 行)`);
    
    return evidence;
  }

  /**
   * 扫描现有日志
   */
  scanExistingLogs() {
    console.log('🔍 扫描现有日志...');
    
    const logTypes = ['console', 'network'];
    
    logTypes.forEach(logType => {
      const dirPath = path.join(this.logDir, logType);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
          .filter(f => f.endsWith('.log'))
          .map(f => {
            const filePath = path.join(dirPath, f);
            const stat = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 解析文件名
            const parts = f.replace('.log', '').split('_');
            
            return {
              type: 'log',
              logType,
              testType: parts[0] || 'unknown',
              filename: f,
              path: filePath,
              timestamp: parts[1] || '',
              size: stat.size,
              lineCount: content.split('\n').length,
              modified: stat.mtime
            };
          });
        
        this.collectedEvidence.logs.push(...files);
        console.log(`  📝 ${logType}: 找到 ${files.length} 个日志文件`);
      }
    });
    
    return this.collectedEvidence.logs.length;
  }

  // ==================== 证据验证 ====================
  
  /**
   * 验证证据完整性
   * @param {number} testItemCount - 测试项总数
   */
  validateEvidence(testItemCount = 0) {
    console.log('\n🔍 开始验证证据完整性...');
    
    const validation = {
      valid: true,
      screenshots: { valid: false, count: 0, required: 0 },
      logs: { valid: false, count: 0, required: 0 },
      coverage: { valid: false, ratio: 0 },
      issues: []
    };
    
    // 验证截图
    validation.screenshots.count = this.collectedEvidence.screenshots.length;
    validation.screenshots.required = Math.max(
      CONFIG.minRequirements.screenshots,
      Math.ceil(testItemCount * CONFIG.minRequirements.coverageRatio)
    );
    validation.screenshots.valid = 
      validation.screenshots.count >= validation.screenshots.required;
    
    if (!validation.screenshots.valid) {
      validation.valid = false;
      validation.issues.push({
        type: 'INSUFFICIENT_SCREENSHOTS',
        severity: 'CRITICAL',
        message: `截图数量不足: ${validation.screenshots.count}/${validation.screenshots.required}`,
        suggestion: '为更多测试项提供截图证据'
      });
    }
    
    // 验证日志
    validation.logs.count = this.collectedEvidence.logs.length;
    validation.logs.required = CONFIG.minRequirements.logs;
    validation.logs.valid = validation.logs.count >= validation.logs.required;
    
    if (!validation.logs.valid) {
      validation.valid = false;
      validation.issues.push({
        type: 'MISSING_LOGS',
        severity: 'HIGH',
        message: `日志数量不足: ${validation.logs.count}/${validation.logs.required}`,
        suggestion: '收集浏览器控制台日志'
      });
    }
    
    // 验证覆盖率
    if (testItemCount > 0) {
      validation.coverage.ratio = validation.screenshots.count / testItemCount;
      validation.coverage.valid = 
        validation.coverage.ratio >= CONFIG.hallucinationThresholds.minScreenshotRatio;
      
      if (!validation.coverage.valid) {
        validation.valid = false;
        validation.issues.push({
          type: 'LOW_COVERAGE',
          severity: 'HIGH',
          message: `证据覆盖率过低: ${(validation.coverage.ratio * 100).toFixed(1)}%`,
          suggestion: '提高截图覆盖率，至少覆盖30%的测试项'
        });
      }
    }
    
    // 输出验证结果
    console.log('\n📊 证据验证结果:');
    console.log(`  📸 截图: ${validation.screenshots.count}/${validation.screenshots.required} ${validation.screenshots.valid ? '✅' : '❌'}`);
    console.log(`  📝 日志: ${validation.logs.count}/${validation.logs.required} ${validation.logs.valid ? '✅' : '❌'}`);
    if (testItemCount > 0) {
      console.log(`  📈 覆盖率: ${(validation.coverage.ratio * 100).toFixed(1)}% ${validation.coverage.valid ? '✅' : '❌'}`);
    }
    
    if (validation.issues.length > 0) {
      console.log('\n⚠️  发现的问题:');
      validation.issues.forEach(issue => {
        console.log(`  [${issue.severity}] ${issue.message}`);
        console.log(`    💡 ${issue.suggestion}`);
      });
    } else {
      console.log('\n✅ 证据验证通过');
    }
    
    return validation;
  }

  // ==================== 幻觉检测 ====================
  
  /**
   * 检测测试报告中的幻觉迹象
   * @param {string} reportPath - 测试报告文件路径
   * @param {object} testResults - 测试结果统计
   */
  detectHallucination(reportPath, testResults = {}) {
    console.log('\n🕵️  开始幻觉检测...');
    
    const detection = {
      hallucinationDetected: false,
      indicators: [],
      riskLevel: 'LOW',  // LOW, MEDIUM, HIGH, CRITICAL
      recommendations: []
    };
    
    // 检查1: 100%通过率
    if (testResults.passRate === 1.0 || testResults.passRate === '100%') {
      detection.hallucinationDetected = true;
      detection.indicators.push({
        type: 'PERFECT_PASS_RATE',
        severity: 'HIGH',
        description: '测试报告显示100%通过率',
        details: { passRate: testResults.passRate, testCount: testResults.total }
      });
      detection.recommendations.push('首次测试不可能100%通过，请提供真实测试结果');
    }
    
    // 检查2: 证据不足
    const screenshotCount = this.collectedEvidence.screenshots.length;
    const minRequired = Math.max(5, Math.ceil((testResults.total || 0) * 0.3));
    
    if (screenshotCount < minRequired) {
      detection.hallucinationDetected = true;
      detection.indicators.push({
        type: 'INSUFFICIENT_EVIDENCE',
        severity: 'CRITICAL',
        description: '截图证据严重不足',
        details: { required: minRequired, actual: screenshotCount }
      });
      detection.recommendations.push('为每个测试项提供截图证据');
    }
    
    // 检查3: 报告内容分析
    if (fs.existsSync(reportPath)) {
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      
      // 检查推断性语言
      const suspiciousPhrases = CONFIG.hallucinationThresholds.suspiciousPhrases;
      const foundPhrases = suspiciousPhrases.filter(phrase => 
        reportContent.includes(phrase)
      );
      
      if (foundPhrases.length > 0) {
        detection.hallucinationDetected = true;
        detection.indicators.push({
          type: 'CODE_INFERENCE',
          severity: 'MEDIUM',
          description: '检测到仅凭代码推断的表述',
          details: { phrases: foundPhrases }
        });
        detection.recommendations.push('避免使用推断性语言，提供实际测试证据');
      }
      
      // 检查是否包含失败项
      const hasFailureItems = /❌|不通过|失败|未测试/.test(reportContent);
      if (!hasFailureItems && (testResults.total || 0) > 10) {
        detection.hallucinationDetected = true;
        detection.indicators.push({
          type: 'NO_FAILURE_ITEMS',
          severity: 'HIGH',
          description: '报告中未包含任何失败或未测试项',
          details: { testCount: testResults.total }
        });
        detection.recommendations.push('如实记录测试中的问题和失败项');
      }
    }
    
    // 确定风险等级
    const criticalCount = detection.indicators.filter(i => i.severity === 'CRITICAL').length;
    const highCount = detection.indicators.filter(i => i.severity === 'HIGH').length;
    
    if (criticalCount > 0) {
      detection.riskLevel = 'CRITICAL';
    } else if (highCount > 0) {
      detection.riskLevel = 'HIGH';
    } else if (detection.indicators.length > 0) {
      detection.riskLevel = 'MEDIUM';
    }
    
    // 输出检测结果
    console.log(`\n🎯 幻觉检测结果: ${detection.hallucinationDetected ? '⚠️ 检测到幻觉迹象' : '✅ 未检测到明显幻觉'}`);
    console.log(`   风险等级: ${detection.riskLevel}`);
    
    if (detection.indicators.length > 0) {
      console.log('\n📋 检测指标:');
      detection.indicators.forEach(indicator => {
        console.log(`  [${indicator.severity}] ${indicator.description}`);
      });
      
      console.log('\n💡 建议:');
      detection.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    return detection;
  }

  // ==================== 报告生成 ====================
  
  /**
   * 生成证据收集报告
   */
  generateEvidenceReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalScreenshots: this.collectedEvidence.screenshots.length,
        totalLogs: this.collectedEvidence.logs.length,
        totalEvidenceSize: this._calculateTotalSize()
      },
      screenshots: this.collectedEvidence.screenshots,
      logs: this.collectedEvidence.logs,
      validation: null,
      hallucinationDetection: null
    };
    
    return report;
  }
  
  /**
   * 保存证据报告
   */
  saveEvidenceReport(outputPath) {
    const report = this.generateEvidenceReport();
    const reportPath = outputPath || path.join(this.evidenceDir, 'evidence-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📄 证据报告已保存: ${reportPath}`);
    
    return reportPath;
  }

  _calculateTotalSize() {
    let totalSize = 0;
    
    this.collectedEvidence.screenshots.forEach(s => {
      totalSize += s.size || 0;
    });
    
    this.collectedEvidence.logs.forEach(l => {
      totalSize += l.size || 0;
    });
    
    return totalSize;
  }

  // ==================== 工具方法 ====================
  
  _getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '').slice(0, 15);
  }

  /**
   * 获取收集的证据统计
   */
  getStats() {
    return {
      screenshots: {
        count: this.collectedEvidence.screenshots.length,
        byType: this._groupBy(this.collectedEvidence.screenshots, 'testType')
      },
      logs: {
        count: this.collectedEvidence.logs.length,
        byType: this._groupBy(this.collectedEvidence.logs, 'logType')
      }
    };
  }

  _groupBy(array, key) {
    return array.reduce((result, item) => {
      const value = item[key] || 'unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }
}

// ==================== CLI 接口 ====================

function printUsage() {
  console.log(`
测试证据收集工具 (Test Evidence Collector) v1.0

用法:
  node test-evidence-collector.js <命令> [选项]

命令:
  init                          初始化证据目录结构
  scan                          扫描并收集现有证据
  validate --items=<数量>       验证证据完整性
  detect --report=<路径>        检测测试报告幻觉
  report                        生成证据报告
  full --items=<数量> --report=<路径>  执行完整流程

选项:
  --items=<数量>                测试项总数
  --report=<路径>               测试报告文件路径
  --project=<路径>              项目根目录 (默认: 当前目录)

示例:
  node test-evidence-collector.js init
  node test-evidence-collector.js scan
  node test-evidence-collector.js validate --items=30
  node test-evidence-collector.js detect --report=docs/QA-TEST-REPORT.md
  node test-evidence-collector.js full --items=30 --report=docs/QA-TEST-REPORT.md
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }
  
  const command = args[0];
  const options = {};
  
  // 解析选项
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value;
    }
  });
  
  const projectRoot = options.project || process.cwd();
  const collector = new TestEvidenceCollector(projectRoot);
  
  console.log('🚀 测试证据收集工具 v1.0\n');
  
  switch (command) {
    case 'init':
      collector.initializeDirectories();
      break;
      
    case 'scan':
      collector.initializeDirectories();
      collector.scanExistingScreenshots();
      collector.scanExistingLogs();
      console.log('\n📊 统计:');
      console.log(JSON.stringify(collector.getStats(), null, 2));
      break;
      
    case 'validate':
      collector.scanExistingScreenshots();
      collector.scanExistingLogs();
      collector.validateEvidence(parseInt(options.items) || 0);
      break;
      
    case 'detect':
      collector.scanExistingScreenshots();
      collector.scanExistingLogs();
      
      if (!options.report) {
        console.error('❌ 错误: 请提供测试报告路径 (--report=<路径>)');
        process.exit(1);
      }
      
      collector.detectHallucination(options.report, {
        total: parseInt(options.items) || 0,
        passRate: 1.0  // 假设100%，让工具检测
      });
      break;
      
    case 'report':
      collector.scanExistingScreenshots();
      collector.scanExistingLogs();
      collector.saveEvidenceReport();
      break;
      
    case 'full':
      collector.initializeDirectories();
      collector.scanExistingScreenshots();
      collector.scanExistingLogs();
      
      const testItemCount = parseInt(options.items) || 0;
      
      // 验证证据
      const validation = collector.validateEvidence(testItemCount);
      
      // 检测幻觉
      let detection = null;
      if (options.report) {
        detection = collector.detectHallucination(options.report, {
          total: testItemCount,
          passRate: 1.0
        });
      }
      
      // 保存报告
      collector.saveEvidenceReport();
      
      // 输出总结
      console.log('\n' + '='.repeat(50));
      console.log('📋 执行总结');
      console.log('='.repeat(50));
      console.log(`证据验证: ${validation.valid ? '✅ 通过' : '❌ 未通过'}`);
      if (detection) {
        console.log(`幻觉检测: ${detection.hallucinationDetected ? '⚠️ 检测到异常' : '✅ 正常'}`);
        console.log(`风险等级: ${detection.riskLevel}`);
      }
      
      // 设置退出码
      if (!validation.valid || (detection && detection.hallucinationDetected)) {
        process.exit(1);
      }
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      printUsage();
      process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

// 导出类供其他模块使用
module.exports = { TestEvidenceCollector, CONFIG };
