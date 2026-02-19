/**
 * QA测试前经验缓存查询脚本
 * 
 * 功能：在QA测试前自动查询经验缓存，生成检查清单
 * 调用时机：Phase 3 Step 3-3-1 主测试制定计划阶段
 * 
 * 引用：[experience-cache-manager](experience-cache-manager.js)
 * 版本：v1.0
 * 日期：2026-02-19
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== 配置 ====================

const CONFIG = {
  // 技能目录
  skillsDir: path.join(__dirname),
  
  // 缓存管理器路径
  cacheManagerPath: path.join(__dirname, 'experience-cache-manager.js'),
  
  // 输出目录
  outputDir: 'tests',
  
  // 默认项目类型
  defaultProjectType: 'Web游戏',
  
  // 关键词映射（根据项目类型自动选择）
  keywordsMap: {
    'Web游戏': ['JavaScript', 'DOM事件', 'ES Module', 'CORS', 'UI类'],
    '休闲游戏': ['点击游戏', '增量游戏', 'UI交互'],
    'RPG游戏': ['角色系统', '技能系统', '战斗系统'],
    'SLG游戏': ['策略系统', '资源管理', 'AI算法'],
    '通用': ['流程问题', '测试覆盖', '审核']
  }
};

// ==================== QA缓存查询类 ====================

class QACacheQuery {
  constructor(projectType, projectName) {
    this.projectType = projectType || CONFIG.defaultProjectType;
    this.projectName = projectName || '未命名项目';
    this.skillsDir = CONFIG.skillsDir;
    this.cacheManagerPath = CONFIG.cacheManagerPath;
    this.results = null;
  }

  /**
   * 执行缓存查询
   */
  query() {
    console.log('🔍 QA测试前经验缓存查询');
    console.log('=' .repeat(60));
    console.log(`项目类型: ${this.projectType}`);
    console.log(`项目名称: ${this.projectName}`);
    console.log('=' .repeat(60));
    
    // 1. 获取关键词
    const keywords = this._getKeywords();
    console.log(`\n📋 关键词: ${keywords.join(', ')}`);
    
    // 2. 执行查询命令
    try {
      const cmd = `node "${this.cacheManagerPath}" query --type="${this.projectType}" --keywords="${keywords.join(',')}"`;
      console.log(`\n⚙️  执行: ${cmd}`);
      
      const output = execSync(cmd, { 
        encoding: 'utf8',
        cwd: this.skillsDir
      });
      
      console.log(output);
      
      // 3. 生成检查清单
      this._generateChecklist();
      
      // 4. 输出总结
      this._printSummary();
      
      return true;
    } catch (error) {
      console.error('❌ 查询失败:', error.message);
      return false;
    }
  }
  
  /**
   * 获取关键词
   */
  _getKeywords() {
    return CONFIG.keywordsMap[this.projectType] || CONFIG.keywordsMap['通用'];
  }
  
  /**
   * 生成检查清单
   */
  _generateChecklist() {
    console.log('\n📝 生成检查清单...');
    
    try {
      const cmd = `node "${this.cacheManagerPath}" checklist --type="${this.projectType}"`;
      const output = execSync(cmd, { 
        encoding: 'utf8',
        cwd: this.skillsDir
      });
      
      // 保存到文件
      const outputDir = path.join(process.cwd(), CONFIG.outputDir);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'qa-cache-checklist.md');
      fs.writeFileSync(outputPath, output, 'utf8');
      
      console.log(`✅ 检查清单已保存: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('❌ 生成清单失败:', error.message);
      return null;
    }
  }
  
  /**
   * 输出总结
   */
  _printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 查询总结');
    console.log('='.repeat(60));
    console.log('✅ 经验缓存查询完成');
    console.log('✅ 检查清单已生成');
    console.log('\n📋 下一步操作:');
    console.log('  1. 查看检查清单: tests/qa-cache-checklist.md');
    console.log('  2. 将L0缓存检查项加入测试计划');
    console.log('  3. 分派测试任务给子QA');
    console.log('  4. 子QA测试前必须完成L0缓存检查');
    console.log('\n⚠️  重要提醒:');
    console.log('  - L0缓存必须逐项检查');
    console.log('  - 发现问题后及时更新缓存计数');
    console.log('  - 使用: node experience-cache-manager.js match --id=<缓存ID>');
    console.log('='.repeat(60));
  }
  
  /**
   * 更新缓存计数（发现问题后调用）
   */
  matchCache(cacheId) {
    console.log(`\n🎯 更新缓存计数: ${cacheId}`);
    
    try {
      const cmd = `node "${this.cacheManagerPath}" match --id="${cacheId}" --project="${this.projectName}"`;
      const output = execSync(cmd, { 
        encoding: 'utf8',
        cwd: this.skillsDir
      });
      
      console.log(output);
      return true;
    } catch (error) {
      console.error('❌ 更新失败:', error.message);
      return false;
    }
  }
  
  /**
   * 生成子QA专用检查清单
   */
  generateSubQAChecklist(qaRole, qaSpecialty) {
    console.log(`\n📝 生成子QA检查清单: ${qaRole}`);
    console.log(`专业领域: ${qaSpecialty}`);
    
    // 根据专业领域选择相关关键词
    const specialtyKeywords = this._getSpecialtyKeywords(qaSpecialty);
    
    let markdown = `# ${qaRole} - 经验缓存检查清单\n\n`;
    markdown += `**项目类型**: ${this.projectType}\n\n`;
    markdown += `**专业领域**: ${qaSpecialty}\n\n`;
    markdown += `**生成时间**: ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    
    // L0 - 必须检查
    markdown += `## L0 - Critical（必须检查）\n\n`;
    markdown += `> ⚠️ 以下问题是高频发生的，必须逐项检查\n\n`;
    
    // 根据专业领域筛选相关的L0缓存
    const l0Caches = this._getRelatedCaches('L0', specialtyKeywords);
    if (l0Caches.length === 0) {
      markdown += `> 暂无相关L0缓存\n\n`;
    } else {
      l0Caches.forEach(cache => {
        markdown += `- [ ] **${cache.id}**: ${cache.keywords.join(', ')}\n`;
        markdown += `  - 检查: ${cache.checkMethod}\n`;
        markdown += `  - 结果: 通过 / 未通过 / 不适用\n`;
        markdown += `  - 备注:\n\n`;
      });
    }
    
    // L1 - 建议检查
    markdown += `## L1 - High（建议检查）\n\n`;
    const l1Caches = this._getRelatedCaches('L1', specialtyKeywords);
    if (l1Caches.length === 0) {
      markdown += `> 暂无相关L1缓存\n\n`;
    } else {
      l1Caches.forEach(cache => {
        markdown += `- [ ] **${cache.id}**: ${cache.keywords.join(', ')}\n`;
        markdown += `  - 检查: ${cache.checkMethod}\n\n`;
      });
    }
    
    // 统计
    markdown += `## 检查结果统计\n\n`;
    markdown += `- L0通过: __/${l0Caches.length}\n`;
    markdown += `- L1通过: __/${l1Caches.length}\n`;
    markdown += `- 总计通过: __/${l0Caches.length + l1Caches.length}\n\n`;
    
    // 发现问题后操作
    markdown += `## 发现问题后操作\n\n`;
    markdown += `1. 记录问题详情\n`;
    markdown += `2. 匹配缓存条目:\n`;
    markdown += `   \`\`\`bash\n`;
    markdown += `   node experience-cache-manager.js match --id=<缓存ID> --project=${this.projectName}\n`;
    markdown += `   \`\`\`\n`;
    markdown += `3. 更新测试报告\n\n`;
    
    return markdown;
  }
  
  /**
   * 获取专业领域关键词
   */
  _getSpecialtyKeywords(specialty) {
    const specialtyMap = {
      '核心玩法': ['玩法', '游戏机制', '核心循环'],
      '技能系统': ['技能', 'SkillSystem', '技能系统'],
      'UI系统': ['UI', '界面', 'DOM事件', '事件绑定'],
      '关卡系统': ['关卡', '地图', '路径检测'],
      '边界测试': ['边界', '异常', '边界条件'],
      '性能测试': ['性能', '兼容性', '优化']
    };
    
    return specialtyMap[specialty] || [];
  }
  
  /**
   * 获取相关的缓存
   */
  _getRelatedCaches(level, keywords) {
    // 这里简化处理，实际应该从缓存管理器获取
    // 返回预定义的L0缓存
    const predefinedCaches = {
      'L0': [
        { id: 'L0-001', keywords: ['ES Module', 'CORS', 'file协议'], checkMethod: '检查是否使用`<script type="module">`' },
        { id: 'L0-002', keywords: ['DOM事件', 'UI类', '事件绑定'], checkMethod: '检查UI类是否在构造函数中绑定事件' },
        { id: 'L0-003', keywords: ['QA测试', '审核', '功能失效'], checkMethod: '检查QA是否实际点击了每个按钮' },
        { id: 'L0-004', keywords: ['JavaScript', '常量', '全局暴露'], checkMethod: '检查常量是否定义在文件开头' },
        { id: 'L0-005', keywords: ['测试跳过', '回归测试'], checkMethod: '检查是否执行了所有测试类型' }
      ],
      'L1': [
        { id: 'L1-001', keywords: ['角色分工', '主程序员'], checkMethod: '检查主程序员是否只写框架' },
        { id: 'L1-002', keywords: ['QA流程', '验收环节'], checkMethod: '检查Phase 3是否包含QA测试' },
        { id: 'L1-003', keywords: ['算法', '路径检测'], checkMethod: '检查算法是否覆盖边界情况' },
        { id: 'L1-004', keywords: ['经验总结', '技能调用'], checkMethod: '检查项目完成后是否调用经验总结' }
      ]
    };
    
    const caches = predefinedCaches[level] || [];
    
    // 根据关键词筛选
    if (keywords.length === 0) {
      return caches;
    }
    
    return caches.filter(cache => {
      return cache.keywords.some(keyword => {
        return keywords.some(specialtyKeyword => 
          keyword.toLowerCase().includes(specialtyKeyword.toLowerCase()) ||
          specialtyKeyword.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    });
  }
}

// ==================== CLI 接口 ====================

function printUsage() {
  console.log(`
QA测试前经验缓存查询脚本 v1.0

用法:
  node qa-cache-query.js <命令> [选项]

命令:
  query --type=<类型> --name=<项目名>     执行缓存查询
  match --id=<缓存ID> --name=<项目名>     更新缓存计数
  sub-qa --role=<角色> --specialty=<领域> 生成子QA清单

选项:
  --type=<类型>                           项目类型 (Web游戏/休闲游戏/RPG等)
  --name=<项目名>                         项目名称
  --id=<缓存ID>                           缓存ID (如 L0-001)
  --role=<角色>                           子QA角色名
  --specialty=<领域>                      专业领域

示例:
  # QA测试前查询
  node qa-cache-query.js query --type=Web游戏 --name=连点器游戏

  # 发现问题后更新缓存
  node qa-cache-query.js match --id=L0-001 --name=连点器游戏

  # 生成子QA专用清单
  node qa-cache-query.js sub-qa --role=QA-1 --specialty=UI系统
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
  
  const query = new QACacheQuery(options.type, options.name);
  
  switch (command) {
    case 'query':
      query.query();
      break;
      
    case 'match':
      if (!options.id) {
        console.error('❌ 错误: 请提供缓存ID (--id=<缓存ID>)');
        process.exit(1);
      }
      query.matchCache(options.id);
      break;
      
    case 'sub-qa':
      if (!options.role || !options.specialty) {
        console.error('❌ 错误: 请提供角色 (--role=<角色>) 和专业领域 (--specialty=<领域>)');
        process.exit(1);
      }
      const checklist = query.generateSubQAChecklist(options.role, options.specialty);
      console.log('\n' + checklist);
      
      // 保存到文件
      const outputDir = path.join(process.cwd(), 'tests');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, `qa-cache-checklist-${options.role}.md`);
      fs.writeFileSync(outputPath, checklist, 'utf8');
      console.log(`✅ 清单已保存: ${outputPath}`);
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
module.exports = { QACacheQuery, CONFIG };
