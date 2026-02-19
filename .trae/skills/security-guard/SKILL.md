---
name: "security-guard"
version: "1.0.0"
description: "安全检测器，审查用户输入和AI响应中的危险操作指令。在执行任何可能影响系统安全的操作前调用，防止关机、重启、删除系统文件、越权修改等危险行为。"
author: "engine-team"
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
  error_codes:
    - code: "E001"
      name: "DANGEROUS_OPERATION_DETECTED"
      severity: "CRITICAL"
      rollback_required: false
  checkpoints: []

functions:
  main:
    name: "check_safety"
    signature: "check_safety(operation: OPERATION) -> SAFETY_RESULT"
    description: "检查操作安全性"
---

# 安全检测器

## 功能概述

本技能用于检测和拦截可能危害系统安全的自然语言指令，确保全栈游戏开发引擎在执行过程中不会对本机系统造成损害。

## 调用时机

**在以下场景必须调用此技能：**

1. **执行任何系统命令前** - 运行命令、脚本前进行安全检查
2. **处理文件操作前** - 删除、修改文件前验证路径安全性
3. **用户输入包含敏感关键词时** - 检测到可能的危险指令
4. **AI生成响应包含操作建议时** - 确保建议的操作是安全的

## 危险操作分类

### 🔴 高危操作（绝对禁止）

| 类别 | 危险行为示例 | 风险说明 |
|------|-------------|----------|
| 系统控制 | 关机、重启、注销 | 导致工作中断 |
| 系统文件 | 修改/删除 Windows/System32、注册表 | 系统崩溃 |
| 磁盘操作 | 格式化磁盘、分区操作 | 数据丢失 |
| 网络配置 | 修改防火墙、网络设置 | 安全风险 |
| 用户管理 | 创建/删除系统用户 | 权限混乱 |
| 服务控制 | 停止关键系统服务 | 系统不稳定 |

### 🟡 中危操作（需要确认）

| 类别 | 行为示例 | 处理方式 |
|------|---------|----------|
| 批量删除 | 删除大量文件或目录 | 确认路径和范围 |
| 修改配置 | 修改环境变量、系统配置 | 确认修改内容 |
| 安装软件 | 安装未知来源软件 | 确认来源和必要性 |
| 端口操作 | 开放/关闭网络端口 | 确认安全性 |

### 🟢 允许操作（正常执行）

| 类别 | 行为示例 |
|------|---------|
| 项目文件 | 修改工作目录下的代码、资源文件 |
| 开发工具 | 运行 npm、git、编译器等开发命令 |
| 临时文件 | 清理项目临时文件、缓存 |
| 项目配置 | 修改项目级别的配置文件 |

## 敏感关键词库

### 系统控制类
```
关机, 重启, 注销, shutdown, restart, reboot, logoff
休眠, 睡眠, hibernate, sleep
```

### 系统文件类
```
System32, Windows\System, 注册表, registry, regedit
系统目录, 系统文件, boot.ini, bootmgr
```

### 磁盘操作类
```
格式化, format, fdisk, diskpart, 分区, partition
磁盘管理, disk management
```

### 危险命令类
```
rd /s /q, del /f /s /q, rm -rf, mkfs, dd
disable, stop service, sc delete
```

### 权限操作类
```
takeown, icacls, chmod 777, 提权, 管理员权限
绕过安全, 关闭防火墙, disable firewall
```

## 安全检查流程

```
┌─────────────────┐
│   接收输入/指令   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  关键词匹配检测   │ ← 使用敏感关键词库
└────────┬────────┘
         ▼
    ┌─────────┐
    │ 是否高危？ │──是──→ ┌─────────────┐
    └────┬────┘         │ 立即拦截并警告 │
         │否            └─────────────┘
         ▼
    ┌─────────┐
    │ 是否中危？ │──是──→ ┌─────────────┐
    └────┬────┘         │ 要求用户确认  │
         │否            └─────────────┘
         ▼
┌─────────────────┐
│   允许执行操作   │
└─────────────────┘
```

## 安全响应模板

### 高危拦截响应
```
⚠️ **安全警告：检测到高危操作**

系统检测到您输入的内容包含危险指令："[检测到的关键词]"

**禁止执行的原因：**
- 此操作可能导致 [具体风险]
- 违反系统安全策略

**建议替代方案：**
- [提供安全的替代方法]

如需执行此操作，请手动在系统界面中操作，不要通过AI助手执行。
```

