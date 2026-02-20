---
name: "qa-standards-manager"
version: "2.3.0"
description: "验收标准管理器，负责制定和管理游戏开发各阶段的验收标准。测试标准的唯一权威来源。核心原则：视觉测试(VT)与功能路径测试(FPT)合并执行，采用阻塞式流程，每一步必须截图验证后才能继续。Web游戏必须用浏览器全屏打开，全屏截图。新增：子QA结束后由主测试执行最终视觉测试，严格遵循QA测试步骤。"
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-21"

layer: 3
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"
  - name: "fullstack-game-engine"
    layer: 1
    type: "required"
    purpose: "流程定义引用"
  - name: "contract-validator"
    layer: 2
    type: "required"
    purpose: "运行时契约验证"
  - name: "state-manager"
    layer: 2
    type: "required"
    purpose: "执行状态追踪"

contracts:
  input:
    required_documents:
      - pattern: "docs/02-策划文档/.*\\.md"
        description: "策划设计文档"
      - pattern: "docs/03-技术文档/.*\\.md"
        description: "技术需求文档"
  output:
    required_documents:
      - pattern: "docs/05-测试文档/QA-TEST-REPORT-.*\\.md"
        description: "QA测试报告"
      - pattern: "screenshots/.*\\.png"
        description: "测试截图证据（PNG格式）"
    quality_gates:
      - metric: "test_coverage"
        threshold: 1.0
        operator: ">="
        required: true
      - metric: "screenshot_evidence_count"
        threshold: 1
        operator: ">="
        required: true
        description: "至少1张截图证据"

execution:
  mode: "blocking"
  preconditions:
    - type: "BP_UNLOCKED"
      target: "BP-009"
      description: "Phase 3开发完成"
    - type: "CONTRACT_VALIDATED"
      target: "input"
      description: "输入契约已验证"
  postconditions:
    - type: "BP_UNLOCK"
      target: "BP-011"
      description: "解锁QA测试完成阻塞点"
    - type: "SCREENSHOT_VERIFIED"
      target: "output"
      description: "截图证据已验证"
  rollback:
    supported: true
    conditions:
      - "截图证据缺失"
      - "测试步骤未完成"
    actions:
      - "删除未完成的测试报告"
      - "重置测试状态"
      - "要求重新执行测试"
  
  # 强制执行机制
  enforcement_mechanisms:
    - name: "PRECONDITION_VALIDATION"
      description: "前置条件验证"
      required: true
      action: "BLOCK_UNTIL_SATISFIED"
    - name: "TOOL_CALL_AUDIT"
      description: "工具调用审计"
      required: true
      action: "LOG_AND_VALIDATE"
    - name: "SCREENSHOT_VERIFICATION"
      description: "截图验证"
      required: true
      action: "BLOCK_UNTIL_EVIDENCE"
    - name: "ANTI_HALLUCINATION_CHECK"
      description: "反幻觉检查"
      required: true
      action: "REJECT_WITHOUT_EVIDENCE"
  
  # 必需工具调用
  mandatory_tool_calls:
    SCREENSHOT_TOOL:
      name: "take_screenshot.ps1"
      description: "截图工具"
      min_calls: 1
      severity: "CRITICAL"
    LS_VERIFICATION:
      name: "LS screenshots/"
      description: "验证截图目录存在"
      min_calls: 1
      severity: "CRITICAL"
    WEB_SERVER:
      name: "python -m http.server"
      description: "启动Web服务器"
      min_calls: 0
      severity: "HIGH"

quality:
  acceptance_criteria:
    - id: "AC-001"
      description: "所有功能路径已验证"
      metric: "fpt_pass_rate"
      threshold: 1.0
      operator: "=="
      required: true
    - id: "AC-002"
      description: "所有截图证据完整"
      metric: "screenshot_coverage"
      threshold: 1.0
      operator: ">="
      required: true
    - id: "AC-003"
      description: "无P0级Bug"
      metric: "p0_bug_count"
      threshold: 0
      operator: "=="
      required: true
    - id: "AC-004"
      description: "反幻觉自检已签署"
      metric: "anti_hallucination_signed"
      threshold: 1
      operator: "=="
      required: true
    - id: "AC-005"
      description: "工具调用审计通过"
      metric: "tool_audit_passed"
      threshold: 1
      operator: "=="
      required: true

testing:
  required_tests:
    - "FT-功能测试"
    - "VT-视觉测试（强制截图）"
    - "FPT-完整路径测试"
    - "RT-回归测试"
  evidence_required: true
  evidence_types:
    - "screenshot"
    - "log"
    - "operation_record"

