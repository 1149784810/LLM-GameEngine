---
name: "output-normalizer"
version: "1.1.0"
description: "Determines the most appropriate output directory for files and assets based on context. Invoke when any agent needs to create files, write outputs, or save assets to disk."
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 0
dependencies: []

contracts:
  input:
    required_documents: []
  output:
    required_documents: []

execution:
  mode: "blocking"
  preconditions: []
  postconditions: []
  rollback:
    supported: false

quality:
  acceptance_criteria: []
  testing:
    required_tests: []
    evidence_required: false

tracking:
  execution_status:
    current: "PENDING"
  error_codes: []
  checkpoints: []

functions:
  main:
    name: "normalize_path"
    signature: "normalize_path(file_type: STRING, context: CONTEXT) -> PATH"
    description: "规范化输出路径"
  queries:
    - name: "get_output_dir"
      signature: "get_output_dir(asset_type: STRING) -> DIR_PATH"
      description: "获取输出目录"
---

# 输出规范器

## 目的

在智能体每次要创建文件、输出资产或保存数据到磁盘时，选择最合适的目录进行输出。根据当前任务的上下文和性质，自动判断文件应该存放在哪个目录下。

## 调用时机

**CRITICAL**: 此技能必须在以下场景调用：

1. **任何智能体准备输出文件到磁盘时**
2. **任何智能体需要创建新文件或目录时**
3. **任何智能体需要保存资产（图片、音频、文档等）时**
4. **不确定文件应该存放在哪里时**

**调用方式**：
```
智能体: "我需要输出[文件类型]到磁盘"
    ↓
项目负责人: 调用 output-normalizer 技能
    ↓
output-normalizer: 分析上下文，返回推荐的输出路径
    ↓
智能体: 按照推荐路径输出文件
```

## 输出目录规范

### 1. `projects/` 目录 - 完整项目开发

**适用场景**：
- 完整的游戏开发项目
- 需要长期维护的应用程序
- 有明确项目名称和结构的工程

**目录结构**：
```
projects/
└── [project-name]/           # 例如: projects/match-tiles/, projects/super-mario/
    ├── docs/                # 策划文档
    │   ├── 系统策划/
    │   ├── 数值策划/
    │   ├── 关卡策划/
    │   └── ...
    ├── src/                 # 源代码
    ├── assets/              # 资源文件 ⭐资产本地化存储
    │   ├── images/          # 图片资源
    │   │   ├── characters/  # 角色立绘
    │   │   ├── icons/       # 图标
    │   │   ├── backgrounds/ # 背景图
    │   │   ├── effects/     # 特效
    │   │   └── ui/          # UI元素
    │   ├── audio/           # 音频资源
    │   │   ├── bgm/         # 背景音乐
    │   │   ├── sfx/         # 音效
    │   │   └── voice/       # 语音
    │   └── generated/       # AI生成资产记录
    │       └── asset-manifest.json
    ├── tests/               # 测试文件
    └── index.html          # 入口文件
```

**判断标准**：
- [ ] 用户明确提出了游戏/应用开发需求
- [ ] 有具体的项目名称
- [ ] 需要完整的开发流程（策划→开发→测试）
- [ ] 文件需要长期保存和版本管理

**示例**：
- ❌ 错误: `C:\Users\Docs\游戏设计.md`
- ✅ 正确: `projects/my-game/docs/系统策划/游戏设计.md`

### 2. `output/` 目录 - 临时输出文件

**适用场景**：
- 临时性的内容创作（小说、文章、报告等）
- 一次性生成的文档
- 不需要长期维护的独立文件
- 快速原型或概念验证

**目录结构**：
```
output/
├── [日期]/                  # 例如: output/2026-02-19/
│   └── [文件名称].[扩展名]
├── [内容类型]/              # 例如: output/小说/, output/报告/
│   └── [文件名称].[扩展名]
└── temp/                    # 临时文件（可定期清理）
```

**判断标准**：
- [ ] 临时性任务（写小说、生成报告等）
- [ ] 不需要复杂的项目结构
- [ ] 一次性交付，不需要后续迭代
- [ ] 用户没有明确的项目名称

**示例**：
- ❌ 错误: `projects/我的小说/`
- ✅ 正确: `output/小说/科幻短篇_第一章.md`

### 3. `temp/` 目录 - 临时测试和开发

**适用场景**：
- 临时测试脚本
- 开发过程中的草稿文件
- 一次性实验代码
- 临时缓存文件
- 不需要长期保存的文件

**目录结构**：
```
temp/
├── [日期]/                  # 例如: temp/2026-02-19/
│   └── [临时文件].[扩展名]
├── test_[描述].[扩展名]     # 测试文件
└── draft_[描述].[扩展名]    # 草稿文件
```

**判断标准**：
- [ ] 临时测试或实验
- [ ] 开发过程中的草稿
- [ ] 可以定期清理的文件
- [ ] 不需要版本管理

