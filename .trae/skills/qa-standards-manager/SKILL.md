---
name: "qa-standards-manager"
version: "2.1.1"
description: "验收标准管理器，负责制定和管理游戏开发各阶段的验收标准。测试标准的唯一权威来源。核心原则：视觉测试(VT)与功能路径测试(FPT)合并执行，采用阻塞式流程，每一步必须截图验证后才能继续。Web游戏必须用浏览器全屏打开，全屏截图。"
author: "engine-team"
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

execution:
  mode: "sequential"
  preconditions:
    - type: "BP_UNLOCKED"
      target: "BP-009"
      description: "Phase 3开发完成"
  postconditions:
    - type: "BP_UNLOCK"
      target: "BP-011"
      description: "解锁QA测试完成阻塞点"

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
---

# 验收标准管理器 v2.1.1

> **核心原则**：视觉测试(VT)与功能路径测试(FPT)是同一个流程，必须合并执行。
> 
> **阻塞式执行**：每一步必须截图验证后才能继续下一步。
> 
> **Web游戏要求**：必须用本地浏览器全屏打开，全屏截图。

---

## ⚠️ 核心测试流程（唯一正确流程）

### 测试流程总览

```
┌─────────────────────────────────────────────────────────────────┐
│  QA测试流程（阻塞式）                                             │
│                                                                  │
│  Step 1: 环境准备                                                │
│  ├── 1.1 启动Web服务器                                           │
│  ├── 1.2 用浏览器全屏打开游戏                                     │
│  ├── 1.3 全屏截图保存                                            │
│  └── 1.4 【阻塞】确认游戏正常显示                                 │
│                                                                  │
│  Step 2: 读取测试路径                                            │
│  ├── 2.1 读取功能路径文档                                        │
│  ├── 2.2 读取UI布局文档                                          │
│  └── 2.3 【阻塞】生成测试步骤清单                                 │
│                                                                  │
│  Step 3: 阻塞式路径测试（VT+FPT合并）                             │
│  ├── 对于每个测试步骤：                                          │
│  │   ├── 3.1 全屏截图当前界面                                    │
│  │   ├── 3.2 【阻塞】分析截图，确定按钮位置                       │
│  │   ├── 3.3 执行点击操作                                        │
│  │   ├── 3.4 全屏截图操作后界面                                  │
│  │   ├── 3.5 【阻塞】对比截图，确认界面变化                       │
│  │   └── 3.6 记录结果，进入下一步                                │
│  └── 循环直到所有路径测试完成                                     │
│                                                                  │
│  Step 4: 回归测试                                                │
│  ├── 4.1 读取经验库                                              │
│  └── 4.2 验证历史问题已修复                                      │
└─────────────────────────────────────────────────────────────────┘
```

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

### 1.3 全屏截图保存

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

**截图脚本技术要求**：
```powershell
# 使用 GetDeviceCaps API 获取物理屏幕分辨率（忽略DPI缩放）
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ScreenHelper {
    [DllImport("gdi32.dll")]
    public static extern int GetDeviceCaps(IntPtr hdc, int nIndex);
    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    public const int DESKTOPHORZRES = 118;
    public const int DESKTOPVERTRES = 117;
    
    public static int GetPhysicalScreenWidth() {
        try {
            IntPtr hdc = GetDC(IntPtr.Zero);
            if (hdc == IntPtr.Zero) return 0;
            int width = GetDeviceCaps(hdc, DESKTOPHORZRES);
            ReleaseDC(IntPtr.Zero, hdc);
            return width;
        }
        catch { return 0; }
    }
    
    public static int GetPhysicalScreenHeight() {
        try {
            IntPtr hdc = GetDC(IntPtr.Zero);
            if (hdc == IntPtr.Zero) return 0;
            int height = GetDeviceCaps(hdc, DESKTOPVERTRES);
            ReleaseDC(IntPtr.Zero, hdc);
            return height;
        }
        catch { return 0; }
    }
}
"@

# 动态读取当前机器的分辨率（每次截图时重新检测）
$screens = [System.Windows.Forms.Screen]::AllScreens
$physicalWidth = [ScreenHelper]::GetPhysicalScreenWidth()
$physicalHeight = [ScreenHelper]::GetPhysicalScreenHeight()

# 多屏幕支持：计算所有屏幕的总边界
if ($screens.Count -gt 1) {
    $left = 0; $top = 0; $right = 0; $bottom = 0
    foreach ($screen in $screens) {
        if ($screen.Bounds.Left -lt $left) { $left = $screen.Bounds.Left }
        if ($screen.Bounds.Top -lt $top) { $top = $screen.Bounds.Top }
        if ($screen.Bounds.Right -gt $right) { $right = $screen.Bounds.Right }
        if ($screen.Bounds.Bottom -gt $bottom) { $bottom = $screen.Bounds.Bottom }
    }
    $physicalWidth = $right - $left
    $physicalHeight = $bottom - $top
}

# 容错处理：如果物理分辨率检测失败，使用虚拟分辨率
if ($physicalWidth -eq 0 -or $physicalHeight -eq 0) {
    $primaryScreen = [System.Windows.Forms.Screen]::PrimaryScreen
    $physicalWidth = $primaryScreen.Bounds.Width
    $physicalHeight = $primaryScreen.Bounds.Height
}
```