tracking:
  execution_status:
    current: "PENDING"
    checkpoints:
      - "环境准备完成"
      - "截图工具调用记录"
      - "测试步骤执行记录"
      - "证据验证完成"
  error_codes:
    - code: "E001"
      name: "SCREENSHOT_MISSING"
      severity: "CRITICAL"
      description: "缺少截图证据"
    - code: "E002"
      name: "TOOL_CALL_MISSING"
      severity: "CRITICAL"
      description: "缺少必需的工具调用"
    - code: "E003"
      name: "ANTI_HALLUCINATION_FAILED"
      severity: "CRITICAL"
      description: "反幻觉自检未通过"
---

# 验收标准管理器 v2.3.0

> **核心原则**：视觉测试(VT)与功能路径测试(FPT)是同一个流程，必须合并执行。
> 
> **阻塞式执行**：每一步必须截图验证后才能继续下一步。
> 
> **Web游戏要求**：必须用本地浏览器全屏打开，全屏截图。
> 
> **强制执行**：本技能定义的流程是**绝对强制**的，智能体**禁止**以任何理由跳过。

---

## ⚠️ 强制执行声明

### 绝对禁止的行为（违反将导致测试无效）

| 禁止行为 | 违规后果 | 检测方式 |
|----------|----------|----------|
| ❌ **禁止跳过截图** | 测试报告无效 | 工具调用审计 |
| ❌ **禁止无截图声称VT通过** | 反幻觉自检失败 | 截图文件验证 |
| ❌ **禁止仅凭代码推断** | 测试报告无效 | 执行模式检查 |
| ❌ **禁止虚构测试结果** | 严重违规，需重新测试 | 证据交叉验证 |
| ❌ **禁止跳过阻塞点** | 流程中断 | 状态追踪检查 |
| ❌ **禁止创建MD代替PNG** | 测试报告无效 | 文件类型检查 |
| ❌ **禁止未调用技能直接测试** | 契约验证失败 | 前置条件检查 |

### 强制执行机制

```
┌─────────────────────────────────────────────────────────────────┐
│                     强制执行架构                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 前置契约验证层                                               │
│     ├── 检查输入文档是否存在                                     │
│     ├── 检查前置技能是否已调用                                   │
│     └── 检查阻塞点状态                                           │
│                                                                  │
│  2. 运行时工具调用审计层                                         │
│     ├── 记录所有工具调用                                         │
│     ├── 验证必需工具是否被调用                                   │
│     └── 实时告警缺失的工具调用                                   │
│                                                                  │
│  3. 输出契约验证层                                               │
│     ├── 验证截图文件存在                                         │
│     ├── 验证截图文件大小 > 0                                     │
│     ├── 验证反幻觉自检清单                                       │
│     └── 验证工具调用审计通过                                     │
│                                                                  │
│  4. 回滚机制                                                     │
│     ├── 证据缺失 → 删除报告 + 要求重测                           │
│     ├── 工具调用缺失 → 补充调用 + 重新验证                       │
│     └── 自检失败 → 标记测试无效 + 记录违规                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 核心测试流程（唯一正确流程）

### 测试流程总览

```
┌─────────────────────────────────────────────────────────────────┐
│  QA测试流程（阻塞式）                                             │
│                                                                  │
│  Step 0: 前置验证（强制执行）                                     │
│  ├── 0.1 调用 contract-validator 验证输入契约                   │
│  ├── 0.2 检查前置阻塞点 BP-009 已解锁                           │
│  ├── 0.3 初始化工具调用审计追踪器                               │
│  └── 0.4 【阻塞】前置验证通过后才能继续                         │
│                                                                  │
│  Step 1: 环境准备（强制执行）                                     │
│  ├── 1.1 启动Web服务器                                           │
│  ├── 1.2 用浏览器全屏打开游戏                                     │
│  ├── 1.3 将游戏窗口置顶                                          │
│  ├── 1.4 全屏截图保存                                            │
│  ├── 1.5 【审计】记录截图工具调用                                │
│  └── 1.6 【阻塞】确认游戏正常显示                                 │
│                                                                  │
│  Step 2: 读取测试路径                                            │
│  ├── 2.1 读取功能路径文档                                        │
│  ├── 2.2 读取UI布局文档                                          │
│  └── 2.3 【阻塞】生成测试步骤清单                                 │
│                                                                  │
│  Step 3: 阻塞式路径测试（VT+FPT合并）                             │
│  ├── 对于每个测试步骤：                                          │
│  │   ├── 3.x.1 将游戏窗口置顶                                    │
│  │   ├── 3.x.2 全屏截图当前界面                                  │
│  │   ├── 3.x.3 【审计】记录截图工具调用                          │
│  │   ├── 3.x.4 将IDE窗口置顶                                     │
│  │   ├── 3.x.5 【阻塞】分析截图，确定按钮位置                     │
│  │   ├── 3.x.6 将游戏窗口置顶                                    │
│  │   ├── 3.x.7 执行点击操作                                      │
│  │   ├── 3.x.8 将游戏窗口置顶                                    │
│  │   ├── 3.x.9 全屏截图操作后界面                                │
│  │   ├── 3.x.10 【审计】记录截图工具调用                         │
│  │   ├── 3.x.11 将IDE窗口置顶                                    │
│  │   ├── 3.x.12 【阻塞】对比截图，确认界面变化                    │
│  │   └── 3.x.13 记录结果，进入下一步                              │
│  └── 循环直到所有路径测试完成                                     │
│                                                                  │
│  Step 4: 输出验证（强制执行）                                     │
│  ├── 4.1 使用 LS 验证截图目录存在                               │
│  ├── 4.2 验证截图文件数量 >= 1                                  │
│  ├── 4.3 验证截图文件大小 > 0                                   │
│  ├── 4.4 【审计】验证工具调用记录完整                           │
│  └── 4.5 【阻塞】输出验证通过后才能生成报告                       │
│                                                                  │
│  Step 5: 反幻觉自检（强制执行）                                   │
│  ├── 5.1 执行反幻觉自检清单                                      │
│  ├── 5.2 【阻塞】自检通过签署                                    │
│  └── 5.3 记录自检结果                                            │
│                                                                  │
│  Step 6: 回归测试                                                │
│  ├── 6.1 读取经验库                                              │
│  └── 6.2 验证历史问题已修复                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 窗口置顶切换机制（强制执行）