**示例**：
- ❌ 错误: `projects/测试脚本/`
- ✅ 正确: `temp/test_api_connection.py`

### 4. `tools/` 目录 - 长期工具和脚本

**适用场景**：
- 需要长期使用的工具脚本
- 跨项目共享的实用程序
- 需要频繁使用的自动化脚本
- 需要跨机器设备同步的工具

**目录结构**：
```
tools/
├── [工具类别]/              # 例如: tools/部署/, tools/测试/
│   └── [工具名称].[扩展名]
├── [脚本名称].[扩展名]      # 独立工具脚本
└── README.md               # 工具说明文档
```

**判断标准**：
- [ ] 需要长期使用（超过当前项目周期）
- [ ] 可能在多个项目中复用
- [ ] 需要跨机器设备同步
- [ ] 有独立的功能价值

**示例**：
- ❌ 错误: `temp/deploy_script.py`
- ✅ 正确: `tools/deploy/web_deploy.py`

## 决策流程图

```
智能体需要输出文件
    ↓
分析任务上下文
    ↓
是完整项目开发？
    ↓ 是
获取项目名称
    ↓
验证项目名称合规性 ⭐新增
    ↓ 不合规
转换为合规英文名称
    ↓
输出到 projects/[合规项目名称]/
    ↓
根据文件类型选择子目录
    ↓
结束

是完整项目开发？
    ↓ 否
是临时内容创作？
    ↓ 是
输出到 output/[类型]/
    ↓
结束

是临时内容创作？
    ↓ 否
是临时测试/草稿？
    ↓ 是
输出到 temp/
    ↓
结束

是临时测试/草稿？
    ↓ 否
是长期工具/脚本？
    ↓ 是
输出到 tools/
    ↓
结束
```

## 决策检查清单

### 完整项目开发检查
- [ ] 用户是否提出了完整的游戏/应用开发需求？
- [ ] 是否有明确的项目名称？
- [ ] 是否需要策划→开发→测试的完整流程？
- [ ] 文件是否需要长期保存？

**如果以上任意一项为是 → 使用 `projects/` 目录**

### 临时内容创作检查
- [ ] 是否是写小说、文章、报告等创作任务？
- [ ] 是否是一次性交付的内容？
- [ ] 是否需要复杂的项目结构？
- [ ] 用户是否没有明确的项目名称？

**如果以上任意一项为是 → 使用 `output/` 目录**

### 临时测试检查
- [ ] 是否是临时测试脚本？
- [ ] 是否是开发草稿？
- [ ] 文件是否可以定期清理？
- [ ] 是否不需要版本管理？

**如果以上任意一项为是 → 使用 `temp/` 目录**

### 长期工具检查
- [ ] 是否需要在多个项目中使用？
- [ ] 是否需要跨机器同步？
- [ ] 是否有独立的功能价值？
- [ ] 是否需要长期使用？

**如果以上任意一项为是 → 使用 `tools/` 目录**

## 使用示例

### 示例 1: 游戏开发项目

**场景**: 用户说"帮我开发一个连连看游戏"

**调用时机**: 主策划准备输出策划文档时

**决策过程**:
```
是完整项目开发？ → 是
项目名称？ → 连连看（中文）
验证项目名称合规性 → 不合规
转换为合规名称 → match-tiles
文件类型？ → 策划文档
推荐路径：projects/match-tiles/docs/系统策划/
```

**输出**:
```
请将策划文档输出到：
projects/match-tiles/docs/系统策划/游戏设计.md
```

### 示例 2: 临时写小说

**场景**: 用户说"帮我写一篇科幻小说"

**调用时机**: 智能体准备输出小说内容时

**决策过程**:
```
是完整项目开发？ → 否
是临时内容创作？ → 是
内容类型？ → 小说
推荐路径：output/小说/
```

**输出**:
```
请将小说输出到：
output/小说/科幻短篇_2026-02-19.md
```

### 示例 3: 临时测试脚本

**场景**: 智能体需要写一个测试API连接的脚本

**调用时机**: 智能体准备创建测试脚本时

**决策过程**:
```
是完整项目开发？ → 否
是临时内容创作？ → 否
是临时测试？ → 是
推荐路径：temp/
```

**输出**:
```
请将测试脚本输出到：
temp/test_api_connection_2026-02-19.py
```

### 示例 4: 长期部署工具

**场景**: 开发一个可以重复使用的部署脚本

**调用时机**: 智能体准备创建部署脚本时

**决策过程**:
```
是完整项目开发？ → 否
是临时内容创作？ → 否
是临时测试？ → 否
是长期工具？ → 是
推荐路径：tools/部署/
```

**输出**:
```
请将部署脚本输出到：
tools/部署/web_deploy.py
```

## 注意事项

