/**
 * Function Test Suite
 * 函数签名测试套件
 */

const { BaseTestSuite } = require('../core/base-test-suite');
const { FunctionValidator } = require('../core/function-validator');

class FunctionTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('function', options);
        this.validator = new FunctionValidator(options.verbose);
    }
    
    async run(skills, dependencyGraph) {
        const allResults = [];
        
        for (const [skillName, skillData] of skills) {
            const results = this.validator.validate(skillData.header);
            
            for (const result of results) {
                allResults.push({
                    ...result,
                    skill: skillName
                });
            }
        }
        
        return this.aggregateResults(allResults);
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = this.validator.validateSkill(skillName, skillData);
        return this.aggregateResults(results);
    }
}

module.exports = { FunctionTestSuite };
