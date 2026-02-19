/**
 * Header Test Suite
 * Header元数据测试套件
 */

const { BaseTestSuite } = require('../core/base-test-suite');
const { HeaderValidator } = require('../core/header-validator');

class HeaderTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('header', options);
        this.validator = new HeaderValidator(options.verbose);
    }
    
    async run(skills, dependencyGraph) {
        const allResults = [];
        
        for (const [skillName, skillData] of skills) {
            const results = this.validator.validate(skillData.header, skillName);
            
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
        const results = this.validator.validate(skillData.header, skillName);
        return this.aggregateResults(results);
    }
}

module.exports = { HeaderTestSuite };
