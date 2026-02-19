/**
 * 经验库缓存管理器 (Experience Cache Manager)
 * 
 * 功能：管理经验库的多级缓存索引，支持关键词匹配、频次计数和缓存级别动态调整
 * 包括：缓存查询、计数更新、级别升降级、检查清单生成
 * 
 * 引用：[project-experience-summarizer](SKILL.md) | [experience-cache-index](experience-cache-index.md)
 * 版本：v1.0
 * 日期：2026-02-19
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const CONFIG = {
  // 缓存索引文件路径
  cacheIndexPath: 'experience-cache-index.md',
  
  // 缓存级别定义
  levels: {
    'L0': { name: 'Critical', threshold: 10, downgradeDays: 30 },
    'L1': { name: 'High', threshold: 5, downgradeDays: 20 },
    'L2': { name: 'Medium', threshold: 2, downgradeDays: 15 },
    'L3': { name: 'Low', threshold: 1, archiveDays: 30 }
  },
  
  // 升级阈值
  upgradeThresholds: {
    'L3': 2,  // L3 -> L2
    'L2': 5,  // L2 -> L1
    'L1': 10  // L1 -> L0
  },
  
  // 匹配权重
  matchWeights: {
    'exact': 1.0,      // 精确匹配
    'fuzzy': 0.8,      // 模糊匹配
    'semantic': 0.6,   // 语义匹配
    'context': 0.4     // 上下文匹配
  },
  
  // 关键词同义词映射
  synonyms: {
    'ES Module': ['ES6 Module', '模块化', 'module'],
    'CORS': ['跨域', '跨域限制', '同源策略'],
    'DOM事件': ['事件绑定', '事件监听', 'click事件'],
    'QA测试': ['测试', '功能测试', '验收测试'],
    '审核': ['审查', '检查', '验收'],
    'JavaScript': ['JS', '脚本', '前端代码'],
    '常量': ['constant', '配置项', '静态变量'],
    '全局暴露': ['window暴露', '全局变量', '命名空间'],
    '回归测试': ['回归', '回归验证', '修改后测试'],
    '按下葫芦浮起瓢': ['改好A坏B', '引入新问题', '副作用']
  }
};

// ==================== 缓存管理器类 ====================

class ExperienceCacheManager {
  constructor(skillsDir) {
    this.skillsDir = skillsDir || path.join(process.cwd(), '.trae/skills/project-experience-summarizer');
    this.cacheIndexPath = path.join(this.skillsDir, CONFIG.cacheIndexPath);
    this.cacheData = null;
  }

  // ==================== 数据加载和保存 ====================
  
  /**
   * 加载缓存索引数据
   */
  loadCacheIndex() {
    console.log('📂 加载缓存索引...');
    
    if (!fs.existsSync(this.cacheIndexPath)) {
      console.error(`❌ 缓存索引文件不存在: ${this.cacheIndexPath}`);
      return null;
    }
    
    const content = fs.readFileSync(this.cacheIndexPath, 'utf8');
    this.cacheData = this._parseCacheIndex(content);
    
    console.log(`✅ 加载完成: ${this._getTotalCacheCount()} 条缓存`);
    return this.cacheData;
  }
  
  /**
   * 保存缓存索引数据
   */
  saveCacheIndex() {
    if (!this.cacheData) {
      console.error('❌ 没有缓存数据可保存');
      return false;
    }
    
    console.log('💾 保存缓存索引...');
    
    const content = this._generateCacheIndexMarkdown();
    fs.writeFileSync(this.cacheIndexPath, content, 'utf8');
    
    console.log('✅ 保存完成');
    return true;
  }
  
  /**
   * 解析缓存索引Markdown
   */
  _parseCacheIndex(content) {
    const cacheData = {
      metadata: {},
      caches: {
        'L0': [],
        'L1': [],
        'L2': [],
        'L3': []
      },
      keywordIndex: {}
    };
    
    // 解析元数据
    const metadataMatch = content.match(/## 元数据\s*\n\s*\|[^|]+\|[^|]+\|\s*\n\s*\|[-:|\s]+\|\s*\n((?:\s*\|[^|]+\|[^|]+\|\s*\n)+)/);
    if (metadataMatch) {
      const lines = metadataMatch[1].trim().split('\n');
      lines.forEach(line => {
        const match = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
        if (match) {
          cacheData.metadata[match[1].trim()] = match[2].trim();
        }
      });
    }
    
    // 解析各级缓存表
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      const regex = new RegExp(`### ${level}.*?\n\s*\|[^\n]+\|\s*\n\s*\|[-:|\s]+\|\s*\n((?:\s*\|[^\n]+\|\s*\n)+)`, 's');
      const match = content.match(regex);
      
      if (match) {
        const lines = match[1].trim().split('\n');
        lines.forEach(line => {
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          if (parts.length >= 8) {
            cacheData.caches[level].push({
              id: parts[0],
              experienceId: parts[1],
              problemType: parts[2],
              projectType: parts[3],
              keywords: parts[4].split(',').map(k => k.trim()),
              count: parseFloat(parts[5]) || 0,
              lastMatch: parts[6],
              checkMethod: parts[7],
              matchHistory: []
            });
          }
        });
      }
    });
    
    // 解析关键词索引
    const keywordSection = content.match(/## 关键词索引表[\s\S]*?(?=##|$)/);
    if (keywordSection) {
      const keywordLines = keywordSection[0].match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
      if (keywordLines) {
        keywordLines.slice(2).forEach(line => {  // 跳过表头
          const parts = line.split('|').map(p => p.trim()).filter(p => p);
          if (parts.length >= 4) {
            cacheData.keywordIndex[parts[0]] = {
              cacheId: parts[1],
              experienceId: parts[2],
              description: parts[3]
            };
          }
        });
      }
    }
    
    return cacheData;
  }
  
  /**
   * 生成缓存索引Markdown
   */
  _generateCacheIndexMarkdown() {
    let markdown = `# 项目经验库缓存索引表（Experience Cache Index）\n\n`;
    markdown += `> **功能说明**：本文件为经验库的多级缓存索引系统，支持关键词匹配、频次计数和缓存级别动态调整。\n`;
    markdown += `> \n`;
    markdown += `> **缓存级别说明**：\n`;
    markdown += `> - **L0 (Critical)**：最高频问题，必须优先检查\n`;
    markdown += `> - **L1 (High)**：高频问题，建议检查\n`;
    markdown += `> - **L2 (Medium)**：中频问题，按需检查\n`;
    markdown += `> - **L3 (Low)**：低频问题，参考检查\n`;
    markdown += `> \n`;
    markdown += `> **更新规则**：当某条经验被匹配时，计数+1，达到阈值后升级到更高级别缓存\n\n`;
    markdown += `---\n\n`;
    
    // 元数据
    markdown += `## 元数据\n\n`;
    markdown += `| 属性 | 值 |\n`;
    markdown += `|------|-----|\n`;
    markdown += `| 最后更新 | ${new Date().toISOString().split('T')[0]} |\n`;
    markdown += `| 总条目数 | ${this._getTotalCacheCount()} |\n`;
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      markdown += `| ${level}条目数 | ${this.cacheData.caches[level].length} |\n`;
    });
    markdown += `\n---\n\n`;
    
    // 缓存级别定义
    markdown += `## 缓存级别定义\n\n`;
    Object.entries(CONFIG.levels).forEach(([level, config]) => {
      markdown += `### ${level} - ${config.name} Cache\n`;
      markdown += `- **匹配阈值**：计数 >= ${config.threshold}\n`;
      markdown += `- **检查优先级**：${level === 'L0' ? '最高' : level === 'L1' ? '高' : level === 'L2' ? '中' : '低'}\n`;
      markdown += `- **升级策略**：计数达到${CONFIG.upgradeThresholds[level] || 'N/A'}，升级到${level === 'L3' ? 'L2' : level === 'L2' ? 'L1' : level === 'L1' ? 'L0' : '保持'}\n`;
      markdown += `- **降级策略**：${config.downgradeDays || config.archiveDays}天内无匹配，${level === 'L3' ? '归档' : '降级'}\n\n`;
    });
    
    // 缓存索引表
    markdown += `## 缓存索引表\n\n`;
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      markdown += `### ${level} - ${CONFIG.levels[level].name} Cache（${level === 'L0' ? '关键缓存' : level === 'L1' ? '高频缓存' : level === 'L2' ? '中频缓存' : '低频缓存'}）\n\n`;
      markdown += `> **${level === 'L0' ? 'QA测试时必须逐项检查以下问题' : level === 'L1' ? '建议QA测试时检查以下问题' : level === 'L2' ? '按需检查以下问题' : '参考检查以下问题'}**\n\n`;
      markdown += `| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |\n`;
      markdown += `|--------|--------|----------|----------|--------|------|----------|--------------|\n`;
      
      this.cacheData.caches[level].forEach(cache => {
        markdown += `| ${cache.id} | ${cache.experienceId} | ${cache.problemType} | ${cache.projectType} | ${cache.keywords.join(', ')} | ${cache.count} | ${cache.lastMatch} | ${cache.checkMethod} |\n`;
      });
      
      if (this.cacheData.caches[level].length === 0) {
        markdown += `| （暂无） | - | - | - | - | 0 | - | - |\n`;
      }
      
      markdown += `\n`;
    });
    
    // 关键词索引表
    markdown += `## 关键词索引表\n\n`;
    markdown += `### 按关键词快速查找\n\n`;
    markdown += `| 关键词 | 关联缓存ID | 经验ID | 问题描述 |\n`;
    markdown += `|--------|-----------|--------|----------|\n`;
    
    Object.entries(this.cacheData.keywordIndex).forEach(([keyword, info]) => {
      markdown += `| ${keyword} | ${info.cacheId} | ${info.experienceId} | ${info.description} |\n`;
    });
    
    markdown += `\n---\n\n`;
    
    // 其他部分保持原样
    markdown += `## 匹配规则定义\n\n`;
    markdown += `### 精确匹配（权重：1.0）\n`;
    markdown += `- 关键词完全匹配\n`;
    markdown += `- 例如："ES Module" 匹配 "ES Module"\n\n`;
    markdown += `### 模糊匹配（权重：0.8）\n`;
    markdown += `- 关键词包含关系\n`;
    markdown += `- 例如："ES Module" 匹配 "ES6 Module"\n\n`;
    markdown += `### 语义匹配（权重：0.6）\n`;
    markdown += `- 同义词或相关概念\n`;
    markdown += `- 例如："CORS" 匹配 "跨域"\n\n`;
    markdown += `### 上下文匹配（权重：0.4）\n`;
    markdown += `- 在相同上下文中出现\n`;
    markdown += `- 例如：在"Web游戏"上下文中匹配相关技术问题\n\n`;
    
    // 计数和升级规则
    markdown += `## 计数和升级规则\n\n`;
    markdown += `### 匹配计数规则\n\n`;
    markdown += `\`\`\`javascript\n`;
    markdown += `// 匹配计数逻辑\n`;
    markdown += `function incrementCounter(cacheId, matchType) {\n`;
    markdown += `  const cache = findCacheEntry(cacheId);\n`;
    markdown += `  const weight = getMatchWeight(matchType); // 1.0, 0.8, 0.6, 0.4\n`;
    markdown += `  \n`;
    markdown += `  cache.count += weight;\n`;
    markdown += `  cache.lastMatchDate = new Date().toISOString();\n`;
    markdown += `  cache.matchHistory.push({\n`;
    markdown += `    date: new Date().toISOString(),\n`;
    markdown += `    type: matchType,\n`;
    markdown += `    project: currentProject.name\n`;
    markdown += `  });\n`;
    markdown += `  \n`;
    markdown += `  // 检查是否升级\n`;
    markdown += `  checkUpgrade(cache);\n`;
    markdown += `}\n`;
    markdown += `\`\`\`\n\n`;
    
    // QA测试检查流程
    markdown += `## QA测试检查流程\n\n`;
    markdown += `### Phase 3 测试阶段使用流程\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `主测试(LT)准备测试计划\n`;
    markdown += `    ↓\n`;
    markdown += `读取缓存索引表（从L0开始）\n`;
    markdown += `    ↓\n`;
    markdown += `L0缓存逐项检查（必须）\n`;
    markdown += `    ↓\n`;
    markdown += `L1缓存逐项检查（建议）\n`;
    markdown += `    ↓\n`;
    markdown += `根据时间选择L2/L3缓存检查\n`;
    markdown += `    ↓\n`;
    markdown += `分配测试任务给子QA\n`;
    markdown += `    ↓\n`;
    markdown += `子QA测试时对比缓存条目\n`;
    markdown += `    ↓\n`;
    markdown += `发现问题 → 匹配缓存条目 → 计数+1\n`;
    markdown += `    ↓\n`;
    markdown += `更新缓存索引表\n`;
    markdown += `\`\`\`\n\n`;
    
    // 版本记录
    markdown += `## 版本记录\n\n`;
    markdown += `| 版本 | 日期 | 变更内容 |\n`;
    markdown += `|------|------|---------|\n`;
    markdown += `| v1.0 | 2026-02-19 | 初始版本，建立L0-L3多级缓存索引系统 |\n\n`;
    
    markdown += `---\n\n`;
    markdown += `**关联文件**：\n`;
    markdown += `- [经验库主文档](experience-db.md)\n`;
    markdown += `- [经验库管理技能](SKILL.md)\n`;
    markdown += `- [QA标准管理器](../qa-standards-manager/SKILL.md)\n`;
    
    return markdown;
  }

  _getTotalCacheCount() {
    if (!this.cacheData) return 0;
    return Object.values(this.cacheData.caches).reduce((sum, caches) => sum + caches.length, 0);
  }

  // ==================== 缓存查询 ====================
  
  /**
   * 根据项目类型和关键词查询缓存
   * @param {string} projectType - 项目类型
   * @param {string[]} keywords - 关键词列表
   * @returns {object} 按级别分类的缓存结果
   */
  queryCache(projectType, keywords = []) {
    console.log(`\n🔍 查询缓存: 项目类型="${projectType}", 关键词=[${keywords.join(', ')}]`);
    
    if (!this.cacheData) {
      this.loadCacheIndex();
    }
    
    const results = {
      'L0': [],
      'L1': [],
      'L2': [],
      'L3': []
    };
    
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      this.cacheData.caches[level].forEach(cache => {
        // 项目类型匹配
        const typeMatch = cache.projectType === projectType || 
                         cache.projectType === '通用' ||
                         projectType === '通用';
        
        // 关键词匹配
        let keywordMatch = false;
        let matchScore = 0;
        
        if (keywords.length === 0) {
          keywordMatch = true;
        } else {
          keywords.forEach(keyword => {
            cache.keywords.forEach(cacheKeyword => {
              const score = this._calculateMatchScore(keyword, cacheKeyword);
              if (score > 0) {
                keywordMatch = true;
                matchScore = Math.max(matchScore, score);
              }
            });
          });
        }
        
        if (typeMatch && keywordMatch) {
          results[level].push({
            ...cache,
            matchScore
          });
        }
      });
      
      // 按匹配分数排序
      results[level].sort((a, b) => b.matchScore - a.matchScore);
    });
    
    // 输出结果
    console.log('\n📊 查询结果:');
    Object.entries(results).forEach(([level, caches]) => {
      console.log(`  ${level}: ${caches.length} 条缓存`);
    });
    
    return results;
  }
  
  /**
   * 计算关键词匹配分数
   */
  _calculateMatchScore(keyword, cacheKeyword) {
    keyword = keyword.toLowerCase();
    cacheKeyword = cacheKeyword.toLowerCase();
    
    // 精确匹配
    if (keyword === cacheKeyword) {
      return CONFIG.matchWeights.exact;
    }
    
    // 模糊匹配
    if (keyword.includes(cacheKeyword) || cacheKeyword.includes(keyword)) {
      return CONFIG.matchWeights.fuzzy;
    }
    
    // 同义词匹配
    const synonyms = CONFIG.synonyms[cacheKeyword] || [];
    if (synonyms.some(syn => syn.toLowerCase() === keyword)) {
      return CONFIG.matchWeights.semantic;
    }
    
    return 0;
  }

  // ==================== 缓存计数和升级 ====================
  
  /**
   * 匹配缓存并更新计数
   * @param {string} cacheId - 缓存ID
   * @param {object} projectInfo - 项目信息
   * @param {string} matchType - 匹配类型
   * @returns {object} 更新结果
   */
  matchCache(cacheId, projectInfo, matchType = 'exact') {
    console.log(`\n🎯 匹配缓存: ${cacheId}`);
    
    if (!this.cacheData) {
      this.loadCacheIndex();
    }
    
    // 查找缓存
    let cache = null;
    let currentLevel = null;
    
    for (const level of ['L0', 'L1', 'L2', 'L3']) {
      cache = this.cacheData.caches[level].find(c => c.id === cacheId);
      if (cache) {
        currentLevel = level;
        break;
      }
    }
    
    if (!cache) {
      console.error(`❌ 缓存不存在: ${cacheId}`);
      return null;
    }
    
    // 计算权重
    const weight = CONFIG.matchWeights[matchType] || CONFIG.matchWeights.exact;
    
    // 更新计数
    const oldCount = cache.count;
    cache.count += weight;
    cache.lastMatch = new Date().toISOString().split('T')[0];
    
    if (!cache.matchHistory) {
      cache.matchHistory = [];
    }
    
    cache.matchHistory.push({
      date: new Date().toISOString(),
      type: matchType,
      project: projectInfo.name || '未知项目'
    });
    
    console.log(`  计数更新: ${oldCount} -> ${cache.count} (+${weight})`);
    
    // 检查升级
    const upgradeResult = this._checkAndUpgrade(cache, currentLevel);
    
    // 保存
    this.saveCacheIndex();
    
    return {
      cache,
      upgraded: upgradeResult.upgraded,
      newLevel: upgradeResult.newLevel,
      message: upgradeResult.upgraded 
        ? `✅ 缓存 ${cacheId} 已从 ${currentLevel} 升级到 ${upgradeResult.newLevel}`
        : `📈 缓存 ${cacheId} 计数+${weight} (当前: ${cache.count})`
    };
  }
  
  /**
   * 检查并执行升级
   */
  _checkAndUpgrade(cache, currentLevel) {
    const threshold = CONFIG.upgradeThresholds[currentLevel];
    
    if (!threshold || cache.count < threshold) {
      return { upgraded: false, newLevel: currentLevel };
    }
    
    // 确定新级别
    const levelOrder = ['L3', 'L2', 'L1', 'L0'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    const newLevel = levelOrder[currentIndex - 1];
    
    if (!newLevel) {
      return { upgraded: false, newLevel: currentLevel };
    }
    
    // 从旧级别移除
    const oldIndex = this.cacheData.caches[currentLevel].findIndex(c => c.id === cache.id);
    if (oldIndex > -1) {
      this.cacheData.caches[currentLevel].splice(oldIndex, 1);
    }
    
    // 更新ID
    const newId = newLevel + cache.id.slice(2);
    cache.id = newId;
    
    // 添加到新级别
    this.cacheData.caches[newLevel].push(cache);
    
    console.log(`  🆙 升级: ${currentLevel} -> ${newLevel}`);
    
    return { upgraded: true, newLevel };
  }
  
  /**
   * 执行降级检查
   */
  checkDowngrade() {
    console.log('\n🔄 执行降级检查...');
    
    if (!this.cacheData) {
      this.loadCacheIndex();
    }
    
    const now = new Date();
    const downgraded = [];
    
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      const days = CONFIG.levels[level].downgradeDays || CONFIG.levels[level].archiveDays;
      
      this.cacheData.caches[level] = this.cacheData.caches[level].filter(cache => {
        if (!cache.lastMatch || cache.lastMatch === '-') {
          return true;  // 保留未匹配过的
        }
        
        const lastMatchDate = new Date(cache.lastMatch);
        const daysSinceLastMatch = (now - lastMatchDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastMatch > days) {
          if (level === 'L3') {
            // 归档L3缓存
            console.log(`  📦 归档L3缓存: ${cache.id}`);
            downgraded.push({ cache, action: 'archived' });
            return false;
          } else {
            // 降级
            const levelOrder = ['L0', 'L1', 'L2', 'L3'];
            const currentIndex = levelOrder.indexOf(level);
            const newLevel = levelOrder[currentIndex + 1];
            
            cache.id = newLevel + cache.id.slice(2);
            this.cacheData.caches[newLevel].push(cache);
            
            console.log(`  ⬇️ 降级: ${cache.id} ${level} -> ${newLevel}`);
            downgraded.push({ cache, action: 'downgraded', from: level, to: newLevel });
            return false;
          }
        }
        
        return true;
      });
    });
    
    if (downgraded.length > 0) {
      this.saveCacheIndex();
      console.log(`✅ 降级检查完成: ${downgraded.length} 条缓存被处理`);
    } else {
      console.log('✅ 降级检查完成: 无需处理');
    }
    
    return downgraded;
  }

  // ==================== 检查清单生成 ====================
  
  /**
   * 生成QA测试检查清单
   * @param {string} projectType - 项目类型
   * @returns {object} 检查清单
   */
  generateChecklist(projectType) {
    console.log(`\n📝 生成检查清单: ${projectType}`);
    
    if (!this.cacheData) {
      this.loadCacheIndex();
    }
    
    const checklist = {
      projectType,
      generatedAt: new Date().toISOString(),
      L0: [],
      L1: [],
      L2: [],
      L3: []
    };
    
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      this.cacheData.caches[level].forEach(cache => {
        if (cache.projectType === projectType || cache.projectType === '通用') {
          checklist[level].push({
            id: cache.id,
            experienceId: cache.experienceId,
            problemType: cache.problemType,
            keywords: cache.keywords,
            checkMethod: cache.checkMethod,
            required: level === 'L0',
            count: cache.count
          });
        }
      });
    });
    
    console.log(`✅ 检查清单生成完成`);
    console.log(`  L0 (必须): ${checklist.L0.length} 项`);
    console.log(`  L1 (建议): ${checklist.L1.length} 项`);
    console.log(`  L2 (按需): ${checklist.L2.length} 项`);
    console.log(`  L3 (参考): ${checklist.L3.length} 项`);
    
    return checklist;
  }
  
  /**
   * 生成Markdown格式的检查清单
   */
  generateMarkdownChecklist(projectType) {
    const checklist = this.generateChecklist(projectType);
    
    let markdown = `## QA测试 - 经验库缓存检查清单\n\n`;
    markdown += `**项目类型**: ${projectType}\n\n`;
    markdown += `**生成时间**: ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    
    // L0 - 必须检查
    markdown += `### L0 - Critical（必须检查）\n\n`;
    if (checklist.L0.length === 0) {
      markdown += `> 暂无L0级别缓存\n\n`;
    } else {
      checklist.L0.forEach(item => {
        markdown += `- [ ] **${item.id}**: ${item.keywords.join(', ')}\n`;
        markdown += `  - 关联经验: ${item.experienceId}\n`;
        markdown += `  - 检查: ${item.checkMethod}\n`;
        markdown += `  - 结果: 通过 / 未通过 / 不适用\n`;
        markdown += `  - 备注:\n\n`;
      });
    }
    
    // L1 - 建议检查
    markdown += `### L1 - High（建议检查）\n\n`;
    if (checklist.L1.length === 0) {
      markdown += `> 暂无L1级别缓存\n\n`;
    } else {
      checklist.L1.forEach(item => {
        markdown += `- [ ] **${item.id}**: ${item.keywords.join(', ')}\n`;
        markdown += `  - 检查: ${item.checkMethod}\n\n`;
      });
    }
    
    // L2 - 按需检查
    if (checklist.L2.length > 0) {
      markdown += `### L2 - Medium（按需检查）\n\n`;
      checklist.L2.forEach(item => {
        markdown += `- [ ] **${item.id}**: ${item.keywords.join(', ')}\n`;
      });
      markdown += `\n`;
    }
    
    // 统计
    markdown += `### 检查结果统计\n\n`;
    markdown += `- L0通过: __/${checklist.L0.length}\n`;
    markdown += `- L1通过: __/${checklist.L1.length}\n`;
    markdown += `- L2通过: __/${checklist.L2.length}\n`;
    markdown += `- 总计通过: __/${checklist.L0.length + checklist.L1.length + checklist.L2.length}\n\n`;
    
    return markdown;
  }

  // ==================== 统计和分析 ====================
  
  /**
   * 获取缓存统计信息
   */
  getStats() {
    if (!this.cacheData) {
      this.loadCacheIndex();
    }
    
    const stats = {
      total: 0,
      byLevel: {},
      byProjectType: {},
      byProblemType: {},
      topKeywords: []
    };
    
    const keywordCount = {};
    
    ['L0', 'L1', 'L2', 'L3'].forEach(level => {
      stats.byLevel[level] = this.cacheData.caches[level].length;
      stats.total += stats.byLevel[level];
      
      this.cacheData.caches[level].forEach(cache => {
        // 项目类型统计
        stats.byProjectType[cache.projectType] = 
          (stats.byProjectType[cache.projectType] || 0) + 1;
        
        // 问题类型统计
        stats.byProblemType[cache.problemType] = 
          (stats.byProblemType[cache.problemType] || 0) + 1;
        
        // 关键词统计
        cache.keywords.forEach(keyword => {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        });
      });
    });
    
    // 排序关键词
    stats.topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    
    return stats;
  }
  
  /**
   * 打印统计信息
   */
  printStats() {
    const stats = this.getStats();
    
    console.log('\n📊 缓存统计信息');
    console.log('='.repeat(50));
    console.log(`总缓存数: ${stats.total}`);
    console.log('\n按级别分布:');
    Object.entries(stats.byLevel).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`);
    });
    
    console.log('\n按项目类型分布:');
    Object.entries(stats.byProjectType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n按问题类型分布:');
    Object.entries(stats.byProblemType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nTop 10 关键词:');
    stats.topKeywords.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.keyword}: ${item.count}次`);
    });
  }
}

