#!/usr/bin/env node
/**
 * 全栈游戏开发引擎 - CLI工具
 * 用于与引擎核心进程通信
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

const TIMEOUT = 30000; // 30秒超时

function sendCommand(projectId, command, params) {
  return new Promise((resolve, reject) => {
    const portPath = path.join(process.cwd(), 'projects', projectId, '.engine', 'engine.port');
    
    if (!require('fs').existsSync(portPath)) {
      reject(new Error(`引擎未运行: ${portPath} 不存在`));
      return;
    }
    
    const port = parseInt(require('fs').readFileSync(portPath, 'utf8'));
    const host = '127.0.0.1';

    const client = net.createConnection(port, host, () => {
      const request = {
        command: command,
        params: params || {}
      };
      client.write(JSON.stringify(request) + '\n');
    });

    let buffer = '';
    let timeoutId;

    client.on('data', (data) => {
      buffer += data.toString();
      const newlineIndex = buffer.indexOf('\n');
      
      if (newlineIndex !== -1) {
        clearTimeout(timeoutId);
        const responseStr = buffer.substring(0, newlineIndex);
        
        try {
          const response = JSON.parse(responseStr);
          client.end();
          resolve(response);
        } catch (err) {
          client.end();
          reject(new Error(`解析响应失败: ${err.message}`));
        }
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    // 超时处理
    timeoutId = setTimeout(() => {
      client.end();
      reject(new Error('请求超时'));
    }, TIMEOUT);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('用法: node engine-cli.js <project-id> <command> [params...]');
    console.error('');
    console.error('可用命令:');
    console.error('  GET_STATE              - 获取当前状态');
    console.error('  GET_CONTEXT            - 获取当前上下文');
    console.error('  VALIDATE_PRECONDITIONS - 验证前置约束');
    console.error('  RECORD_TOOL_CALL       - 记录工具调用');
    console.error('  REGISTER_ARTIFACT      - 注册产出物');
    console.error('  VALIDATE_ARTIFACT      - 验证产出物');
    console.error('  DEFINE_CONSTRAINTS     - 定义下一阶段约束');
    console.error('  SAVE_CHECKPOINT        - 保存检查点');
    console.error('  TRIGGER_ROLLBACK       - 触发回滚');
    console.error('  GET_AUDIT_LOG          - 获取审计日志');
    console.error('  UPDATE_STATE           - 更新状态');
    console.error('  HEALTH_CHECK           - 健康检查');
    console.error('');
    console.error('示例:');
    console.error('  node engine-cli.js my-game GET_STATE');
    console.error('  node engine-cli.js my-game VALIDATE_PRECONDITIONS --stageId "Stage-1-1"');
    process.exit(1);
  }

  const projectId = args[0];
  const command = args[1];
  
  // 解析参数
  const params = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        try {
          // 尝试解析为JSON
          params[key] = JSON.parse(nextArg);
        } catch {
          // 作为字符串
          params[key] = nextArg;
        }
        i++; // 跳过下一个参数
      } else {
        params[key] = true;
      }
    }
  }

  try {
    const response = await sendCommand(projectId, command, params);
    
    // 格式化输出
    console.log(JSON.stringify(response, null, 2));
    
    // 根据成功状态设置退出码
    process.exit(response.success ? 0 : 1);
    
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: 'CONNECTION_FAILED',
      message: err.message
    }, null, 2));
    process.exit(1);
  }
}

main();
