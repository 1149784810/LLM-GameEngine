/**
 * Mock Agent Factory
 * Mock Agent工厂
 * 
 * 功能：
 * 1. 创建模拟Agent
 * 2. 生成模拟输出
 * 3. 模拟Agent行为
 * 4. 支持多种Agent类型
 */

const { HallucinationInjector } = require('./hallucination-injector');

const AGENT_TYPES = {
    DESIGNER: {
        name: 'designer',
        role: '策划',
        outputType: 'markdown',
        typicalLength: { min: 500, max: 5000 }
    },
    PROGRAMMER: {
        name: 'programmer',
        role: '程序',
        outputType: 'code',
        typicalLength: { min: 100, max: 2000 }
    },
    QA: {
        name: 'qa',
        role: '测试',
        outputType: 'report',
        typicalLength: { min: 300, max: 3000 }
    },
    PL: {
        name: 'pl',
        role: '项目负责人',
        outputType: 'plan',
        typicalLength: { min: 200, max: 2000 }
    }
};

const OUTPUT_TEMPLATES = {
    designer: {
        document: `# [模块名称]设计文档

## 概述
[模块概述内容]

## 核心功能
1. [功能1]
2. [功能2]
3. [功能3]

## 详细设计
### [子系统1]
[详细描述]

### [子系统2]
[详细描述]

## 数据结构
\`\`\`
[数据结构定义]
\`\`\`

## 接口定义
| 接口名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| [接口1] | [参数] | [返回值] | [说明] |
`,
        todolist: `# [角色]TodoList

## 任务清单
- [ ] 任务1: [描述]
- [ ] 任务2: [描述]
- [x] 任务3: [描述] (已完成)

## 验收标准
1. [标准1]
2. [标准2]
`
    },
    
    programmer: {
        code: `/**
 * [模块名称]
 * [描述]
 */

class [ClassName] {
    constructor(config) {
        this.config = config;
    }
    
    // [方法描述]
    [methodName](params) {
        // 实现
        return result;
    }
}

module.exports = { [ClassName] };
`,
        interface: `interface [InterfaceName] {
    [property]: [type];
    [method]([params]): [returnType];
}
`
    },
    
    qa: {
        report: `# 测试报告

## 测试概述
- 测试时间: [时间]
- 测试范围: [范围]
- 测试类型: [类型]

## 测试结果
| 测试项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| [测试1] | [预期] | [实际] | ✅/❌ |

## 问题清单
| ID | 描述 | 严重程度 | 状态 |
|----|------|----------|------|
| BUG-001 | [描述] | [严重程度] | [状态] |

## 测试证据
- 截图: [数量]张
- 日志: [数量]份
`
    },
    
    pl: {
        plan: `# 项目计划

## 当前阶段
[阶段描述]

## 任务分配
| 角色 | 任务 | 状态 |
|------|------|------|
| [角色] | [任务] | [状态] |

## 阻塞点状态
| BP | 状态 | 解锁条件 |
|----|------|----------|
| BP-001 | [状态] | [条件] |
`
    }
};

class MockAgentFactory {
    
    constructor(options = {}) {
        this.options = options;
        this.hallucinationInjector = new HallucinationInjector({
            enabled: options.enableHallucination !== false,
            intensity: options.hallucinationIntensity || 'medium'
        });
        this.agents = new Map();
        this.callHistory = [];
    }
    
    createAgent(type, config = {}) {
        const agentType = AGENT_TYPES[type.toUpperCase()] || AGENT_TYPES.DESIGNER;
        
        const agent = {
            id: config.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: agentType.name,
            role: agentType.role,
            config: config,
            outputType: agentType.outputType,
            typicalLength: agentType.typicalLength,
            
            execute: async (task) => {
                return this._executeAgent(agent, task);
            }
        };
        
        this.agents.set(agent.id, agent);
        return agent;
    }
    
    async _executeAgent(agent, task) {
        const startTime = Date.now();
        
        await this._simulateDelay();
        
        let output = this._generateOutput(agent, task);
        
        if (this.options.enableHallucination !== false) {
            output = this.hallucinationInjector.inject(output, {
                patterns: task.hallucinationPatterns
            });
        }
        
        const endTime = Date.now();
        
        const result = {
            agentId: agent.id,
            agentType: agent.type,
            task: task,
            output: output,
            timing: {
                start: startTime,
                end: endTime,
                duration: endTime - startTime
            },
            success: true
        };
        
        this.callHistory.push(result);
        
        return result;
    }
    