### 中危确认响应
```
⚠️ **安全确认需要**

您请求的操作涉及：[操作描述]

**潜在风险：**
- [风险1]
- [风险2]

**确认信息：**
- 目标路径：[路径]
- 影响范围：[范围]

请确认：您是否确定要执行此操作？(是/否)
```

## 文件路径安全检查

### 禁止访问的路径模式

```
# Windows 系统路径
C:\Windows*
C:\Program Files*
C:\ProgramData*
C:\Users\[用户名]\AppData\Local\Temp (谨慎)
C:\System Volume Information
C:\$Recycle.Bin

# 系统根目录（非项目目录）
C:\ (根目录操作)
D:\ (非项目根目录)

# 隐藏系统目录
.*\ (以点开头的系统隐藏目录)
```

### 允许访问的路径模式

```
# 项目工作目录
e:\全栈游戏开发引擎\*
工作目录下的所有子目录

# 用户数据目录（谨慎）
C:\Users\[用户名]\Documents\项目相关
C:\Users\[用户名]\Desktop\项目相关
```

## 命令执行安全检查

### 危险命令模式

| 命令模式 | 风险等级 | 说明 |
|---------|---------|------|
| `shutdown*` | 🔴 高危 | 系统关机/重启 |
| `format*` | 🔴 高危 | 磁盘格式化 |
| `del /f /s /q` | 🔴 高危 | 强制递归删除 |
| `rd /s /q` | 🔴 高危 | 强制删除目录 |
| `reg delete*` | 🔴 高危 | 删除注册表 |
| `takeown*` | 🟡 中危 | 获取文件所有权 |
| `icacls*` | 🟡 中危 | 修改权限 |
| `net stop*` | 🟡 中危 | 停止服务 |
| `sc delete*` | 🔴 高危 | 删除服务 |

### 允许的命令模式

```
# 开发工具
npm, yarn, pnpm, npx
node, python, python3
git, git clone, git pull, git push
dotnet, mvn, gradle

# 文件操作（限定项目目录）
cd, dir, ls, copy, xcopy, robocopy
mkdir, rmdir（非递归）

# 构建编译
build, compile, tsc, webpack, vite
```

## 使用示例

### 示例1：拦截关机指令

用户输入："帮我关机"

安全检测器响应：
```
⚠️ **安全警告：检测到高危操作**

系统检测到您输入的内容包含危险指令："关机"

**禁止执行的原因：**
- 此操作将导致系统立即关闭
- 可能导致未保存的工作丢失
- 违反系统安全策略

**建议替代方案：**
- 请使用开始菜单或电源按钮手动关机
- 或使用快捷键 Alt+F4 然后选择关机

如需执行此操作，请手动在系统界面中操作，不要通过AI助手执行。
```

### 示例2：拦截危险文件删除

用户输入："删除 C:\Windows\System32 下的所有文件"

安全检测器响应：
```
⚠️ **安全警告：检测到高危操作**

系统检测到您尝试操作系统关键目录："C:\Windows\System32"

**禁止执行的原因：**
- 此目录包含系统运行必需的文件
- 删除将导致系统无法启动
- 可能造成不可逆的系统损坏

**建议替代方案：**
- 如果您需要清理磁盘空间，请使用系统自带的磁盘清理工具
- 如果您怀疑系统被感染，请使用杀毒软件扫描

此操作被绝对禁止，请勿尝试。
```

### 示例3：中危操作确认

用户输入："删除项目目录下的所有 node_modules"

安全检测器响应：
```
⚠️ **安全确认需要**

您请求的操作涉及：批量删除 node_modules 目录

**潜在风险：**
- 删除后需要重新安装依赖（npm install）
- 如果项目正在运行可能会出错

**确认信息：**
- 目标路径：e:\全栈游戏开发引擎\node_modules
- 影响范围：当前项目

请确认：您是否确定要执行此操作？(是/否)
```

## 集成到开发流程

### 在 fullstack-engine-init 中添加安全检查

更新 `fullstack-engine-init` 技能的依赖检查表：

