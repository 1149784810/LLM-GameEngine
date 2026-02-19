# Git 操作脚本集合

这个目录包含了一系列常用的 Git 操作脚本，方便在不同机器上快速执行 Git 操作。

## 脚本列表

### 1. git-push.bat - 推送本地变更
**功能**: 提交并推送本地所有变更到远端仓库

**使用方法**:
```bash
# 使用默认提交信息
.\tools\git-scripts\git-push.bat

# 使用自定义提交信息
.\tools\git-scripts\git-push.bat "添加了新功能"
```

**执行步骤**:
1. 检查Git状态
2. 添加所有变更 (`git add -A`)
3. 提交变更 (`git commit`)
4. 推送到远端 (`git push`)

---

### 2. git-status.bat - 查看状态
**功能**: 查看当前Git仓库的状态

**使用方法**:
```bash
.\tools\git-scripts\git-status.bat
```

**显示内容**:
- 当前分支信息
- 文件变更状态
- 最近5次提交记录

---

### 3. git-pull.bat - 拉取远端变更
**功能**: 从远端仓库拉取最新变更

**使用方法**:
```bash
.\tools\git-scripts\git-pull.bat
```

---

### 4. git-sync.bat - 同步仓库
**功能**: 拉取远端变更并推送本地变更（一键同步）

**使用方法**:
```bash
# 使用默认提交信息
.\tools\git-scripts\git-sync.bat

# 使用自定义提交信息
.\tools\git-scripts\git-sync.bat "同步更新"
```

**执行步骤**:
1. 检查当前状态
2. 拉取远端变更 (`git pull`)
3. 添加本地变更 (`git add -A`)
4. 提交本地变更 (`git commit`)
5. 推送到远端 (`git push`)

---

## 快速使用

在PowerShell或CMD中，可以直接运行：

```bash
# 查看状态
tools\git-scripts\git-status.bat

# 推送变更
tools\git-scripts\git-push.bat "提交信息"

# 拉取变更
tools\git-scripts\git-pull.bat

# 同步仓库
tools\git-scripts\git-sync.bat "同步信息"
```

## 注意事项

1. **自动定位**: 所有脚本都会自动定位到仓库根目录，无需手动切换目录
2. **错误处理**: 脚本包含基本的错误检测，操作失败时会暂停显示错误信息
3. **提交信息**: 如果不提供提交信息，脚本会使用默认信息（如 "Update local changes"）
4. **分支**: 默认操作 `master` 分支，如需操作其他分支请修改脚本

## 跨机器使用

这些脚本可以随仓库一起克隆到其他机器上使用：

```bash
# 克隆仓库
git clone https://github.com/1149784810/LLM-GameEngine.git

# 进入目录
cd LLM-GameEngine

# 使用脚本
tools\git-scripts\git-status.bat
```
