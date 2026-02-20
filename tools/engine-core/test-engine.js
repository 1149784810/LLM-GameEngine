#!/usr/bin/env node
/**
 * 引擎核心测试脚本
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'test-project';

function sendCommand(command, params) {
  return new Promise((resolve, reject) => {
    const portPath = path.join(process.cwd(), 'projects', PROJECT_ID, '.engine', 'engine.port');
    
    if (!fs.existsSync(portPath)) {
      reject(new Error(`引擎未运行`));
      return;
    }
    
    const port = parseInt(fs.readFileSync(portPath, 'utf8'));
    const host = '127.0.0.1';

    const client = net.createConnection(port, host, () => {
      const request = { command, params };
      client.write(JSON.stringify(request) + '\n');
    });

    let buffer = '';

    client.on('data', (data) => {
      buffer += data.toString();
      const newlineIndex = buffer.indexOf('\n');
      
      if (newlineIndex !== -1) {
        const responseStr = buffer.substring(0, newlineIndex);
        try {
          const response = JSON.parse(responseStr);
          client.end();
          resolve(response);
        } catch (err) {
          client.end();
          reject(err);
        }
      }
    });

    client.on('error', reject);
    
    setTimeout(() => {
      client.end();
      reject(new Error('超时'));
    }, 5000);
  });
}

async function runTests() {
  console.log('========================================');
  console.log('引擎核心功能测试');
  console.log('========================================\n');

  // 测试1: 健康检查
  console.log('[测试1] 健康检查...');
  const health = await sendCommand('HEALTH_CHECK', {});
  console.log('结果:', health.success ? '通过 ✓' : '失败 ✗');
  if (health.success) {
    console.log('  状态:', health.data.status);
    console.log('  检查点:', health.data.checkpointCount);
    console.log('  产出物:', health.data.artifactCount);
  }
  console.log('');

  // 测试2: 获取状态
  console.log('[测试2] 获取状态...');
  const state = await sendCommand('GET_STATE', {});
  console.log('结果:', state.success ? '通过 ✓' : '失败 ✗');
  if (state.success) {
    console.log('  当前阶段:', state.data.currentPhase);
    console.log('  当前Stage:', state.data.currentStage);
  }
  console.log('');

  // 测试3: 保存检查点
  console.log('[测试3] 保存检查点...');
  const checkpoint = await sendCommand('SAVE_CHECKPOINT', {});
  console.log('结果:', checkpoint.success ? '通过 ✓' : '失败 ✗');
  if (checkpoint.success) {
    console.log('  检查点ID:', checkpoint.data.checkpointId);
  }
  console.log('');

  // 测试4: 记录工具调用
  console.log('[测试4] 记录工具调用...');
  const toolCall = await sendCommand('RECORD_TOOL_CALL', {
    toolName: 'Write',
    params: { file: 'test.md', content: 'hello' },
    result: { success: true }
  });
  console.log('结果:', toolCall.success ? '通过 ✓' : '失败 ✗');
  if (toolCall.success) {
    console.log('  记录ID:', toolCall.data.recordId);
  }
  console.log('');

  // 测试5: 定义约束
  console.log('[测试5] 定义约束...');
  const constraints = [
    {
      id: 'TEST-001',
      type: 'TOOL_CALLED',
      params: { toolName: 'Write', minCount: 1 }
    }
  ];
  const defineConstraints = await sendCommand('DEFINE_CONSTRAINTS', {
    currentStage: 'Stage-0-0',
    nextStage: 'Stage-1-1',
    constraints: constraints
  });
  console.log('结果:', defineConstraints.success ? '通过 ✓' : '失败 ✗');
  if (defineConstraints.success) {
    console.log('  约束ID:', defineConstraints.data.constraintsId);
  }
  console.log('');

  // 测试6: 前置验证（应该通过）
  console.log('[测试6] 前置验证（应该通过）...');
  const validation = await sendCommand('VALIDATE_PRECONDITIONS', {
    stageId: 'Stage-1-1'
  });
  console.log('结果:', validation.success ? '通过 ✓' : '失败 ✗');
  if (validation.success) {
    console.log('  验证通过:', validation.data.passed);
    console.log('  约束结果:', validation.data.results.length);
  }
  console.log('');

  // 测试7: 注册产出物
  console.log('[测试7] 注册产出物...');
  // 先创建一个测试文件
  const testFile = path.join(process.cwd(), 'projects', PROJECT_ID, 'test-artifact.txt');
  fs.writeFileSync(testFile, 'test content');
  
  const registerArtifact = await sendCommand('REGISTER_ARTIFACT', {
    path: testFile,
    stageId: 'Stage-0-0'
  });
  console.log('结果:', registerArtifact.success ? '通过 ✓' : '失败 ✗');
  if (registerArtifact.success) {
    console.log('  校验和:', registerArtifact.data.checksum.substring(0, 16) + '...');
  }
  console.log('');

  // 测试8: 验证产出物
  console.log('[测试8] 验证产出物...');
  const validateArtifact = await sendCommand('VALIDATE_ARTIFACT', {
    path: testFile
  });
  console.log('结果:', validateArtifact.success ? '通过 ✓' : '失败 ✗');
  if (validateArtifact.success) {
    console.log('  有效:', validateArtifact.data.valid);
  }
  console.log('');

  // 测试9: 更新状态
  console.log('[测试9] 更新状态...');
  const updateState = await sendCommand('UPDATE_STATE', {
    currentPhase: 'Phase-1',
    currentStage: 'Stage-1-1'
  });
  console.log('结果:', updateState.success ? '通过 ✓' : '失败 ✗');
  if (updateState.success) {
    console.log('  新阶段:', updateState.data.currentPhase);
    console.log('  新Stage:', updateState.data.currentStage);
  }
  console.log('');

  // 测试10: 获取审计日志
  console.log('[测试10] 获取审计日志...');
  const auditLog = await sendCommand('GET_AUDIT_LOG', {});
  console.log('结果:', auditLog.success ? '通过 ✓' : '失败 ✗');
  if (auditLog.success) {
    console.log('  日志条目:', auditLog.data.length);
  }
  console.log('');

  console.log('========================================');
  console.log('测试完成');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('测试失败:', err.message);
  process.exit(1);
});