为了确保用户能始终看到整个测试流程的运作细节，QA测试流程中引入了**窗口置顶切换机制**：

### 核心原则

```
┌─────────────────────────────────────────────────────────────────┐
│  窗口置顶切换原则                                                │
│                                                                  │
│  1. 截图前：将游戏浏览器窗口置顶，让用户看到截图目标              │
│  2. 分析时：将IDE/智能体工作窗口置顶，让用户看到分析过程          │
│  3. 循环切换：每个测试步骤都在游戏和IDE之间切换置顶               │
│  4. 透明可见：确保用户始终能看到当前正在进行的操作                │
└─────────────────────────────────────────────────────────────────┘
```

### 窗口管理脚本

**脚本位置**：`tools/qa-screenshots/window-manager.ps1`

**功能说明**：
| 操作 | 命令 | 用途 |
|------|------|------|
| 列出窗口 | `window-manager.ps1 -Action list-windows` | 查看所有可见窗口 |
| 查找窗口 | `window-manager.ps1 -Action find-window -WindowTitle "标题"` | 定位特定窗口 |
| 带到前台 | `window-manager.ps1 -Action bring-to-front -WindowTitle "标题"` | 激活窗口 |
| 设置置顶 | `window-manager.ps1 -Action set-topmost -WindowTitle "标题"` | 窗口始终置顶 |
| 取消置顶 | `window-manager.ps1 -Action remove-topmost -WindowTitle "标题"` | 取消置顶状态 |

### 窗口切换流程