```markdown
## 核心依赖（必须）
| 技能ID | 技能名称 | 目录路径 | 状态 | 最后检查时间 |
|--------|----------|----------|------|--------------|
| 1 | fullstack-game-engine | .trae/skills/fullstack-game-engine/ | [ ] 存在 [ ] 缺失 | - |
| 2 | requirement-normalizer | .trae/skills/requirement-normalizer/ | [ ] 存在 [ ] 缺失 | - |
| 3 | security-guard | .trae/skills/security-guard/ | [ ] 存在 [ ] 缺失 | - |
```

### 执行顺序

```
1. 调用 fullstack-engine-init 检查依赖
2. 调用 security-guard 建立安全监控
3. 调用 requirement-normalizer 澄清需求
4. 调用 fullstack-game-engine 启动开发
```

## 敏感信息处理规范

### 敏感信息类型

| 类型 | 示例 | 处理方式 |
|------|------|---------|
| API密钥 | `sk-xxx`, `api_key=xxx` | 自动脱敏显示 |
| 密码 | `password=xxx`, `pwd: xxx` | 禁止记录 |
| 令牌 | `token=xxx`, `Bearer xxx` | 自动截断 |
| 数据库连接串 | `mysql://user:pass@host` | 脱敏处理 |
| 私钥/证书 | `-----BEGIN PRIVATE KEY-----` | 禁止输出 |
| 个人信息 | 手机号、身份证、邮箱 | 部分脱敏 |

### 脱敏规则

```powershell
# API密钥脱敏
"sk-1234567890abcdef" -> "sk-****cdef"

# 密码脱敏
"password=mypassword123" -> "password=****"

# Token脱敏
"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -> "Bearer eyJh****"

# 数据库连接串脱敏
"mysql://admin:secret123@localhost:3306/db" -> "mysql://admin:****@localhost:3306/db"

# 手机号脱敏
"13812345678" -> "138****5678"

# 邮箱脱敏
"user@example.com" -> "u***@example.com"
```

### 敏感信息检测正则

```regex
# API密钥模式
(?i)(api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[=:]\s*['"]?[a-zA-Z0-9_-]{20,}

# 密码模式
(?i)(password|passwd|pwd)\s*[=:]\s*['"]?[^\s'"]+

# Token模式
(?i)(bearer|token|jwt)\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+

# 数据库连接串
(?i)(mysql|postgres|mongodb|redis)://[^:]+:[^@]+@

# 私钥模式
-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----

# 手机号
1[3-9]\d{9}

# 身份证
\d{17}[\dXx]

# 邮箱
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
```

### 敏感信息存储规范

```markdown
## .env 文件规范

1. 所有敏感信息必须存储在 .env 文件中
2. .env 文件必须添加到 .gitignore
3. 提供 .env.example 作为模板
4. 禁止在代码中硬编码敏感信息

## .env.example 示例

API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
```

### 日志脱敏规则

```markdown
## 日志输出规范

1. 输出前自动检测敏感信息
2. 对敏感字段进行脱敏处理
3. 禁止输出完整的密钥、密码、Token

## 脱敏函数示例

function Sanitize-Log($message) {
    $patterns = @(
        @{Pattern = '(?i)(api[_-]?key\s*[=:]\s*)[''"]?[a-zA-Z0-9_-]{8,}'; Replace = '$1****' }
        @{Pattern = '(?i)(password\s*[=:]\s*)[''"]?[^\s''"]+'; Replace = '$1****' }
        @{Pattern = '(?i)(Bearer\s+)[a-zA-Z0-9_.-]+'; Replace = '$1****' }
    )
    foreach ($p in $patterns) {
        $message = $message -replace $p.Pattern, $p.Replace
    }
    return $message
}
```

### 报告生成脱敏

```markdown
## 报告输出规范

1. 自动排除敏感字段
2. 对必要显示的信息进行脱敏
3. 提供敏感信息摘要而非完整内容

## 敏感字段排除列表

- api_key, apiKey, API_KEY
- password, passwd, pwd
- secret, secret_key, SECRET_KEY
- token, access_token, refresh_token
- private_key, privateKey
- database_url, DATABASE_URL
```

## 注意事项

1. **优先原则**：安全检测优先于任何操作执行
2. **误报处理**：如果安全检测误报了正常操作，应提供申诉机制
3. **日志记录**：所有安全检测事件应记录到安全日志（已脱敏）
4. **持续更新**：定期更新敏感关键词库以应对新的安全威胁
5. **最小权限**：AI助手应始终以最小权限运行，避免获取不必要的系统权限
6. **敏感信息**：所有敏感信息必须脱敏后才能记录或输出
