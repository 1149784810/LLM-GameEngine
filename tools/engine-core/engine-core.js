#!/usr/bin/env node
/**
 * 全栈游戏开发引擎 - 核心进程
 * 负责状态管理、约束验证、审计日志、回滚管理
 * 独立运行，通过Socket与外部通信
 */

const net = require('net');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class EngineCore {
  constructor(projectId) {
    this.projectId = projectId;
    this.basePath = path.join(process.cwd(), 'projects', projectId, '.engine');
    this.state = null;
    this.context = null;
    this.auditLog = [];
    this.commandHandlers = new Map();
    
    this.initCommandHandlers();
    this.ensureDirectories();
    this.loadState();
    this.loadContext();
  }

  // 初始化命令处理器
  initCommandHandlers() {
    // 获取状态
    this.commandHandlers.set('GET_STATE', () => ({
      success: true,
      data: this.getStateSnapshot()
    }));

    // 获取上下文
    this.commandHandlers.set('GET_CONTEXT', () => ({
      success: true,
      data: this.context
    }));

    // 前置验证
    this.commandHandlers.set('VALIDATE_PRECONDITIONS', (params) => {
      const result = this.validatePreconditions(params.stageId);
      this.recordAudit('VALIDATION', { stageId: params.stageId, result });
      return { success: true, data: result };
    });

    // 记录工具调用
    this.commandHandlers.set('RECORD_TOOL_CALL', (params) => {
      const record = {
        toolName: params.toolName,
        params: params.params,
        result: params.result,
        timestamp: Date.now(),
        hash: this.computeHash({ toolName: params.toolName, params: params.params, timestamp: Date.now() })
      };
      
      this.context.executionHistory.push(record);
      this.recordAudit('TOOL_CALL', record);
      this.persistContext();
      
      return { success: true, data: { recordId: record.hash } };
    });

    // 注册产出物
    this.commandHandlers.set('REGISTER_ARTIFACT', (params) => {
      if (!fs.existsSync(params.path)) {
        return { 
          success: false, 
          error: 'FILE_NOT_FOUND',
          message: `文件不存在: ${params.path}`
        };
      }

      const artifact = {
        path: params.path,
        createdBy: params.stageId,
        createdAt: Date.now(),
        checksum: this.computeFileHash(params.path),
        validated: false
      };

      this.context.artifacts.push(artifact);
      this.persistContext();
      
      return { success: true, data: artifact };
    });

    // 验证产出物
    this.commandHandlers.set('VALIDATE_ARTIFACT', (params) => {
      const artifact = this.context.artifacts.find(a => a.path === params.path);
      
      if (!artifact) {
        return { 
          success: false, 
          error: 'ARTIFACT_NOT_REGISTERED',
          message: `产出物未注册: ${params.path}`
        };
      }

      if (!fs.existsSync(params.path)) {
        artifact.validated = false;
        this.persistContext();
        return { 
          success: false, 
          error: 'ARTIFACT_MISSING',
          message: `产出物文件缺失: ${params.path}`
        };
      }

      const currentHash = this.computeFileHash(params.path);
      if (currentHash !== artifact.checksum) {
        artifact.validated = false;
        this.persistContext();
        return { 
          success: false, 
          error: 'ARTIFACT_MODIFIED',
          message: `产出物已被修改: ${params.path}`
        };
      }

      artifact.validated = true;
      this.persistContext();
      
      return { success: true, data: { valid: true, checksum: currentHash } };
    });

    // 定义约束
    this.commandHandlers.set('DEFINE_CONSTRAINTS', (params) => {
      // 确保constraints是数组
      let constraints = params.constraints;
      if (typeof constraints === 'string') {
        try {
          constraints = JSON.parse(constraints);
        } catch (e) {
          return { success: false, error: 'INVALID_CONSTRAINTS', message: '约束必须是有效的JSON数组' };
        }
      }
      if (!Array.isArray(constraints)) {
        return { success: false, error: 'INVALID_CONSTRAINTS', message: '约束必须是数组' };
      }
      
      this.context.preconditions[params.nextStage] = {
        definedBy: params.currentStage,
        definedAt: Date.now(),
        mandatory: true,
        constraints: constraints
      };
      this.persistContext();
      
      return { success: true, data: { constraintsId: `${params.nextStage}-${Date.now()}` } };
    });

    // 保存检查点
    this.commandHandlers.set('SAVE_CHECKPOINT', () => {
      const checkpoint = {
        id: `checkpoint-${Date.now()}`,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(this.state)),
        context: JSON.parse(JSON.stringify(this.context))
      };

      this.state.checkpoints.push(checkpoint);
      this.persistState();
      this.recordAudit('CHECKPOINT_SAVED', { checkpointId: checkpoint.id });

      return { success: true, data: { checkpointId: checkpoint.id } };
    });

    // 触发回滚
    this.commandHandlers.set('TRIGGER_ROLLBACK', (params) => {
      const result = this.executeRollback(params.targetCheckpoint, params.reason);
      return { success: result.success, data: result.data, error: result.error };
    });

    // 获取审计日志
    this.commandHandlers.set('GET_AUDIT_LOG', () => ({
      success: true,
      data: this.auditLog
    }));

    // 更新状态
    this.commandHandlers.set('UPDATE_STATE', (params) => {
      if (params.currentPhase) this.state.currentPhase = params.currentPhase;
      if (params.currentStage) this.state.currentStage = params.currentStage;
      if (params.currentStep) this.state.currentStep = params.currentStep;
      
      this.persistState();
      this.recordAudit('STATE_UPDATED', { 
        currentPhase: this.state.currentPhase,
        currentStage: this.state.currentStage 
      });
      
      return { success: true, data: this.state };
    });

    // 健康检查
    this.commandHandlers.set('HEALTH_CHECK', () => ({
      success: true,
      data: {
        status: 'healthy',
        projectId: this.projectId,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checkpointCount: this.state.checkpoints.length,
        artifactCount: this.context.artifacts.length,
        executionHistoryCount: this.context.executionHistory.length
      }
    }));
  }

  // 验证前置约束
  validatePreconditions(stageId) {
    const preconditions = this.context.preconditions[stageId];
    
    if (!preconditions) {
      return { passed: true, reason: 'no_preconditions_defined' };
    }

    const results = preconditions.constraints.map(constraint => {
      switch (constraint.type) {
        case 'TOOL_CALLED':
          const toolCalls = this.context.executionHistory.filter(
            h => h.toolName === constraint.params.toolName
          );
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: toolCalls.length >= constraint.params.minCount,
            expected: constraint.params.minCount,
            actual: toolCalls.length,
            evidence: toolCalls.map(t => ({ timestamp: t.timestamp, hash: t.hash }))
          };

        case 'FILE_EXISTS':
          const fileExists = fs.existsSync(constraint.params.path);
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: fileExists,
            path: constraint.params.path
          };

        case 'DIRECTORY_NOT_EMPTY':
          if (!fs.existsSync(constraint.params.path)) {
            return {
              constraintId: constraint.id,
              type: constraint.type,
              passed: false,
              path: constraint.params.path,
              reason: 'directory_not_found'
            };
          }
          try {
            const files = fs.readdirSync(constraint.params.path);
            return {
              constraintId: constraint.id,
              type: constraint.type,
              passed: files.length > 0,
              path: constraint.params.path,
              fileCount: files.length
            };
          } catch (err) {
            return {
              constraintId: constraint.id,
              type: constraint.type,
              passed: false,
              path: constraint.params.path,
              reason: err.message
            };
          }

        case 'ARTIFACT_VALIDATED':
          const artifact = this.context.artifacts.find(a => a.path === constraint.params.path);
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: artifact && artifact.validated,
            path: constraint.params.path,
            artifact: artifact ? { createdBy: artifact.createdBy, validated: artifact.validated } : null
          };

        default:
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: false,
            reason: 'unknown_constraint_type'
          };
      }
    });

    return {
      passed: results.every(r => r.passed),
      results: results,
      canProceed: results.every(r => r.passed),
      stageId: stageId,
      timestamp: Date.now()
    };
  }

  // 执行回滚
  executeRollback(targetCheckpointId, reason) {
    const checkpoint = this.state.checkpoints.find(c => c.id === targetCheckpointId);
    
    if (!checkpoint) {
      return {
        success: false,
        error: 'CHECKPOINT_NOT_FOUND',
        message: `检查点不存在: ${targetCheckpointId}`
      };
    }

    // 备份当前状态
    const backupId = `rollback-backup-${Date.now()}`;
    const backupPath = path.join(this.basePath, 'backups', `${backupId}.json`);
    
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ state: this.state, context: this.context }, null, 2)
    );

    // 恢复状态
    this.state = JSON.parse(JSON.stringify(checkpoint.state));
    this.context = JSON.parse(JSON.stringify(checkpoint.context));

    this.recordAudit('ROLLBACK', {
      targetCheckpointId,
      reason,
      backupId,
      previousPhase: this.state.currentPhase,
      previousStage: this.state.currentStage
    });

    this.persistState();
    this.persistContext();

    return {
      success: true,
      data: {
        rolledBackTo: checkpoint.id,
        backupId,
        currentPhase: this.state.currentPhase,
        currentStage: this.state.currentStage
      }
    };
  }

  // 计算哈希
  computeHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
  }

  // 计算文件哈希
  computeFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (err) {
      return null;
    }
  }

  // 记录审计日志
  recordAudit(type, data) {
    const entry = {
      type,
      data,
      timestamp: Date.now(),
      signature: this.computeHash({ type, data, timestamp: Date.now() })
    };
    this.auditLog.push(entry);
    
    // 追加写入审计日志文件
    const auditPath = path.join(this.basePath, 'audit.log');
    fs.appendFileSync(auditPath, JSON.stringify(entry) + '\n');
  }

  // 确保目录存在
  ensureDirectories() {
    const dirs = [
      this.basePath,
      path.join(this.basePath, 'backups')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // 加载状态
  loadState() {
    const statePath = path.join(this.basePath, 'state.json');
    
    if (fs.existsSync(statePath)) {
      try {
        this.state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        console.log(`[Engine] 已加载状态: ${statePath}`);
        return;
      } catch (err) {
        console.error(`[Engine] 加载状态失败: ${err.message}`);
      }
    }

    // 创建初始状态
    this.state = {
      projectId: this.projectId,
      currentPhase: 'INIT',
      currentStage: 'INIT',
      currentStep: null,
      checkpoints: [],
      startedAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    this.persistState();
    console.log(`[Engine] 已创建初始状态`);
  }

  // 加载上下文
  loadContext() {
    const contextPath = path.join(this.basePath, 'context.json');
    
    if (fs.existsSync(contextPath)) {
      try {
        this.context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
        console.log(`[Engine] 已加载上下文: ${contextPath}`);
        return;
      } catch (err) {
        console.error(`[Engine] 加载上下文失败: ${err.message}`);
      }
    }

    // 创建初始上下文
    this.context = {
      projectId: this.projectId,
      executionHistory: [],
      artifacts: [],
      preconditions: {},
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    this.persistContext();
    console.log(`[Engine] 已创建初始上下文`);
  }

  // 持久化状态
  persistState() {
    this.state.lastUpdated = Date.now();
    const statePath = path.join(this.basePath, 'state.json');
    const tempPath = `${statePath}.tmp`;
    
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2));
    fs.renameSync(tempPath, statePath);
  }

  // 持久化上下文
  persistContext() {
    this.context.lastUpdated = Date.now();
    const contextPath = path.join(this.basePath, 'context.json');
    const tempPath = `${contextPath}.tmp`;
    
    fs.writeFileSync(tempPath, JSON.stringify(this.context, null, 2));
    fs.renameSync(tempPath, contextPath);
  }

  // 获取状态快照
  getStateSnapshot() {
    return {
      ...this.state,
      context: this.context,
      auditLogCount: this.auditLog.length
    };
  }

  // 生成端口号（基于项目ID哈希）
  getPort() {
    const hash = crypto.createHash('sha256').update(this.projectId).digest('hex');
    const portNum = parseInt(hash.substring(0, 4), 16);
    // 使用高端口范围 10000-65000
    return 10000 + (portNum % 55000);
  }

  // 启动服务
  start() {
    const port = this.getPort();
    const host = '127.0.0.1';

    const server = net.createServer((socket) => {
      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();
        let newlineIndex;

        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const message = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);

          try {
            const request = JSON.parse(message);
            const handler = this.commandHandlers.get(request.command);

            if (handler) {
              const response = handler(request.params || {});
              socket.write(JSON.stringify(response) + '\n');
            } else {
              socket.write(JSON.stringify({
                success: false,
                error: 'UNKNOWN_COMMAND',
                message: `未知命令: ${request.command}`
              }) + '\n');
            }
          } catch (err) {
            socket.write(JSON.stringify({
              success: false,
              error: 'PARSE_ERROR',
              message: err.message
            }) + '\n');
          }
        }
      });

      socket.on('error', (err) => {
        console.error(`[Engine] Socket错误: ${err.message}`);
      });
    });

    server.listen(port, host, () => {
      console.log(`[Engine] 核心进程已启动`);
      console.log(`[Engine] 项目: ${this.projectId}`);
      console.log(`[Engine] 地址: ${host}:${port}`);
      console.log(`[Engine] PID: ${process.pid}`);
      
      // 写入端口文件
      const portPath = path.join(this.basePath, 'engine.port');
      fs.writeFileSync(portPath, port.toString());
      
      // 写入PID文件
      const pidPath = path.join(this.basePath, 'engine.pid');
      fs.writeFileSync(pidPath, process.pid.toString());
    });

    // 进程退出处理
    const cleanup = () => {
      console.log('\n[Engine] 正在关闭...');
      
      // 持久化最终状态
      this.persistState();
      this.persistContext();
      
      server.close(() => {
        console.log('[Engine] 已关闭');
        process.exit(0);
      });
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    // 异常处理
    process.on('uncaughtException', (err) => {
      console.error('[Engine] 未捕获的异常:', err);
      this.persistState();
      this.persistContext();
    });
  }
}

// 启动引擎
const projectId = process.argv[2];

if (!projectId) {
  console.error('用法: node engine-core.js <project-id>');
  console.error('示例: node engine-core.js my-game');
  process.exit(1);
}

const engine = new EngineCore(projectId);
engine.start();