```
┌─────────────────────────────────────────────────────────────────┐
│  测试步骤中的窗口切换流程                                        │
│                                                                  │
│  Step X.1: 准备截图                                              │
│  ├── 将游戏浏览器窗口置顶                                        │
│  ├── 等待用户确认游戏界面可见                                    │
│  └── 执行全屏截图                                                │
│                                                                  │
│  Step X.2: 分析截图                                              │
│  ├── 将IDE/智能体工作窗口置顶                                    │
│  ├── 分析截图内容                                                │
│  └── 确定下一步操作                                              │
│                                                                  │
│  Step X.3: 执行操作                                              │
│  ├── 将游戏浏览器窗口置顶                                        │
│  ├── 执行点击/输入操作                                           │
│  └── 等待界面响应                                                │
│                                                                  │
│  Step X.4: 验证结果                                              │
│  ├── 将游戏浏览器窗口置顶                                        │
│  ├── 执行全屏截图                                                │
│  ├── 将IDE/智能体工作窗口置顶                                    │
│  └── 对比分析截图变化                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 0: 前置验证（强制执行）

### 0.1 调用契约验证器

**强制工具调用**：
```
Skill: contract-validator
Purpose: 验证输入契约完整性
```

**验证内容**：
- 策划设计文档是否存在
- 技术需求文档是否存在
- 前置阻塞点 BP-009 是否已解锁

### 0.2 初始化工具调用审计

**强制操作**：
- 初始化工具调用追踪器
- 设置审计模式为 "strict"
- 定义必需工具调用清单

### 0.3 【阻塞】前置验证通过

**阻塞条件**：
- 契约验证通过 ✅
- 阻塞点已解锁 ✅
- 审计器初始化完成 ✅

**只有前置验证通过后，才能进入Step 1**

---

## Step 1: 环境准备（强制执行）

### 1.1 启动Web服务器

**强制工具调用**：
```powershell
# 启动HTTP服务器
python -m http.server 8080
```

**验证方式**：
- 使用 `CheckCommandStatus` 确认服务器运行
- 输出必须包含 "Serving HTTP"

### 1.2 用浏览器全屏打开游戏

**强制工具调用**：
```powershell
# 用默认浏览器打开游戏（全屏模式）
start "http://localhost:8080/projects/项目名/index.html"
```

**⚠️ 关键要求**：
- **必须**用本地浏览器打开
- **必须**全屏模式（F11或最大化）
- **禁止**使用OpenPreview预览（预览窗口太小）

### 1.3 将游戏窗口置顶

**强制工具调用**：
```powershell
# 等待浏览器窗口加载
Start-Sleep -Seconds 2

# 将浏览器窗口置顶（根据实际使用的浏览器选择）
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -ProcessName "chrome" -TimeoutSeconds 5
# 或
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -ProcessName "msedge" -TimeoutSeconds 5
```

**目的**：确保游戏窗口在前台可见，用户可以清楚看到游戏界面

**⚠️ 窗口切换失败处理**：
- 如果窗口切换失败，继续执行后续步骤
- 窗口切换是辅助功能，不影响核心测试流程
- 失败时记录日志，但不阻塞测试

### 1.4 全屏截图保存

**强制工具调用**：
```powershell
# 使用PowerShell脚本全屏截图
powershell -File tools/qa-screenshots/take_screenshot.ps1 -OutputDir "projects/项目名/screenshots" -FileName "step1_startup_时间戳"
```

**截图要求**：
- **必须**全屏截图，不能只截游戏区域
- **必须**保存为PNG格式
- **必须**保存到项目的 `screenshots/` 目录
- **必须**捕获物理屏幕分辨率（忽略Windows DPI缩放）

### 1.5 【审计】记录截图工具调用

**强制操作**：
- 记录 `take_screenshot.ps1` 被调用
- 记录调用时间戳
- 记录输出文件路径

### 1.6 【阻塞】确认游戏正常显示

**阻塞条件**：
- 截图已保存到 `screenshots/` 目录
- 截图文件大小 > 0
- 截图显示游戏主界面（不是空白页或错误页）

**验证方式**：
```powershell
# 使用LS验证截图文件存在
LS "projects/项目名/screenshots"
```

**只有确认游戏正常显示后，才能进入Step 2**

---

## Step 2: 读取测试路径（强制执行）

### 2.1 读取功能路径文档

**强制工具调用**：
```
Read "projects/项目名/docs/03-整合文档/LD-FUNC-PATH-*.md"
```

### 2.2 读取UI布局文档

**强制工具调用**：
```
Read "projects/项目名/docs/03-整合文档/LD-UI-LAYOUT-*.md"
```

### 2.3 【阻塞】生成测试步骤清单

根据读取的文档，生成测试步骤清单：

```markdown
## 测试步骤清单