1. **优先使用项目目录**: 如果有任何疑问，优先使用 `projects/` 目录，确保文件不会散落在各处

2. **避免根目录 clutter**: 严禁将文件直接输出到工作区根目录，必须通过本技能确定合适的目录

3. **定期清理 temp**: `temp/` 目录的文件可以定期清理，不要将重要文件放在这里

4. **tools 目录管理**: `tools/` 目录的工具应该有 README 说明，方便其他人使用

5. **output 目录组织**: `output/` 目录建议按日期或类型组织，避免文件过多难以查找

6. **项目名称规范**: 项目名称必须严格遵循以下规则：
   
   **强制要求**：
   - ✅ 只能使用英文字母（a-z, A-Z）
   - ✅ 可以包含数字（0-9）
   - ✅ 可以使用连字符（-）和下划线（_）
   - ❌ 禁止使用中文字符
   - ❌ 禁止使用空格
   - ❌ 禁止使用特殊字符（如 @#$%^&*()+=[]{}|\\:;"'<>,.?/等）
   - ❌ 禁止以数字开头
   - ❌ 禁止以连字符或下划线开头或结尾
   
   **命名验证函数**：
   ```
   FUNCTION validate_project_name(name: STRING) -> VALIDATION_RESULT:
       规则检查：
       1. 长度检查：3-50个字符
       2. 字符检查：只允许 [a-zA-Z0-9_-]
       3. 首字符检查：必须是字母 [a-zA-Z]
       4. 尾字符检查：不能是 - 或 _
       5. 连续符号检查：不能有连续的 - 或 _
       
       如果不合规：
           返回 建议的英文名称
   ```
   
   **转换示例**：
   | 用户输入 | 正确输出 | 说明 |
   |---------|---------|------|
   | 连连看 | `lianjiankan` 或 `match-tiles` | 中文转英文 |
   | 超级马里奥 | `super-mario` | 中文转英文 |
   | 我的游戏 123 | `my-game-123` | 去除空格 |
   | Test@Game | `test-game` | 去除特殊字符 |
   | 123Game | `game-123` | 数字开头加前缀 |
   | -test- | `test` | 去除首尾符号 |

7. **⭐资产本地化存储**: AI生成的资产（图片、音频）必须下载到项目的 `assets/` 目录，禁止在代码中使用远程URL链接

8. **⭐资产路径规范**: 资产文件使用相对于项目根目录的路径，如 `./assets/images/characters/hero.png`

## 快速参考表

| 场景 | 推荐目录 | 示例路径 |
|------|---------|---------|
| 游戏开发 | `projects/[project-name]/` | `projects/match-tiles/src/game.js` |
| 应用开发 | `projects/[project-name]/` | `projects/task-manager/src/app.py` |
| 写小说 | `output/小说/` | `output/小说/科幻短篇.md` |
| 生成报告 | `output/报告/` | `output/报告/数据分析_2026-02-19.md` |
| 临时测试 | `temp/` | `temp/test_api.py` |
| 开发草稿 | `temp/` | `temp/draft_algorithm.js` |
| 部署工具 | `tools/部署/` | `tools/部署/deploy.sh` |
| 实用脚本 | `tools/` | `tools/cleanup_logs.py` |
| **⭐AI生成图片** | `projects/[project]/assets/images/` | `projects/my-game/assets/images/characters/hero.png` |
| **⭐AI生成音频** | `projects/[project]/assets/audio/` | `projects/my-game/assets/audio/sfx/jump.mp3` |
| **⭐资产清单** | `projects/[project]/assets/generated/` | `projects/my-game/assets/generated/asset-manifest.json` |

## 错误示例

| 错误做法 | 问题 | 正确做法 |
|---------|------|---------|
| `C:\Users\Desktop\游戏设计.md` | 散落在系统目录 | `projects/my-game/docs/策划/游戏设计.md` |
| `temp/重要项目/` | 重要文件放在临时目录 | `projects/important-project/` |
| `projects/测试脚本.py` | 测试脚本放在项目根目录 | `temp/test_script.py` |
| `output/长期工具.py` | 长期工具放在临时输出目录 | `tools/utility_script.py` |
| `tools/临时测试.py` | 临时文件放在工具目录 | `temp/test_2026-02-19.py` |
| **⭐`"https://ai.com/image.png"`** | **代码中直接使用远程URL** | **`"./assets/images/hero.png"`** |
| **⭐`assets/hero.png`** | **资产未分类存放** | **`assets/images/characters/hero.png`** |
| **⭐`projects/连连看/`** | **项目名使用中文** | **`projects/match-tiles/`** |
| **⭐`projects/My Game/`** | **项目名包含空格** | **`projects/my-game/`** |
| **⭐`projects/Test@Game/`** | **项目名包含特殊字符** | **`projects/test-game/`** |
| **⭐`projects/123game/`** | **项目名以数字开头** | **`projects/game-123/`** |