**验证标准**：
- 截图分辨率应等于物理屏幕分辨率（如 2560 x 1600）
- 截图应包含整个屏幕内容，包括任务栏和所有窗口
- 文件大小应 > 200 KB（全屏截图正常大小）
- **必须**每次截图时动态读取当前机器的分辨率（支持多机器/多屏幕环境）

### 1.4 【阻塞】确认游戏正常显示

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
│  2. 分析阻塞：分析截图确定按钮位置后才能操作                      │
│  3. 验证阻塞：操作后必须截图验证界面变化                          │
│  4. 无变化必排查：界面无变化必须排查修复                          │
│  5. 修复必回归：修复后必须重新测试该步骤                          │
└─────────────────────────────────────────────────────────────────┘
```

### 每个测试步骤的执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│  单个测试步骤执行流程                                            │
│                                                                  │
│  3.x.1 全屏截图当前界面                                          │
│        ↓                                                         │
│  3.x.2 【阻塞】分析截图，确定按钮位置                             │
│        ↓                                                         │
│  3.x.3 执行点击操作                                              │
│        ↓                                                         │
│  3.x.4 全屏截图操作后界面                                        │
│        ↓                                                         │
│  3.x.5 【阻塞】对比截图，确认界面变化                             │
│        ├── 有变化 → 进入下一步                                   │
│        └── 无变化 → 排查修复 → 回归测试                          │
└─────────────────────────────────────────────────────────────────┘
```

### 详细执行步骤

