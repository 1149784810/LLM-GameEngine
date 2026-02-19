/**
 * Clicker Quest - 存档管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理游戏数据的持久化、加密、验证和备份恢复
 */

class SaveManager {
    constructor(eventBus, gameData) {
        this.eventBus = eventBus;
        this.gameData = gameData;
        
        // 存档配置
        this.storageKey = GameConfig.save.storageKey;
        this.backupCount = GameConfig.save.backupCount;
        this.autoSaveInterval = GameConfig.save.autoSaveInterval;
        this.encryptionKey = GameConfig.save.encryptionKey;
        
        // 存储辅助
        this.storage = new StorageHelper();
        
        // 存档状态
        this.lastSaveTime = 0;
        this.autoSaveTimer = null;
        this.isSaving = false;
        this.saveVersion = '1.0.0';
        
        // 存档键名
        this.saveKeys = {
            main: 'save_main',
            backup: 'save_backup_'
        };
        
        // 初始化
        this._init();
    }

    /**
     * 初始化存档管理器
     * @private
     */
    _init() {
        // 启动自动存档
        this.startAutoSave();
        
        // 绑定页面关闭事件
        this._bindPageEvents();
        
        // 绑定事件监听
        this._bindEventListeners();
    }

    /**
     * 绑定页面事件
     * @private
     */
    _bindPageEvents() {
        // 页面关闭前保存
        window.addEventListener('beforeunload', (e) => {
            if (this.isSaving) {
                // 如果正在保存，等待完成
                this.save(false);
            }
        });

        // 页面可见性变化时保存
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.save(true);
            }
        });
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEventListeners() {
        if (this.eventBus) {
            // 监听关键操作事件，触发保存
            this.eventBus.on(GameEvents.ITEM_PURCHASED, () => {
                this.save(true);
            });
            
            this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, () => {
                this.save(true);
            });
        }
    }

    /**
     * 保存游戏数据
     * @param {boolean} isAutoSave - 是否自动存档
     * @returns {Promise<Object>} 保存结果
     */
    async save(isAutoSave = false) {
        // 检查是否正在保存
        if (this.isSaving) {
            return {
                success: false,
                saveTime: 0,
                checksum: '',
                error: SaveError.SAVE_FAILED
            };
        }

        this.isSaving = true;
        const startTime = performance.now();

        try {
            // 1. 收集所有数据
            const saveData = this._collectSaveData();
            
            // 2. 序列化数据
            const serialized = this._serialize(saveData);
            
            // 3. 计算校验和
            const checksum = await this._calculateChecksum(serialized);
            
            // 4. 构建完整存档
            const fullSave = {
                version: this.saveVersion,
                checksum: checksum,
                timestamp: Date.now(),
                isAutoSave: isAutoSave,
                data: saveData
            };
            
            // 5. 加密数据
            const encrypted = this._encrypt(JSON.stringify(fullSave));
            
            // 6. 保存到localStorage
            const saveResult = this.storage.set(this.saveKeys.main, encrypted);
            
            if (!saveResult) {
                throw new Error('存储失败');
            }
            
            // 7. 创建备份
            this._createBackup(encrypted);
            
            // 8. 更新状态
            this.lastSaveTime = Date.now();
            
            const saveTime = performance.now() - startTime;
            
            // 9. 触发保存事件
            if (this.eventBus) {
                this.eventBus.emit(GameEvents.SAVE_COMPLETED, {
                    isAutoSave: isAutoSave,
                    saveTime: saveTime,
                    checksum: checksum
                });
            }
            
            return {
                success: true,
                saveTime: saveTime,
                checksum: checksum,
                error: null
            };
            
        } catch (error) {
            console.error('SaveManager: 保存失败', error);
            
            if (this.eventBus) {
                this.eventBus.emit(GameEvents.SAVE_FAILED, {
                    error: error.message
                });
            }
            
            return {
                success: false,
                saveTime: 0,
                checksum: '',
                error: SaveError.SAVE_FAILED
            };
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * 加载游戏数据
     * @returns {Promise<Object>} 加载结果
     */
    async load() {
        const startTime = performance.now();

        try {
            // 1. 从localStorage读取
            const encrypted = this.storage.get(this.saveKeys.main);
            
            if (!encrypted) {
                // 尝试从备份恢复
                return await this._tryRestoreFromBackup();
            }
            
            // 2. 解密数据
            const decrypted = this._decrypt(encrypted);
            const fullSave = this._deserialize(decrypted);
            
            if (!fullSave) {
                throw new Error('数据解析失败');
            }
            
            // 3. 验证校验和
            const dataString = JSON.stringify(fullSave.data);
            const isValid = await this._verifyChecksum(dataString, fullSave.checksum);
            
            if (!isValid) {
                console.warn('SaveManager: 校验和不匹配，尝试从备份恢复');
                return await this._tryRestoreFromBackup();
            }
            
            // 4. 验证版本兼容性
            if (!this._isVersionCompatible(fullSave.version)) {
                console.warn('SaveManager: 存档版本不兼容，尝试迁移');
                fullSave.data = this._migrateData(fullSave);
            }
            
            const loadTime = performance.now() - startTime;
            
            // 5. 触发加载事件
            if (this.eventBus) {
                this.eventBus.emit(GameEvents.LOAD_COMPLETED, {
                    loadTime: loadTime,
                    timestamp: fullSave.timestamp
                });
            }
            
            return {
                success: true,
                data: fullSave.data,
                timestamp: fullSave.timestamp,
                loadTime: loadTime,
                error: null
            };
            
        } catch (error) {
            console.error('SaveManager: 加载失败', error);
            
            if (this.eventBus) {
                this.eventBus.emit(GameEvents.LOAD_FAILED, {
                    error: error.message
                });
            }
            
            // 尝试从备份恢复
            return await this._tryRestoreFromBackup();
        }
    }

    /**
     * 尝试从备份恢复
     * @private
     * @returns {Promise<Object>} 恢复结果
     */
    async _tryRestoreFromBackup() {
        for (let i = 0; i < this.backupCount; i++) {
            const result = await this.restoreFromBackup(i);
            if (result.success) {
                return result;
            }
        }
        
        return {
            success: false,
            data: null,
            loadTime: 0,
            error: SaveError.BACKUP_NOT_FOUND
        };
    }

    /**
     * 检查存档是否存在
     * @returns {boolean} 是否存在存档
     */
    hasSaveData() {
        return this.storage.has(this.saveKeys.main);
    }

    /**
     * 收集存档数据
     * @private
     * @returns {Object} 存档数据
     */
    _collectSaveData() {
        if (this.gameData) {
            return {
                player: this.gameData.player || {},
                currency: this.gameData.currency || {},
                items: this.gameData.items || {},
                achievements: this.gameData.achievements || {},
                settings: this.gameData.settings || {},
                statistics: this.gameData.statistics || {}
            };
        }
        
        return {};
    }

    /**
     * 序列化游戏数据
     * @param {Object} data - 游戏数据
     * @returns {string} 序列化后的字符串
     * @private
     */
    _serialize(data) {
        try {
            return JSON.stringify(data);
        } catch (e) {
            console.error('SaveManager: 序列化失败', e);
            return '';
        }
    }

    /**
     * 反序列化游戏数据
     * @param {string} jsonString - 序列化字符串
     * @returns {Object|null} 游戏数据
     * @private
     */
    _deserialize(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('SaveManager: 反序列化失败', e);
            return null;
        }
    }

    /**
     * 加密数据
     * 使用简单的XOR加密（生产环境应使用Web Crypto API的AES-GCM）
     * @param {string} data - 原始数据
     * @returns {string} 加密后的数据
     * @private
     */
    _encrypt(data) {
        try {
            // 使用Base64 + XOR简单加密
            const key = this.encryptionKey;
            let result = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode ^ keyChar);
            }
            
            // 转换为Base64
            return btoa(unescape(encodeURIComponent(result)));
        } catch (e) {
            console.error('SaveManager: 加密失败', e);
            return data;
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedData - 加密数据
     * @returns {string} 解密后的数据
     * @private
     */
    _decrypt(encryptedData) {
        try {
            // 从Base64解码
            const decoded = decodeURIComponent(escape(atob(encryptedData)));
            const key = this.encryptionKey;
            let result = '';
            
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode ^ keyChar);
            }
            
            return result;
        } catch (e) {
            console.error('SaveManager: 解密失败', e);
            return encryptedData;
        }
    }

    /**
     * 计算校验和（使用Web Crypto API的SHA-256）
     * @param {string} data - 数据字符串
     * @returns {Promise<string>} 校验和
     * @private
     */
    async _calculateChecksum(data) {
        try {
            // 使用Web Crypto API
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(data);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            // 降级方案：使用简单哈希
            return this._simpleHash(data);
        } catch (e) {
            console.warn('SaveManager: SHA-256不可用，使用简单哈希');
            return this._simpleHash(data);
        }
    }

    /**
     * 简单哈希函数（降级方案）
     * @private
     * @param {string} str - 字符串
     * @returns {string} 哈希值
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    /**
     * 验证校验和
     * @param {string} data - 数据字符串
     * @param {string} checksum - 校验和
     * @returns {Promise<boolean>} 是否验证通过
     * @private
     */
    async _verifyChecksum(data, checksum) {
        if (!checksum) return false;
        
        const calculatedChecksum = await this._calculateChecksum(data);
        return calculatedChecksum === checksum;
    }

    /**
     * 创建备份
     * @private
     * @param {string} saveData - 存档数据
     */
    _createBackup(saveData) {
        try {
            // 获取现有备份列表
            const backups = [];
            for (let i = 0; i < this.backupCount; i++) {
                const backupKey = this.saveKeys.backup + i;
                if (this.storage.has(backupKey)) {
                    const timestamp = this.storage.getTimestamp(backupKey);
                    backups.push({ index: i, timestamp: timestamp || 0 });
                }
            }
            
            // 按时间排序
            backups.sort((a, b) => b.timestamp - a.timestamp);
            
            // 移动备份（旧的往后移）
            for (let i = backups.length - 1; i >= 0; i--) {
                const oldKey = this.saveKeys.backup + backups[i].index;
                const newIndex = (backups[i].index + 1) % this.backupCount;
                const newKey = this.saveKeys.backup + newIndex;
                
                const data = this.storage.get(oldKey);
                if (data) {
                    this.storage.set(newKey, data);
                }
            }
            
            // 保存新备份到第一个位置
            this.storage.set(this.saveKeys.backup + '0', saveData);
            
        } catch (e) {
            console.error('SaveManager: 创建备份失败', e);
        }
    }

    /**
     * 从备份恢复
     * @param {number} backupIndex - 备份索引
     * @returns {Promise<Object>} 恢复结果
     */
    async restoreFromBackup(backupIndex = 0) {
        try {
            const backupKey = this.saveKeys.backup + backupIndex;
            const encrypted = this.storage.get(backupKey);
            
            if (!encrypted) {
                return {
                    success: false,
                    data: null,
                    loadTime: 0,
                    error: SaveError.BACKUP_NOT_FOUND
                };
            }
            
            const decrypted = this._decrypt(encrypted);
            const fullSave = this._deserialize(decrypted);
            
            if (!fullSave) {
                return {
                    success: false,
                    data: null,
                    loadTime: 0,
                    error: SaveError.INVALID_DATA
                };
            }
            
            // 验证校验和
            const dataString = JSON.stringify(fullSave.data);
            const isValid = await this._verifyChecksum(dataString, fullSave.checksum);
            
            if (!isValid) {
                return {
                    success: false,
                    data: null,
                    loadTime: 0,
                    error: SaveError.CHECKSUM_MISMATCH
                };
            }
            
            return {
                success: true,
                data: fullSave.data,
                timestamp: fullSave.timestamp,
                loadTime: 0,
                error: null
            };
            
        } catch (e) {
            console.error('SaveManager: 从备份恢复失败', e);
            return {
                success: false,
                data: null,
                loadTime: 0,
                error: SaveError.LOAD_FAILED
            };
        }
    }

    /**
     * 删除存档
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteSave() {
        try {
            // 删除主存档
            this.storage.remove(this.saveKeys.main);
            
            // 删除所有备份
            for (let i = 0; i < this.backupCount; i++) {
                this.storage.remove(this.saveKeys.backup + i);
            }
            
            return true;
        } catch (e) {
            console.error('SaveManager: 删除存档失败', e);
            return false;
        }
    }

    /**
     * 导出存档
     * @returns {string} 导出的存档字符串
     */
    exportSave() {
        try {
            const encrypted = this.storage.get(this.saveKeys.main);
            if (!encrypted) {
                return '';
            }
            
            // 添加导出标识
            const exportData = {
                type: 'clicker_quest_save',
                version: this.saveVersion,
                data: encrypted,
                exportTime: Date.now()
            };
            
            return btoa(JSON.stringify(exportData));
        } catch (e) {
            console.error('SaveManager: 导出存档失败', e);
            return '';
        }
    }

    /**
     * 导入存档
     * @param {string} saveString - 存档字符串
     * @returns {Promise<boolean>} 是否成功
     */
    async importSave(saveString) {
        try {
            const importData = JSON.parse(atob(saveString));
            
            // 验证导入数据
            if (importData.type !== 'clicker_quest_save') {
                throw new Error('无效的存档格式');
            }
            
            // 保存导入的数据
            const saveResult = this.storage.set(this.saveKeys.main, importData.data);
            
            if (!saveResult) {
                throw new Error('保存失败');
            }
            
            // 创建备份
            this._createBackup(importData.data);
            
            return true;
        } catch (e) {
            console.error('SaveManager: 导入存档失败', e);
            return false;
        }
    }

    /**
     * 启动自动存档
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            return;
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.save(true);
        }, this.autoSaveInterval);
    }

    /**
     * 停止自动存档
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 检查版本兼容性
     * @private
     * @param {string} version - 存档版本
     * @returns {boolean} 是否兼容
     */
    _isVersionCompatible(version) {
        if (!version) return false;
        
        const currentParts = this.saveVersion.split('.').map(Number);
        const saveParts = version.split('.').map(Number);
        
        // 主版本号必须相同
        return currentParts[0] === saveParts[0];
    }

    /**
     * 迁移数据（版本升级时使用）
     * @private
     * @param {Object} fullSave - 完整存档
     * @returns {Object} 迁移后的数据
     */
    _migrateData(fullSave) {
        // TODO: 实现版本迁移逻辑
        // 根据版本号进行数据迁移
        console.log('SaveManager: 迁移存档数据', fullSave.version, '->', this.saveVersion);
        return fullSave.data;
    }

    /**
     * 获取存档信息
     * @returns {Object} 存档信息
     */
    getSaveInfo() {
        const mainSave = this.storage.get(this.saveKeys.main);
        const backups = [];
        
        for (let i = 0; i < this.backupCount; i++) {
            const backupKey = this.saveKeys.backup + i;
            if (this.storage.has(backupKey)) {
                backups.push({
                    index: i,
                    timestamp: this.storage.getTimestamp(backupKey)
                });
            }
        }
        
        return {
            hasSave: !!mainSave,
            lastSaveTime: this.lastSaveTime,
            autoSaveInterval: this.autoSaveInterval,
            isAutoSaveActive: this.autoSaveTimer !== null,
            backupCount: backups.length,
            backups: backups,
            storageInfo: this.storage.getStorageInfo()
        };
    }

    /**
     * 销毁存档管理器
     */
    destroy() {
        // 停止自动存档
        this.stopAutoSave();
        
        // 最后保存一次
        this.save(false);
    }
}

// 存档错误类型枚举
const SaveError = {
    STORAGE_FULL: 'STORAGE_FULL',
    SAVE_FAILED: 'SAVE_FAILED',
    LOAD_FAILED: 'LOAD_FAILED',
    INVALID_DATA: 'INVALID_DATA',
    CHECKSUM_MISMATCH: 'CHECKSUM_MISMATCH',
    DECRYPTION_FAILED: 'DECRYPTION_FAILED',
    BACKUP_NOT_FOUND: 'BACKUP_NOT_FOUND'
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveManager, SaveError };
} else {
    window.SaveManager = SaveManager;
    window.SaveError = SaveError;
}
