# Git 操作脚本集合

这个目录包含了一系列常用的 Git 操作脚本，支持手动交互和自动化流程。

## 脚本列表

### 自动化脚本（推荐用于智能体）

#### auto-commit.ps1 - 自动提交并清理
**功能**: 自动提交变更并清理临时文件，无需人工干预

**使用方法**:
```powershell
# 使用默认提交信息
.\tools\git-scripts\auto-commit.ps1

# 使用自定义提交信息
.\tools\git-scripts\auto-commit.ps1 -Message "添加了新功能"

# 指定额外要删除的临时文件
.\tools\git-scripts\auto-commit.ps1 -Message "更新" -TempFilesToDelete @("temp1.txt", "temp2.log")
```

**特点**:
- ✅ 无需人工干预，完全自动化
- ✅ 自动清理常见的临时脚本（do-push.bat, quick-push.bat 等）
- ✅ 支持指定额外要删除的文件
- ✅ 彩色输出，清晰显示执行过程

---

#### auto-push.bat - 自动提交（批处理版本）
**功能**: 批处理版本的自动提交脚本

**使用方法**:
```bash
.\tools\git-scripts\auto-push.bat
```

**注意**: 此版本会在执行后删除自身和其他临时脚本

---

### 手动交互脚本

#### do-push.bat - 推送本地变更
**功能**: 提交并推送本地所有变更到远端仓库（交互式）

**使用方法**:
```bash
.\tools\git-scripts\do-push.bat
```

**执行步骤**:
1. 添加所有变更 (`git add -A`)
2. 打开编辑器输入提交信息 (`git commit`)
3. 推送到远端 (`git push`)

---

#### do-update.bat - 同步仓库
**功能**: 拉取远端变更并推送本地变更（交互式）

**使用方法**:
```bash
.\tools\git-scripts\do-update.bat
```

**执行步骤**:
1. 拉取远端变更 (`git pull`)
2. 添加本地变更 (`git add -A`)
3. 打开编辑器输入提交信息 (`git commit`)
4. 推送到远端 (`git push`)

---

## 使用场景推荐

### 场景1: 智能体自动化提交
当智能体需要自动提交变更时，使用 **auto-commit.ps1**：

```powershell
# 在PowerShell中执行
.\tools\git-scripts\auto-commit.ps1 -Message "更新技能文档"
```

**优点**:
- 无需等待用户输入
- 自动清理临时文件
- 不会阻塞自动化流程

### 场景2: 手动提交（需要编辑提交信息）
当需要手动编辑提交信息时，使用 **do-push.bat**：

```bash
# 在CMD或PowerShell中执行
.\tools\git-scripts\do-push.bat
```

**优点**:
- 可以编辑详细的提交信息
- 适合重要的提交

### 场景3: 同步远端变更
当需要先拉取远端最新代码时，使用 **do-update.bat**：

```bash
.\tools\git-scripts\do-update.bat
```

---

## 快速使用

### 自动化提交（推荐）
```powershell
# 一键提交并清理
.\tools\git-scripts\auto-commit.ps1 -Message "提交信息"
```

### 手动提交
```bash
# 交互式提交
.\tools\git-scripts\do-push.bat

# 或同步后提交
.\tools\git-scripts\do-update.bat
```

---

## 注意事项

1. **自动定位**: 所有脚本都会自动定位到仓库根目录，无需手动切换目录
2. **错误处理**: 脚本包含基本的错误检测，操作失败时会显示错误信息
3. **自动化 vs 交互式**:
   - `auto-commit.ps1`: 完全自动化，适合智能体使用
   - `do-push.bat` / `do-update.bat`: 交互式，适合手动操作
4. **临时文件清理**: `auto-commit.ps1` 会自动清理常见的临时脚本，避免文件堆积

---

## 跨机器使用

这些脚本可以随仓库一起克隆到其他机器上使用：

```bash
# 克隆仓库
git clone https://github.com/1149784810/LLM-GameEngine.git

# 进入目录
cd LLM-GameEngine

# 使用自动化脚本
.\tools\git-scripts\auto-commit.ps1 -Message "初始提交"
```

---

## 脚本对比

| 脚本 | 自动化程度 | 适合场景 | 提交信息 | 清理临时文件 |
|------|-----------|---------|---------|-------------|
| `auto-commit.ps1` | ⭐⭐⭐⭐⭐ 全自动 | 智能体自动化 | 参数传入 | ✅ 自动清理 |
| `auto-push.bat` | ⭐⭐⭐⭐ 自动 | 简单自动化 | 交互输入 | ✅ 自动清理 |
| `do-push.bat` | ⭐⭐ 半自动 | 手动提交 | 交互编辑 | ❌ 不清理 |
| `do-update.bat` | ⭐⭐ 半自动 | 手动同步 | 交互编辑 | ❌ 不清理 |

---

## 智能体使用示例

```powershell
# 智能体完成工作后，自动提交
.\tools\git-scripts\auto-commit.ps1 -Message "Add new skill: output-normalizer"

# 脚本会自动:
# 1. 添加所有变更
# 2. 提交到本地仓库
# 3. 推送到远端
# 4. 清理临时脚本（如 do-push.bat, quick-push.bat 等）
# 5. 完成，无需人工干预
```