#### 3.x.1 全屏截图当前界面

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/take_screenshot.ps1 -OutputDir "projects/项目名/screenshots" -FileName "step3_x_before_按钮名_时间戳"
```

**要求**：
- 全屏截图
- PNG格式
- 保存到 `screenshots/` 目录

#### 3.x.2 【阻塞】分析截图，确定按钮位置

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

#### 3.x.3 执行点击操作

**操作方式**：
- 在浏览器中实际点击按钮
- 或使用自动化工具模拟点击

#### 3.x.4 全屏截图操作后界面

**强制工具调用**：
```powershell
powershell -File tools/qa-screenshots/take_screenshot.ps1 -OutputDir "projects/项目名/screenshots" -FileName "step3_x_after_按钮名_时间戳"
```

#### 3.x.5 【阻塞】对比截图，确认界面变化

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

## Step 4: 回归测试

### 4.1 读取经验库

**强制工具调用**：
```
Read ".trae/skills/project-experience-summarizer/experience-db.md"
```

### 4.2 验证历史问题已修复

根据经验库中的历史问题，逐一验证是否已修复。

---

## 强制工具调用清单

### Step 1: 环境准备

| 序号 | 工具 | 参数 | 目的 |
|------|------|------|------|
| 1.1 | `RunCommand` | `python -m http.server 8080` | 启动Web服务器 |
| 1.2 | `CheckCommandStatus` | command_id | 确认服务器运行 |
| 1.3 | `RunCommand` | `start "http://localhost:8080/..."` | 浏览器打开游戏 |
| 1.4 | `RunCommand` | `powershell -File take_screenshot.ps1 ...` | 全屏截图 |
| 1.5 | `LS` | screenshots目录 | 验证截图存在 |

### Step 2: 读取测试路径

| 序号 | 工具 | 参数 | 目的 |
|------|------|------|------|
| 2.1 | `Read` | 功能路径文档 | 读取测试路径 |
| 2.2 | `Read` | UI布局文档 | 读取界面信息 |

### Step 3: 阻塞式路径测试（每个步骤）

| 序号 | 工具 | 参数 | 目的 |
|------|------|------|------|
| 3.x.1 | `RunCommand` | `powershell -File take_screenshot.ps1 ...` | 截图操作前界面 |
| 3.x.4 | `RunCommand` | `powershell -File take_screenshot.ps1 ...` | 截图操作后界面 |
| 3.x.5 | `LS` | screenshots目录 | 验证截图存在 |

### Step 4: 回归测试

| 序号 | 工具 | 参数 | 目的 |
|------|------|------|------|
| 4.1 | `Read` | experience-db.md | 读取历史问题 |
| 4.2 | `Grep` | 搜索修复代码 | 验证修复存在 |

---

## 截图命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 启动验证 | `step1_startup_[时间戳].png` | `step1_startup_20260220_143052.png` |
| 操作前 | `step3_[步骤号]_before_[按钮名]_[时间戳].png` | `step3_1_before_startBtn_20260220_143052.png` |
| 操作后 | `step3_[步骤号]_after_[按钮名]_[时间戳].png` | `step3_1_after_startBtn_20260220_143052.png` |

---

## 禁止行为清单

| 禁止行为 | 原因 |
|----------|------|
| ❌ 禁止使用OpenPreview预览 | 预览窗口太小，无法全屏截图 |
| ❌ 禁止只截游戏区域 | 必须全屏截图，包含浏览器地址栏 |
| ❌ 禁止创建MD文档代替PNG截图 | 截图必须是PNG图片文件 |
| ❌ 禁止跳过截图验证步骤 | 每一步必须截图验证后才能继续 |
| ❌ 禁止声称"测试通过"而无截图证据 | 无截图=未测试 |
| ❌ 禁止将VT和FPT分开执行 | VT和FPT是同一个流程，必须合并执行 |

---

## 测试报告必须包含的内容

```markdown
## QA测试报告

### 1. 环境验证
- Web服务器状态：运行中/未运行
- 浏览器打开状态：成功/失败
- 启动截图：step1_startup_xxx.png

### 2. 测试路径清单
| 步骤 | 操作 | 预期结果 | 实际结果 | 截图证据 | 状态 |
|------|------|----------|----------|----------|------|
| 3.1 | 点击按钮A | 进入界面B | 进入界面B | step3_1_*.png | ✅ |
| 3.2 | 点击按钮C | 显示面板D | 无变化 | step3_2_*.png | ❌ |
| ... | ... | ... | ... | ... | ... |

### 3. 截图证据清单
| 截图文件 | 文件大小 | 对应步骤 | 验证状态 |
|----------|----------|----------|----------|
| step1_startup_xxx.png | XX KB | 启动验证 | ✅ 已验证 |
| step3_1_before_xxx.png | XX KB | 步骤3.1操作前 | ✅ 已验证 |
| step3_1_after_xxx.png | XX KB | 步骤3.1操作后 | ✅ 已验证 |
| ... | ... | ... | ... |

### 4. 问题清单
| 问题ID | 问题描述 | 优先级 | 状态 |
|--------|----------|--------|------|
| BUG-001 | 点击按钮C无响应 | P0 | 待修复 |
| ... | ... | ... | ... |

### 5. 回归测试结果
- 历史问题验证：已验证/未验证
- 新引入问题：有/无

### 6. 结论
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
