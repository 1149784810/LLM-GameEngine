const net = require('net');
const fs = require('fs');
const path = require('path');

function getPort(projectId) {
  // 使用相对路径 - 基于当前工作目录
  const cwd = process.cwd();
  const portFile = path.join(cwd, 'projects', projectId, '.engine', 'engine.port');
  
  if (fs.existsSync(portFile)) {
    return parseInt(fs.readFileSync(portFile, 'utf8'));
  }
  
  // 如果文件不存在，使用与引擎相同的算法计算端口
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(projectId).digest('hex');
  const portNum = parseInt(hash.substring(0, 4), 16);
  return 10000 + (portNum % 55000);
}

function sendCommand(projectId, command, params = {}) {
  const port = getPort(projectId);
  
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = '';
    
    client.connect(port, '127.0.0.1', () => {
      let cmdLine = command;
      Object.entries(params).forEach(([key, value]) => {
        cmdLine += ` --${key} "${value}"`;
      });
      client.write(cmdLine + '\n');
    });
    
    client.on('data', (data) => {
      buffer += data.toString();
      
      const lines = buffer.split('\n');
      buffer = lines.pop();
      
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const result = JSON.parse(line.trim());
            client.destroy();
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid response: ' + line));
          }
        }
      });
    });
    
    client.on('error', (err) => {
      reject(err);
    });
    
    client.on('close', () => {
      if (buffer.trim()) {
        try {
          const result = JSON.parse(buffer.trim());
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid response: ' + buffer));
        }
      }
    });
    
    // 超时处理
    setTimeout(() => {
      client.destroy();
      reject(new Error('Command timeout'));
    }, 30000);
  });
}

async function main() {
  const projectId = process.argv[2];
  const command = process.argv[3];
  
  if (!projectId || !command) {
    console.error('Usage: node engine-cli.js <project-id> <command> [--param value ...]');
    console.error('');
    console.error('Commands:');
    console.error('  HEALTH_CHECK');
    console.error('  GET_STATE');
    console.error('  SAVE_CHECKPOINT');
    console.error('  RECORD_TOOL_CALL --toolName <name> --params <json> --result <result> --caller <caller>');
    console.error('  DEFINE_CONSTRAINTS --stageId <id> --constraints <json>');
    console.error('  VALIDATE_PRECONDITIONS --stageId <id>');
    console.error('  REGISTER_ARTIFACT --path <path> --type <type> --createdBy <stage>');
    console.error('  VALIDATE_ARTIFACT --path <path>');
    console.error('  UPDATE_STATE --currentPhase <phase> --currentStage <stage>');
    console.error('  TRIGGER_ROLLBACK --targetCheckpoint <id> --reason <reason>');
    console.error('  GET_AUDIT_LOG --limit <n> --offset <n>');
    process.exit(1);
  }
  
  const params = {};
  for (let i = 4; i < process.argv.length; i += 2) {
    if (process.argv[i].startsWith('--') && process.argv[i + 1]) {
      params[process.argv[i].substring(2)] = process.argv[i + 1];
    }
  }
  
  try {
    const result = await sendCommand(projectId, command, params);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

main();
