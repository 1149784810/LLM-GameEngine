---
name: "git-version-control"
version: "1.0.0"
description: "Manages all Git version control operations including commit, push, pull, branch management, and repository synchronization. Invoke when user needs any Git-related operations or version control tasks."
author: "Jianle He"
created_at: "2024-02-19"
updated_at: "2026-02-20"

layer: 4
dependencies:
  - name: "terminology-standard"
    layer: 0
    type: "required"
    purpose: "术语标准引用"

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
    supported: true
    strategy: "checkpoint"

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
    name: "commit"
    signature: "commit(message: STRING, files: [PATH]) -> COMMIT_RESULT"
    description: "提交代码变更"
  state_managers:
    - name: "push"
      signature: "push(remote: STRING, branch: STRING) -> PUSH_RESULT"
      description: "推送到远程仓库"
    - name: "pull"
      signature: "pull(remote: STRING, branch: STRING) -> PULL_RESULT"
      description: "拉取远程更新"
---

# Git 版本控制技能

本技能涵盖所有 Git 版本控制操作，是项目版本控制的唯一权威参考。

## 触发条件

当用户有以下需求时，必须调用本技能：
- 需要提交代码变更
- 需要推送/拉取代码
- 需要创建/切换/合并分支
- 需要查看仓库状态
- 需要解决合并冲突
- 需要回滚/重置变更
- 任何与 Git 相关的操作

## 可用脚本工具

项目已预置以下 Git 操作脚本（位于 `tools/git-scripts/`）：

### 1. 全自动提交脚本（推荐用于智能体）

**文件**: `auto-commit.ps1`

**功能**: 完全自动化的提交流程，无需人工干预

**使用方法**:
```powershell
# 使用默认提交信息
.\tools\git-scripts\auto-commit.ps1

# 使用自定义提交信息
.\tools\git-scripts\auto-commit.ps1 -Message "添加了新功能"

# 指定额外要删除的临时文件
.\tools\git-scripts\auto-commit.ps1 -Message "更新" -TempFilesToDelete @("temp1.txt", "temp2.log")
```

**执行流程**:
1. 自动定位到仓库根目录
2. 添加所有变更 (`git add -A`)
3. 提交到本地仓库 (`git commit`)
4. 推送到远端 (`git push`)
5. 自动清理临时脚本文件

**特点**:
- ✅ 完全自动化，无需等待用户输入
- ✅ 自动清理常见临时脚本（do-push.bat, quick-push.bat 等）
- ✅ 彩色输出，清晰显示执行过程
- ✅ 适合 AI 智能体使用

---

### 2. 自动提交批处理版本

**文件**: `auto-push.bat`

**功能**: 批处理版本的自动提交

**使用方法**:
```bash
.\tools\git-scripts\auto-push.bat
```

**注意**: 此版本会在执行后删除自身和其他临时脚本

---

### 3. 手动交互式提交

**文件**: `do-push.bat`

**功能**: 交互式提交并推送

**使用方法**:
```bash
.\tools\git-scripts\do-push.bat
```

**执行流程**:
1. 添加所有变更 (`git add -A`)
2. 打开编辑器输入提交信息 (`git commit`)
3. 推送到远端 (`git push`)

**适用场景**: 需要手动编辑详细提交信息时

---

### 4. 同步并提交

**文件**: `do-update.bat`

**功能**: 先拉取远端变更，再提交本地变更

**使用方法**:
```bash
.\tools\git-scripts\do-update.bat
```

**执行流程**:
1. 拉取远端变更 (`git pull`)
2. 添加本地变更 (`git add -A`)
3. 打开编辑器输入提交信息 (`git commit`)
4. 推送到远端 (`git push`)

**适用场景**: 需要先同步远端最新代码时

---

## 使用场景指南

### 场景1: 智能体自动提交（最常用）

当 AI 智能体完成工作并需要提交变更时：

```powershell
.\tools\git-scripts\auto-commit.ps1 -Message "更新技能文档"
```

**优势**:
- 不阻塞自动化流程
- 自动清理临时文件
- 无需等待用户输入

---

### 场景2: 手动提交（需要编辑提交信息）