    _generateOutput(agent, task) {
        const template = OUTPUT_TEMPLATES[agent.type] || OUTPUT_TEMPLATES.designer;
        const templateKey = task.outputType || Object.keys(template)[0];
        const templateContent = template[templateKey] || template[Object.keys(template)[0]];
        
        const output = {
            content: this._fillTemplate(templateContent, task),
            type: agent.outputType,
            length: 0,
            metadata: {
                generated: true,
                agentType: agent.type,
                timestamp: new Date().toISOString()
            },
            testResults: null,
            evidence: null,
            metrics: null
        };
        
        output.length = output.content.length;
        
        if (agent.type === 'qa') {
            output.testResults = this._generateTestResults(task);
            output.evidence = this._generateEvidence(task);
            output.metrics = this._generateMetrics(task);
        }
        
        if (agent.type === 'programmer') {
            output.codeMetrics = {
                lines: Math.floor(Math.random() * 200) + 50,
                complexity: Math.floor(Math.random() * 10) + 1,
                coverage: Math.random() * 0.3 + 0.7
            };
        }
        
        return output;
    }
    
    _fillTemplate(template, task) {
        let result = template;
        
        const replacements = {
            '[模块名称]': task.moduleName || '未命名模块',
            '[模块概述内容]': task.description || '模块描述',
            '[角色]': task.role || '开发者',
            '[时间]': new Date().toISOString(),
            '[范围]': task.scope || '全范围',
            '[类型]': task.testType || '功能测试'
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }
    
    _generateTestResults(task) {
        const itemCount = task.testItemCount || 10;
        const items = [];
        
        for (let i = 1; i <= itemCount; i++) {
            items.push({
                id: `TEST-${String(i).padStart(3, '0')}`,
                name: `测试项${i}`,
                expected: '预期结果',
                actual: '实际结果',
                passed: Math.random() > 0.1
            });
        }
        
        const passed = items.filter(i => i.passed).length;
        
        return {
            items: items,
            summary: {
                total: itemCount,
                passed: passed,
                failed: itemCount - passed,
                passRate: passed / itemCount
            }
        };
    }
    
    _generateEvidence(task) {
        const screenshotCount = task.screenshotCount || Math.floor(Math.random() * 5) + 1;
        const screenshots = [];
        
        for (let i = 0; i < screenshotCount; i++) {
            screenshots.push({
                path: `tests/evidence/screenshots/screenshot_${i + 1}.png`,
                timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                size: Math.floor(Math.random() * 500000) + 100000
            });
        }
        
        return {
            screenshots: screenshots,
            logs: [
                {
                    path: 'tests/evidence/logs/test.log',
                    timestamp: new Date().toISOString(),
                    lines: Math.floor(Math.random() * 100) + 50
                }
            ]
        };
    }
    
    _generateMetrics(task) {
        return {
            completeness: Math.random() * 0.2 + 0.8,
            consistency: Math.random() * 0.1 + 0.9,
            coverage: Math.random() * 0.3 + 0.7,
            authenticity: Math.random() * 0.2 + 0.8
        };
    }
    
    async _simulateDelay() {
        const minDelay = this.options.minDelay || 100;
        const maxDelay = this.options.maxDelay || 1000;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    createParallelAgents(count, type, configs = []) {
        const agents = [];
        
        for (let i = 0; i < count; i++) {
            const config = configs[i] || {};
            agents.push(this.createAgent(type, { ...config, id: `agent-parallel-${i}` }));
        }
        
        return agents;
    }
    
    async executeParallel(agents, tasks) {
        const promises = agents.map((agent, index) => {
            const task = tasks[index] || tasks[0];
            return agent.execute(task);
        });
        
        return Promise.all(promises);
    }
    
    getCallHistory() {
        return [...this.callHistory];
    }
    
    getAgentStats() {
        const stats = {
            totalAgents: this.agents.size,
            totalCalls: this.callHistory.length,
            byType: {}
        };
        
        for (const call of this.callHistory) {
            const type = call.agentType;
            if (!stats.byType[type]) {
                stats.byType[type] = { count: 0, totalDuration: 0 };
            }
            stats.byType[type].count++;
            stats.byType[type].totalDuration += call.timing.duration;
        }
        
        for (const type of Object.keys(stats.byType)) {
            stats.byType[type].avgDuration = 
                stats.byType[type].totalDuration / stats.byType[type].count;
        }
        
        return stats;
    }
    
    reset() {
        this.agents.clear();
        this.callHistory = [];
    }
}

module.exports = { MockAgentFactory, AGENT_TYPES, OUTPUT_TEMPLATES };