// ==================== CLI 接口 ====================

function printUsage() {
  console.log(`
经验库缓存管理器 (Experience Cache Manager) v1.0

用法:
  node experience-cache-manager.js <命令> [选项]

命令:
  query --type=<类型> --keywords=<关键词>    查询缓存
  match --id=<缓存ID> --project=<项目名>     匹配缓存并更新计数
  upgrade --id=<缓存ID>                      手动升级缓存
  downgrade                                  执行降级检查
  checklist --type=<类型>                    生成检查清单
  stats                                      显示统计信息
  init                                       初始化缓存索引

选项:
  --type=<类型>                              项目类型 (Web游戏/休闲游戏/通用等)
  --keywords=<关键词>                        关键词列表，逗号分隔
  --id=<缓存ID>                              缓存ID (如 L0-001)
  --project=<项目名>                         项目名称
  --match-type=<类型>                        匹配类型 (exact/fuzzy/semantic/context)
  --skills-dir=<路径>                        技能目录路径

示例:
  node experience-cache-manager.js query --type=Web游戏 --keywords=ES Module,DOM事件
  node experience-cache-manager.js match --id=L0-001 --project=新项目A
  node experience-cache-manager.js checklist --type=Web游戏
  node experience-cache-manager.js stats
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
  
  const skillsDir = options['skills-dir'] || path.join(process.cwd(), '.trae/skills/project-experience-summarizer');
  const manager = new ExperienceCacheManager(skillsDir);
  
  console.log('🚀 经验库缓存管理器 v1.0\n');
  
  switch (command) {
    case 'query':
      if (!options.type) {
        console.error('❌ 错误: 请提供项目类型 (--type=<类型>)');
        process.exit(1);
      }
      const keywords = options.keywords ? options.keywords.split(',') : [];
      manager.queryCache(options.type, keywords);
      break;
      
    case 'match':
      if (!options.id || !options.project) {
        console.error('❌ 错误: 请提供缓存ID (--id=<ID>) 和项目名称 (--project=<名称>)');
        process.exit(1);
      }
      const result = manager.matchCache(options.id, { name: options.project }, options['match-type']);
      if (result) {
        console.log(`\n${result.message}`);
      }
      break;
      
    case 'upgrade':
      console.log('ℹ️ 升级功能已集成到 match 命令中');
      console.log('使用: node experience-cache-manager.js match --id=<ID> --project=<名称>');
      break;
      
    case 'downgrade':
      manager.checkDowngrade();
      break;
      
    case 'checklist':
      if (!options.type) {
        console.error('❌ 错误: 请提供项目类型 (--type=<类型>)');
        process.exit(1);
      }
      const markdown = manager.generateMarkdownChecklist(options.type);
      console.log('\n' + markdown);
      break;
      
    case 'stats':
      manager.printStats();
      break;
      
    case 'init':
      console.log('📂 初始化缓存索引...');
      // 创建空的缓存索引文件
      const initialContent = `# 项目经验库缓存索引表（Experience Cache Index）

> **功能说明**：本文件为经验库的多级缓存索引系统

## 元数据

| 属性 | 值 |
|------|-----|
| 最后更新 | ${new Date().toISOString().split('T')[0]} |
| 总条目数 | 0 |
| L0条目数 | 0 |
| L1条目数 | 0 |
| L2条目数 | 0 |
| L3条目数 | 0 |

## 缓存索引表

### L0 - Critical Cache（关键缓存）

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| （暂无） | - | - | - | - | 0 | - | - |

### L1 - High Cache（高频缓存）

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| （暂无） | - | - | - | - | 0 | - | - |

### L2 - Medium Cache（中频缓存）

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| （暂无） | - | - | - | - | 0 | - | - |

### L3 - Low Cache（低频缓存）

| 缓存ID | 经验ID | 问题类型 | 项目类型 | 关键词 | 计数 | 最后匹配 | 快速检查方法 |
|--------|--------|----------|----------|--------|------|----------|--------------|
| （暂无） | - | - | - | - | 0 | - | - |

## 关键词索引表

### 按关键词快速查找

| 关键词 | 关联缓存ID | 经验ID | 问题描述 |
|--------|-----------|--------|----------|
| （暂无） | - | - | - |
`;
      fs.writeFileSync(path.join(skillsDir, 'experience-cache-index.md'), initialContent, 'utf8');
      console.log('✅ 缓存索引初始化完成');
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
module.exports = { ExperienceCacheManager, CONFIG };
