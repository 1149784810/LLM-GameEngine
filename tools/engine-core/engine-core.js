const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FullstackGameEngine {
  constructor(projectId) {
    this.projectId = projectId;
    this.startTime = Date.now();
    
    // 使用相对路径 - 基于当前工作目录
    const cwd = process.cwd();
    this.projectPath = path.join(cwd, 'projects', projectId);
    this.enginePath = path.join(this.projectPath, '.engine');
    this.portFile = path.join(this.enginePath, 'engine.port');
    this.pidFile = path.join(this.enginePath, 'engine.pid');
    this.stateFile = path.join(this.enginePath, 'state.json');
    this.auditLogFile = path.join(this.enginePath, 'audit.log');
    
    // 从项目ID生成端口 (10000-65000)
    this.port = this.getPort();
    
    // 内存状态
    this.context = {
      projectId,
      currentPhase: 'INIT',
      currentStage: 'INIT',
      checkpoints: [],
      artifacts: [],
      executionHistory: [],
      preconditions: {},
      auditLog: []
    };
    
    this.server = null;
  }

  getPort() {
    const hash = crypto.createHash('sha256').update(this.projectId).digest('hex');
    const portNum = parseInt(hash.substring(0, 4), 16);
    return 10000 + (portNum % 55000);
  }

  async start() {
    // 创建目录
    if (!fs.existsSync(this.enginePath)) {
      fs.mkdirSync(this.enginePath, { recursive: true });
    }
    
    // 保存PID
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    // 保存端口
    fs.writeFileSync(this.portFile, this.port.toString());
    
    // 加载状态
    this.loadState();
    
    // 启动服务器
    this.server = net.createServer(this.handleConnection.bind(this));
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        console.log(`[Engine] Started on port ${this.port}`);
        this.logAudit('ENGINE_START', { port: this.port });
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }

  handleConnection(socket) {
    let buffer = '';
    
    socket.on('data', (data) => {
      buffer += data.toString();
      
      let lines = buffer.split('\n');
      buffer = lines.pop();
      
      lines.forEach(line => {
        if (line.trim()) {
          this.handleCommand(line.trim(), socket);
        }
      });
    });
  }

  handleCommand(commandLine, socket) {
    try {
      const parts = commandLine.split(' ');
      const command = parts[0];
      const params = this.parseParams(parts.slice(1));
      
      let result;
      
      switch (command) {
        case 'HEALTH_CHECK':
          result = this.healthCheck();
          break;
        case 'GET_STATE':
          result = this.getState();
          break;
        case 'SAVE_CHECKPOINT':
          result = this.saveCheckpoint(params);
          break;
        case 'RECORD_TOOL_CALL':
          result = this.recordToolCall(params);
          break;
        case 'DEFINE_CONSTRAINTS':
          result = this.defineConstraints(params);
          break;
        case 'VALIDATE_PRECONDITIONS':
          result = this.validatePreconditions(params);
          break;
        case 'REGISTER_ARTIFACT':
          result = this.registerArtifact(params);
          break;
        case 'VALIDATE_ARTIFACT':
          result = this.validateArtifact(params);
          break;
        case 'UPDATE_STATE':
          result = this.updateState(params);
          break;
        case 'TRIGGER_ROLLBACK':
          result = this.triggerRollback(params);
          break;
        case 'GET_AUDIT_LOG':
          result = this.getAuditLog(params);
          break;
        default:
          result = { success: false, error: 'UNKNOWN_COMMAND' };
      }
      
      socket.write(JSON.stringify(result) + '\n');
    } catch (error) {
      socket.write(JSON.stringify({ success: false, error: error.message }) + '\n');
    }
  }

  parseParams(args) {
    const params = {};
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--') && args[i + 1]) {
        params[args[i].substring(2)] = args[i + 1];
      }
    }
    return params;
  }

  healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        uptime: (Date.now() - this.startTime) / 1000,
        checkpointCount: this.context.checkpoints.length,
        artifactCount: this.context.artifacts.length,
        executionHistoryCount: this.context.executionHistory.length
      }
    };
  }

  getState() {
    return {
      success: true,
      data: {
        context: this.context,
        uptime: (Date.now() - this.startTime) / 1000
      }
    };
  }

  saveCheckpoint(params) {
    const checkpoint = {
      id: `checkpoint-${Date.now()}`,
      timestamp: new Date().toISOString(),
      phase: this.context.currentPhase,
      stage: this.context.currentStage,
      state: JSON.parse(JSON.stringify(this.context))
    };
    
    this.context.checkpoints.push(checkpoint);
    this.persistState();
    this.logAudit('CHECKPOINT_SAVE', { checkpointId: checkpoint.id });
    
    return { success: true, data: { checkpointId: checkpoint.id } };
  }

  recordToolCall(params) {
    const record = {
      id: `tool-${Date.now()}`,
      timestamp: new Date().toISOString(),
      toolName: params.toolName,
      params: JSON.parse(params.params || '{}'),
      result: params.result,
      caller: params.caller
    };
    
    this.context.executionHistory.push(record);
    this.persistState();
    this.logAudit('TOOL_CALL', { toolName: params.toolName, caller: params.caller });
    
    return { success: true, data: { recordId: record.id } };
  }

  defineConstraints(params) {
    const stageId = params.stageId;
    let constraints = params.constraints;
    
    if (typeof constraints === 'string') {
      try {
        constraints = JSON.parse(constraints);
      } catch (e) {
        return { success: false, error: 'INVALID_CONSTRAINTS' };
      }
    }
    
    this.context.preconditions[stageId] = {
      stageId,
      constraints,
      definedAt: new Date().toISOString()
    };
    
    this.persistState();
    this.logAudit('CONSTRAINT_DEFINE', { stageId, constraintCount: constraints.length });
    
    return { success: true };
  }

  validatePreconditions(params) {
    const stageId = params.stageId;
    const preconditions = this.context.preconditions[stageId];
    
    if (!preconditions) {
      return { success: true, data: { passed: true, reason: 'no_preconditions_defined' } };
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
            actual: toolCalls.length
          };
        
        case 'FILE_EXISTS':
          const filePath = path.join(this.projectPath, constraint.params.path);
          const exists = fs.existsSync(filePath);
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: exists,
            path: constraint.params.path
          };
        
        case 'DIRECTORY_NOT_EMPTY':
          const dirPath = path.join(this.projectPath, constraint.params.path);
          let fileCount = 0;
          let dirExists = false;
          try {
            if (fs.existsSync(dirPath)) {
              dirExists = true;
              fileCount = fs.readdirSync(dirPath).length;
            }
          } catch (e) {}
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: dirExists && fileCount > 0,
            path: constraint.params.path,
            fileCount,
            reason: !dirExists ? 'directory_not_found' : (fileCount === 0 ? 'directory_empty' : null)
          };
        
        case 'ARTIFACT_VALIDATED':
          const artifact = this.context.artifacts.find(
            a => a.path === constraint.params.path && a.validated
          );
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: !!artifact,
            path: constraint.params.path
          };
        
        default:
          return {
            constraintId: constraint.id,
            type: constraint.type,
            passed: false,
            error: 'unknown_constraint_type'
          };
      }
    });
    
    const passed = results.every(r => r.passed);
    
    this.logAudit('PRECONDITION_VALIDATE', { stageId, passed, results });
    
    return {
      success: true,
      data: { passed, results }
    };
  }

  registerArtifact(params) {
    const artifactPath = params.path;
    const fullPath = path.join(this.projectPath, artifactPath);
    
    let checksum = null;
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        checksum = crypto.createHash('sha256').update(content).digest('hex');
      }
    } catch (e) {}
    
    const artifact = {
      id: `artifact-${Date.now()}`,
      path: artifactPath,
      type: params.type,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      checksum,
      validated: false
    };
    
    this.context.artifacts.push(artifact);
    this.persistState();
    this.logAudit('ARTIFACT_REGISTER', { path: artifactPath, type: params.type });
    
    return { success: true, data: { artifactId: artifact.id, checksum } };
  }

  validateArtifact(params) {
    const artifactPath = params.path;
    const artifact = this.context.artifacts.find(a => a.path === artifactPath);
    
    if (!artifact) {
      return { success: false, error: 'ARTIFACT_NOT_FOUND' };
    }
    
    const fullPath = path.join(this.projectPath, artifactPath);
    
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'FILE_NOT_FOUND' };
    }
    
    try {
      const content = fs.readFileSync(fullPath);
      const currentChecksum = crypto.createHash('sha256').update(content).digest('hex');
      
      if (artifact.checksum && artifact.checksum !== currentChecksum) {
        return {
          success: false,
          error: 'CHECKSUM_MISMATCH',
          data: { expected: artifact.checksum, actual: currentChecksum }
        };
      }
      
      artifact.validated = true;
      artifact.validatedAt = new Date().toISOString();
      this.persistState();
      this.logAudit('ARTIFACT_VALIDATE', { path: artifactPath, checksum: currentChecksum });
      
      return { success: true, data: { checksum: currentChecksum } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateState(params) {
    if (params.currentPhase) {
      this.context.currentPhase = params.currentPhase;
    }
    if (params.currentStage) {
      this.context.currentStage = params.currentStage;
    }
    
    this.persistState();
    this.logAudit('STATE_UPDATE', { phase: params.currentPhase, stage: params.currentStage });
    
    return { success: true };
  }

  triggerRollback(params) {
    const targetCheckpointId = params.targetCheckpoint;
    const reason = params.reason;
    
    const checkpoint = this.context.checkpoints.find(c => c.id === targetCheckpointId);
    
    if (!checkpoint) {
      return { success: false, error: 'CHECKPOINT_NOT_FOUND' };
    }
    
    // 创建备份
    const backupId = `rollback-backup-${Date.now()}`;
    const backupPath = path.join(this.enginePath, `${backupId}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(this.context, null, 2));
    
    // 恢复状态
    this.context = JSON.parse(JSON.stringify(checkpoint.state));
    this.context.checkpoints = this.context.checkpoints.filter(c => c.id !== targetCheckpointId);
    
    this.persistState();
    this.logAudit('ROLLBACK_TRIGGER', { targetCheckpoint: targetCheckpointId, reason, backupId });
    
    return {
      success: true,
      data: {
        rolledBackTo: targetCheckpointId,
        backupId,
        currentPhase: this.context.currentPhase,
        currentStage: this.context.currentStage
      }
    };
  }

  getAuditLog(params) {
    const limit = parseInt(params.limit) || 100;
    const offset = parseInt(params.offset) || 0;
    
    return {
      success: true,
      data: {
        logs: this.context.auditLog.slice(offset, offset + limit),
        total: this.context.auditLog.length
      }
    };
  }

  persistState() {
    const tempFile = `${this.stateFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.context, null, 2));
    fs.renameSync(tempFile, this.stateFile);
  }

  loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        this.context = JSON.parse(data);
      } catch (e) {
        console.error('[Engine] Failed to load state:', e.message);
      }
    }
  }

  logAudit(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    this.context.auditLog.push(logEntry);
    
    // 追加到审计日志文件
    fs.appendFileSync(this.auditLogFile, JSON.stringify(logEntry) + '\n');
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    
    // 清理文件
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
      if (fs.existsSync(this.portFile)) {
        fs.unlinkSync(this.portFile);
      }
    } catch (e) {}
    
    this.logAudit('ENGINE_STOP', {});
  }
}

// 主入口
const projectId = process.argv[2];
if (!projectId) {
  console.error('Usage: node engine-core.js <project-id>');
  process.exit(1);
}

const engine = new FullstackGameEngine(projectId);

process.on('SIGINT', () => {
  console.log('\n[Engine] Shutting down...');
  engine.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  engine.stop();
  process.exit(0);
});

engine.start().catch(err => {
  console.error('[Engine] Failed to start:', err.message);
  process.exit(1);
});
