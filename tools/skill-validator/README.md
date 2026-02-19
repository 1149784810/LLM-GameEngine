# Skill Validator Tools

技能验证工具集，用于验证技能文件的Header元数据、执行条件和质量标准。

## 文件说明

| 文件 | 说明 |
|------|------|
| skill-header-parser.js | 技能头部元数据解析器 |
| skill-validator-cli.js | 统一命令行工具 |
| skill-execution-validator.js | 执行条件验证器 |
| skill-quality-validator.js | 质量标准验证器 |
| skill-rollback-decider.js | 回滚决策器 |

## 使用方法

```bash
# 解析单个技能
node skill-validator-cli.js parse --skill=<name>

# 验证单个技能
node skill-validator-cli.js validate --skill=<name>

# 验证所有技能
node skill-validator-cli.js validate-all

# 检查执行条件
node skill-validator-cli.js check --skill=<name>

# 生成综合报告
node skill-validator-cli.js report --skill=<name>

# 测试所有技能
node skill-validator-cli.js test-all
```

## 相关文档

- 技能头部元数据规范: [docs/specs/skill-header-spec.md](../../docs/specs/skill-header-spec.md)
- 技能开发指南: [.trae/skills/skill-development-guide/SKILL.md](../../.trae/skills/skill-development-guide/SKILL.md)
