---
name: "asset-generation-manager"
version: "1.0.0"
description: "资产生成管理器，负责管理游戏艺术资产的生成流程。优先调用MCP图像生成工具（如LiblibAI），在MCP工具不可用时使用程序化生成方案。确保资产生成的高效性和一致性。"
author: "engine-team"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 4
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"
  - name: "agent-dispatcher"
    layer: 3
    type: "required"
    purpose: "智能体调度"

contracts:
  input:
    required_documents:
      - pattern: "docs/02-策划文档/ASSET-REQ-.*\\.md"
        description: "资产需求文档"
  output:
    required_documents:
      - pattern: "assets/.*/.*\\.(png|jpg|wav|mp3)"
        description: "生成的资产文件"

execution:
  mode: "blocking"
  preconditions: []
  postconditions: []
  rollback:
    supported: true
    strategy: "checkpoint"
    side_effects:
      - "删除已生成的资产文件"
    recovery_actions:
      - action: "DELETE_ARTIFACTS"
        target: "assets/*"

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
    name: "generate_asset"
    signature: "generate_asset(asset_spec: ASSET_SPEC) -> ASSET_PATH"
    description: "生成游戏资产"
---

# 资产生成管理器

> **术语引用**：[terminology-standard](.trae/skills/terminology-standard/SKILL.md)
> 
> **流程引用**：[fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md)
> 
> **调度引用**：[agent-dispatcher](.trae/skills/agent-dispatcher/SKILL.md)
> 
> 本文档使用标准术语：Stage X-Y、MCP工具、程序化生成

---

## 功能概述

本技能负责管理游戏艺术资产的生成流程，包括：
- **优先使用MCP工具**：检查并调用可用的MCP图像生成工具
- **备选程序化生成**：在MCP工具不可用时使用程序化方案
- **资产统一管理**：记录生成方式和参数，确保一致性
- **质量检查**：验证生成资产的质量和适用性

> **核心原则**：MCP工具优先，程序化生成备选

---

## 资产生成优先级

### 生成方式优先级

| 优先级 | 生成方式 | 使用条件 | 工具示例 |
|--------|----------|----------|----------|
| **P0 - 优先** | MCP图像生成工具 | 工具可用且符合需求 | LiblibAI |
| **P1 - 备选** | 程序化生成 | MCP工具不可用 | Canvas API、SVG、Procedural |
| **P2 - 兜底** | 占位资源 | 以上都不可用 | 默认占位图 |

### 决策流程

```
收到资产生成请求
    ↓
检查MCP图像生成工具可用性
    ↓
├─→ MCP工具可用
│   ↓
│   使用MCP工具生成资产
│   ├─→ 生成成功 → 返回资产
│   └─→ 生成失败 → 尝试程序化生成
│
└─→ MCP工具不可用
    ↓
    使用程序化生成方案
    ├─→ 生成成功 → 返回资产
    └─→ 生成失败 → 使用占位资源
    ↓
记录生成方式和参数
```

---

## MCP图像生成工具

### 可用工具检查

**检查流程**：
1. 调用 `mcp_liblib-ai-picture_health_check` 检查LiblibAI状态
2. 如可用，获取工具能力和限制
3. 记录工具状态到项目日志

### LiblibAI 使用规范

**适用场景**：
- 角色立绘和头像
- 技能图标和特效
- 场景背景和氛围图
- UI装饰元素

**调用方式**：
```
mcp_liblib-ai-picture_create_image
  ├── prompt: 图片描述（必须）
  ├── width: 图片宽度（默认768）
  └── height: 图片高度（默认768）
```

**状态检查**：
```
mcp_liblib-ai-picture_check_image_status
  └── task_id: 任务ID
```

**最佳实践**：
- 使用详细的英文提示词
- 指定风格、光照、构图等要素
- 批量生成时统一风格参数
- 保存生成参数便于复现

---

## 程序化生成方案

### 适用场景

当MCP工具不可用时，使用程序化生成：
- 简单几何图形
- 程序化纹理
- 动态生成的UI元素
- 数学公式生成的图案

### 生成方法

| 方法 | 适用场景 | 技术实现 |
|------|----------|----------|
| Canvas API | 2D图形、图标 | HTML5 Canvas |
| SVG | 矢量图形、图标 | SVG Path |
| CSS | 简单装饰、渐变 | CSS3 |
| 程序化纹理 | 贴图、材质 | Noise算法 |

### 示例：程序化生成技能图标

```javascript
// 使用Canvas生成简单技能图标
function generateSkillIcon(type, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // 绘制背景
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制图标符号
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(type, 32, 40);
  
  return canvas.toDataURL();
}
```

---

## 资产生成流程

### 标准生成流程