| 步骤 | 操作 | 预期结果 | 截图命名 |
|------|------|----------|----------|
| 3.1 | 点击[按钮A] | 进入[界面B] | step3_1_按钮A_时间戳.png |
| 3.2 | 点击[按钮C] | 显示[面板D] | step3_2_按钮C_时间戳.png |
| ... | ... | ... | ... |
```

**只有测试步骤清单确认后，才能进入Step 3**

---

## Step 3: 阻塞式路径测试（VT+FPT合并）⭐核心流程

### 核心原则

```
┌─────────────────────────────────────────────────────────────────┐
│  阻塞式测试原则                                                  │
│                                                                  │
│  1. 截图先行：每次操作前必须先截图                                │
│  2. 审计记录：每次截图必须记录工具调用                            │
│  3. 分析阻塞：分析截图确定按钮位置后才能操作                      │
│  4. 验证阻塞：操作后必须截图验证界面变化                          │
│  5. 无变化必排查：界面无变化必须排查修复                          │
│  6. 修复必回归：修复后必须重新测试该步骤                          │
└─────────────────────────────────────────────────────────────────┘
```

### 每个测试步骤的执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│  单个测试步骤执行流程                                            │
│                                                                  │
│  3.x.1 将游戏窗口置顶                                            │
│        ↓                                                         │
│  3.x.2 全屏截图当前界面                                          │
│        ↓                                                         │
│  3.x.3 【审计】记录截图工具调用                                  │
│        ↓                                                         │
│  3.x.4 将IDE窗口置顶                                             │
│        ↓                                                         │
│  3.x.5 【阻塞】分析截图，确定按钮位置                             │
│        ↓                                                         │
│  3.x.6 将游戏窗口置顶                                            │
│        ↓                                                         │
│  3.x.7 执行点击操作                                              │
│        ↓                                                         │
│  3.x.8 将游戏窗口置顶                                            │
│        ↓                                                         │
│  3.x.9 全屏截图操作后界面                                        │
│        ↓                                                         │
│  3.x.10 【审计】记录截图工具调用                                 │
│        ↓                                                         │
│  3.x.11 将IDE窗口置顶                                            │
│        ↓                                                         │
│  3.x.12 【阻塞】对比截图，确认界面变化                            │
│        ├── 有变化 → 进入下一步                                   │
│        └── 无变化 → 排查修复 → 回归测试                          │
└─────────────────────────────────────────────────────────────────┘
```

### 详细执行步骤

#### 3.x.1 将游戏窗口置顶

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -ProcessName "chrome" -TimeoutSeconds 5
```

**目的**：确保游戏窗口在前台，用户可以看到即将截图的内容

**⚠️ 失败处理**：如果窗口切换失败，继续执行截图步骤

#### 3.x.2 全屏截图当前界面

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/take_screenshot.ps1 -OutputDir "projects/项目名/screenshots" -FileName "step3_x_before_按钮名_时间戳"
```

**要求**：
- 全屏截图
- PNG格式
- 保存到 `screenshots/` 目录

#### 3.x.3 【审计】记录截图工具调用

**强制操作**：
- 记录 `take_screenshot.ps1` 被调用
- 记录文件路径
- 记录时间戳

#### 3.x.4 将IDE窗口置顶

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -WindowTitle "Trae" -TimeoutSeconds 5
```

**目的**：将工作界面带到前台，用户可以清楚看到分析过程

#### 3.x.5 【阻塞】分析截图，确定按钮位置

**阻塞条件**：
- 必须明确指出按钮在截图中的位置
- 必须确认按钮可见且可点击
- 必须记录按钮的坐标或区域

**输出格式**：
```
按钮位置分析：
- 按钮名称：[按钮名]
- 位置：屏幕[左上/右上/左下/右下/中央]区域
- 坐标范围：约[x1,y1]到[x2,y2]
- 状态：可见/不可见
```

**只有分析完成并确认按钮位置后，才能继续**

#### 3.x.6 将游戏窗口置顶

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -ProcessName "chrome" -TimeoutSeconds 5
```

**目的**：确保游戏窗口在前台，用户可以清楚看到点击操作

#### 3.x.7 执行点击操作

**操作方式**：
- 在浏览器中实际点击按钮
- 或使用自动化工具模拟点击

**⚠️ 注意**：执行操作时游戏窗口应该在前台可见

#### 3.x.8 将游戏窗口置顶

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -ProcessName "chrome" -TimeoutSeconds 5
```

**目的**：确保游戏窗口在前台，准备截图操作后界面

#### 3.x.9 全屏截图操作后界面

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/take_screenshot.ps1 -OutputDir "projects/项目名/screenshots" -FileName "step3_x_after_按钮名_时间戳"
```

#### 3.x.10 【审计】记录截图工具调用

**强制操作**：
- 记录 `take_screenshot.ps1` 被调用
- 记录文件路径
- 记录时间戳

