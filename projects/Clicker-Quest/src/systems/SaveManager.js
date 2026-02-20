/**
 * SaveManager - 存档管理系统
 * 负责数据持久化、存档读写、数据验证、自动存档
 * 
 * @module SaveManager
 * @author LP -> CP-2
 * @version 1.1.0
 */

class SaveManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // 存档配置
        this.config = {
            storageKey: 'clicker_quest_save',
            autoSaveInterval: 30000,      // 自动存档间隔(ms) - 30秒
            maxSaveSize: 5 * 1024 * 1024, // 最大存档大小(5MB)
            backupEnabled: true,          // 是否启用备份
            maxBackups: 3,                // 最大备份数量
            compressionEnabled: false     // 是否启用压缩（暂未实现）
        };
        
        // 存档状态
        this.saveState = {
            lastSaveTime: 0,
            autoSaveTimer: null,
            isDirty: false,               // 数据是否有未保存的更改
            saveCount: 0,                 // 本次会话保存次数
            lastSaveSize: 0,              // 上次保存大小
            errors: []                    // 错误记录
        };
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化存档系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        
        // 监听游戏状态变化，标记为脏数据
        this.gameState.on('goldChanged', () => this.markDirty());
        this.gameState.on('upgradeChanged', () => this.markDirty());
        this.gameState.on('achievementUnlocked', () => this.markDirty());
        this.gameState.on('inventoryChanged', () => this.markDirty());
        
        console.log('[SaveManager] 初始化完成');
    }

    /**
     * 标记数据为脏（需要保存）
     */
    markDirty() {
        this.saveState.isDirty = true;
    }

    /**
     * 启动自动存档
     */
    startAutoSave() {
        if (this.saveState.autoSaveTimer) {
            console.warn('[SaveManager] 自动存档已在运行');
            return;
        }
        
        this.saveState.autoSaveTimer = setInterval(() => {
            if (this.gameState.playerData.settings.autoSaveEnabled && this.saveState.isDirty) {
                this.saveGame('auto');
            }
        }, this.config.autoSaveInterval);
        
        console.log(`[SaveManager] 自动存档已启动，间隔: ${this.config.autoSaveInterval}ms`);
    }

    /**
     * 停止自动存档
     */
    stopAutoSave() {
        if (this.saveState.autoSaveTimer) {
            clearInterval(this.saveState.autoSaveTimer);
            this.saveState.autoSaveTimer = null;
            console.log('[SaveManager] 自动存档已停止');
        }
    }

    /**
     * 保存游戏
     * @param {string} reason - 保存原因 (auto/manual/exit)
     * @returns {Object} 保存结果
     */
    saveGame(reason = 'manual') {
        const startTime = performance.now();
        
        try {
            // 获取玩家数据
            const saveData = this.gameState.getPlayerData();
            
            // 添加元数据
            saveData.lastSaveTime = Date.now();
            saveData.exitTime = Date.now();
            saveData.saveReason = reason;
            
            // 序列化数据
            const saveString = JSON.stringify(saveData);
            const saveSize = new Blob([saveString]).size;
            
            // 检查存档大小
            if (saveSize > this.config.maxSaveSize) {
                const error = `存档大小超过限制: ${this.formatSize(saveSize)} > ${this.formatSize(this.config.maxSaveSize)}`;
                console.error('[SaveManager]', error);
                this.recordError(error);
                return { success: false, reason: 'size_exceeded', size: saveSize };
            }
            
            // 创建备份（如果启用）
            if (this.config.backupEnabled) {
                this.createBackup();
            }
            
            // 保存到localStorage
            localStorage.setItem(this.config.storageKey, saveString);
            
            // 更新状态
            this.saveState.lastSaveTime = Date.now();
            this.saveState.lastSaveSize = saveSize;
            this.saveState.isDirty = false;
            this.saveState.saveCount++;
            
            const duration = performance.now() - startTime;
            
            // 触发事件
            this.emit('saveComplete', {
                reason,
                size: saveSize,
                duration,
                saveCount: this.saveState.saveCount
            });
            
            console.log(`[SaveManager] 保存成功 (${reason}) - 大小: ${this.formatSize(saveSize)}, 耗时: ${duration.toFixed(2)}ms`);
            
            return { 
                success: true, 
                size: saveSize, 
                duration,
                saveCount: this.saveState.saveCount 
            };
            
        } catch (error) {
            const errorMsg = `保存游戏失败: ${error.message}`;
            console.error('[SaveManager]', errorMsg, error);
            this.recordError(errorMsg);
            
            return { success: false, reason: 'error', error: error.message };
        }
    }

    /**
     * 加载游戏
     * @returns {Object|null} 玩家数据或null
     */
    loadGame() {
        const startTime = performance.now();
        
        try {
            const saveString = localStorage.getItem(this.config.storageKey);
            
            // 无存档
            if (!saveString) {
                console.log('[SaveManager] 无存档数据');
                return null;
            }
            
            // 解析数据
            let saveData;
            try {
                saveData = JSON.parse(saveString);
            } catch (parseError) {
                console.error('[SaveManager] 存档数据解析失败，尝试恢复备份');
                return this.recoverFromBackup();
            }
            
            // 验证存档数据
            const validation = this.validateSaveData(saveData);
            if (!validation.valid) {
                console.error('[SaveManager] 存档数据验证失败:', validation.errors);
                this.recordError(`存档验证失败: ${validation.errors.join(', ')}`);
                
                // 尝试恢复备份
                return this.recoverFromBackup();
            }
            
            const duration = performance.now() - startTime;
            const saveSize = new Blob([saveString]).size;
            
            // 触发事件
            this.emit('loadComplete', {
                size: saveSize,
                duration,
                version: saveData.saveVersion
            });
            
            console.log(`[SaveManager] 加载成功 - 大小: ${this.formatSize(saveSize)}, 耗时: ${duration.toFixed(2)}ms`);
            
            return saveData;
            
        } catch (error) {
            console.error('[SaveManager] 加载游戏失败:', error);
            this.recordError(`加载失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 验证存档数据
     * @param {Object} data - 存档数据
     * @returns {Object} 验证结果
     */
    validateSaveData(data) {
        const errors = [];
        
        // 基本检查
        if (!data || typeof data !== 'object') {
            errors.push('数据格式无效');
            return { valid: false, errors };
        }
        
        // 检查必要字段
        const requiredFields = ['currentGold', 'totalClicks', 'upgrades'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                errors.push(`缺少必要字段: ${field}`);
            }
        }
        
        // 验证金币数据
        if (typeof data.currentGold !== 'number' || isNaN(data.currentGold) || data.currentGold < 0) {
            errors.push('金币数据无效');
        }
        
        // 验证升级数据
        if (data.upgrades && typeof data.upgrades === 'object') {
            for (const [id, upgrade] of Object.entries(data.upgrades)) {
                if (!upgrade || typeof upgrade.level !== 'number' || upgrade.level < 0) {
                    errors.push(`升级数据无效: ${id}`);
                }
            }
        } else {
            errors.push('升级数据结构无效');
        }
        
        // 验证成就数据
        if (data.achievements && typeof data.achievements !== 'object') {
            errors.push('成就数据结构无效');
        }
        
        // 验证库存数据
        if (data.inventory && typeof data.inventory !== 'object') {
            errors.push('库存数据结构无效');
        }
        
        // 验证BUFF数据
        if (data.activeBuffs && !Array.isArray(data.activeBuffs)) {
            errors.push('BUFF数据结构无效');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 创建备份
     */
    createBackup() {
        try {
            const currentSave = localStorage.getItem(this.config.storageKey);
            if (!currentSave) return;
            
            // 获取现有备份列表
            const backups = this.getBackupList();
            
            // 如果备份数量达到上限，删除最旧的
            while (backups.length >= this.config.maxBackups) {
                const oldest = backups.shift();
                localStorage.removeItem(oldest.key);
            }
            
            // 创建新备份
            const backupKey = `${this.config.storageKey}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, currentSave);
            
            console.log(`[SaveManager] 备份已创建: ${backupKey}`);
            
        } catch (error) {
            console.error('[SaveManager] 创建备份失败:', error);
        }
    }

    /**
     * 获取备份列表
     * @returns {Array} 备份列表
     */
    getBackupList() {
        const backups = [];
        const prefix = `${this.config.storageKey}_backup_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const timestamp = parseInt(key.replace(prefix, ''), 10);
                if (!isNaN(timestamp)) {
                    backups.push({ key, timestamp });
                }
            }
        }
        
        // 按时间排序（旧的在前）
        backups.sort((a, b) => a.timestamp - b.timestamp);
        return backups;
    }

    /**
     * 从备份恢复
     * @returns {Object|null} 恢复的数据
     */
    recoverFromBackup() {
        const backups = this.getBackupList();
        
        // 从最新的备份开始尝试恢复
        for (let i = backups.length - 1; i >= 0; i--) {
            const backup = backups[i];
            try {
                const backupData = localStorage.getItem(backup.key);
                if (backupData) {
                    const data = JSON.parse(backupData);
                    const validation = this.validateSaveData(data);
                    
                    if (validation.valid) {
                        console.log(`[SaveManager] 从备份恢复成功: ${backup.key}`);
                        return data;
                    }
                }
            } catch (error) {
                console.error(`[SaveManager] 备份恢复失败: ${backup.key}`, error);
            }
        }
        
        console.error('[SaveManager] 所有备份恢复失败');
        return null;
    }

    /**
     * 删除存档
     * @returns {Object} 删除结果
     */
    deleteSave() {
        try {
            // 删除主存档
            localStorage.removeItem(this.config.storageKey);
            
            // 删除所有备份
            const backups = this.getBackupList();
            backups.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
            
            // 重置状态
            this.saveState.lastSaveTime = 0;
            this.saveState.isDirty = false;
            this.saveState.saveCount = 0;
            this.saveState.lastSaveSize = 0;
            
            console.log('[SaveManager] 存档已删除');
            
            this.emit('saveDeleted');
            
            return { success: true };
            
        } catch (error) {
            console.error('[SaveManager] 删除存档失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导出存档为Base64字符串
     * @returns {Object} 导出结果
     */
    exportSave() {
        try {
            const saveData = this.gameState.getPlayerData();
            saveData.exportTime = Date.now();
            
            const saveString = JSON.stringify(saveData);
            
            // 使用UTF-8编码后转Base64
            const base64 = btoa(unescape(encodeURIComponent(saveString)));
            
            console.log(`[SaveManager] 存档已导出，大小: ${this.formatSize(base64.length)}`);
            
            return { 
                success: true, 
                data: base64,
                size: base64.length,
                exportTime: saveData.exportTime
            };
            
        } catch (error) {
            console.error('[SaveManager] 导出存档失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导入存档
     * @param {string} base64String - Base64编码的存档字符串
     * @returns {Object} 导入结果
     */
    importSave(base64String) {
        try {
            // 解码Base64
            const saveString = decodeURIComponent(escape(atob(base64String)));
            const saveData = JSON.parse(saveString);
            
            // 验证数据
            const validation = this.validateSaveData(saveData);
            if (!validation.valid) {
                return { 
                    success: false, 
                    reason: 'validation_failed',
                    errors: validation.errors 
                };
            }
            
            // 加载数据到游戏状态
            const loadResult = this.gameState.loadPlayerData(saveData);
            if (!loadResult.success) {
                return { 
                    success: false, 
                    reason: 'load_failed',
                    errors: loadResult.errors 
                };
            }
            
            // 保存导入的数据
            this.saveGame('import');
            
            console.log('[SaveManager] 存档已导入');
            
            return { success: true };
            
        } catch (error) {
            console.error('[SaveManager] 导入存档失败:', error);
            return { 
                success: false, 
                reason: 'decode_error',
                error: error.message 
            };
        }
    }

    /**
     * 检查是否有存档
     * @returns {boolean} 是否有存档
     */
    hasSave() {
        return localStorage.getItem(this.config.storageKey) !== null;
    }

    /**
     * 获取存档信息
     * @returns {Object|null} 存档信息
     */
    getSaveInfo() {
        try {
            const saveString = localStorage.getItem(this.config.storageKey);
            if (!saveString) return null;
            
            const saveData = JSON.parse(saveString);
            const size = new Blob([saveString]).size;
            
            return {
                exists: true,
                size: size,
                lastSaveTime: saveData.lastSaveTime || 0,
                version: saveData.saveVersion || 0,
                totalClicks: saveData.totalClicks || 0,
                currentGold: saveData.currentGold || 0,
                playTime: saveData.playTime || 0,
                hasBackup: this.getBackupList().length > 0
            };
            
        } catch (error) {
            return null;
        }
    }

    /**
     * 记录错误
     * @param {string} error - 错误信息
     */
    recordError(error) {
        this.saveState.errors.push({
            message: error,
            timestamp: Date.now()
        });
        
        // 限制错误记录数量
        if (this.saveState.errors.length > 20) {
            this.saveState.errors.shift();
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化的大小字符串
     */
    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {Object} data - 数据
     */
    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[SaveManager] 事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            config: this.config,
            saveState: {
                lastSaveTime: this.saveState.lastSaveTime,
                isDirty: this.saveState.isDirty,
                saveCount: this.saveState.saveCount,
                lastSaveSize: this.formatSize(this.saveState.lastSaveSize),
                autoSaveRunning: this.saveState.autoSaveTimer !== null
            },
            saveInfo: this.getSaveInfo(),
            backupCount: this.getBackupList().length,
            errorCount: this.saveState.errors.length
        };
    }
}

// 导出模块
window.SaveManager = SaveManager;