```
┌─────────────────────────────────────────────────────────────┐
│                     资产生成流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 接收生成请求                                             │
│     └── 资产类型、数量、风格要求、尺寸规格                   │
│           ↓                                                 │
│  2. 检查MCP工具                                              │
│     └── 调用健康检查接口                                     │
│     └── 确认工具可用性和配额                                 │
│           ↓                                                 │
│  3. 选择生成方式                                             │
│     ├─→ MCP可用 → 使用MCP工具                               │
│     └─→ MCP不可用 → 使用程序化生成                          │
│           ↓                                                 │
│  4. 执行生成                                                 │
│     └── 批量生成资产                                         │
│     └── 监控生成进度                                         │
│           ↓                                                 │
│  5. 质量检查                                                 │
│     └── 验证资产质量                                         │
│     └── 检查是否符合需求                                     │
│           ↓                                                 │
│  6. 保存和记录                                               │
│     └── 保存资产到项目目录                                   │
│     └── 记录生成参数和工具信息                               │
│           ↓                                                 │
│  7. 返回结果                                                 │
│     └── 返回资产路径和元数据                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 批量生成流程

**适用场景**：需要生成大量相似资产时

```
批量生成请求（如：10个技能图标）
    ↓
统一风格参数
    ↓
并行调用生成工具
    ├─→ 使用MCP：并行提交多个生成任务
    └─→ 程序化生成：批量执行生成函数
    ↓
收集所有结果
    ↓
统一质量检查
    ↓
批量保存和记录
```

---

## 资产分类和生成策略

### 资产类型映射

| 资产类型 | 推荐生成方式 | MCP工具 | 程序化备选 |
|----------|-------------|---------|-----------|
| 角色立绘 | MCP优先 | LiblibAI | 占位图 |
| 技能图标 | MCP优先 | LiblibAI | Canvas生成 |
| UI按钮 | 程序化优先 | - | CSS/SVG |
| 背景图 | MCP优先 | LiblibAI | 渐变/图案 |
| 特效贴图 | MCP优先 | LiblibAI | 程序化纹理 |
| 道具图标 | MCP优先 | LiblibAI | Canvas生成 |

### 生成参数模板

**角色立绘模板**：
```
风格：二次元/写实/像素
尺寸：512x768 或 768x768
背景：透明/纯色/场景
姿态：正面/侧面/动作
表情：平静/战斗/开心
```

**技能图标模板**：
```
风格：扁平/立体/手绘
尺寸：64x64 或 128x128
背景：圆形/方形/透明
元素：火焰/冰霜/雷电/治疗
颜色：红色/蓝色/黄色/绿色
```

---

## 资产本地化存储规范 ⭐强制执行

### 核心原则

**⚠️ 强制要求**：所有AI生成的资产必须先下载到本地项目目录，再使用本地相对路径配置。

**禁止行为**：
- ❌ 直接在代码中使用AI生成资产的远程URL链接
- ❌ 使用临时链接或有时效性的URL
- ❌ 依赖外部服务的资产链接

**正确做法**：
- ✅ 生成资产后立即下载到本地
- ✅ 使用项目相对路径引用资产
- ✅ 确保资产随项目一起分发

### 资产存储目录结构

```
projects/[项目名]/
├── assets/
│   ├── images/
│   │   ├── characters/       # 角色立绘
│   │   ├── icons/            # 技能图标、道具图标
│   │   ├── backgrounds/      # 背景图
│   │   ├── effects/          # 特效贴图
│   │   └── ui/               # UI元素
│   ├── audio/
│   │   ├── bgm/              # 背景音乐
│   │   ├── sfx/              # 音效
│   │   └── voice/            # 语音
│   └── generated/            # AI生成资产记录
│       └── asset-manifest.json
```

### 资产下载流程

```
AI生成资产（图片/音频）
    ↓
获取生成结果（URL或Base64）
    ↓
【强制】下载到本地项目目录
    ├─→ 图片：保存为 PNG/JPG 格式
    └─→ 音频：保存为 MP3/WAV/OGG 格式
    ↓
生成资产清单记录
    ├── 原始URL（仅记录）
    ├── 本地路径（实际使用）
    ├── 生成参数
    └── 时间戳
    ↓
在代码中使用本地相对路径
    ↓
验证资产可访问性
```

### 资产下载实现

#### 图片资产下载

```javascript
// 下载AI生成的图片到本地
async function downloadImageToLocal(imageUrl, localPath) {
  // 1. 获取图片数据
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  // 2. 转换为Base64或直接保存
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 3. 保存到本地
  // 使用 Node.js fs 或浏览器下载API
  await fs.writeFile(localPath, buffer);
  
  return localPath;
}
```

#### 音频资产下载

```javascript
// 下载AI生成的音频到本地
async function downloadAudioToLocal(audioUrl, localPath) {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(localPath, buffer);
  return localPath;
}
```

### 资产清单格式

**asset-manifest.json**：
```json
{
  "version": "1.0",
  "generated_at": "2026-02-20T10:30:00Z",
  "assets": [
    {
      "id": "char-001",
      "name": "warrior-idle",
      "type": "image",
      "category": "characters",
      "local_path": "assets/images/characters/warrior-idle.png",
      "original_url": "https://ai-service.com/generated/xxx.png",
      "generated_by": "LiblibAI",
      "prompt": "warrior character, idle pose, fantasy style...",
      "size": { "width": 512, "height": 768 },
      "file_size": "256KB",
      "created_at": "2026-02-20T10:30:00Z"
    },
    {
      "id": "sfx-001",
      "name": "fireball-cast",
      "type": "audio",
      "category": "sfx",
      "local_path": "assets/audio/sfx/fireball-cast.mp3",
      "original_url": "https://ai-service.com/generated/xxx.mp3",
      "generated_by": "AudioGenerator",
      "prompt": "fireball casting sound effect",
      "duration": "1.5s",
      "created_at": "2026-02-20T10:35:00Z"
    }
  ]
}
```

### 代码中使用规范

**❌ 错误示例**：
```javascript
// 禁止：直接使用远程URL
const characterImage = "https://ai-service.com/generated/abc123.png";
const skillIcon = "https://temp-link.com/image.png";
```

**✅ 正确示例**：
```javascript
// 正确：使用本地相对路径
const characterImage = "./assets/images/characters/warrior-idle.png";
const skillIcon = "./assets/images/icons/fireball.png";