#### 3.x.11 将IDE窗口置顶

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/window-manager.ps1 -Action bring-to-front -WindowTitle "Trae" -TimeoutSeconds 5
```

**目的**：将工作界面带到前台，用户可以清楚看到对比分析过程

#### 3.x.12 【阻塞】对比截图，确认界面变化

**阻塞条件**：
- 必须对比操作前后两张截图
- 必须明确判断界面是否有变化
- 必须确认变化是否符合预期

**输出格式**：
```
截图对比结果：
- 操作前截图：step3_x_before_按钮名_时间戳.png
- 操作后截图：step3_x_after_按钮名_时间戳.png
- 界面变化：有/无
- 变化内容：[描述变化]
- 符合预期：是/否
```

**分支处理**：

**分支A：界面有变化且符合预期**
```
✅ 测试通过，进入下一个测试步骤
```

**分支B：界面无变化或不符合预期**
```
❌ 测试失败，需要排查
排查步骤：
1. 检查按钮事件是否绑定
2. 检查控制台是否有错误
3. 检查按钮是否被遮挡
4. 修复问题
5. 【回归】重新执行此测试步骤
```

---

## Step 4: 输出验证（强制执行）⭐新增

### 4.1 验证截图目录存在

**强制工具调用**：
```powershell
LS "projects/项目名/screenshots"
```

**验证标准**：
- 目录必须存在
- 目录中必须有PNG文件

### 4.2 验证截图文件数量

**强制检查**：
- 截图文件数量 >= 1
- 每个测试步骤至少2张截图（操作前+操作后）

### 4.3 验证截图文件大小

**强制检查**：
- 每个截图文件大小 > 0
- 正常全屏截图应 > 200KB

### 4.4 【审计】验证工具调用记录

**强制检查清单**：
- [ ] `take_screenshot.ps1` 被调用至少1次
- [ ] `window-manager.ps1` 被调用（如需要）
- [ ] 每次截图都有对应的审计记录

### 4.5 【阻塞】输出验证通过

**阻塞条件**：
- 截图目录存在 ✅
- 截图文件数量 >= 1 ✅
- 截图文件大小 > 0 ✅
- 工具调用审计通过 ✅

**只有输出验证通过后，才能生成报告**

---

## Step 5: 反幻觉自检（强制执行）⭐新增

### 5.1 执行反幻觉自检清单

**强制自检清单**：

```markdown
## 反幻觉自检清单

### 证据验证
- [ ] 我确认：所有测试步骤都有截图证据
- [ ] 我确认：截图文件真实存在且大小 > 0
- [ ] 我确认：工具调用审计记录完整

### 测试执行验证
- [ ] 我确认：游戏确实在浏览器中打开
- [ ] 我确认：所有点击操作都实际执行
- [ ] 我确认：界面变化确实被观察到

### 禁止行为自查
- [ ] 我确认：没有跳过任何截图步骤
- [ ] 我确认：没有虚构任何测试结果
- [ ] 我确认：没有仅凭代码推断功能正常
- [ ] 我确认：没有创建MD文档代替PNG截图

