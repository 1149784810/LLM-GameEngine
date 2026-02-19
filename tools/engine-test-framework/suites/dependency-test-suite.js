/**
 * Dependency Test Suite
 * 依赖关系测试套件
 */

const { BaseTestSuite } = require('../core/base-test-suite');
const { DependencyValidator } = require('../core/dependency-validator');

class DependencyTestSuite extends BaseTestSuite {
    
    constructor(options = {}) {
        super('dependency', options);
        this.validator = new DependencyValidator(options.verbose);
    }
    
    async run(skills, dependencyGraph) {
        const results = this.validator.validate(skills, dependencyGraph);
        return this.aggregateResults(results);
    }
    
    async testSkill(skillName, skillData, allSkills, dependencyGraph) {
        const results = this.validator.validateSkill(skillName, skillData, allSkills, dependencyGraph);
        return this.aggregateResults(results);
    }
}

module.exports = { DependencyTestSuite };