当需要编写详细的提交信息时：

```bash
.\tools\git-scripts\do-push.bat
```

**优势**:
- 可以编辑多行提交信息
- 适合重要的代码提交

---

### 场景3: 同步远端变更

当需要先获取远端最新代码时：

```bash
.\tools\git-scripts\do-update.bat
```

**优势**:
- 自动处理远端变更
- 避免推送冲突

---

## 脚本对比表

| 脚本 | 自动化程度 | 适合场景 | 提交信息 | 清理临时文件 | 等待用户输入 |
|------|-----------|---------|---------|-------------|-------------|
| `auto-commit.ps1` | ⭐⭐⭐⭐⭐ 全自动 | 智能体自动化 | 参数传入 | ✅ 自动 | ❌ 否 |
| `auto-push.bat` | ⭐⭐⭐⭐ 自动 | 简单自动化 | 交互输入 | ✅ 自动 | ✅ 是 |
| `do-push.bat` | ⭐⭐ 半自动 | 手动提交 | 交互编辑 | ❌ 不清理 | ✅ 是 |
| `do-update.bat` | ⭐⭐ 半自动 | 手动同步 | 交互编辑 | ❌ 不清理 | ✅ 是 |

---

## 标准操作流程

### 智能体提交变更的标准步骤

1. **检查当前 Git 状态**（可选）
   ```powershell
   git status
   ```

2. **执行自动提交**
   ```powershell
   .\tools\git-scripts\auto-commit.ps1 -Message "描述本次变更"
   ```

3. **确认提交结果**
   - 脚本会自动显示提交和推送结果
   - 如有错误会显示错误信息

---

## 注意事项

1. **自动定位**: 所有脚本都会自动定位到仓库根目录，无需手动切换目录

2. **错误处理**: 脚本包含基本的错误检测，操作失败时会显示错误信息

3. **临时文件清理**: 
   - `auto-commit.ps1` 会自动清理常见的临时脚本
   - 可通过 `-TempFilesToDelete` 参数指定额外要删除的文件

4. **网络问题**: 如果推送失败，请检查网络连接和远端仓库访问权限

5. **冲突处理**: 如果遇到合并冲突，`auto-commit.ps1` 会停止并提示手动解决

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

## 扩展命令参考

### 常用 Git 命令

```bash
# 查看状态
git status

# 查看变更
git diff

# 添加文件
git add <文件名>
git add -A  # 添加所有

# 提交
git commit -m "提交信息"

# 推送
git push
git push -u origin <分支名>

# 拉取
git pull

# 分支操作
git branch              # 查看分支
git branch <新分支>      # 创建分支
git checkout <分支>      # 切换分支
git checkout -b <新分支> # 创建并切换
git merge <分支>         # 合并分支

# 查看历史
git log
git log --oneline

# 撤销操作
git reset HEAD~1        # 撤销最近一次提交（保留变更）
git reset --hard HEAD~1 # 撤销最近一次提交（丢弃变更）
git revert <commit-id>  # 撤销指定提交（创建新提交）
```

---

## 故障排除

### 常见问题

1. **推送被拒绝**
   - 原因：远端有更新的提交
   - 解决：先执行 `git pull`，解决冲突后再推送

2. **合并冲突**
   - 原因：本地和远端对同一文件有冲突的修改
   - 解决：手动编辑冲突文件，然后重新提交

3. **权限错误**
   - 原因：没有远端仓库的写入权限
   - 解决：检查 SSH 密钥或 HTTPS 凭据配置

4. **网络超时**
   - 原因：网络连接问题
   - 解决：检查网络连接，稍后重试

---

## 最佳实践

1. **提交信息规范**
   - 使用清晰、简洁的描述
   - 说明"做了什么"和"为什么"
   - 英文或中文均可，保持一致性

2. **提交频率**
   - 小步快跑，频繁提交
   - 每个提交只包含一个逻辑变更

3. **先拉后推**
   - 推送前先拉取远端变更
   - 减少合并冲突的可能性

4. **使用脚本**
   - 优先使用项目提供的脚本
   - 确保操作的一致性和可重复性