### 工具调用自查
- [ ] 我确认：调用了 `take_screenshot.ps1`
- [ ] 我确认：验证了截图文件存在（使用LS）
- [ ] 我确认：调用了其他必需的工具
```

### 5.2 【阻塞】自检通过签署

**阻塞条件**：
- 所有自检项都已勾选 ✅
- 确认无虚构结果 ✅
- 确认证据完整 ✅

**只有自检通过后，才能生成报告**

### 5.3 记录自检结果

**强制操作**：
- 将自检结果写入测试报告
- 记录签署人（AI助手ID）
- 记录签署时间

---

## Step 6: 回归测试

### 6.1 读取经验库

**强制工具调用**：
```
Read ".trae/skills/project-experience-summarizer/experience-db.md"
```

### 6.2 验证历史问题已修复

根据经验库中的历史问题，逐一验证是否已修复。

---

## 强制工具调用清单（完整版）

### Step 0: 前置验证

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 0.1 | `Skill: contract-validator` | - | 验证输入契约 | ✅ 必须 |
| 0.2 | `Skill: state-manager` | - | 初始化审计追踪 | ✅ 必须 |

### Step 1: 环境准备

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 1.1 | `RunCommand` | `python -m http.server 8080` | 启动Web服务器 | ✅ 必须 |
| 1.2 | `CheckCommandStatus` | command_id | 确认服务器运行 | ✅ 必须 |
| 1.3 | `RunCommand` | `start "http://localhost:8080/..."` | 浏览器打开游戏 | ✅ 必须 |
| 1.4 | `RunCommand` | `window-manager.ps1 -Action bring-to-front` | 将游戏窗口置顶 | ⚠️ 建议 |
| 1.5 | `RunCommand` | `take_screenshot.ps1 ...` | 全屏截图 | ✅ 必须 |
| 1.6 | `LS` | screenshots目录 | 验证截图存在 | ✅ 必须 |

### Step 2: 读取测试路径

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 2.1 | `Read` | 功能路径文档 | 读取测试路径 | ✅ 必须 |
| 2.2 | `Read` | UI布局文档 | 读取界面信息 | ✅ 必须 |

### Step 3: 阻塞式路径测试（每个步骤）

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 3.x.1 | `RunCommand` | `window-manager.ps1 -Action bring-to-front -ProcessName "chrome"` | 将游戏窗口置顶 | ⚠️ 建议 |
| 3.x.2 | `RunCommand` | `take_screenshot.ps1 ...` | 截图操作前界面 | ✅ 必须 |
| 3.x.3 | `【审计】` | 记录工具调用 | 审计追踪 | ✅ 必须 |
| 3.x.4 | `RunCommand` | `window-manager.ps1 -Action bring-to-front -WindowTitle "Trae"` | 将IDE窗口置顶 | ⚠️ 建议 |
| 3.x.5 | `Read` | 截图文件 | 分析截图，确定按钮位置 | ✅ 必须 |
| 3.x.6 | `RunCommand` | `window-manager.ps1 -Action bring-to-front -ProcessName "chrome"` | 将游戏窗口置顶 | ⚠️ 建议 |
| 3.x.7 | `RunCommand` | 点击操作 | 执行点击操作 | ✅ 必须 |
| 3.x.8 | `RunCommand` | `window-manager.ps1 -Action bring-to-front -ProcessName "chrome"` | 将游戏窗口置顶 | ⚠️ 建议 |
| 3.x.9 | `RunCommand` | `take_screenshot.ps1 ...` | 截图操作后界面 | ✅ 必须 |
| 3.x.10 | `【审计】` | 记录工具调用 | 审计追踪 | ✅ 必须 |
| 3.x.11 | `RunCommand` | `window-manager.ps1 -Action bring-to-front -WindowTitle "Trae"` | 将IDE窗口置顶 | ⚠️ 建议 |
| 3.x.12 | `Read` | 对比截图 | 对比截图，确认界面变化 | ✅ 必须 |
| 3.x.13 | `LS` | screenshots目录 | 验证截图存在 | ✅ 必须 |

### Step 4: 输出验证

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 4.1 | `LS` | screenshots目录 | 验证目录存在 | ✅ 必须 |
| 4.2 | `【审计】` | 统计文件数量 | 验证截图数量 | ✅ 必须 |
| 4.3 | `【审计】` | 检查文件大小 | 验证截图有效 | ✅ 必须 |
| 4.4 | `【审计】` | 验证工具调用记录 | 审计完整性 | ✅ 必须 |

### Step 5: 反幻觉自检

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 5.1 | `【自检】` | 反幻觉清单 | 执行自检 | ✅ 必须 |
| 5.2 | `【签署】` | 确认自检通过 | 阻塞检查 | ✅ 必须 |
| 5.3 | `Write` | 记录自检结果 | 写入报告 | ✅ 必须 |

### Step 6: 回归测试

| 序号 | 工具 | 参数 | 目的 | 强制执行 |
|------|------|------|------|----------|
| 6.1 | `Read` | experience-db.md | 读取历史问题 | ✅ 必须 |
| 6.2 | `Grep` | 搜索修复代码 | 验证修复存在 | ✅ 必须 |

---

## 截图命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 启动验证 | `step1_startup_[时间戳].png` | `step1_startup_20260220_143052.png` |
| 操作前 | `step3_[步骤号]_before_[按钮名]_[时间戳].png` | `step3_1_before_startBtn_20260220_143052.png` |
| 操作后 | `step3_[步骤号]_after_[按钮名]_[时间戳].png` | `step3_1_after_startBtn_20260220_143052.png` |

---

## 禁止行为清单（强制执行版）

| 禁止行为 | 原因 | 违规检测 | 违规后果 |
|----------|------|----------|----------|
| ❌ **禁止跳过截图** | 无截图=未测试 | 工具调用审计 | 测试报告无效 |
| ❌ **禁止无截图声称VT通过** | 违反证据优先原则 | 截图文件验证 | 反幻觉自检失败 |
| ❌ **禁止仅凭代码推断** | 代码存在≠功能正常 | 执行模式检查 | 测试报告无效 |
| ❌ **禁止虚构测试结果** | 严重违规 | 证据交叉验证 | 标记为幻觉行为 |
| ❌ **禁止跳过阻塞点** | 流程完整性要求 | 状态追踪检查 | 流程中断 |
| ❌ **禁止创建MD代替PNG** | 截图必须是图片 | 文件类型检查 | 测试报告无效 |
| ❌ **禁止未调用技能直接测试** | 契约验证要求 | 前置条件检查 | 契约验证失败 |
| ❌ **禁止程序员自测** | 独立性要求 | 角色检查 | 测试无效 |
| ❌ **禁止复制粘贴测试结果** | 真实性要求 | 内容相似度检查 | 测试无效 |
| ❌ **禁止将VT和FPT分开执行** | VT和FPT是同一个流程 | 流程检查 | 测试不完整 |

---

## 测试报告必须包含的内容

```markdown
## QA测试报告