// 或使用配置文件
const ASSETS = {
  characters: {
    warrior: "./assets/images/characters/warrior-idle.png"
  },
  icons: {
    fireball: "./assets/images/icons/fireball.png"
  }
};
```

### 资产验证检查

在资产下载完成后，必须进行以下验证：

```markdown
## 资产验证清单

- [ ] 文件已成功保存到本地目录
- [ ] 文件格式正确（PNG/JPG/MP3/WAV）
- [ ] 文件大小合理（非空文件）
- [ ] 文件可正常打开/播放
- [ ] 相对路径引用正确
- [ ] asset-manifest.json 已更新
```

---

## 质量检查标准

### 检查清单

- [ ] 尺寸符合规格要求
- [ ] 格式正确（PNG/JPG/SVG）
- [ ] 文件大小合理
- [ ] 视觉风格统一
- [ ] 无明显的生成瑕疵
- [ ] 符合项目风格指南
- [ ] **已下载到本地目录** ⭐新增
- [ ] **使用本地相对路径** ⭐新增
- [ ] **asset-manifest.json已更新** ⭐新增

### 问题处理

| 问题类型 | 处理方式 |
|----------|----------|
| 生成失败 | 重试3次，失败后切换备选方案 |
| 质量不达标 | 调整参数重新生成 |
| 风格不一致 | 统一提示词风格关键词 |
| 文件过大 | 压缩或降低分辨率 |

---

## 记录和追踪

### 生成记录格式

```markdown
## 资产生成记录

### 生成批次：[批次ID]
- **生成时间**：YYYY-MM-DD HH:MM:SS
- **请求方**：[角色/模块]
- **生成方式**：MCP工具 / 程序化生成
- **使用工具**：[工具名称]
- **生成数量**：[数量]

### 资产清单
| 资产ID | 资产名称 | 类型 | 尺寸 | 路径 | 生成参数 |
|--------|----------|------|------|------|----------|
| | | | | | |

### 生成参数
- **提示词**：[用于MCP工具的提示词]
- **风格参数**：[风格设置]
- **程序化代码**：[如适用]

### 质量评估
- **通过率**：X/X
- **问题资产**：[列表]
- **备注**：[其他信息]
```

---

## 使用方式

### 调用示例

**单个资产生成**：
```
技术美术(TA): "需要生成一个火球技能图标"
    ↓
asset-generation-manager:
    1. 检查MCP工具可用性
    2. MCP可用，调用LiblibAI
    3. 生成图标
    4. 质量检查
    5. 保存到 assets/icons/fireball.png
    6. 记录生成参数
    ↓
返回给TA：
    - 资产路径：assets/icons/fireball.png
    - 生成方式：LiblibAI
    - 提示词："fireball skill icon, game asset, red and orange flames..."
```

**批量资产生成**：
```
系统策划(SD): "需要生成10个技能图标"
    ↓
asset-generation-manager:
    1. 统一风格参数
    2. 批量调用MCP工具
    3. 并行生成10个图标
    4. 统一质量检查
    5. 保存到 assets/icons/
    6. 生成记录文档
    ↓
返回给SD：
    - 资产列表：10个图标路径
    - 生成报告：成功率、质量问题
```

---

## 注意事项

1. **MCP工具优先**：始终优先尝试使用MCP图像生成工具
2. **配额管理**：注意MCP工具的调用配额和限制
3. **风格统一**：批量生成时确保风格参数一致
4. **参数记录**：详细记录生成参数，便于复现和修改
5. **质量把关**：生成后必须进行质量检查
6. **备选方案**：MCP工具不可用时，确保程序化生成可用
7. **成本控制**：监控MCP工具的使用成本

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本，建立资产生成管理流程 |

---

## 参考文档

- [terminology-standard](.trae/skills/terminology-standard/SKILL.md) - 术语标准
- [fullstack-game-engine](.trae/skills/fullstack-game-engine/SKILL.md) - 全栈游戏开发流程
- [agent-dispatcher](.trae/skills/agent-dispatcher/SKILL.md) - 智能体调度器
