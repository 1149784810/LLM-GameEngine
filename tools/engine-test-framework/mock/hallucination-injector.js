/**
 * Hallucination Injector
 * 幻觉注入器
 * 
 * 功能：
 * 1. 模拟LLM幻觉行为
 * 2. 注入常见幻觉模式
 * 3. 生成随机错误输出
 * 4. 模拟上下文压缩问题
 */

const HALLUCINATION_PATTERNS = {
    PERFECT_PASS_RATE: {
        name: 'PERFECT_PASS_RATE',
        description: '100%通过率幻觉',
        probability: 0.15,
        apply: (output) => {
            if (output.testResults) {
                output.testResults.summary = {
                    total: output.testResults.items.length,
                    passed: output.testResults.items.length,
                    failed: 0,
                    passRate: 1.0
                };
            }
            return output;
        }
    },
    
    INSUFFICIENT_EVIDENCE: {
        name: 'INSUFFICIENT_EVIDENCE',
        description: '证据不足幻觉',
        probability: 0.2,
        apply: (output) => {
            if (output.evidence) {
                output.evidence.screenshots = output.evidence.screenshots?.slice(0, 1) || [];
                output.evidence.logs = [];
            }
            return output;
        }
    },
    
    MISSING_SCREENSHOTS: {
        name: 'MISSING_SCREENSHOTS',
        description: '截图缺失幻觉',
        probability: 0.1,
        apply: (output) => {
            if (output.evidence) {
                output.evidence.screenshots = [];
            }
            return output;
        }
    },
    
    CODE_INFERENCE: {
        name: 'CODE_INFERENCE',
        description: '仅凭代码推断',
        probability: 0.25,
        apply: (output) => {
            const phrases = [
                '代码看起来正常',
                '应该没问题',
                '理论上可行',
                '推测可以运行',
                '看起来应该能正常工作'
            ];
            if (output.report) {
                output.report += `\n\n注意：${phrases[Math.floor(Math.random() * phrases.length)]}`;
            }
            return output;
        }
    },
    
    TEMPLATE_COPY: {
        name: 'TEMPLATE_COPY',
        description: '模板复制粘贴',
        probability: 0.1,
        apply: (output) => {
            output.templateCopied = true;
            output.similarityScore = 0.9 + Math.random() * 0.1;
            return output;
        }
    },
    
    FABRICATED_DATA: {
        name: 'FABRICATED_DATA',
        description: '虚构数据',
        probability: 0.15,
        apply: (output) => {
            if (output.metrics) {
                for (const key of Object.keys(output.metrics)) {
                    output.metrics[key] = Math.random() * 0.3 + 0.7;
                }
            }
            return output;
        }
    },
    
    CONTEXT_COMPRESSION: {
        name: 'CONTEXT_COMPRESSION',
        description: '上下文压缩导致的信息丢失',
        probability: 0.2,
        apply: (output) => {
            if (output.details) {
                const keys = Object.keys(output.details);
                const removeCount = Math.floor(keys.length * 0.3);
                for (let i = 0; i < removeCount; i++) {
                    const randomKey = keys[Math.floor(Math.random() * keys.length)];
                    delete output.details[randomKey];
                }
            }
            return output;
        }
    }
};

const SEVERITY_WEIGHTS = {
    CRITICAL: 0.1,
    HIGH: 0.2,
    MEDIUM: 0.4,
    LOW: 0.3
};

class HallucinationInjector {
    
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.intensity = options.intensity || 'medium';
        this.patterns = { ...HALLUCINATION_PATTERNS };
        this.customPatterns = options.customPatterns || [];
        
        for (const pattern of this.customPatterns) {
            this.patterns[pattern.name] = pattern;
        }
        
        this.intensityMultiplier = {
            low: 0.3,
            medium: 0.6,
            high: 1.0,
            extreme: 1.5
        }[this.intensity] || 0.6;
    }
    
    inject(output, options = {}) {
        if (!this.enabled) {
            return output;
        }
        
        const clonedOutput = JSON.parse(JSON.stringify(output));
        const appliedPatterns = [];
        
        const patternNames = options.patterns || Object.keys(this.patterns);
        
        for (const patternName of patternNames) {
            const pattern = this.patterns[patternName];
            if (!pattern) continue;
            
            const adjustedProbability = pattern.probability * this.intensityMultiplier;
            
            if (Math.random() < adjustedProbability) {
                pattern.apply(clonedOutput);
                appliedPatterns.push(patternName);
            }
        }
        
        clonedOutput._hallucination = {
            injected: appliedPatterns.length > 0,
            patterns: appliedPatterns,
            intensity: this.intensity
        };
        
        return clonedOutput;
    }
    
    injectError(output, errorType) {
        const clonedOutput = JSON.parse(JSON.stringify(output));
        
        switch (errorType) {
            case 'timeout':
                clonedOutput.error = {
                    type: 'TIMEOUT',
                    message: '执行超时',
                    duration: 60000
                };
                break;
                
            case 'rate_limit':
                clonedOutput.error = {
                    type: 'RATE_LIMIT',
                    message: 'API调用频率限制',
                    retryAfter: 60
                };
                break;
                
            case 'context_overflow':
                clonedOutput.error = {
                    type: 'CONTEXT_OVERFLOW',
                    message: '上下文长度超限',
                    maxTokens: 128000,
                    actualTokens: 150000
                };
                break;
                
            case 'invalid_output':
                clonedOutput.error = {
                    type: 'INVALID_OUTPUT',
                    message: '输出格式无效',
                    expected: 'JSON',
                    actual: 'text'
                };
                break;
        }
        
        return clonedOutput;
    }
    
    generateRandomError() {
        const errorTypes = ['timeout', 'rate_limit', 'context_overflow', 'invalid_output'];
        const weights = [0.3, 0.2, 0.3, 0.2];
        
        let random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < errorTypes.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return errorTypes[i];
            }
        }
        
        return errorTypes[0];
    }
    
    getPatternStats() {
        return {
            totalPatterns: Object.keys(this.patterns).length,
            intensity: this.intensity,
            intensityMultiplier: this.intensityMultiplier,
            patterns: Object.entries(this.patterns).map(([name, pattern]) => ({
                name,
                probability: pattern.probability,
                adjustedProbability: pattern.probability * this.intensityMultiplier
            }))
        };
    }
    
    addCustomPattern(pattern) {
        if (!pattern.name || !pattern.apply) {
            throw new Error('Pattern must have name and apply function');
        }
        this.patterns[pattern.name] = pattern;
    }
    
    setIntensity(intensity) {
        this.intensity = intensity;
        this.intensityMultiplier = {
            low: 0.3,
            medium: 0.6,
            high: 1.0,
            extreme: 1.5
        }[intensity] || 0.6;
    }
}

module.exports = { HallucinationInjector, HALLUCINATION_PATTERNS };
