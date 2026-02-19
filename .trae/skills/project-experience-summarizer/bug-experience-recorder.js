/**
 * Bug修复后经验记录脚本
 * 
 * 功能：在Bug修复后自动记录经验到经验库，更新缓存计数
 * 调用时机：Bug修复验证通过后
 * 
 * 引用：[experience-cache-manager](experience-cache-manager.js)
 * 版本：v1.0
 * 日期：2026-02-19
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ==================== 配置 ====================

const CONFIG = {
  // 技能目录
  skillsDir: path.join(__dirname),
  
  // 经验库文件路径
  experienceDbPath: path.join(__dirname, 'experience-db.md'),
  
  // 缓存管理器路径
  cacheManagerPath: path.join(__dirname, 'experience-cache-manager.js'),
  
  // Bug清单目录
  bugListDir: 'docs/05-测试文档',
  
  // 输出目录
  outputDir: 'docs/05-测试文档/experiences',
  
  // 缓存索引路径
  cacheIndexPath: path.join(__dirname, 'experience-cache-index.md')
};

// ==================== Bug经验记录类 ====================

class BugExperienceRecorder {
  constructor() {
    this.skillsDir = CONFIG.skillsDir;
    this.experienceDbPath = CONFIG.experienceDbPath;
    this.cacheManagerPath = CONFIG.cacheManagerPath;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * 记录Bug经验（交互式）
   */
  async recordInteractive() {
    console.log('📝 Bug修复后经验记录');
    console.log('=' .repeat(60));
    console.log('本工具将引导您记录Bug修复经验到经验库\n');
    
    const experience = {};
    
    // 1. 基本信息
    experience.bugId = await this._ask('Bug ID (如: BUG-001): ');
    experience.projectType = await this._ask('项目类型 (Web游戏/休闲游戏/RPG等): ');
    experience.projectName = await this._ask('项目名称: ');
    
    // 2. 问题信息
    console.log('\n📋 问题信息');
    experience.problemType = await this._ask('问题类型 (技术问题/流程问题/设计缺陷/性能问题): ');
    experience.problemDescription = await this._askMultiLine('问题描述 (详细描述Bug现象):');
    
    // 3. 根本原因
    console.log('\n🔍 根本原因分析');
    experience.rootCause = await this._askMultiLine('根本原因 (技术原因或设计原因):');
    
    // 4. 解决方案
    console.log('\n💡 解决方案');
    experience.solution = await this._askMultiLine('解决方案 (具体的解决步骤):');
    
    // 5. 预防措施
    console.log('\n🛡️ 预防措施');
    experience.prevention = await this._askMultiLine('预防措施 (如何在后续开发中避免):');
    
    // 6. 相关文件
    console.log('\n📁 相关文件');
    experience.relatedFiles = await this._ask('相关文件路径 (逗号分隔): ');
    
    // 7. 关键词
    console.log('\n🔑 关键词');
    experience.keywords = await this._ask('关键词 (用于缓存匹配，逗号分隔): ');
    
    // 8. 缓存匹配
    console.log('\n🎯 缓存匹配');
    const matchCacheId = await this._ask('是否匹配现有缓存条目? (输入缓存ID如L0-001，或留跳过重): ');
    
    // 生成经验记录
    const record = this._generateExperienceRecord(experience);
    
    // 保存经验记录
    console.log('\n💾 保存经验记录...');
    this._saveExperienceRecord(record, experience);
    
    // 更新缓存计数
    if (matchCacheId && matchCacheId.trim()) {
      console.log(`\n🎯 更新缓存计数: ${matchCacheId}`);
      this._updateCacheCounter(matchCacheId.trim(), experience.projectName);
    }
    
    console.log('\n✅ 经验记录完成！');
    console.log('=' .repeat(60));
    console.log('📋 下一步:');
    console.log('  1. 经验已追加到 experience-db.md');
    console.log('  2. 缓存计数已更新');
    console.log('  3. 下次同类项目将自动规避此问题');
    
    this.rl.close();
    return experience;
  }
  
  /**
   * 快速记录（命令行参数）
   */
  recordQuick(bugId, options = {}) {
    console.log(`📝 快速记录Bug经验: ${bugId}`);
    
    // 尝试从Bug清单读取信息
    const bugInfo = this._readBugInfo(bugId);
    
    const experience = {
      bugId,
      projectType: options.projectType || bugInfo?.projectType || 'Web游戏',
      projectName: options.projectName || bugInfo?.projectName || '未命名项目',
      problemType: options.problemType || bugInfo?.problemType || '技术问题',
      problemDescription: options.problemDescription || bugInfo?.description || '待补充',
      rootCause: options.rootCause || '待补充',
      solution: options.solution || '待补充',
      prevention: options.prevention || '待补充',
      relatedFiles: options.relatedFiles || '',
      keywords: options.keywords || '',
      recordTime: new Date().toISOString()
    };
    
    // 生成并保存记录
    const record = this._generateExperienceRecord(experience);
    this._saveExperienceRecord(record, experience);
    
    console.log('✅ 经验记录已保存');
    
    // 更新缓存
    if (options.cacheId) {
      this._updateCacheCounter(options.cacheId, experience.projectName);
    }
    
    return experience;
  }
  
  /**
   * 从Bug清单读取信息
   */
  _readBugInfo(bugId) {
    const bugListPath = path.join(process.cwd(), CONFIG.bugListDir, 'bug-list.md');
    
    if (!fs.existsSync(bugListPath)) {
      return null;
    }
    
    const content = fs.readFileSync(bugListPath, 'utf8');
    
    // 简单解析Bug信息
    const bugRegex = new RegExp(`## ${bugId}([\\s\\S]*?)(?=## |$)`, 'i');
    const match = content.match(bugRegex);
    
    if (match) {
      const bugSection = match[1];
      return {
        description: this._extractField(bugSection, '问题描述'),
        problemType: this._extractField(bugSection, 'Bug类型'),
        projectName: this._extractField(bugSection, '项目名称')
      };
    }
    
    return null;
  }
  
  _extractField(content, fieldName) {
    const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:?\\s*([^\\n]+)`);
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }
  
  /**
   * 生成经验记录
   */
  _generateExperienceRecord(exp) {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    const time = timestamp.split('T')[1].slice(0, 5);
    
    return `### 经验记录 [自动生成的序号]

- **Bug ID**: ${exp.bugId}
- **项目类型**: ${exp.projectType}
- **项目名称**: ${exp.projectName}
- **问题类型**: ${exp.problemType}
- **问题描述**: ${exp.problemDescription}
- **根本原因**: ${exp.rootCause}
- **解决方案**: ${exp.solution}
- **预防措施**: ${exp.prevention}
- **相关文件**: ${exp.relatedFiles}
- **关键词**: ${exp.keywords}
- **记录时间**: ${date} ${time}
- **记录来源**: Bug修复后自动记录

---

`;
  }
  
  /**
   * 保存经验记录
   */
  _saveExperienceRecord(record, exp) {
    // 1. 追加到经验库主文档
    if (fs.existsSync(this.experienceDbPath)) {
      fs.appendFileSync(this.experienceDbPath, '\n' + record, 'utf8');
      console.log(`  ✅ 已追加到: ${this.experienceDbPath}`);
    } else {
      console.log(`  ⚠️ 经验库文件不存在: ${this.experienceDbPath}`);
    }
    
    // 2. 保存到项目目录
    const outputDir = path.join(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `experience-${exp.bugId}-${Date.now()}.md`);
    fs.writeFileSync(outputPath, record, 'utf8');
    console.log(`  ✅ 已保存到: ${outputPath}`);
  }
  
  /**
   * 更新缓存计数
   */
  _updateCacheCounter(cacheId, projectName) {
    try {
      const cmd = `node "${this.cacheManagerPath}" match --id="${cacheId}" --project="${projectName}"`;
      const output = execSync(cmd, { 
        encoding: 'utf8',
        cwd: this.skillsDir
      });
      console.log(output);
    } catch (error) {
      console.error(`  ❌ 缓存更新失败: ${error.message}`);
    }
  }
  
  /**
   * 询问问题
   */
  _ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  /**
   * 询问多行输入
   */
  _askMultiLine(prompt) {
    return new Promise((resolve) => {
      console.log(prompt);
      console.log('(输入空行结束)');
      
      const lines = [];
      const askLine = () => {
        this.rl.question('', (line) => {
          if (line.trim() === '') {
            resolve(lines.join('\n'));
          } else {
            lines.push(line);
            askLine();
          }
        });
      };
      
      askLine();
    });
  }
  
  /**
   * 批量记录（用于项目结束后的批量经验记录）
   */
  async recordBatch(bugList) {
    console.log(`📝 批量记录Bug经验，共 ${bugList.length} 个Bug`);
    
    const results = [];
    
    for (const bug of bugList) {
      console.log(`\n处理: ${bug.id}`);
      const exp = this.recordQuick(bug.id, bug);
      results.push(exp);
    }
    
    console.log(`\n✅ 批量记录完成，共 ${results.length} 条经验`);
    return results;
  }
}

// ==================== CLI 接口 ====================

function printUsage() {
  console.log(`
Bug修复后经验记录脚本 v1.0

用法:
  node bug-experience-recorder.js <命令> [选项]

命令:
  record                                    交互式记录经验
  quick --bug-id=<ID> [选项]                快速记录经验
  batch --file=<路径>                       批量记录经验

选项:
  --bug-id=<ID>                             Bug ID
  --project-type=<类型>                     项目类型
  --project-name=<名称>                     项目名称
  --problem-type=<类型>                     问题类型
  --cache-id=<ID>                           缓存ID (如L0-001)
  --file=<路径>                             批量记录文件路径

交互式记录示例:
  node bug-experience-recorder.js record

快速记录示例:
  node bug-experience-recorder.js quick --bug-id=BUG-001 \\
    --project-type=Web游戏 \\
    --project-name=连点器游戏 \\
    --cache-id=L0-001

批量记录示例:
  node bug-experience-recorder.js batch --file=bugs.json
`);
}

async function main() {
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
  
  const recorder = new BugExperienceRecorder();
  
  switch (command) {
    case 'record':
      await recorder.recordInteractive();
      break;
      
    case 'quick':
      if (!options['bug-id']) {
        console.error('❌ 错误: 请提供Bug ID (--bug-id=<ID>)');
        process.exit(1);
      }
      recorder.recordQuick(options['bug-id'], options);
      break;
      
    case 'batch':
      if (!options.file) {
        console.error('❌ 错误: 请提供批量记录文件 (--file=<路径>)');
        process.exit(1);
      }
      
      if (!fs.existsSync(options.file)) {
        console.error(`❌ 错误: 文件不存在: ${options.file}`);
        process.exit(1);
      }
      
      const bugList = JSON.parse(fs.readFileSync(options.file, 'utf8'));
      await recorder.recordBatch(bugList);
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
module.exports = { BugExperienceRecorder, CONFIG };