### 1. 环境验证
- Web服务器状态：运行中/未运行
- 浏览器打开状态：成功/失败
- 启动截图：step1_startup_xxx.png

### 2. 工具调用审计记录
| 工具 | 调用次数 | 验证状态 |
|------|----------|----------|
| take_screenshot.ps1 | X次 | ✅ 已验证 |
| window-manager.ps1 | X次 | ✅ 已验证 |

### 3. 截图证据清单
| 截图文件 | 文件大小 | 对应步骤 | 验证状态 |
|----------|----------|----------|----------|
| step1_startup_xxx.png | XX KB | 启动验证 | ✅ 已验证 |
| step3_1_before_xxx.png | XX KB | 步骤3.1操作前 | ✅ 已验证 |
| step3_1_after_xxx.png | XX KB | 步骤3.1操作后 | ✅ 已验证 |
| ... | ... | ... | ... |

### 4. 测试路径清单
| 步骤 | 操作 | 预期结果 | 实际结果 | 截图证据 | 状态 |
|------|------|----------|----------|----------|------|
| 3.1 | 点击按钮A | 进入界面B | 进入界面B | step3_1_*.png | ✅ |
| 3.2 | 点击按钮C | 显示面板D | 无变化 | step3_2_*.png | ❌ |
| ... | ... | ... | ... | ... | ... |

### 5. 问题清单
| 问题ID | 问题描述 | 优先级 | 状态 |
|--------|----------|--------|------|
| BUG-001 | 点击按钮C无响应 | P0 | 待修复 |
| ... | ... | ... | ... |

### 6. 回归测试结果
- 历史问题验证：已验证/未验证
- 新引入问题：有/无

### 7. 反幻觉自检结果
- [x] 所有测试步骤都有截图证据
- [x] 截图文件真实存在
- [x] 没有虚构测试结果
- [x] 工具调用审计通过

**签署人**: [AI助手ID]  
**签署时间**: [时间戳]

### 8. 结论
- 测试通过/不通过
- 遗留问题数量
```

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2024-02-19 | 初始版本 |
| v2.0 | 2026-02-20 | **重大重构**：1. 将VT和FPT合并为阻塞式流程；2. 强制使用浏览器全屏打开；3. 强制全屏截图；4. 每一步必须截图验证后才能继续；5. 删除产生歧义的部分 |
| v2.1 | 2026-02-21 | **截图脚本修复**：1. 使用GetDeviceCaps API获取物理屏幕分辨率；2. 忽略Windows DPI缩放设置；3. 确保截图捕获完整全屏（2560x1600等物理分辨率） |
| v2.1.1 | 2026-02-21 | **截图脚本增强**：1. 每次截图动态读取当前机器分辨率；2. 支持多屏幕环境；3. 添加容错处理（检测失败时自动回退到虚拟分辨率） |
| v2.2.0 | 2026-02-21 | **窗口置顶切换机制**：1. 新增window-manager.ps1脚本；2. 在截图和分析之间自动切换窗口置顶；3. 确保用户始终能看到流程运作细节；4. 支持Chrome/Edge浏览器和IDE窗口切换 |
| v2.3.0 | 2026-02-21 | **强制执行机制**：1. 添加前置契约验证；2. 添加工具调用审计；3. 添加输出验证步骤；4. 添加反幻觉自检；5. 添加回滚机制；6. 明确禁止行为和违规后果 |

---

**文档结束**
